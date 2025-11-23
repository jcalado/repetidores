
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
import { ChevronDown, Loader2 } from "lucide-react"
import * as React from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
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
  isLoading?: boolean
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onFilteredDataChange,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  onRowClick,
  isLoading = false,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'outputFrequency', desc: false },
  ])
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

  const [showExportModal, setShowExportModal] = React.useState(false)
  const [exportFormat, setExportFormat] = React.useState<"chirp" | "anytone">("chirp")

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
   * Shows the export confirmation modal
   */
  const handleExportClick = () => {
    setShowExportModal(true)
  }

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

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "repetidores.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Close the modal after export
    setShowExportModal(false)
  }

  /**
   * Exports the filtered rows from the data table to an Anytone-compatible CSV file.
   *
   * This function retrieves the filtered rows from the table, formats them according to
   * the Anytone CSV specification with 60 columns, and generates a downloadable CSV file
   * named "repetidores-anytone.csv". It handles both analog (FM) and digital (DMR) repeaters
   * with appropriate field values for each type. All values are quoted as per Anytone format.
   *
   * @returns {void} This function does not return a value; it triggers a file download.
   */
  const handleAnytoneExport = () => {
    const rows = table.getFilteredRowModel().rows.map((r) => r.original as TData)

    // Build Anytone CSV header (60 columns)
    const header = [
      "No.",
      "Channel Name",
      "Receive Frequency",
      "Transmit Frequency",
      "Channel Type",
      "Transmit Power",
      "Band Width",
      "CTCSS/DCS Decode",
      "CTCSS/DCS Encode",
      "Contact",
      "Contact Call Type",
      "Radio ID",
      "Busy Lock/TX Permit",
      "Squelch Mode",
      "Optional Signal",
      "DTMF ID",
      "2Tone ID",
      "5Tone ID",
      "PTT ID",
      "RX Color Code",
      "Slot",
      "Scan List",
      "Receive Group List",
      "PTT Prohibit",
      "Reverse",
      "Idle TX",
      "Slot Suit",
      "AES Digital Encryption",
      "Digital Encryption",
      "Call Confirmation",
      "Talk Around(Simplex)",
      "Work Alone",
      "Custom CTCSS",
      "2TONE Decode",
      "Ranging",
      "Through Mode",
      "APRS RX",
      "Analog APRS PTT Mode",
      "Digital APRS PTT Mode",
      "APRS Report Type",
      "Digital APRS Report Channel",
      "Correct Frequency[Hz]",
      "SMS Confirmation",
      "Exclude channel from roaming",
      "DMR MODE",
      "DataACK Disable",
      "R5ToneBot",
      "R5ToneEot",
      "Auto Scan",
      "Ana Aprs Mute",
      "Send Talker Aias",
      "AnaAprsTxPath",
      "ARC4",
      "ex_emg_kind",
      "idle_tx",
      "Compand",
      "DisturEn",
      "DisturFreq",
      "Rpga_Mdc",
      "dmr_crc_ignore",
      "TxCc"
    ]

    const quoteValue = (val: string | number) => {
      return '"' + String(val).replace(/"/g, '""') + '"'
    }

    const fmtFreqAnytone = (n: number | undefined) =>
      typeof n === "number" && Number.isFinite(n) ? n.toFixed(5) : "0.00000"

    const fmtToneAnytone = (n: number | undefined) =>
      typeof n === "number" && n > 0 ? n.toFixed(1) : "Off"

    const lines = [header.map(quoteValue).join(",")]

    rows.forEach((row, idx) => {
      const item = row as Record<string, unknown>
      const rx = item?.outputFrequency as number | undefined
      const tx = item?.inputFrequency as number | undefined
      const tone = item?.tone as number | undefined
      const name = item?.callsign as string ?? ""
      const isDMR = item?.dmr === true
      const modulation = item?.modulation as string | undefined

      // Determine if this is a digital channel
      const isDigital = isDMR || (modulation && modulation.toUpperCase().includes("DMR"))

      const fields = [
        String(idx + 1),                              // No.
        name,                                         // Channel Name
        fmtFreqAnytone(rx),                          // Receive Frequency
        fmtFreqAnytone(tx),                          // Transmit Frequency
        isDigital ? "D-Digital" : "A-Analog",        // Channel Type
        "High",                                       // Transmit Power (High for both analog and digital)
        "25K",                                        // Band Width
        "Off",                                        // CTCSS/DCS Decode
        isDigital ? "Off" : fmtToneAnytone(tone),    // CTCSS/DCS Encode
        "WW",                                         // Contact
        "Group Call",                                 // Contact Call Type
        "My Radio",                                   // Radio ID
        isDigital ? "Always" : "Off",                // Busy Lock/TX Permit
        "Carrier",                                    // Squelch Mode
        "Off",                                        // Optional Signal
        "1",                                          // DTMF ID
        "1",                                          // 2Tone ID
        "1",                                          // 5Tone ID
        "Off",                                        // PTT ID
        "1",                                          // RX Color Code
        "1",                                          // Slot
        isDigital ? "Scan List 1" : "None",          // Scan List
        isDigital ? "Group List 1" : "None",         // Receive Group List
        "Off",                                        // PTT Prohibit
        "Off",                                        // Reverse
        "Off",                                        // Idle TX
        "Off",                                        // Slot Suit
        "Normal Encryption",                          // AES Digital Encryption
        "Off",                                        // Digital Encryption
        "Off",                                        // Call Confirmation
        "Off",                                        // Talk Around(Simplex)
        "Off",                                        // Work Alone
        "251.1",                                      // Custom CTCSS
        isDigital ? "1" : "0",                       // 2TONE Decode
        "Off",                                        // Ranging
        "Off",                                        // Through Mode
        "Off",                                        // APRS RX
        "Off",                                        // Analog APRS PTT Mode
        "Off",                                        // Digital APRS PTT Mode
        "Off",                                        // APRS Report Type
        "1",                                          // Digital APRS Report Channel
        "0",                                          // Correct Frequency[Hz]
        "Off",                                        // SMS Confirmation
        "0",                                          // Exclude channel from roaming
        "1",                                          // DMR MODE
        "0",                                          // DataACK Disable
        "0",                                          // R5ToneBot
        "0",                                          // R5ToneEot
        "0",                                          // Auto Scan
        "0",                                          // Ana Aprs Mute
        "0",                                          // Send Talker Aias
        "0",                                          // AnaAprsTxPath
        "0",                                          // ARC4
        "0",                                          // ex_emg_kind
        "0",                                          // idle_tx
        "0",                                          // Compand
        "0",                                          // DisturEn
        isDigital ? "13" : "0",                      // DisturFreq
        "0",                                          // Rpga_Mdc
        "0",                                          // dmr_crc_ignore
        "1"                                           // TxCc
      ].map(quoteValue)

      lines.push(fields.join(","))
    })

    const blob = new Blob([lines.join("\r\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "repetidores-anytone.csv"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    // Close the modal after export
    setShowExportModal(false)
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
          onClick={handleExportClick}
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

      <div className="rounded-md border" aria-busy={isLoading}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-2 px-2">
                      <div className="space-y-3">
                        {/* Column Title */}
                        <div
                          className={`font-medium text-sm ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                          onClick={() => {
                            if (!header.column.getCanSort()) return
                            header.column.toggleSorting()
                          }}
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                          {header.column.getIsSorted() === 'asc' && ' ↑'}
                          {header.column.getIsSorted() === 'desc' && ' ↓'}
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
                          {header.column.id === "status" && (
                            <Select
                              value={(table.getColumn("status")?.getFilterValue() as string) ?? "all"}
                              onValueChange={(value) =>
                                table
                                  .getColumn("status")
                                  ?.setFilterValue(value === "all" ? undefined : value)
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                <SelectItem value="ok">{t("table.status.ok")}</SelectItem>
                                <SelectItem value="prob-bad">{t("table.status.prob-bad")}</SelectItem>
                                <SelectItem value="bad">{t("table.status.bad")}</SelectItem>
                                <SelectItem value="unknown">{t("table.status.unknown")}</SelectItem>
                              </SelectContent>
                            </Select>
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
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-7 w-full justify-between px-2 text-xs font-normal">
                                  <span className="truncate">
                                    {(() => {
                                      const selected = table.getColumn("modulation")?.getFilterValue() as string[] | undefined
                                      if (!selected || selected.length === 0) return t("filters.all")
                                      return selected.join(', ')
                                    })()}
                                  </span>
                                  <ChevronDown className="ml-1 h-3 w-3 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-[140px]" align="start">
                                <DropdownMenuLabel className="text-xs">{t("filters.modulation")}</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {modulationOptions.map((m) => {
                                  const selected = (table.getColumn("modulation")?.getFilterValue() as string[] | undefined) || []
                                  return (
                                    <DropdownMenuCheckboxItem
                                      key={m}
                                      checked={selected.includes(m)}
                                      onCheckedChange={(checked) => {
                                        const column = table.getColumn("modulation")
                                        const current = (column?.getFilterValue() as string[] | undefined) || []
                                        const updated = checked
                                          ? [...current, m]
                                          : current.filter((v) => v !== m)
                                        column?.setFilterValue(updated.length > 0 ? updated : undefined)
                                      }}
                                      className="text-xs"
                                    >
                                      {m}
                                    </DropdownMenuCheckboxItem>
                                  )
                                })}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          {header.column.id === "dmr" && (
                            <Select
                              value={(() => {
                                const current = table.getColumn("dmr")?.getFilterValue() as boolean | undefined
                                if (current === undefined || current === null) return "all"
                                return current ? "yes" : "no"
                              })()}
                              onValueChange={(value) =>
                                table
                                  .getColumn("dmr")
                                  ?.setFilterValue(value === "all" ? undefined : value === "yes")
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                <SelectItem value="yes">{t("filters.yes")}</SelectItem>
                                <SelectItem value="no">{t("filters.no")}</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {header.column.id === "dstar" && (
                            <Select
                              value={(() => {
                                const current = table.getColumn("dstar")?.getFilterValue() as boolean | undefined
                                if (current === undefined || current === null) return "all"
                                return current ? "yes" : "no"
                              })()}
                              onValueChange={(value) =>
                                table
                                  .getColumn("dstar")
                                  ?.setFilterValue(value === "all" ? undefined : value === "yes")
                              }
                            >
                              <SelectTrigger className="h-7 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">{t("filters.all")}</SelectItem>
                                <SelectItem value="yes">{t("filters.yes")}</SelectItem>
                                <SelectItem value="no">{t("filters.no")}</SelectItem>
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-40">
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3">
                    <Loader2
                      className="h-6 w-6 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                    <span className="text-sm text-muted-foreground">
                      {t("table.loading")}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
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
      <div
        className={`mt-4 flex flex-wrap items-center justify-between gap-3${isLoading ? " pointer-events-none opacity-50" : ""}`}
        aria-hidden={isLoading}
      >
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

      {/* Export Confirmation Modal */}
      <AlertDialog open={showExportModal} onOpenChange={setShowExportModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("export.modalTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("export.modalDescription", {
                count: table.getFilteredRowModel().rows.length
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">
              {t("export.formatLabel")}
            </label>
            <Select value={exportFormat} onValueChange={(value: "chirp" | "anytone") => setExportFormat(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chirp">
                  {t("export.formatChirp")}
                </SelectItem>
                <SelectItem value="anytone">
                  {t("export.formatAnytone")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("export.cancelButton")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (exportFormat === "anytone") {
                handleAnytoneExport()
              } else {
                handleChirpExport()
              }
            }}>
              {t("export.confirmButton")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
