// Amateur Radio Satellite Catalog
// Merges data from CelesTrak TLEs, SatNOGS transmitters, and curated metadata

import {
  SatelliteInfo,
  SatelliteCategory,
  SatelliteWithTLE,
  TLEEntry,
  SatNOGSTransmitter,
  CATEGORY_LABELS,
} from './types';
import { fetchBulkTLE, getTLEByNoradId } from './tle-bulk-fetcher';
import {
  fetchSatelliteTransmitters,
  getTransmittersByNoradId,
  getPrimaryTransmitter,
  getCategoryFromTransmitter,
  getFormattedFrequencies,
} from './satnogs-api';
import {
  getCuratedSatellite,
  getAllCuratedSatellites,
  FEATURED_SATELLITES,
  DEFAULT_SATELLITE_NORAD_ID,
} from './satellite-metadata';
import { TLEData } from '../iss/types';

// Re-export types for convenience
export type { SatelliteInfo, SatelliteWithTLE };
export { SatelliteCategory, CATEGORY_LABELS };

/**
 * Builds a complete satellite list by merging TLE data with metadata
 */
export async function buildSatelliteCatalog(): Promise<{
  satellites: SatelliteWithTLE[];
  error?: string;
}> {
  // Fetch TLE data
  const tleResult = await fetchBulkTLE();
  if (!tleResult.data) {
    return {
      satellites: [],
      error: tleResult.error || 'Failed to fetch TLE data',
    };
  }

  // Fetch SatNOGS transmitter data (don't fail if this doesn't work)
  let transmitters: SatNOGSTransmitter[] = [];
  try {
    const transmitterResult = await fetchSatelliteTransmitters();
    transmitters = transmitterResult.data || [];
  } catch {
    console.warn('Failed to fetch SatNOGS data, using curated metadata only');
  }

  const satellites: SatelliteWithTLE[] = [];
  const tleEntries = tleResult.data.satellites;

  // Process each satellite from TLE data
  for (const [noradId, tleEntry] of Object.entries(tleEntries)) {
    const satellite = buildSatelliteInfo(noradId, tleEntry, transmitters);
    satellites.push(satellite);
  }

  // Sort: featured first, then alphabetically
  satellites.sort((a, b) => {
    const aFeatured = FEATURED_SATELLITES.includes(a.noradId);
    const bFeatured = FEATURED_SATELLITES.includes(b.noradId);
    if (aFeatured && !bFeatured) return -1;
    if (!aFeatured && bFeatured) return 1;
    return a.name.localeCompare(b.name);
  });

  return { satellites, error: tleResult.error };
}

/**
 * Builds satellite info by merging TLE, SatNOGS, and curated data
 */
function buildSatelliteInfo(
  noradId: string,
  tleEntry: TLEEntry,
  transmitters: SatNOGSTransmitter[]
): SatelliteWithTLE {
  // Check for curated metadata first (highest priority)
  const curated = getCuratedSatellite(noradId);

  // Get SatNOGS transmitters for this satellite
  const satTransmitters = getTransmittersByNoradId(transmitters, noradId);
  const primaryTransmitter = getPrimaryTransmitter(satTransmitters);

  // Determine category
  let category: SatelliteCategory;
  if (curated) {
    category = curated.category;
  } else if (primaryTransmitter) {
    category = getCategoryFromTransmitter(primaryTransmitter);
  } else {
    category = SatelliteCategory.OTHER;
  }

  // Get frequencies
  let uplink: string | undefined;
  let downlink: string | undefined;
  let mode: string | undefined;

  if (curated) {
    uplink = curated.uplink;
    downlink = curated.downlink;
    mode = curated.mode;
  } else if (primaryTransmitter) {
    const freqs = getFormattedFrequencies(primaryTransmitter);
    uplink = freqs.uplink || undefined;
    downlink = freqs.downlink || undefined;
    mode = primaryTransmitter.mode || undefined;
  }

  // Build the satellite ID (slug)
  const id = curated?.id || noradId;

  return {
    id,
    name: curated?.name || tleEntry.name,
    noradId,
    category,
    uplink,
    downlink,
    mode,
    description: curated?.description,
    status: curated?.status || 'unknown',
    tle: tleEntry,
    transmitters: satTransmitters.length > 0 ? satTransmitters : undefined,
  };
}

