/**
 * Line of Sight calculation utilities for radio propagation analysis
 */

export interface LatLon {
  latitude: number;
  longitude: number;
}

export interface ElevationPoint {
  distance: number; // km from start
  elevation: number; // meters above sea level
  latitude: number;
  longitude: number;
}

export interface LOSPoint extends ElevationPoint {
  losElevation: number; // LOS line elevation at this point (meters)
  fresnelRadius: number; // Fresnel zone radius at this point (meters)
  clearance: number; // Clearance above terrain (meters), negative if blocked
  fresnelClearancePercent: number; // Percentage of Fresnel zone clear (0-100+)
}

export type LOSStatus = "clear" | "marginal" | "blocked";

export interface LOSResult {
  status: LOSStatus;
  points: LOSPoint[];
  worstClearance: number; // meters
  worstFresnelPercent: number; // percentage
  totalDistance: number; // km
  bearing: number; // degrees
}

// Earth radius in km (using 4/3 effective radius for RF propagation)
const EARTH_RADIUS = 6371;
const EFFECTIVE_EARTH_RADIUS = EARTH_RADIUS * (4 / 3);

/**
 * Calculate the Fresnel zone radius at a point along the path
 * @param d1 - Distance from transmitter to point (km)
 * @param d2 - Distance from point to receiver (km)
 * @param frequencyMHz - Frequency in MHz
 * @returns Fresnel zone radius in meters
 */
export function calculateFresnelZone(
  d1: number,
  d2: number,
  frequencyMHz: number
): number {
  const frequencyGHz = frequencyMHz / 1000;
  const totalDistance = d1 + d2;
  if (totalDistance === 0 || frequencyGHz === 0) return 0;

  // FZ = 17.32 * sqrt(d1 * d2 / (f * D)) where distances in km, f in GHz
  return 17.32 * Math.sqrt((d1 * d2) / (frequencyGHz * totalDistance));
}

/**
 * Calculate the earth bulge (curvature effect) at a point
 * @param d1 - Distance from start to point (km)
 * @param d2 - Distance from point to end (km)
 * @returns Earth bulge in meters
 */
export function calculateEarthBulge(d1: number, d2: number): number {
  // Earth bulge = (d1 * d2) / (2 * k * R) where k=4/3 for RF
  // Simplified: bulge = (d1 * d2) / (2 * effectiveRadius) * 1000 for meters
  return ((d1 * d2) / (2 * EFFECTIVE_EARTH_RADIUS)) * 1000;
}

/**
 * Calculate the LOS line elevation at a point along the path
 * Accounts for antenna heights and earth curvature
 */
export function calculateLOSElevation(
  startElevation: number,
  endElevation: number,
  startAntennaHeight: number,
  endAntennaHeight: number,
  d1: number,
  totalDistance: number
): number {
  if (totalDistance === 0) return startElevation + startAntennaHeight;

  const startHeight = startElevation + startAntennaHeight;
  const endHeight = endElevation + endAntennaHeight;
  const fraction = d1 / totalDistance;

  // Linear interpolation between start and end heights
  const linearHeight = startHeight + (endHeight - startHeight) * fraction;

  // Subtract earth bulge (LOS line appears to curve down relative to earth surface)
  const d2 = totalDistance - d1;
  const earthBulge = calculateEarthBulge(d1, d2);

  return linearHeight - earthBulge;
}

/**
 * Analyze LOS clearance for an elevation profile
 */
export function analyzeLOS(
  elevationProfile: ElevationPoint[],
  startAntennaHeight: number,
  endAntennaHeight: number,
  frequencyMHz: number
): LOSResult {
  if (elevationProfile.length < 2) {
    return {
      status: "clear",
      points: [],
      worstClearance: 0,
      worstFresnelPercent: 100,
      totalDistance: 0,
      bearing: 0,
    };
  }

  const totalDistance =
    elevationProfile[elevationProfile.length - 1].distance;
  const startElevation = elevationProfile[0].elevation;
  const endElevation = elevationProfile[elevationProfile.length - 1].elevation;

  // Calculate bearing
  const bearing = calculateBearing(
    elevationProfile[0],
    elevationProfile[elevationProfile.length - 1]
  );

  let worstClearance = Infinity;
  let worstFresnelPercent = 100;

  const points: LOSPoint[] = elevationProfile.map((point, index) => {
    const d1 = point.distance;
    const d2 = totalDistance - d1;

    // Skip endpoints for Fresnel calculation (radius is 0 at endpoints)
    const fresnelRadius =
      index === 0 || index === elevationProfile.length - 1
        ? 0
        : calculateFresnelZone(d1, d2, frequencyMHz);

    const losElevation = calculateLOSElevation(
      startElevation,
      endElevation,
      startAntennaHeight,
      endAntennaHeight,
      d1,
      totalDistance
    );

    // Clearance is LOS height minus terrain height
    const clearance = losElevation - point.elevation;

    // Fresnel clearance percentage (100% = Fresnel zone completely clear)
    const fresnelClearancePercent =
      fresnelRadius > 0 ? (clearance / fresnelRadius) * 100 : 100;

    // Track worst case (excluding endpoints)
    if (index > 0 && index < elevationProfile.length - 1) {
      if (clearance < worstClearance) {
        worstClearance = clearance;
      }
      if (fresnelClearancePercent < worstFresnelPercent) {
        worstFresnelPercent = fresnelClearancePercent;
      }
    }

    return {
      ...point,
      losElevation,
      fresnelRadius,
      clearance,
      fresnelClearancePercent,
    };
  });

  // Determine status based on worst Fresnel clearance
  let status: LOSStatus;
  if (worstClearance < 0) {
    status = "blocked";
  } else if (worstFresnelPercent >= 60) {
    status = "clear";
  } else if (worstFresnelPercent >= 20) {
    status = "marginal";
  } else {
    status = "blocked";
  }

  return {
    status,
    points,
    worstClearance,
    worstFresnelPercent,
    totalDistance,
    bearing,
  };
}

