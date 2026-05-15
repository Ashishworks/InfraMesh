import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";

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
      <PageHeader title="Node Health" subtitle="Heartbeats, resource usage, and failover controls." />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {e.state.nodes.map((n) => (
          <div key={n.id} className="glass p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-mono text-sm grad-text font-semibold">{n.id}</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{n.role}{n.primaryOf ? ` · of ${n.primaryOf}` : ""}</div>
              </div>
              <span className={`h-2.5 w-2.5 rounded-full ${n.alive ? "bg-success pulse-dot" : "bg-destructive"}`} />
            </div>
            <Bar label="CPU" value={n.cpu * 100} suffix="%" color="var(--cyan)" />
            <Bar label="Memory" value={(n.mem / n.memMax) * 100} suffix={`% of ${(n.memMax/1024).toFixed(0)}KB`} color="var(--violet)" />
            <div className="grid grid-cols-3 gap-2 text-[11px] font-mono mt-3 text-muted-foreground">
              <span>{n.store.size} keys</span>
              <span>{n.hits}/{n.misses}</span>
              <span>{n.evictions} ev</span>
            </div>
            <div className="text-[10px] text-muted-foreground mt-2">heartbeat {Math.round((Date.now() - n.lastHeartbeat) / 1000)}s ago</div>
            <button
              onClick={() => n.alive ? e.killNode(n.id) : e.reviveNode(n.id)}
              className={`mt-3 w-full text-xs rounded-md py-1.5 border ${n.alive ? "border-destructive/40 text-destructive hover:bg-destructive/10" : "border-success/40 text-success hover:bg-success/10"}`}
            >{n.alive ? "kill node" : "restart node"}</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Bar({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-[11px] font-mono mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span>{v.toFixed(0)}{suffix}</span>
      </div>
      <div className="h-1.5 bg-secondary/40 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
    </div>
  );
}