/**
 * Gets satellites grouped by category
 */
export function groupSatellitesByCategory(
  satellites: SatelliteWithTLE[]
): Record<SatelliteCategory, SatelliteWithTLE[]> {
  const grouped: Record<SatelliteCategory, SatelliteWithTLE[]> = {
    [SatelliteCategory.FM_VOICE]: [],
    [SatelliteCategory.LINEAR]: [],
    [SatelliteCategory.DIGITAL]: [],
    [SatelliteCategory.WEATHER]: [],
    [SatelliteCategory.OTHER]: [],
  };

  for (const sat of satellites) {
    grouped[sat.category].push(sat);
  }

  return grouped;
}

/**
 * Gets satellites by category
 */
export function getSatellitesByCategory(
  satellites: SatelliteWithTLE[],
  category: SatelliteCategory
): SatelliteWithTLE[] {
  return satellites.filter(sat => sat.category === category);
}

/**
 * Searches satellites by name or NORAD ID
 */
export function searchSatellites(
  satellites: SatelliteWithTLE[],
  query: string
): SatelliteWithTLE[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return satellites;

  return satellites.filter(sat =>
    sat.name.toLowerCase().includes(normalizedQuery) ||
    sat.noradId.includes(normalizedQuery) ||
    sat.id.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Gets a satellite by NORAD ID from a list
 */
export function getSatelliteByNoradId(
  satellites: SatelliteWithTLE[],
  noradId: string
): SatelliteWithTLE | undefined {
  return satellites.find(sat => sat.noradId === noradId);
}

/**
 * Gets a satellite by ID from a list
 */
export function getSatelliteById(
  satellites: SatelliteWithTLE[],
  id: string
): SatelliteWithTLE | undefined {
  return satellites.find(sat => sat.id === id);
}

/**
 * Gets TLE data for a specific satellite
 */
export function getSatelliteTLE(noradId: string): TLEData | null {
  return getTLEByNoradId(noradId);
}

/**
 * Gets the default satellite (ISS)
 */
export function getDefaultSatellite(satellites: SatelliteWithTLE[]): SatelliteWithTLE | undefined {
  return getSatelliteByNoradId(satellites, DEFAULT_SATELLITE_NORAD_ID);
}

/**
 * Gets featured satellites
 */
export function getFeaturedSatellites(satellites: SatelliteWithTLE[]): SatelliteWithTLE[] {
  return satellites.filter(sat => FEATURED_SATELLITES.includes(sat.noradId));
}

/**
 * Gets category counts
 */
export function getCategoryCounts(
  satellites: SatelliteWithTLE[]
): Record<SatelliteCategory, number> {
  const counts: Record<SatelliteCategory, number> = {
    [SatelliteCategory.FM_VOICE]: 0,
    [SatelliteCategory.LINEAR]: 0,
    [SatelliteCategory.DIGITAL]: 0,
    [SatelliteCategory.WEATHER]: 0,
    [SatelliteCategory.OTHER]: 0,
  };

  for (const sat of satellites) {
    counts[sat.category]++;
  }

  return counts;
}

// ============================================
// Legacy exports for backward compatibility
// ============================================

/**
 * @deprecated Use buildSatelliteCatalog() instead
 * Legacy static satellite list for backward compatibility
 */
export const SATELLITES = getAllCuratedSatellites();

/**
 * @deprecated Use getDefaultSatellite() instead
 */
export const DEFAULT_SATELLITE = SATELLITES[0];
