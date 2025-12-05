export interface AntennaResult {
  frequency: number;
  wavelength: number;
  halfWaveDipole: number;
  halfWaveDipoleLeg: number;
  quarterWaveVertical: number;
  // In feet
  halfWaveDipoleFeet: number;
  halfWaveDipoleLegFeet: number;
  quarterWaveVerticalFeet: number;
}

// Conversion factor
export const METERS_TO_FEET = 3.28084;

// Antenna correction factors (accounting for end effects, velocity factor, etc.)
export const DIPOLE_FACTOR = 0.95;
export const VERTICAL_FACTOR = 0.95;

/**
 * Calculate antenna dimensions for a given frequency
 * @param frequencyMHz - Frequency in MHz
 * @returns Antenna dimensions in meters and feet
 */
export function calculateAntenna(frequencyMHz: number): AntennaResult {
  // Wavelength = speed of light / frequency
  // λ = 300 / f(MHz) for simplified calculation
  const wavelength = 300 / frequencyMHz;

  // Half-wave dipole (total length)
  const halfWaveDipole = (wavelength / 2) * DIPOLE_FACTOR;

  // Each leg of the dipole
  const halfWaveDipoleLeg = halfWaveDipole / 2;

  // Quarter-wave vertical
  const quarterWaveVertical = (wavelength / 4) * VERTICAL_FACTOR;

  return {
    frequency: frequencyMHz,
    wavelength,
    halfWaveDipole,
    halfWaveDipoleLeg,
    quarterWaveVertical,
    halfWaveDipoleFeet: halfWaveDipole * METERS_TO_FEET,
    halfWaveDipoleLegFeet: halfWaveDipoleLeg * METERS_TO_FEET,
    quarterWaveVerticalFeet: quarterWaveVertical * METERS_TO_FEET,
  };
}

export interface CommonBand {
  label: string;
  freq: number;
  description: string;
}

export const COMMON_FREQUENCIES: CommonBand[] = [
  { label: '160m', freq: 1.85, description: 'Top Band' },
  { label: '80m', freq: 3.65, description: 'Night band' },
  { label: '40m', freq: 7.1, description: 'Day/Night' },
  { label: '30m', freq: 10.125, description: 'WARC band' },
  { label: '20m', freq: 14.2, description: 'DX band' },
  { label: '17m', freq: 18.1, description: 'WARC band' },
  { label: '15m', freq: 21.2, description: 'DX band' },
  { label: '12m', freq: 24.94, description: 'WARC band' },
  { label: '10m', freq: 28.5, description: 'DX/Local' },
  { label: '6m', freq: 50.15, description: 'Magic band' },
  { label: '2m', freq: 145.0, description: 'FM/SSB' },
  { label: '70cm', freq: 433.5, description: 'FM/Digital' },
];
