import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { useState } from "react";

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

  const queues = Array.from(e.state.queues.entries());

  return (
    <div className="animate-fade-in">
      <PageHeader title="Queue Playground" subtitle="Push, schedule and retry jobs across producer → queue → worker." />

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="glass p-5 space-y-3">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Producer</div>
          <Field label="queue">
            <select value={queue} onChange={(e) => setQueue(e.target.value)} className="w-full bg-input/40 rounded-md px-2 py-1.5 text-sm border border-border/50">
              {queues.map(([q]) => <option key={q} value={q}>{q}</option>)}
            </select>
          </Field>
          <Field label="payload (JSON)">
            <textarea value={payload} onChange={(e) => setPayload(e.target.value)} rows={3}
              className="w-full bg-input/40 rounded-md px-2 py-1.5 text-xs font-mono border border-border/50" />
          </Field>
          <div className="grid grid-cols-3 gap-2">
            <Field label="priority"><Num v={priority} on={setPriority} /></Field>
            <Field label="delay ms"><Num v={delayMs} on={setDelayMs} step={500} /></Field>
            <Field label="retries"><Num v={maxAttempts} on={setMaxAttempts} /></Field>
          </div>
          <button
  onClick={() =>
    e.enqueue({ queue, payload, priority, delayMs, maxAttempts })
  }
  className="
    group relative w-full overflow-hidden
    rounded-xl border border-white/10
    bg-white/[0.04]
    backdrop-blur-xl
    px-3 py-2
    text-xs font-medium tracking-wide text-white/90
    shadow-[0_0_12px_rgba(255,255,255,0.04)]
    transition-all duration-300
    hover:border-white/20
    hover:bg-white/[0.08]
    hover:shadow-[0_0_20px_rgba(255,255,255,0.08)]
    hover:text-white
    active:scale-[0.98]
  "
>
  <span className="relative z-10 flex items-center justify-center gap-1.5">
    PUSH JOB
  </span>

  <div
    className="
      absolute inset-0 opacity-0
      bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.12),transparent)]
      transition duration-700
      group-hover:opacity-100
      group-hover:translate-x-full
      -translate-x-full
    "
  />
</button>
          <div className="grid grid-cols-2 gap-2 pt-2">
  <button
    onClick={() => {
      for (let i = 0; i < 10; i++) {
        e.enqueue({ queue, payload, priority });
      }
    }}
    className="
      group relative overflow-hidden
      rounded-xl border border-red-500/10
      bg-red-500/[0.04]
      backdrop-blur-xl
      py-1.5
      text-xs font-medium tracking-wide text-red-100
      shadow-[0_0_10px_rgba(239,68,68,0.08)]
      transition-all duration-300
      hover:border-red-400/20
      hover:bg-red-500/[0.08]
      hover:text-white
      hover:shadow-[0_0_18px_rgba(239,68,68,0.14)]
      active:scale-[0.98]
    "
  >
    <span className="relative z-10">+10 jobs</span>

    <div
      className="
        absolute inset-0 opacity-0
        bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]
        transition duration-700
        group-hover:opacity-100
        group-hover:translate-x-full
        -translate-x-full
      "
    />
  </button>

  <button
    onClick={() =>
      e.enqueue({
        queue,
        payload: "{\"will_fail\":true}",
        maxAttempts: 2,
      })
    }
    className="
      group relative overflow-hidden
      rounded-xl border border-red-500/10
      bg-red-500/[0.04]
      backdrop-blur-xl
      py-1.5
      text-xs font-medium tracking-wide text-red-100
      shadow-[0_0_10px_rgba(239,68,68,0.08)]
      transition-all duration-300
      hover:border-red-400/20
      hover:bg-red-500/[0.08]
      hover:text-white
      hover:shadow-[0_0_18px_rgba(239,68,68,0.14)]
      active:scale-[0.98]
    "
  >
    <span className="relative z-10">flaky job</span>

    <div
      className="
        absolute inset-0 opacity-0
        bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08),transparent)]
        transition duration-700
        group-hover:opacity-100
        group-hover:translate-x-full
        -translate-x-full
      "
    />
  </button>
</div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div className="grid sm:grid-cols-3 gap-3">
            {e.state.workers.map((w) => (
              <div key={w.id} className="glass p-4 relative overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm">{w.id}</span>
                  <span className={`h-2 w-2 rounded-full ${!w.alive ? "bg-destructive" : w.busy ? "bg-warning pulse-dot" : "bg-success"}`} />
                </div>
                <div className="text-[11px] text-muted-foreground">{w.alive ? (w.busy ? `processing ${w.currentJobId}` : "idle") : "stopped"}</div>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-success">{w.processed} done</span>
                  <span className="text-destructive">{w.failed} fail</span>
                </div>
                <button
                  onClick={() => w.alive ? e.killWorker(w.id) : e.reviveWorker(w.id)}
                  className="absolute top-3 right-6 text-[10px] text-muted-foreground hover:text-foreground"
                >{w.alive ? "stop" : "start"}</button>
              </div>
            ))}
          </div>

          {queues.map(([qName, jobs]) => (
            <div key={qName} className="glass p-4 backdrop-blur-xl border border-white/[0.04]">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-sm grad-text font-semibold">#{qName}</div>
                <div className="text-[11px] text-muted-foreground">{jobs.length} pending</div>
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {jobs.length === 0 && <div className="text-[11px] text-muted-foreground/60 font-mono">empty</div>}
                {jobs.slice(0, 30).map((j) => (
                  <div key={j.id} className="flex items-center gap-2 text-[11px] font-mono py-1 border-b border-border/30 last:border-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${j.status === "processing" ? "bg-warning/20 text-warning" : "bg-muted/40 text-muted-foreground"}`}>{j.status}</span>
                    <span className="text-primary truncate flex-1">{j.id}</span>
                    {j.priority > 0 && <span className="text-accent">p{j.priority}</span>}
                    {j.attempts > 0 && <span className="text-warning">×{j.attempts}</span>}
                    {j.delayUntil && j.delayUntil > Date.now() && <span className="text-muted-foreground">in {Math.round((j.delayUntil - Date.now()) / 1000)}s</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {e.state.dlq.length > 0 && (
            <div className="glass p-4 border-destructive/40">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-sm text-destructive font-semibold">Dead Letter Queue</div>
                <div className="text-[11px] text-muted-foreground">{e.state.dlq.length} jobs</div>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1 scroll-smooth scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {e.state.dlq.map((j) => (
                  <div key={j.id} className="flex items-center justify-between gap-2 py-1 text-[11px] font-mono border-b border-border/30 last:border-0">
                    <span className="text-destructive truncate">{j.id}</span>
                    <span className="text-muted-foreground truncate flex-1">{j.failReason}</span>
                    <button onClick={() => e.retryDlq(j.id)} className="text-primary hover:underline">retry</button>
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
    <label className="block">
      <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">{label}</div>
      {children}
    </label>
  );
}
function Num({ v, on, step = 1 }: { v: number; on: (n: number) => void; step?: number }) {
  return <input type="number" step={step} value={v} onChange={(e) => on(Number(e.target.value))} className="w-full bg-input/40 rounded-md px-2 py-1.5 text-sm font-mono border border-border/50" />;
}
