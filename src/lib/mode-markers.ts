// Map pin identity: colour and glyph per repeater mode.
//
// The pin body carries the MODE, because that is what an operator scans a map
// for ("where can I work DMR from here"), and the status rides along as a small
// badge in the corner. Both cues survive: colour is never the only signal,
// because the glyph and the marker's alt text say the same thing.
//
// The hue per mode is the same one mode-colors.ts gives the badges and the
// toolbar chip strip, one shade darker so a white glyph sits legibly on it. That
// makes the chip strip directly above the map double as the map's legend: the
// DMR chip and a DMR pin are the same purple with the same signal glyph, so no
// separate legend has to be maintained or read.
//
// Glyph paths are lifted verbatim from lucide-react (ISC), the same icon set the
// chips render, rather than redrawn by hand.

/** Modulation modes a pin can represent, rarest first. */
export type MarkerMode = "TETRA" | "C4FM" | "DSTAR" | "DMR" | "FM"

/**
 * Which mode wins when a repeater carries several.
 *
 * FM is the lowest common denominator: most repeaters have it, so an FM pin on a
 * dual-mode machine tells the reader nothing they could not already assume. The
 * order runs rarest to most common, so the pin shows the most specific thing
 * that is true about the repeater.
 *
 * EchoLink and AllStar deliberately do NOT appear here. They are linking
 * technologies rather than modulations: an EchoLink node is still an FM (or DMR)
 * repeater, and letting a globe glyph replace the modulation would hide the fact
 * an operator actually needs to program their radio.
 */
export const MARKER_MODE_PRECEDENCE: MarkerMode[] = [
  "TETRA",
  "C4FM",
  "DSTAR",
  "DMR",
  "FM",
]

export interface ModeMarkerStyle {
  /** Pin body fill. One shade darker than the badge hue so white reads on it. */
  fill: string
  /** Inner lucide glyph markup, drawn on a 24x24 grid. */
  glyph: string
}

const GLYPHS: Record<MarkerMode, string> = {
  FM: '<path d="M16.247 7.761a6 6 0 0 1 0 8.478"/><path d="M19.075 4.933a10 10 0 0 1 0 14.134"/><path d="M4.925 19.067a10 10 0 0 1 0-14.134"/><path d="M7.753 16.239a6 6 0 0 1 0-8.478"/><circle cx="12" cy="12" r="2"/>',
  DMR: '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 4v16"/>',
  DSTAR:
    '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  C4FM: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
  TETRA:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
}

/** Hue per mode, matching mode-colors.ts one step darker (Tailwind 600). */
const FILLS: Record<MarkerMode, string> = {
  FM: "#2563eb", // blue
  DMR: "#9333ea", // purple
  DSTAR: "#0891b2", // cyan
  C4FM: "#e11d48", // rose
  TETRA: "#d97706", // amber
}

/** A repeater with no recognised modulation. Brand neutral, no glyph. */
export const UNKNOWN_MODE_STYLE: ModeMarkerStyle = { fill: "#64748b", glyph: "" }

export function modeMarkerStyle(mode: MarkerMode | null): ModeMarkerStyle {
  if (!mode) return UNKNOWN_MODE_STYLE
  return { fill: FILLS[mode], glyph: GLYPHS[mode] }
}

/**
 * The mode a pin should show. `modes` is the stored array, where D-STAR is
 * spelled DSTAR.
 */
export function primaryMarkerMode(modes: readonly string[] | undefined): MarkerMode | null {
  if (!modes || modes.length === 0) return null
  const present = new Set(modes.map((m) => String(m).toUpperCase()))
  for (const mode of MARKER_MODE_PRECEDENCE) {
    if (present.has(mode)) return mode
    // Tolerate the display spelling in case a caller passes "D-STAR".
    if (mode === "DSTAR" && present.has("D-STAR")) return mode
  }
  return null
}
