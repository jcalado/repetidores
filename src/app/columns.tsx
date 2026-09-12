
"use client"

import {
  CallsignText,
  DistanceText,
  FavoriteButton,
  FrequencyPairCell,
  ModeBadges,
  OwnerCell,
  StatusCell,
  ToneCell,
  getOwnerShortName,
  getPrimaryPair,
  resolveMergedStatusFromSnapshot,
} from "@/components/repeater/RepeaterCells"
import { type UserLocation } from "@/contexts/UserLocationContext"
import { calculateDistance } from "@/lib/geolocation"
import { isFavorite } from "@/lib/favorites"
import {
  matchesCallsign,
  matchesInputFrequency,
  matchesModes,
  matchesOutputFrequency,
  matchesOwner,
  matchesQthLocator,
  matchesSearch,
  matchesTone,
} from "@/lib/repeater-filters"
import { ColumnDef, FilterFn } from "@tanstack/react-table"
import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"

// Re-export RepeaterV2 as Repeater for backward compatibility
import type { RepeaterV2 } from "@/types/repeater"
export type Repeater = RepeaterV2

// Helper to get primary frequency from repeater
function getPrimaryFrequency(r: Repeater) {
  return getPrimaryPair(r)
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  if (mhz >= 1240 && mhz <= 1300) return "23cm"
  if (mhz >= 2300 && mhz <= 2450) return "13cm"
  return "Other"
}

/**
 * Toolbar search: case-insensitive match on callsign, ANY frequency pair
 * (output or input, formatted or raw), or QTH locator. Empty query matches all.
 */
export const repeaterGlobalFilter: FilterFn<Repeater> = (row, _columnId, filterValue) =>
  matchesSearch(row.original as Repeater, String(filterValue ?? ""))

type UseColumnsOptions = {
  userLocation?: UserLocation | null
  /** Called after a favourite is toggled from a row. */
  onFavoriteToggle?: (callsign: string, next: boolean) => void
}

