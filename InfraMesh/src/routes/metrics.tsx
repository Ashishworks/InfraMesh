import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { SectionHeader } from "@/components/inframesh/SectionHeader";
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
  { title: "Throughput", unit: "req/s", k: "rps", color: "#ef4444", type: "area" as const },
  { title: "Latency P95", unit: "ms", k: "p95", color: "#38bdf8", type: "area" as const },
  { title: "Cache hit ratio", unit: "%", k: "hit", color: "#34d399", type: "line" as const, domain: [0, 100] as [number, number] },
  { title: "Queue depth", unit: "jobs", k: "q", color: "#fbbf24", type: "area" as const },
  { title: "CPU average", unit: "%", k: "cpu", color: "#ef4444", type: "line" as const, domain: [0, 100] as [number, number] },
  { title: "Memory", unit: "KB", k: "mem", color: "#a855f7", type: "area" as const },
];

function MetricsPage() {
  const e = useEngine();
  const data = e.state.metrics.map((s, i) => ({
    i, rps: +s.rps.toFixed(1), p95: +s.latencyP95.toFixed(1),
    hit: +(s.hitRatio * 100).toFixed(1), q: s.qDepth,
    cpu: +(s.cpu * 100).toFixed(0), mem: +(s.mem / 1024).toFixed(2),
  }));

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
          title="Metrics"
          subtitle="60-second rolling window aggregated from gateway, cache, and workers."
        />
      </div>

      <div className="space-y-4">
        <SectionHeader title="Performance telemetry" description="Live real-time streaming metrics" />
        <div className="grid gap-6 lg:grid-cols-2">
          {CHARTS.map((c) => (
            <Chart key={c.k} {...c} data={data} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Chart({ title, unit, data, k, color, type, domain }: {
  title: string; unit: string; data: any[]; k: string; color: string;
  type: "area" | "line"; domain?: [number, number];
}) {
  return (
    <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-1 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
      <Panel title={title} description={unit} noPadding>
        <div className="px-5 pb-5 pt-2">
          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {type === "area" ? (
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`m-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={color} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={10} width={40} domain={domain as any} tickLine={false} axisLine={false} />
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
                    dataKey={k} 
                    stroke={color} 
                    strokeWidth={2.5} 
                    fill={`url(#m-${k})`} 
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: color }}
                  />
                </AreaChart>
              ) : (
                <LineChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255, 255, 255, 0.04)" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="i" hide />
                  <YAxis stroke="rgba(255, 255, 255, 0.3)" fontSize={10} width={40} domain={domain as any} tickLine={false} axisLine={false} />
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
                  <Line 
                    type="monotone" 
                    dataKey={k} 
                    stroke={color} 
                    strokeWidth={2.5} 
                    dot={false} 
                    activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2, fill: color }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </Panel>
    </div>
  );
}