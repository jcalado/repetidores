import { NOAA_ENDPOINTS, PROPAGATION_ENDPOINT } from './constants';
import type {
  SolarFluxData,
  KIndexData,
  SolarWindData,
  GeomagneticScales,
  SolarIndices,
  HamQSLData,
  BandCondition,
  VHFConditionStatus,
} from './types';

// Fetch Solar Flux from NOAA
export async function fetchSolarFlux(): Promise<SolarFluxData | null> {
  try {
    const response = await fetch(NOAA_ENDPOINTS.SOLAR_FLUX);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      flux: parseInt(data.Flux, 10),
      timestamp: new Date(data.TimeStamp + ' UTC'),
    };
  } catch {
    console.error('Failed to fetch solar flux');
    return null;
  }
}

// Fetch K-Index from NOAA
export async function fetchKIndex(): Promise<KIndexData | null> {
  try {
    const response = await fetch(NOAA_ENDPOINTS.K_INDEX);
    if (!response.ok) return null;

    const data = await response.json();
    // Get the most recent entry (last in array)
    const latest = data[data.length - 1];
    if (!latest) return null;

    return {
      kp: parseFloat(latest.Kp),
      aRunning: parseInt(latest.a_running, 10),
      timestamp: new Date(latest.time_tag),
    };
  } catch {
    console.error('Failed to fetch K-index');
    return null;
  }
}

// Fetch Solar Wind from NOAA
export async function fetchSolarWind(): Promise<SolarWindData | null> {
  try {
    const response = await fetch(NOAA_ENDPOINTS.SOLAR_WIND);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      speed: parseInt(data.WindSpeed, 10),
      timestamp: new Date(data.TimeStamp + ' UTC'),
    };
  } catch {
    console.error('Failed to fetch solar wind');
    return null;
  }
}

// Fetch Geomagnetic Scales from NOAA
export async function fetchGeomagneticScales(): Promise<GeomagneticScales | null> {
  try {
    const response = await fetch(NOAA_ENDPOINTS.GEOMAG_SCALES);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      r: { scale: data[0]?.R?.Scale ?? 0, text: data[0]?.R?.Text ?? 'None' },
      s: { scale: data[0]?.S?.Scale ?? 0, text: data[0]?.S?.Text ?? 'None' },
      g: { scale: data[0]?.G?.Scale ?? 0, text: data[0]?.G?.Text ?? 'None' },
      timestamp: new Date(data[0]?.DateStamp + ' ' + data[0]?.TimeStamp + ' UTC'),
    };
  } catch {
    console.error('Failed to fetch geomagnetic scales');
    return null;
  }
}

// Fetch all NOAA solar indices in parallel
export async function fetchSolarIndices(): Promise<SolarIndices> {
  const [solarFlux, kIndex, solarWind, geomagneticScales] = await Promise.all([
    fetchSolarFlux(),
    fetchKIndex(),
    fetchSolarWind(),
    fetchGeomagneticScales(),
  ]);

  return {
    solarFlux,
    kIndex,
    solarWind,
    geomagneticScales,
  };
}

// Parse band condition string to typed value
function parseBandCondition(value: string): BandCondition {
  const lower = value.toLowerCase();
  if (lower === 'good') return 'good';
  if (lower === 'fair') return 'fair';
  if (lower === 'poor') return 'poor';
  return 'unknown';
}

// Parse VHF condition string to typed value
function parseVHFCondition(value: string): VHFConditionStatus {
  const lower = value.toLowerCase();
  if (lower === 'band open' || lower === 'high muf') return 'open';
  if (lower === 'possible' || lower === '50mhz es') return 'possible';
  if (lower === 'band closed' || lower === 'none') return 'closed';
  return 'unknown';
}

// Parse geomagnetic field status
function parseGeomagField(value: string): 'quiet' | 'unsettled' | 'active' | 'storm' {
  const lower = value.toLowerCase();
  if (lower.includes('storm')) return 'storm';
  if (lower.includes('active')) return 'active';
  if (lower.includes('unsettled')) return 'unsettled';
  return 'quiet';
}

// Backend propagation response type
interface BackendPropagationResponse {
  solarflux: number;
  aindex: number;
  kindex: number;
  xray: string;
  sunspots: number;
  solarwind: number;
  geomagField: string;
  signalNoise: string;
  calculatedConditions: { band: string; time: 'day' | 'night'; condition: string }[];
  calculatedVHFConditions: { phenomenon: string; location: string; condition: string }[];
  cached?: boolean;
  error?: string;
}

// Fetch propagation data from backend (proxied HamQSL data)
export async function fetchHamQSLData(): Promise<HamQSLData | null> {
  try {
    const response = await fetch(PROPAGATION_ENDPOINT);
    if (!response.ok) return null;

    const data: BackendPropagationResponse = await response.json();

    if (data.error) {
      console.error('Backend propagation error:', data.error);
      return null;
    }

    // Transform calculatedConditions array into hfBands format
    const bandMap = new Map<string, { day: BandCondition; night: BandCondition }>();
    for (const cond of data.calculatedConditions) {
      const existing = bandMap.get(cond.band) || { day: 'unknown' as BandCondition, night: 'unknown' as BandCondition };
      if (cond.time === 'day') {
        existing.day = parseBandCondition(cond.condition);
      } else {
        existing.night = parseBandCondition(cond.condition);
      }
      bandMap.set(cond.band, existing);
    }

    const hfBands = Array.from(bandMap.entries()).map(([band, conditions]) => ({
      band,
      day: conditions.day,
      night: conditions.night,
    }));

    // Parse VHF conditions from calculatedVHFConditions
    let sporadicE: VHFConditionStatus = 'unknown';
    let aurora: VHFConditionStatus = 'unknown';
    for (const vhf of data.calculatedVHFConditions) {
      const phenom = vhf.phenomenon.toLowerCase();
      if (phenom.includes('e-skip') || phenom.includes('eskip') || phenom.includes('sporadic')) {
        sporadicE = parseVHFCondition(vhf.condition);
      }
      if (phenom.includes('aurora')) {
        aurora = parseVHFCondition(vhf.condition);
      }
    }

    return {
      solarFlux: data.solarflux || 0,
      sunspotNumber: data.sunspots || 0,
      aIndex: data.aindex || 0,
      kIndex: data.kindex || 0,
      xRay: data.xray || 'N/A',
      geomagField: parseGeomagField(data.geomagField || ''),
      solarWind: data.solarwind || 0,
      signalNoise: data.signalNoise || 'N/A',
      hfBands,
      vhf: {
        sporadicE,
        tropospheric: 'unknown', // Not provided by HamQSL in this format
        aurora,
        meteorScatter: 'unknown', // Not provided by HamQSL
      },
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Failed to fetch propagation data:', error);
    return null;
  }
}
