/**
 * Repeater Helper Functions
 *
 * Utility functions for working with repeater data, including:
 * - Band detection from frequency
 * - Cross-band and simplex detection
 * - Legacy to V2 migration
 */

import type {
  Band,
  FrequencyPair,
  RepeaterV2,
  LegacyRepeater,
  RepeaterMode,
  DMRConfig,
  DSTARConfig,
  EcholinkConfig,
} from './repeater';

// ============================================================================
// Band Detection
// ============================================================================

/**
 * Determine the amateur radio band from a frequency in MHz
 */
export function getBandFromFrequency(mhz: number): Band {
  if (mhz >= 50 && mhz <= 54) return '6m';
  if (mhz >= 144 && mhz <= 148) return '2m';
  if (mhz >= 430 && mhz <= 450) return '70cm';
  if (mhz >= 1240 && mhz <= 1300) return '23cm';
  if (mhz >= 2300 && mhz <= 2450) return '13cm';
  return 'other';
}

/**
 * Get human-readable band name
 */
export function getBandDisplayName(band: Band): string {
  const names: Record<Band, string> = {
    '6m': '6 meters (50 MHz)',
    '2m': '2 meters (144 MHz)',
    '70cm': '70 centimeters (430 MHz)',
    '23cm': '23 centimeters (1.2 GHz)',
    '13cm': '13 centimeters (2.3 GHz)',
    'other': 'Other',
  };
  return names[band];
}

// ============================================================================
// Repeater Type Detection
// ============================================================================

/**
 * Determine if a repeater is cross-band (input and output on different bands)
 */
export function isCrossbandRepeater(frequencies: FrequencyPair[]): boolean {
  if (frequencies.length === 0) return false;

  // Check the primary frequency pair, or first pair if no primary
  const primary = frequencies.find((f) => f.isPrimary) || frequencies[0];
  const inputBand = getBandFromFrequency(primary.inputFrequency);
  const outputBand = getBandFromFrequency(primary.outputFrequency);

  return inputBand !== outputBand;
}

/**
 * Determine if a node is simplex (same input and output frequency)
 */
export function isSimplexNode(frequencies: FrequencyPair[]): boolean {
  if (frequencies.length === 0) return false;

  // Check if any frequency pair is simplex
  return frequencies.some(
    (f) => Math.abs(f.outputFrequency - f.inputFrequency) < 0.0001
  );
}

/**
 * Get the primary frequency pair from a repeater
 */
export function getPrimaryFrequency(
  repeater: RepeaterV2
): FrequencyPair | undefined {
  if (!repeater.frequencies || repeater.frequencies.length === 0) {
    return undefined;
  }
  return (
    repeater.frequencies.find((f) => f.isPrimary) || repeater.frequencies[0]
  );
}

/**
 * Calculate frequency offset in kHz
 */
export function getFrequencyOffset(pair: FrequencyPair): number {
  return (pair.inputFrequency - pair.outputFrequency) * 1000;
}

/**
 * Format frequency offset for display (e.g., "+600 kHz", "-600 kHz", "Simplex")
 */
export function formatFrequencyOffset(pair: FrequencyPair): string {
  const offsetKhz = getFrequencyOffset(pair);
  if (Math.abs(offsetKhz) < 1) return 'Simplex';
  const sign = offsetKhz > 0 ? '+' : '';
  return `${sign}${offsetKhz.toFixed(0)} kHz`;
}

// ============================================================================
// Legacy Migration
// ============================================================================

/**
 * Parse legacy DMR talkgroups string into structured array
 * Handles formats like "26801, 26802" or "26801/Portucale, 26802/Lisbon"
 */
