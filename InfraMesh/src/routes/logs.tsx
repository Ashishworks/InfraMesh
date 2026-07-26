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
  info: { text: "text-info", bg: "bg-info/10", border: "border-info/30" },
  warn: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30" },
  error: { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30" },
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
      <PageHeader
        title="Live Logs"
        subtitle="Structured logs streamed from gateway, cache nodes, and workers."
      />

      <Panel
        title="Log stream"
        description={`${filtered.length} entries`}
        noPadding
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border/40 px-5 py-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(ev) => setQ(ev.target.value)}
              placeholder="Search messages or service…"
              className="input-field pl-9 text-sm"
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
                  className={`rounded-md border px-2.5 py-1 text-[11px] font-medium uppercase transition-colors ${
                    on ? `${s.text} ${s.bg} ${s.border}` : "border-border/40 text-muted-foreground/50"
                  }`}
                >
                  {lv}
                </button>
              );
            })}
          </div>
        </div>

        <div className="scroll-area max-h-[640px] font-mono text-[12px]">
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-muted-foreground">No logs match your filters</div>
          )}
          {filtered.map((l) => {
            const s = LEVEL_STYLES[l.level];
            return (
              <div
                key={l.id}
                className="data-table-row grid-cols-[88px_72px_120px_1fr]"
              >
                <span className="text-muted-foreground">{new Date(l.ts).toLocaleTimeString()}</span>
                <span className={`uppercase font-medium ${s.text}`}>{l.level}</span>
                <span className="truncate text-primary/90">{l.source}</span>
                <span className="truncate text-foreground/90">{l.msg}</span>
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
