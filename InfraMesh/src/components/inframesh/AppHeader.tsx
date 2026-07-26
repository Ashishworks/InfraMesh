import { useLocation } from "@tanstack/react-router";

const PAGE_TITLES: Record<string, string> = {
  "/": "Overview",
  "/cache": "Cache",
  "/queue": "Queue",
  "/cluster": "Cluster",
  "/metrics": "Metrics",
  "/logs": "Logs",
  "/tracing": "Tracing",
  "/health": "Health",
};

export function AppHeader() {
  const loc = useLocation();
  const page =
    PAGE_TITLES[loc.pathname] ??
    (Object.entries(PAGE_TITLES).find(([path]) => path !== "/" && loc.pathname.startsWith(path))?.[1] ?? "InfraMesh");

  return (
    <header className="sticky top-0 z-20 hidden border-b border-border/50 bg-background/80 backdrop-blur-md md:block">
      <div className="flex h-14 items-center justify-between px-8">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">InfraMesh</span>
          <span className="text-muted-foreground/50">/</span>
          <span className="font-medium text-foreground">{page}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success pulse-dot" />
            Live
          </span>
          <span className="hidden text-[11px] text-muted-foreground lg:inline">
            Simulation environment
          </span>
        </div>
      </div>
    </header>
  );
}
