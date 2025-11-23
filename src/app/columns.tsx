
"use client"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { getVoteStats, type VoteStats } from "@/lib/votes"
import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from "next-intl"
import * as React from "react"

export type Repeater = {
  callsign: string
  outputFrequency: number
  inputFrequency: number
  tone: number
  modulation: string
  latitude: number
  longitude: number
  qth_locator: string
  owner: string
  dmr: boolean
  dstar: boolean
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  return "Other"
}

export function useColumns(): ColumnDef<Repeater>[] {
  const t = useTranslations('table.columns')

  return [
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
        return cat === value
      },
      size: 36,
      minSize: 32,
      maxSize: 48,
    },
    {
      accessorKey: "callsign",
      header: t("callsign"),
    },
    {
      id: "band",
      header: t("band"),
      accessorFn: (row) => getBandFromFrequency(row.outputFrequency),
      // Simple equality filter for exact band match
      filterFn: (row, id, value) => {
        if (!value) return true
        return row.getValue<string>(id) === value
      },
      enableSorting: false,
    },
    {
      accessorKey: "outputFrequency",
      header: t("outputFrequency"),
      cell: ({ getValue }) => {
        const value = getValue() as number
        return value?.toFixed(3) ?? ""
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
      accessorKey: "inputFrequency",
      header: t("inputFrequency"),
      cell: ({ getValue }) => {
        const value = getValue() as number
        return value?.toFixed(3) ?? ""
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
      accessorKey: "tone",
      header: t("tone"),
      cell: ({ getValue }) => {
        const value = getValue() as number
        return value?.toFixed(1) ?? ""
      },
      filterFn: (row, id, value) => {
        if (!value) return true
        const numValue = row.getValue<number>(id)
        if (numValue == null) return false
        const formattedValue = numValue.toFixed(1)
        const rawValue = numValue.toString()
        return formattedValue.includes(value) || rawValue.includes(value)
      },
    },
    {
      accessorKey: "modulation",
      header: t("modulation"),
      // Supports both single value and array of values (case-insensitive)
      filterFn: (row, id, value) => {
        if (!value) return true
        const cell = String(row.getValue<string>(id) ?? "").toLowerCase()
        const r = row.original as Repeater
        
        // Handle array of values (multi-select)
        if (Array.isArray(value)) {
          return value.some(v => {
            const filterVal = String(v).toLowerCase()
            if (filterVal === 'dmr' && r.dmr) return true
            if (filterVal === 'd-star' && r.dstar) return true
            return filterVal === cell
          })
        }
        
        // Handle single value (backward compatibility)
        const v = String(value).toLowerCase()
        if (v === 'dmr' && r.dmr) return true
        if (v === 'd-star' && r.dstar) return true
        return cell === v
      },
    },
    // {
    //   accessorKey: "dmr",
    //   header: t("dmr"),
    //   cell: ({ getValue }) => (Boolean(getValue()) ? "✓" : "—"),
    //   filterFn: (row, id, value) => {
    //     if (value === undefined || value === null) return true
    //     const expected = Boolean(value)
    //     return Boolean(row.getValue(id)) === expected
    //   },
    //   enableSorting: false,
    // },
    // {
    //   accessorKey: "dstar",
    //   header: t("dstar"),
    //   cell: ({ getValue }) => (Boolean(getValue()) ? "✓" : "—"),
    //   filterFn: (row, id, value) => {
    //     if (value === undefined || value === null) return true
    //     const expected = Boolean(value)
    //     return Boolean(row.getValue(id)) === expected
    //   },
    //   enableSorting: false,
    // },
    {
      accessorKey: "latitude",
      header: t("latitude"),
    },
    {
      accessorKey: "longitude",
      header: t("longitude"),
    },
    {
      accessorKey: "qth_locator",
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
      cell: ({ getValue }) => {
        const full = String(getValue() ?? "")
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
      // Match on full name or short name
      filterFn: (row, id, value) => {
        if (!value) return true
        const q = String(value).toLowerCase()
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