/**
 * Calculate bearing between two points
 */
export function calculateBearing(start: LatLon, end: LatLon): number {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const dLon = ((end.longitude - start.longitude) * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate distance between two points using Haversine formula
 */
export function calculateDistanceKm(start: LatLon, end: LatLon): number {
  const lat1 = (start.latitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((end.longitude - start.longitude) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS * c;
}

/**
 * Generate intermediate points along a great circle path
 */
export function generatePathPoints(
  start: LatLon,
  end: LatLon,
  numPoints: number
): LatLon[] {
  const points: LatLon[] = [];

  const lat1 = (start.latitude * Math.PI) / 180;
  const lon1 = (start.longitude * Math.PI) / 180;
  const lat2 = (end.latitude * Math.PI) / 180;
  const lon2 = (end.longitude * Math.PI) / 180;

  const d = calculateDistanceKm(start, end) / EARTH_RADIUS;

  // Handle edge case when start and end are the same or very close
  if (d < 0.000001) {
    for (let i = 0; i <= numPoints; i++) {
      points.push({ ...start });
    }
    return points;
  }

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;

    const a = Math.sin((1 - f) * d) / Math.sin(d);
    const b = Math.sin(f * d) / Math.sin(d);

    const x =
      a * Math.cos(lat1) * Math.cos(lon1) + b * Math.cos(lat2) * Math.cos(lon2);
    const y =
      a * Math.cos(lat1) * Math.sin(lon1) + b * Math.cos(lat2) * Math.sin(lon2);
    const z = a * Math.sin(lat1) + b * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lon = Math.atan2(y, x);

    points.push({
      latitude: (lat * 180) / Math.PI,
      longitude: (lon * 180) / Math.PI,
    });
  }

  return points;
}

// Get the API base URL for elevation proxy
const getApiBaseUrl = () =>
  process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
  process.env.PAYLOAD_API_BASE_URL ||
  "https://api.radioamador.info";

/**
 * Fetch elevation data via backend proxy (to avoid CORS issues)
 */
export async function fetchElevationProfile(
  start: LatLon,
  end: LatLon,
  numSamples: number = 50
): Promise<ElevationPoint[]> {
  const pathPoints = generatePathPoints(start, end, numSamples);
  const totalDistance = calculateDistanceKm(start, end);

  // Build locations parameter (pipe-separated lat,lon pairs)
  const locations = pathPoints
    .map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
    .join("|");

  // Use backend proxy to avoid CORS issues with Open Topo Data API
  const apiBaseUrl = getApiBaseUrl();
  const url = `${apiBaseUrl}/api/elevation?locations=${encodeURIComponent(locations)}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("Taxa de pedidos excedida. Por favor, tente novamente mais tarde.");
    }
    throw new Error(`Elevation API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.status !== "OK" || !data.results) {
    throw new Error(data.error || "Failed to fetch elevation data");
  }

  return data.results.map(
    (
      result: { elevation: number; location: { lat: number; lng: number } },
      index: number
    ) => ({
      distance: (index / numSamples) * totalDistance,
      elevation: result.elevation ?? 0,
      latitude: result.location.lat,
      longitude: result.location.lng,
    })
  );
}

/**
 * Convert bearing to cardinal direction
 */
export function bearingToCardinal(bearing: number): string {
  const directions = [
    "N",
    "NNE",
    "NE",
    "ENE",
    "E",
    "ESE",
    "SE",
    "SSE",
    "S",
    "SSW",
    "SW",
    "WSW",
    "W",
    "WNW",
    "NW",
    "NNW",
  ];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}
