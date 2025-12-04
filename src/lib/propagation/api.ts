import { NOAA_ENDPOINTS, HAMQSL_ENDPOINT } from './constants';
import type {
  SolarFluxData,
  KIndexData,
  SolarWindData,
  GeomagneticScales,
  SolarIndices,
  HamQSLData,
  BandCondition,
  VHFConditionStatus,
  HFBandConditions,
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

// Parse band condition from HamQSL XML
function parseBandCondition(value: string): BandCondition {
  const lower = value.toLowerCase();
  if (lower === 'good') return 'good';
  if (lower === 'fair') return 'fair';
  if (lower === 'poor') return 'poor';
  return 'unknown';
}

// Parse VHF condition from HamQSL XML
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

// Fetch HamQSL solar data (includes HF band conditions)
export async function fetchHamQSLData(): Promise<HamQSLData | null> {
  try {
    const response = await fetch(HAMQSL_ENDPOINT);
    if (!response.ok) return null;

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    const getElementText = (tagName: string): string => {
      const element = xmlDoc.getElementsByTagName(tagName)[0];
      return element?.textContent ?? '';
    };

    // Parse HF band conditions
    const hfBands: HFBandConditions[] = [
      {
        band: '80m-40m',
        day: parseBandCondition(getElementText('dayBands80-40')),
        night: parseBandCondition(getElementText('nightBands80-40')),
      },
      {
        band: '30m-20m',
        day: parseBandCondition(getElementText('dayBands30-20')),
        night: parseBandCondition(getElementText('nightBands30-20')),
      },
      {
        band: '17m-15m',
        day: parseBandCondition(getElementText('dayBands17-15')),
        night: parseBandCondition(getElementText('nightBands17-15')),
      },
      {
        band: '12m-10m',
        day: parseBandCondition(getElementText('dayBands12-10')),
        night: parseBandCondition(getElementText('nightBands12-10')),
      },
    ];

    return {
      solarFlux: parseInt(getElementText('solarflux'), 10) || 0,
      sunspotNumber: parseInt(getElementText('sunspots'), 10) || 0,
      aIndex: parseInt(getElementText('aindex'), 10) || 0,
      kIndex: parseInt(getElementText('kindex'), 10) || 0,
      xRay: getElementText('xray') || 'N/A',
      geomagField: parseGeomagField(getElementText('geomagfield')),
      solarWind: parseInt(getElementText('solarwind'), 10) || 0,
      signalNoise: getElementText('signalnoise') || 'N/A',
      hfBands,
      vhf: {
        sporadicE: parseVHFCondition(getElementText('vhfEuSpE')),
        tropospheric: parseVHFCondition(getElementText('vhfTrop')),
        aurora: parseVHFCondition(getElementText('vhfAurora')),
        meteorScatter: 'unknown', // Not provided by HamQSL
      },
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Failed to fetch HamQSL data:', error);
    return null;
  }
}
