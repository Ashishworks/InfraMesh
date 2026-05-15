import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { useState } from "react";

export const Route = createFileRoute("/tracing")({
  head: () => ({
    meta: [
      { title: "Tracing · InfraMesh" },
      { name: "description", content: "Jaeger-style waterfall traces showing each span across gateway → cache → worker." },
    ],
  }),
  component: TracingPage,
});

function TracingPage() {
  const e = useEngine();
  const [selected, setSelected] = useState<string | null>(null);
  const trace = e.state.traces.find((t) => t.id === selected) ?? e.state.traces[0];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Request Tracing" subtitle="Distributed trace waterfall for every command flowing through the cluster." />
      <div className="grid lg:grid-cols-[320px_1fr] gap-4">
        <div className="glass p-0 max-h-[640px] overflow-auto">
          {e.state.traces.map((t) => {
            const sel = (selected ?? e.state.traces[0]?.id) === t.id;
            return (
              <button key={t.id} onClick={() => setSelected(t.id)}
                className={`w-full text-left px-4 py-2 border-b border-border/30 text-[11px] font-mono ${sel ? "bg-primary/10" : "hover:bg-secondary/30"}`}>
                <div className="flex justify-between items-center">
                  <span className={t.ok ? "text-primary" : "text-destructive"}>{t.path}</span>
                  <span className="text-muted-foreground">{t.totalMs.toFixed(1)}ms</span>
                </div>
                <div className="text-muted-foreground truncate">{new Date(t.ts).toLocaleTimeString()} · {t.id}</div>
              </button>
            );
          })}
        </div>
        <div className="glass p-5">
          {!trace ? <div className="text-muted-foreground text-sm">No traces yet</div> : (
            <>
              <div className="flex justify-between items-end mb-4">
                <div>
                  <div className="font-mono text-sm text-primary">{trace.path}</div>
                  <div className="text-xs text-muted-foreground font-mono">{trace.id}</div>
                </div>
                <div className="font-mono text-2xl">{trace.totalMs.toFixed(2)}<span className="text-sm text-muted-foreground"> ms</span></div>
              </div>
              <div className="space-y-2">
                {trace.spans.map((s, i) => {
                  const left = trace.totalMs ? (s.start / trace.totalMs) * 100 : 0;
                  const width = trace.totalMs ? Math.max(1, (s.duration / trace.totalMs) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] font-mono mb-0.5">
                        <span className={s.ok ? "text-primary" : "text-destructive"}>{s.service}</span>
                        <span className="text-muted-foreground">{s.duration.toFixed(2)}ms{s.note ? ` · ${s.note}` : ""}</span>
                      </div>
                      <div className="relative h-4 bg-secondary/30 rounded overflow-hidden">
                        <div
                          className={`absolute h-full rounded ${s.ok ? "bg-gradient-to-r from-primary to-accent" : "bg-destructive"}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
