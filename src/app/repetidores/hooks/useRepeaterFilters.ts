"use client"

/**
 * URL-synchronised filter, sort, pagination and drawer state for the repeaters view.
 *
 * The query string is parsed exactly once, and a single effect rebuilds it from scratch
 * and writes it only when the result actually differs from the last thing written, so a
 * write never feeds itself.
 *
 * NO useSearchParams. next.config.js sets output: 'export', and useSearchParams makes
 * every client component under it bail out of prerendering: the Suspense fallback, not
 * the table, is then what gets written into out/repetidores/index.html, which strips the
 * site's flagship SEO page of its rows for crawlers and no-JS visitors. The address bar
 * is read from window.location instead, and `hydrated` (a useSyncExternalStore whose
 * server snapshot disagrees with its client one) keeps the result out of the first
 * paint, so the prerendered HTML and the hydrating tree agree on the unfiltered table
 * and a shared ?q=... link applies itself in the very next render.
 *
 * Writes go through the native History API, which the App Router integrates with (see
 * "Native History API" in the Next.js linking-and-navigating docs), NOT through
 * router.replace. Now that this page really prerenders, router.replace stops moving the
 * address bar on any document that was LOADED with a query string -- Next re-asserts the
 * URL it started on -- so every filter change made after opening a shared
 * /repetidores/?q=... link was silently dropped. history.replaceState has none of that,
 * does not scroll, and does not fire popstate, so it cannot feed the listener that
 * handles Back/Forward in place of the subscription useSearchParams used to provide.
 *
 * usePathname is safe here: /repetidores and /repetidores/mapa carry no dynamic
 * segments, so it resolves during prerendering (ViewSwitcher, outside any boundary,
 * prerenders with it today).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { LINK_VALUES, legacyModeToLink } from "@/lib/links"
import { usePathname } from "next/navigation"
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from "@tanstack/react-table"
import type { Dispatch, SetStateAction } from "react"
import type { RepeaterMode } from "@/types/repeater"

export type Band = "2m" | "70cm"
export type OpStatus = "active" | "maintenance" | "offline"
export type StatusFilter = "ok" | "prob-bad" | "bad" | "unknown"

const VALID_BANDS: readonly Band[] = ["2m", "70cm"]
const VALID_OP_STATUS: readonly OpStatus[] = ["active", "maintenance", "offline"]
const VALID_STATUS: readonly StatusFilter[] = ["ok", "prob-bad", "bad", "unknown"]
const VALID_PAGE_SIZES: readonly number[] = [10, 20, 50, 100]

/** Keys of MODE_ALIASES that are mandatory: every RepeaterMode. EchoLink and
 *  AllStar used to be in here as pseudo-modes; they are linking systems, not
 *  modulations, and now live on their own axis (see `links`). The `satisfies`
 *  below turns a mode added to the Payload enum but not to the alias table into a
 *  type error rather than a silently dead filter. */
type ModeAliasKey = Uppercase<RepeaterMode>

/** Display labels the modes column filterFn understands, keyed for defensive parsing:
 *  any casing, plus the raw "DSTAR" spelling used inside repeater.modes. This table is
 *  the only gate between the data-derived mode option lists (the map view's chips and
 *  the advanced per-column dropdown, both built from repeater.modes) and state, so a
 *  mode missing here cannot be filtered on any surface. */
const MODE_ALIASES = {
  FM: "FM",
  DMR: "DMR",
  "D-STAR": "D-STAR",
  DSTAR: "D-STAR",
  C4FM: "C4FM",
  DIGIPEATER: "Digipeater",
  TETRA: "TETRA",
} satisfies Record<ModeAliasKey, string> & Record<string, string>

/** Same table, widened for lookup by an arbitrary user-supplied string. */
const MODE_ALIAS_LOOKUP: Record<string, string> = MODE_ALIASES

export const DEFAULT_PAGE_SIZE = 20