function parseDmrTalkgroupsString(
  talkgroupsStr: string
): { tgId: number; name?: string }[] {
  if (!talkgroupsStr?.trim()) return [];

  return talkgroupsStr
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      // Check if format is "tgId/name" or just "tgId"
      const slashIndex = item.indexOf('/');
      if (slashIndex > 0) {
        const tgId = parseInt(item.substring(0, slashIndex).trim(), 10);
        const name = item.substring(slashIndex + 1).trim();
        return Number.isFinite(tgId) ? { tgId, name: name || undefined } : null;
      }
      const tgId = parseInt(item, 10);
      return Number.isFinite(tgId) ? { tgId } : null;
    })
    .filter((tg): tg is { tgId: number; name?: string } => tg !== null);
}

/**
 * Detect modes from legacy modulation string and boolean flags
 */
function detectModesFromLegacy(legacy: LegacyRepeater): RepeaterMode[] {
  const modes: RepeaterMode[] = [];
  const modulation = legacy.modulation?.toUpperCase() || '';

  // Check explicit DMR/D-STAR flags first (most reliable)
  if (legacy.dmr) modes.push('DMR');
  if (legacy.dstar) modes.push('DSTAR');

  // Parse modulation string for additional modes
  if (modulation.includes('FM') && !modes.includes('DMR') && !modes.includes('DSTAR')) {
    modes.push('FM');
  }
  if (modulation.includes('C4FM')) modes.push('C4FM');
  if (modulation.includes('TETRA')) modes.push('TETRA');
  if (modulation.includes('DIGIPEATER')) modes.push('Digipeater');

  // Handle combined modulation values
  if (modulation === 'DMR' && !modes.includes('DMR')) modes.push('DMR');
  if (modulation === 'D-STAR' && !modes.includes('DSTAR')) modes.push('DSTAR');
  if (modulation === 'DMR / D-STAR' || modulation === 'DMR/D-STAR') {
    if (!modes.includes('DMR')) modes.push('DMR');
    if (!modes.includes('DSTAR')) modes.push('DSTAR');
  }

  // Default to FM if no modes detected
  if (modes.length === 0) {
    modes.push('FM');
  }

  return modes;
}

/**
 * Migrate a legacy (V1) repeater to V2 format
 */
export function migrateFromLegacy(legacy: LegacyRepeater): RepeaterV2 {
  // Build frequency pair from legacy flat fields
  const frequencies: FrequencyPair[] = [
    {
      outputFrequency: legacy.outputFrequency,
      inputFrequency: legacy.inputFrequency,
      tone: legacy.tone || undefined,
      isPrimary: true,
    },
  ];

  // Detect modes from legacy format
  const modes = detectModesFromLegacy(legacy);

  // Build DMR config if applicable
  let dmr: DMRConfig | undefined;
  if (modes.includes('DMR') || legacy.dmr || legacy.dmrColorCode) {
    const talkgroups = parseDmrTalkgroupsString(legacy.dmrTalkgroups || '');
    dmr = {
      colorCode: legacy.dmrColorCode || 1,
      // Put all talkgroups on TS2 by default (common configuration)
      ts2StaticTalkgroups: talkgroups.length > 0 ? talkgroups : undefined,
      ts2DynamicAllowed: true,
    };
  }

  // Build D-STAR config if applicable
  let dstar: DSTARConfig | undefined;
  if (modes.includes('DSTAR') || legacy.dstar || legacy.dstarReflector) {
    dstar = {
      reflector: legacy.dstarReflector || undefined,
      module: legacy.dstarModule || undefined,
    };
  }

  // Build Echolink config if applicable
  let echolink: EcholinkConfig | undefined;
  if (legacy.echolinkNode) {
    echolink = {
      enabled: true,
      nodeNumber: legacy.echolinkNode,
    };
  }

  // Determine node type
  const isSimplex = isSimplexNode(frequencies);
  const nodeType = isSimplex ? 'simplex' : 'repeater';

  // Check for cross-band
  const crossband = isCrossbandRepeater(frequencies);

  return {
    callsign: legacy.callsign,
    nodeType,
    frequencies,
    modes,
    latitude: legacy.latitude,
    longitude: legacy.longitude,
    qthLocator: legacy.qth_locator || undefined,
    power: legacy.power,
    antennaHeight: legacy.antennaHeight,
    coverage: legacy.coverage,
    isCrossband: crossband || undefined,
    dmr,
    dstar,
    echolink,
    allstarNode: legacy.allstarNode,
    association: legacy.association,
    owner: legacy.owner || undefined,
    status: legacy.status,
    operatingHours: legacy.operatingHours,
    lastVerified: legacy.lastVerified,
    notes: legacy.notes,
    website: legacy.website,
  };
}

