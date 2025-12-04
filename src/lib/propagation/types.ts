// Solar Flux data from NOAA SWPC
export interface SolarFluxData {
  flux: number;
  timestamp: Date;
}

// K-Index data from NOAA SWPC
export interface KIndexData {
  kp: number;
  aRunning: number;
  timestamp: Date;
}

// Solar Wind data from NOAA SWPC
export interface SolarWindData {
  speed: number; // km/s
  timestamp: Date;
}

// Geomagnetic scales from NOAA SWPC
export interface GeomagneticScales {
  r: { scale: number; text: string }; // Radio blackout
  s: { scale: number; text: string }; // Solar radiation
  g: { scale: number; text: string }; // Geomagnetic storm
  timestamp: Date;
}

// Aggregated Solar Indices
export interface SolarIndices {
  solarFlux: SolarFluxData | null;
  kIndex: KIndexData | null;
  solarWind: SolarWindData | null;
  geomagneticScales: GeomagneticScales | null;
}

// HF Band Conditions
export type BandCondition = 'good' | 'fair' | 'poor' | 'unknown';

export interface HFBandConditions {
  band: string; // e.g., "80m-40m", "30m-20m", "17m-15m", "12m-10m"
  day: BandCondition;
  night: BandCondition;
}

// VHF/UHF Condition Status
export type VHFConditionStatus = 'open' | 'possible' | 'closed' | 'unknown';

// VHF Propagation Conditions
export interface VHFConditions {
  sporadicE: VHFConditionStatus;
  tropospheric: VHFConditionStatus;
  aurora: VHFConditionStatus;
  meteorScatter: VHFConditionStatus;
}

// HamQSL Combined Data
export interface HamQSLData {
  solarFlux: number;
  sunspotNumber: number;
  aIndex: number;
  kIndex: number;
  xRay: string;
  geomagField: 'quiet' | 'unsettled' | 'active' | 'storm';
  solarWind: number;
  signalNoise: string;
  hfBands: HFBandConditions[];
  vhf: VHFConditions;
  lastUpdated: Date;
}

// Complete Propagation State
export interface PropagationState {
  solarIndices: SolarIndices | null;
  hamQSL: HamQSLData | null;
  isLoading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}
