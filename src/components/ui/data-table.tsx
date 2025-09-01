
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      latitude: false,
      longitude: false,
    })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
  })

  return (
    <div>
      <div className="flex items-center gap-4 py-4 flex-wrap">
        <Input
          placeholder="Filter by callsign..."
          value={(table.getColumn("callsign")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("callsign")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="band" className="text-sm text-muted-foreground">
            Band
          </label>
          <select
            id="band"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={(table.getColumn("band")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table
                .getColumn("band")
                ?.setFilterValue(e.target.value || undefined)
            }
          >
            <option value="">All</option>
            <option value="6m">6m</option>
            <option value="2m">2m</option>
            <option value="70cm">70cm</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Columns:</span>
          {table.getAllLeafColumns().map((column) => {
            if (!column.getCanHide()) return null
            return (
              <label
                key={column.id}
                className="flex items-center gap-1 text-sm"
                title={String(column.columnDef.header ?? column.id)}
              >
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={column.getIsVisible()}
                  onChange={(e) => column.toggleVisibility(e.target.checked)}
                />
                <span>
                  {typeof column.columnDef.header === "string"
                    ? column.columnDef.header
                    : column.id}
                </span>
              </label>
            )
          })}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