export interface RepeaterFilterState {
  /** Toolbar search box -> TanStack globalFilter. Matches callsign OR any frequency OR QTH. */
  search: string
  /** Advanced per-column callsign filter. Independent of `search`. */
  callsign: string
  band: Band | null
  /** Modulations: "FM" | "DMR" | "D-STAR" | "C4FM" | "TETRA". */
  modes: string[]
  /** Linking systems: "EchoLink" | "AllStar" | "Brandmeister" | ... ORs within
   *  itself, ANDs against `modes`: they are independent axes, so FM + EchoLink
   *  means "FM repeaters that have EchoLink", not "FM or EchoLink". */
  links: string[]
  owner: string
  qthLocator: string
  /** Merged status column filter. */
  status: StatusFilter | null
  /** Admin-set status. Column is default-hidden but the filter stays live (map view + shared URLs). */
  opStatus: OpStatus | null
  favouritesOnly: boolean
  /** km; null = no radius. Only applied when userLocation exists. */
  distanceRadius: number | null
  /** Advanced-only substring filters. */
  outputFrequency: string
  inputFrequency: string
  tone: string
  /** null = let DataTable use its own default (outputFrequency asc / distance asc). */
  sort: { id: string; desc: boolean } | null
  pageIndex: number
  pageSize: number
  selectedCallsign: string | null
  advancedOpen: boolean
}

export interface UseRepeaterFiltersResult extends RepeaterFilterState {
  /** Derived, memoised. Feed straight to <DataTable columnFilters={…}> AND to the map memo. */
  columnFilters: ColumnFiltersState
  /** Adapter for DataTable's onColumnFiltersChange (accepts TanStack updaters). */
  setColumnFilters: Dispatch<SetStateAction<ColumnFiltersState>>
  sorting: SortingState
  setSorting: Dispatch<SetStateAction<SortingState>>
  paginationState: PaginationState
  setPagination: Dispatch<SetStateAction<PaginationState>>

  setSearch: (search: string) => void
  setCallsign: (callsign: string) => void
  setBand: (band: Band | null) => void
  setModes: (modes: string[]) => void
  setLinks: (links: string[]) => void
  toggleLink: (link: string) => void
  toggleMode: (mode: string) => void
  clearModes: () => void
  setOwner: (owner: string) => void
  setQthLocator: (qth: string) => void
  setStatus: (status: StatusFilter | null) => void
  setOpStatus: (status: OpStatus | null) => void
  setFavouritesOnly: (on: boolean) => void
  setDistanceRadius: (km: number | null) => void
  setOutputFrequency: (v: string) => void
  setInputFrequency: (v: string) => void
  setTone: (v: string) => void
  setPageIndex: (pageIndex: number) => void
  setPageSize: (pageSize: number) => void
  setSelectedCallsign: (callsign: string | null) => void
  setAdvancedOpen: (open: boolean) => void

  /** Clears every filter + search + sort + page. Keeps pageSize, selectedCallsign, advancedOpen. */
  resetFilters: () => void
  activeFilterCount: number
  hasActiveFilters: boolean
}

/* ------------------------------------------------------------------ parsing */

function hasText(value: string): boolean {
  return value.trim() !== ""
}

function parseText(value: string | null): string {
  return typeof value === "string" ? value : ""
}

function parseBand(value: string | null): Band | null {
  return VALID_BANDS.includes(value as Band) ? (value as Band) : null
}

function parseStatus(value: string | null): StatusFilter | null {
  return VALID_STATUS.includes(value as StatusFilter) ? (value as StatusFilter) : null
}

function parseOpStatus(value: string | null): OpStatus | null {
  return VALID_OP_STATUS.includes(value as OpStatus) ? (value as OpStatus) : null
}

/** Unknown labels are dropped rather than filtering the table down to nothing. */
function normalizeMode(value: unknown): string | null {
  if (typeof value !== "string") return null
  const key = value.trim().toUpperCase()
  return MODE_ALIAS_LOOKUP[key] ?? null
}

