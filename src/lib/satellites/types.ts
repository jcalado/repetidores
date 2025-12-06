// Satellite tracking types

export enum SatelliteCategory {
  FM_VOICE = 'fm-voice',
  LINEAR = 'linear',
  DIGITAL = 'digital',
  WEATHER = 'weather',
  OTHER = 'other'
}

export interface SatelliteInfo {
  id: string;
  name: string;
  noradId: string;
  category: SatelliteCategory;
  uplink?: string;
  downlink?: string;
  mode?: string;
  description?: string;
  status?: 'active' | 'inactive' | 'unknown';
}

export interface TLEEntry {
  name: string;
  line1: string;
  line2: string;
}

export interface BulkTLECache {
  fetchedAt: number;
  satellites: Record<string, TLEEntry>;
}

export interface SatNOGSTransmitter {
  uuid: string;
  description: string;
  alive: boolean;
  type: string;
  uplink_low: number | null;
  uplink_high: number | null;
  uplink_drift: number | null;
  downlink_low: number | null;
  downlink_high: number | null;
  downlink_drift: number | null;
  mode: string | null;
  mode_id: number | null;
  uplink_mode: string | null;
  invert: boolean;
  baud: number | null;
  norad_cat_id: number;
  status: string;
  updated: string;
  citation: string;
  service: string;
}

export interface TransmitterCache {
  fetchedAt: number;
  transmitters: SatNOGSTransmitter[];
}

export interface SatelliteWithTLE extends SatelliteInfo {
  tle: TLEEntry | null;
  transmitters?: SatNOGSTransmitter[];
}

// Category display names in Portuguese
export const CATEGORY_LABELS: Record<SatelliteCategory, string> = {
  [SatelliteCategory.FM_VOICE]: 'FM Voice',
  [SatelliteCategory.LINEAR]: 'Linear (SSB/CW)',
  [SatelliteCategory.DIGITAL]: 'Digital',
  [SatelliteCategory.WEATHER]: 'Meteorologia',
  [SatelliteCategory.OTHER]: 'Outros',
};

// Mode to category mapping
export const MODE_TO_CATEGORY: Record<string, SatelliteCategory> = {
  'FM': SatelliteCategory.FM_VOICE,
  'AFSK': SatelliteCategory.DIGITAL,
  'APRS': SatelliteCategory.DIGITAL,
  'AX.25': SatelliteCategory.DIGITAL,
  'BPSK': SatelliteCategory.DIGITAL,
  'CW': SatelliteCategory.LINEAR,
  'DQPSK': SatelliteCategory.DIGITAL,
  'DSTAR': SatelliteCategory.DIGITAL,
  'FSK': SatelliteCategory.DIGITAL,
  'GFSK': SatelliteCategory.DIGITAL,
  'GMSK': SatelliteCategory.DIGITAL,
  'LRPT': SatelliteCategory.WEATHER,
  'MSK': SatelliteCategory.DIGITAL,
  'OQPSK': SatelliteCategory.DIGITAL,
  'PSK': SatelliteCategory.DIGITAL,
  'QPSK': SatelliteCategory.DIGITAL,
  'SSB': SatelliteCategory.LINEAR,
  'USB': SatelliteCategory.LINEAR,
  'LSB': SatelliteCategory.LINEAR,
  'SSTV': SatelliteCategory.DIGITAL,
  'APT': SatelliteCategory.WEATHER,
  'HRPT': SatelliteCategory.WEATHER,
};
