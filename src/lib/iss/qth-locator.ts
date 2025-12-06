// Maidenhead (QTH) Locator System Utilities
// Converts between geographic coordinates and Maidenhead grid squares
// Used by ham radio operators to specify locations

export interface LatLon {
  latitude: number;
  longitude: number;
}

/**
 * Converts a Maidenhead locator (QTH) to latitude/longitude coordinates
 * Supports 4-character (e.g., "IM58") and 6-character (e.g., "IM58kr") locators
 * Returns the center point of the grid square
 */
export function qthToLatLon(locator: string): LatLon | null {
  // Normalize: uppercase and trim
  const qth = locator.toUpperCase().trim();

  // Validate format (4 or 6 characters)
  if (!/^[A-R]{2}[0-9]{2}([A-X]{2})?$/.test(qth)) {
    return null;
  }

  // Extract components
  const field1 = qth.charCodeAt(0) - 'A'.charCodeAt(0); // 0-17
  const field2 = qth.charCodeAt(1) - 'A'.charCodeAt(0); // 0-17
  const square1 = parseInt(qth[2]); // 0-9
  const square2 = parseInt(qth[3]); // 0-9

  // Calculate longitude (field + square)
  let lon = (field1 * 20) - 180; // Field: 20° each
  lon += square1 * 2; // Square: 2° each

  // Calculate latitude (field + square)
  let lat = (field2 * 10) - 90; // Field: 10° each
  lat += square2 * 1; // Square: 1° each

  // Add subsquare precision if present (6-character locator)
  if (qth.length === 6) {
    const subsquare1 = qth.charCodeAt(4) - 'A'.charCodeAt(0); // 0-23
    const subsquare2 = qth.charCodeAt(5) - 'A'.charCodeAt(0); // 0-23

    lon += (subsquare1 * 2) / 24; // Subsquare: 2°/24 = 5' each
    lat += (subsquare2 * 1) / 24; // Subsquare: 1°/24 = 2.5' each
  }

  // Adjust to center of grid square
  if (qth.length === 4) {
    lon += 1; // Center of 2° square
    lat += 0.5; // Center of 1° square
  } else {
    lon += (2 / 24) / 2; // Center of 5' subsquare
    lat += (1 / 24) / 2; // Center of 2.5' subsquare
  }

  return { latitude: lat, longitude: lon };
}

/**
 * Converts latitude/longitude to a Maidenhead locator (QTH)
 * @param lat Latitude in degrees (-90 to 90)
 * @param lon Longitude in degrees (-180 to 180)
 * @param precision 4 or 6 characters (default: 6)
 */
export function latLonToQth(lat: number, lon: number, precision: 4 | 6 = 6): string {
  // Validate input
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    throw new Error('Invalid coordinates: lat must be -90 to 90, lon must be -180 to 180');
  }

  // Adjust coordinates to 0-based
  const adjustedLon = lon + 180;
  const adjustedLat = lat + 90;

  // Field (18 longitude zones × 18 latitude zones)
  const field1 = Math.floor(adjustedLon / 20);
  const field2 = Math.floor(adjustedLat / 10);

  // Square (10 longitude zones × 10 latitude zones within each field)
  const square1 = Math.floor((adjustedLon % 20) / 2);
  const square2 = Math.floor((adjustedLat % 10) / 1);

  let locator = '';
  locator += String.fromCharCode('A'.charCodeAt(0) + field1);
  locator += String.fromCharCode('A'.charCodeAt(0) + field2);
  locator += square1.toString();
  locator += square2.toString();

  // Add subsquare if 6-character precision requested
  if (precision === 6) {
    const subsquare1 = Math.floor(((adjustedLon % 20) % 2) / (2 / 24));
    const subsquare2 = Math.floor(((adjustedLat % 10) % 1) / (1 / 24));

    locator += String.fromCharCode('a'.charCodeAt(0) + subsquare1);
    locator += String.fromCharCode('a'.charCodeAt(0) + subsquare2);
  }

  return locator;
}

/**
 * Validates a Maidenhead locator format
 */
export function isValidQth(locator: string): boolean {
  const qth = locator.toUpperCase().trim();
  return /^[A-R]{2}[0-9]{2}([A-X]{2})?$/.test(qth);
}

/**
 * Calculates the approximate distance between two Maidenhead locators in km
 * Uses simple great circle distance (haversine formula)
 */
export function distanceBetweenQth(qth1: string, qth2: string): number | null {
  const coord1 = qthToLatLon(qth1);
  const coord2 = qthToLatLon(qth2);

  if (!coord1 || !coord2) return null;

  return haversineDistance(coord1, coord2);
}

/**
 * Haversine formula for great circle distance
 */
function haversineDistance(coord1: LatLon, coord2: LatLon): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
    Math.cos(toRadians(coord2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

/**
 * Calculates the initial bearing from coord1 to coord2
 * Returns bearing in degrees (0-360, where 0 = North)
 */
export function calculateBearing(coord1: LatLon, coord2: LatLon): number {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
}

/**
 * Calculates bearing between two QTH locators
 * Returns bearing in degrees (0-360, where 0 = North)
 */
export function bearingBetweenQth(qth1: string, qth2: string): number | null {
  const coord1 = qthToLatLon(qth1);
  const coord2 = qthToLatLon(qth2);

  if (!coord1 || !coord2) return null;

  return calculateBearing(coord1, coord2);
}

/**
 * Converts bearing in degrees to cardinal direction
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

/**
 * Calculates distance between two coordinates in km
 */
export function distanceBetweenCoords(coord1: LatLon, coord2: LatLon): number {
  return haversineDistance(coord1, coord2);
}
