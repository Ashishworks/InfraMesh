import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
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
      <PageHeader
        title="Cache Playground"
        subtitle="Redis-inspired sharded cache. Commands route via consistent hashing to primaries and replicate to replicas."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Command terminal"
          description="Execute cache commands against the cluster"
          className="lg:col-span-2 flex flex-col"
          noPadding
          actions={
            <button
              onClick={() => setHistory([])}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Trash2 className="h-3 w-3" /> Clear
            </button>
          }
        >
          <div ref={termRef} className="scroll-area min-h-[360px] flex-1 space-y-2 p-5 font-mono text-sm">
            {history.length === 0 && (
              <p className="text-muted-foreground/60">Try a quick command below, or pick a hint.</p>
            )}
            {history.map((h, i) => (
              <div key={i}>
                <div className="text-primary">› {h.cmd}</div>
                <div className={`pl-4 ${h.ok ? "text-foreground/90" : "text-destructive"}`}>
                  {h.out}
                  {h.node && <span className="ml-2 text-muted-foreground">[{h.node}]</span>}
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(ev) => { ev.preventDefault(); run(); }}
            className="flex items-center gap-2 border-t border-border/40 px-4 py-3"
          >
            <span className="font-mono text-sm text-primary">›</span>
            <input
              value={cmd}
              onChange={(ev) => setCmd(ev.target.value)}
              placeholder="SET key value [EX seconds]"
              className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground/50"
              autoFocus
            />
            <button type="submit" className="btn-primary py-1.5 text-xs">
              <Send className="h-3 w-3" /> Run
            </button>
          </form>
          <div className="flex flex-wrap gap-1.5 border-t border-border/40 px-4 py-3">
            {HINTS.map((h) => (
              <button
                key={h}
                onClick={() => run(h)}
                className="rounded border border-border/50 px-2 py-1 font-mono text-[10px] transition-colors hover:border-primary/40 hover:text-primary"
              >
                {h}
              </button>
            ))}
          </div>
        </Panel>

        <div className="space-y-4">
          <SectionHeader title="Primary shards" description="Live key distribution" />
          {primaries.map((n) => {
            const replica = e.state.nodes.find((x) => x.role === "replica" && x.primaryOf === n.id);
            const entries = Array.from(n.store.values());
            return (
              <Panel key={n.id} noPadding>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-sm font-semibold text-foreground">{n.id}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        Replicates to {replica?.id ?? "none"}
                      </div>
                    </div>
                    <span className={`status-dot ${n.alive ? "bg-success pulse-dot" : "bg-destructive"}`} />
                  </div>
                  <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
                    <span>{entries.length} keys</span>
                    <span>{n.hits} hits</span>
                    <span>{n.misses} misses</span>
                    <span>{n.evictions} evictions</span>
                  </div>
                  <div className="scroll-area mt-3 max-h-44 space-y-0">
                    {entries.length === 0 && (
                      <p className="py-2 font-mono text-[11px] text-muted-foreground/60">No keys stored</p>
                    )}
                    {entries.slice(0, 20).map((en) => {
                      const ttl = en.expiresAt ? Math.max(0, Math.round((en.expiresAt - Date.now()) / 1000)) : null;
                      return (
                        <div key={en.key} className="flex justify-between gap-2 border-b border-border/30 py-1.5 font-mono text-[11px] last:border-0">
                          <span className="truncate text-primary">{en.key}</span>
                          <span className="truncate text-muted-foreground">{en.value}</span>
                          {ttl !== null && <span className="shrink-0 text-warning">{ttl}s</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Panel>
            );
          })}
        </div>
      </div>

      {e.state.channels.size > 0 && (
        <div className="mt-8">
          <SectionHeader title="Pub / Sub channels" />
          <div className="grid gap-4 md:grid-cols-3">
            {Array.from(e.state.channels.entries()).map(([ch, msgs]) => (
              <Panel key={ch} title={`#${ch}`} description={`${e.state.subscribers.get(ch)?.size ?? 0} subscribers`} noPadding>
                <div className="scroll-area max-h-32 px-5 pb-4 space-y-1">
                  {msgs.slice(0, 8).map((m, i) => (
                    <div key={i} className="font-mono text-[11px] text-foreground/85">{m}</div>
                  ))}
                </div>
              </Panel>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
