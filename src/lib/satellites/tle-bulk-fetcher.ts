// Bulk TLE fetcher for amateur radio satellites
// Fetches all satellites from CelesTrak amateur group with localStorage caching

import { TLEEntry, BulkTLECache } from './types';
import { TLEData } from '../iss/types';

const BULK_CACHE_KEY = 'satellite_tle_bulk_cache';
const CACHE_DURATION_MS = 12 * 60 * 60 * 1000; // 12 hours
const CELESTRAK_AMATEUR_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=amateur&FORMAT=tle';

export interface BulkTLEFetchResult {
  data: BulkTLECache | null;
  cached: boolean;
  error?: string;
  satelliteCount?: number;
}

/**
 * Parses CelesTrak bulk TLE format
 * Format: 3 lines per satellite (name, line1, line2)
 */
function parseBulkTLE(text: string): Record<string, TLEEntry> {
  const satellites: Record<string, TLEEntry> = {};
  const lines = text.trim().split('\n');

  for (let i = 0; i < lines.length; i += 3) {
    const name = lines[i]?.trim();
    const line1 = lines[i + 1]?.trim();
    const line2 = lines[i + 2]?.trim();

    // Validate TLE lines
    if (!name || !line1 || !line2) continue;
    if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) continue;

    // Extract NORAD ID from line 1 (characters 2-6)
    const noradId = line1.substring(2, 7).trim();

    // Validate line lengths (69 characters each)
    if (line1.length === 69 && line2.length === 69) {
      satellites[noradId] = { name, line1, line2 };
    }
  }

  return satellites;
}

/**
 * Gets cached bulk TLE data from localStorage
 */
function getCachedBulkTLE(ignoreExpiry = false): BulkTLECache | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(BULK_CACHE_KEY);
    if (!cached) return null;

    const cache: BulkTLECache = JSON.parse(cached);

    // Check if cache is expired
    if (!ignoreExpiry) {
      const age = Date.now() - cache.fetchedAt;
      if (age > CACHE_DURATION_MS) {
        return null;
      }
    }

    return cache;
  } catch (error) {
    console.error('Error reading bulk TLE cache:', error);
    return null;
  }
}

/**
 * Caches bulk TLE data in localStorage
 */
function cacheBulkTLE(cache: BulkTLECache): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(BULK_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching bulk TLE:', error);
    // If localStorage is full, try to clear old individual TLE caches
    clearOldIndividualCaches();
    try {
      localStorage.setItem(BULK_CACHE_KEY, JSON.stringify(cache));
    } catch {
      console.error('Still unable to cache bulk TLE after cleanup');
    }
  }
}

/**
 * Clears old individual satellite TLE caches to make room
 */
function clearOldIndividualCaches(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('satellite_tle_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing old caches:', error);
  }
}

/**
 * Fetches all amateur satellite TLEs from CelesTrak
 * Uses bulk endpoint for efficiency
 */
export async function fetchBulkTLE(forceRefresh = false): Promise<BulkTLEFetchResult> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedBulkTLE();
    if (cached) {
      return {
        data: cached,
        cached: true,
        satelliteCount: Object.keys(cached.satellites).length,
      };
    }
  }

  // Fetch fresh data
  try {
    const response = await fetch(CELESTRAK_AMATEUR_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const satellites = parseBulkTLE(text);
    const satelliteCount = Object.keys(satellites).length;

    if (satelliteCount === 0) {
      throw new Error('No satellites parsed from response');
    }

    const cache: BulkTLECache = {
      fetchedAt: Date.now(),
      satellites,
    };

    // Cache the result
    cacheBulkTLE(cache);

    return {
      data: cache,
      cached: false,
      satelliteCount,
    };

  } catch (error) {
    console.error('Error fetching bulk TLE:', error);

    // Try to return cached data even if expired
    const cached = getCachedBulkTLE(true);
    if (cached) {
      return {
        data: cached,
        cached: true,
        error: `Failed to fetch fresh TLE: ${error instanceof Error ? error.message : 'Unknown error'}. Using cached data.`,
        satelliteCount: Object.keys(cached.satellites).length,
      };
    }

    return {
      data: null,
      cached: false,
      error: `Failed to fetch TLE: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Gets TLE for a specific satellite by NORAD ID from bulk cache
 */
export function getTLEByNoradId(noradId: string): TLEData | null {
  const cache = getCachedBulkTLE(true); // Use even expired cache
  if (!cache) return null;

  const entry = cache.satellites[noradId];
  if (!entry) return null;

  return {
    line1: entry.line1,
    line2: entry.line2,
    fetchedAt: cache.fetchedAt,
  };
}

/**
 * Gets all satellites from bulk cache
 */
export function getAllSatellitesFromCache(): Record<string, TLEEntry> | null {
  const cache = getCachedBulkTLE(true);
  return cache?.satellites ?? null;
}

/**
 * Gets the age of bulk TLE cache in milliseconds
 */
export function getBulkCacheAge(): number | null {
  const cache = getCachedBulkTLE(true);
  if (!cache) return null;
  return Date.now() - cache.fetchedAt;
}

/**
 * Clears the bulk TLE cache
 */
export function clearBulkTLECache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(BULK_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing bulk TLE cache:', error);
  }
}

/**
 * Formats cache age as human-readable string
 */
export function formatBulkCacheAge(ageMs: number | null): string {
  if (ageMs === null) return 'Sem dados em cache';

  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m atrás`;
  }
  return `${minutes}m atrás`;
}
