import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
import { useState } from "react";
import { PlusCircle, AlertTriangle, RefreshCw, Send, Layers, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/queue")({
  head: () => ({
    meta: [
      { title: "Queue Playground · InfraMesh" },
      { name: "description", content: "Push jobs with priorities, delays, and retries. Watch workers consume them and route failures to the DLQ." },
    ],
  }),
  component: QueuePage,
});

function QueuePage() {
  const e = useEngine();
  const [queue, setQueue] = useState("default");
  const [payload, setPayload] = useState(`{"to":"user@example.com"}`);
  const [priority, setPriority] = useState(0);
  const [delayMs, setDelayMs] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(3);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const queues = Array.from(e.state.queues.entries());

  return (
    <div className="animate-fade-in space-y-8 pb-10">
      {/* CSS for Glass Shimmer & Custom Number Input Arrow Removal/Styling */}
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
          /* Hide default number input spinners to use custom custom-styled buttons */
          input[type=number]::-webkit-inner-spin-button, 
          input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
          }
          input[type=number] {
            -moz-appearance: textfield;
          }
        `}
      </style>

      {/* Page Header with Glass Container Wrapper */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-xl shadow-2xl overflow-hidden">
        <div className="absolute inset-0 glass-card-shine pointer-events-none" />
        <PageHeader
          title="Queue Playground"
          subtitle="Push, schedule, and retry jobs across producer → queue → worker pipeline."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3 items-start">
        {/* Producer Panel - Fixed height constraint handled naturally */}
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
          <div className="flex items-center gap-2 mb-5">
            <div className="grid place-items-center h-8 w-8 rounded-lg border border-red-500/30 bg-red-950/20 text-red-400">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-foreground tracking-wide">Producer</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/80">Configure & Enqueue</div>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Queue">
              {/* Custom Glass Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-xs font-mono text-foreground backdrop-blur-md outline-none transition-all hover:border-red-500/40 focus:border-red-500/50 cursor-pointer shadow-inner"
                >
                  <span className="truncate">{queue}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${dropdownOpen ? "rotate-180 text-red-400" : ""}`} />
                </button>

                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-xl border border-white/10 bg-neutral-950/90 backdrop-blur-2xl shadow-2xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      {queues.map(([q]) => (
                        <button
                          key={q}
                          type="button"
                          onClick={() => {
                            setQueue(q);
                            setDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 font-mono text-xs transition-colors flex items-center justify-between ${
                            queue === q 
                              ? "bg-red-950/40 text-red-200 font-semibold border-l-2 border-red-500" 
                              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                          }`}
                        >
                          <span>{q}</span>
                          {queue === q && <span className="h-1.5 w-1.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </Field>

            <Field label="Payload (JSON)">
              <textarea
                value={payload}
                onChange={(ev) => setPayload(ev.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/10 bg-black/40 p-3 font-mono text-xs text-foreground backdrop-blur-md outline-none transition-colors focus:border-red-500/50 resize-none shadow-inner"
              />
            </Field>

            <div className="grid grid-cols-3 gap-2">
              <Field label="Priority"><Num v={priority} on={setPriority} /></Field>
              <Field label="Delay (ms)"><Num v={delayMs} on={setDelayMs} step={500} /></Field>
              <Field label="Retries"><Num v={maxAttempts} on={setMaxAttempts} /></Field>
            </div>

            <button
              onClick={() => e.enqueue({ queue, payload, priority, delayMs, maxAttempts })}
              className="group/btn flex items-center justify-center gap-2 w-full rounded-xl border border-red-500/30 bg-red-950/20 py-2.5 text-xs font-semibold text-red-50 backdrop-blur-md transition-all duration-300 hover:bg-red-900/30 hover:border-red-500/60 active:scale-95 shadow-[0_4px_12px_rgba(239,68,68,0.15)] mt-2"
            >
              <Send className="h-3.5 w-3.5 text-red-400 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
              Push job
            </button>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => { for (let i = 0; i < 10; i++) e.enqueue({ queue, payload, priority }); }}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-all duration-200 hover:bg-white/10 hover:text-foreground active:scale-95"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                +10 jobs
              </button>
              <button
                onClick={() => e.enqueue({ queue, payload: "{\"will_fail\":true}", maxAttempts: 2 })}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-950/10 py-2 text-xs font-medium text-red-300 backdrop-blur-md transition-all duration-200 hover:bg-red-950/30 hover:border-red-500/40 active:scale-95"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                Flaky job
              </button>
            </div>
          </div>
        </div>

        {/* Workers & Queues Pipeline */}
        <div className="space-y-6 lg:col-span-2">
          {/* Workers Grid */}
          <div className="space-y-4">
            <SectionHeader title="Workers" description="Job consumers and processing status" />
            <div className="grid gap-3 sm:grid-cols-3">
              {e.state.workers.map((w) => (
                <div 
                  key={w.id}
                  className={`group relative rounded-2xl border bg-white/[0.02] p-4 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                    w.alive 
                      ? "border-white/10 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]" 
                      : "border-red-950/40 bg-red-950/[0.02] opacity-75"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-foreground">{w.id}</span>
                    <div className="relative flex h-2.5 w-2.5">
                      {w.alive && w.busy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>}
                      {w.alive && !w.busy && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${!w.alive ? "bg-neutral-600" : w.busy ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"}`} />
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    {w.alive ? (w.busy ? `Processing ${w.currentJobId}` : "Idle") : "Stopped"}
                  </p>

                  <div className="mt-3 flex gap-4 text-xs font-mono">
                    <span className="text-emerald-400">{w.processed} done</span>
                    <span className="text-red-400">{w.failed} failed</span>
                  </div>

                  <button
                    onClick={() => w.alive ? e.killWorker(w.id) : e.reviveWorker(w.id)}
                    className="mt-3 w-full rounded-xl border border-white/5 bg-black/40 py-1.5 text-[11px] font-medium text-muted-foreground backdrop-blur-md transition-all duration-200 hover:border-red-500/30 hover:bg-red-950/20 hover:text-red-200 active:scale-95"
                  >
                    {w.alive ? "Stop worker" : "Start worker"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Active Queues */}
          {queues.map(([qName, jobs]) => (
            <div 
              key={qName}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-foreground tracking-wide">Queue: {qName}</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/80">{jobs.length} pending jobs</div>
                </div>
                <div className="rounded-full border border-red-500/30 bg-red-950/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300 font-mono">
                  Active
                </div>
              </div>

              <div className="scroll-area h-[280px] overflow-y-auto space-y-1.5 pr-1 bg-black/40 rounded-xl p-3 border border-white/5 shadow-inner">
                {jobs.length === 0 && (
                  <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground/50">
                    No jobs in queue
                  </div>
                )}
                {jobs.map((j) => (
                  <div key={j.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 py-2 font-mono text-[11px] backdrop-blur-sm transition-colors hover:border-red-500/20">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                      j.status === "processing" 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                        : "bg-white/5 text-muted-foreground border-white/5"
                    }`}>
                      {j.status}
                    </span>
                    <span className="flex-1 truncate text-red-400 font-medium">{j.id}</span>
                    {j.priority > 0 && <span className="rounded bg-sky-500/10 px-1.5 py-0.5 text-[10px] text-sky-400 border border-sky-500/20">P{j.priority}</span>}
                    {j.attempts > 0 && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400 border border-amber-500/20">×{j.attempts}</span>}
                    {j.delayUntil && j.delayUntil > Date.now() && (
                      <span className="text-muted-foreground">in {Math.round((j.delayUntil - Date.now()) / 1000)}s</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Dead Letter Queue */}
          {e.state.dlq.length > 0 && (
            <div className="group relative rounded-2xl border border-red-500/30 bg-red-950/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:shadow-[0_8px_30px_rgba(239,68,68,0.12)]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-semibold text-red-200 tracking-wide">Dead letter queue</div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400">{e.state.dlq.length} failed jobs requiring attention</div>
                </div>
                <div className="rounded-full border border-red-500/40 bg-red-900/30 px-2.5 py-0.5 text-[10px] font-semibold text-red-200 font-mono">
                  DLQ
                </div>
              </div>

              <div className="scroll-area h-[240px] overflow-y-auto space-y-1.5 pr-1 bg-black/40 rounded-xl p-3 border border-red-500/10 shadow-inner">
                {e.state.dlq.map((j) => (
                  <div key={j.id} className="flex items-center justify-between gap-2 rounded-lg border border-red-500/20 bg-red-950/10 px-3 py-2 font-mono text-[11px] backdrop-blur-sm transition-colors">
                    <span className="truncate text-red-400 font-medium">{j.id}</span>
                    <span className="flex-1 truncate text-muted-foreground">{j.failReason}</span>
                    <button 
                      onClick={() => e.retryDlq(j.id)} 
                      className="group/retry flex items-center gap-1 rounded-lg border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-[11px] font-semibold text-red-200 backdrop-blur-md transition-all duration-200 hover:bg-red-900/40 hover:border-red-500/60 active:scale-95"
                    >
                      <RefreshCw className="h-3 w-3 text-red-400 transition-transform duration-300 group-hover/retry:rotate-180" />
                      Retry
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-muted-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function Num({ v, on, step = 1 }: { v: number; on: (n: number) => void; step?: number }) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        step={step}
        value={v}
        onChange={(ev) => on(Number(ev.target.value))}
        className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 pr-6 font-mono text-xs text-foreground backdrop-blur-md outline-none transition-colors focus:border-red-500/50 shadow-inner"
      />
      <div className="absolute right-1 flex flex-col justify-center h-full">
        <button
          type="button"
          onClick={() => on(v + step)}
          className="h-3 w-4 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
        >
          <ChevronUp className="h-2.5 w-2.5" />
        </button>
        <button
          type="button"
          onClick={() => on(Math.max(0, v - step))}
          className="h-3 w-4 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors"
        >
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
}