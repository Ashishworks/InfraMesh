// InfraMesh — in-app distributed systems simulator.
// Models a Redis-like distributed cache, a Kafka/RabbitMQ-like queue,
// metrics, structured logs, and request traces. State lives in-memory
// in the browser; an event bus drives React updates.

type Listener = () => void;

export type LogLevel = "debug" | "info" | "warn" | "error";
export interface LogEntry {
  id: string;
  ts: number;
  level: LogLevel;
  source: string;       // gateway | cache-node-1 | queue | worker-2 | ...
  msg: string;
  reqId?: string;
}

export interface CacheEntry {
  key: string;
  value: string;
  expiresAt?: number;   // epoch ms
  lastUsed: number;
  size: number;
}

export interface CacheNode {
  id: string;           // cache-node-1
  role: "primary" | "replica";
  primaryOf?: string;   // for replicas: the primary id
  alive: boolean;
  cpu: number;          // 0..1
  mem: number;          // bytes used
  memMax: number;
  store: Map<string, CacheEntry>;
  hits: number;
  misses: number;
  evictions: number;
  lru: string[];        // recency list, head = most recent
  lastHeartbeat: number;
}

export interface QueueJob {
  id: string;
  queue: string;
  payload: string;
  priority: number;     // higher = sooner
  attempts: number;
  maxAttempts: number;
  delayUntil?: number;
  createdAt: number;
  status: "pending" | "processing" | "done" | "failed" | "dlq";
  workerId?: string;
  failReason?: string;
}

export interface Worker {
  id: string;
  alive: boolean;
  busy: boolean;
  processed: number;
  failed: number;
  currentJobId?: string;
}

export interface TraceSpan {
  service: string;
  start: number;
  duration: number;
  ok: boolean;
  note?: string;
}
export interface RequestTrace {
  id: string;
  ts: number;
  path: string;
  totalMs: number;
  ok: boolean;
  spans: TraceSpan[];
}

export interface MetricSample {
  t: number;
  rps: number;
  hitRatio: number;
  qDepth: number;
  latencyP95: number;
  cpu: number;
  mem: number;
}

interface EngineState {
  nodes: CacheNode[];
  queues: Map<string, QueueJob[]>;
  dlq: QueueJob[];
  workers: Worker[];
  channels: Map<string, string[]>; // pub/sub: channel -> recent messages
  subscribers: Map<string, Set<string>>; // channel -> subscriber ids
  logs: LogEntry[];
  traces: RequestTrace[];
  metrics: MetricSample[];
  rateLimit: { capacity: number; tokens: number; lastRefill: number };
  totals: { req: number; ok: number; err: number; cacheHits: number; cacheMisses: number };
  startedAt: number;
}

const MAX_LOGS = 400;
const MAX_TRACES = 80;
const MAX_METRICS = 60;

function uid(prefix = "") {
  return prefix + Math.random().toString(36).slice(2, 9);
}

// Simple FNV-1a for consistent hashing
function fnv1a(s: string) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function makeNode(id: string, role: "primary" | "replica" = "primary", primaryOf?: string): CacheNode {
  return {
    id, role, primaryOf,
    alive: true, cpu: 0.1, mem: 0, memMax: 64 * 1024,
    store: new Map(), hits: 0, misses: 0, evictions: 0,
    lru: [], lastHeartbeat: Date.now(),
  };
}

