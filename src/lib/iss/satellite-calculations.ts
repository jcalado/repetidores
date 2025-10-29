// Satellite position and look angle calculations using satellite.js
// Wraps satellite.js SGP4 propagator for ISS tracking

import * as satellite from 'satellite.js';
import { TLEData, ObserverLocation, SatellitePosition, LookAngles, SunPosition } from './types';

/**
 * Calculates the satellite's position at a given time
 */
export function calculateSatellitePosition(
  tle: TLEData,
  date: Date
): SatellitePosition | null {
  try {
    // Initialize satellite record from TLE
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    // Propagate satellite position
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity || !positionAndVelocity.position) {
      console.error('Satellite propagation error');
      return null;
    }

    const position = positionAndVelocity.position as satellite.EciVec3<number>;
    const velocity = positionAndVelocity.velocity as satellite.EciVec3<number>;

    // Convert ECI coordinates to geodetic (lat/lon/alt)
    const gmst = satellite.gstime(date);
    const geodeticCoords = satellite.eciToGeodetic(position, gmst);

    // Calculate velocity magnitude
    const velocityMagnitude = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );

    return {
      latitude: satellite.degreesLat(geodeticCoords.latitude),
      longitude: satellite.degreesLong(geodeticCoords.longitude),
      altitude: geodeticCoords.height, // km
      velocity: velocityMagnitude, // km/s
    };
  } catch (error) {
    console.error('Error calculating satellite position:', error);
    return null;
  }
}

/**
 * Calculates look angles (azimuth, elevation, range) from observer to satellite
 */
export function calculateLookAngles(
  tle: TLEData,
  observer: ObserverLocation,
  date: Date
): LookAngles | null {
  try {
    // Initialize satellite record
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    // Propagate satellite position
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity || !positionAndVelocity.position) {
      return null;
    }

    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;

    // Observer position in geodetic coordinates
    const observerGd: satellite.GeodeticLocation = {
      latitude: satellite.degreesToRadians(observer.latitude),
      longitude: satellite.degreesToRadians(observer.longitude),
      height: (observer.altitude || 0) / 1000, // convert m to km
    };

    // Convert ECI to ECF (Earth-Centered Fixed) using GMST
    const gmst = satellite.gstime(date);
    const positionEcf = satellite.eciToEcf(positionEci, gmst);

    // Calculate look angles from observer to satellite in ECF frame
    const lookAngles = satellite.ecfToLookAngles(observerGd, positionEcf);

    // Convert radians to degrees
    // azimuth: 0-360° (use degreesLong or manual conversion)
    // elevation: -90 to 90° (use degreesLat)
    const azimuthDeg = lookAngles.azimuth * (180 / Math.PI);
    const elevationDeg = lookAngles.elevation * (180 / Math.PI);

    return {
      azimuth: azimuthDeg < 0 ? azimuthDeg + 360 : azimuthDeg, // Normalize to 0-360°
      elevation: elevationDeg, // -90 to 90°
      range: lookAngles.rangeSat, // km
      rangeRate: 0, // satellite.js doesn't provide this directly
    };
  } catch (error) {
    console.error('Error calculating look angles:', error);
    return null;
  }
}

/**
 * Calculates sun position for visibility determination
 * Uses simplified solar position algorithm
 */
