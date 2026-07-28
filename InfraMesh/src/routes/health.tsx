import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
import { Power, RefreshCw, Cpu, HardDrive, Database, Activity } from "lucide-react";

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
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] py-4 px-6 backdrop-blur-xl shadow-2xl overflow-hidden">
  <div className="absolute inset-0 glass-card-shine pointer-events-none" />
  <PageHeader
    title="Node Health"
    subtitle="Per-node heartbeats, resource usage, and failover simulation controls."
  />
</div>  

      <div className="space-y-4">
        <SectionHeader title="Cluster nodes" description="Real-time instance telemetry and status" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {e.state.nodes.map((n) => (
            <div 
              key={n.id}
              className={`group relative rounded-2xl border bg-white/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                n.alive 
                  ? "border-white/10 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]" 
                  : "border-red-950/40 bg-red-950/[0.02] opacity-75"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono text-sm font-semibold text-foreground tracking-wide">{n.id}</div>
                  <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/80">
                    {n.role}{n.primaryOf ? ` · replica of ${n.primaryOf}` : ""}
                  </div>
                </div>
                <div className="relative flex h-2.5 w-2.5 mt-1">
                  {n.alive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>}
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${n.alive ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "bg-neutral-600"}`}></span>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Bar label="CPU" value={n.cpu * 100} suffix="%" color="#ef4444" />
                <Bar label="Memory" value={(n.mem / n.memMax) * 100} suffix={`% (${(n.memMax / 1024).toFixed(0)}K)`} color="#a855f7" />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-1 rounded-xl border border-white/5 bg-black/40 px-3 py-2.5 font-mono text-[11px] text-muted-foreground text-center shadow-inner">
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">{n.store.size}</span>
                  <span className="text-[9px] uppercase tracking-wider">keys</span>
                </div>
                <div className="flex flex-col border-x border-white/5">
                  <span className="font-bold text-foreground">{n.hits}/{n.misses}</span>
                  <span className="text-[9px] uppercase tracking-wider">hit/miss</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-foreground">{n.evictions}</span>
                  <span className="text-[9px] uppercase tracking-wider">evict</span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground/80 px-1">
                <span>Last heartbeat</span>
                <span className="font-mono">{Math.round((Date.now() - n.lastHeartbeat) / 1000)}s ago</span>
              </div>

              <button
                onClick={() => n.alive ? e.killNode(n.id) : e.reviveNode(n.id)}
                className={`mt-4 group/btn flex items-center justify-center gap-2 w-full rounded-xl border py-2.5 text-xs font-semibold backdrop-blur-md transition-all duration-300 active:scale-95 ${
                  n.alive
                    ? "border-red-500/30 bg-red-950/20 text-red-200 hover:bg-red-900/30 hover:border-red-500/60 shadow-[0_4px_12px_rgba(239,68,68,0.1)]"
                    : "border-emerald-500/30 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-900/30 hover:border-emerald-500/60 shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
                }`}
              >
                {n.alive ? (
                  <>
                    <Power className="h-3.5 w-3.5 text-red-400 transition-transform duration-300 group-hover/btn:scale-110" />
                    Simulate failure
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 text-emerald-400 transition-transform duration-300 group-hover/btn:rotate-180" />
                    Restart node
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({ label, value, suffix, color }: { label: string; value: number; suffix: string; color: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between font-mono text-[11px]">
        <span className="text-muted-foreground/80">{label}</span>
        <span className="text-foreground font-medium">{v.toFixed(0)}{suffix}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/40 border border-white/5 p-0.5 shadow-inner">
        <div 
          className="h-full rounded-full transition-all duration-500 shadow-sm" 
          style={{ width: `${v}%`, background: color, boxShadow: `0 0 10px ${color}66` }} 
        />
      </div>
    </div>
  );
}