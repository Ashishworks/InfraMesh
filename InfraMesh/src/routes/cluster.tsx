import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";

export const Route = createFileRoute("/cluster")({
  head: () => ({
    meta: [
      { title: "Cluster Topology · InfraMesh" },
      { name: "description", content: "Visualize primary/replica topology, replication links, and consistent-hash key placement." },
    ],
  }),
  component: ClusterPage,
});

function ClusterPage() {
  const e = useEngine();
  const primaries = e.state.nodes.filter((n) => n.role === "primary");
  const W = 720, H = 360;
  const cx = W / 2, cy = H / 2, R = 130;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cluster Topology"
        subtitle="Sharded primaries with paired replicas. Click a node to simulate failure or recovery."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Hash ring" description="Click any node to toggle up/down" noPadding>
          <div className="px-4 pb-4">
            <svg viewBox={`-40 -60 ${W + 80} ${H + 120}`} className="h-[400px] w-full">
              <defs>
                <radialGradient id="ring" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="oklch(0.58 0.22 25 / 0)" />
                  <stop offset="100%" stopColor="oklch(0.58 0.22 25 / 0.2)" />
                </radialGradient>
              </defs>
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="url(#ring)" strokeWidth="28" />
              <circle cx={cx} cy={cy} r={R} fill="none" stroke="oklch(0.58 0.22 25 / 0.3)" strokeDasharray="2 6" />
              {primaries.map((n, i) => {
                const angle = (i / primaries.length) * Math.PI * 2 - Math.PI / 2;
                const x = cx + Math.cos(angle) * R;
                const y = cy + Math.sin(angle) * R;
                const replica = e.state.nodes.find((r) => r.role === "replica" && r.primaryOf === n.id);
                const rx = cx + Math.cos(angle) * (R + 75);
                const ry = cy + Math.sin(angle) * (R + 75);
                return (
                  <g key={n.id}>
                    {replica && (
                      <line x1={x} y1={y} x2={rx} y2={ry}
                        stroke={replica.alive && n.alive ? "oklch(0.64 0.15 155 / 0.5)" : "oklch(0.52 0.24 22 / 0.5)"}
                        strokeWidth="1.5" className="flow-line" />
                    )}
                    <NodeDot x={x} y={y} label={n.id} alive={n.alive} role="primary" onClick={() => n.alive ? e.killNode(n.id) : e.reviveNode(n.id)} />
                    {replica && <NodeDot x={rx} y={ry} label={replica.id} alive={replica.alive} role="replica" onClick={() => replica.alive ? e.killNode(replica.id) : e.reviveNode(replica.id)} />}
                  </g>
                );
              })}
              <text x={cx} y={cy - 4} textAnchor="middle" fill="oklch(0.55 0.016 25)" fontSize="11">consistent-hash ring</text>
              <text x={cx} y={cy + 14} textAnchor="middle" fill="oklch(0.58 0.22 25)" fontSize="20" fontWeight="600" fontFamily="ui-monospace">{primaries.filter(p=>p.alive).length}/{primaries.length}</text>
            </svg>
            <p className="text-center text-xs text-muted-foreground">
              Keys re-route automatically to surviving primaries on failure
            </p>
          </div>
        </Panel>

        <Panel title="Shard placement" description="Sample key → node mapping" noPadding>
          <div className="scroll-area max-h-[480px] px-5 pb-4">
            {samples.map((k) => {
              const node = e.nodeForKey(k);
              return (
                <div key={k} className="flex justify-between border-b border-border/30 py-2 font-mono text-[11px] last:border-0">
                  <span className="text-foreground/85">{k}</span>
                  <span className={node ? "font-medium text-primary" : "text-destructive"}>{node?.id ?? "unavailable"}</span>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}

const samples = ["user:1","user:2","user:3","user:42","user:99","session:a","session:b","cart:7","order:2025","prod:books","prod:games","metric:cpu","metric:mem","feature:beta","auth:token"];

function NodeDot({ x, y, label, alive, role, onClick }: { x: number; y: number; label: string; alive: boolean; role: "primary" | "replica"; onClick: () => void }) {
  const color = !alive ? "oklch(0.52 0.24 22)" : role === "primary" ? "oklch(0.58 0.22 25)" : "oklch(0.48 0.14 25)";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {alive && <circle cx={x} cy={y} r={role === "primary" ? 22 : 14} fill={color} opacity={0.15} />}
      <circle cx={x} cy={y} r={role === "primary" ? 14 : 9} fill={color} stroke="oklch(0.11 0.012 25)" strokeWidth="2" />
      <text x={x} y={y + (role === "primary" ? 32 : 24)} textAnchor="middle" fill="oklch(0.88 0.01 25)" fontSize="10" fontFamily="ui-monospace">{label}</text>
    </g>
  );
}
