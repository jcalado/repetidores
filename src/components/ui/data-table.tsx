
"use client"

import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  OnChangeFn,
  PaginationState,
  Row,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronsUpDown,
  Columns3,
  Download,
  FunnelX,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export interface DataTableFilterChip {
  /** Stable id, used as React key and passed back to onRemove. */
  id: string
  /** Already-translated label, e.g. t("table.chips.band"). */
  label: string
  /** Already-translated value segment. Omit for label-only chips (favourites). */
  value?: string
  /** Render the value in Geist Mono (the Callsign Rule). Defaults by chip id:
   *  callsigns, frequencies, tones, locators, the search box and the distance
   *  radius are all identifiers and carry mono automatically. */
  mono?: boolean
  onRemove: () => void
}

export interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onFilteredDataChange?: (rows: TData[]) => void

  /* ---- controlled state. Each falls back to internal useState when omitted. ---- */
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  globalFilter?: string
  onGlobalFilterChange?: React.Dispatch<React.SetStateAction<string>>
  globalFilterFn?: FilterFn<TData>
  sorting?: SortingState
  onSortingChange?: React.Dispatch<React.SetStateAction<SortingState>>
  pagination?: PaginationState
  onPaginationChange?: React.Dispatch<React.SetStateAction<PaginationState>>

  /* ---- rows ---- */
  onRowClick?: (row: TData) => void
  /** Stable row id. Defaults to TanStack's index id when omitted. */
  getRowId?: (row: TData, index: number) => string
  /** Accessible name for a focusable row, e.g. t("table.row.open", { callsign }). */
  getRowLabel?: (row: TData) => string

  /* ---- mobile ---- */
  /** Rendered instead of <Table> below md (768px), via CSS only: the table sits in
   *  `hidden md:block`, this node in `md:hidden`. Receives the current page's rows,
   *  already filtered, sorted and paginated, in display order. */
  renderCardList?: (rows: TData[]) => React.ReactNode

  /* ---- toolbar ---- */
  /** Domain controls injected into toolbar row 1 between the search box and the
   *  right-hand icon cluster (band select, status select, location button). */
  toolbar?: React.ReactNode
  /** Full-width node under toolbar row 1 (the mode chip strip). */
  toolbarSecondary?: React.ReactNode
  /** Buttons pinned to the left of the right-hand icon cluster (favourites, submit). */
  leftActions?: React.ReactNode
  advancedFiltersOpen?: boolean
  onAdvancedFiltersOpenChange?: (open: boolean) => void
  /** Suppresses the built-in toolbar, chips and result count: the caller renders
   *  RepeaterFilterBar above the table instead, so the map can show the same one.
   *  Only the table-specific actions (export, Colunas, per-column row) remain, in a
   *  compact strip. SimplexBrowser leaves this off and keeps the built-in toolbar. */
  hideToolbar?: boolean
  /** Canonical options for the per-column "Modos" filter, in display order. The
   *  caller owns this vocabulary because it cannot be read off the rows: EchoLink
   *  and AllStar live outside `modes` (echolink.enabled, allstarNode), so a
   *  data-derived list would drop them while exposing raw stored spellings, and the
   *  two mode surfaces write the same filter entry. Omitted, the options are
   *  derived from the data as before (SimplexBrowser). */
  modeFilterOptions?: string[]

  /* ---- counts, empty state, clearing ---- */
  /** Denominator for the result count. Defaults to data.length. */
  totalCount?: number
  /** Extra active filters DataTable cannot see (distance radius, favourites-from-URL).
   *  Rendered as chips alongside the ones derived from columnFilters/globalFilter. */
  extraFilterChips?: DataTableFilterChip[]
  /** Invoked by clear-all, the FunnelX button, and the empty-state action.
   *  When omitted, DataTable falls back to table.resetColumnFilters() + setPageIndex(0). */
  onClearFilters?: () => void

  isLoading?: boolean
  initialSorting?: SortingState
}

/** DESIGN.md rest shadow: cool ink hue at low alpha, never pure black. */
const REST_SHADOW =
  "shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)]"

const DEFAULT_SORTING: SortingState = [{ id: "outputFrequency", desc: false }]

/** Chip order, and the table.chips.* key each column id answers to. Column ids
 *  that are absent here (other DataTable consumers) fall back to their header. */
const CHIP_COLUMNS: { id: string; labelKey: string }[] = [
  { id: "callsign", labelKey: "table.chips.callsign" },
  { id: "band", labelKey: "table.chips.band" },
  { id: "modes", labelKey: "table.chips.modes" },
  { id: "owner", labelKey: "table.chips.owner" },
  { id: "qthLocator", labelKey: "table.chips.qthLocator" },
  { id: "status", labelKey: "table.chips.status" },
  { id: "opStatus", labelKey: "table.chips.opStatus" },
  { id: "outputFrequency", labelKey: "table.chips.outputFrequency" },
  { id: "inputFrequency", labelKey: "table.chips.inputFrequency" },
  { id: "tone", labelKey: "table.chips.tone" },
  { id: "favorite", labelKey: "table.chips.favorites" },
]

/** Chips whose value is a callsign, frequency, tone, locator or distance, and so
 *  renders in Geist Mono. "distance" comes in through extraFilterChips. */
const MONO_CHIP_IDS = new Set([
  "search",
  "callsign",
  "qthLocator",
  "outputFrequency",
  "inputFrequency",
  "tone",
  "distance",
])

/** Translated name for a column whose header is a render function and which has
 *  not declared a `meta.label`. Keeps a raw English column id (an identifier, not
 *  copy) out of the Portuguese UI; `meta.label` still wins when it is present. */
const COLUMN_LABEL_KEYS: Record<string, string> = {
  favorite: "favorites.column",
}

/** Marker swapped into the translated "{label}: {value}" template so the value
 *  segment can be styled without hardcoding the template's punctuation here. */
