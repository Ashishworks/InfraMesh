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
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 glass-card-shine pointer-events-none" />
        <PageHeader
          title="Request Tracing"
          subtitle="Distributed trace waterfall for commands flowing through the cluster."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr] items-start">
        {/* Recent Traces Panel */}
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
          <Panel
            title="Recent traces"
            description={`${e.state.traces.length} traces`}
            className="border-0 bg-transparent shadow-none"
            noPadding
          >
            <div className="scroll-area h-[640px] overflow-y-auto bg-black/40 rounded-b-2xl p-2 space-y-1.5 shadow-inner">
              {e.state.traces.length === 0 && (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground/50">
                  No traces recorded yet
                </div>
              )}
              {e.state.traces.map((t) => {
                const sel = (selected ?? e.state.traces[0]?.id) === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelected(t.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left backdrop-blur-md transition-all duration-200 active:scale-95 ${
                      sel 
                        ? "border-red-500/40 bg-red-950/30 text-red-100 shadow-[0_4px_12px_rgba(239,68,68,0.15)]" 
                        : "border-white/5 bg-black/20 text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`truncate font-mono text-xs font-semibold ${t.ok ? "text-red-400" : "text-red-500"}`}>
                        {t.path}
                      </span>
                      <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{t.totalMs.toFixed(1)} ms</span>
                    </div>
                    <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground/70">
                      {new Date(t.ts).toLocaleTimeString()} · {t.id}
                    </div>
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Trace Detail Panel */}
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
          <Panel
            title="Trace detail"
            description={trace ? trace.id : undefined}
            className="border-0 bg-transparent shadow-none"
          >
            {!trace ? (
              <div className="flex h-[500px] items-center justify-center text-sm text-muted-foreground/50 font-mono">
                Select a trace to view span details
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div className="flex items-end justify-between gap-4 border-b border-white/5 pb-5">
                  <div>
                    <div className="font-mono text-base font-bold text-red-400 tracking-wide">{trace.path}</div>
                    <div className="mt-0.5 font-mono text-xs text-muted-foreground/80">{trace.id}</div>
                  </div>
                  <div className="font-mono text-2xl font-bold text-foreground">
                    {trace.totalMs.toFixed(2)}
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">ms</span>
                  </div>
                </div>

                <div className="space-y-4 bg-black/40 rounded-2xl p-5 border border-white/5 shadow-inner">
                  {trace.spans.map((s, i) => {
                    const left = trace.totalMs ? (s.start / trace.totalMs) * 100 : 0;
                    const width = trace.totalMs ? Math.max(1, (s.duration / trace.totalMs) * 100) : 0;
                    return (
                      <div key={i} className="space-y-1.5">
                        <div className="flex justify-between font-mono text-[11px]">
                          <span className={`font-semibold ${s.ok ? "text-foreground" : "text-red-400"}`}>
                            {s.service}
                          </span>
                          <span className="text-muted-foreground">
                            {s.duration.toFixed(2)} ms{s.note ? ` · ${s.note}` : ""}
                          </span>
                        </div>
                        <div className="relative h-3.5 overflow-hidden rounded-lg bg-black/60 border border-white/5 p-0.5 shadow-inner">
                          <div
                            className={`absolute h-full rounded-md transition-all duration-300 shadow-sm ${s.ok ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-red-700 shadow-[0_0_10px_rgba(185,28,28,0.5)]"}`}
                            style={{ left: `${left}%`, width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}