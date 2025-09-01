
"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  PaginationState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Combobox } from "@/components/ui/combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onFilteredDataChange?: (rows: TData[]) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onFilteredDataChange,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([])
  const columnFilters = columnFiltersProp ?? internalColumnFilters
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      latitude: false,
      longitude: false,
    })
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination,
    },
  })

  const modulationOptions = React.useMemo(() => {
    const set = new Set<string>()
    ;(data as any[]).forEach((d) => {
      const v = d?.modulation
      if (v && typeof v === "string") set.add(v)
    })
    return Array.from(set).sort()
  }, [data])

  React.useEffect(() => {
    if (!onFilteredDataChange) return
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)
    onFilteredDataChange(rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFilteredDataChange, columnFilters, data])

  return (
    <div>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
        <Input
          placeholder="Filtrar por indicativo..."
          value={(table.getColumn("callsign")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("callsign")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Input
          placeholder="Filtrar por proprietário..."
          value={(table.getColumn("owner")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("owner")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <label htmlFor="band" className="text-sm text-muted-foreground">
            Banda
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
            <option value="">Todas</option>
            <option value="2m">2m</option>
            <option value="70cm">70cm</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="modulation" className="text-sm text-muted-foreground">
            Modulation
          </label>
          <select
            id="modulation"
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={(table.getColumn("modulation")?.getFilterValue() as string) ?? ""}
            onChange={(e) =>
              table
                .getColumn("modulation")
                ?.setFilterValue(e.target.value || undefined)
            }
          >
            <option value="">All</option>
            {modulationOptions.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <Input
          placeholder="Filtrar por QTH..."
          value={(table.getColumn("qth_locator")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("qth_locator")?.setFilterValue(event.target.value)
          }
          className="max-w-[10rem]"
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="h-9 rounded-md border bg-background px-3 text-sm"
            >
              Colunas
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Escolha colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table.getAllLeafColumns().map((column) => {
              if (!column.getCanHide()) return null
              const label =
                typeof column.columnDef.header === "string"
                  ? column.columnDef.header
                  : column.id
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) =>
                    column.toggleVisibility(!!value)
                  }
                >
                  {label}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          onClick={() => {
            const rows = table.getFilteredRowModel().rows.map((r) => r.original as any)
            // Build CHIRP CSV
            const header = [
              "Location",
              "Name",
              "Frequency",
              "Duplex",
              "Offset",
              "Tone",
              "rToneFreq",
              "cToneFreq",
              "DtcsCode",
              "DtcsPolarity",
              "Mode",
              "TStep",
              "Skip",
              "Comment",
              "URCALL",
              "RPT1CALL",
              "RPT2CALL",
            ]

            const csvEscape = (val: string) => {
              if (val == null) return ""
              const s = String(val)
              if (s.includes(",") || s.includes("\"") || s.includes("\n")) {
                return '"' + s.replace(/"/g, '""') + '"'
              }
              return s
            }

            const fmtFreq = (n: number | undefined) =>
              typeof n === "number" && Number.isFinite(n) ? n.toFixed(6) : ""

            const fmtOffset = (rx: number | undefined, tx: number | undefined) => {
              if (typeof rx !== "number" || typeof tx !== "number") return ""
              return Math.abs(tx - rx).toFixed(6)
            }

            const getDuplex = (rx: number | undefined, tx: number | undefined) => {
              if (typeof rx !== "number" || typeof tx !== "number") return ""
              if (tx > rx) return "+"
              if (tx < rx) return "-"
              return ""
            }

            const fmtToneFreq = (n: number | undefined) =>
              typeof n === "number" && n > 0 ? Number(n.toFixed(1)).toString() : ""

            const fmtMode = (m: string | undefined) => {
              if (!m) return "FM"
              const up = m.toUpperCase()
              if (["FM", "NFM", "AM"].includes(up)) return up
              return "FM"
            }

            const lines = [header.join(",")]
            rows.forEach((row, idx) => {
              const rx = row?.outputFrequency as number | undefined
              const tx = row?.inputFrequency as number | undefined
              const tone = row?.tone as number | undefined
              const name = row?.callsign ?? ""
              const comment = row?.qth_locator || row?.owner || ""
              const fields = [
                String(idx + 1),
                name,
                fmtFreq(rx),
                getDuplex(rx, tx),
                fmtOffset(rx, tx),
                tone && tone > 0 ? "Tone" : "",
                "", // rToneFreq (only for TSQL)
                fmtToneFreq(tone), // cToneFreq
                "023",
                "NN",
                fmtMode(row?.modulation),
                "", // TStep
                "", // Skip
                comment,
                "", // URCALL
                "", // RPT1CALL
                "", // RPT2CALL
              ].map(csvEscape)
              lines.push(fields.join(","))
            })

            const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" })
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = "repeaters-chirp.csv"
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }}
        >
          Export to CHIRP
        </button>
        <button
          type="button"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          onClick={() => {
            table.resetColumnFilters()
            table.setPageIndex(0)
          }}
        >
          Clear Filters
        </button>
          </div>
        </CardContent>
      </Card>
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
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Rows per page:</span>
          <Combobox
            ariaLabel="Rows per page"
            value={table.getState().pagination.pageSize}
            onChange={(val) => {
              const size = Number(val)
              if (!Number.isNaN(size)) {
                table.setPageSize(size)
              }
            }}
            options={[
              { label: "10", value: 10 },
              { label: "20", value: 20 },
              { label: "50", value: 50 },
              { label: "100", value: 100 },
            ]}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                aria-disabled={!table.getCanPreviousPage()}
                onClick={(e) => {
                  e.preventDefault()
                  table.previousPage()
                }}
              />
            </PaginationItem>
            {(() => {
              const pageCount = table.getPageCount()
              const current = table.getState().pagination.pageIndex
              const items: (number | "ellipses-left" | "ellipses-right")[] = []
              if (pageCount <= 7) {
                for (let i = 0; i < pageCount; i++) items.push(i)
              } else {
                const first = 0
                const last = pageCount - 1
                const start = Math.max(first + 1, current - 1)
                const end = Math.min(last - 1, current + 1)
                items.push(first)
                if (start > first + 1) items.push("ellipses-left")
                for (let i = start; i <= end; i++) items.push(i)
                if (end < last - 1) items.push("ellipses-right")
                items.push(last)
              }
              return items.map((it, idx) => (
                <PaginationItem key={idx}>
                  {typeof it === "number" ? (
                    <PaginationLink
                      href="#"
                      isActive={it === current}
                      onClick={(e) => {
                        e.preventDefault()
                        table.setPageIndex(it)
                      }}
                    >
                      {it + 1}
                    </PaginationLink>
                  ) : (
                    <PaginationEllipsis />
                  )}
                </PaginationItem>
              ))
            })()}
            <PaginationItem>
              <PaginationNext
                href="#"
                aria-disabled={!table.getCanNextPage()}
                onClick={(e) => {
                  e.preventDefault()
                  table.nextPage()
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  )
}
