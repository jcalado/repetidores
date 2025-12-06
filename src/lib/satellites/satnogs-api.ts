// SatNOGS API client for satellite transmitter metadata
// Fetches frequencies, modes, and status information

import { SatNOGSTransmitter, TransmitterCache, SatelliteCategory, MODE_TO_CATEGORY } from './types';

const SATNOGS_API_URL = 'https://db.satnogs.org/api/transmitters/';
const CACHE_KEY = 'satnogs_transmitters_cache';
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export interface TransmitterFetchResult {
  data: SatNOGSTransmitter[] | null;
  cached: boolean;
  error?: string;
}

/**
 * Gets cached transmitter data from localStorage
 */
function getCachedTransmitters(ignoreExpiry = false): TransmitterCache | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const cache: TransmitterCache = JSON.parse(cached);

    if (!ignoreExpiry) {
      const age = Date.now() - cache.fetchedAt;
      if (age > CACHE_DURATION_MS) {
        return null;
      }
    }

    return cache;
  } catch (error) {
    console.error('Error reading SatNOGS cache:', error);
    return null;
  }
}

/**
 * Caches transmitter data in localStorage
 */
function cacheTransmitters(transmitters: SatNOGSTransmitter[]): void {
  if (typeof window === 'undefined') return;

  try {
    const cache: TransmitterCache = {
      fetchedAt: Date.now(),
      transmitters,
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error caching SatNOGS data:', error);
  }
}

/**
 * Fetches all transmitter data from SatNOGS API
 */
export async function fetchSatelliteTransmitters(forceRefresh = false): Promise<TransmitterFetchResult> {
  // Check cache first
  if (!forceRefresh) {
    const cached = getCachedTransmitters();
    if (cached) {
      return {
        data: cached.transmitters,
        cached: true,
      };
    }
  }

  try {
    const response = await fetch(SATNOGS_API_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const transmitters: SatNOGSTransmitter[] = await response.json();

    // Filter to only alive transmitters to reduce cache size
    const aliveTransmitters = transmitters.filter(t => t.alive);

    cacheTransmitters(aliveTransmitters);

    return {
      data: aliveTransmitters,
      cached: false,
    };

  } catch (error) {
    console.error('Error fetching SatNOGS transmitters:', error);

    // Try expired cache
    const cached = getCachedTransmitters(true);
    if (cached) {
      return {
        data: cached.transmitters,
        cached: true,
        error: `Failed to fetch fresh data: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    return {
      data: null,
      cached: false,
      error: `Failed to fetch transmitters: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Gets transmitters for a specific satellite by NORAD ID
 */
export function getTransmittersByNoradId(transmitters: SatNOGSTransmitter[], noradId: string): SatNOGSTransmitter[] {
  const noradNum = parseInt(noradId, 10);
  return transmitters.filter(t => t.norad_cat_id === noradNum && t.alive);
}

/**
 * Formats frequency in MHz
 */
export function formatFrequency(freq: number | null): string | null {
  if (freq === null) return null;
  const mhz = freq / 1000000;
  return `${mhz.toFixed(3)} MHz`;
}

/**
 * Gets the primary transmitter for a satellite (highest frequency downlink)
 */
export function getPrimaryTransmitter(transmitters: SatNOGSTransmitter[]): SatNOGSTransmitter | null {
  if (transmitters.length === 0) return null;

  // Prefer transmitters with downlink frequencies
  const withDownlink = transmitters.filter(t => t.downlink_low !== null);
  if (withDownlink.length > 0) {
    return withDownlink[0];
  }

  return transmitters[0];
}

/**
 * Determines satellite category from transmitter mode
 */
export function getCategoryFromTransmitter(transmitter: SatNOGSTransmitter | null): SatelliteCategory {
  if (!transmitter || !transmitter.mode) {
    return SatelliteCategory.OTHER;
  }

  const mode = transmitter.mode.toUpperCase();

  // Check direct mode mapping
  if (MODE_TO_CATEGORY[mode]) {
    return MODE_TO_CATEGORY[mode];
  }

  // Check if mode contains any known patterns
  for (const [key, category] of Object.entries(MODE_TO_CATEGORY)) {
    if (mode.includes(key)) {
      return category;
    }
  }

  return SatelliteCategory.OTHER;
}

/**
 * Gets formatted uplink/downlink strings for a transmitter
 */
export function getFormattedFrequencies(transmitter: SatNOGSTransmitter): {
  uplink: string | null;
  downlink: string | null;
} {
  let uplink: string | null = null;
  let downlink: string | null = null;

  if (transmitter.uplink_low !== null) {
    if (transmitter.uplink_high !== null && transmitter.uplink_high !== transmitter.uplink_low) {
      uplink = `${formatFrequency(transmitter.uplink_low)} - ${formatFrequency(transmitter.uplink_high)}`;
    } else {
      uplink = formatFrequency(transmitter.uplink_low);
    }
  }

  if (transmitter.downlink_low !== null) {
    if (transmitter.downlink_high !== null && transmitter.downlink_high !== transmitter.downlink_low) {
      downlink = `${formatFrequency(transmitter.downlink_low)} - ${formatFrequency(transmitter.downlink_high)}`;
    } else {
      downlink = formatFrequency(transmitter.downlink_low);
    }
  }

  return { uplink, downlink };
}

/**
 * Clears the SatNOGS cache
 */
export function clearSatNOGSCache(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing SatNOGS cache:', error);
  }
}