function normalizeModes(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  const out: string[] = []
  for (const value of values) {
    const mode = normalizeMode(value)
    if (mode && !out.includes(mode)) out.push(mode)
  }
  return out
}

function parseModes(value: string | null): string[] {
  if (!value) return []
  return normalizeModes(value.split(","))
}

function normalizeLinks(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  const out: string[] = []
  for (const value of values) {
    const key = LINK_VALUES.find(
      (link) => link.toLowerCase() === String(value).trim().toLowerCase(),
    )
    if (key && !out.includes(key)) out.push(key)
  }
  return out
}

/**
 * ?links=, plus the legacy ?modes=EchoLink spelling from before linking had its
 * own axis, so shared links made before this change keep working.
 */
function parseLinks(linksValue: string | null, modesValue: string | null): string[] {
  const out = normalizeLinks((linksValue ?? "").split(","))
  for (const raw of (modesValue ?? "").split(",")) {
    const legacy = legacyModeToLink(raw)
    if (legacy && !out.includes(legacy)) out.push(legacy)
  }
  return out
}

function parseRadius(value: string | null): number | null {
  if (!value) return null
  const km = Number(value)
  return Number.isFinite(km) && km > 0 ? km : null
}

function parsePageIndex(value: string | null): number {
  const page = parseInt(value || "1", 10)
  if (!Number.isFinite(page)) return 0
  return Math.max(0, page - 1)
}

function parsePageSize(value: string | null): number {
  const size = parseInt(value || "", 10)
  return VALID_PAGE_SIZES.includes(size) ? size : DEFAULT_PAGE_SIZE
}

/** Column ids are not whitelisted (the distance column only exists with a location),
 *  but junk is rejected so a hand-edited URL cannot smuggle anything odd into state. */
function parseSort(id: string | null, dir: string | null): { id: string; desc: boolean } | null {
  if (!id || !/^[A-Za-z0-9_]{1,32}$/.test(id)) return null
  return { id, desc: dir === "desc" }
}

/** READ path only: `r=` comes from a hand-editable URL, so junk is rejected before it
 *  reaches state. The character class must cover every spelling the dataset actually
 *  uses, which includes the space in "CQ0DCH B" and the asterisk in "CQ0UMN*". */
function parseCallsignParam(value: string | null): string | null {
  if (!value) return null
  const callsign = value.trim().toUpperCase()
  return /^[A-Z0-9 */-]{1,24}$/.test(callsign) ? callsign : null
}

/** WRITE path: the value always comes from the dataset (a row, a card or a map
 *  marker), never from user input, so it is stored verbatim and only trimmed.
 *  Validating here would silently swallow legitimate callsigns and leave the drawer
 *  shut; URLSearchParams handles the encoding. Resolution back to a Repeater is
 *  case-insensitive, so casing is irrelevant. */
function sanitizeSelectedCallsign(value: string | null): string | null {
  if (typeof value !== "string") return null
  const callsign = value.trim()
  return callsign === "" ? null : callsign
}

const EMPTY_FILTERS: Omit<
  RepeaterFilterState,
  "pageSize" | "selectedCallsign" | "advancedOpen"
> = {
  search: "",
  callsign: "",
  band: null,
  modes: [],
  links: [],
  owner: "",
  qthLocator: "",
  status: null,
  opStatus: null,
  favouritesOnly: false,
  distanceRadius: null,
  outputFrequency: "",
  inputFrequency: "",
  tone: "",
  sort: null,
  pageIndex: 0,
}

/* ------------------------------------------------------ state <-> URL */

/** Anything with URLSearchParams' read half: the real thing, or next/navigation's
 *  ReadonlyURLSearchParams. */
interface ReadableParams {
  get(key: string): string | null
}

/** The single place the query string is read. Used by the lazy initializer and by
 *  the popstate listener, so a Back navigation re-seeds state the same way a fresh
 *  load would. */
