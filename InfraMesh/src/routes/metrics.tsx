import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/metrics")({
  head: () => ({
    meta: [
      { title: "Metrics · InfraMesh" },
      { name: "description", content: "Time-series charts for throughput, latency, hit ratio, queue depth, CPU and memory." },
    ],
  }),
  component: MetricsPage,
});

const CHARTS = [
  { title: "Throughput", unit: "req/s", k: "rps", color: "var(--chart-1)", type: "area" as const },
  { title: "Latency P95", unit: "ms", k: "p95", color: "var(--chart-2)", type: "area" as const },
  { title: "Cache hit ratio", unit: "%", k: "hit", color: "var(--chart-3)", type: "line" as const, domain: [0, 100] as [number, number] },
  { title: "Queue depth", unit: "jobs", k: "q", color: "var(--chart-4)", type: "area" as const },
  { title: "CPU average", unit: "%", k: "cpu", color: "var(--chart-1)", type: "line" as const, domain: [0, 100] as [number, number] },
  { title: "Memory", unit: "KB", k: "mem", color: "var(--chart-2)", type: "area" as const },
];

function MetricsPage() {
  const e = useEngine();
  const data = e.state.metrics.map((s, i) => ({
    i, rps: +s.rps.toFixed(1), p95: +s.latencyP95.toFixed(1),
    hit: +(s.hitRatio * 100).toFixed(1), q: s.qDepth,
    cpu: +(s.cpu * 100).toFixed(0), mem: +(s.mem / 1024).toFixed(2),
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Metrics"
        subtitle="60-second rolling window aggregated from gateway, cache, and workers."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {CHARTS.map((c) => (
          <Chart key={c.k} {...c} data={data} />
        ))}
      </div>
    </div>
  );
}

function Chart({ title, unit, data, k, color, type, domain }: {
  title: string; unit: string; data: any[]; k: string; color: string;
  type: "area" | "line"; domain?: [number, number];
}) {
  return (
    <Panel title={title} description={unit} noPadding>
      <div className="px-5 pb-5 pt-1">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            {type === "area" ? (
              <AreaChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id={`m-${k}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" hide />
                <YAxis stroke="var(--chart-axis)" fontSize={10} width={40} domain={domain as any} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey={k} stroke={color} strokeWidth={2} fill={`url(#m-${k})`} />
              </AreaChart>
            ) : (
              <LineChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" hide />
                <YAxis stroke="var(--chart-axis)" fontSize={10} width={40} domain={domain as any} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "var(--chart-tooltip-bg)", border: "1px solid var(--chart-tooltip-border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2} dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </Panel>
  );
}
