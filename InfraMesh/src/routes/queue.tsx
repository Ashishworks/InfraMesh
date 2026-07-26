import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
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
      <PageHeader
        title="Queue Playground"
        subtitle="Push, schedule, and retry jobs across producer → queue → worker pipeline."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Producer" description="Configure and enqueue a new job">
          <div className="space-y-4">
            <Field label="Queue">
              <select value={queue} onChange={(ev) => setQueue(ev.target.value)} className="input-field">
                {queues.map(([q]) => <option key={q} value={q}>{q}</option>)}
              </select>
            </Field>
            <Field label="Payload (JSON)">
              <textarea
                value={payload}
                onChange={(ev) => setPayload(ev.target.value)}
                rows={3}
                className="input-field font-mono text-xs"
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Priority"><Num v={priority} on={setPriority} /></Field>
              <Field label="Delay (ms)"><Num v={delayMs} on={setDelayMs} step={500} /></Field>
              <Field label="Retries"><Num v={maxAttempts} on={setMaxAttempts} /></Field>
            </div>
            <button
              onClick={() => e.enqueue({ queue, payload, priority, delayMs, maxAttempts })}
              className="btn-primary w-full"
            >
              Push job
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { for (let i = 0; i < 10; i++) e.enqueue({ queue, payload, priority }); }}
                className="btn-outline py-2 text-xs"
              >
                +10 jobs
              </button>
              <button
                onClick={() => e.enqueue({ queue, payload: "{\"will_fail\":true}", maxAttempts: 2 })}
                className="rounded-md border border-destructive/30 bg-destructive/10 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/15"
              >
                Flaky job
              </button>
            </div>
          </div>
        </Panel>

        <div className="space-y-6 lg:col-span-2">
          <div>
            <SectionHeader title="Workers" description="Job consumers and processing status" />
            <div className="grid gap-3 sm:grid-cols-3">
              {e.state.workers.map((w) => (
                <Panel key={w.id} noPadding>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-medium">{w.id}</span>
                      <span className={`status-dot ${!w.alive ? "bg-destructive" : w.busy ? "bg-warning pulse-dot" : "bg-success"}`} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {w.alive ? (w.busy ? `Processing ${w.currentJobId}` : "Idle") : "Stopped"}
                    </p>
                    <div className="mt-3 flex gap-4 text-xs">
                      <span className="text-success">{w.processed} done</span>
                      <span className="text-destructive">{w.failed} failed</span>
                    </div>
                    <button
                      onClick={() => w.alive ? e.killWorker(w.id) : e.reviveWorker(w.id)}
                      className="mt-3 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {w.alive ? "Stop worker" : "Start worker"}
                    </button>
                  </div>
                </Panel>
              ))}
            </div>
          </div>

          {queues.map(([qName, jobs]) => (
            <Panel
              key={qName}
              title={`Queue: ${qName}`}
              description={`${jobs.length} pending`}
              noPadding
            >
              <div className="scroll-area max-h-56 px-5 pb-4">
                {jobs.length === 0 && (
                  <p className="py-4 text-xs text-muted-foreground">No jobs in queue</p>
                )}
                {jobs.slice(0, 30).map((j) => (
                  <div key={j.id} className="flex items-center gap-2 border-b border-border/30 py-2 font-mono text-[11px] last:border-0">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase ${
                      j.status === "processing" ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
                    }`}>
                      {j.status}
                    </span>
                    <span className="flex-1 truncate text-primary">{j.id}</span>
                    {j.priority > 0 && <span className="text-info">P{j.priority}</span>}
                    {j.attempts > 0 && <span className="text-warning">×{j.attempts}</span>}
                    {j.delayUntil && j.delayUntil > Date.now() && (
                      <span className="text-muted-foreground">in {Math.round((j.delayUntil - Date.now()) / 1000)}s</span>
                    )}
                  </div>
                ))}
              </div>
            </Panel>
          ))}

          {e.state.dlq.length > 0 && (
            <Panel title="Dead letter queue" description={`${e.state.dlq.length} failed jobs`} variant="danger" noPadding>
              <div className="scroll-area max-h-48 px-5 pb-4">
                {e.state.dlq.map((j) => (
                  <div key={j.id} className="flex items-center justify-between gap-2 border-b border-border/30 py-2 font-mono text-[11px] last:border-0">
                    <span className="truncate text-destructive">{j.id}</span>
                    <span className="flex-1 truncate text-muted-foreground">{j.failReason}</span>
                    <button onClick={() => e.retryDlq(j.id)} className="font-medium text-primary hover:underline">
                      Retry
                    </button>
                  </div>
                ))}
              </div>
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Num({ v, on, step = 1 }: { v: number; on: (n: number) => void; step?: number }) {
  return (
    <input
      type="number"
      step={step}
      value={v}
      onChange={(ev) => on(Number(ev.target.value))}
      className="input-field font-mono text-sm"
    />
  );
}
