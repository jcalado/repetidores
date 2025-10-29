// ISS pass prediction algorithm
// Finds all passes over a location for a given time period

import { TLEData, ObserverLocation, ISSPass, PassMoment, PassFilters } from './types';
import { calculateLookAngles, calculateSatellitePosition } from './satellite-calculations';

const TIME_STEP_MS = 60 * 1000; // 1 minute steps for pass detection
const TRAJECTORY_STEP_MS = 10 * 1000; // 10 second steps for trajectory sampling

/**
 * Predicts all ISS passes over a location for the next N days
 */
export function predictPasses(
  tle: TLEData,
  observer: ObserverLocation,
  startDate: Date,
  durationDays: number = 7,
  filters?: PassFilters
): ISSPass[] {
  const passes: ISSPass[] = [];
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  let currentTime = new Date(startDate);
  let wasAboveHorizon = false;
  let passStart: Date | null = null;
  let passData: PassMoment[] = [];

  // Step through time, detecting horizon crossings
  while (currentTime <= endDate) {
    const lookAngles = calculateLookAngles(tle, observer, currentTime);

    if (lookAngles) {
      const isAboveHorizon = lookAngles.elevation > 0;

      // AOS (Acquisition of Signal) - satellite rises above horizon
      if (isAboveHorizon && !wasAboveHorizon) {
        passStart = new Date(currentTime);
        passData = [];
      }

      // Track pass data while above horizon
      if (isAboveHorizon && passStart) {
        const position = calculateSatellitePosition(tle, currentTime);
        if (position) {
          passData.push({
            date: new Date(currentTime),
            position,
            lookAngles,
          });
        }
      }

      // LOS (Loss of Signal) - satellite sets below horizon
      if (!isAboveHorizon && wasAboveHorizon && passStart && passData.length > 0) {
        // Complete the pass
        const pass = buildPass(passStart, passData);

        // Apply filters
        if (shouldIncludePass(pass, filters)) {
          passes.push(pass);
        }

        // Reset for next pass
        passStart = null;
        passData = [];
      }

      wasAboveHorizon = isAboveHorizon;
    }

    // Advance time
    currentTime = new Date(currentTime.getTime() + TIME_STEP_MS);
  }

  // Handle case where pass extends beyond prediction window
  if (passStart && passData.length > 0) {
    const pass = buildPass(passStart, passData);
    if (shouldIncludePass(pass, filters)) {
      passes.push(pass);
    }
  }

  // Apply max results limit if specified
  if (filters?.maxResults && passes.length > filters.maxResults) {
    return passes.slice(0, filters.maxResults);
  }

  return passes;
}

/**
 * Builds a complete pass object from trajectory data
 */
function buildPass(startTime: Date, trajectory: PassMoment[]): ISSPass {
  if (trajectory.length === 0) {
    throw new Error('Cannot build pass with empty trajectory');
  }

  // Find max elevation
  let maxElevation = -90;
  let maxElevationTime = startTime;
  let maxElevationIndex = 0;

  trajectory.forEach((moment, index) => {
    if (moment.lookAngles.elevation > maxElevation) {
      maxElevation = moment.lookAngles.elevation;
      maxElevationTime = moment.date;
      maxElevationIndex = index;
    }
  });

  const endTime = trajectory[trajectory.length - 1].date;
  const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds

  return {
    startTime,
    endTime,
    maxElevation,
    maxElevationTime,
    startAzimuth: trajectory[0].lookAngles.azimuth,
    maxAzimuth: trajectory[maxElevationIndex].lookAngles.azimuth,
    endAzimuth: trajectory[trajectory.length - 1].lookAngles.azimuth,
    duration,
    isVisible: false, // Will be calculated by visibility-calculator
    trajectory,
  };
}

/**
 * Refines pass trajectory with higher resolution for better visualization
 */
export function refinePassTrajectory(
  tle: TLEData,
  observer: ObserverLocation,
  pass: ISSPass
): ISSPass {
  const refinedTrajectory: PassMoment[] = [];
  let currentTime = new Date(pass.startTime);

  while (currentTime <= pass.endTime) {
    const lookAngles = calculateLookAngles(tle, observer, currentTime);
    const position = calculateSatellitePosition(tle, currentTime);

    if (lookAngles && position) {
      refinedTrajectory.push({
        date: new Date(currentTime),
        position,
        lookAngles,
      });
    }

    currentTime = new Date(currentTime.getTime() + TRAJECTORY_STEP_MS);
  }

  // Ensure end point is included
  if (refinedTrajectory.length === 0 || refinedTrajectory[refinedTrajectory.length - 1].date.getTime() < pass.endTime.getTime()) {
    const lookAngles = calculateLookAngles(tle, observer, pass.endTime);
    const position = calculateSatellitePosition(tle, pass.endTime);

    if (lookAngles && position) {
      refinedTrajectory.push({
        date: new Date(pass.endTime),
        position,
        lookAngles,
      });
    }
  }

  return {
    ...pass,
    trajectory: refinedTrajectory,
  };
}

/**
 * Determines if a pass should be included based on filters
 */
function shouldIncludePass(pass: ISSPass, filters?: PassFilters): boolean {
  if (!filters) return true;

  // Filter by minimum elevation
  if (filters.minElevation !== undefined && pass.maxElevation < filters.minElevation) {
    return false;
  }

  // Filter by visibility (handled separately by visibility-calculator)
  // This is applied after visibility is calculated

  return true;
}

/**
 * Finds the next upcoming pass from current time
 */
export function getNextPass(
  tle: TLEData,
  observer: ObserverLocation,
  currentDate: Date = new Date()
): ISSPass | null {
  const passes = predictPasses(tle, observer, currentDate, 1); // Check next 24 hours
  return passes.length > 0 ? passes[0] : null;
}

/**
 * Checks if ISS is currently overhead (above horizon)
 */
export function isCurrentlyOverhead(
  tle: TLEData,
  observer: ObserverLocation,
  currentDate: Date = new Date()
): { overhead: boolean; lookAngles: ReturnType<typeof calculateLookAngles> } {
  const lookAngles = calculateLookAngles(tle, observer, currentDate);
  const overhead = lookAngles ? lookAngles.elevation > 0 : false;
  return { overhead, lookAngles };
}

/**
 * Calculates time until next AOS (Acquisition of Signal)
 */
export function getTimeUntilNextPass(
  tle: TLEData,
  observer: ObserverLocation,
  currentDate: Date = new Date()
): number | null {
  const nextPass = getNextPass(tle, observer, currentDate);
  if (!nextPass) return null;

  const timeUntil = nextPass.startTime.getTime() - currentDate.getTime();
  return timeUntil > 0 ? timeUntil : null;
}

/**
 * Formats pass duration as human-readable string
 */
export function formatPassDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

/**
 * Calculates pass quality score (0-100) based on max elevation
 * Higher elevation = better visibility and longer pass
 */
export function getPassQualityScore(maxElevation: number): number {
  // 90° elevation = 100 score
  // 0° elevation = 0 score
  return Math.round((maxElevation / 90) * 100);
}

/**
 * Categorizes pass quality
 */
export function getPassQuality(maxElevation: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (maxElevation >= 60) return 'excellent';
  if (maxElevation >= 40) return 'good';
  if (maxElevation >= 20) return 'fair';
  return 'poor';
}
