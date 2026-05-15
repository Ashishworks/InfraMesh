import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { useState, useRef, useEffect } from "react";
import { Send, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cache")({
  head: () => ({
    meta: [
      { title: "Cache Playground · InfraMesh" },
      { name: "description", content: "Test SET, GET, DEL, EXISTS, TTL, KEYS, PUBLISH, SUBSCRIBE against a sharded cache cluster." },
    ],
  }),
  component: CachePage,
});

const HINTS = [
  "SET user:1 alice",
  "SET session abc EX 30",
  "GET user:1",
  "EXISTS user:1",
  "DEL user:1",
  "KEYS *",
  "PUBLISH events hello",
  "SUBSCRIBE events",
  "PING",
];

function CachePage() {
  const e = useEngine();
  const [cmd, setCmd] = useState("SET user:1 alice");
  const [history, setHistory] = useState<{ cmd: string; out: string; ok: boolean; node?: string }[]>([]);
  const termRef = useRef<HTMLDivElement>(null);

  function run(c?: string) {
    const input = (c ?? cmd).trim();
    if (!input) return;
    const r = e.cmd(input);
    setHistory((h) => [...h, { cmd: input, out: r.out, ok: r.ok, node: r.node }].slice(-100));
    if (!c) setCmd("");
  }

  useEffect(() => { termRef.current?.scrollTo({ top: termRef.current.scrollHeight }); }, [history]);

  const primaries = e.state.nodes.filter((n) => n.role === "primary");

  return (
    <div className="animate-fade-in">
      <PageHeader title="Cache Playground" subtitle="A Redis-inspired sharded cache. Commands route via consistent hashing to a primary node and replicate to its replica." />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 glass p-0 overflow-hidden flex flex-col h-[520px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Terminal</div>
            <button onClick={() => setHistory([])} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> clear
            </button>
          </div>
          <div
  ref={termRef}
  className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-1.5 pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
>
            {history.length === 0 && (
              <div className="text-muted-foreground/60">// Try a quick command below ↓</div>
            )}
            {history.map((h, i) => (
              <div key={i}>
                <div className="text-primary">› {h.cmd}</div>
                <div className={`pl-3 ${h.ok ? "text-foreground" : "text-destructive"}`}>
                  {h.out}
                  {h.node && <span className="text-muted-foreground ml-2">[{h.node}]</span>}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(ev) => { ev.preventDefault(); run(); }}
            className="flex items-center gap-2 border-t border-border/50 px-3 py-2.5"
          >
            <span className="text-primary font-mono text-sm">›</span>
            <input
              value={cmd} onChange={(ev) => setCmd(ev.target.value)}
              placeholder="SET key value [EX seconds]"
              className="flex-1 bg-transparent outline-none font-mono text-sm placeholder:text-muted-foreground/50"
              autoFocus
            />
            <button type="submit" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/15 text-primary text-xs hover:bg-primary/25">
              <Send className="w-3 h-3" /> run
            </button>
          </form>
          <div className="px-3 pb-3 flex flex-wrap gap-1.5">
            {HINTS.map((h) => (
              <button key={h} onClick={() => run(h)} className="text-[10px] font-mono px-2 py-1 rounded border border-border/50 hover:border-primary/60 hover:text-primary">
                {h}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {primaries.map((n) => {
            const replica = e.state.nodes.find((x) => x.role === "replica" && x.primaryOf === n.id);
            const entries = Array.from(n.store.values());
            return (
              <div key={n.id} className="glass p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-mono text-sm">
                    <span className="grad-text font-semibold">{n.id}</span>
                    <span className="text-muted-foreground ml-2">→ {replica?.id ?? "no replica"}</span>
                  </div>
                  <span className={`h-2 w-2 rounded-full ${n.alive ? "bg-success pulse-dot" : "bg-destructive"}`} />
                </div>
                <div className="text-[11px] text-muted-foreground flex gap-3 mb-2">
                  <span>{entries.length} keys</span>
                  <span>{n.hits} hit</span>
                  <span>{n.misses} miss</span>
                  <span>{n.evictions} evict</span>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                  {entries.length === 0 && <div className="text-[11px] text-muted-foreground/60 font-mono">empty</div>}
                  {entries.slice(0, 20).map((en) => {
                    const ttl = en.expiresAt ? Math.max(0, Math.round((en.expiresAt - Date.now()) / 1000)) : null;
                    return (
                      <div key={en.key} className="font-mono text-[11px] flex justify-between gap-2 py-1 border-b border-border/30 last:border-0">
                        <span className="truncate text-primary">{en.key}</span>
                        <span className="truncate text-muted-foreground">{en.value}</span>
                        {ttl !== null && <span className="text-warning shrink-0">{ttl}s</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {e.state.channels.size > 0 && (
        <div className="glass p-4 mt-6">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-3">Pub / Sub channels</div>
          <div className="grid md:grid-cols-3 gap-3">
            {Array.from(e.state.channels.entries()).map(([ch, msgs]) => (
              <div key={ch} className="rounded-md border border-border/50 p-3">
                <div className="font-mono text-sm text-primary mb-1">#{ch}</div>
                <div className="text-[11px] text-muted-foreground mb-2">{e.state.subscribers.get(ch)?.size ?? 0} subscribers</div>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                  {msgs.slice(0, 8).map((m, i) => (
                    <div key={i} className="font-mono text-[11px] text-foreground/80">{m}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
