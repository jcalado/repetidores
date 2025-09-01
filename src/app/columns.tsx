
"use client"

import { ColumnDef } from "@tanstack/react-table"

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
  },
  {
    accessorKey: "owner",
    header: "Owner",
  },
]
