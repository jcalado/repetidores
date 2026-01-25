
"use client"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type UserLocation } from "@/contexts/UserLocationContext"
import { calculateDistance, formatDistance } from "@/lib/geolocation"
import { toggleFavorite, isFavorite } from "@/lib/favorites"
import { getVoteStats, type VoteStats } from "@/lib/votes"
import { ColumnDef } from "@tanstack/react-table"
import { Heart } from "lucide-react"
import { useTranslations } from "next-intl"
import Link from "next/link"
import * as React from "react"

// Re-export RepeaterV2 as Repeater for backward compatibility
import type { RepeaterV2 } from "@/types/repeater"
export type Repeater = RepeaterV2

// Helper to get primary frequency from repeater
function getPrimaryFrequency(r: Repeater) {
  if (!r.frequencies || r.frequencies.length === 0) return null
  return r.frequencies.find(f => f.isPrimary) || r.frequencies[0]
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  if (mhz >= 1240 && mhz <= 1300) return "23cm"
  if (mhz >= 2300 && mhz <= 2450) return "13cm"
  return "Other"
}

type UseColumnsOptions = {
  userLocation?: UserLocation | null
  onFavoriteToggle?: () => void
}

export function useColumns(options: UseColumnsOptions = {}): ColumnDef<Repeater>[] {
  const { userLocation, onFavoriteToggle } = options
  const t = useTranslations('table.columns')
  const tFav = useTranslations('favorites')

  return [
    // Favorites column
    {
      id: "favorite",
      header: tFav("column"),
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <FavoriteCell callsign={r.callsign} onToggle={onFavoriteToggle} />
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
    {
      id: "status",
      header: t("status"),
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <StatusCell repeaterId={r.callsign} />
      },
      enableSorting: false,
      enableColumnFilter: true,
      // Filter by community status category
      filterFn: (row, _id, value) => {
        if (!value) return true
        const r = row.original as Repeater
        const s = voteCache.get(r.callsign)
        const cat = s?.category ?? "unknown"
        // If filtering for "bad" (Não funciona), also include repeaters with offline operational status
        if (value === "bad" && r.status === "offline") return true
        return cat === value
      },
      size: 36,
      minSize: 32,
      maxSize: 48,
    },
    // Operational status (admin-set)
    {
      id: "opStatus",
      header: t("opStatus.header"),
      accessorKey: "status",
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <OperationalStatusCell status={r.status} />
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
              if (distance === Infinity) return "—"
              return formatDistance(distance)
            },
            sortingFn: "basic",
            enableColumnFilter: false,
          } as ColumnDef<Repeater>,
        ]
      : []),
    {
      accessorKey: "callsign",
      header: t("callsign"),
    },
    {
      id: "band",
      header: t("band"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary ? getBandFromFrequency(primary.outputFrequency) : "Other"
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
      cell: ({ getValue }) => {
        const value = getValue() as number
        return value ? value.toFixed(3) : ""
      },
      filterFn: (row, id, value) => {
        if (!value) return true
        const numValue = row.getValue<number>(id)
        if (numValue == null) return false
        const formattedValue = numValue.toFixed(3)
        const rawValue = numValue.toString()
        return formattedValue.includes(value) || rawValue.includes(value)
      },
    },
    {
      id: "inputFrequency",
      header: t("inputFrequency"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary?.inputFrequency ?? 0
      },
      cell: ({ getValue }) => {
        const value = getValue() as number
        return value ? value.toFixed(3) : ""
      },
      filterFn: (row, id, value) => {
        if (!value) return true
        const numValue = row.getValue<number>(id)
        if (numValue == null) return false
        const formattedValue = numValue.toFixed(3)
        const rawValue = numValue.toString()
        return formattedValue.includes(value) || rawValue.includes(value)
      },
    },
    {
      id: "tone",
      header: t("tone"),
      accessorFn: (row) => {
        const primary = getPrimaryFrequency(row)
        return primary?.tone ?? 0
      },
      cell: ({ getValue }) => {
        const value = getValue() as number
        return value ? value.toFixed(1) : ""
      },
      filterFn: (row, id, value) => {
        if (!value) return true
        const numValue = row.getValue<number>(id)
        if (numValue == null || numValue === 0) return false
        const formattedValue = numValue.toFixed(1)
        const rawValue = numValue.toString()
        return formattedValue.includes(value) || rawValue.includes(value)
      },
    },
    {
      id: "modes",
      header: t("modulation"),
      accessorFn: (row) => row.modes.join(', '),
      cell: ({ row }) => {
        const r = row.original as Repeater
        return <ModesCell modes={r.modes} />
      },
      // Filter by modes array - supports multi-select
      filterFn: (row, _id, value) => {
        if (!value) return true
        const r = row.original as Repeater
        const modes = r.modes || []

        // Handle array of values (multi-select)
        if (Array.isArray(value)) {
          return value.some(v => {
            const filterVal = String(v).toUpperCase()
            // Normalize filter values to match modes array
            if (filterVal === 'D-STAR') return modes.includes('DSTAR')
            return modes.includes(filterVal as typeof modes[number])
          })
        }

        // Handle single value
        const v = String(value).toUpperCase()
        if (v === 'D-STAR') return modes.includes('DSTAR')
        return modes.includes(v as typeof modes[number])
      },
    },
    {
      accessorKey: "latitude",
      header: t("latitude"),
    },
    {
      accessorKey: "longitude",
      header: t("longitude"),
    },
    {
      id: "qthLocator",
      accessorKey: "qthLocator",
      header: t("qthLocator"),
      // Substring match, case-insensitive
      filterFn: (row, id, value) => {
        if (!value) return true
        const q = String(value).toLowerCase()
        return String(row.getValue<string>(id) ?? "").toLowerCase().includes(q)
      },
    },
    {
      accessorKey: "owner",
      header: t("owner"),
      cell: ({ row }) => {
        const r = row.original as Repeater

        // If association is populated, link to association page
        if (r.association) {
          return (
            <Link
              href={`/association/${r.association.slug}/`}
              className="text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {r.association.abbreviation}
            </Link>
          )
        }

        // Fallback to owner string with abbreviation
        const full = String(r.owner ?? "")
        const short = getOwnerShort(full)
        if (!full) return null
        if (short === full) return <span>{full}</span>
        return (
          <HoverCard>
            <HoverCardTrigger asChild>
              <span className="cursor-help underline decoration-dotted">
                {short}
              </span>
            </HoverCardTrigger>
            <HoverCardContent>
              <div className="text-sm">{full}</div>
            </HoverCardContent>
          </HoverCard>
        )
      },
      // Match on full name, short name, or association abbreviation/name
      filterFn: (row, id, value) => {
        if (!value) return true
        const q = String(value).toLowerCase()
        const r = row.original as Repeater

        // Check association fields
        if (r.association) {
          if (r.association.abbreviation.toLowerCase().includes(q)) return true
          if (r.association.name.toLowerCase().includes(q)) return true
        }

        // Fall back to owner string
        const full = String(row.getValue<string>(id) ?? "")
        const short = getOwnerShort(full)
        return (
          full.toLowerCase().includes(q) || short.toLowerCase().includes(q)
        )
      },
    },
  ]
}

