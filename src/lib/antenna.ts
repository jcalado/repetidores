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

export interface YagiElement {
  type: 'reflector' | 'driven' | 'director';
  label: string;
  length: number;
  lengthFeet: number;
  spacing: number;
  spacingFeet: number;
  position: number;
}

export interface YagiResult {
  frequency: number;
  wavelength: number;
  numElements: number;
  elements: YagiElement[];
  boomLength: number;
  boomLengthFeet: number;
  estimatedGainDbd: number;
}

/**
 * Calculate Yagi-Uda antenna dimensions
 * Element lengths based on NBS optimized design data
 * Gain estimates averaged from 4 formulas (VK3AUU, WA2PHW, DBJ9BV, Rothammel)
 * @param frequencyMHz - Frequency in MHz
 * @param numElements - Number of elements (2-10)
 */
export function calculateYagi(frequencyMHz: number, numElements: number): YagiResult {
  const n = Math.max(2, Math.min(10, Math.round(numElements)));
  const wavelength = 300 / frequencyMHz;

  const elements: YagiElement[] = [];
  let position = 0;

  // Reflector
  const reflectorLength = wavelength * 0.495;
  elements.push({
    type: 'reflector',
    label: 'Reflector',
    length: reflectorLength,
    lengthFeet: reflectorLength * METERS_TO_FEET,
    spacing: 0,
    spacingFeet: 0,
    position: 0,
  });

  // Driven element
  const spacingReflectorToDriven = wavelength * 0.25;
  position += spacingReflectorToDriven;
  const drivenLength = wavelength * 0.473;
  elements.push({
    type: 'driven',
    label: 'Driven',
    length: drivenLength,
    lengthFeet: drivenLength * METERS_TO_FEET,
    spacing: spacingReflectorToDriven,
    spacingFeet: spacingReflectorToDriven * METERS_TO_FEET,
    position,
  });

  // Directors
  const numDirectors = n - 2;
  for (let i = 0; i < numDirectors; i++) {
    const spacing = i === 0 ? wavelength * 0.20 : wavelength * 0.308;
    position += spacing;
    const directorFactor = Math.max(0.410, 0.440 - i * 0.005);
    const directorLength = wavelength * directorFactor;
    elements.push({
      type: 'director',
      label: `D${i + 1}`,
      length: directorLength,
      lengthFeet: directorLength * METERS_TO_FEET,
      spacing,
      spacingFeet: spacing * METERS_TO_FEET,
      position,
    });
  }

  const boomLength = position;

  // Gain estimate: average of 4 formulas from steeman.org
  const gainVK3AUU = 10 * Math.log10(4.3 * (n - 1));
  const gainWA2PHW = 10 * Math.log10(n) + 1.5;
  const gainDBJ9BV = 2.15 * Math.log(n) + 1.3;
  const gainRothammel = n <= 3 ? (n === 2 ? 3.8 : 6.0) : 5.2 + 1.45 * Math.log2(n - 2);
  const estimatedGainDbd = (gainVK3AUU + gainWA2PHW + gainDBJ9BV + gainRothammel) / 4;

  return {
    frequency: frequencyMHz,
    wavelength,
    numElements: n,
    elements,
    boomLength,
    boomLengthFeet: boomLength * METERS_TO_FEET,
    estimatedGainDbd,
  };
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
