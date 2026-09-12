"use client";

/**
 * Hook for event countdown calculations with smart update intervals
 */

import { useMemo } from "react";
import { useTick } from "./useOptimizedTick";
import { msUntil, breakdown, formatSmartCountdown } from "../utils/formatters";

export interface CountdownState {
  /** Milliseconds until event starts */
  msToStart: number;
  /** Milliseconds until event ends (0 if no end time) */
  msToEnd: number;
  /** Whether the event has started */
  hasStarted: boolean;
  /** Whether the event has ended */
  hasEnded: boolean;
  /** Whether the event is currently in progress */
  isInProgress: boolean;
  /** Breakdown of time remaining to start */
  breakdown: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  /** Formatted countdown string */
  formatted: string;
}

/** Default event duration when no end time is given. */
const DEFAULT_DURATION_MS = 3600000;

/**
 * Resolves the instant an event ends: its explicit end time, or one hour
 * after its start. Returned as an ISO string so the clock is only ever read
 * inside msUntil().
 */
function endOf(eventStart: string, eventEnd?: string): string {
  if (eventEnd) return eventEnd;
  const startTime = new Date(eventStart).getTime();
  // Unparseable start: hand the original string back so msUntil() yields NaN
  // instead of new Date(NaN).toISOString() throwing.
  if (!Number.isFinite(startTime)) return eventStart;
  return new Date(startTime + DEFAULT_DURATION_MS).toISOString();
}

/**
 * Hook that provides countdown state for an event.
 * Automatically updates based on the global tick provider.
 */
export function useEventCountdown(
  eventStart: string,
  eventEnd?: string,
  t?: (key: string, params?: Record<string, unknown>) => string
): CountdownState {
  // Subscribe to global tick so the countdown recomputes on every tick
  const tick = useTick();

  return useMemo(() => {
    // `tick` is read so this memo recomputes on every tick of the global clock.
    void tick;

    // The clock is read only through msUntil(), which returns 0 once the
    // instant has passed. Reading it here instead would be an impure render
    // and could drift between the three reads within a single pass.
    const msToStart = msUntil(eventStart);
    const msToEnd = eventEnd ? msUntil(eventEnd) : 0;
    const msToActualEnd = msUntil(endOf(eventStart, eventEnd));

    const hasStarted = msToStart === 0;
    const hasEnded = msToActualEnd === 0;
    const isInProgress = hasStarted && !hasEnded;

    const timeBreakdown = breakdown(isInProgress ? msToEnd : msToStart);

    // Default translation function if not provided
    const translate = t || ((key: string, params?: Record<string, unknown>) => {
      if (key === 'inDays' && params?.count) {
        return `${params.count}d`;
      }
      return key;
    });

    const formatted = formatSmartCountdown(
      isInProgress ? msToEnd : msToStart,
      translate
    );

    return {
      msToStart,
      msToEnd,
      hasStarted,
      hasEnded,
      isInProgress,
      breakdown: timeBreakdown,
      formatted,
    };
  }, [eventStart, eventEnd, t, tick]);
}

/**
 * Hook that returns just the event status (started/ended/in-progress)
 * More efficient when you don't need the full countdown display.
 */
export function useEventStatus(eventStart: string, eventEnd?: string) {
  const tick = useTick();

  return useMemo(() => {
    // `tick` is read so this memo recomputes on every tick of the global clock.
    void tick;

    const hasStarted = msUntil(eventStart) === 0;
    const hasEnded = msUntil(endOf(eventStart, eventEnd)) === 0;
    const isInProgress = hasStarted && !hasEnded;

    return { hasStarted, hasEnded, isInProgress };
  }, [eventStart, eventEnd, tick]);
}