// Keep the old export for backward compatibility, but it will be replaced
export const columns: ColumnDef<Repeater>[] = []

// Known owner name shorteners
const OWNER_SHORTNAMES: Record<string, string> = {
  "associação de radioamadores marienses": "ARM",
  "associação de radioamadores da beira alta": "ARBA",
  "associação de radioamadores da beira baixa": "ARBB",
  "associação de radioamadores da beira litoral": "ARBL",
  "associação de radioamadores da costa de prata": "ARCP",
  "associação de radioamadores da linha de cascais": "ARLC",
  "associação de radioamadores da região de lisboa": "ARRLX",
  "liga amadores rádio sintra": "LARS",
  "liga de amadores de rádio transmissões": "LART",
  "rede dos emissores portugueses": "REP",
  "tertúlia radioamadorística guglielmo marconi": "TRGM",
  "união de radioamadores dos açores": "URAA",
  "associação de radioamadores entre tâmega e douro": "ARTD",
  "associação de radioamadores dos açores": "ARAA",
  "associação dos radioamadores da praia da vitória": "ARPV",
  "associação amigos da rádio do norte": "AARN",
  "arsul - associação de radioamadores do sul": "ARSUL",
  "associação de radioamadores da vila de moscavide": "ARVM",
  "associação de radioamadores do distrito de leiria": "ARDL",
  "associação de radioamadores do litoral alentejano": "ARLA",
  "associação de radioamadores do oeste": "ARADO"
}

function normalizeOwner(name: string) {
  return name.trim().toLowerCase()
}

