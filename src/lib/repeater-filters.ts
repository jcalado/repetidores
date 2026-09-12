// The single filtering implementation the repeaters surface speaks.
//
// There used to be two. The table filtered through TanStack column filterFns in
// columns.tsx; the map filtered through a separate memo in RepeaterView. They
// shared their STATE (useRepeaterFilters owns it) but not their LOGIC, and they
// did not cover the same ground: the map silently ignored favourites, the merged
// status, and the per-column frequency and tone filters, so switching to the map
// with favourites on showed every repeater while the filter badge still counted
// it.
//
// Every predicate below is exported individually so columns.tsx can hand the same
// function to its filterFn. That is what keeps the two surfaces honest: a column
// filter and applyRepeaterFilters cannot drift, because they are the same code.
//
// The predicates are pure and idempotent, which is why it is safe for the table to
// re-apply them to an already-filtered array: filtering twice with the same
// predicate yields the same set.

import type { RepeaterV2 as Repeater } from "@/types/repeater"
import { calculateDistance } from "@/lib/geolocation"
import { isFavorite } from "@/lib/favorites"
import { matchesLinks } from "@/lib/links"
import type { MergedStatusFilterValue } from "@/components/repeater/RepeaterCells"

export type BandValue = "2m" | "70cm"
export type OpStatusValue = "active" | "maintenance" | "offline"

/** Everything the two surfaces can filter by. Mirrors useRepeaterFilters state. */
export interface RepeaterFilterState {
  search: string
  callsign: string
  band: BandValue | null
  modes: string[]
  /** Linking systems (EchoLink, AllStar, Brandmeister, ...). ORs within itself
   *  and ANDs against `modes`, because they are independent axes. */
  links: string[]
  owner: string
  qthLocator: string
  status: MergedStatusFilterValue | null
  opStatus: OpStatusValue | null
  favouritesOnly: boolean
  outputFrequency: string
  inputFrequency: string
  tone: string
  distanceRadius: number | null
}

export interface RepeaterFilterContext {
  userLocation?: { latitude: number; longitude: number } | null
  /** Merged status bucket for a repeater. Injected rather than imported so this
   *  module stays free of the vote/auto-status snapshot's React lifecycle. */
  statusOf?: (repeater: Repeater) => MergedStatusFilterValue
}

/* ------------------------------------------------------------- helpers */

function pairsOf(repeater: Repeater) {
  const frequencies = repeater.frequencies
  return Array.isArray(frequencies) ? frequencies : []
}

function numberMatches(value: number | undefined | null, query: string, decimals: number): boolean {
  if (typeof value !== "number" || !Number.isFinite(value) || value === 0) return false
  return value.toFixed(decimals).includes(query) || String(value).includes(query)
}

export function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  if (mhz >= 1240 && mhz <= 1300) return "23cm"
  if (mhz >= 2300 && mhz <= 2450) return "13cm"
  return "Other"
}

function primaryPair(repeater: Repeater) {
  const pairs = pairsOf(repeater)
  return pairs.find((f) => f?.isPrimary) ?? pairs[0]
}

/* ---------------------------------------------------------- predicates */

/** Toolbar search: callsign, ANY frequency pair, or QTH locator. */
export function matchesSearch(repeater: Repeater, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  if (String(repeater.callsign ?? "").toLowerCase().includes(q)) return true
  if (String(repeater.qthLocator ?? "").toLowerCase().includes(q)) return true

  for (const pair of pairsOf(repeater)) {
    if (numberMatches(pair?.outputFrequency, q, 3)) return true
    if (numberMatches(pair?.inputFrequency, q, 3)) return true
  }
  return false
}

export function matchesCallsign(repeater: Repeater, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return String(repeater.callsign ?? "").toLowerCase().includes(q)
}

export function matchesBand(repeater: Repeater, band: string | null): boolean {
  if (!band) return true
  const primary = primaryPair(repeater)
  return primary ? getBandFromFrequency(primary.outputFrequency) === band : false
}

