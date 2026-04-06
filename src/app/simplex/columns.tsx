"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { SimplexFrequency } from "@/types/simplex-frequency"
import { useTranslations } from "next-intl"

const MODE_COLORS: Record<string, string> = {
  FM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DMR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "D-STAR": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  C4FM: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-gray-100 text-gray-500 dark:bg-gray-800/30 dark:text-gray-400",
}

export function useSimplexColumns(): ColumnDef<SimplexFrequency>[] {
  const t = useTranslations("simplex")
  return [
    {
      accessorKey: "frequency",
      header: t("frequency"),
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.frequency.toFixed(4)} MHz</span>,
      enableColumnFilter: false,
    },
    {
      accessorKey: "municipality",
      header: t("municipality"),
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "district",
      header: t("district"),
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        if (!value || value.length === 0) return true
        return value.includes(row.original.district)
      },
    },
    {
      accessorKey: "mode",
      header: t("mode"),
      cell: ({ row }) => {
        const mode = row.original.mode
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MODE_COLORS[mode] || ""}`}>{mode}</span>
      },
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        if (!value || value.length === 0) return true
        return value.includes(row.original.mode)
      },
    },
    {
      accessorKey: "tone",
      header: t("tone"),
      cell: ({ row }) => {
        const tone = row.original.tone
        return tone ? <span className="font-mono">{tone} Hz</span> : <span className="text-muted-foreground">&mdash;</span>
      },
      enableColumnFilter: false,
    },
    {
      accessorKey: "band",
      header: t("band"),
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        if (!value || value.length === 0) return true
        return value.includes(row.original.band)
      },
    },
    {
      accessorKey: "status",
      header: t("status"),
      cell: ({ row }) => {
        const status = row.original.status
        return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || ""}`}>{status === "active" ? t("active") : t("inactive")}</span>
      },
      enableColumnFilter: true,
      filterFn: (row, _id, value) => {
        if (!value || value.length === 0) return true
        return value.includes(row.original.status)
      },
    },
  ]
}
