/**
 * Offline storage utilities for caching repeater data in localStorage
 */

import { Repeater } from '@/app/columns';

const STORAGE_KEY = 'repeaters_cache';
const TIMESTAMP_KEY = 'repeaters_cache_timestamp';

/**
 * Save repeaters to localStorage cache
 */
export function saveRepeatersCache(repeaters: Repeater[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repeaters));
    localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    // localStorage might be full or disabled
    console.warn('Failed to save repeaters cache:', error);
  }
}

/**
 * Get cached repeaters from localStorage
 */
export function getRepeatersCache(): Repeater[] | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;

    return JSON.parse(cached) as Repeater[];
  } catch (error) {
    console.warn('Failed to read repeaters cache:', error);
    return null;
  }
}

/**
 * Get the timestamp of when the cache was last updated
 */
export function getCacheTimestamp(): number | null {
  if (typeof window === 'undefined') return null;

  try {
    const timestamp = localStorage.getItem(TIMESTAMP_KEY);
    if (!timestamp) return null;

    return parseInt(timestamp, 10);
  } catch {
    return null;
  }
}

/**
 * Get the cache age as a formatted string (e.g., "há 5 min", "há 2 horas")
 */
export function formatCacheAge(timestamp: number | null): string {
  if (!timestamp) return '';

  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffHours < 24) return `há ${diffHours}h`;
  return `há ${diffDays} dias`;
}

/**
 * Clear the repeaters cache
 */
export function clearRepeatersCache(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMESTAMP_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Check if cache exists
 */
export function hasCachedRepeaters(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) !== null;
}
