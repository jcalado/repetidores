
"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslations } from "next-intl"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onFilteredDataChange?: (rows: TData[]) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onFilteredDataChange,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  onRowClick,
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

  const t = useTranslations()

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
      ; (data as unknown[]).forEach((d) => {
        const item = d as Record<string, unknown>
        const v = item?.modulation
        if (v && typeof v === "string") set.add(v)
      })
    return Array.from(set).sort()
  }, [data])

  /**
   * Exports the filtered rows from the data table to a CHIRP-compatible CSV file.
   * 
   * This function retrieves the filtered rows from the table, formats them according to
   * the CHIRP CSV specification with predefined headers (Location, Name, Frequency, etc.),
   * and generates a downloadable CSV file named "repeaters-chirp.csv". It handles data
   * formatting for frequencies, duplex, offsets, tones, and modes, escaping CSV values
   * as needed. The file is created as a Blob and downloaded via a temporary anchor element.
   * 
   * @returns {void} This function does not return a value; it triggers a file download.
   */
  const handleChirpExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)
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
      const item = row as Record<string, unknown>
      const rx = item?.outputFrequency as number | undefined
      const tx = item?.inputFrequency as number | undefined
      const tone = item?.tone as number | undefined
      const name = item?.callsign as string ?? ""
      const comment = (item?.qth_locator as string) || (item?.owner as string) || ""
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
        fmtMode(item?.modulation as string),
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
    a.download = "repetidores.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  React.useEffect(() => {
    if (!onFilteredDataChange) return
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)
    onFilteredDataChange(rows)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onFilteredDataChange, columnFilters, data])

  return (
    <div>
      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 mb-4">


        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            handleChirpExport()
          }}
        >
          {t("filters.export")}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {t("table.visibleColumns")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{t("table.visibleColumns")}</DropdownMenuLabel>
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

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            table.resetColumnFilters()
            table.setPageIndex(0)
          }}
        >
          {t("filters.clear")}
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-2 px-2">
                      <div className="space-y-3">
                        {/* Column Title */}
                        <div className="font-medium text-sm">
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        </div>

                        {/* Column Filter */}
                        <div className="min-w-0">
                          {header.column.id === "callsign" && (
                            <Input
                              placeholder=""
                              value={(table.getColumn("callsign")?.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                table.getColumn("callsign")?.setFilterValue(event.target.value)
                              }
                              className="h-7 text-xs w-full"
                            />
                          )}
                          {header.column.id === "owner" && (
                            <Input
                              placeholder=""
                              value={(table.getColumn("owner")?.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                table.getColumn("owner")?.setFilterValue(event.target.value)
                              }
                              className="h-7 text-xs w-full"
                            />
                          )}
                          {header.column.id === "qth_locator" && (
                            <Input
                              placeholder=""
                              value={(table.getColumn("qth_locator")?.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                table.getColumn("qth_locator")?.setFilterValue(event.target.value)
                              }
                              className="h-7 text-xs w-full"
                            />
                          )}
                          {header.column.id === "band" && (
                            <Select
                              value={(table.getColumn("band")?.getFilterValue() as string) ?? "all"}
                              onValueChange={(value) =>
                                table
                                  .getColumn("band")
                                  ?.setFilterValue(value === "all" ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                <SelectItem value="2m">{t("filters.2m")}</SelectItem>
                                <SelectItem value="70cm">{t("filters.70cm")}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {header.column.id === "outputFrequency" && (
                            <Input
                              placeholder=""
                              value={(table.getColumn("outputFrequency")?.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                table.getColumn("outputFrequency")?.setFilterValue(event.target.value)
                              }
                              className="h-7 text-xs w-full"
                            />
                          )}
                          {header.column.id === "inputFrequency" && (
                            <Input
                              placeholder=""
                              value={(table.getColumn("inputFrequency")?.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                table.getColumn("inputFrequency")?.setFilterValue(event.target.value)
                              }
                              className="h-7 text-xs w-full"
                            />
                          )}
                          {header.column.id === "tone" && (
                            <Input
                              placeholder=""
                              value={(table.getColumn("tone")?.getFilterValue() as string) ?? ""}
                              onChange={(event) =>
                                table.getColumn("tone")?.setFilterValue(event.target.value)
                              }
                              className="h-7 text-xs w-full"
                            />
                          )}
                          {header.column.id === "modulation" && (
                            <Select
                              value={(table.getColumn("modulation")?.getFilterValue() as string) ?? "all"}
                              onValueChange={(value) =>
                                table
                                  .getColumn("modulation")
                                  ?.setFilterValue(value === "all" ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                {modulationOptions.map((m) => (
                                  <SelectItem key={m} value={m}>
                                    {m}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>
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
                  className={onRowClick ? "cursor-pointer hover:bg-accent/40" : undefined}
                  onClick={() => onRowClick?.(row.original as TData)}
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
                  {t("table.noResults")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t("table.rowsPerPage")}</span>
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
          {t("table.pageOf", {
            current: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount()
          })}
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
