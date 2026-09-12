"use client";

/**
 * Centralized tick manager for countdown displays
 *
 * Replaces multiple individual setInterval calls with a single
 * global interval using React Context. Components subscribe to
 * the tick context instead of creating their own timers.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

// Context for the global tick counter
const TickContext = createContext<number>(0);

// Context for the timestamp of the latest tick. `null` means no provider is
// mounted, so `useNow` falls back to the value captured on mount.
const NowContext = createContext<number | null>(null);

interface TickProviderProps {
  children: ReactNode;
  /** Tick interval in milliseconds (default: 1000) */
  interval?: number;
}

/**
 * Provider component that manages a single global tick interval.
 * Wrap your events components with this to enable centralized timing.
 */
export function TickProvider({ children, interval = 1000 }: TickProviderProps) {
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Use requestAnimationFrame for drift-resistant timing
    let raf: number | undefined;
    let lastTime = typeof performance !== "undefined" ? performance.now() : Date.now();

    const advance = () => {
      setTick((t) => t + 1);
      setNow(Date.now());
    };

    const loop = (time: number) => {
      if (time - lastTime >= interval) {
        lastTime = time;
        advance();
      }
      raf = requestAnimationFrame(loop);
    };

    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      raf = requestAnimationFrame(loop);
      return () => {
        if (raf) cancelAnimationFrame(raf);
      };
    } else {
      // Fallback for SSR or environments without rAF
      const id = setInterval(advance, interval);
      return () => clearInterval(id);
    }
  }, [interval]);

  return (
    <TickContext.Provider value={tick}>
      <NowContext.Provider value={now}>{children}</NowContext.Provider>
    </TickContext.Provider>
  );
}

/**
 * Hook to subscribe to the global tick counter.
 * Components using this hook will re-render on every tick.
 */
export function useTick(): number {
  return useContext(TickContext);
}

/**
 * Hook that returns the current timestamp, updated on each tick.
 * Useful for countdown calculations.
 *
 * The timestamp is read from the provider so that render stays pure. Without a
 * provider it stays at the value captured when the component mounted.
 */
export function useNow(): number {
  const providedNow = useContext(NowContext);
  const [mountedNow] = useState(() => Date.now());

  return providedNow ?? mountedNow;
}

// Contexts for different tick intervals
const SlowTickContext = createContext<number>(0);
const MediumTickContext = createContext<number>(0);

interface MultiTickProviderProps {
  children: ReactNode;
  /** Fast tick interval in ms (default: 1000) */
  fastInterval?: number;
  /** Medium tick interval in ms (default: 30000) */
  mediumInterval?: number;
  /** Slow tick interval in ms (default: 60000) */
  slowInterval?: number;
}

/**
 * Provider with multiple tick intervals for optimized updates.
 * - Fast (1s): For events < 1h away
 * - Medium (30s): For events 1-24h away
 * - Slow (60s): For events > 24h away
 */
export function MultiTickProvider({
  children,
  fastInterval = 1000,
  mediumInterval = 30000,
  slowInterval = 60000,
}: MultiTickProviderProps) {
  const [fastTick, setFastTick] = useState(0);
  const [mediumTick, setMediumTick] = useState(0);
  const [slowTick, setSlowTick] = useState(0);
  const [now, setNow] = useState(() => Date.now());

  // Fast tick (every second)
  useEffect(() => {
    let raf: number | undefined;
    let lastTime = performance.now();

    const loop = (time: number) => {
      if (time - lastTime >= fastInterval) {
        lastTime = time;
        setFastTick((t) => t + 1);
        setNow(Date.now());
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [fastInterval]);

  // Medium tick
  useEffect(() => {
    const id = setInterval(() => setMediumTick((t) => t + 1), mediumInterval);
    return () => clearInterval(id);
  }, [mediumInterval]);

  // Slow tick
  useEffect(() => {
    const id = setInterval(() => setSlowTick((t) => t + 1), slowInterval);
    return () => clearInterval(id);
  }, [slowInterval]);

  return (
    <TickContext.Provider value={fastTick}>
      <NowContext.Provider value={now}>
        <MediumTickContext.Provider value={mediumTick}>
          <SlowTickContext.Provider value={slowTick}>
            {children}
          </SlowTickContext.Provider>
        </MediumTickContext.Provider>
      </NowContext.Provider>
    </TickContext.Provider>
  );
}

/**
 * Hook for medium-frequency updates (30s default)
 */
export function useMediumTick(): number {
  return useContext(MediumTickContext);
}

/**
 * Hook for slow-frequency updates (60s default)
 */
export function useSlowTick(): number {
  return useContext(SlowTickContext);
}

/**
 * Smart tick hook that returns the appropriate tick based on time remaining.
 * Updates more frequently as the event approaches.
 */
export function useSmartTick(msUntilEvent: number): number {
  const fastTick = useTick();
  const mediumTick = useMediumTick();
  const slowTick = useSlowTick();

  // < 1 hour: use fast tick (every second)
  if (msUntilEvent < 3600000) {
    return fastTick;
  }
  // < 24 hours: use medium tick (every 30s)
  if (msUntilEvent < 86400000) {
    return mediumTick;
  }
  // > 24 hours: use slow tick (every minute)
  return slowTick;
}
