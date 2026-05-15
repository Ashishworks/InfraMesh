import { Link, useLocation } from "@tanstack/react-router";
import {
  Activity, Database, Inbox, Network, BarChart3, ScrollText,
  Workflow, HeartPulse, Zap,
} from "lucide-react";

const items = [
  { to: "/", label: "Overview", icon: Activity },
  { to: "/cache", label: "Cache", icon: Database },
  { to: "/queue", label: "Queue", icon: Inbox },
  { to: "/cluster", label: "Cluster", icon: Network },
  { to: "/metrics", label: "Metrics", icon: BarChart3 },
  { to: "/logs", label: "Logs", icon: ScrollText },
  { to: "/tracing", label: "Tracing", icon: Workflow },
  { to: "/health", label: "Health", icon: HeartPulse },
] as const;

export function Sidebar() {
  const loc = useLocation();
  return (
    <aside className="hidden md:flex sticky top-0 h-screen w-64 shrink-0 flex-col gap-1 border-r border-border/50 px-4 py-6 glass-strong z-10">
      <Link to="/" className="flex items-center gap-2 px-2 pb-6">
        <div className="grid place-items-center w-9 h-9 rounded-lg neon-border glow-cyan">
          <Zap className="w-4 h-4 text-primary" />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-tight grad-text">InfraMesh</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">control plane</div>
        </div>
      </Link>
      <nav className="flex flex-col gap-1">
        {items.map((it) => {
          const active = loc.pathname === it.to || (it.to !== "/" && loc.pathname.startsWith(it.to));
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                ${active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary/40"}`}
            >
              <Icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
              <span>{it.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary pulse-dot" />}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto rounded-md border border-border/50 p-3 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
          <span className="text-foreground">cluster online</span>
        </div>
        <div className="mt-1">3 primaries · 3 replicas · 3 workers</div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const loc = useLocation();
  return (
    <nav className="md:hidden flex gap-1 overflow-x-auto px-3 py-2 border-b border-border/50 glass-strong">
      {items.map((it) => {
        const active = loc.pathname === it.to;
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`shrink-0 rounded-md px-3 py-1.5 text-xs ${active ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}
          >{it.label}</Link>
        );
      })}
    </nav>
  );
}
