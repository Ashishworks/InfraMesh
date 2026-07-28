import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";

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

const LEVEL_STYLES: Record<string, { text: string; bg: string; border: string }> = {
  debug: { text: "text-muted-foreground", bg: "bg-muted/50", border: "border-muted-foreground/30" },
  info: { text: "text-sky-400", bg: "bg-sky-500/10", border: "border-sky-500/30" },
  warn: { text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
  error: { text: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
};

function LogsPage() {
  const e = useEngine();
  const [q, setQ] = useState("");
  const [enabled, setEnabled] = useState<Set<string>>(new Set(LEVELS));

  const filtered = useMemo(() => e.state.logs.filter((l) =>
    enabled.has(l.level) && (q === "" || l.msg.toLowerCase().includes(q.toLowerCase()) || l.source.includes(q))
  ), [e.state.logs, q, enabled]);

  return (
    <div className="animate-fade-in space-y-8 pb-10">
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
    title="Live Logs"
    subtitle="Structured logs streamed from gateway, cache nodes, and workers."
  />
</div>

      <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
        <Panel
          title="Log stream"
          description={`${filtered.length} entries`}
          className="border-0 bg-transparent shadow-none"
          noPadding
        >
          <div className="flex flex-wrap items-center gap-3 border-b border-white/5 px-5 py-3.5 bg-black/20">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(ev) => setQ(ev.target.value)}
                placeholder="Search messages or service…"
                className="w-full rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-2 text-xs font-mono text-foreground backdrop-blur-md outline-none transition-colors focus:border-red-500/50 shadow-inner placeholder:text-muted-foreground/40"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((lv) => {
                const on = enabled.has(lv);
                const s = LEVEL_STYLES[lv];
                return (
                  <button
                    key={lv}
                    onClick={() => setEnabled((prev) => {
                      const next = new Set(prev);
                      on ? next.delete(lv) : next.add(lv);
                      return next;
                    })}
                    className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold uppercase backdrop-blur-md transition-all duration-200 active:scale-95 ${
                      on 
                        ? `${s.text} ${s.bg} ${s.border} shadow-[0_2px_8px_rgba(0,0,0,0.2)]` 
                        : "border-white/5 bg-white/[0.02] text-muted-foreground/40 hover:text-muted-foreground"
                    }`}
                  >
                    {lv}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="scroll-area h-[640px] overflow-y-auto font-mono text-[12px] bg-black/40 rounded-b-2xl p-2 space-y-1 shadow-inner">
            {filtered.length === 0 && (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground/50">
                No logs match your filters
              </div>
            )}
            {filtered.map((l) => {
              const s = LEVEL_STYLES[l.level];
              return (
                <div
                  key={l.id}
                  className="grid grid-cols-[88px_72px_140px_1fr] items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 backdrop-blur-sm transition-colors hover:border-red-500/20"
                >
                  <span className="text-muted-foreground/70">{new Date(l.ts).toLocaleTimeString()}</span>
                  <span className={`uppercase font-semibold px-2 py-0.5 rounded text-[10px] w-fit border ${s.text} ${s.bg} ${s.border}`}>{l.level}</span>
                  <span className="truncate text-red-400/90 font-medium">{l.source}</span>
                  <span className="truncate text-foreground/90">{l.msg}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}