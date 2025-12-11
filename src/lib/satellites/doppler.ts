/**
 * Doppler Shift Calculator for Satellite Communications
 *
 * For satellites in LEO (like the ISS and most amateur radio satellites),
 * the Doppler shift can be significant:
 * - 2m band (145 MHz): up to ±3.5 kHz
 * - 70cm band (435 MHz): up to ±10 kHz
 *
 * The Doppler effect formula:
 * f_observed = f_transmitted × (c / (c + v_radial))
 *
 * Where:
 * - c = speed of light (299,792,458 m/s)
 * - v_radial = radial velocity (positive = moving away, negative = approaching)
 */

const SPEED_OF_LIGHT = 299792458 // m/s

export interface DopplerResult {
  /** Doppler shift for uplink frequency in Hz (positive = higher, negative = lower) */
  uplinkShift: number
  /** Doppler shift for downlink frequency in Hz */
  downlinkShift: number
  /** Corrected uplink frequency in MHz */
  uplinkCorrected: number | null
  /** Corrected downlink frequency in MHz */
  downlinkCorrected: number | null
  /** Radial velocity in km/s (positive = receding, negative = approaching) */
  radialVelocity: number
  /** Whether the satellite is approaching (negative range rate) */
  isApproaching: boolean
}

/**
 * Calculate Doppler-corrected frequencies for satellite communications
 *
 * @param uplinkMHz - Satellite uplink frequency in MHz (what you transmit on)
 * @param downlinkMHz - Satellite downlink frequency in MHz (what you receive on)
 * @param rangeRateKmPerSec - Range rate from satellite calculations (km/s)
 *                            Positive = satellite moving away
 *                            Negative = satellite approaching
 * @returns Doppler calculation results
 */
export function calculateDoppler(
  uplinkMHz: number | undefined | null,
  downlinkMHz: number | undefined | null,
  rangeRateKmPerSec: number
): DopplerResult {
  // Convert range rate from km/s to m/s
  const rangeRateMs = rangeRateKmPerSec * 1000
  const isApproaching = rangeRateKmPerSec < 0

  // Calculate shifts
  // For downlink (satellite transmits, we receive):
  // When satellite approaches (negative v), frequency increases
  // f_received = f_transmitted × (c / (c + v))
  // Shift = f_received - f_transmitted = f_transmitted × ((c / (c + v)) - 1)
  //       = f_transmitted × ((-v) / (c + v))

  // For uplink (we transmit, satellite receives):
  // We need to pre-correct our transmission
  // When satellite approaches, we should transmit LOWER to compensate
  // The satellite will receive: f_received = f_we_transmit × (c / (c + v))
  // To hit target frequency: f_we_transmit = f_target × ((c + v) / c)
  // Shift we apply = f_we_transmit - f_target = f_target × (v / c)

  let downlinkShift = 0
  let downlinkCorrected: number | null = null
  if (downlinkMHz != null && downlinkMHz > 0) {
    const downlinkHz = downlinkMHz * 1e6
    // Doppler shift for received signal
    // When v < 0 (approaching), shift is positive (higher frequency)
    downlinkShift = -downlinkHz * (rangeRateMs / (SPEED_OF_LIGHT + rangeRateMs))
    downlinkCorrected = (downlinkHz + downlinkShift) / 1e6
  }

  let uplinkShift = 0
  let uplinkCorrected: number | null = null
  if (uplinkMHz != null && uplinkMHz > 0) {
    const uplinkHz = uplinkMHz * 1e6
    // Pre-correction for uplink transmission
    // When v < 0 (approaching), we transmit lower (negative shift from nominal)
    uplinkShift = -uplinkHz * (rangeRateMs / SPEED_OF_LIGHT)
    uplinkCorrected = (uplinkHz + uplinkShift) / 1e6
  }

  return {
    uplinkShift,
    downlinkShift,
    uplinkCorrected,
    downlinkCorrected,
    radialVelocity: rangeRateKmPerSec,
    isApproaching,
  }
}

/**
 * Parse a frequency string into MHz
 * Handles formats like: "145.800", "145.800 MHz", "145800 kHz", "145800000 Hz"
 *
 * @param freqStr - Frequency string to parse
 * @returns Frequency in MHz, or null if parsing fails
 */
export function parseFrequencyMHz(freqStr: string | undefined | null): number | null {
  if (!freqStr) return null

  const str = freqStr.trim().toLowerCase()

  // Try to extract number and unit
  const match = str.match(/^([\d.]+)\s*(mhz|khz|hz)?$/i)
  if (!match) {
    // Try just a number
    const num = parseFloat(str)
    if (isNaN(num)) return null
    // Assume MHz if no unit and reasonable range
    if (num > 100 && num < 1000) return num // 100-1000 MHz range
    if (num > 1000 && num < 1000000) return num / 1000 // kHz
    if (num > 1000000) return num / 1000000 // Hz
    return num // Assume MHz
  }

  const value = parseFloat(match[1])
  if (isNaN(value)) return null

  const unit = match[2]?.toLowerCase() || "mhz"

  switch (unit) {
    case "hz":
      return value / 1e6
    case "khz":
      return value / 1e3
    case "mhz":
    default:
      return value
  }
}

/**
 * Format a frequency shift in Hz for display
 *
 * @param shiftHz - Shift in Hz
 * @returns Formatted string like "+3.2 kHz" or "-150 Hz"
 */
export function formatShift(shiftHz: number): string {
  const absShift = Math.abs(shiftHz)
  const sign = shiftHz >= 0 ? "+" : "-"

  if (absShift >= 1000) {
    return `${sign}${(absShift / 1000).toFixed(1)} kHz`
  }
  return `${sign}${absShift.toFixed(0)} Hz`
}

/**
 * Format a frequency in MHz for display
 *
 * @param freqMHz - Frequency in MHz
 * @param decimals - Number of decimal places (default 3)
 * @returns Formatted string like "145.803 MHz"
 */
export function formatFrequency(freqMHz: number, decimals = 3): string {
  return `${freqMHz.toFixed(decimals)} MHz`
}

/**
 * Calculate maximum expected Doppler shift for a given frequency
 * Based on typical LEO satellite velocities (~7.8 km/s orbital, ~8 km/s max range rate)
 *
 * @param freqMHz - Frequency in MHz
 * @returns Maximum expected shift in Hz
 */
export function getMaxDopplerShift(freqMHz: number): number {
  const maxRangeRate = 8000 // m/s (typical max for LEO)
  const freqHz = freqMHz * 1e6
  return freqHz * (maxRangeRate / SPEED_OF_LIGHT)
}