function parseState(params: ReadableParams | null): RepeaterFilterState {
  const get = (key: string) => params?.get(key) ?? null
  return {
    search: parseText(get("q")),
    callsign: parseText(get("cs")),
    band: parseBand(get("band")),
    modes: parseModes(get("modes")),
    links: parseLinks(get("links"), get("modes")),
    owner: parseText(get("owner")),
    qthLocator: parseText(get("qth")),
    status: parseStatus(get("status")),
    opStatus: parseOpStatus(get("opstatus")),
    favouritesOnly: get("fav") === "1",
    distanceRadius: parseRadius(get("radius")),
    outputFrequency: parseText(get("out")),
    inputFrequency: parseText(get("in")),
    tone: parseText(get("tone")),
    sort: parseSort(get("sort"), get("dir")),
    pageIndex: parsePageIndex(get("page")),
    pageSize: parsePageSize(get("size")),
    selectedCallsign: parseCallsignParam(get("r")),
    advancedOpen: get("adv") === "1",
  }
}

/** The single place the query string is written. Every param is omitted at its
 *  default, so a pristine view carries no query string at all. */
function buildUrl(state: RepeaterFilterState, pathname: string): string {
  const params = new URLSearchParams()
  if (hasText(state.search)) params.set("q", state.search)
  if (hasText(state.callsign)) params.set("cs", state.callsign)
  if (state.band) params.set("band", state.band)
  if (state.modes.length > 0) params.set("modes", state.modes.join(","))
  if (state.links.length > 0) params.set("links", state.links.join(","))
  if (hasText(state.owner)) params.set("owner", state.owner)
  if (hasText(state.qthLocator)) params.set("qth", state.qthLocator)
  if (state.status) params.set("status", state.status)
  if (state.opStatus) params.set("opstatus", state.opStatus)
  if (state.favouritesOnly) params.set("fav", "1")
  if (state.distanceRadius !== null) params.set("radius", String(state.distanceRadius))
  if (hasText(state.outputFrequency)) params.set("out", state.outputFrequency)
  if (hasText(state.inputFrequency)) params.set("in", state.inputFrequency)
  if (hasText(state.tone)) params.set("tone", state.tone)
  if (state.sort) {
    params.set("sort", state.sort.id)
    // Ascending is the absence of `dir`
    if (state.sort.desc) params.set("dir", "desc")
  }
  if (state.pageIndex > 0) params.set("page", String(state.pageIndex + 1))
  if (state.pageSize !== DEFAULT_PAGE_SIZE) params.set("size", String(state.pageSize))
  if (state.selectedCallsign) params.set("r", state.selectedCallsign)
  if (state.advancedOpen) params.set("adv", "1")

  const queryString = params.toString()
  return queryString ? `${pathname}?${queryString}` : pathname
}

/* ------------------------------------------ columnFilters <-> state adapters */

/** Order matters: DataTable renders one chip per entry, in this order. */
function buildColumnFilters(state: RepeaterFilterState): ColumnFiltersState {
  const filters: ColumnFiltersState = []
  if (hasText(state.callsign)) filters.push({ id: "callsign", value: state.callsign })
  if (state.band) filters.push({ id: "band", value: state.band })
  if (state.modes.length > 0) filters.push({ id: "modes", value: state.modes })
  if (hasText(state.owner)) filters.push({ id: "owner", value: state.owner })
  if (hasText(state.qthLocator)) filters.push({ id: "qthLocator", value: state.qthLocator })
  if (state.status) filters.push({ id: "status", value: state.status })
  if (state.opStatus) filters.push({ id: "opStatus", value: state.opStatus })
  if (hasText(state.outputFrequency))
    filters.push({ id: "outputFrequency", value: state.outputFrequency })
  if (hasText(state.inputFrequency))
    filters.push({ id: "inputFrequency", value: state.inputFrequency })
  if (hasText(state.tone)) filters.push({ id: "tone", value: state.tone })
  if (state.favouritesOnly) filters.push({ id: "favorite", value: true })
  return filters
}

function readFilter(filters: ColumnFiltersState, id: string): unknown {
  return filters.find((f) => f.id === id)?.value
}

