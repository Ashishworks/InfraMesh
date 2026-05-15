import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";

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
      <PageHeader title="Cluster Topology" subtitle="Sharded primaries with paired replicas. Click a node to simulate failure." />

      <div className="grid lg:grid-cols-[2fr_1fr] gap-4">
        <div className="glass p-6 relative overflow-visible">
          <svg
  viewBox={`-40 -60 ${W + 80} ${H + 120}`}
  className="w-full h-[420px]"
>
            <defs>
              <radialGradient id="ring" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="oklch(0.82 0.16 200 / 0)" />
                <stop offset="100%" stopColor="oklch(0.82 0.16 200 / 0.3)" />
              </radialGradient>
            </defs>
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="url(#ring)" strokeWidth="32" />
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="oklch(0.82 0.16 200 / 0.4)" strokeDasharray="2 6" />
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
                      stroke={replica.alive && n.alive ? "oklch(0.78 0.18 160 / 0.6)" : "oklch(0.65 0.24 20 / 0.6)"}
                      strokeWidth="1.5" className="flow-line" />
                  )}
                  <NodeDot x={x} y={y} label={n.id} alive={n.alive} role="primary" onClick={() => n.alive ? e.killNode(n.id) : e.reviveNode(n.id)} />
                  {replica && <NodeDot x={rx} y={ry} label={replica.id} alive={replica.alive} role="replica" onClick={() => replica.alive ? e.killNode(replica.id) : e.reviveNode(replica.id)} />}
                </g>
              );
            })}
            <text x={cx} y={cy - 4} textAnchor="middle" className="fill-current" fill="oklch(0.7 0.04 270)" fontSize="11">consistent-hash ring</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fill="oklch(0.82 0.16 200)" fontSize="20" fontWeight="600" fontFamily="ui-monospace">{primaries.filter(p=>p.alive).length}/{primaries.length}</text>
          </svg>
          <div className="text-[11px] text-muted-foreground text-center -mt-2">click any node to toggle UP/DOWN — keys re-route to surviving primaries</div>
        </div>

        <div className="space-y-3">
          <div className="glass p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">Shard placement</div>
            <div className="space-y-1 font-mono text-[11px] max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
              {samples.map((k) => {
                const node = e.nodeForKey(k);
                return (
                  <div key={k} className="flex justify-between border-b border-border/30 py-0.5 last:border-0">
                    <span className="text-foreground/80">{k}</span>
                    <span className={node ? "text-primary" : "text-destructive"}>{node?.id ?? "no node"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const samples = ["user:1","user:2","user:3","user:42","user:99","session:a","session:b","cart:7","order:2025","prod:books","prod:games","metric:cpu","metric:mem","feature:beta","auth:token"];

function NodeDot({ x, y, label, alive, role, onClick }: { x: number; y: number; label: string; alive: boolean; role: "primary" | "replica"; onClick: () => void }) {
  const color = !alive ? "oklch(0.65 0.24 20)" : role === "primary" ? "oklch(0.82 0.16 200)" : "oklch(0.78 0.18 160)";
  return (
    <g onClick={onClick} style={{ cursor: "pointer" }}>
      {alive && <circle cx={x} cy={y} r={role === "primary" ? 22 : 14} fill={color} opacity={0.18} />}
      <circle cx={x} cy={y} r={role === "primary" ? 14 : 9} fill={color} stroke="oklch(0.18 0.035 270)" strokeWidth="2" />
      <text x={x} y={y + (role === "primary" ? 32 : 24)} textAnchor="middle" fill="oklch(0.85 0.02 240)" fontSize="10" fontFamily="ui-monospace">{label}</text>
    </g>
  );
}