export function calculateSunPosition(
  observer: ObserverLocation,
  date: Date
): SunPosition {
  // Julian date calculation
  const jd = dateToJulianDate(date);
  const jc = (jd - 2451545.0) / 36525.0;

  // Mean longitude of the sun (degrees)
  const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;

  // Mean anomaly of the sun (degrees)
  const M = (357.52911 + jc * (35999.05029 - 0.0001537 * jc)) % 360;
  const Mrad = M * Math.PI / 180;

  // Ecliptic longitude of the sun (degrees)
  const C = (1.914602 - jc * (0.004817 + 0.000014 * jc)) * Math.sin(Mrad)
    + (0.019993 - 0.000101 * jc) * Math.sin(2 * Mrad)
    + 0.000289 * Math.sin(3 * Mrad);
  const sunLon = L0 + C;

  // Obliquity of the ecliptic
  const epsilon = 23.439291 - 0.0130042 * jc;

  // Right ascension and declination
  const sunLonRad = sunLon * Math.PI / 180;
  const epsilonRad = epsilon * Math.PI / 180;

  const ra = Math.atan2(Math.cos(epsilonRad) * Math.sin(sunLonRad), Math.cos(sunLonRad));
  const dec = Math.asin(Math.sin(epsilonRad) * Math.sin(sunLonRad));

  // Local hour angle
  const gmst = satellite.gstime(date);
  const lst = gmst + observer.longitude * Math.PI / 180;
  const ha = lst - ra;

  // Observer latitude in radians
  const latRad = observer.latitude * Math.PI / 180;

  // Altitude and azimuth
  const sinAlt = Math.sin(latRad) * Math.sin(dec) + Math.cos(latRad) * Math.cos(dec) * Math.cos(ha);
  const altitude = Math.asin(sinAlt);

  const cosAz = (Math.sin(dec) - Math.sin(latRad) * sinAlt) / (Math.cos(latRad) * Math.cos(altitude));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz)));

  // Adjust azimuth for quadrant
  if (Math.sin(ha) > 0) {
    azimuth = 2 * Math.PI - azimuth;
  }

  return {
    azimuth: azimuth * 180 / Math.PI, // Convert to degrees
    elevation: altitude * 180 / Math.PI, // Convert to degrees
  };
}

/**
 * Checks if satellite is in sunlight
 * Returns true if satellite is illuminated by the sun
 */
export function isSatelliteInSunlight(
  tle: TLEData,
  date: Date
): boolean {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity || !positionAndVelocity.position) {
      return false;
    }

    const position = positionAndVelocity.position as satellite.EciVec3<number>;

    // Calculate sun position in ECI coordinates
    const jd = dateToJulianDate(date);
    const jc = (jd - 2451545.0) / 36525.0;

    const M = (357.52911 + jc * (35999.05029 - 0.0001537 * jc)) % 360;
    const L0 = (280.46646 + jc * (36000.76983 + jc * 0.0003032)) % 360;
    const C = (1.914602 - jc * (0.004817 + 0.000014 * jc)) * Math.sin(M * Math.PI / 180);
    const sunLon = (L0 + C) * Math.PI / 180;

    const sunDistance = 149598000; // km (1 AU)
    const sunPosEci = {
      x: sunDistance * Math.cos(sunLon),
      y: sunDistance * Math.sin(sunLon),
      z: 0,
    };

    // Vector from satellite to sun
    const satToSun = {
      x: sunPosEci.x - position.x,
      y: sunPosEci.y - position.y,
      z: sunPosEci.z - position.z,
    };

    // Check if Earth is blocking the sun (satellite in Earth's shadow)
    const earthRadius = 6371; // km
    const satAltitude = Math.sqrt(position.x * position.x + position.y * position.y + position.z * position.z);

    // Simple shadow check: if satellite is close to Earth and sun vector points away from Earth
    const dotProduct = position.x * satToSun.x + position.y * satToSun.y + position.z * satToSun.z;

    // If dot product is positive, satellite is on sunlit side
    // Also check if satellite is high enough to avoid umbra
    const inShadow = dotProduct < 0 && satAltitude < (earthRadius + 2000);

    return !inShadow;
  } catch (error) {
    console.error('Error checking satellite sunlight:', error);
    return false;
  }
}

/**
 * Converts Date to Julian Date
 */
function dateToJulianDate(date: Date): number {
  const time = date.getTime();
  return (time / 86400000) + 2440587.5;
}

/**
 * Converts compass degrees to cardinal direction
 */
export function azimuthToCardinal(azimuth: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(azimuth / 22.5) % 16;
  return directions[index];
}
