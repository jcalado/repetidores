
"use client"

import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { ColumnDef } from "@tanstack/react-table"
import { useTranslations } from "next-intl"

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
      // Exact match filter when a value is provided (case-insensitive)
      filterFn: (row, id, value) => {
        if (!value) return true
        const v = String(value).toLowerCase()
        const cell = String(row.getValue<string>(id) ?? "").toLowerCase()
        return cell === v
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
