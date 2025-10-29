// TLE (Two-Line Element) data fetcher for ISS
// Fetches orbital parameters from CelesTrak with localStorage caching

import { TLEData } from './types';

const ISS_CATALOG_NUMBER = '25544';
const CELESTRAK_URL = `https://celestrak.org/NORAD/elements/gp.php?CATNR=${ISS_CATALOG_NUMBER}&FORMAT=TLE`;
const CACHE_KEY = 'iss_tle_cache';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface TLEFetchResult {
  data: TLEData | null;
  cached: boolean;
  error?: string;
}

/**
 * Fetches ISS TLE data with localStorage caching
 * Cache expires after 24 hours
 */
export async function fetchISSTLE(forceRefresh = false): Promise<TLEFetchResult> {
  // Check cache first (unless force refresh)
  if (!forceRefresh && typeof window !== 'undefined') {
    const cached = getCachedTLE();
    if (cached) {
      return { data: cached, cached: true };
    }
  }

  // Fetch fresh TLE data
  try {
    const response = await fetch(CELESTRAK_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/plain',
      },
      // Disable cache for fresh data
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    const lines = text.trim().split('\n');

    // TLE format: 3 lines (name, line1, line2)
    if (lines.length < 3) {
      throw new Error('Invalid TLE format: expected at least 3 lines');
    }

    // Extract TLE lines (skip the name line)
    const tleData: TLEData = {
      line1: lines[1].trim(),
      line2: lines[2].trim(),
      fetchedAt: Date.now(),
    };

    // Validate TLE format
    if (!isValidTLE(tleData)) {
      throw new Error('Invalid TLE format: checksum or structure error');
    }

    // Cache the result
    if (typeof window !== 'undefined') {
      cacheTLE(tleData);
    }

    return { data: tleData, cached: false };

  } catch (error) {
    console.error('Error fetching ISS TLE:', error);

    // Try to return cached data even if expired
    if (typeof window !== 'undefined') {
      const cached = getCachedTLE(true); // ignore expiry
      if (cached) {
        return {
          data: cached,
          cached: true,
          error: `Failed to fetch fresh TLE: ${error instanceof Error ? error.message : 'Unknown error'}. Using cached data.`,
        };
      }
    }

    return {
      data: null,
      cached: false,
      error: `Failed to fetch TLE: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Gets cached TLE data from localStorage
 */
function getCachedTLE(ignoreExpiry = false): TLEData | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const tleData: TLEData = JSON.parse(cached);

    // Check if cache is expired (unless ignoring expiry)
    if (!ignoreExpiry) {
      const age = Date.now() - tleData.fetchedAt;
      if (age > CACHE_DURATION_MS) {
        return null;
      }
    }

    return tleData;
  } catch (error) {
    console.error('Error reading TLE cache:', error);
    return null;
  }
}

/**
 * Caches TLE data in localStorage
 */
function cacheTLE(tleData: TLEData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(tleData));
  } catch (error) {
    console.error('Error caching TLE:', error);
  }
}

/**
 * Validates TLE format and checksums
 */
function isValidTLE(tle: TLEData): boolean {
  const { line1, line2 } = tle;

  // Check line lengths (69 characters each)
  if (line1.length !== 69 || line2.length !== 69) {
    return false;
  }

  // Check line numbers
  if (!line1.startsWith('1 ') || !line2.startsWith('2 ')) {
    return false;
  }

  // Validate checksums
  if (!validateTLEChecksum(line1) || !validateTLEChecksum(line2)) {
    return false;
  }

  return true;
}

/**
 * Validates a TLE line checksum
 * Checksum is modulo-10 sum of all digits, treating '-' as 1
 */
function validateTLEChecksum(line: string): boolean {
  let sum = 0;

  // Sum first 68 characters (excluding checksum at position 68)
  for (let i = 0; i < 68; i++) {
    const char = line[i];
    if (char >= '0' && char <= '9') {
      sum += parseInt(char);
    } else if (char === '-') {
      sum += 1;
    }
  }

  const expectedChecksum = sum % 10;
  const actualChecksum = parseInt(line[68]);

  return expectedChecksum === actualChecksum;
}

/**
 * Clears TLE cache
 */
export function clearTLECache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing TLE cache:', error);
  }
}

/**
 * Gets the age of cached TLE data in milliseconds
 * Returns null if no cache exists
 */
export function getCacheAge(): number | null {
  const cached = getCachedTLE(true); // ignore expiry
  if (!cached) return null;
  return Date.now() - cached.fetchedAt;
}

/**
 * Formats cache age as human-readable string
 */
export function formatCacheAge(ageMs: number | null): string {
  if (ageMs === null) return 'No cached data';

  const hours = Math.floor(ageMs / (1000 * 60 * 60));
  const minutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  return `${minutes}m ago`;
}
