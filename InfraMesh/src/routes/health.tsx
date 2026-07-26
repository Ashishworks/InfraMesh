import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";

export const Route = createFileRoute("/health")({
  head: () => ({
    meta: [
      { title: "Node Health · InfraMesh" },
      { name: "description", content: "Per-node heartbeat, CPU, memory and replication lag. Simulate failures and recoveries." },
    ],
  }),
  component: HealthPage,
});

function HealthPage() {
  const e = useEngine();
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Node Health"
        subtitle="Per-node heartbeats, resource usage, and failover simulation controls."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {e.state.nodes.map((n) => (
          <Panel key={n.id}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-sm font-semibold text-foreground">{n.id}</div>
                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {n.role}{n.primaryOf ? ` · replica of ${n.primaryOf}` : ""}
                </div>
              </div>
              <span className={`status-dot ${n.alive ? "bg-success pulse-dot" : "bg-destructive"}`} />
            </div>

            <div className="mt-4 space-y-3">
              <Bar label="CPU" value={n.cpu * 100} suffix="%" color="var(--chart-1)" />
              <Bar label="Memory" value={(n.mem / n.memMax) * 100} suffix={`% of ${(n.memMax / 1024).toFixed(0)} KB`} color="var(--chart-2)" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-md bg-secondary/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
              <span>{n.store.size} keys</span>
              <span>{n.hits}/{n.misses} hit</span>
              <span>{n.evictions} evict</span>
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground">
              Last heartbeat {Math.round((Date.now() - n.lastHeartbeat) / 1000)}s ago
            </p>

            <button
              onClick={() => n.alive ? e.killNode(n.id) : e.reviveNode(n.id)}
              className={`mt-4 w-full rounded-md border py-2 text-xs font-medium transition-colors ${
                n.alive
                  ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                  : "border-success/30 text-success hover:bg-success/10"
              }`}
            >
              {n.alive ? "Simulate failure" : "Restart node"}
            </button>
          </Panel>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div>
      <div className="mb-1.5 flex justify-between font-mono text-[11px]">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground">{v.toFixed(0)}{suffix}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full transition-all duration-300" style={{ width: `${v}%`, background: color }} />
      </div>
    </div>
  );
}