/** Matches the full owner name, its known abbreviation, or the association. */
export function matchesOwner(
  repeater: Repeater,
  query: string,
  shorten: (name: string) => string
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  const association = repeater.association
  if (association) {
    if (association.abbreviation?.toLowerCase().includes(q)) return true
    if (association.name?.toLowerCase().includes(q)) return true
  }

  const full = String(repeater.owner ?? "")
  return full.toLowerCase().includes(q) || shorten(full).toLowerCase().includes(q)
}

/**
 * Modulation only. EchoLink and AllStar used to be handled here, which was the
 * bug: they are not modulations, and folding them in meant "FM + EchoLink"
 * resolved as OR when an operator means "FM repeaters that have EchoLink". They
 * live on the link axis now (lib/links.ts), which ANDs against this one.
 */
export function matchesModes(repeater: Repeater, modes: string[]): boolean {
  if (!modes || modes.length === 0) return true
  const stored = repeater.modes ?? []

  return modes.some((mode) => {
    const value = String(mode).toUpperCase()
    if (value === "D-STAR") return stored.includes("DSTAR")
    return stored.includes(value as (typeof stored)[number])
  })
}

export function matchesQthLocator(repeater: Repeater, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return String(repeater.qthLocator ?? "").toLowerCase().includes(q)
}

export function matchesOpStatus(repeater: Repeater, opStatus: string | null): boolean {
  if (!opStatus) return true
  return repeater.status === opStatus
}

export function matchesFavourite(repeater: Repeater, favouritesOnly: boolean): boolean {
  if (!favouritesOnly) return true
  return isFavorite(repeater.callsign)
}

export function matchesOutputFrequency(repeater: Repeater, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  return pairsOf(repeater).some((pair) => numberMatches(pair?.outputFrequency, q, 3))
}

export function matchesInputFrequency(repeater: Repeater, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  return pairsOf(repeater).some((pair) => numberMatches(pair?.inputFrequency, q, 3))
}

export function matchesTone(repeater: Repeater, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  return pairsOf(repeater).some((pair) => numberMatches(pair?.tone, q, 1))
}

export function matchesDistance(
  repeater: Repeater,
  radiusKm: number | null,
  userLocation?: { latitude: number; longitude: number } | null
): boolean {
  if (radiusKm === null || !userLocation) return true
  const distance = calculateDistance(
    userLocation.latitude,
    userLocation.longitude,
    repeater.latitude,
    repeater.longitude
  )
  return distance <= radiusKm
}

/* ------------------------------------------------------------- combined */

/**
 * Applies every filter. Both the table and the map run their data through this,
 * so the two views cannot show different result sets for the same filter state.
 *
 * `shorten` is injected because the owner abbreviation table lives in columns.tsx
 * and importing it here would make this module depend on a "use client" file.
 */
export function applyRepeaterFilters(
  repeaters: Repeater[],
  state: RepeaterFilterState,
  shorten: (name: string) => string,
  context: RepeaterFilterContext = {}
): Repeater[] {
  const { userLocation, statusOf } = context

  return repeaters.filter(
    (repeater) =>
      matchesSearch(repeater, state.search) &&
      matchesCallsign(repeater, state.callsign) &&
      matchesBand(repeater, state.band) &&
      matchesOwner(repeater, state.owner, shorten) &&
      matchesModes(repeater, state.modes) &&
      // Independent axis: a mode selection and a link selection AND together.
      matchesLinks(repeater, state.links) &&
      matchesQthLocator(repeater, state.qthLocator) &&
      matchesOpStatus(repeater, state.opStatus) &&
      matchesFavourite(repeater, state.favouritesOnly) &&
      matchesOutputFrequency(repeater, state.outputFrequency) &&
      matchesInputFrequency(repeater, state.inputFrequency) &&
      matchesTone(repeater, state.tone) &&
      matchesDistance(repeater, state.distanceRadius, userLocation) &&
      // The merged status bucket is resolved by the caller, since it depends on
      // the vote and auto-check snapshots the status provider owns.
      (state.status === null || !statusOf || statusOf(repeater) === state.status)
  )
}
