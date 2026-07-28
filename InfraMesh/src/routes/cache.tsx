import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
import { useState, useRef, useEffect } from "react";
import { Send, Trash2, Terminal as TerminalIcon } from "lucide-react";

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

  // Auto-scroll to the bottom of the terminal when history updates
  useEffect(() => { 
    termRef.current?.scrollTo({ top: termRef.current.scrollHeight, behavior: 'smooth' }); 
  }, [history]);

  const primaries = e.state.nodes.filter((n) => n.role === "primary");

  return (
    <div className="animate-fade-in space-y-6 pb-10">
      {/* CSS for Glass Shimmer / Highlights */}
      <style>
        {`
          @keyframes card-shine {
            0% { background-position: 200% center; }
            100% { background-position: -200% center; }
          }
          .glass-card-shine {
            background: linear-gradient(90deg, 
              rgba(255, 255, 255, 0) 45%, 
              rgba(255, 255, 255, 0.05) 50%, 
              rgba(255, 255, 255, 0) 55%
            );
            background-size: 200% auto;
            animation: card-shine 4s linear infinite;
          }
        `}
      </style>

      {/* Page Header with Glass Container Wrapper */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] py-4 px-6 backdrop-blur-xl shadow-2xl overflow-hidden">
  <div className="absolute inset-0 glass-card-shine pointer-events-none" />
  <PageHeader
    title="Cache Playground"
    subtitle="Redis-inspired sharded cache. Commands route via consistent hashing to primaries and replicate to replicas."
  />
</div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Terminal Panel - Height reduced to h-[250px] */}
        <div className="lg:col-span-2 group relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)] flex flex-col">
          <Panel
            title="Command terminal"
            description="Execute cache commands against the cluster"
            className="border-0 bg-transparent shadow-none"
            noPadding
            actions={
              <button
                onClick={() => setHistory([])}
                className="group/btn inline-flex items-center gap-1.5 rounded-lg border border-white/5 bg-white/5 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-md transition-all duration-300 hover:bg-red-950/20 hover:border-red-500/30 hover:text-red-200 active:scale-95"
              >
                <Trash2 className="h-3 w-3 text-muted-foreground transition-transform duration-300 group-hover/btn:scale-110" /> 
                Clear
              </button>
            }
          >
            {/* Reduced height window */}
            <div ref={termRef} className="scroll-area h-[250px] overflow-y-auto space-y-3 p-5 font-mono text-sm bg-black/40 shadow-inner border-y border-white/5">
              {history.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground/50 space-y-2">
                  <TerminalIcon className="h-8 w-8 text-muted-foreground/30 animate-pulse" />
                  <p>Try running commands like <code className="text-red-400">SET user:1 alice</code> or pick a hint below.</p>
                </div>
              )}
              {history.map((h, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-1">
                  <div className="text-red-400 font-semibold flex items-center gap-2">
                    <span>›</span> {h.cmd}
                  </div>
                  <div className={`pl-4 text-xs ${h.ok ? "text-foreground/90" : "text-red-400"}`}>
                    {h.out}
                    {h.node && <span className="ml-2 rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground border border-white/5">[{h.node}]</span>}
                  </div>
                </div>
              ))}
            </div>
            
            <form
              onSubmit={(ev) => { ev.preventDefault(); run(); }}
              className="flex items-center gap-2 border-t border-white/5 px-4 py-3 bg-black/20"
            >
              <span className="font-mono text-sm text-red-400 font-bold">›</span>
              <input
                value={cmd}
                onChange={(ev) => setCmd(ev.target.value)}
                placeholder="SET key value [EX seconds]"
                className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground/40 text-foreground"
                autoFocus
              />
              <button 
                type="submit" 
                className="group/run flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-1.5 text-xs font-semibold text-red-50 backdrop-blur-md transition-all duration-300 hover:bg-red-900/30 hover:border-red-500/60 active:scale-95 shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
              >
                <Send className="h-3 w-3 text-red-400 transition-transform duration-300 group-hover/run:translate-x-0.5" /> 
                Run
              </button>
            </form>
            
            <div className="flex flex-wrap gap-1.5 border-t border-white/5 px-4 py-3 bg-black/30 rounded-b-2xl">
              {HINTS.map((h) => (
                <button
                  key={h}
                  onClick={() => run(h)}
                  className="rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-md transition-all duration-200 hover:border-red-500/30 hover:bg-red-950/10 hover:text-red-200 active:scale-95"
                >
                  {h}
                </button>
              ))}
            </div>
          </Panel>
        </div>

        {/* Shards Panel */}
        <div className="space-y-4">
          <SectionHeader title="Primary shards" description="Live key distribution" />
          <div className="space-y-4">
            {primaries.map((n) => {
              const replica = e.state.nodes.find((x) => x.role === "replica" && x.primaryOf === n.id);
              const entries = Array.from(n.store.values());
              return (
                <div 
                  key={n.id}
                  className={`group relative rounded-2xl border bg-white/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    n.alive 
                      ? "border-white/10 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]" 
                      : "border-red-950/40 bg-red-950/[0.02] opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-semibold text-foreground tracking-wide">{n.id}</div>
                      <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/80">
                        Replicates to {replica?.id ?? "none"}
                      </div>
                    </div>
                    <div className="relative flex h-2.5 w-2.5">
                      {n.alive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${n.alive ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-neutral-600"}`}></span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl border border-white/5 bg-black/40 px-2 py-2 font-mono text-[10px] text-muted-foreground text-center shadow-inner">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{entries.length}</span>
                      <span className="text-[8px] uppercase tracking-wider">keys</span>
                    </div>
                    <div className="flex flex-col border-x border-white/5">
                      <span className="font-bold text-foreground">{n.hits}</span>
                      <span className="text-[8px] uppercase tracking-wider">hits</span>
                    </div>
                    <div className="flex flex-col border-r border-white/5">
                      <span className="font-bold text-foreground">{n.misses}</span>
                      <span className="text-[8px] uppercase tracking-wider">miss</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground">{n.evictions}</span>
                      <span className="text-[8px] uppercase tracking-wider">evict</span>
                    </div>
                  </div>

                  <div className="scroll-area mt-4 max-h-40 space-y-1.5 overflow-y-auto pr-1">
                    {entries.length === 0 && (
                      <p className="py-3 text-center font-mono text-[11px] text-muted-foreground/50">No keys stored</p>
                    )}
                    {entries.slice(0, 20).map((en) => {
                      const ttl = en.expiresAt ? Math.max(0, Math.round((en.expiresAt - Date.now()) / 1000)) : null;
                      return (
                        <div key={en.key} className="flex items-center justify-between gap-2 rounded-lg border border-white/5 bg-black/20 px-2.5 py-1.5 font-mono text-[11px] backdrop-blur-sm transition-colors hover:border-red-500/20">
                          <span className="truncate text-red-400 font-medium">{en.key}</span>
                          <div className="flex items-center gap-2">
                            <span className="truncate text-muted-foreground max-w-[80px]">{en.value}</span>
                            {ttl !== null && <span className="shrink-0 rounded bg-amber-500/10 px-1 py-0.5 text-[9px] text-amber-400 border border-amber-500/20">{ttl}s</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {e.state.channels.size > 0 && (
        <div className="space-y-4 pt-4">
          <SectionHeader title="Pub / Sub channels" description="Active event communication streams" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from(e.state.channels.entries()).map(([ch, msgs]) => (
              <div key={ch} className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-sm font-semibold text-foreground tracking-wide">#{ch}</span>
                  <span className="rounded-full border border-red-500/30 bg-red-950/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300">
                    {e.state.subscribers.get(ch)?.size ?? 0} subs
                  </span>
                </div>
                <div className="scroll-area h-28 overflow-y-auto space-y-1.5 pr-1 bg-black/40 rounded-xl p-3 border border-white/5 shadow-inner">
                  {msgs.length === 0 && (
                    <div className="flex h-full items-center justify-center text-muted-foreground/40 text-[11px] font-mono">
                      No messages published
                    </div>
                  )}
                  {msgs.slice(0, 8).map((m, i) => (
                    <div key={i} className="font-mono text-[11px] text-foreground/85 border-b border-white/5 pb-1 last:border-0">
                      {m}
                    </div>
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