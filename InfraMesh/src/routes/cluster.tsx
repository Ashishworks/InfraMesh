import { createFileRoute } from "@tanstack/react-router";
import { useEngine } from "@/lib/inframesh/useEngine";
import { PageHeader } from "@/components/inframesh/PageHeader";
import { Panel } from "@/components/inframesh/Panel";
import { useState, WheelEvent, PointerEvent, FormEvent } from "react";

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

  // Handlers for Zoom & Pan
  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    setZoom((prev) => {
      const newZoom = prev - event.deltaY * 0.0015;
      return Math.min(Math.max(0.5, newZoom), 3);
    });
  };

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
      // Add the new key to the top of the list
      setCustomKeys((prev) => [trimmed, ...prev]);
      setInputValue("");
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cluster Topology"
        subtitle="Sharded primaries with paired replicas. Scroll to zoom, drag to pan. Click a node to simulate failure."
      />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Panel title="Hash ring" description="Drag to look around, release to snap back" noPadding>
          <div className="px-4 pb-4 overflow-hidden" onWheel={handleWheel}>
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
                  <stop offset="60%" stopColor="oklch(0.60 0.22 25 / 0)" />
                  <stop offset="100%" stopColor="oklch(0.60 0.22 25 / 0.15)" />
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
                <circle cx={cx} cy={cy} r={R} fill="none" stroke="oklch(0.60 0.22 25 / 0.25)" strokeDasharray="2 6" />
                
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
                          stroke={linkActive ? "oklch(0.60 0.22 25 / 0.7)" : "oklch(0.35 0.02 25 / 0.3)"}
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
                <text x={cx} y={cy - 4} textAnchor="middle" fill="oklch(0.50 0.15 25)" fontSize="11">consistent-hash ring</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fill="oklch(0.60 0.22 25)" fontSize="20" fontWeight="600" fontFamily="ui-monospace">
                  {primaries.filter(p => p.alive).length}/{primaries.length}
                </text>
              </g>
            </svg>
            <p className="text-center text-xs text-muted-foreground mt-2">
              Keys re-route automatically to surviving primaries on failure
            </p>
          </div>
        </Panel>

        <Panel title="Shard placement" description="Test how custom keys route" noPadding>
          <div className="flex flex-col h-[450px]">
            {/* Dynamic Input Form */}
            <form onSubmit={handleAddKey} className="p-4 border-b border-border/30 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Test a key (e.g. user:500)..."
                className="flex-1 bg-transparent border border-border/50 rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:border-red-500/70 transition-colors"
              />
              <button 
                type="submit" 
                className="bg-red-950/40 hover:bg-red-900/60 text-red-200/90 border border-red-900/50 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              >
                Route
              </button>
            </form>

            {/* Dynamic Scroll Area */}
            <div className="scroll-area flex-1 px-5 pb-4 overflow-y-auto">
              {customKeys.map((k) => {
                const node = e.nodeForKey(k);
                return (
                  <div key={k} className="flex justify-between border-b border-border/30 py-3 font-mono text-[11px] last:border-0 group animate-fade-in">
                    <span className="text-foreground/70 transition-colors group-hover:text-foreground">{k}</span>
                    <span className={`transition-colors duration-300 ${node ? "font-medium text-red-500" : "text-destructive"}`}>
                      {node?.id ?? "unavailable"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

function NodeDot({ x, y, label, alive, role, onClick }: { x: number; y: number; label: string; alive: boolean; role: "primary" | "replica"; onClick: () => void }) {
  const isPrimary = role === "primary";
  const [ripples, setRipples] = useState<number[]>([]);
  
  const colorOffline = "oklch(0.35 0.02 25)"; 
  const colorPrimary = "oklch(0.60 0.22 25)"; 
  const colorReplica = "oklch(0.50 0.15 25)"; 
  
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
        fill={alive ? "oklch(0.85 0.05 25)" : "oklch(0.45 0.02 25)"} 
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