// Optical visibility calculator for ISS passes
// Determines if ISS is visible to the naked eye

import { TLEData, ObserverLocation, ISSPass, VisibilityConditions } from './types';
import { calculateSunPosition, isSatelliteInSunlight } from './satellite-calculations';

// Civil twilight threshold: sun 6° below horizon
const TWILIGHT_ANGLE = -6;

/**
 * Calculates visibility conditions at a specific time
 */
export function calculateVisibility(
  tle: TLEData,
  observer: ObserverLocation,
  date: Date,
  satelliteElevation: number
): VisibilityConditions {
  // Check if observer is in darkness (civil twilight or darker)
  const sunPosition = calculateSunPosition(observer, date);
  const observerInDarkness = sunPosition.elevation < TWILIGHT_ANGLE;

  // Check if satellite is sunlit
  const satelliteSunlit = isSatelliteInSunlight(tle, date);

  // Satellite must be above horizon
  const satelliteAboveHorizon = satelliteElevation > 0;

  // All conditions must be met for visibility
  const isVisible = observerInDarkness && satelliteSunlit && satelliteAboveHorizon;

  return {
    observerInDarkness,
    satelliteSunlit,
    satelliteAboveHorizon,
    isVisible,
  };
}

/**
 * Determines if a pass is optically visible
 * Returns true if the satellite is visible at any point during the pass
 */
export function isPassVisible(
  tle: TLEData,
  observer: ObserverLocation,
  pass: ISSPass
): boolean {
  // Check visibility at key points: start, max elevation, end
  const checkPoints = [
    { date: pass.startTime, elevation: pass.trajectory[0].lookAngles.elevation },
    { date: pass.maxElevationTime, elevation: pass.maxElevation },
    { date: pass.endTime, elevation: pass.trajectory[pass.trajectory.length - 1].lookAngles.elevation },
  ];

  // Also check middle points for long passes
  if (pass.trajectory.length > 6) {
    const midIndex = Math.floor(pass.trajectory.length / 2);
    checkPoints.push({
      date: pass.trajectory[midIndex].date,
      elevation: pass.trajectory[midIndex].lookAngles.elevation,
    });
  }

  // Pass is visible if any checkpoint is visible
  return checkPoints.some(point => {
    const visibility = calculateVisibility(tle, observer, point.date, point.elevation);
    return visibility.isVisible;
  });
}

/**
 * Enriches passes with visibility information
 */
export function enrichPassesWithVisibility(
  tle: TLEData,
  observer: ObserverLocation,
  passes: ISSPass[]
): ISSPass[] {
  return passes.map(pass => ({
    ...pass,
    isVisible: isPassVisible(tle, observer, pass),
  }));
}

/**
 * Filters passes by visibility
 */
export function filterVisiblePasses(passes: ISSPass[]): ISSPass[] {
  return passes.filter(pass => pass.isVisible);
}

/**
 * Gets the best viewing time during a pass
 * Returns the time when visibility conditions are optimal
 */
export function getBestViewingTime(
  tle: TLEData,
  observer: ObserverLocation,
  pass: ISSPass
): Date {
  let bestTime = pass.maxElevationTime;
  let bestScore = 0;

  // Sample visibility throughout the pass
  for (const moment of pass.trajectory) {
    const visibility = calculateVisibility(tle, observer, moment.date, moment.lookAngles.elevation);

    if (visibility.isVisible) {
      // Score based on elevation (higher is better)
      const score = moment.lookAngles.elevation;

      if (score > bestScore) {
        bestScore = score;
        bestTime = moment.date;
      }
    }
  }

  return bestTime;
}

/**
 * Calculates the duration of optical visibility during a pass
 * Returns duration in seconds
 */
export function getVisibleDuration(
  tle: TLEData,
  observer: ObserverLocation,
  pass: ISSPass
): number {
  let visibleSeconds = 0;
  let wasVisible = false;
  let visibleStart: Date | null = null;

  for (const moment of pass.trajectory) {
    const visibility = calculateVisibility(tle, observer, moment.date, moment.lookAngles.elevation);

    if (visibility.isVisible && !wasVisible) {
      visibleStart = moment.date;
      wasVisible = true;
    } else if (!visibility.isVisible && wasVisible && visibleStart) {
      visibleSeconds += (moment.date.getTime() - visibleStart.getTime()) / 1000;
      wasVisible = false;
      visibleStart = null;
    }
  }

  // Handle case where visibility extends to end of pass
  if (wasVisible && visibleStart) {
    visibleSeconds += (pass.endTime.getTime() - visibleStart.getTime()) / 1000;
  }

  return visibleSeconds;
}

/**
 * Gets visibility windows during a pass
 * Returns array of {start, end} time ranges when satellite is visible
 */
export interface VisibilityWindow {
  start: Date;
  end: Date;
  duration: number; // seconds
}

export function getVisibilityWindows(
  tle: TLEData,
  observer: ObserverLocation,
  pass: ISSPass
): VisibilityWindow[] {
  const windows: VisibilityWindow[] = [];
  let wasVisible = false;
  let windowStart: Date | null = null;

  for (const moment of pass.trajectory) {
    const visibility = calculateVisibility(tle, observer, moment.date, moment.lookAngles.elevation);

    if (visibility.isVisible && !wasVisible) {
      windowStart = moment.date;
      wasVisible = true;
    } else if (!visibility.isVisible && wasVisible && windowStart) {
      windows.push({
        start: windowStart,
        end: moment.date,
        duration: (moment.date.getTime() - windowStart.getTime()) / 1000,
      });
      wasVisible = false;
      windowStart = null;
    }
  }

  // Handle case where visibility extends to end of pass
  if (wasVisible && windowStart) {
    windows.push({
      start: windowStart,
      end: pass.endTime,
      duration: (pass.endTime.getTime() - windowStart.getTime()) / 1000,
    });
  }

  return windows;
}

/**
 * Gets sun elevation at a specific time for a location
 */
export function getSunElevation(observer: ObserverLocation, date: Date): number {
  const sunPosition = calculateSunPosition(observer, date);
  return sunPosition.elevation;
}

/**
 * Determines twilight type based on sun elevation
 */
export function getTwilightType(sunElevation: number): 'day' | 'civil' | 'nautical' | 'astronomical' | 'night' {
  if (sunElevation > 0) return 'day';
  if (sunElevation > -6) return 'civil';
  if (sunElevation > -12) return 'nautical';
  if (sunElevation > -18) return 'astronomical';
  return 'night';
}