// ============================================================================
// V2 to Legacy (for backward compatibility in components not yet migrated)
// ============================================================================

/**
 * Convert V2 repeater back to legacy format
 * Useful for components that haven't been updated yet
 */
export function toLegacyFormat(repeater: RepeaterV2): LegacyRepeater {
  const primary = getPrimaryFrequency(repeater);

  // Determine legacy modulation string
  let modulation = 'FM';
  if (repeater.modes.includes('DMR') && repeater.modes.includes('DSTAR')) {
    modulation = 'DMR / D-STAR';
  } else if (repeater.modes.includes('DMR')) {
    modulation = 'DMR';
  } else if (repeater.modes.includes('DSTAR')) {
    modulation = 'D-STAR';
  } else if (repeater.modes.includes('C4FM')) {
    modulation = 'C4FM';
  } else if (repeater.modes.includes('TETRA')) {
    modulation = 'TETRA';
  }

  // Convert talkgroups back to string
  let dmrTalkgroups: string | undefined;
  const talkgroups = [
    ...(repeater.dmr?.ts1StaticTalkgroups || []),
    ...(repeater.dmr?.ts2StaticTalkgroups || []),
  ];
  if (talkgroups.length > 0) {
    dmrTalkgroups = talkgroups
      .map((tg) => (tg.name ? `${tg.tgId}/${tg.name}` : String(tg.tgId)))
      .join(', ');
  }

  return {
    callsign: repeater.callsign,
    outputFrequency: primary?.outputFrequency || 0,
    inputFrequency: primary?.inputFrequency || 0,
    tone: primary?.tone || 0,
    modulation,
    latitude: repeater.latitude,
    longitude: repeater.longitude,
    qth_locator: repeater.qthLocator || '',
    owner: repeater.owner || '',
    dmr: repeater.modes.includes('DMR'),
    dstar: repeater.modes.includes('DSTAR'),
    association: repeater.association,
    status: repeater.status,
    power: repeater.power,
    antennaHeight: repeater.antennaHeight,
    coverage: repeater.coverage,
    dmrColorCode: repeater.dmr?.colorCode,
    dmrTalkgroups,
    dstarReflector: repeater.dstar?.reflector,
    dstarModule: repeater.dstar?.module,
    echolinkNode: repeater.echolink?.nodeNumber,
    allstarNode: repeater.allstarNode,
    operatingHours: repeater.operatingHours,
    lastVerified: repeater.lastVerified,
    notes: repeater.notes,
    website: repeater.website,
  };
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if a repeater object is in V2 format
 */
export function isRepeaterV2(
  repeater: RepeaterV2 | LegacyRepeater
): repeater is RepeaterV2 {
  return (
    'frequencies' in repeater &&
    Array.isArray(repeater.frequencies) &&
    'modes' in repeater &&
    Array.isArray(repeater.modes)
  );
}

/**
 * Check if a repeater object is in legacy format
 */
export function isLegacyRepeater(
  repeater: RepeaterV2 | LegacyRepeater
): repeater is LegacyRepeater {
  return (
    'modulation' in repeater &&
    typeof repeater.modulation === 'string' &&
    !('frequencies' in repeater)
  );
}

/**
 * Ensure a repeater is in V2 format, migrating if necessary
 */
export function ensureV2Format(
  repeater: RepeaterV2 | LegacyRepeater
): RepeaterV2 {
  if (isRepeaterV2(repeater)) {
    return repeater;
  }
  return migrateFromLegacy(repeater);
}
