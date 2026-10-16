import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { api } from "../api/client";
import { transformNetworkData } from "../lib/network";
import type { NetworkData } from "../types";

const REFRESH_MS = 6000;

interface NetworkDataContextValue {
  data: NetworkData | null;
  /** Hold refreshes while a chart popover is open so the table doesn't move under it. */
  setRefreshPaused: (paused: boolean) => void;
}

const NetworkDataContext = createContext<NetworkDataContextValue | null>(null);

/**
 * Polls grabData every 6s (one request at a time, paused while the tab is hidden)
 * and shares the result between the dashboard pages so navigating between them is instant.
 */
export function NetworkDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<NetworkData | null>(null);
  const pauseCount = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    let stopped = false;
    let running = false;

    const tick = async () => {
      running = true;
      if (!document.hidden && pauseCount.current === 0) {
        controller = new AbortController();
        try {
          setData(transformNetworkData(await api.grabData(controller.signal)));
        } catch (err) {
          // Keep showing the last good data; the next tick retries.
          if (!controller.signal.aborted) console.error("Failed to refresh node data", err);
        }
      }
      running = false;
      if (!stopped) timer = setTimeout(tick, REFRESH_MS);
    };

    const onVisible = () => {
      if (!document.hidden && !stopped && !running) {
        clearTimeout(timer);
        void tick();
      }
    };

    void tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const setRefreshPaused = useCallback((paused: boolean) => {
    pauseCount.current = Math.max(0, pauseCount.current + (paused ? 1 : -1));
  }, []);

  return <NetworkDataContext.Provider value={{ data, setRefreshPaused }}>{children}</NetworkDataContext.Provider>;
}

export function useNetworkData() {
  const ctx = useContext(NetworkDataContext);
  if (!ctx) throw new Error("useNetworkData must be used inside NetworkDataProvider");
  return ctx;
}

/** Same pause hook outside the provider (e.g. the report page) is a no-op. */
export function useRefreshPause() {
  return useContext(NetworkDataContext)?.setRefreshPaused ?? noop;
}
const noop = () => {};
