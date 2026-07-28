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
    <aside className="hidden md:flex sticky top-0 z-30 h-screen w-[260px] shrink-0 flex-col border-r border-border/10 bg-background/95 backdrop-blur-sm shadow-2xl">
      {/* Brand Header */}
      <div className="px-6 py-7 animate-in fade-in slide-in-from-top-4 duration-500">
        <Link to="/" className="flex items-center gap-3 group active:scale-95 transition-transform">
          <div className="grid place-items-center h-10 w-10 rounded-xl border border-red-900/50 bg-red-950/30 shadow-[0_0_15px_rgba(239,68,68,0.15)] transition-all duration-300 group-hover:shadow-[0_0_25px_rgba(239,68,68,0.3)] group-hover:border-red-500/60">
            <Waypoints className="h-[20px] w-[20px] text-red-500 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
          </div>
          <div>
            <div className="text-[16px] font-bold tracking-tight text-foreground transition-colors group-hover:text-red-50">
              InfraMesh
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-500/70">
              Control Plane
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation Links with Staggered Animation */}
      <nav className="flex-1 space-y-7 overflow-y-auto px-4 pb-4 scroll-area mt-2">
        {navGroups.map((group, groupIndex) => (
          <div 
            key={group.label} 
            className="animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
            style={{ animationDelay: `${groupIndex * 100}ms` }}
          >
            <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/50">
              {group.label}
            </div>
            <div className="space-y-1.5">
              {group.items.map((it) => {
                const active = isActive(loc.pathname, it.to);
                const Icon = it.icon;
                return (
                  <Link
                    key={it.to}
                    to={it.to}
                    className={`
                      group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium
                      transition-all duration-200 ease-out active:scale-[0.98] border
                      ${
                        active
                          ? "text-foreground border-red-500/30 bg-red-950/20 shadow-[inset_0_1px_0_rgba(239,68,68,0.2)]"
                          : "border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1.5"
                      }
                    `}
                  >
                    <Icon
                      className={`h-4 w-4 shrink-0 transition-all duration-200 ${
                        active 
                          ? "text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] scale-110" 
                          : "text-muted-foreground/70 group-hover:text-foreground group-hover:scale-110"
                      }`}
                    />
                    <span>{it.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Status Card */}
      <div className="border-t border-border/10 p-4 bg-black/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="group rounded-xl border border-border/10 bg-black/40 p-4 shadow-inner transition-all duration-300 hover:border-red-900/40 hover:bg-black/60 hover:shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-muted-foreground/80">
              Cluster Status
            </div>
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-foreground group-hover:text-red-50 transition-colors">Online & Active</span>
          </div>
          
          <div className="grid grid-cols-3 gap-1 mt-3 border-t border-border/10 pt-3 text-center">
            <div className="flex flex-col transition-transform duration-300 group-hover:-translate-y-0.5">
              <span className="font-mono text-[12px] font-bold text-foreground">3</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Prim</span>
            </div>
            <div className="flex flex-col border-x border-border/10 transition-transform duration-300 group-hover:-translate-y-0.5 delay-75">
              <span className="font-mono text-[12px] font-bold text-foreground">3</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Repl</span>
            </div>
            <div className="flex flex-col transition-transform duration-300 group-hover:-translate-y-0.5 delay-150">
              <span className="font-mono text-[12px] font-bold text-foreground">3</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">Work</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

const allItems = navGroups.flatMap((g) => g.items);

export function MobileNav() {
  const loc = useLocation();

  return (
    <nav className="flex gap-2.5 overflow-x-auto border-b border-border/10 bg-background/80 backdrop-blur-md px-4 py-3 md:hidden scroll-area sticky top-0 z-40 shadow-sm animate-in fade-in slide-in-from-top-2">
      {allItems.map((it) => {
        const active = isActive(loc.pathname, it.to);
        const Icon = it.icon;
        
        return (
          <Link
            key={it.to}
            to={it.to}
            className={`
              shrink-0 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 active:scale-90 border
              ${active 
                ? "text-red-50 border-red-500/30 bg-red-950/30 shadow-[0_4px_10px_rgba(239,68,68,0.2)]" 
                : "bg-transparent border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground"
              }
            `}
          >
            <Icon className={`h-3.5 w-3.5 transition-transform duration-300 ${active ? 'text-white scale-110 drop-shadow-md' : 'text-muted-foreground/70'}`} />
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}