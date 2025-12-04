// Refresh intervals in milliseconds
export const REFRESH_INTERVALS = {
  SOLAR_INDICES: 5 * 60 * 1000, // 5 minutes
  HAMQSL: 15 * 60 * 1000, // 15 minutes
} as const;

// NOAA SWPC API endpoints
export const NOAA_ENDPOINTS = {
  SOLAR_FLUX: 'https://services.swpc.noaa.gov/products/summary/10cm-flux.json',
  K_INDEX: 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json',
  SOLAR_WIND: 'https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json',
  GEOMAG_SCALES: 'https://services.swpc.noaa.gov/products/noaa-scales.json',
} as const;

// Backend propagation endpoint (proxies HamQSL to avoid CORS issues)
const API_BASE_URL =
  process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
  process.env.PAYLOAD_API_BASE_URL ||
  'http://localhost:3000';
export const PROPAGATION_ENDPOINT = `${API_BASE_URL}/api/propagation`;

// HamDXMap iframe URL centered on Portugal (IM58)
export const MUF_MAP_URL = 'https://dxmap.f5uii.net/?g1=IM58&muf=1';

// K-Index thresholds for color coding
export const K_INDEX_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  0: { bg: 'bg-green-500', text: 'text-green-500', label: 'Quieto' },
  1: { bg: 'bg-green-500', text: 'text-green-500', label: 'Quieto' },
  2: { bg: 'bg-green-400', text: 'text-green-400', label: 'Quieto' },
  3: { bg: 'bg-yellow-400', text: 'text-yellow-400', label: 'Instável' },
  4: { bg: 'bg-yellow-500', text: 'text-yellow-500', label: 'Ativo' },
  5: { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Tempestade Menor' },
  6: { bg: 'bg-orange-600', text: 'text-orange-600', label: 'Tempestade Moderada' },
  7: { bg: 'bg-red-500', text: 'text-red-500', label: 'Tempestade Forte' },
  8: { bg: 'bg-red-600', text: 'text-red-600', label: 'Tempestade Severa' },
  9: { bg: 'bg-red-700', text: 'text-red-700', label: 'Tempestade Extrema' },
};

// Solar Flux Index interpretation
export const SFI_THRESHOLDS = {
  LOW: 70, // Poor propagation
  MODERATE: 100, // Fair propagation
  HIGH: 150, // Good propagation
  EXCELLENT: 200, // Excellent propagation
} as const;

// Band condition colors
export const BAND_CONDITION_COLORS = {
  good: { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
  fair: { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  poor: { bg: 'bg-red-500', text: 'text-red-700 dark:text-red-400' },
  unknown: { bg: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' },
} as const;

// VHF condition colors
export const VHF_CONDITION_COLORS = {
  open: { bg: 'bg-green-500', text: 'text-green-700 dark:text-green-400' },
  possible: { bg: 'bg-yellow-500', text: 'text-yellow-700 dark:text-yellow-400' },
  closed: { bg: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' },
  unknown: { bg: 'bg-gray-400', text: 'text-gray-600 dark:text-gray-400' },
} as const;

// HF band names for display
export const HF_BANDS = [
  { id: '80m-40m', label: '80m - 40m', frequencies: '3.5 - 7 MHz' },
  { id: '30m-20m', label: '30m - 20m', frequencies: '10 - 14 MHz' },
  { id: '17m-15m', label: '17m - 15m', frequencies: '18 - 21 MHz' },
  { id: '12m-10m', label: '12m - 10m', frequencies: '24 - 28 MHz' },
] as const;
