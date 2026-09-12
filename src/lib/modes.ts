// The canonical mode vocabulary the repeater filters speak.
//
// Two surfaces filter by mode and both write the same `modes` columnFilter entry:
// the toolbar chip strip (RepeaterView) and the per-column "Modos" dropdown behind
// the advanced toggle (DataTable). They must therefore offer the same options.
// Deriving the list from the rows cannot do that: it would expose whatever raw
// spellings happen to be stored rather than the canonical vocabulary.
//
// `value` is what the `modes` filterFn in columns.tsx accepts and what the ?modes=
// URL param carries; `tileKey` is the colour identity in mode-colors.ts.

export type ModeOption = {
  /** Written into the `modes` column filter and the ?modes= URL param. */
  value: string
  /** Shown to the operator. A mode name is a technical identifier, not copy, so it
   *  is identical in every locale and deliberately does not go through t(). */
  label: string
  /** Key into MODE_BADGE_COLORS / MODE_TILE_COLORS (D-STAR is keyed as DSTAR). */
  tileKey: string
}

/** The five modulations, in the order every mode surface presents them.
 *  EchoLink and AllStar are NOT here: they are linking systems that ride on a
 *  modulation, and they live on their own axis in lib/links.ts. */
export const MODE_OPTIONS: ModeOption[] = [
  { value: "FM", label: "FM", tileKey: "FM" },
  { value: "DMR", label: "DMR", tileKey: "DMR" },
  { value: "D-STAR", label: "D-STAR", tileKey: "DSTAR" },
  { value: "C4FM", label: "C4FM", tileKey: "C4FM" },
  { value: "TETRA", label: "TETRA", tileKey: "TETRA" },
]

/** The filter values alone, for a consumer that needs the vocabulary and not the styling. */
export const MODE_FILTER_VALUES: string[] = MODE_OPTIONS.map((mode) => mode.value)