export function useColumns(options: UseColumnsOptions = {}): ColumnDef<Repeater>[] {
  const { userLocation, onFavoriteToggle } = options
  const t = useTranslations('table.columns')
  const tFav = useTranslations('favorites')
  const tOp = useTranslations('table.opStatus')
  const tTable = useTranslations('table')

  return [
    // Favorites column
    {
      id: "favorite",
      header: () => (
        <Heart
          className="h-4 w-4 text-muted-foreground"
          aria-label={tFav("column")}
        />
      ),
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <FavoriteButton callsign={r.callsign} onToggle={onFavoriteToggle} />
      },
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        if (!value) return true
        const r = row.original as Repeater
        return isFavorite(r.callsign)
      },
      size: 36,
      minSize: 32,
      maxSize: 48,
    },
    // Operational status (admin-set). Default-hidden: the merged "status" column
    // shows it. The filter stays live for the map view and shared URLs.
    {
      id: "opStatus",
      header: t("opStatus.header"),
      accessorKey: "status",
      cell: ({ row }) => {
        const r = row.original as Repeater
        if (!r.status || r.status === "unknown") return null
        return <span className="text-xs text-muted-foreground">{tOp(r.status)}</span>
      },
      enableSorting: false,
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        if (!value) return true
        const r = row.original as Repeater
        // Handle array of values (multi-select)
        if (Array.isArray(value)) {
          return value.includes(r.status ?? 'unknown')
        }
        return r.status === value
      },
      size: 36,
      minSize: 32,
      maxSize: 48,
    },
    // Merged status: auto-check > admin-set > community votes (spec item 7)
    {
      id: "status",
      header: t("status"),
      cell: ({ row }) => {
        const r = row.original as Repeater
        // Label only. The source, auto-check list, timestamp and vote counts are
        // all still there, in the tooltip and in the cell's sr-only text, so
        // staleness stays available without two lines of prose on every row.
        return <StatusCell repeater={r} />
      },
      enableSorting: false,
      enableColumnFilter: true,
      // The four legacy filter values still apply; each now covers its merged
      // bucket, which preserves the old "bad also matches admin offline" case.
      filterFn: (row, _id, value) => {
        if (!value) return true
        const r = row.original as Repeater
        return resolveMergedStatusFromSnapshot(r).filterValue === value
      },
      size: 120,
      minSize: 84,
    },
    // Distance column - only shown when user location is available
    ...(userLocation
      ? [
          {
            id: "distance",
            header: t("distance"),
            accessorFn: (row: Repeater) => {
              if (!userLocation) return Infinity
              return calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                row.latitude,
                row.longitude
              )
            },
            cell: ({ getValue }: { getValue: () => number }) => {
              const distance = getValue()
              return <DistanceText km={Number.isFinite(distance) ? distance : null} />
            },
            sortingFn: "basic",
            enableColumnFilter: false,
          } as ColumnDef<Repeater>,
        ]
      : []),
    {
      accessorKey: "callsign",
      header: t("callsign"),
      cell: ({ getValue }) => <CallsignText callsign={String(getValue() ?? "")} />,
      filterFn: (row, _id, value) =>
        matchesCallsign(row.original as Repeater, String(value ?? "")),
    },
    {
      id: "band",
      header: t("band"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary ? getBandFromFrequency(primary.outputFrequency) : "Other"
      },
      // ITU band codes (2m, 70cm, ...) render as-is; only the catch-all bucket
      // needs translating. The accessor value stays untouched so the band filter,
      // which compares against this exact casing, cannot break.
      cell: ({ getValue }) => {
        const band = String(getValue() ?? "")
        if (band !== "Other") return band
        // TODO(i18n): `table.bands.other` is not in pt.json yet (owner "i18n").
        // Until it lands, fall back to the raw value rather than a raw key path.
        return tTable.has("bands.other") ? tTable("bands.other") : band
      },
      // Simple equality filter for exact band match
      filterFn: (row, id, value) => {
        if (!value) return true
        return row.getValue<string>(id) === value
      },
      enableSorting: false,
    },
    {
      id: "outputFrequency",
      header: t("outputFrequency"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary?.outputFrequency ?? 0
      },
      // The "+N" affordance rides on the output column only: one per row.
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <FrequencyPairCell repeater={r} variant="output" />
      },
      // Matches ANY pair, not just the primary one.
      filterFn: (row, _id, value) =>
        matchesOutputFrequency(row.original as Repeater, String(value ?? "")),
    },
    {
      id: "inputFrequency",
      header: t("inputFrequency"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary?.inputFrequency ?? 0
      },
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <FrequencyPairCell repeater={r} variant="input" showExtraCount={false} />
      },
      filterFn: (row, _id, value) =>
        matchesInputFrequency(row.original as Repeater, String(value ?? "")),
    },
    {
      id: "tone",
      header: t("tone"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary?.tone ?? 0
      },
      cell: ({ getValue }) => <ToneCell tone={getValue() as number} />,
      filterFn: (row, _id, value) =>
        matchesTone(row.original as Repeater, String(value ?? "")),
    },
    {
      id: "modes",
      header: t("modulation"),
      accessorFn: (row) => row.modes.join(', '),
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <ModeBadges repeater={r} />
      },
      // Filter by modes array - supports multi-select
      // Also handles EchoLink and AllStar which are stored as separate fields
      filterFn: (row, _id, value) => {
        if (!value) return true
        const selected = Array.isArray(value) ? value.map(String) : [String(value)]
        return matchesModes(row.original as Repeater, selected)
      },
    },
    {
      accessorKey: "latitude",
      header: t("latitude"),
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{String(getValue() ?? "")}</span>
      ),
    },
    {
      accessorKey: "longitude",
      header: t("longitude"),
      cell: ({ getValue }) => (
        <span className="font-mono tabular-nums">{String(getValue() ?? "")}</span>
      ),
    },
    {
      id: "qthLocator",
      accessorKey: "qthLocator",
      header: t("qthLocator"),
      cell: ({ getValue }) => (
        <span className="font-mono">{String(getValue() ?? "")}</span>
      ),
      filterFn: (row, _id, value) =>
        matchesQthLocator(row.original as Repeater, String(value ?? "")),
    },
    {
      accessorKey: "owner",
      header: t("owner"),
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <OwnerCell repeater={r} />
      },
      filterFn: (row, _id, value) =>
        matchesOwner(row.original as Repeater, String(value ?? ""), getOwnerShort),
    },
  ]
}

// Keep the old export for backward compatibility, but it will be replaced
export const columns: ColumnDef<Repeater>[] = []

/**
 * Owner name shortener. The table (columns.tsx), the map view and the search
 * surfaces all import it from here; the lookup itself lives in RepeaterCells
 * so the shared owner cell and these filters can never disagree.
 */
export function getOwnerShort(name: string): string {
  return getOwnerShortName(name)
}
