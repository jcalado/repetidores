/**
 * Repeater V2 Type Definitions
 *
 * This module defines the new repeater data model supporting:
 * - Multiple frequencies per repeater
 * - Multiple modes (replacing single modulation string + boolean flags)
 * - Extended digital mode configurations (DMR, D-STAR, C4FM, TETRA, Echolink)
 * - New operational fields (nodeType, isCrossband, sysops, authorizedUntil, privateUrls)
 */

// ============================================================================
// Basic Types
// ============================================================================

export type Band = '6m' | '2m' | '70cm' | '23cm' | '13cm' | 'other';

export type NodeType = 'repeater' | 'simplex';

export type RepeaterMode = 'FM' | 'DMR' | 'C4FM' | 'DSTAR' | 'Digipeater' | 'TETRA';

export type FMBandwidth = 'narrow' | 'wide';

// ============================================================================
// Frequency Configuration
// ============================================================================

export interface FrequencyPair {
  /** Output (TX) frequency in MHz */
  outputFrequency: number;
  /** Input (RX) frequency in MHz */
  inputFrequency: number;
  /** CTCSS tone in Hz (optional) */
  tone?: number;
  /** Whether this is the primary frequency pair for listings */
  isPrimary?: boolean;
}

// ============================================================================
// Digital Mode Configurations
// ============================================================================

export type DMRTalkgroupType = 'static' | 'cluster' | 'timed' | 'dynamic';

export interface DMRTalkgroup {
  /** Talkgroup ID */
  tgId: number;
  /** Human-readable name (optional) */
  name?: string;
  /** Subscription type */
  type: DMRTalkgroupType;
  /** Extended talkgroup for clusters */
  extTalkgroup?: number;
  /** Days for timed subscriptions (e.g., "Wed,Sat") */
  days?: string;
  /** Start time for timed subscriptions (HH:MM) */
  startTime?: string;
  /** End time for timed subscriptions (HH:MM) */
  endTime?: string;
}

export interface DMRBlockedTalkgroup {
  tgId: number;
  slot?: '1' | '2' | 'both';
}

export interface DMRConfig {
  /** DMR color code (1-15) */
  colorCode?: number;
  /** DMR ID of the repeater */
  dmrId?: number;
  /** Network name (e.g., "Brandmeister", "DMR-MARC") */
  network?: string;
  /** TS1 talkgroups (all types) */
  ts1Talkgroups?: DMRTalkgroup[];
  /** TS2 talkgroups (all types) */
  ts2Talkgroups?: DMRTalkgroup[];
  /** Blocked talkgroups */
  blockedTalkgroups?: DMRBlockedTalkgroup[];
  /** When BM profile was last synced */
  bmProfileSyncedAt?: string;
}

export interface DSTARConfig {
  /** Connected reflector (e.g., "REF001") */
  reflector?: string;
  /** D-STAR module (A, B, C, or D) */
  module?: 'A' | 'B' | 'C' | 'D';
  /** Gateway callsign */
  gateway?: string;
}

export interface C4FMConfig {
  /** Wires-X node number or YSF reflector */
  node?: string;
  /** Connected room */
  room?: string;
  /** Network type */
  network?: 'wires-x' | 'ysf' | 'other';
}

export interface TETRAConfig {
  /** Available talkgroups */
  talkgroups: number[];
  /** Network name */
  network?: string;
}

export interface EcholinkConfig {
  /** Whether Echolink is enabled */
  enabled: boolean;
  /** Echolink node number */
  nodeNumber?: number;
  /** Connected conference (e.g., "*ENGLISH*") */
  conference?: string;
}

// ============================================================================
// Operational Information
// ============================================================================

export interface Sysop {
  /** Sysop's callsign */
  callsign: string;
  /** Sysop's name (optional) */
  name?: string;
  /** Role in repeater operation */
  role?: 'primary' | 'secondary' | 'technical';
}