export function getOwnerShort(name: string): string {
  const key = normalizeOwner(name)
  return OWNER_SHORTNAMES[key] ?? name
}

// ---- Modes Cell ----
function ModesCell({ modes }: { modes: Repeater['modes'] }) {
  if (!modes || modes.length === 0) return null

  // Display mode badges
  return (
    <div className="flex flex-wrap gap-1">
      {modes.map(mode => (
        <span
          key={mode}
          className={cn(
            "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
            mode === 'FM' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            mode === 'DMR' && "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            mode === 'DSTAR' && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            mode === 'C4FM' && "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            mode === 'TETRA' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            mode === 'Digipeater' && "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
          )}
        >
          {mode === 'DSTAR' ? 'D-STAR' : mode}
        </span>
      ))}
    </div>
  )
}

// ---- Status Icon (community votes) ----
const voteCache = new Map<string, VoteStats>()
const inFlight = new Map<string, Promise<VoteStats>>()

function useVoteStats(repeaterId: string) {
  const [stats, setStats] = React.useState<VoteStats | undefined>(() => voteCache.get(repeaterId))

  React.useEffect(() => {
    let alive = true
    if (!repeaterId) return
    const cached = voteCache.get(repeaterId)
    if (cached) {
      setStats(cached)
      return
    }
    let p = inFlight.get(repeaterId)
    if (!p) {
      p = getVoteStats(repeaterId)
      inFlight.set(repeaterId, p)
    }
    p
      .then((s) => {
        voteCache.set(repeaterId, s)
        if (alive) setStats(s)
      })
      .finally(() => {
        inFlight.delete(repeaterId)
      })
    return () => {
      alive = false
    }
  }, [repeaterId])

  return stats
}

function StatusCell({ repeaterId }: { repeaterId: string }) {
  const stats = useVoteStats(repeaterId)
  const t = useTranslations('table')
  const category = stats?.category ?? 'unknown'
  const cfg = statusStyle(category)
  const label = t(`status.${category}` as const)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          title={label}
          className={cn(
            "inline-block h-2.5 w-2.5 rounded-full",
            cfg.dotClass
          )}
        />
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <span className={cn("inline-block h-2.5 w-2.5 rounded-full", cfg.dotClass)} />
          <span>{label}</span>
        </div>
        {stats && (
          <div className="mt-1 text-xs opacity-80">Up {stats.up} · Down {stats.down}</div>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

function statusStyle(category: VoteStats["category"]) {
  switch (category) {
    case "ok":
      return { dotClass: "bg-emerald-500" }
    case "prob-bad":
      return { dotClass: "bg-amber-500" }
    case "bad":
      return { dotClass: "bg-red-500" }
    default:
      return { dotClass: "bg-gray-400 dark:bg-gray-500" }
  }
}

// ---- Operational Status Cell ----
function OperationalStatusCell({ status }: { status?: Repeater['status'] }) {
  const t = useTranslations('table')

  if (!status || status === 'unknown') {
    return null
  }

  const config = {
    active: { dotClass: "bg-emerald-500", icon: "●" },
    maintenance: { dotClass: "bg-amber-500", icon: "◐" },
    offline: { dotClass: "bg-red-500", icon: "○" },
  } as const

  const cfg = config[status as keyof typeof config]
  if (!cfg) return null

  const label = t(`opStatus.${status}` as const)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className={cn(
            "inline-flex items-center justify-center h-5 w-5 rounded text-[10px] font-bold",
            status === 'active' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            status === 'maintenance' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            status === 'offline' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          )}
        >
          {status === 'active' ? '✓' : status === 'maintenance' ? '!' : '✕'}
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

// ---- Favorites Icon ----
function FavoriteCell({ callsign, onToggle }: { callsign: string; onToggle?: () => void }) {
  const [favorite, setFavorite] = React.useState(() => isFavorite(callsign))
  const t = useTranslations('favorites')

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent row click
    const newState = toggleFavorite(callsign)
    setFavorite(newState)
    onToggle?.()
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={handleClick}
          className="rounded p-0.5 hover:bg-accent"
          aria-label={favorite ? t('remove') : t('add')}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-colors",
              favorite
                ? "fill-red-500 text-red-500"
                : "text-muted-foreground hover:text-red-400"
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        {favorite ? t('remove') : t('add')}
      </TooltipContent>
    </Tooltip>
  )
}
