import { useSyncExternalStore } from "react";
import { getEngine } from "./engine";

export function useEngine() {
  const engine = getEngine();
  // re-render whenever engine emits
  useSyncExternalStore(
    (cb) => engine.subscribe(cb),
    () => engine.state.metrics.length + engine.state.logs.length + engine.state.totals.req,
    () => 0,
  );
  return engine;
}
