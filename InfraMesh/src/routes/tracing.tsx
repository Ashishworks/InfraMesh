import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
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
      <PageHeader
        title="Request Tracing"
        subtitle="Distributed trace waterfall for commands flowing through the cluster."
      />
      <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
        <Panel title="Recent traces" description={`${e.state.traces.length} traces`} noPadding>
          <div className="scroll-area max-h-[640px]">
            {e.state.traces.length === 0 && (
              <p className="px-5 py-8 text-sm text-muted-foreground">No traces recorded yet</p>
            )}
            {e.state.traces.map((t) => {
              const sel = (selected ?? e.state.traces[0]?.id) === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t.id)}
                  className={`w-full border-b border-border/30 px-5 py-3 text-left transition-colors last:border-0 ${
                    sel ? "bg-primary/10" : "hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`truncate font-mono text-xs font-medium ${t.ok ? "text-primary" : "text-destructive"}`}>
                      {t.path}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{t.totalMs.toFixed(1)} ms</span>
                  </div>
                  <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground">
                    {new Date(t.ts).toLocaleTimeString()} · {t.id}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        <Panel title="Trace detail" description={trace ? trace.id : undefined}>
          {!trace ? (
            <p className="text-sm text-muted-foreground">Select a trace to view span details</p>
          ) : (
            <>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono text-sm font-medium text-primary">{trace.path}</div>
                  <div className="mt-1 font-mono text-xs text-muted-foreground">{trace.id}</div>
                </div>
                <div className="font-mono text-2xl font-semibold text-foreground">
                  {trace.totalMs.toFixed(2)}
                  <span className="ml-1 text-sm font-normal text-muted-foreground">ms</span>
                </div>
              </div>
              <div className="space-y-3">
                {trace.spans.map((s, i) => {
                  const left = trace.totalMs ? (s.start / trace.totalMs) * 100 : 0;
                  const width = trace.totalMs ? Math.max(1, (s.duration / trace.totalMs) * 100) : 0;
                  return (
                    <div key={i}>
                      <div className="mb-1 flex justify-between font-mono text-[11px]">
                        <span className={s.ok ? "font-medium text-foreground" : "font-medium text-destructive"}>
                          {s.service}
                        </span>
                        <span className="text-muted-foreground">
                          {s.duration.toFixed(2)} ms{s.note ? ` · ${s.note}` : ""}
                        </span>
                      </div>
                      <div className="relative h-3 overflow-hidden rounded-sm bg-secondary">
                        <div
                          className={`absolute h-full rounded-sm ${s.ok ? "bg-primary" : "bg-destructive"}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Panel>
      </div>
    </div>
  );
}
