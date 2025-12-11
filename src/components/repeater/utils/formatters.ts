/**
 * Frequency and band formatting utilities for repeater data
 */

/**
 * Determine the amateur radio band from a frequency in MHz.
 */
export function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

/**
 * Format a frequency for display with MHz unit.
 */
export function fmtMHzDisplay(n?: number): string {
  return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(4)} MHz` : "–";
}

/**
 * Format a frequency for clipboard copy (no unit).
 */
export function fmtMHzCopy(n?: number): string {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(4) : "";
}

/**
 * Calculate duplex offset between RX and TX frequencies.
 */
export function duplex(
  rx?: number,
  tx?: number
): { sign: string; offsetDisplay: string; offsetCopy: string } {
  if (typeof rx !== "number" || typeof tx !== "number") {
    return { sign: "", offsetDisplay: "–", offsetCopy: "" };
  }
  const sign = tx > rx ? "+" : tx < rx ? "-" : "";
  const diff = Math.abs(tx - rx);
  return {
    sign,
    offsetDisplay: `${diff.toFixed(4)} MHz`,
    offsetCopy: diff.toFixed(4),
  };
}