export interface PrivateUrl {
  /** Type of URL (e.g., "dashboard", "statistics", "admin") */
  type: string;
  /** The URL */
  url: string;
  /** Description of what the URL is for */
  description?: string;
}

export interface Association {
  id: number;
  name: string;
  abbreviation: string;
  slug: string;
}

// ============================================================================
// Main Repeater Interface (V2)
// ============================================================================

export interface RepeaterV2 {
  /** Database ID */
  id?: number | string;

  // === Identification ===
  /** Repeater callsign (unique identifier) */
  callsign: string;
  /** Type of node */
  nodeType: NodeType;

  // === Frequencies ===
  /** Frequency pairs (supports multiple for multi-band repeaters) */
  frequencies: FrequencyPair[];

  // === Modes ===
  /** Supported modes (replaces modulation string + boolean flags) */
  modes: RepeaterMode[];
  /** FM bandwidth setting */
  fmBandwidth?: FMBandwidth;

  // === Location ===
  /** Latitude in decimal degrees */
  latitude: number;
  /** Longitude in decimal degrees */
  longitude: number;
  /** Maidenhead grid locator (auto-computed from coordinates) */
  qthLocator?: string;
  /** Physical address or location description */
  address?: string;

  // === Technical Specs ===
  /** Transmit power in watts */
  power?: number;
  /** Antenna height in meters AGL */
  antennaHeight?: number;
  /** Coverage area estimate */
  coverage?: 'local' | 'regional' | 'wide';
  /** Whether this is a cross-band repeater (auto-computed from frequencies) */
  isCrossband?: boolean;

  // === Digital Mode Configurations ===
  /** DMR configuration (when modes includes 'DMR') */
  dmr?: DMRConfig;
  /** D-STAR configuration (when modes includes 'DSTAR') */
  dstar?: DSTARConfig;
  /** C4FM/Fusion configuration (when modes includes 'C4FM') */
  c4fm?: C4FMConfig;
  /** TETRA configuration (when modes includes 'TETRA') */
  tetra?: TETRAConfig;
  /** Echolink configuration */
  echolink?: EcholinkConfig;
  /** AllStar node number */
  allstarNode?: number;

  // === Ownership/Operation ===
  /** Operating association (relationship) */
  association?: Association;
  /** Owner name (deprecated, use association) */
  owner?: string;
  /** System operators */
  sysops?: Sysop[];
  /** Authorization expiry date (ISO string) */
  authorizedUntil?: string;

  // === Status ===
  /** Operational status */
  status?: 'active' | 'maintenance' | 'offline' | 'unknown';
  /** Operating hours description */
  operatingHours?: string;
  /** When information was last verified (ISO string) */
  lastVerified?: string;

  // === Additional Info ===
  /** Public notes */
  notes?: string;
  /** Public website URL */
  website?: string;
  /** Private/admin URLs (restricted access) */
  privateUrls?: PrivateUrl[];
}

// ============================================================================
// Legacy Type (for backward compatibility during migration)
// ============================================================================

/**
 * Legacy repeater format (V1)
 * Used for backward compatibility with existing data
 */
export interface LegacyRepeater {
  callsign: string;
  outputFrequency: number;
  inputFrequency: number;
  tone: number;
  modulation: string;
  latitude: number;
  longitude: number;
  qth_locator: string;
  owner: string;
  dmr: boolean;
  dstar: boolean;
  association?: Association;
  status?: 'active' | 'maintenance' | 'offline' | 'unknown';
  power?: number;
  antennaHeight?: number;
  coverage?: 'local' | 'regional' | 'wide';
  dmrColorCode?: number;
  dmrTalkgroups?: string;
  dstarReflector?: string;
  dstarModule?: 'A' | 'B' | 'C' | 'D';
  echolinkNode?: number;
  allstarNode?: number;
  operatingHours?: string;
  lastVerified?: string;
  notes?: string;
  website?: string;
}
