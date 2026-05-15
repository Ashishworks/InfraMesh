import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/logs")({
  head: () => ({
    meta: [
      { title: "Logs · InfraMesh" },
      { name: "description", content: "Stream structured logs from the gateway, cache nodes and workers — filter by level and search." },
    ],
  }),
  component: LogsPage,
});

const LEVELS = ["debug", "info", "warn", "error"] as const;
const COLOR: Record<string, string> = {
  debug: "text-muted-foreground",
  info: "text-primary",
  warn: "text-warning",
  error: "text-destructive",
};

function LogsPage() {
  const e = useEngine();
  const [q, setQ] = useState("");
  const [enabled, setEnabled] = useState<Set<string>>(new Set(LEVELS));

  const filtered = useMemo(() => e.state.logs.filter((l) =>
    enabled.has(l.level) && (q === "" || l.msg.toLowerCase().includes(q.toLowerCase()) || l.source.includes(q))
  ), [e.state.logs, q, enabled]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Live Logs" subtitle="Structured logs streamed from every InfraMesh service." />
      <div className="glass p-0 overflow-hidden">
        <div className="flex flex-wrap gap-2 items-center px-4 py-3 border-b border-border/50">
          <input
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="search messages or service…"
            className="flex-1 min-w-[200px] bg-input/40 rounded-md px-3 py-1.5 text-sm border border-border/50 outline-none"
          />
          {LEVELS.map((lv) => (
            <button key={lv}
              onClick={() => setEnabled((s) => { const n = new Set(s); n.has(lv) ? n.delete(lv) : n.add(lv); return n; })}
              className={`px-2.5 py-1 rounded text-[11px] font-mono uppercase border ${enabled.has(lv) ? `${COLOR[lv]} border-current` : "text-muted-foreground/40 border-border/40"}`}
            >{lv}</button>
          ))}
        </div>
        <div className="font-mono text-[12px] max-h-[640px] overflow-y-auto scroll-smooth pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
          {filtered.length === 0 && <div className="px-4 py-8 text-center text-muted-foreground/60">no logs match</div>}
          {filtered.map((l) => (
            <div key={l.id} className="grid grid-cols-[88px_60px_120px_1fr] gap-3 px-4 py-1 border-b border-border/20 hover:bg-secondary/20">
              <span className="text-muted-foreground/70">{new Date(l.ts).toLocaleTimeString()}</span>
              <span className={`uppercase ${COLOR[l.level]}`}>{l.level}</span>
              <span className="text-accent truncate">{l.source}</span>
              <span className="text-foreground/90 truncate">{l.msg}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
