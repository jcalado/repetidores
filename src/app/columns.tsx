
"use client"

import { ColumnDef } from "@tanstack/react-table"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"

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

export const columns: ColumnDef<Repeater>[] = [
  {
    accessorKey: "callsign",
    header: "Callsign",
  },
  {
    id: "band",
    header: "Band",
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
    header: "Output Freq.",
  },
  {
    accessorKey: "inputFrequency",
    header: "Input Freq.",
  },
  {
    accessorKey: "tone",
    header: "Tone",
  },
  {
    accessorKey: "modulation",
    header: "Modulation",
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
    header: "Latitude",
  },
  {
    accessorKey: "longitude",
    header: "Longitude",
  },
  {
    accessorKey: "qth_locator",
    header: "QTH Locator",
    // Substring match, case-insensitive
    filterFn: (row, id, value) => {
      if (!value) return true
      const q = String(value).toLowerCase()
      return String(row.getValue<string>(id) ?? "").toLowerCase().includes(q)
    },
  },
  {
    accessorKey: "owner",
    header: "Owner",
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
