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
    <div className="animate-fade-in">
      <PageHeader
        title="Cluster Overview"
        subtitle="Real-time view of every InfraMesh subsystem — throughput, cache, queues, and node health."
        actions={
          <button onClick={() => e.reset()} className="btn-outline">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset cluster
          </button>
        }
      />

      <SectionHeader title="Key metrics" description="Live aggregates across the simulated cluster" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Requests / sec" value={fmt(last?.rps ?? 0, 1)} sub={`${fmt(totals.req)} total · ${fmt(totals.err)} errors`} accent="primary" icon={<Activity className="w-4 h-4" />} />
        <StatCard label="Cache hit ratio" value={`${fmt(hitRatio * 100, 1)}%`} sub={`${fmt(totals.cacheHits)} hits · ${fmt(totals.cacheMisses)} misses`} accent="success" icon={<Database className="w-4 h-4" />} />
        <StatCard label="Queue depth" value={fmt(qDepth)} sub={`${e.state.dlq.length} in dead letter queue`} accent="warning" icon={<Inbox className="w-4 h-4" />} />
        <StatCard label="Active nodes" value={`${aliveNodes}/${e.state.nodes.length}`} sub={`${aliveWorkers}/${e.state.workers.length} workers online`} accent="info" icon={<Network className="w-4 h-4" />} />
        <StatCard label="P95 latency" value={`${fmt(last?.latencyP95 ?? 0, 1)} ms`} accent="info" icon={<Zap className="w-4 h-4" />} />
        <StatCard label="CPU average" value={`${fmt((last?.cpu ?? 0) * 100, 0)}%`} accent="warning" icon={<Cpu className="w-4 h-4" />} />
        <StatCard label="Memory" value={`${fmt(memBytes / 1024, 1)} KB`} sub="Across all primaries" accent="accent" icon={<HardDrive className="w-4 h-4" />} />
        <StatCard label="Replication" value="Healthy" sub={`${e.state.nodes.filter(n => n.role === "replica" && n.alive).length} replicas in sync`} accent="success" icon={<Workflow className="w-4 h-4" />} />
      </div>

      <div className="mt-8">
        <SectionHeader title="Performance trends" description="Rolling 60-second window" />
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard title="Throughput" unit="req/s" dataKey="rps" data={chartData} color="var(--chart-1)" />
          <ChartCard title="P95 latency" unit="ms" dataKey="p95" data={chartData} color="var(--chart-2)" />
          <ChartCard title="Cache hit ratio" unit="%" dataKey="hit" data={chartData} color="var(--chart-3)" />
          <ChartCard title="Queue depth" unit="jobs" dataKey="q" data={chartData} color="var(--chart-4)" />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, unit, data, dataKey, color }: { title: string; unit: string; data: any[]; dataKey: string; color: string }) {
  return (
    <Panel title={title} description={unit} noPadding>
      <div className="px-5 pb-5 pt-1">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="i" hide />
              <YAxis stroke="var(--chart-axis)" fontSize={10} width={36} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "var(--chart-tooltip-label)" }}
              />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}
