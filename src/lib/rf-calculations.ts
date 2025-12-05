/**
 * RF Calculations Library
 * Common formulas for ham radio calculations
 */

// Speed of light in m/s
export const SPEED_OF_LIGHT = 299792458;

// =====================
// dB Calculations
// =====================

/**
 * Convert dB to power ratio
 * ratio = 10^(dB/10)
 */
export function dbToPowerRatio(db: number): number {
  return Math.pow(10, db / 10);
}

/**
 * Convert power ratio to dB
 * dB = 10 × log₁₀(ratio)
 */
export function powerRatioToDb(ratio: number): number {
  if (ratio <= 0) return -Infinity;
  return 10 * Math.log10(ratio);
}

/**
 * Convert dB to voltage ratio
 * ratio = 10^(dB/20)
 */
export function dbToVoltageRatio(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert voltage ratio to dB
 * dB = 20 × log₁₀(ratio)
 */
export function voltageRatioToDb(ratio: number): number {
  if (ratio <= 0) return -Infinity;
  return 20 * Math.log10(ratio);
}

// =====================
// SWR Calculations
// =====================

/**
 * Calculate reflection coefficient (Γ) from SWR
 * Γ = (SWR - 1) / (SWR + 1)
 */
export function swrToReflectionCoefficient(swr: number): number {
  if (swr < 1) return 0;
  return (swr - 1) / (swr + 1);
}

/**
 * Calculate SWR from reflection coefficient
 * SWR = (1 + |Γ|) / (1 - |Γ|)
 */
export function reflectionCoefficientToSwr(gamma: number): number {
  const absGamma = Math.abs(gamma);
  if (absGamma >= 1) return Infinity;
  return (1 + absGamma) / (1 - absGamma);
}

/**
 * Calculate return loss (dB) from reflection coefficient
 * RL = -20 × log₁₀(|Γ|)
 */
export function reflectionCoefficientToReturnLoss(gamma: number): number {
  const absGamma = Math.abs(gamma);
  if (absGamma <= 0) return Infinity;
  return -20 * Math.log10(absGamma);
}

/**
 * Calculate reflection coefficient from return loss
 * Γ = 10^(-RL/20)
 */
export function returnLossToReflectionCoefficient(returnLoss: number): number {
  return Math.pow(10, -returnLoss / 20);
}

/**
 * Calculate SWR from return loss
 */
export function returnLossToSwr(returnLoss: number): number {
  const gamma = returnLossToReflectionCoefficient(returnLoss);
  return reflectionCoefficientToSwr(gamma);
}

/**
 * Calculate return loss from SWR
 */
export function swrToReturnLoss(swr: number): number {
  const gamma = swrToReflectionCoefficient(swr);
  return reflectionCoefficientToReturnLoss(gamma);
}

/**
 * Calculate mismatch loss (dB) from reflection coefficient
 * ML = -10 × log₁₀(1 - Γ²)
 */
export function reflectionCoefficientToMismatchLoss(gamma: number): number {
  const gammaSquared = gamma * gamma;
  if (gammaSquared >= 1) return Infinity;
  return -10 * Math.log10(1 - gammaSquared);
}

/**
 * Calculate reflected power percentage from reflection coefficient
 * P_reflected = Γ² × 100
 */
export function reflectionCoefficientToReflectedPower(gamma: number): number {
  return gamma * gamma * 100;
}

/**
 * Calculate transmitted power percentage from reflection coefficient
 * P_transmitted = (1 - Γ²) × 100
 */
export function reflectionCoefficientToTransmittedPower(gamma: number): number {
  return (1 - gamma * gamma) * 100;
}

// =====================
// Frequency/Wavelength
// =====================

/**
 * Convert frequency (Hz) to wavelength (meters)
 * λ = c / f
 */
export function frequencyToWavelength(frequencyHz: number): number {
  if (frequencyHz <= 0) return Infinity;
  return SPEED_OF_LIGHT / frequencyHz;
}

/**
 * Convert wavelength (meters) to frequency (Hz)
 * f = c / λ
 */
export function wavelengthToFrequency(wavelengthMeters: number): number {
  if (wavelengthMeters <= 0) return Infinity;
  return SPEED_OF_LIGHT / wavelengthMeters;
}

// =====================
// Unit Conversions
// =====================

export function hzToKhz(hz: number): number {
  return hz / 1000;
}

export function hzToMhz(hz: number): number {
  return hz / 1000000;
}

export function hzToGhz(hz: number): number {
  return hz / 1000000000;
}

export function khzToHz(khz: number): number {
  return khz * 1000;
}

export function mhzToHz(mhz: number): number {
  return mhz * 1000000;
}

export function ghzToHz(ghz: number): number {
  return ghz * 1000000000;
}

export function metersToCm(meters: number): number {
  return meters * 100;
}

export function metersToMm(meters: number): number {
  return meters * 1000;
}

export function cmToMeters(cm: number): number {
  return cm / 100;
}

export function mmToMeters(mm: number): number {
  return mm / 1000;
}

// =====================
// Formatting Helpers
// =====================

/**
 * Format a number with specified decimal places, removing trailing zeros
 */
export function formatNumber(value: number, maxDecimals: number = 4): string {
  if (!Number.isFinite(value)) return "∞";
  return parseFloat(value.toFixed(maxDecimals)).toString();
}

/**
 * Format dB value
 */
export function formatDb(value: number): string {
  if (!Number.isFinite(value)) return "∞ dB";
  return `${formatNumber(value, 2)} dB`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${formatNumber(value, 2)}%`;
}