function readText(filters: ColumnFiltersState, id: string): string {
  const value = readFilter(filters, id)
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return ""
}

/** Folds a TanStack ColumnFiltersState back into our flat state object. */
function applyColumnFilters(
  prev: RepeaterFilterState,
  filters: ColumnFiltersState,
): RepeaterFilterState {
  const band = readFilter(filters, "band")
  const status = readFilter(filters, "status")
  const opStatus = readFilter(filters, "opStatus")
  const next: RepeaterFilterState = {
    ...prev,
    callsign: readText(filters, "callsign"),
    band: parseBand(typeof band === "string" ? band : null),
    modes: normalizeModes(readFilter(filters, "modes")),
    owner: readText(filters, "owner"),
    qthLocator: readText(filters, "qthLocator"),
    status: parseStatus(typeof status === "string" ? status : null),
    opStatus: parseOpStatus(typeof opStatus === "string" ? opStatus : null),
    outputFrequency: readText(filters, "outputFrequency"),
    inputFrequency: readText(filters, "inputFrequency"),
    tone: readText(filters, "tone"),
    favouritesOnly: readFilter(filters, "favorite") === true,
    pageIndex: 0,
  }
  return sameFilters(prev, next) ? prev : next
}

function sameModes(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((mode, i) => mode === b[i])
}

function sameFilters(a: RepeaterFilterState, b: RepeaterFilterState): boolean {
  return (
    a.callsign === b.callsign &&
    a.band === b.band &&
    sameModes(a.modes, b.modes) &&
    sameModes(a.links, b.links) &&
    a.owner === b.owner &&
    a.qthLocator === b.qthLocator &&
    a.status === b.status &&
    a.opStatus === b.opStatus &&
    a.outputFrequency === b.outputFrequency &&
    a.inputFrequency === b.inputFrequency &&
    a.tone === b.tone &&
    a.favouritesOnly === b.favouritesOnly
  )
}

/* ------------------------------------------------------------- hydration */

/** The state the PRERENDER produced, and therefore the only state the client's
 *  hydration pass is allowed to render: out/repetidores/index.html is built with no
 *  address bar to read. */
const PRISTINE_STATE: RepeaterFilterState = parseState(null)

/** Reads the address bar. Called once, during the first render; on the server (and so
 *  in the static export) there is nothing to read and the pristine state stands. */
function readUrlState(pathname: string): { state: RepeaterFilterState; url: string } {
  if (typeof window === "undefined") return { state: PRISTINE_STATE, url: pathname }
  const params = new URLSearchParams(window.location.search)
  // Rebuilt rather than taken raw, so the comparison against buildUrl() below is
  // between two identically encoded strings.
  const queryString = params.toString()
  return {
    state: parseState(params),
    url: queryString ? `${pathname}?${queryString}` : pathname,
  }
}

/** `hydrated`: false while the prerender and the hydration pass run, true from the
 *  render React schedules immediately afterwards. The value never changes again, so
 *  there is nothing to subscribe to. */
function subscribeToNothing(): () => void {
  return () => {}
}

function getHydratedSnapshot(): boolean {
  return true
}

function getPrerenderSnapshot(): boolean {
  return false
}

/* -------------------------------------------------------------------- hook */

