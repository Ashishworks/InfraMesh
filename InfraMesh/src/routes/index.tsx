import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { StatCard } from "@/components/inframesh/StatCard";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
import { Panel } from "@/components/inframesh/Panel";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Activity, Database, Inbox, Network, Cpu, HardDrive, Zap, Workflow, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · InfraMesh" },
      { name: "description", content: "Live cluster overview: requests, cache hit ratio, queue depth, replication, and worker status." },
    ],
  }),
  component: Overview,
});

function fmt(n: number, d = 0) { return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: d }); }

function Overview() {
  const e = useEngine();
  const m = e.state.metrics;
  const last = m[m.length - 1];
  const totals = e.state.totals;
  const hitRatio = totals.cacheHits + totals.cacheMisses === 0 ? 0 : totals.cacheHits / (totals.cacheHits + totals.cacheMisses);
  const aliveNodes = e.state.nodes.filter((n) => n.alive).length;
  const aliveWorkers = e.state.workers.filter((w) => w.alive).length;
  const qDepth = Array.from(e.state.queues.values()).reduce((a, q) => a + q.length, 0);
  const memBytes = e.state.nodes.reduce((a, n) => a + n.mem, 0);
  const chartData = m.map((s, i) => ({ i, rps: +s.rps.toFixed(1), p95: +s.latencyP95.toFixed(1), hit: +(s.hitRatio * 100).toFixed(1), q: s.qDepth }));

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
          title="Cluster Overview"
          subtitle="Real-time view of every InfraMesh subsystem — throughput, cache, queues, and node health."
          actions={
            <button 
              onClick={() => e.reset()} 
              className="group flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-50 backdrop-blur-md transition-all duration-300 hover:bg-red-900/30 hover:border-red-500/60 active:scale-95 shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
            >
              <RotateCcw className="h-3.5 w-3.5 transition-transform duration-500 group-hover:-rotate-180 text-red-400" />
              Reset cluster
            </button>
          }
        />
      </div>

      <div>
        <SectionHeader title="Key metrics" description="Live aggregates across the simulated cluster" />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="Requests / sec" value={fmt(last?.rps ?? 0, 1)} sub={`${fmt(totals.req)} total · ${fmt(totals.err)} errors`} accent="primary" icon={<Activity className="w-4 h-4 text-red-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="Cache hit ratio" value={`${fmt(hitRatio * 100, 1)}%`} sub={`${fmt(totals.cacheHits)} hits · ${fmt(totals.cacheMisses)} misses`} accent="success" icon={<Database className="w-4 h-4 text-emerald-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="Queue depth" value={fmt(qDepth)} sub={`${e.state.dlq.length} in dead letter queue`} accent="warning" icon={<Inbox className="w-4 h-4 text-amber-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="Active nodes" value={`${aliveNodes}/${e.state.nodes.length}`} sub={`${aliveWorkers}/${e.state.workers.length} workers online`} accent="info" icon={<Network className="w-4 h-4 text-sky-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="P95 latency" value={`${fmt(last?.latencyP95 ?? 0, 1)} ms`} accent="info" icon={<Zap className="w-4 h-4 text-sky-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="CPU average" value={`${fmt((last?.cpu ?? 0) * 100, 0)}%`} accent="warning" icon={<Cpu className="w-4 h-4 text-amber-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="Memory" value={`${fmt(memBytes / 1024, 1)} KB`} sub="Across all primaries" accent="accent" icon={<HardDrive className="w-4 h-4 text-purple-400" />} />
          </div>
          <div className="transition-all duration-300 hover:-translate-y-1">
            <StatCard label="Replication" value="Healthy" sub={`${e.state.nodes.filter(n => n.role === "replica" && n.alive).length} replicas in sync`} accent="success" icon={<Workflow className="w-4 h-4 text-emerald-400" />} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SectionHeader title="Performance trends" description="Rolling 60-second window" />
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Throughput" unit="req/s" dataKey="rps" data={chartData} color="#ef4444" />
          <ChartCard title="P95 latency" unit="ms" dataKey="p95" data={chartData} color="#38bdf8" />
          <ChartCard title="Cache hit ratio" unit="%" dataKey="hit" data={chartData} color="#34d399" />
          <ChartCard title="Queue depth" unit="jobs" dataKey="q" data={chartData} color="#fbbf24" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, unit, data, dataKey, color }: { title: string; unit: string; data: any[]; dataKey: string; color: string }) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
      <Panel title={title} description={unit} noPadding>
        <div className="px-5 pb-5 pt-2">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" hide />
                <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={10} width={36} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ 
                    background: "rgba(0, 0, 0, 0.8)", 
                    border: "1px solid rgba(255, 255, 255, 0.1)", 
                    borderRadius: "12px", 
                    fontSize: "12px",
                    backdropFilter: "blur(12px)",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.5)"
                  }}
                  labelStyle={{ color: "rgba(255, 255, 255, 0.7)" }}
                  itemStyle={{ color: "#fff", fontWeight: 600 }}
                />
                <Area 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={color} 
                  strokeWidth={2.5} 
                  fill={`url(#g-${dataKey})`} 
                  activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: color }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
    </div>
  );
}