const CHIP_VALUE_SENTINEL = "\uE000"

function sameSorting(a: SortingState, b: SortingState): boolean {
  return (
    a.length === b.length &&
    a.every((s, i) => s.id === b[i].id && s.desc === b[i].desc)
  )
}

/**
 * Human-readable name of a column: its `meta.label` when the column author
 * supplied one (the only option for a column whose header is a render function,
 * such as the favourites heart), then a string header, and only then the raw
 * column id, which is an English identifier and never belongs on screen.
 *
 * `ColumnMeta` is left un-augmented on purpose so the column definitions own
 * that declaration; reading it through a narrow cast keeps this file free of a
 * module augmentation that would collide with theirs.
 */
function columnDisplayName<TData>(column: Column<TData, unknown>): string {
  const meta = column.columnDef.meta as { label?: string } | undefined
  if (typeof meta?.label === "string" && meta.label !== "") return meta.label
  const header = column.columnDef.header
  return typeof header === "string" ? header : column.id
}

/** A click or keypress that landed on a control nested inside a clickable row. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el || typeof el.closest !== "function") return false
  return !!el.closest(
    'button, a, input, select, textarea, [role="menuitem"], [role="checkbox"], [role="combobox"]'
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onFilteredDataChange,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  globalFilterFn,
  sorting: sortingProp,
  onSortingChange,
  pagination: paginationProp,
  onPaginationChange,
  onRowClick,
  getRowId,
  getRowLabel,
  renderCardList,
  toolbar,
  toolbarSecondary,
  leftActions,
  advancedFiltersOpen,
  onAdvancedFiltersOpenChange,
  hideToolbar = false,
  modeFilterOptions,
  totalCount,
  extraFilterChips,
  onClearFilters,
  isLoading = false,
  initialSorting,
}: DataTableProps<TData, TValue>): React.ReactElement {
  const t = useTranslations()
  const advancedRowId = React.useId()

  /* ------------------------------------------------------------- sorting */

  // Stabilised by value: RepeaterView builds initialSorting inline, so its
  // identity changes on every render.
  const initialSortingKey = initialSorting ? JSON.stringify(initialSorting) : ""
  const defaultSorting = React.useMemo<SortingState>(
    () => initialSorting ?? DEFAULT_SORTING,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [initialSortingKey]
  )

  const [internalSorting, setInternalSorting] = React.useState<SortingState>(defaultSorting)
  const [userHasChangedSort, setUserHasChangedSort] = React.useState(false)
  const isSortingControlled = sortingProp !== undefined

  // A controlled but EMPTY SortingState means "no explicit sort yet": fall back to
  // our own default rather than writing it back, so geolocation arriving (and
  // flipping the default to distance) never churns the caller's URL state.
  const sorting = isSortingControlled
    ? (sortingProp.length > 0 ? sortingProp : defaultSorting)
    : internalSorting

  // Follow initialSorting (e.g. user location becoming available) until the user
  // has sorted manually themselves.
  React.useEffect(() => {
    if (isSortingControlled || !initialSorting || userHasChangedSort) return
    setInternalSorting((prev) => (sameSorting(prev, initialSorting) ? prev : initialSorting))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSortingKey, userHasChangedSort, isSortingControlled])

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    setUserHasChangedSort(true)
    const next = typeof updater === "function" ? updater(sorting) : updater
    if (onSortingChange) onSortingChange(next)
    else setInternalSorting(next)
  }

  /* ------------------------------------------------------------- filters */

  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const columnFilters = columnFiltersProp ?? internalColumnFilters

  const handleColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next = typeof updater === "function" ? updater(columnFilters) : updater
    if (onColumnFiltersChange) onColumnFiltersChange(next)
    else setInternalColumnFilters(next)
  }

  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState("")
  const globalFilter = globalFilterProp ?? internalGlobalFilter

  const handleGlobalFilterChange: OnChangeFn<string> = (updater) => {
    const next = typeof updater === "function" ? updater(globalFilter) : updater
    if (onGlobalFilterChange) onGlobalFilterChange(next)
    else setInternalGlobalFilter(next)
  }

  const [internalColumnVisibility, setInternalColumnVisibility] =
    React.useState<VisibilityState>({
      latitude: false,
      longitude: false,
      // The admin-set status now lives inside the merged "status" cell; the column
      // stays registered (its filter is reachable from the map view and shared
      // URLs) and restorable from the Colunas dropdown.
      opStatus: false,
    })

  /* ---------------------------------------------------------- pagination */

  const [internalPagination, setInternalPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const pagination = paginationProp ?? internalPagination

  const handlePaginationChange: OnChangeFn<PaginationState> = (updater) => {
    const next = typeof updater === "function" ? updater(pagination) : updater
    if (onPaginationChange) onPaginationChange(next)
    else setInternalPagination(next)
  }

  /* ------------------------------------------------- progressive disclosure */

  // Per-column filters are opt-in: their controls are keyed to the repeater column
  // ids, so a consumer enables them by wiring the advancedFiltersOpen pair.
  const advancedFiltersEnabled =
    advancedFiltersOpen !== undefined || onAdvancedFiltersOpenChange !== undefined
  const [internalAdvancedOpen, setInternalAdvancedOpen] = React.useState(false)
  const advancedOpen = advancedFiltersEnabled && (advancedFiltersOpen ?? internalAdvancedOpen)
  const setAdvancedOpen = (open: boolean) => {
    onAdvancedFiltersOpenChange?.(open)
    if (advancedFiltersOpen === undefined) setInternalAdvancedOpen(open)
  }

  const [showExportModal, setShowExportModal] = React.useState(false)
  const [exportFormat, setExportFormat] = React.useState<"chirp" | "anytone">("chirp")

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: handleColumnFiltersChange,
    onGlobalFilterChange: handleGlobalFilterChange,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setInternalColumnVisibility,
    onPaginationChange: handlePaginationChange,
    // TanStack resets the page index whenever the data identity changes. A caller
    // that controls pagination (the repeaters view) rebuilds `data` on purpose
    // when vote stats or favourites land, and resets the page itself in every
    // filter setter, so the automatic reset would only throw the reader back to
    // page 1 and strip ?page from the URL. Uncontrolled consumers keep it.
    autoResetPageIndex: paginationProp === undefined,
    ...(globalFilterFn
      ? {
          globalFilterFn,
          // The caller's filter fn reads row.original, so every column is a valid
          // entry point; TanStack's default only admits string/number accessors.
          getColumnCanGlobalFilter: () => true,
        }
      : {}),
    ...(getRowId ? { getRowId: (row: TData, index: number) => getRowId(row, index) } : {}),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility: internalColumnVisibility,
      pagination,
    },
  })

  const derivedModeOptions = React.useMemo(() => {
    const set = new Set<string>()
    ;(data as unknown[]).forEach((d) => {
      const item = d as Record<string, unknown>
      const modes = item?.modes as string[] | undefined
      if (modes && Array.isArray(modes)) {
        modes.forEach((m) => set.add(m === 'DSTAR' ? 'D-STAR' : m))
      }
    })
    return Array.from(set).sort()
  }, [data])

  // The caller's canonical list wins whenever it supplied one, so the dropdown and
  // the chip strip can never disagree about which modes exist.
  const modeOptions = modeFilterOptions ?? derivedModeOptions

  /* ------------------------------------------------------- counts + chips */

  const filteredCount = table.getFilteredRowModel().rows.length
  const total = totalCount ?? data.length
  // The result count, the table's accessible name and the self-describing export
  // label all say "repetidores", so they are opt-in: a caller signals that this is
  // the repeater table by supplying totalCount. Other consumers (SimplexBrowser)
  // keep the neutral icon-only export button and no count line.
  const showResultCount = totalCount !== undefined

  /** Header text of a column, for aria-labels and fallback chip labels. A column
   *  whose header is a render function (the favourites heart) advertises its
   *  translated name through `meta.label` instead; the raw English column id is
   *  the last resort and must never reach the Portuguese UI. */
  const columnName = React.useCallback(
    (column: Column<TData, unknown>) => {
      const name = columnDisplayName(column)
      if (name !== column.id) return name
      const key = COLUMN_LABEL_KEYS[column.id]
      return key ? t(key) : name
    },
    [t]
  )

  const columnLabel = React.useCallback(
    (id: string) => {
      const column = table.getColumn(id)
      return column ? columnName(column) : id
    },
    [table, columnName]
  )

  const clearFilters = React.useCallback(() => {
    if (onClearFilters) {
      onClearFilters()
      return
    }
    table.resetColumnFilters()
    if (globalFilterProp === undefined) setInternalGlobalFilter("")
    else onGlobalFilterChange?.("")
    table.setPageIndex(0)
  }, [onClearFilters, table, globalFilterProp, onGlobalFilterChange])

  const chips: DataTableFilterChip[] = []

  if (globalFilter.trim() !== "") {
    chips.push({
      id: "search",
      label: t("table.chips.search"),
      value: globalFilter,
      onRemove: () => handleGlobalFilterChange(""),
    })
  }

  for (const { id, labelKey } of CHIP_COLUMNS) {
    const column = table.getColumn(id)
    if (!column) continue
    const value = column.getFilterValue()
    if (value === undefined || value === null || value === "" || value === false) continue
    const label = t(labelKey)

    if (Array.isArray(value)) {
      value.forEach((entry) => {
        chips.push({
          id: `${id}:${String(entry)}`,
          label,
          value: String(entry),
          onRemove: () => {
            const current = (column.getFilterValue() as unknown[] | undefined) ?? []
            const next = current.filter((v) => v !== entry)
            column.setFilterValue(next.length > 0 ? next : undefined)
          },
        })
      })
      continue
    }

    // Label-only chips: the favourites toggle carries no value segment.
    const isBoolean = typeof value === "boolean"
    let display: string | undefined
    if (!isBoolean) {
      const raw = String(value)
      if (id === "status") display = t(`table.status.${raw}`)
      else if (id === "opStatus") display = t(`table.opStatus.${raw}`)
      else display = raw
    }

    chips.push({
      id,
      label,
      value: display,
      onRemove: () => column.setFilterValue(undefined),
    })
  }

  // Filters DataTable cannot see (the distance radius) render last.
  if (extraFilterChips?.length) chips.push(...extraFilterChips)

  const activeFilterCount = chips.length
  const hasActiveFilters = activeFilterCount > 0

  /**
   * The visible body of a chip. Values that are identifiers (callsign, frequency,
   * tone, QTH locator, distance) render in Geist Mono, so the translated
   * "{label}: {value}" template is split around its value segment instead of
   * being composed here: the punctuation and the word order stay in pt.json.
   */
  const renderChipText = (chip: DataTableFilterChip): React.ReactNode => {
    if (chip.value === undefined) return chip.label
    const composed = t("table.chips.value", { label: chip.label, value: chip.value })
    if (!(chip.mono ?? MONO_CHIP_IDS.has(chip.id))) return composed
    const parts = t("table.chips.value", {
      label: chip.label,
      value: CHIP_VALUE_SENTINEL,
    }).split(CHIP_VALUE_SENTINEL)
    if (parts.length !== 2) return composed
    return (
      <>
        {parts[0]}
        <span className="font-mono tabular-nums">{chip.value}</span>
        {parts[1]}
      </>
    )
  }

  const resultCountLabel =
    filteredCount === 0
      ? t("table.resultsCountNone")
      : !hasActiveFilters
        ? t("table.resultsCountAll", { total })
        : filteredCount === 1
          ? t("table.resultsCountSingular", { total })
          : t("table.resultsCount", { count: filteredCount, total })

  /* --------------------------------------------------------------- export */

  /**
   * Shows the export confirmation modal
   */
  const handleExportClick = () => {
    setShowExportModal(true)
  }

  /**
   * Exports the filtered rows from the data table to a CHIRP-compatible CSV file.
   *
   * One CSV row per FREQUENCY PAIR (primary first), so a repeater carrying both an
   * FM and a DMR pair exports both channels. The Location index runs contiguously
   * across every emitted row and the channel name gains a "-2", "-3", … suffix for
   * the extra pairs so names stay unique.
   *
   * @returns {void} This function does not return a value; it triggers a file download.
   */
  const handleChirpExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)
    // Build CHIRP CSV
    const header = [
      "Location",
      "Name",
      "Frequency",
      "Duplex",
      "Offset",
      "Tone",
      "rToneFreq",
      "cToneFreq",
      "DtcsCode",
      "DtcsPolarity",
      "Mode",
      "TStep",
      "Skip",
      "Comment",
      "URCALL",
      "RPT1CALL",
      "RPT2CALL",
    ]

    const csvEscape = (val: string) => {
      if (val == null) return ""
      const s = String(val)
      if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }

    const fmtFreq = (n: number | undefined) =>
      typeof n === "number" && Number.isFinite(n) ? n.toFixed(6) : ""

    const fmtOffset = (rx: number | undefined, tx: number | undefined) => {
      if (typeof rx !== "number" || typeof tx !== "number") return ""
      return Math.abs(tx - rx).toFixed(6)
    }

    const getDuplex = (rx: number | undefined, tx: number | undefined) => {
      if (typeof rx !== "number" || typeof tx !== "number") return ""
      if (tx > rx) return "+"
      if (tx < rx) return "-"
      return ""
    }

    const fmtToneFreq = (n: number | undefined) =>
      typeof n === "number" && n > 0 ? Number(n.toFixed(1)).toString() : ""

    const fmtMode = (m: string | undefined) => {
      if (!m) return "FM"
      const up = m.toUpperCase()
      if (["FM", "NFM", "AM"].includes(up)) return up
      return "FM"
    }

    const lines = [header.join(",")]
    let location = 0
    rows.forEach((row) => {
      const item = row as Record<string, unknown>
      const name = item?.callsign as string ?? ""
      const modes = item?.modes as string[] | undefined
      const comment = (item?.qthLocator as string) || (item?.owner as string) || ""
      exportFrequencyPairs(item).forEach((pair, pairIdx) => {
        const rx = pair.outputFrequency
        const tx = pair.inputFrequency
        const tone = pair.tone
        const fields = [
          String(++location),
          channelName(name, pairIdx),
          fmtFreq(rx),
          getDuplex(rx, tx),
          fmtOffset(rx, tx),
          tone && tone > 0 ? "Tone" : "",
          "", // rToneFreq (only for TSQL)
          fmtToneFreq(tone), // cToneFreq
          "023",
          "NN",
          fmtMode(modes?.[0]),
          "", // TStep
          "", // Skip
          comment,
          "", // URCALL
          "", // RPT1CALL
          "", // RPT2CALL
        ].map(csvEscape)
        lines.push(fields.join(","))
      })
    })

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "repetidores.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Close the modal after export
    setShowExportModal(false)
  }

  /**
   * Exports the filtered rows from the data table to an Anytone-compatible CSV file.
   *
   * One CSV row per FREQUENCY PAIR (primary first) with the No. index running
   * contiguously; channel names gain a "-2", "-3", … suffix for the extra pairs and
   * are capped at the radio's 16-character limit. The 60-column order and every
   * other field derivation are unchanged.
   *
   * @returns {void} This function does not return a value; it triggers a file download.
   */
  const handleAnytoneExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)

    // Build Anytone CSV header (60 columns)
    const header = [
      "No.",
      "Channel Name",
      "Receive Frequency",
      "Transmit Frequency",
      "Channel Type",
      "Transmit Power",
      "Band Width",
      "CTCSS/DCS Decode",
      "CTCSS/DCS Encode",
      "Contact",
      "Contact Call Type",
      "Radio ID",
      "Busy Lock/TX Permit",
      "Squelch Mode",
      "Optional Signal",
      "DTMF ID",
      "2Tone ID",
      "5Tone ID",
      "PTT ID",
      "RX Color Code",
      "Slot",
      "Scan List",
      "Receive Group List",
      "PTT Prohibit",
      "Reverse",
      "Idle TX",
      "Slot Suit",
      "AES Digital Encryption",
      "Digital Encryption",
      "Call Confirmation",
      "Talk Around(Simplex)",
      "Work Alone",
      "Custom CTCSS",
      "2TONE Decode",
      "Ranging",
      "Through Mode",
      "APRS RX",
      "Analog APRS PTT Mode",
      "Digital APRS PTT Mode",
      "APRS Report Type",
      "Digital APRS Report Channel",
      "Correct Frequency[Hz]",
      "SMS Confirmation",
      "Exclude channel from roaming",
      "DMR MODE",
      "DataACK Disable",
      "R5ToneBot",
      "R5ToneEot",
      "Auto Scan",
      "Ana Aprs Mute",
      "Send Talker Aias",
      "AnaAprsTxPath",
      "ARC4",
      "ex_emg_kind",
      "idle_tx",
      "Compand",
      "DisturEn",
      "DisturFreq",
      "Rpga_Mdc",
      "dmr_crc_ignore",
      "TxCc"
    ]

    const quoteValue = (val: string | number) => {
      return '"' + String(val).replace(/"/g, '""') + '"'
    }

    const fmtFreqAnytone = (n: number | undefined) =>
      typeof n === "number" && Number.isFinite(n) ? n.toFixed(5) : "0.00000"

    const fmtToneAnytone = (n: number | undefined) =>
      typeof n === "number" && n > 0 ? n.toFixed(1) : "Off"

    const lines = [header.map(quoteValue).join(",")]

    let channelNo = 0
    rows.forEach((row) => {
      const item = row as Record<string, unknown>
      const name = item?.callsign as string ?? ""
      const modes = item?.modes as string[] | undefined

      // Determine if this is a digital channel
      const isDigital = modes?.some(m => m.toUpperCase() === "DMR") ?? false

      exportFrequencyPairs(item).forEach((pair, pairIdx) => {
        const rx = pair.outputFrequency
        const tx = pair.inputFrequency
        const tone = pair.tone

        const fields = [
          String(++channelNo),                          // No.
          channelName(name, pairIdx, 16),               // Channel Name
          fmtFreqAnytone(rx),                          // Receive Frequency
          fmtFreqAnytone(tx),                          // Transmit Frequency
          isDigital ? "D-Digital" : "A-Analog",        // Channel Type
          "High",                                       // Transmit Power (High for both analog and digital)
          "25K",                                        // Band Width
          "Off",                                        // CTCSS/DCS Decode
          isDigital ? "Off" : fmtToneAnytone(tone),    // CTCSS/DCS Encode
          "WW",                                         // Contact
          "Group Call",                                 // Contact Call Type
          "My Radio",                                   // Radio ID
          isDigital ? "Always" : "Off",                // Busy Lock/TX Permit
          "Carrier",                                    // Squelch Mode
          "Off",                                        // Optional Signal
          "1",                                          // DTMF ID
          "1",                                          // 2Tone ID
          "1",                                          // 5Tone ID
          "Off",                                        // PTT ID
          "1",                                          // RX Color Code
          "1",                                          // Slot
          isDigital ? "Scan List 1" : "None",          // Scan List
          isDigital ? "Group List 1" : "None",         // Receive Group List
          "Off",                                        // PTT Prohibit
          "Off",                                        // Reverse
          "Off",                                        // Idle TX
          "Off",                                        // Slot Suit
          "Normal Encryption",                          // AES Digital Encryption
          "Off",                                        // Digital Encryption
          "Off",                                        // Call Confirmation
          "Off",                                        // Talk Around(Simplex)
          "Off",                                        // Work Alone
          "251.1",                                      // Custom CTCSS
          isDigital ? "1" : "0",                       // 2TONE Decode
          "Off",                                        // Ranging
          "Off",                                        // Through Mode
          "Off",                                        // APRS RX
          "Off",                                        // Analog APRS PTT Mode
          "Off",                                        // Digital APRS PTT Mode
          "Off",                                        // APRS Report Type
          "1",                                          // Digital APRS Report Channel
          "0",                                          // Correct Frequency[Hz]
          "Off",                                        // SMS Confirmation
          "0",                                          // Exclude channel from roaming
          "1",                                          // DMR MODE
          "0",                                          // DataACK Disable
          "0",                                          // R5ToneBot
          "0",                                          // R5ToneEot
          "0",                                          // Auto Scan
          "0",                                          // Ana Aprs Mute
          "0",                                          // Send Talker Aias
          "0",                                          // AnaAprsTxPath
          "0",                                          // ARC4
          "0",                                          // ex_emg_kind
          "0",                                          // idle_tx
          "0",                                          // Compand
          "0",                                          // DisturEn
          isDigital ? "13" : "0",                      // DisturFreq
          "0",                                          // Rpga_Mdc
          "0",                                          // dmr_crc_ignore
          "1"                                           // TxCc
        ].map(quoteValue)

        lines.push(fields.join(","))
      })
    })

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "repetidores-anytone.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Close the modal after export
    setShowExportModal(false)
  }

  // autoResetPageIndex is deliberately off while pagination is controlled, so a
  // page index the data can no longer fill (a deep link to ?page=99, or a dataset
  // that shrank) has to be clamped here; otherwise the empty state would cover a
  // perfectly non-empty result set.
  const pageCount = table.getPageCount()
  React.useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex > pageCount - 1) {
      table.setPageIndex(pageCount - 1)
    }
  }, [pageCount, pagination.pageIndex, table])

  React.useEffect(() => {
    if (!onFilteredDataChange) return
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)
    onFilteredDataChange(rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFilteredDataChange, columnFilters, globalFilter, data])

  /* ------------------------------------------------------ advanced filters */

  /** One compact control per filterable visible column, shown only on demand. */
  const renderAdvancedFilter = (columnId: string) => {
    const column = table.getColumn(columnId)
    if (!column) return null
    const label = t("table.toolbar.columnFilterLabel", { column: columnLabel(columnId) })

    if (
      columnId === "callsign" ||
      columnId === "owner" ||
      columnId === "qthLocator" ||
      columnId === "outputFrequency" ||
      columnId === "inputFrequency" ||
      columnId === "tone"
    ) {
      return (
        <Input
          aria-label={label}
          value={(column.getFilterValue() as string) ?? ""}
          onChange={(event) => column.setFilterValue(event.target.value || undefined)}
          className="h-8 text-xs w-full"
        />
      )
    }

    if (columnId === "band") {
      return (
        <Select
          value={(column.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            column.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger size="sm" aria-label={label} className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            <SelectItem value="2m">{t("filters.2m")}</SelectItem>
            <SelectItem value="70cm">{t("filters.70cm")}</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (columnId === "status") {
      return (
        <Select
          value={(column.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            column.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger size="sm" aria-label={label} className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            <SelectItem value="ok">{t("table.status.ok")}</SelectItem>
            <SelectItem value="prob-bad">{t("table.status.prob-bad")}</SelectItem>
            <SelectItem value="bad">{t("table.status.bad")}</SelectItem>
            <SelectItem value="unknown">{t("table.status.unknown")}</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    // The admin-set operational status, distinct from the merged community/auto
    // "status" column above. It is also reachable from the toolbar, so a shared URL
    // carrying ?opstatus= shows a control that reflects it even while this column is
    // hidden; the two controls write the same filter entry.
    if (columnId === "opStatus") {
      return (
        <Select
          value={(column.getFilterValue() as string) ?? "all"}
          onValueChange={(value) =>
            column.setFilterValue(value === "all" ? undefined : value)
          }
        >
          <SelectTrigger size="sm" aria-label={label} className="h-8 text-xs w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("filters.all")}</SelectItem>
            <SelectItem value="active">{t("table.opStatus.active")}</SelectItem>
            <SelectItem value="maintenance">{t("table.opStatus.maintenance")}</SelectItem>
            <SelectItem value="offline">{t("table.opStatus.offline")}</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (columnId === "modes") {
      const selected = (column.getFilterValue() as string[] | undefined) || []
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              aria-label={label}
              className="h-8 w-full justify-between px-2 text-xs font-normal"
            >
              <span className="truncate">
                {selected.length === 0 ? t("filters.all") : selected.join(', ')}
              </span>
              <ChevronDown className="ml-1 h-3 w-3 opacity-50" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[140px]" align="start">
            <DropdownMenuLabel className="text-xs">{t("filters.modulation")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {modeOptions.map((m) => (
              <DropdownMenuCheckboxItem
                key={m}
                checked={selected.includes(m)}
                onCheckedChange={(checked) => {
                  const current = (column.getFilterValue() as string[] | undefined) || []
                  const updated = checked
                    ? [...current, m]
                    : current.filter((v) => v !== m)
                  column.setFilterValue(updated.length > 0 ? updated : undefined)
                }}
                className="text-xs"
              >
                {m}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    return null
  }

  /* ------------------------------------------------------------ empty state */

  // "Nenhum repetidor corresponde aos filtros" is repeater copy, so it follows the
  // same opt-in as the result count: a consumer that lists something else
  // (SimplexBrowser lists simplex frequencies) keeps the domain-neutral line.
  const emptyState = (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
      <SearchX className="size-8 text-muted-foreground" aria-hidden />
      <p className="text-sm font-medium text-foreground">
        {!showResultCount
          ? t("table.noResults")
          : hasActiveFilters
            ? t("table.empty.title")
            : t("table.empty.noDataTitle")}
      </p>
      {showResultCount && (
        <p className="max-w-sm text-sm text-muted-foreground">
          {hasActiveFilters ? t("table.empty.description") : t("table.empty.noDataDescription")}
        </p>
      )}
      {hasActiveFilters && (
        <Button variant="outline" size="sm" className="mt-1" onClick={clearFilters}>
          {t("table.empty.action")}
        </Button>
      )}
    </div>
  )

  /* ------------------------------------------------------------------ rows */

  const pageRows = table.getRowModel().rows
  const visibleColumnCount = table.getVisibleLeafColumns().length

  const handleRowActivate = (row: Row<TData>, event: React.SyntheticEvent) => {
    if (!onRowClick) return
    // The favourite heart and any other nested control own their own activation.
    if (isInteractiveTarget(event.target)) return
    onRowClick(row.original)
  }

  /* Controls that need the TanStack table instance, so they cannot move into the
     shared RepeaterFilterBar: export reads the filtered row model, Colunas reads
     the leaf columns, and the advanced toggle drives a row inside <thead>. */
  const tableOnlyActions = (
    <>
        {showResultCount ? (
          <Button
            variant="outline"
            size="default"
            onClick={handleExportClick}
            aria-label={t("export.buttonCountLabel", { count: filteredCount })}
            title={t("export.buttonCountLabel", { count: filteredCount })}
          >
            <Download className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">
              {t("export.buttonCount", { count: filteredCount })}
            </span>
          </Button>
        ) : (
          <Button
            variant="outline"
            size="icon"
            onClick={handleExportClick}
            aria-label={t("filters.export")}
            title={t("filters.export")}
          >
            <Download className="h-4 w-4" aria-hidden />
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="hidden md:inline-flex"
              aria-label={t("table.visibleColumns")}
              title={t("table.visibleColumns")}
            >
              <Columns3 className="h-4 w-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t("table.visibleColumns")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map((column) => {
              if (!column.getCanHide()) return null
              const label = columnName(column)
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {label}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {advancedFiltersEnabled && (
        <Button
          variant={advancedOpen ? "default" : "outline"}
          size="icon"
          className="hidden md:inline-flex"
          onClick={() => setAdvancedOpen(!advancedOpen)}
          aria-expanded={advancedOpen}
          aria-controls={advancedRowId}
          aria-label={advancedOpen ? t("table.toolbar.advancedHide") : t("table.toolbar.advancedShow")}
          title={advancedOpen ? t("table.toolbar.advancedHide") : t("table.toolbar.advancedShow")}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden />
        </Button>
        )}
    </>
  )

  return (
    <div>
      {hideToolbar ? (
        // The shared RepeaterFilterBar is rendered by the caller above this table,
        // so only the controls that need the table instance stay here.
        <div className="mb-2 flex items-center justify-end gap-2">
          {tableOnlyActions}
        </div>
      ) : (
        /* Toolbar: the mode strip, one row of controls, then counts + active filters */
        <div className="mb-4 flex flex-col gap-2">
          {/* Mode chip strip, at every breakpoint. It leads the toolbar: picking a
              mode is the broadest cut of the list, so it reads before the narrower
              search and select controls below it. */}
          {toolbarSecondary}

          <div
            role="toolbar"
            aria-label={t("table.toolbar.label")}
            className="flex flex-wrap items-center gap-2"
          >
            {/* Global search: callsign, frequency or QTH locator. Its placeholder names
                those fields, so it only renders for a caller that supplied the matching
                filter fn. */}
            {globalFilterFn && (
            <div className="relative min-w-[12rem] flex-1">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                value={globalFilter}
                onChange={(event) => handleGlobalFilterChange(event.target.value)}
                placeholder={t("table.toolbar.search")}
                aria-label={t("table.toolbar.searchLabel")}
                className="h-9 pl-8 pr-9"
              />
              {globalFilter !== "" && (
                <button
                  type="button"
                  onClick={() => handleGlobalFilterChange("")}
                  aria-label={t("table.toolbar.searchClear")}
                  title={t("table.toolbar.searchClear")}
                  className="absolute right-0 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 motion-reduce:transition-none"
                >
                  <X className="size-4" aria-hidden />
                </button>
              )}
            </div>
            )}

            {/* Domain controls (band, status, location) */}
            {toolbar}

            <div className="ml-auto flex items-center gap-2">
              {leftActions}

              {tableOnlyActions}

              <Button
                variant="outline"
                size="icon"
                className="relative"
                onClick={clearFilters}
                aria-label={t("filters.clear")}
                title={t("filters.clear")}
              >
                <FunnelX className="h-4 w-4" aria-hidden />
                {activeFilterCount > 0 && (
                  <Badge
                    aria-hidden
                    className="pointer-events-none absolute -right-1.5 -top-1.5 min-w-4 px-1 py-0 text-[10px] leading-4 tabular-nums"
                  >
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </div>
          </div>

          {/* Result count + active filter chips */}
          <div
            className={cn(
              "flex flex-wrap items-center gap-2",
              !showResultCount && activeFilterCount === 0 && "hidden"
            )}
          >
            {showResultCount && (
              // The only status message region on the page: typing in the search box
              // filters live without moving focus, so this line is what announces
              // every filter, chip removal, clear-all and entry into the empty state.
              <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-sm tabular-nums text-muted-foreground"
              >
                {resultCountLabel}
              </span>
            )}

            {activeFilterCount > 0 && (
              <div
                role="group"
                aria-label={t("table.chips.groupLabel")}
                className="flex flex-wrap items-center gap-1.5"
              >
                {chips.map((chip) => (
                  <Badge key={chip.id} variant="secondary" className="h-8 gap-0 py-0 pl-3 pr-0">
                    <span>{renderChipText(chip)}</span>
                    {/* 32px dismiss target: the chip grows to fit it rather than the
                        button shrinking to the chip (Badge is overflow-hidden, so a
                        negative margin would clip the hit area back to 20px). */}
                    <button
                      type="button"
                      onClick={chip.onRemove}
                      aria-label={t("table.chips.remove", { label: chip.label })}
                      title={t("table.chips.remove", { label: chip.label })}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors duration-150 ease-out hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azulejo-500 motion-reduce:transition-none"
                    >
                      <X className="size-3" aria-hidden />
                    </button>
                  </Badge>
                ))}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  {t("table.chips.clearAll")}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table surface (md and up when a card list is supplied) */}
      <div
        className={cn(
          "rounded-xl border border-border bg-card overflow-hidden",
          // Rest shadow vocabulary: cool ink hue, never Tailwind's pure-black shadow-sm.
          REST_SHADOW,
          renderCardList && "hidden md:block"
        )}
        aria-busy={isLoading}
      >
        <Table
          aria-label={showResultCount ? t("table.tableLabel") : undefined}
          containerClassName="max-h-[min(70vh,44rem)] overflow-y-auto overscroll-contain"
        >
          <TableHeader sticky>
            {table.getHeaderGroups().map((headerGroup) => (
              <React.Fragment key={headerGroup.id}>
                <TableRow>
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    const label = columnLabel(header.column.id)
                    const stateSuffix =
                      sorted === "asc"
                        ? t("table.sort.ascending")
                        : sorted === "desc"
                          ? t("table.sort.descending")
                          : t("table.sort.none")
                    return (
                      <TableHead
                        key={header.id}
                        className="px-2 py-2"
                        aria-sort={
                          canSort
                            ? sorted === "asc"
                              ? "ascending"
                              : sorted === "desc"
                                ? "descending"
                                : "none"
                            : undefined
                        }
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            aria-label={`${t("table.sort.label", { column: label })}, ${stateSuffix}`}
                            className="-mx-1 inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-sm font-medium transition-colors duration-150 ease-out hover:text-azulejo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 dark:hover:text-azulejo-300 motion-reduce:transition-none"
                          >
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {sorted === "asc" ? (
                              <ArrowUp className="size-3.5 shrink-0" aria-hidden />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-3.5 shrink-0" aria-hidden />
                            ) : (
                              <ChevronsUpDown
                                className="size-3.5 shrink-0 text-muted-foreground/60"
                                aria-hidden
                              />
                            )}
                          </button>
                        ) : (
                          <span className="text-sm font-medium">
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          </span>
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>

                {/* Progressive disclosure: per-column filters, md and up, off by default */}
                {advancedOpen && (
                  <TableRow
                    id={advancedRowId}
                    key={`${headerGroup.id}-filters`}
                    className="hidden md:table-row"
                  >
                    {headerGroup.headers.map((header) => (
                      <TableHead key={`${header.id}-filter`} className="px-2 pb-2 pt-0">
                        <div className="min-w-0 font-normal">
                          {renderAdvancedFilter(header.column.id)}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              // Skeleton rows while loading
              Array.from({ length: 10 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`} className="animate-pulse motion-reduce:animate-none">
                  {table.getVisibleLeafColumns().slice(0, 8).map((column, colIdx) => (
                    <TableCell key={`skeleton-${idx}-${column.id}`}>
                      <div
                        className="h-4 rounded bg-muted"
                        style={{
                          width: colIdx === 0 ? '20px' : colIdx === 1 ? '20px' : `${40 + Math.random() * 40}%`
                        }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : pageRows.length ? (
              pageRows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={
                    onRowClick
                      ? "cursor-pointer hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-azulejo-500"
                      : undefined
                  }
                  // No role override: a <tr> may only be a `row`. Giving it
                  // role="button" would strip every <td> of its `cell` role and
                  // break cell-to-header association for screen readers. A
                  // focusable row with an accessible name and an Enter/Space
                  // handler satisfies keyboard access without that cost.
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick ? getRowLabel?.(row.original) : undefined}
                  onClick={onRowClick ? (event) => handleRowActivate(row, event) : undefined}
                  onKeyDown={
                    onRowClick
                      ? (event) => {
                          if (event.key !== "Enter" && event.key !== " ") return
                          if (isInteractiveTarget(event.target)) return
                          // Space would otherwise scroll the page.
                          event.preventDefault()
                          handleRowActivate(row, event)
                        }
                      : undefined
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                {/* Visible leaf columns, not columns.length: hidden columns would over-span. */}
                {/* whitespace-normal: TableCell's base class is whitespace-nowrap and it is
                    inherited by the whole empty-state subtree, so the description would run
                    off the edge instead of wrapping. "p-0" only overrides the padding. */}
                <TableCell colSpan={visibleColumnCount} className="p-0 whitespace-normal">
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Card list below md: same filtered, sorted and paginated rows */}
      {renderCardList && (
        <div className="md:hidden" aria-busy={isLoading}>
          {isLoading ? (
            <div className="flex flex-col gap-2.5">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div
                  key={`card-skeleton-${idx}`}
                  className="h-28 animate-pulse rounded-xl border border-border bg-card motion-reduce:animate-none"
                />
              ))}
            </div>
          ) : pageRows.length ? (
            renderCardList(pageRows.map((row) => row.original))
          ) : (
            <div className={cn("rounded-xl border border-border bg-card", REST_SHADOW)}>{emptyState}</div>
          )}
        </div>
      )}

      {pageCount > 0 && (
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-3${isLoading ? " pointer-events-none opacity-50" : ""}`}
        aria-hidden={isLoading}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("table.rowsPerPage")}</span>
          <Combobox
            ariaLabel={t("table.rowsPerPage")}
            value={table.getState().pagination.pageSize}
            onChange={(val) => {
              const size = Number(val)
              if (!Number.isNaN(size)) {
                table.setPageSize(size)
              }
            }}
            options={[
              { label: "10", value: 10 },
              { label: "20", value: 20 },
              { label: "50", value: 50 },
              { label: "100", value: 100 },
            ]}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {t("table.pageOf", {
            current: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount()
          })}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!table.getCanPreviousPage()}
                onClick={(e) => {
                  e.preventDefault()
                  table.previousPage()
                }}
              />
            </PaginationItem>
            {(() => {
              const pageCount = table.getPageCount()
              const current = table.getState().pagination.pageIndex
              const items: (number | "ellipses-left" | "ellipses-right")[] = []
              if (pageCount <= 7) {
                for (let i = 0; i < pageCount; i++) items.push(i)
              } else {
                const first = 0
                const last = pageCount - 1
                const start = Math.max(first + 1, current - 1)
                const end = Math.min(last - 1, current + 1)
                items.push(first)
                if (start > first + 1) items.push("ellipses-left")
                for (let i = start; i <= end; i++) items.push(i)
                if (end < last - 1) items.push("ellipses-right")
                items.push(last)
              }
              return items.map((it, idx) => (
                <PaginationItem key={idx}>
                  {typeof it === "number" ? (
                    <PaginationLink
                      href="#"
                      isActive={it === current}
                      onClick={(e) => {
                        e.preventDefault()
                        table.setPageIndex(it)
                      }}
                    >
                      {it + 1}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!table.getCanNextPage()}
                onClick={(e) => {
                  e.preventDefault()
                  table.nextPage()
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
      )}

      {/* Export Confirmation Modal */}
      <AlertDialog open={showExportModal} onOpenChange={setShowExportModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("export.modalTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("export.modalDescription", {
                count: filteredCount
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              {t("export.formatLabel")}
            </label>
            <Select value={exportFormat} onValueChange={(value: "chirp" | "anytone") => setExportFormat(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chirp">
                  {t("export.formatChirp")}
                </SelectItem>
                <SelectItem value="anytone">
                  {t("export.formatAnytone")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("export.cancelButton")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (exportFormat === "anytone") {
                handleAnytoneExport()
              } else {
                handleChirpExport()
              }
            }}>
              {t("export.confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* -------------------------------------------------------------- export helpers */

type ExportPair = {
  outputFrequency?: number
  inputFrequency?: number
  tone?: number
  isPrimary?: boolean
}

/**
 * Every frequency pair of a row, primary first. A row with no v2 frequencies
 * still yields one (empty) pair, so its CSV line count is unchanged.
 */
function exportFrequencyPairs(item: Record<string, unknown>): ExportPair[] {
  const frequencies = item?.frequencies as ExportPair[] | undefined
  if (!Array.isArray(frequencies) || frequencies.length === 0) return [{}]
  const primaryIdx = frequencies.findIndex((f) => f?.isPrimary)
  if (primaryIdx > 0) {
    const reordered = frequencies.slice()
    const [primary] = reordered.splice(primaryIdx, 1)
    reordered.unshift(primary)
    return reordered
  }
  return frequencies
}

/**
 * Channel name for the nth pair of a repeater: the bare callsign for the primary
 * pair, then "<callsign>-2", "-3", … so names stay unique in the radio's memory.
 * `maxLen` trims the base (never the suffix) to the radio's name-length limit.
 */
function channelName(base: string, index: number, maxLen?: number): string {
  const suffix = index === 0 ? "" : `-${index + 1}`
  if (!maxLen) return base + suffix
  return base.slice(0, Math.max(1, maxLen - suffix.length)) + suffix
}
