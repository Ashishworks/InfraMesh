import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "primary" | "info" | "success" | "warning" | "accent";

const accentStyles: Record<Accent, { badge: string; dot: string }> = {
  primary: { badge: "icon-badge-primary", dot: "bg-primary" },
  info: { badge: "icon-badge-info", dot: "bg-info" },
  success: { badge: "icon-badge-success", dot: "bg-success" },
  warning: { badge: "icon-badge-warning", dot: "bg-warning" },
  accent: { badge: "icon-badge-accent", dot: "bg-accent" },
};

/** @deprecated use Accent names — kept for backward compat */
const legacyAccent: Record<string, Accent> = {
  cyan: "primary",
  violet: "info",
  success: "success",
  warning: "warning",
};

export function StatCard({
  label,
  value,
  sub,
  accent = "primary",
  icon,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: Accent | "cyan" | "violet" | "success" | "warning";
  icon?: ReactNode;
}) {
  const resolved = legacyAccent[accent] ?? (accent as Accent);
  const styles = accentStyles[resolved];

  return (
    <div className="panel p-5">
      <div className="flex items-start justify-between gap-3">
        {icon && (
          <div className={cn("icon-badge", styles.badge)}>{icon}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <span className={cn("status-dot", styles.dot)} />
            {label}
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </div>
          {sub && (
            <div className="mt-1 text-xs leading-relaxed text-muted-foreground">{sub}</div>
          )}
        </div>
      </div>
    </div>
  );
}
