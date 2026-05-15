import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { StatCard } from "@/components/inframesh/StatCard";
import { PageHeader } from "@/components/inframesh/PageHeader";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { Activity, Database, Inbox, Network, Cpu, HardDrive, Zap, Workflow } from "lucide-react";

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
    <div className="animate-fade-in">
      <PageHeader
        title="Cluster Overview"
        subtitle="Real-time view of every InfraMesh subsystem."
        actions={
          <button onClick={() => e.reset()} className="text-xs px-3 py-2 rounded-md border border-border/60 hover:border-primary/60 hover:text-primary">Reset cluster</button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Requests / sec" value={fmt(last?.rps ?? 0, 1)} sub={`${fmt(totals.req)} total · ${fmt(totals.err)} err`} accent="cyan" icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Cache hit ratio" value={`${fmt(hitRatio * 100, 1)}%`} sub={`${fmt(totals.cacheHits)} hits / ${fmt(totals.cacheMisses)} miss`} accent="success" icon={<Database className="w-4 h-4" />} />
        <StatCard label="Queue depth" value={fmt(qDepth)} sub={`${e.state.dlq.length} in DLQ`} accent="violet" icon={<Inbox className="w-4 h-4" />} />
        <StatCard label="Active nodes" value={`${aliveNodes}/${e.state.nodes.length}`} sub={`${aliveWorkers}/${e.state.workers.length} workers`} accent="warning" icon={<Network className="w-4 h-4" />} />
        <StatCard label="P95 latency" value={`${fmt(last?.latencyP95 ?? 0, 1)} ms`} accent="cyan" icon={<Zap className="w-4 h-4" />} />
        <StatCard label="CPU avg" value={`${fmt((last?.cpu ?? 0) * 100, 0)}%`} accent="warning" icon={<Cpu className="w-4 h-4" />} />
        <StatCard label="Memory" value={`${fmt(memBytes / 1024, 1)} KB`} sub="across primaries" accent="violet" icon={<HardDrive className="w-4 h-4" />} />
        <StatCard label="Replication" value="HEALTHY" sub={`${e.state.nodes.filter(n => n.role === "replica" && n.alive).length} replicas in sync`} accent="success" icon={<Workflow className="w-4 h-4" />} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
        <ChartCard title="Throughput (req/s)" dataKey="rps" data={chartData} color="var(--cyan)" />
        <ChartCard title="P95 latency (ms)" dataKey="p95" data={chartData} color="var(--violet)" />
        <ChartCard title="Cache hit ratio (%)" dataKey="hit" data={chartData} color="var(--success)" />
        <ChartCard title="Queue depth" dataKey="q" data={chartData} color="var(--warning)" />
      </div>
    </div>
  );
}

function ChartCard({ title, data, dataKey, color }: { title: string; data: any[]; dataKey: string; color: string }) {
  return (
    <div className="glass p-5 relative scanline overflow-hidden">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
        <div className="text-[10px] text-muted-foreground font-mono">last 60s</div>
      </div>
      <div className="h-44">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.55} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="oklch(0.4 0.04 275 / 0.2)" strokeDasharray="3 3" />
            <XAxis dataKey="i" hide />
            <YAxis stroke="oklch(0.6 0.03 270)" fontSize={10} width={32} />
            <Tooltip
              contentStyle={{ background: "oklch(0.18 0.035 270)", border: "1px solid oklch(0.4 0.05 275 / 0.6)", borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: "oklch(0.7 0.03 270)" }}
            />
            <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
