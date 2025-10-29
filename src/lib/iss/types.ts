// TypeScript types for ISS pass calculator

export interface ObserverLocation {
  latitude: number;
  longitude: number;
  altitude?: number; // meters above sea level
  name?: string; // e.g., "Lisbon" or QTH locator
}

export interface TLEData {
  line1: string;
  line2: string;
  fetchedAt: number; // timestamp
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number; // km
  velocity: number; // km/s
}

export interface LookAngles {
  azimuth: number; // degrees (0-360, 0=North, 90=East)
  elevation: number; // degrees (-90 to 90, 0=horizon)
  range: number; // km
  rangeRate: number; // km/s
}

export interface PassMoment {
  date: Date;
  position: SatellitePosition;
  lookAngles: LookAngles;
}

export interface ISSPass {
  startTime: Date; // AOS (Acquisition of Signal)
  endTime: Date; // LOS (Loss of Signal)
  maxElevation: number; // degrees
  maxElevationTime: Date;
  startAzimuth: number; // degrees
  maxAzimuth: number; // degrees at max elevation
  endAzimuth: number; // degrees
  duration: number; // seconds
  isVisible: boolean; // optical visibility (sunlit satellite + dark sky)
  trajectory: PassMoment[]; // position samples throughout pass
}

export interface PassFilters {
  minElevation: number; // minimum elevation in degrees
  visibleOnly: boolean; // filter for optically visible passes
  maxResults?: number; // limit number of results
}

export interface SunPosition {
  azimuth: number;
  elevation: number;
}

export interface VisibilityConditions {
  observerInDarkness: boolean; // sun below -6° (civil twilight)
  satelliteSunlit: boolean; // satellite in sunlight
  satelliteAboveHorizon: boolean;
  isVisible: boolean; // all conditions met
}
