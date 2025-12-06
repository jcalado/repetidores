// Amateur Radio Satellite Catalog
// Contains satellite metadata including NORAD IDs and frequencies

export interface SatelliteInfo {
  id: string;
  name: string;
  noradId: string;
  uplink?: string;
  downlink?: string;
  mode?: string;
  description?: string;
}

export const SATELLITES: SatelliteInfo[] = [
  {
    id: 'iss',
    name: 'ISS (ZARYA)',
    noradId: '25544',
    uplink: '145.990 MHz',
    downlink: '145.800 MHz',
    mode: 'FM Voice/APRS',
    description: 'Estação Espacial Internacional',
  },
  {
    id: 'so-50',
    name: 'SO-50 (SaudiSat-1C)',
    noradId: '27607',
    uplink: '145.850 MHz (67 Hz)',
    downlink: '436.795 MHz',
    mode: 'FM Voice',
    description: 'Satélite FM fácil para iniciantes',
  },
  {
    id: 'ao-91',
    name: 'AO-91 (RadFxSat)',
    noradId: '43017',
    uplink: '435.250 MHz (67 Hz)',
    downlink: '145.960 MHz',
    mode: 'FM Voice',
    description: 'Satélite FM com boa cobertura',
  },
  {
    id: 'rs-44',
    name: 'RS-44 (DOSAAF-85)',
    noradId: '44909',
    uplink: '145.935-145.995 MHz',
    downlink: '435.610-435.670 MHz',
    mode: 'SSB/CW Linear',
    description: 'Transponder linear russo',
  },
  {
    id: 'ao-07',
    name: 'AO-07 (AMSAT-OSCAR 7)',
    noradId: '07530',
    uplink: '145.850-145.950 MHz',
    downlink: '29.400-29.500 MHz',
    mode: 'SSB/CW Linear',
    description: 'Satélite histórico de 1974, ainda operacional',
  },
  {
    id: 'iss-aprs',
    name: 'ISS APRS Digipeater',
    noradId: '25544',
    uplink: '145.825 MHz',
    downlink: '145.825 MHz',
    mode: 'APRS Packet',
    description: 'Digipeater APRS na ISS',
  },
];

export function getSatelliteById(id: string): SatelliteInfo | undefined {
  return SATELLITES.find(sat => sat.id === id);
}

export function getSatelliteByNoradId(noradId: string): SatelliteInfo | undefined {
  return SATELLITES.find(sat => sat.noradId === noradId);
}

// Default satellite (ISS)
export const DEFAULT_SATELLITE = SATELLITES[0];
