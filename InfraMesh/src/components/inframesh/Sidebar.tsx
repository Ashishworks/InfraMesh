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
    <aside
  className="
    hidden md:flex sticky top-0 z-10
    h-screen w-64 shrink-0 flex-col gap-2

    border-r border-white/10

    bg-black/35
    backdrop-blur-2xl
    supports-[backdrop-filter]:bg-black/25

    px-4 py-6

    shadow-[0_0_40px_rgba(0,0,0,0.45)]
  "
>
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-2 pb-6">
        <div
          className="
            grid place-items-center
            w-10 h-10 rounded-2xl
            border border-cyan-400/10
            bg-white/[0.04]
            backdrop-blur-xl
            shadow-[0_0_20px_rgba(34,211,238,0.15)]
          "
        >
          <Waypoints className="w-5 h-5 text-cyan-300" />
        </div>

        <div>
          <div className="text-[15px] font-semibold tracking-tight text-white">
            InfraMesh
          </div>

          <div
            className="
              text-[10px] uppercase
              tracking-[0.25em]
              text-muted-foreground
            "
          >
            control plane
          </div>
        </div>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {items.map((it) => {
          const active =
            loc.pathname === it.to ||
            (it.to !== "/" && loc.pathname.startsWith(it.to));

          const Icon = it.icon;

          return (
            <Link
              key={it.to}
              to={it.to}
              className={`
                group relative flex items-center gap-3
                rounded-xl px-3 py-2.5 text-sm
                border transition-all duration-300

                ${
                  active
                    ? `
                      border-cyan-400/10
                      bg-white/[0.06]
                      text-cyan-100
                      backdrop-blur-xl
                      shadow-[0_0_20px_rgba(34,211,238,0.12)]
                    `
                    : `
                      border-transparent
                      text-muted-foreground
                      hover:bg-white/[0.04]
                      hover:border-white/5
                      hover:text-white
                    `
                }
              `}
            >
              <Icon
                className={`
                  w-4 h-4 transition-colors
                  ${active ? "text-cyan-300" : "text-muted-foreground"}
                  group-hover:text-cyan-200
                `}
              />

              <span>{it.label}</span>

              {active && (
                <span
                  className="
                    ml-auto h-1.5 w-1.5 rounded-full
                    bg-cyan-300
                    shadow-[0_0_10px_rgba(34,211,238,0.8)]
                  "
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Status Card */}
      <div
        className="
          mt-auto rounded-2xl
          border border-white/10
          bg-white/[0.03]
          backdrop-blur-xl
          p-3 text-[11px]
          text-muted-foreground
          shadow-[0_0_20px_rgba(0,0,0,0.25)]
        "
      >
        <div className="flex items-center gap-2">
          <span
            className="
              h-2 w-2 rounded-full
              bg-emerald-400
              shadow-[0_0_10px_rgba(74,222,128,0.8)]
            "
          />

          <span className="text-white">cluster online</span>
        </div>

        <div className="mt-2 leading-relaxed">
          3 primaries · 3 replicas · 3 workers
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const loc = useLocation();

  return (
    <nav
      className="
        md:hidden flex gap-2 overflow-x-auto
        border-b border-white/10
        bg-black/20
        backdrop-blur-2xl
        px-3 py-2
      "
    >
      {items.map((it) => {
        const active = loc.pathname === it.to;

        return (
          <Link
            key={it.to}
            to={it.to}
            className={`
              shrink-0 rounded-xl px-3 py-1.5 text-xs
              border transition-all duration-300

              ${
                active
                  ? `
                    border-cyan-400/10
                    bg-white/[0.06]
                    text-cyan-100
                    backdrop-blur-xl
                  `
                  : `
                    border-transparent
                    text-muted-foreground
                  `
              }
            `}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}