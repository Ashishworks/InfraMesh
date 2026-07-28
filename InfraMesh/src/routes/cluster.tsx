import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { useState, useRef, useEffect, PointerEvent, FormEvent } from "react";
import { Network, Send, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/cluster")({
  head: () => ({
    meta: [
      { title: "Cluster Topology · InfraMesh" },
      { name: "description", content: "Visualize primary/replica topology, replication links, and consistent-hash key placement." },
    ],
  }),
  component: ClusterPage,
});

// Initial static samples used to seed the dynamic list
const initialSamples = ["user:1","user:2","user:3","user:42","user:99","session:a","session:b","cart:7","order:2025","prod:books","prod:games","metric:cpu","metric:mem","feature:beta","auth:token"];

function ClusterPage() {
  const e = useEngine();
  const primaries = e.state.nodes.filter((n) => n.role === "primary");
  const W = 720, H = 360;
  const cx = W / 2, cy = H / 2, R = 130;

  // Visualizer State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Dynamic Shard Placement State
  const [customKeys, setCustomKeys] = useState<string[]>(initialSamples);
  const [inputValue, setInputValue] = useState("");

  // 1. Create a ref for the container
  const ringRef = useRef<HTMLDivElement>(null);

  // 2. Attach a non-passive wheel event listener to prevent page scroll
  useEffect(() => {
    const el = ringRef.current;
    if (!el) return;

    const handleNativeWheel = (event: WheelEvent) => {
      event.preventDefault(); // Prevents the whole page from scrolling
      setZoom((prev) => {
        const newZoom = prev - event.deltaY * 0.0015;
        return Math.min(Math.max(0.5, newZoom), 3);
      });
    };

    // { passive: false } allows preventDefault to work
    el.addEventListener("wheel", handleNativeWheel, { passive: false });
    
    return () => {
      el.removeEventListener("wheel", handleNativeWheel);
    };
  }, []);

  // Handlers for Pan
  const handlePointerDown = () => setIsDragging(true);
  
  const handlePointerMove = (event: PointerEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setPan((prev) => ({
      x: prev.x + event.movementX,
      y: prev.y + event.movementY,
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setPan({ x: 0, y: 0 });
  };

  // Handler for adding custom keys to test
  const handleAddKey = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed && !customKeys.includes(trimmed)) {
      setCustomKeys((prev) => [trimmed, ...prev]);
      setInputValue("");
    }
  };

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
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.02] py-4 px-6 backdrop-blur-xl shadow-2xl overflow-hidden">
  <div className="absolute inset-0 glass-card-shine pointer-events-none" />
  <PageHeader
    title="Cluster Topology"
    subtitle="Sharded primaries with paired replicas. Scroll to zoom, drag to pan. Click a node to simulate failure."
  />
</div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] items-start">
        {/* Hash ring Panel */}
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-foreground tracking-wide">Hash ring</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/80">Drag to look around, release to snap back</div>
            </div>
            <div className="rounded-full border border-red-500/30 bg-red-950/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300 font-mono">
              Topology
            </div>
          </div>

          <div 
            ref={ringRef}
            className="overflow-hidden bg-black/40 rounded-xl p-3 border border-white/5 shadow-inner"
          >
            <svg 
              viewBox={`-40 -60 ${W + 80} ${H + 120}`} 
              className="h-[400px] w-full"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerUp}
              style={{ cursor: isDragging ? "grabbing" : "grab" }}
            >
              <defs>
                <radialGradient id="ring" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#ef4444" stopOpacity={0} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
                </radialGradient>
              </defs>
              
              <style>
                {`
                  @keyframes flow {
                    from { stroke-dashoffset: 12; }
                    to { stroke-dashoffset: 0; }
                  }
                  @keyframes ripple-expand {
                    0% { transform: scale(1); opacity: 0.8; stroke-width: 4px; }
                    100% { transform: scale(2.5); opacity: 0; stroke-width: 1px; }
                  }
                  .animate-flow {
                    stroke-dasharray: 6;
                    animation: flow 0.8s linear infinite;
                  }
                  .animate-ripple {
                    animation: ripple-expand 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                  }
                  .node-group {
                    transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
                  }
                  .node-group:hover {
                    transform: scale(1.1);
                  }
                  .node-group:active {
                    transform: scale(0.95);
                  }
                `}
              </style>

              <g 
                style={{ 
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, 
                  transformOrigin: `${cx}px ${cy}px`,
                  transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' 
                }}
              >
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="url(#ring)" strokeWidth="28" className="transition-colors duration-500" />
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="rgba(239, 68, 68, 0.25)" strokeDasharray="2 6" />
                
                {primaries.map((n, i) => {
                  const angle = (i / primaries.length) * Math.PI * 2 - Math.PI / 2;
                  const x = cx + Math.cos(angle) * R;
                  const y = cy + Math.sin(angle) * R;
                  const replica = e.state.nodes.find((r) => r.role === "replica" && r.primaryOf === n.id);
                  const rx = cx + Math.cos(angle) * (R + 75);
                  const ry = cy + Math.sin(angle) * (R + 75);
                  const linkActive = replica?.alive && n.alive;

                  return (
                    <g key={n.id}>
                      {replica && (
                        <line 
                          x1={x} y1={y} x2={rx} y2={ry}
                          stroke={linkActive ? "rgba(239, 68, 68, 0.7)" : "rgba(255, 255, 255, 0.1)"}
                          strokeWidth="2" 
                          className={`transition-colors duration-300 ${linkActive ? 'animate-flow' : ''}`} 
                        />
                      )}
                      <NodeDot x={x} y={y} label={n.id} alive={n.alive} role="primary" onClick={() => n.alive ? e.killNode(n.id) : e.reviveNode(n.id)} />
                      {replica && (
                        <NodeDot x={rx} y={ry} label={replica.id} alive={replica.alive} role="replica" onClick={() => replica.alive ? e.killNode(replica.id) : e.reviveNode(replica.id)} />
                      )}
                    </g>
                  );
                })}
                <text x={cx} y={cy - 4} textAnchor="middle" fill="rgba(255, 255, 255, 0.5)" fontSize="11">consistent-hash ring</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="#ef4444" fontSize="20" fontWeight="600" fontFamily="ui-monospace">
                  {primaries.filter(p => p.alive).length}/{primaries.length}
                </text>
              </g>
            </svg>
            <p className="text-center text-xs text-muted-foreground/80 mt-3 font-mono">
              Keys re-route automatically to surviving primaries on failure
            </p>
          </div>
        </div>

        {/* Shard placement Panel */}
        <div className="group relative rounded-2xl border border-white/10 bg-white/[0.02] p-5 backdrop-blur-2xl shadow-xl transition-all duration-300 hover:border-red-500/30 hover:shadow-[0_8px_30px_rgba(239,68,68,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-foreground tracking-wide">Shard placement</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-red-400/80">Test how custom keys route</div>
            </div>
            <div className="rounded-full border border-red-500/30 bg-red-950/20 px-2.5 py-0.5 text-[10px] font-semibold text-red-300 font-mono">
              Router
            </div>
          </div>

          <div className="space-y-4">
            {/* Dynamic Input Form */}
            <form onSubmit={handleAddKey} className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Test a key (e.g. user:500)..."
                className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs font-mono text-foreground backdrop-blur-md outline-none transition-colors focus:border-red-500/50 shadow-inner placeholder:text-muted-foreground/40"
              />
              <button 
                type="submit" 
                className="group/btn flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-950/20 px-3.5 py-2 text-xs font-semibold text-red-50 backdrop-blur-md transition-all duration-300 hover:bg-red-900/30 hover:border-red-500/60 active:scale-95 shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
              >
                <Send className="h-3 w-3 text-red-400 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                Route
              </button>
            </form>

            {/* Dynamic Scroll Area with Fixed Height matching Hash Ring */}
            <div className="scroll-area h-[356px] overflow-y-auto space-y-1.5 pr-1 bg-black/40 rounded-xl p-3 border border-white/5 shadow-inner">
              {customKeys.map((k) => {
                const node = e.nodeForKey(k);
                return (
                  <div key={k} className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2 font-mono text-[11px] backdrop-blur-sm transition-colors hover:border-red-500/20 animate-fade-in">
                    <span className="text-foreground/80 font-medium truncate">{k}</span>
                    <span className={`transition-colors duration-300 rounded px-2 py-0.5 text-[10px] font-semibold border ${
                      node ? "bg-red-950/20 text-red-400 border-red-500/30" : "bg-neutral-900 text-neutral-500 border-white/5"
                    }`}>
                      {node?.id ?? "unavailable"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NodeDot({ x, y, label, alive, role, onClick }: { x: number; y: number; label: string; alive: boolean; role: "primary" | "replica"; onClick: () => void }) {
  const isPrimary = role === "primary";
  const [ripples, setRipples] = useState<number[]>([]);
  
  const colorOffline = "#525252"; 
  const colorPrimary = "#ef4444"; 
  const colorReplica = "#f87171"; 
  
  const color = !alive ? colorOffline : isPrimary ? colorPrimary : colorReplica;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
    
    setRipples((prev) => [...prev, Date.now()]);
    
    setTimeout(() => {
      setRipples((prev) => prev.slice(1));
    }, 500);
  };
  
  return (
    <g 
      onClick={handleClick} 
      onPointerDown={(e) => e.stopPropagation()} 
      className="node-group cursor-pointer" 
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {ripples.map((key) => (
        <circle
          key={key}
          cx={x} cy={y}
          r={isPrimary ? 15 : 10}
          fill="transparent"
          stroke={color}
          className="animate-ripple pointer-events-none"
          style={{ transformOrigin: `${x}px ${y}px` }}
        />
      ))}

      <circle 
        cx={x} cy={y} 
        r={isPrimary ? 15 : 10} 
        fill={alive ? color : "transparent"} 
        stroke={color} 
        strokeWidth={isPrimary ? "3" : "2"} 
        className="transition-colors duration-300 drop-shadow-md"
      />
      
      <text 
        x={x} y={y + (isPrimary ? 32 : 24)} 
        textAnchor="middle" 
        fill={alive ? "#e5e5e5" : "#737373"} 
        fontSize="11" 
        fontWeight={alive ? "600" : "400"}
        fontFamily="ui-monospace"
        className="transition-colors duration-300 select-none"
      >
        {label}
      </text>
    </g>
  );
}