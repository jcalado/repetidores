"use client"

import { Badge } from "@/components/ui/badge"
import type { Callsign } from "@/types/callsign"
import { ColumnDef } from "@tanstack/react-table"

function EstadoBadge({ estado }: { estado: string }) {
  const normalized = estado?.toLowerCase() || ""

  let className = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"

  if (normalized === "activo" || normalized === "active") {
    className = "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400"
  } else if (normalized === "suspenso" || normalized === "suspended") {
    className = "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400"
  } else if (normalized === "anulado" || normalized === "cancelled" || normalized === "cancelado") {
    className = "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400"
  }

  return (
    <Badge variant="outline" className={className}>
      {estado || "—"}
    </Badge>
  )
}

function CategoriaBadge({ categoria }: { categoria: string }) {
  if (!categoria) return <span className="text-slate-400">—</span>

  return (
    <Badge variant="secondary" className="font-normal">
      {categoria}
    </Badge>
  )
}

export const callsignColumns: ColumnDef<Callsign>[] = [
  {
    accessorKey: "indicativo",
    header: "Indicativo",
    cell: ({ row }) => (
      <span className="font-mono font-semibold text-ship-cove-700 dark:text-ship-cove-400">
        {row.getValue("indicativo")}
      </span>
    ),
  },
  {
    accessorKey: "nome",
    header: "Nome",
    cell: ({ row }) => {
      const nome = row.getValue("nome") as string
      return (
        <span className="truncate max-w-[200px] block" title={nome}>
          {nome || "—"}
        </span>
      )
    },
  },
  {
    accessorKey: "categoria",
    header: "Categoria",
    cell: ({ row }) => <CategoriaBadge categoria={row.getValue("categoria")} />,
  },
  {
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => <EstadoBadge estado={row.getValue("estado")} />,
  },
  {
    accessorKey: "distrito",
    header: "Distrito",
    cell: ({ row }) => (
      <span className="text-slate-600 dark:text-slate-300">
        {row.getValue("distrito") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "concelho",
    header: "Concelho",
    cell: ({ row }) => (
      <span className="text-slate-600 dark:text-slate-300">
        {row.getValue("concelho") || "—"}
      </span>
    ),
  },
  {
    accessorKey: "localidade",
    header: "Localidade",
    cell: ({ row }) => (
      <span className="text-slate-600 dark:text-slate-300">
        {row.getValue("localidade") || "—"}
      </span>
    ),
  },
]