class InfraMeshEngine {
  state: EngineState;
  private listeners = new Set<Listener>();
  private tickHandle: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = this.bootstrap();
    this.start();
  }

  private bootstrap(): EngineState {
    const primaries = [makeNode("cache-1"), makeNode("cache-2"), makeNode("cache-3")];
    const replicas = primaries.map((p) => makeNode(`${p.id}-r`, "replica", p.id));
    return {
      nodes: [...primaries, ...replicas],
      queues: new Map([["default", []], ["emails", []], ["analytics", []]]),
      dlq: [],
      workers: [
        { id: "worker-1", alive: true, busy: false, processed: 0, failed: 0 },
        { id: "worker-2", alive: true, busy: false, processed: 0, failed: 0 },
        { id: "worker-3", alive: true, busy: false, processed: 0, failed: 0 },
      ],
      channels: new Map(),
      subscribers: new Map(),
      logs: [],
      traces: [],
      metrics: [],
      rateLimit: { capacity: 200, tokens: 200, lastRefill: Date.now() },
      totals: { req: 0, ok: 0, err: 0, cacheHits: 0, cacheMisses: 0 },
      startedAt: Date.now(),
    };
  }

  // --- pub/sub for React ---
  subscribe(l: Listener) { this.listeners.add(l); return () => this.listeners.delete(l); }
  private emit() { for (const l of this.listeners) l(); }

  // --- lifecycle ---
  start() {
    if (this.tickHandle) return;
    this.tickHandle = setInterval(() => this.tick(), 1000);
  }
  stop() { if (this.tickHandle) { clearInterval(this.tickHandle); this.tickHandle = null; } }

  reset() {
    this.stop();
    this.state = this.bootstrap();
    this.log("info", "system", "InfraMesh state reset");
    this.start();
    this.emit();
  }

  // --- logging ---
  log(level: LogLevel, source: string, msg: string, reqId?: string) {
    this.state.logs.unshift({ id: uid("l_"), ts: Date.now(), level, source, msg, reqId });
    if (this.state.logs.length > MAX_LOGS) this.state.logs.length = MAX_LOGS;
  }

  // --- consistent hashing: pick primary for key ---
  primaries(): CacheNode[] {
    return this.state.nodes.filter((n) => n.role === "primary" && n.alive);
  }
  nodeForKey(key: string): CacheNode | undefined {
    const ps = this.primaries();
    if (!ps.length) return undefined;
    return ps[fnv1a(key) % ps.length];
  }
  replicaOf(primaryId: string): CacheNode | undefined {
    return this.state.nodes.find((n) => n.role === "replica" && n.primaryOf === primaryId && n.alive);
  }

  // --- LRU helpers ---
  private touch(node: CacheNode, key: string) {
    const i = node.lru.indexOf(key);
    if (i !== -1) node.lru.splice(i, 1);
    node.lru.unshift(key);
  }
  private evictIfNeeded(node: CacheNode) {
    while (node.mem > node.memMax && node.lru.length) {
      const victim = node.lru.pop()!;
      const e = node.store.get(victim);
      if (e) { node.mem -= e.size; node.store.delete(victim); node.evictions++; }
      this.log("warn", node.id, `LRU evicted "${victim}"`);
    }
  }
  private replicate(primary: CacheNode, key: string, entry: CacheEntry | null) {
    const r = this.replicaOf(primary.id);
    if (!r) return;
    if (entry === null) { r.store.delete(key); }
    else { r.store.set(key, { ...entry }); r.mem = sum(Array.from(r.store.values()).map((x) => x.size)); }
  }

  // --- cache commands ---
  cmd(input: string, reqId?: string): { ok: boolean; out: string; node?: string } {
    const id = reqId ?? uid("r_");
    const parts = input.trim().split(/\s+/);
    const op = (parts[0] || "").toUpperCase();
    this.state.totals.req++;
    const trace: RequestTrace = { id, ts: Date.now(), path: `CACHE ${op}`, totalMs: 0, ok: true, spans: [] };
    const t0 = performance.now();
    const span = (service: string, fn: () => void, note?: string) => {
      const s = performance.now();
      try { fn(); trace.spans.push({ service, start: s - t0, duration: performance.now() - s, ok: true, note }); }
      catch (e) { trace.spans.push({ service, start: s - t0, duration: performance.now() - s, ok: false, note: String(e) }); throw e; }
    };

    let result: { ok: boolean; out: string; node?: string } = { ok: true, out: "" };

    try {
      span("gateway", () => {
        if (!this.takeToken()) throw new Error("rate limited");
      });

      if (op === "PING") { result = { ok: true, out: "PONG" }; }
      else if (op === "KEYS") {
        const all = this.primaries().flatMap((n) => Array.from(n.store.keys()));
        result = { ok: true, out: JSON.stringify(all) };
      }
      else if (op === "SET") {
        const [, key, ...rest] = parts;
        if (!key || !rest.length) throw new Error("usage: SET key value [EX seconds]");
        let value = ""; let ex: number | undefined;
        const exIdx = rest.findIndex((x) => x.toUpperCase() === "EX");
        if (exIdx >= 0) {
          value = rest.slice(0, exIdx).join(" ");
          ex = parseInt(rest[exIdx + 1] || "0", 10);
        } else value = rest.join(" ");
        const node = this.nodeForKey(key);
        if (!node) throw new Error("no available cache node");
        span(node.id, () => {
          const size = key.length + value.length;
          const prev = node.store.get(key);
          if (prev) node.mem -= prev.size;
          const entry: CacheEntry = {
            key, value, lastUsed: Date.now(), size,
            expiresAt: ex ? Date.now() + ex * 1000 : undefined,
          };
          node.store.set(key, entry);
          node.mem += size;
          this.touch(node, key);
          this.evictIfNeeded(node);
          this.replicate(node, key, entry);
        }, `key=${key}`);
        result = { ok: true, out: "OK", node: node.id };
        this.log("info", node.id, `SET ${key}${ex ? ` EX ${ex}` : ""}`, id);
      }
      else if (op === "GET") {
        const [, key] = parts;
        const node = this.nodeForKey(key);
        if (!node) throw new Error("no available cache node");
        let out = "(nil)"; let hit = false;
        span(node.id, () => {
          const e = node.store.get(key);
          if (e && (!e.expiresAt || e.expiresAt > Date.now())) {
            e.lastUsed = Date.now(); this.touch(node, key);
            node.hits++; this.state.totals.cacheHits++;
            out = e.value; hit = true;
          } else {
            if (e) { node.store.delete(key); node.mem -= e.size; }
            node.misses++; this.state.totals.cacheMisses++;
          }
        }, `key=${key} ${hit ? "HIT" : "MISS"}`);
        result = { ok: true, out, node: node.id };
      }
      else if (op === "DEL") {
        const [, key] = parts;
        const node = this.nodeForKey(key);
        if (!node) throw new Error("no node");
        const e = node.store.get(key);
        if (e) { node.store.delete(key); node.mem -= e.size; node.lru = node.lru.filter((k) => k !== key); this.replicate(node, key, null); }
        result = { ok: true, out: e ? "1" : "0", node: node.id };
        this.log("info", node.id, `DEL ${key}`, id);
      }
      else if (op === "EXISTS") {
        const [, key] = parts;
        const node = this.nodeForKey(key);
        const e = node?.store.get(key);
        const ok = !!(e && (!e.expiresAt || e.expiresAt > Date.now()));
        result = { ok: true, out: ok ? "1" : "0", node: node?.id };
      }
      else if (op === "PUBLISH") {
        const [, ch, ...msgParts] = parts;
        const msg = msgParts.join(" ");
        const list = this.state.channels.get(ch) ?? [];
        list.unshift(`${new Date().toLocaleTimeString()} ${msg}`);
        if (list.length > 50) list.length = 50;
        this.state.channels.set(ch, list);
        const subs = this.state.subscribers.get(ch)?.size ?? 0;
        this.log("info", "pubsub", `PUBLISH ${ch} -> ${subs} sub(s)`, id);
        result = { ok: true, out: String(subs) };
      }
      else if (op === "SUBSCRIBE") {
        const [, ch] = parts;
        if (!ch) throw new Error("usage: SUBSCRIBE channel");
        const set = this.state.subscribers.get(ch) ?? new Set();
        set.add("ui-client");
        this.state.subscribers.set(ch, set);
        result = { ok: true, out: `subscribed to ${ch}` };
      }
      else throw new Error(`unknown command: ${op}`);

      this.state.totals.ok++;
    } catch (e: any) {
      this.state.totals.err++;
      trace.ok = false;
      result = { ok: false, out: `ERR ${e.message}` };
      this.log("error", "gateway", `${op}: ${e.message}`, id);
    } finally {
      trace.totalMs = performance.now() - t0;
      this.state.traces.unshift(trace);
      if (this.state.traces.length > MAX_TRACES) this.state.traces.length = MAX_TRACES;
      this.emit();
    }
    return result;
  }

  // --- queue ---
  enqueue(opts: { queue: string; payload: string; priority?: number; delayMs?: number; maxAttempts?: number }) {
    const q = opts.queue || "default";
    const job: QueueJob = {
      id: uid("j_"), queue: q, payload: opts.payload,
      priority: opts.priority ?? 0, attempts: 0,
      maxAttempts: opts.maxAttempts ?? 3,
      delayUntil: opts.delayMs ? Date.now() + opts.delayMs : undefined,
      createdAt: Date.now(), status: "pending",
    };
    const arr = this.state.queues.get(q) ?? [];
    arr.push(job);
    this.state.queues.set(q, arr);
    this.log("info", "queue", `PUSH ${q} job=${job.id}${opts.delayMs ? ` delay=${opts.delayMs}ms` : ""}${opts.priority ? ` prio=${opts.priority}` : ""}`);
    this.emit();
    return job;
  }

  retryDlq(jobId: string) {
    const i = this.state.dlq.findIndex((j) => j.id === jobId);
    if (i === -1) return;
    const job = this.state.dlq.splice(i, 1)[0];
    job.attempts = 0; job.status = "pending"; job.failReason = undefined;
    const arr = this.state.queues.get(job.queue) ?? [];
    arr.push(job); this.state.queues.set(job.queue, arr);
    this.log("info", "queue", `Re-queued from DLQ ${job.id}`);
    this.emit();
  }

  killNode(id: string) {
    const n = this.state.nodes.find((x) => x.id === id); if (!n) return;
    n.alive = false;
    this.log("error", n.id, `node ${n.id} marked DOWN`);
    this.emit();
  }
  reviveNode(id: string) {
    const n = this.state.nodes.find((x) => x.id === id); if (!n) return;
    n.alive = true; n.lastHeartbeat = Date.now();
    this.log("info", n.id, `node ${n.id} brought UP`);
    this.emit();
  }
  killWorker(id: string) {
    const w = this.state.workers.find((x) => x.id === id); if (!w) return;
    w.alive = false; w.busy = false; w.currentJobId = undefined;
    this.log("error", w.id, `worker ${w.id} stopped`);
    this.emit();
  }
  reviveWorker(id: string) {
    const w = this.state.workers.find((x) => x.id === id); if (!w) return;
    w.alive = true; this.log("info", w.id, `worker ${w.id} started`);
    this.emit();
  }

  // --- rate limiter (token bucket) ---
  private takeToken(): boolean {
    const rl = this.state.rateLimit;
    const now = Date.now();
    const elapsed = (now - rl.lastRefill) / 1000;
    rl.tokens = Math.min(rl.capacity, rl.tokens + elapsed * 50);
    rl.lastRefill = now;
    if (rl.tokens >= 1) { rl.tokens -= 1; return true; }
    return false;
  }

  // --- background tick ---
  private tick() {
    const now = Date.now();

    // expire TTLs
    for (const n of this.state.nodes) {
      if (!n.alive) continue;
      n.lastHeartbeat = now;
      n.cpu = clamp(n.cpu * 0.6 + Math.random() * 0.3, 0.05, 0.98);
      for (const [k, e] of Array.from(n.store.entries())) {
        if (e.expiresAt && e.expiresAt <= now) {
          n.store.delete(k); n.mem -= e.size;
          n.lru = n.lru.filter((x) => x !== k);
          this.replicate(n, k, null);
          this.log("debug", n.id, `expired "${k}"`);
        }
      }
    }

    // process queues with workers
    const aliveWorkers = this.state.workers.filter((w) => w.alive && !w.busy);
    for (const w of aliveWorkers) {
      const job = this.pickNextJob();
      if (!job) break;
      job.status = "processing"; job.workerId = w.id; job.attempts++;
      w.busy = true; w.currentJobId = job.id;
      const procMs = 200 + Math.random() * 800;
      setTimeout(() => this.completeJob(job.id, w.id), procMs);
      this.log("info", w.id, `picked job ${job.id} (${job.queue})`);
    }

    // synthetic background traffic so charts look alive
    if (Math.random() < 0.7) {
      const k = `bg:${Math.floor(Math.random() * 30)}`;
      this.cmd(Math.random() < 0.6 ? `GET ${k}` : `SET ${k} ${Math.floor(Math.random()*1000)}`);
    }

    // sample metrics
    const sampleWindowMs = 5000;
    const recent = this.state.traces.filter((t) => now - t.ts < sampleWindowMs);
    const rps = recent.length / (sampleWindowMs / 1000);
    const totalHits = sumNodes(this.state.nodes, (n) => n.hits);
    const totalMiss = sumNodes(this.state.nodes, (n) => n.misses);
    const hitRatio = totalHits + totalMiss === 0 ? 0 : totalHits / (totalHits + totalMiss);
    const qDepth = Array.from(this.state.queues.values()).reduce((a, q) => a + q.length, 0);
    const sortedLat = recent.map((t) => t.totalMs).sort((a, b) => a - b);
    const p95 = sortedLat.length ? sortedLat[Math.floor(sortedLat.length * 0.95)] : 0;
    const cpu = avg(this.state.nodes.filter((n) => n.alive).map((n) => n.cpu));
    const mem = sumNodes(this.state.nodes, (n) => n.mem);
    this.state.metrics.push({ t: now, rps, hitRatio, qDepth, latencyP95: p95, cpu, mem });
    if (this.state.metrics.length > MAX_METRICS) this.state.metrics.shift();

    this.emit();
  }

  private pickNextJob(): QueueJob | undefined {
    const now = Date.now();
    let best: QueueJob | undefined;
    for (const arr of this.state.queues.values()) {
      for (const j of arr) {
        if (j.status !== "pending") continue;
        if (j.delayUntil && j.delayUntil > now) continue;
        if (!best || j.priority > best.priority || (j.priority === best.priority && j.createdAt < best.createdAt)) best = j;
      }
    }
    return best;
  }

  private completeJob(jobId: string, workerId: string) {
    const w = this.state.workers.find((x) => x.id === workerId); if (!w) return;
    let job: QueueJob | undefined;
    for (const arr of this.state.queues.values()) {
      const j = arr.find((x) => x.id === jobId);
      if (j) { job = j; break; }
    }
    w.busy = false; w.currentJobId = undefined;
    if (!job) return;
    const fail = Math.random() < 0.18;
    if (fail) {
      w.failed++;
      job.failReason = "simulated processing error";
      if (job.attempts >= job.maxAttempts) {
        job.status = "dlq";
        const arr = this.state.queues.get(job.queue)!;
        const i = arr.indexOf(job); if (i >= 0) arr.splice(i, 1);
        this.state.dlq.unshift(job);
        if (this.state.dlq.length > 50) this.state.dlq.length = 50;
        this.log("error", w.id, `job ${job.id} -> DLQ after ${job.attempts} attempts`);
      } else {
        job.status = "pending";
        job.delayUntil = Date.now() + 1500 * job.attempts;
        this.log("warn", w.id, `job ${job.id} failed, retry #${job.attempts}`);
      }
    } else {
      w.processed++;
      job.status = "done";
      const arr = this.state.queues.get(job.queue)!;
      const i = arr.indexOf(job); if (i >= 0) arr.splice(i, 1);
      this.log("info", w.id, `job ${job.id} done`);
    }
    this.emit();
  }
}

function clamp(n: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, n)); }
function sum(xs: number[]) { return xs.reduce((a, b) => a + b, 0); }
function sumNodes(ns: CacheNode[], f: (n: CacheNode) => number) { return sum(ns.map(f)); }
function avg(xs: number[]) { return xs.length ? sum(xs) / xs.length : 0; }

let _engine: InfraMeshEngine | null = null;
export function getEngine(): InfraMeshEngine {
  if (typeof window === "undefined") {
    // SSR-safe stub: build a transient instance without intervals
    const e = new InfraMeshEngine();
    e.stop();
    return e;
  }
  if (!_engine) _engine = new InfraMeshEngine();
  return _engine;
}

export type Engine = InfraMeshEngine;
