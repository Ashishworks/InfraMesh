import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity,
  Database,
  Inbox,
  Network,
  BarChart3,
  ScrollText,
  Workflow,
  HeartPulse,
  Waypoints,
} from "lucide-react";

const navGroups = [
  {
    label: "Monitor",
    items: [
      { to: "/", label: "Overview", icon: Activity },
      { to: "/metrics", label: "Metrics", icon: BarChart3 },
      { to: "/health", label: "Health", icon: HeartPulse },
    ],
  },
  {
    label: "Playground",
    items: [
      { to: "/cache", label: "Cache", icon: Database },
      { to: "/queue", label: "Queue", icon: Inbox },
      { to: "/cluster", label: "Cluster", icon: Network },
    ],
  },
  {
    label: "Observability",
    items: [
      { to: "/logs", label: "Logs", icon: ScrollText },
      { to: "/tracing", label: "Tracing", icon: Workflow },
    ],
  },
] as const;

function isActive(pathname: string, to: string) {
  return pathname === to || (to !== "/" && pathname.startsWith(to));
}

export function Sidebar() {
  const loc = useLocation();

  return (
    <aside className="hidden md:flex sticky top-0 z-30 h-screen w-[260px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="px-5 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid place-items-center h-9 w-9 rounded-lg border border-primary/20 bg-primary/10">
            <Waypoints className="h-[18px] w-[18px] text-primary" />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-foreground">
              InfraMesh
            </div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Control Plane
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-4 scroll-area">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((it) => {
                const active = isActive(loc.pathname, it.to);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`
                      group flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium
                      transition-colors duration-150
                      ${
                        active
                          ? "bg-primary/12 text-foreground"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      }
                    `}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
                    />
                    <span>{it.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-4">
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
          <div className="flex items-center gap-2">
            <span className="status-dot bg-success pulse-dot" />
            <span className="text-xs font-medium text-foreground">Cluster online</span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            3 primaries · 3 replicas · 3 workers
          </p>
        </div>
      </div>
    </aside>
  );
}

const allItems = navGroups.flatMap((g) => g.items);

export function MobileNav() {
  const loc = useLocation();

  return (
    <nav className="flex gap-1.5 overflow-x-auto border-b border-sidebar-border bg-sidebar px-3 py-2 md:hidden scroll-area">
      {allItems.map((it) => {
        const active = isActive(loc.pathname, it.to);
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`
              shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors
              ${active ? "bg-primary/12 text-foreground" : "text-muted-foreground"}
            `}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
