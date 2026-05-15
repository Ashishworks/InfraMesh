import { ReactNode } from "react";

export function StatCard({
  label, value, sub, accent = "cyan", icon,
}: { label: string; value: ReactNode; sub?: ReactNode; accent?: "cyan" | "violet" | "success" | "warning"; icon?: ReactNode }) {
  const dot =
    accent === "cyan" ? "bg-primary" :
    accent === "violet" ? "bg-accent" :
    accent === "success" ? "bg-success" : "bg-warning";
  return (
    <div className="glass relative overflow-hidden p-5">
      <div className="flex items-center justify-between">
        <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <span className={`h-1.5 w-1.5 rounded-full ${dot} pulse-dot`} />
          {label}
        </div>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}
