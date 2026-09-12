// Per-mode categorical colour taxonomy for repeater modulation.
//
// SANCTIONED exception to the Single-Voice rule (see DESIGN.md "The Mode Taxonomy Exception"):
// modulation is categorical identity, not decoration. The repeater table mode badges, the
// quick-filter tiles, and the mobile filter chips all share these hues so an operator
// recognises a mode by its colour at a glance. The palette is capped at the seven real modes;
// the hue assignment is fixed and must stay identical across every surface that shows a mode.
//
// FM blue · DMR purple · D-STAR cyan · C4FM rose · TETRA amber.
// Modulations only: EchoLink and AllStar are linking systems, not modes, and
// render as neutral outline chips (see lib/links.ts).

/** Soft tinted badge style (table "Modos" column, popups, legends). */
export const MODE_BADGE_COLORS: Record<string, string> = {
  FM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DMR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  DSTAR: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  C4FM: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  TETRA: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Digipeater: "bg-muted text-muted-foreground",
}

export type ModeTileStyle = {
  /** Rest-state icon / dot colour, so the tile is recognisable before selection. */
  icon: string
  /** Small leading dot (mobile chips). */
  dot: string
  /** Selected-state solid fill + border (white glyph/label sits on top). */
  active: string
  /** Rest-state hover tint. */
  hover: string
}

/** Quick-filter tile / chip styles, keyed by the same mode ids as the table. */
export const MODE_TILE_COLORS: Record<string, ModeTileStyle> = {
  FM: {
    icon: "text-blue-500 dark:text-blue-400",
    dot: "bg-blue-500",
    active: "bg-blue-500 border-blue-600 text-white",
    hover: "hover:bg-blue-50 hover:border-blue-300 dark:hover:bg-blue-950/30",
  },
  DMR: {
    icon: "text-purple-500 dark:text-purple-400",
    dot: "bg-purple-500",
    active: "bg-purple-500 border-purple-600 text-white",
    hover: "hover:bg-purple-50 hover:border-purple-300 dark:hover:bg-purple-950/30",
  },
  DSTAR: {
    icon: "text-cyan-500 dark:text-cyan-400",
    dot: "bg-cyan-500",
    active: "bg-cyan-500 border-cyan-600 text-white",
    hover: "hover:bg-cyan-50 hover:border-cyan-300 dark:hover:bg-cyan-950/30",
  },
  C4FM: {
    icon: "text-rose-500 dark:text-rose-400",
    dot: "bg-rose-500",
    active: "bg-rose-500 border-rose-600 text-white",
    hover: "hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/30",
  },
  TETRA: {
    icon: "text-amber-500 dark:text-amber-400",
    dot: "bg-amber-500",
    active: "bg-amber-500 border-amber-600 text-white",
    hover: "hover:bg-amber-50 hover:border-amber-300 dark:hover:bg-amber-950/30",
  },
}
