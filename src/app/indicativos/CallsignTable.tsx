"use client"

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import type { Callsign } from "@/types/callsign"
import { callsignColumns } from "./columns"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react"

interface CallsignTableProps {
  data: Callsign[]
  loading: boolean
  page: number
  totalPages: number
  totalDocs: number
  onPageChange: (page: number) => void
  onClearFilters?: () => void
}

export function CallsignTable({
  data,
  loading,
  page,
  totalPages,
  totalDocs,
  onPageChange,
  onClearFilters,
}: CallsignTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns: callsignColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="space-y-3">
      {/* Table */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="font-semibold text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <div className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" && " ↑"}
                      {header.column.getIsSorted() === "desc" && " ↓"}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {callsignColumns.map((_, j) => (
                    <TableCell key={j}>
                      <div
                        className="h-4 bg-muted rounded animate-pulse"
                        style={{ width: `${60 + ((i * 7 + j * 13) % 40)}%`, animationDelay: `${i * 30}ms` }}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={callsignColumns.length} className="text-center py-12">
                  <div className="text-muted-foreground">
                    Nenhum indicativo encontrado para os filtros selecionados.
                  </div>
                  {onClearFilters && (
                    <button
                      onClick={onClearFilters}
                      className="mt-2 text-sm text-azulejo-600 dark:text-azulejo-400 hover:underline"
                    >
                      Limpar filtros
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="hover:bg-accent transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {loading ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              A carregar...
            </span>
          ) : (
            `${totalDocs.toLocaleString("pt-PT")} registos · Página ${page} de ${totalPages}`
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
          >
            Seguinte
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