export function useRepeaterFilters(): UseRepeaterFiltersResult {
  const pathname = usePathname()

  // Parsed once, during the first render. Safe to do here only because `visibleState`
  // below hides it until hydration is over.
  const [initial] = useState(() => readUrlState(pathname))
  const [state, setState] = useState<RepeaterFilterState>(initial.state)

  const hydrated = useSyncExternalStore(
    subscribeToNothing,
    getHydratedSnapshot,
    getPrerenderSnapshot,
  )

  // EVERYTHING this hook returns is derived from this, never from `state` directly:
  // rendering a shared link's filters during hydration would contradict the unfiltered
  // markup in the static export and React would discard the whole tree.
  const visibleState = hydrated ? state : PRISTINE_STATE

  // Sync state -> URL, with a URL-comparison guard so a navigation never feeds itself.
  // Seeded with the URL as it actually stands, so the first pass normalises away any
  // junk a hand-edited query string carried.
  const lastUrlRef = useRef<string>(initial.url)
  // Opening a repeater is the one transition users expect Back to undo, so it gets a
  // history entry (and closing pops it again). Filter, sort and page churn keeps
  // replacing, or Back would have to be pressed once per keystroke.
  const lastSelectedRef = useRef<string | null>(initial.state.selectedCallsign)
  // True only while the current history entry is one WE pushed to open the drawer, so
  // a drawer opened straight from a shared ?r=... link closes with a replace instead of
  // a back that would leave the site.
  const openedByPushRef = useRef(false)

  useEffect(() => {
    const newUrl = buildUrl(state, pathname)
    const previousSelected = lastSelectedRef.current
    const opensRepeater =
      state.selectedCallsign !== null && state.selectedCallsign !== previousSelected
    const closesRepeater = state.selectedCallsign === null && previousSelected !== null
    lastSelectedRef.current = state.selectedCallsign

    // Closing a drawer we opened ourselves pops the entry the open pushed, so the
    // history does not fill up with one dead Back press per repeater looked at. The
    // popstate listener below re-seeds state and lastUrlRef from the popped URL.
    if (closesRepeater && openedByPushRef.current) {
      openedByPushRef.current = false
      window.history.back()
      return
    }

    // Only write if the URL actually changed (prevents infinite loops)
    if (newUrl !== lastUrlRef.current) {
      lastUrlRef.current = newUrl
      if (opensRepeater) {
        openedByPushRef.current = true
        window.history.pushState(null, "", newUrl)
      } else {
        window.history.replaceState(null, "", newUrl)
      }
    }
  }, [state, pathname])

  // A Back/Forward navigation changes the URL underneath the effect above, which
  // deliberately does not read it back. Nothing subscribes us to the query string any
  // more, so re-seed state (and the guard refs) from the popped URL here or the UI and
  // the address bar would silently disagree. lastUrlRef is seeded first, so the writer
  // effect that follows this setState finds nothing to write.
  useEffect(() => {
    const onPopState = () => {
      const next = parseState(new URLSearchParams(window.location.search))
      lastUrlRef.current = buildUrl(next, window.location.pathname)
      lastSelectedRef.current = next.selectedCallsign
      // Whatever entry we just landed on, it is no longer the one our push created.
      openedByPushRef.current = false
      setState(next)
    }
    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [])

  /* ------------------------------------------------------------- setters */

  // Every filter setter resets pagination to the first page, and bails out when the
  // value is unchanged so a redundant call cannot silently reset the page.
  const patch = useCallback(
    (updater: (prev: RepeaterFilterState) => Partial<RepeaterFilterState> | null) => {
      setState((prev) => {
        const changes = updater(prev)
        return changes ? { ...prev, ...changes } : prev
      })
    },
    [],
  )

  const setSearch = useCallback(
    (search: string) => patch((prev) => (prev.search === search ? null : { search, pageIndex: 0 })),
    [patch],
  )

  const setCallsign = useCallback(
    (callsign: string) =>
      patch((prev) => (prev.callsign === callsign ? null : { callsign, pageIndex: 0 })),
    [patch],
  )

  const setBand = useCallback(
    (band: Band | null) => {
      const next = parseBand(band)
      patch((prev) => (prev.band === next ? null : { band: next, pageIndex: 0 }))
    },
    [patch],
  )

  const setModes = useCallback(
    (modes: string[]) => {
      const next = normalizeModes(modes)
      patch((prev) => (sameModes(prev.modes, next) ? null : { modes: next, pageIndex: 0 }))
    },
    [patch],
  )

  const setLinks = useCallback(
    (links: string[]) => {
      const next = normalizeLinks(links)
      patch((prev) => (sameModes(prev.links, next) ? null : { links: next, pageIndex: 0 }))
    },
    [patch],
  )

  const toggleLink = useCallback(
    (link: string) => {
      const [target] = normalizeLinks([link])
      if (!target) return
      patch((prev) => ({
        links: prev.links.includes(target)
          ? prev.links.filter((l) => l !== target)
          : [...prev.links, target],
        pageIndex: 0,
      }))
    },
    [patch],
  )

  // Multi-select everywhere: append or remove, never replace.
  const toggleMode = useCallback(
    (mode: string) => {
      const target = normalizeMode(mode)
      if (!target) return
      patch((prev) => ({
        modes: prev.modes.includes(target)
          ? prev.modes.filter((m) => m !== target)
          : [...prev.modes, target],
        pageIndex: 0,
      }))
    },
    [patch],
  )

  const clearModes = useCallback(
    () => patch((prev) => (prev.modes.length === 0 ? null : { modes: [], pageIndex: 0 })),
    [patch],
  )

  const setOwner = useCallback(
    (owner: string) => patch((prev) => (prev.owner === owner ? null : { owner, pageIndex: 0 })),
    [patch],
  )

  const setQthLocator = useCallback(
    (qthLocator: string) =>
      patch((prev) => (prev.qthLocator === qthLocator ? null : { qthLocator, pageIndex: 0 })),
    [patch],
  )

  const setStatus = useCallback(
    (status: StatusFilter | null) => {
      const next = parseStatus(status)
      patch((prev) => (prev.status === next ? null : { status: next, pageIndex: 0 }))
    },
    [patch],
  )

  const setOpStatus = useCallback(
    (opStatus: OpStatus | null) => {
      const next = parseOpStatus(opStatus)
      patch((prev) => (prev.opStatus === next ? null : { opStatus: next, pageIndex: 0 }))
    },
    [patch],
  )

  const setFavouritesOnly = useCallback(
    (on: boolean) =>
      patch((prev) =>
        prev.favouritesOnly === on ? null : { favouritesOnly: on, pageIndex: 0 },
      ),
    [patch],
  )

  const setDistanceRadius = useCallback(
    (km: number | null) => {
      const next = km !== null && Number.isFinite(km) && km > 0 ? km : null
      patch((prev) => (prev.distanceRadius === next ? null : { distanceRadius: next, pageIndex: 0 }))
    },
    [patch],
  )

  const setOutputFrequency = useCallback(
    (outputFrequency: string) =>
      patch((prev) =>
        prev.outputFrequency === outputFrequency ? null : { outputFrequency, pageIndex: 0 },
      ),
    [patch],
  )

  const setInputFrequency = useCallback(
    (inputFrequency: string) =>
      patch((prev) =>
        prev.inputFrequency === inputFrequency ? null : { inputFrequency, pageIndex: 0 },
      ),
    [patch],
  )

  const setTone = useCallback(
    (tone: string) => patch((prev) => (prev.tone === tone ? null : { tone, pageIndex: 0 })),
    [patch],
  )

  const setPageIndex = useCallback(
    (pageIndex: number) => {
      const next = Number.isFinite(pageIndex) ? Math.max(0, Math.trunc(pageIndex)) : 0
      patch((prev) => (prev.pageIndex === next ? null : { pageIndex: next }))
    },
    [patch],
  )

  const setPageSize = useCallback(
    (pageSize: number) => {
      const next = VALID_PAGE_SIZES.includes(pageSize) ? pageSize : DEFAULT_PAGE_SIZE
      patch((prev) => (prev.pageSize === next ? null : { pageSize: next }))
    },
    [patch],
  )

  const setSelectedCallsign = useCallback(
    (callsign: string | null) => {
      const next = sanitizeSelectedCallsign(callsign)
      patch((prev) => (prev.selectedCallsign === next ? null : { selectedCallsign: next }))
    },
    [patch],
  )

  const setAdvancedOpen = useCallback(
    (advancedOpen: boolean) =>
      patch((prev) => (prev.advancedOpen === advancedOpen ? null : { advancedOpen })),
    [patch],
  )

  const resetFilters = useCallback(
    () => patch(() => ({ ...EMPTY_FILTERS })),
    [patch],
  )

  /* ------------------------------------------------- TanStack table shapes */

  const columnFilters = useMemo(() => buildColumnFilters(visibleState), [visibleState])

  const setColumnFilters = useCallback<Dispatch<SetStateAction<ColumnFiltersState>>>(
    (updater) => {
      setState((prev) => {
        const next =
          typeof updater === "function" ? updater(buildColumnFilters(prev)) : updater
        return applyColumnFilters(prev, Array.isArray(next) ? next : [])
      })
    },
    [],
  )

  // Empty means "no explicit sort": DataTable falls back to its own default
  // (outputFrequency asc, or distance asc once a location is known).
  const sorting = useMemo<SortingState>(
    () => (visibleState.sort ? [{ id: visibleState.sort.id, desc: visibleState.sort.desc }] : []),
    [visibleState.sort],
  )

  const setSorting = useCallback<Dispatch<SetStateAction<SortingState>>>(
    (updater) => {
      setState((prev) => {
        const current: SortingState = prev.sort
          ? [{ id: prev.sort.id, desc: prev.sort.desc }]
          : []
        const resolved = typeof updater === "function" ? updater(current) : updater
        const first = Array.isArray(resolved) ? resolved[0] : undefined
        const next = first ? { id: String(first.id), desc: first.desc === true } : null
        if (prev.sort?.id === next?.id && prev.sort?.desc === next?.desc) return prev
        return { ...prev, sort: next, pageIndex: 0 }
      })
    },
    [],
  )

  const paginationState = useMemo<PaginationState>(
    () => ({ pageIndex: visibleState.pageIndex, pageSize: visibleState.pageSize }),
    [visibleState.pageIndex, visibleState.pageSize],
  )

  const setPagination = useCallback<Dispatch<SetStateAction<PaginationState>>>(
    (updater) => {
      setState((prev) => {
        const current: PaginationState = { pageIndex: prev.pageIndex, pageSize: prev.pageSize }
        const resolved = typeof updater === "function" ? updater(current) : updater
        const pageIndex = Number.isFinite(resolved.pageIndex)
          ? Math.max(0, Math.trunc(resolved.pageIndex))
          : 0
        const pageSize = VALID_PAGE_SIZES.includes(resolved.pageSize)
          ? resolved.pageSize
          : prev.pageSize
        if (prev.pageIndex === pageIndex && prev.pageSize === pageSize) return prev
        return { ...prev, pageIndex, pageSize }
      })
    },
    [],
  )

  /* --------------------------------------------------------------- counts */

  // One unit per dismissable chip: each selected mode counts separately, and the
  // distance radius counts too (RepeaterView passes it as an extraFilterChip).
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (hasText(visibleState.search)) count++
    if (hasText(visibleState.callsign)) count++
    if (visibleState.band) count++
    count += visibleState.modes.length
    count += visibleState.links.length
    if (hasText(visibleState.owner)) count++
    if (hasText(visibleState.qthLocator)) count++
    if (visibleState.status) count++
    if (visibleState.opStatus) count++
    if (hasText(visibleState.outputFrequency)) count++
    if (hasText(visibleState.inputFrequency)) count++
    if (hasText(visibleState.tone)) count++
    if (visibleState.favouritesOnly) count++
    if (visibleState.distanceRadius !== null) count++
    return count
  }, [visibleState])

  return {
    ...visibleState,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    paginationState,
    setPagination,
    setSearch,
    setCallsign,
    setBand,
    setModes,
    toggleMode,
    setLinks,
    toggleLink,
    clearModes,
    setOwner,
    setQthLocator,
    setStatus,
    setOpStatus,
    setFavouritesOnly,
    setDistanceRadius,
    setOutputFrequency,
    setInputFrequency,
    setTone,
    setPageIndex,
    setPageSize,
    setSelectedCallsign,
    setAdvancedOpen,
    resetFilters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,
  }
}

export default useRepeaterFilters
