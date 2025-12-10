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

/**
 * Hook that provides countdown state for an event.
 * Automatically updates based on the global tick provider.
 */
export function useEventCountdown(
  eventStart: string,
  eventEnd?: string,
  t?: (key: string, params?: Record<string, unknown>) => string
): CountdownState {
  // Subscribe to global tick for updates
  useTick();

  return useMemo(() => {
    const now = Date.now();
    const startTime = new Date(eventStart).getTime();
    const endTime = eventEnd
      ? new Date(eventEnd).getTime()
      : startTime + 3600000; // Default 1 hour if no end

    const msToStart = msUntil(eventStart);
    const msToEnd = eventEnd ? msUntil(eventEnd) : 0;

    const hasStarted = now >= startTime;
    const hasEnded = now >= endTime;
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
  }, [eventStart, eventEnd, t]);
}

/**
 * Hook that returns just the event status (started/ended/in-progress)
 * More efficient when you don't need the full countdown display.
 */
export function useEventStatus(eventStart: string, eventEnd?: string) {
  useTick();

  return useMemo(() => {
    const now = Date.now();
    const startTime = new Date(eventStart).getTime();
    const endTime = eventEnd
      ? new Date(eventEnd).getTime()
      : startTime + 3600000;

    const hasStarted = now >= startTime;
    const hasEnded = now >= endTime;
    const isInProgress = hasStarted && !hasEnded;

    return { hasStarted, hasEnded, isInProgress };
  }, [eventStart, eventEnd]);
}
