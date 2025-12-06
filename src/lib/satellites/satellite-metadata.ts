// Curated metadata for popular amateur radio satellites
// Includes Portuguese descriptions and manually verified frequencies

import { SatelliteInfo, SatelliteCategory } from './types';

/**
 * Curated list of popular amateur radio satellites
 * This provides reliable metadata when SatNOGS data is unavailable
 */
export const CURATED_SATELLITES: SatelliteInfo[] = [
  // ==================== FM VOICE ====================
  {
    id: 'iss',
    name: 'ISS (ZARYA)',
    noradId: '25544',
    category: SatelliteCategory.FM_VOICE,
    uplink: '145.990 MHz',
    downlink: '145.800 MHz',
    mode: 'FM Voice/APRS',
    description: 'Estacao Espacial Internacional - operacoes de voz FM e APRS',
    status: 'active',
  },
  {
    id: 'so-50',
    name: 'SO-50 (SaudiSat-1C)',
    noradId: '27607',
    category: SatelliteCategory.FM_VOICE,
    uplink: '145.850 MHz (67 Hz)',
    downlink: '436.795 MHz',
    mode: 'FM Voice',
    description: 'Satelite FM popular para iniciantes - requer tom 67 Hz para ativacao',
    status: 'active',
  },
  {
    id: 'ao-91',
    name: 'AO-91 (RadFxSat)',
    noradId: '43017',
    category: SatelliteCategory.FM_VOICE,
    uplink: '435.250 MHz (67 Hz)',
    downlink: '145.960 MHz',
    mode: 'FM Voice',
    description: 'Satelite FM com boa cobertura - downlink em VHF',
    status: 'active',
  },
  {
    id: 'po-101',
    name: 'PO-101 (Diwata-2)',
    noradId: '43678',
    category: SatelliteCategory.FM_VOICE,
    uplink: '145.900 MHz',
    downlink: '437.500 MHz',
    mode: 'FM Voice',
    description: 'Satelite filipino com transponder FM',
    status: 'active',
  },
  {
    id: 'ao-27',
    name: 'AO-27',
    noradId: '22825',
    category: SatelliteCategory.FM_VOICE,
    uplink: '145.850 MHz',
    downlink: '436.795 MHz',
    mode: 'FM Voice',
    description: 'Satelite FM veterano - operacao esporadica',
    status: 'active',
  },

  // ==================== LINEAR (SSB/CW) ====================
  {
    id: 'rs-44',
    name: 'RS-44 (DOSAAF-85)',
    noradId: '44909',
    category: SatelliteCategory.LINEAR,
    uplink: '145.935-145.995 MHz',
    downlink: '435.610-435.670 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear russo - excelente para SSB e CW',
    status: 'active',
  },
  {
    id: 'ao-07',
    name: 'AO-07 (AMSAT-OSCAR 7)',
    noradId: '07530',
    category: SatelliteCategory.LINEAR,
    uplink: '145.850-145.950 MHz',
    downlink: '29.400-29.500 MHz',
    mode: 'SSB/CW Linear',
    description: 'Satelite historico de 1974 - ainda operacional! Modo A e B',
    status: 'active',
  },
  {
    id: 'fo-29',
    name: 'FO-29 (JAS-2)',
    noradId: '24278',
    category: SatelliteCategory.LINEAR,
    uplink: '145.900-146.000 MHz',
    downlink: '435.800-435.900 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear japones - modo V/U',
    status: 'active',
  },
  {
    id: 'xw-2a',
    name: 'XW-2A (CAS-3A)',
    noradId: '40903',
    category: SatelliteCategory.LINEAR,
    uplink: '435.030-435.050 MHz',
    downlink: '145.665-145.685 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear chines - modo U/V',
    status: 'active',
  },
  {
    id: 'xw-2c',
    name: 'XW-2C (CAS-3C)',
    noradId: '40906',
    category: SatelliteCategory.LINEAR,
    uplink: '435.130-435.150 MHz',
    downlink: '145.795-145.815 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear chines - modo U/V',
    status: 'active',
  },
  {
    id: 'eo-88',
    name: 'EO-88 (Nayif-1)',
    noradId: '42017',
    category: SatelliteCategory.LINEAR,
    uplink: '435.045-435.065 MHz',
    downlink: '145.940-145.960 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear dos Emirados Arabes Unidos',
    status: 'active',
  },
  {
    id: 'jo-97',
    name: 'JO-97 (FalconSat-3)',
    noradId: '30776',
    category: SatelliteCategory.LINEAR,
    uplink: '435.100-435.125 MHz',
    downlink: '145.890-145.920 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear experimental',
    status: 'active',
  },
  {
    id: 'qo-100',
    name: 'QO-100 (Es\'hail-2)',
    noradId: '43700',
    category: SatelliteCategory.LINEAR,
    uplink: '2400.050-2400.300 MHz',
    downlink: '10489.550-10489.800 MHz',
    mode: 'SSB/CW/DATV',
    description: 'Satelite geoestacionario com transponder de banda estreita e larga',
    status: 'active',
  },

  // ==================== DIGITAL ====================
  {
    id: 'iss-aprs',
    name: 'ISS APRS Digipeater',
    noradId: '25544',
    category: SatelliteCategory.DIGITAL,
    uplink: '145.825 MHz',
    downlink: '145.825 MHz',
    mode: 'APRS Packet',
    description: 'Digipeater APRS na ISS - excelente para primeiros contactos via satelite',
    status: 'active',
  },
  {
    id: 'no-44',
    name: 'NO-44 (PCSAT)',
    noradId: '26931',
    category: SatelliteCategory.DIGITAL,
    uplink: '145.825 MHz',
    downlink: '145.825 MHz',
    mode: 'APRS Packet',
    description: 'Digipeater APRS - operacao intermitente',
    status: 'active',
  },
  {
    id: 'ariss',
    name: 'ARISS (Amateur Radio on ISS)',
    noradId: '25544',
    category: SatelliteCategory.DIGITAL,
    uplink: '145.200 MHz',
    downlink: '145.800 MHz',
    mode: 'Voice/SSTV/Packet',
    description: 'Sistema de radio amador na ISS - contactos escolares e SSTV',
    status: 'active',
  },

  // ==================== WEATHER ====================
  {
    id: 'noaa-15',
    name: 'NOAA 15',
    noradId: '25338',
    category: SatelliteCategory.WEATHER,
    downlink: '137.620 MHz',
    mode: 'APT',
    description: 'Satelite meteorologico - imagens APT em 137 MHz',
    status: 'active',
  },
  {
    id: 'noaa-18',
    name: 'NOAA 18',
    noradId: '28654',
    category: SatelliteCategory.WEATHER,
    downlink: '137.9125 MHz',
    mode: 'APT',
    description: 'Satelite meteorologico - imagens APT em 137 MHz',
    status: 'active',
  },
  {
    id: 'noaa-19',
    name: 'NOAA 19',
    noradId: '33591',
    category: SatelliteCategory.WEATHER,
    downlink: '137.100 MHz',
    mode: 'APT',
    description: 'Satelite meteorologico - imagens APT em 137 MHz',
    status: 'active',
  },
  {
    id: 'meteor-m2-3',
    name: 'METEOR-M2 3',
    noradId: '57166',
    category: SatelliteCategory.WEATHER,
    downlink: '137.900 MHz',
    mode: 'LRPT',
    description: 'Satelite meteorologico russo - imagens LRPT de alta resolucao',
    status: 'active',
  },
  {
    id: 'meteor-m2-4',
    name: 'METEOR-M2 4',
    noradId: '59051',
    category: SatelliteCategory.WEATHER,
    downlink: '137.100 MHz',
    mode: 'LRPT',
    description: 'Satelite meteorologico russo - imagens LRPT de alta resolucao',
    status: 'active',
  },

  // ==================== OTHER / CUBESATS ====================
  {
    id: 'cute-1',
    name: 'CUTE-1',
    noradId: '27844',
    category: SatelliteCategory.OTHER,
    downlink: '436.8375 MHz',
    mode: 'CW/Telemetry',
    description: 'CubeSat japones experimental',
    status: 'active',
  },
  {
    id: 'lilacsat-2',
    name: 'LilacSat-2',
    noradId: '40908',
    category: SatelliteCategory.DIGITAL,
    uplink: '144.350 MHz',
    downlink: '437.200 MHz',
    mode: 'FM/APRS',
    description: 'CubeSat chines com FM e APRS',
    status: 'active',
  },
];

/**
 * Get curated satellite by NORAD ID
 */
export function getCuratedSatellite(noradId: string): SatelliteInfo | undefined {
  return CURATED_SATELLITES.find(sat => sat.noradId === noradId);
}

/**
 * Get all curated satellites
 */
export function getAllCuratedSatellites(): SatelliteInfo[] {
  return CURATED_SATELLITES;
}

/**
 * Get curated satellites by category
 */
export function getCuratedSatellitesByCategory(category: SatelliteCategory): SatelliteInfo[] {
  return CURATED_SATELLITES.filter(sat => sat.category === category);
}

/**
 * Check if a satellite has curated metadata
 */
export function hasCuratedMetadata(noradId: string): boolean {
  return CURATED_SATELLITES.some(sat => sat.noradId === noradId);
}

/**
 * Featured/popular satellites for quick access
 */
export const FEATURED_SATELLITES = [
  '25544', // ISS
  '27607', // SO-50
  '43017', // AO-91
  '44909', // RS-44
  '43700', // QO-100
  '25338', // NOAA 15
];

/**
 * Default satellite (ISS)
 */
export const DEFAULT_SATELLITE_NORAD_ID = '25544';
