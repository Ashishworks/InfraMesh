import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
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

function MetricsPage() {
  const e = useEngine();
  const data = e.state.metrics.map((s, i) => ({
    i, rps: +s.rps.toFixed(1), p95: +s.latencyP95.toFixed(1),
    hit: +(s.hitRatio * 100).toFixed(1), q: s.qDepth,
    cpu: +(s.cpu * 100).toFixed(0), mem: +(s.mem / 1024).toFixed(2),
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader title="Metrics" subtitle="60-second rolling window aggregated from the gateway, cache and workers." />
      <div className="grid lg:grid-cols-2 gap-4">
        <Chart title="Throughput (req/s)" data={data} k="rps" color="var(--cyan)" type="area" />
        <Chart title="Latency P95 (ms)" data={data} k="p95" color="var(--violet)" type="area" />
        <Chart title="Cache hit ratio (%)" data={data} k="hit" color="var(--success)" type="line" domain={[0,100]} />
        <Chart title="Queue depth" data={data} k="q" color="var(--warning)" type="area" />
        <Chart title="CPU avg (%)" data={data} k="cpu" color="var(--cyan)" type="line" domain={[0,100]} />
        <Chart title="Memory (KB)" data={data} k="mem" color="var(--violet)" type="area" />
      </div>
    </div>
  );
}

function Chart({ title, data, k, color, type, domain }: { title: string; data: any[]; k: string; color: string; type: "area" | "line"; domain?: [number, number] }) {
  return (
    <div className="glass p-5">
      <div className="flex justify-between mb-2">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">{title}</div>
        <div className="text-[10px] font-mono text-muted-foreground">live</div>
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data}>
              <defs>
                <linearGradient id={`m-${k}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.55} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="oklch(0.4 0.04 275 / 0.2)" strokeDasharray="3 3" />
              <XAxis dataKey="i" hide />
              <YAxis stroke="oklch(0.6 0.03 270)" fontSize={10} width={40} domain={domain as any} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.035 270)", border: "1px solid oklch(0.4 0.05 275 / 0.6)", borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey={k} stroke={color} strokeWidth={2} fill={`url(#m-${k})`} />
            </AreaChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid stroke="oklch(0.4 0.04 275 / 0.2)" strokeDasharray="3 3" />
              <XAxis dataKey="i" hide />
              <YAxis stroke="oklch(0.6 0.03 270)" fontSize={10} width={40} domain={domain as any} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.035 270)", border: "1px solid oklch(0.4 0.05 275 / 0.6)", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey={k} stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
