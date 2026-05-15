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
            onClick={() => e.enqueue({ queue, payload, priority, delayMs, maxAttempts })}
            className="w-full rounded-md py-2 text-sm font-medium text-primary-foreground bg-gradient-to-r from-primary to-accent hover:opacity-90 glow-cyan"
          >PUSH job</button>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button onClick={() => { for (let i=0;i<10;i++) e.enqueue({ queue, payload, priority }); }} className="text-xs rounded-md py-1.5 border border-border/50 hover:border-primary/50">+10 jobs</button>
            <button onClick={() => e.enqueue({ queue, payload: "{\"will_fail\":true}", maxAttempts: 2 })} className="text-xs rounded-md py-1.5 border border-border/50 hover:border-destructive/50">flaky job</button>
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
            <div key={qName} className="glass p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-mono text-sm grad-text font-semibold">#{qName}</div>
                <div className="text-[11px] text-muted-foreground">{jobs.length} pending</div>
              </div>
              <div className="space-y-1 max-h-56 overflow-auto">
                {jobs.length === 0 && <div className="text-[11px] text-muted-foreground/60 font-mono">empty</div>}
                {jobs.slice(0, 30).map((j) => (
                  <div key={j.id} className="flex items-center gap-2 text-[11px] font-mono py-1 border-b border-border/30 last:border-0">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${j.status === "processing" ? "bg-warning/20 text-warning" : "bg-muted/40 text-muted-foreground"}`}>{j.status}</span>
                    <span className="text-primary truncate flex-1">{j.id}</span>
                    {j.priority > 0 && <span className="text-accent">p{j.priority}</span>}
                    {j.attempts > 0 && <span className="text-warning">×{j.attempts}</span>}
                    {j.delayUntil && j.delayUntil > Date.now() && <span className="text-muted-foreground">in {Math.round((j.delayUntil-Date.now())/1000)}s</span>}
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
              <div className="space-y-1 max-h-48 overflow-auto">
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
