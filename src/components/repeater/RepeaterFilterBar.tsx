"use client"

// The one filter bar. Both the table and the map render this component, so the
// two views present the same controls in the same order, and (since RepeaterView
// now filters both through applyRepeaterFilters) those controls mean the same
// thing in both places.
//
// It is purely presentational: every value and setter arrives as a prop, derived
// once by the caller from useRepeaterFilters. Nothing here touches a TanStack
// table instance, which is what lets the map render it at all.

import * as React from "react"
import { FunnelX, Search, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export interface RepeaterFilterChip {
  /** Stable id, used as React key. */
  id: string
  /** Already-translated label, e.g. t("table.chips.band"). */
  label: string
  /** Already-translated value segment. Omit for label-only chips (favourites). */
  value?: string
  /** Render the value in Geist Mono (the Callsign Rule). */
  mono?: boolean
  onRemove: () => void
}

/** Chips whose value is a callsign, frequency, tone, locator or distance, and so
 *  renders in Geist Mono. */
export const MONO_CHIP_IDS = new Set([
  "search",
  "callsign",
  "qthLocator",
  "outputFrequency",
  "inputFrequency",
  "tone",
  "distance",
])

/** Marker swapped into the translated "{label}: {value}" template so the value
 *  segment can be styled without hardcoding the template's punctuation here. */
const CHIP_VALUE_SENTINEL = "\uE000"

export interface RepeaterFilterBarProps {
  /** Omit to hide the search box (a surface with no free-text search). */
  search?: { value: string; onChange: (value: string) => void }
  /** Full-width row above the controls: the mode chip strip. */
  modeStrip?: React.ReactNode
  /** Band / status / operational status / location controls. */
  domainControls?: React.ReactNode
  /** Pinned left of the right-hand cluster: favourites toggle, submit dialog. */
  leadingActions?: React.ReactNode
  /** Controls that only make sense for a table: export, Colunas, per-column row. */
  tableActions?: React.ReactNode
  chips: RepeaterFilterChip[]
  onClearFilters: () => void
  /** Omit to hide the count line. */
  resultCountLabel?: string
}

export default function RepeaterFilterBar({
  search,
  modeStrip,
  domainControls,
  leadingActions,
  tableActions,
  chips,
  onClearFilters,
  resultCountLabel,
}: RepeaterFilterBarProps) {
  const t = useTranslations()
  const activeFilterCount = chips.length

  /**
   * The visible body of a chip. Values that are identifiers render in Geist Mono,
   * so the translated "{label}: {value}" template is split around its value
   * segment instead of being composed here: the punctuation and the word order
   * stay in pt.json.
   */
  const renderChipText = (chip: RepeaterFilterChip): React.ReactNode => {
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

  return (
    <div className="mb-4 flex flex-col gap-2">
      {/* Mode chip strip leads: picking a mode is the broadest cut of the list, so
          it reads before the narrower search and select controls below it. */}
      {modeStrip}

      <div
        role="toolbar"
        aria-label={t("table.toolbar.label")}
        className="flex flex-wrap items-center gap-2"
      >
        {search && (
          <div className="relative min-w-[12rem] flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search.value}
              onChange={(event) => search.onChange(event.target.value)}
              placeholder={t("table.toolbar.search")}
              aria-label={t("table.toolbar.searchLabel")}
              className="h-9 pl-8 pr-9"
            />
            {search.value !== "" && (
              <button
                type="button"
                onClick={() => search.onChange("")}
                aria-label={t("table.toolbar.searchClear")}
                title={t("table.toolbar.searchClear")}
                className="absolute right-0 top-1/2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 ease-out hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 motion-reduce:transition-none"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
          </div>
        )}

        {domainControls}

        <div className="ml-auto flex items-center gap-2">
          {leadingActions}
          {tableActions}

          <Button
            variant="outline"
            size="icon"
            className="relative"
            onClick={onClearFilters}
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
          resultCountLabel === undefined && activeFilterCount === 0 && "hidden"
        )}
      >
        {resultCountLabel !== undefined && (
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
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              {t("table.chips.clearAll")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
