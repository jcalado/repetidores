"use client"

import { getOwnerShort, useColumns, type Repeater } from "@/app/columns"
import MapClient from "@/components/MapClient"
import RepeaterDetails from "@/components/RepeaterDetails"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Drawer, DrawerContent, DrawerFooter, DrawerOverlay, DrawerTitle } from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { ChevronDown, FunnelX } from "lucide-react"
import { useTranslations } from 'next-intl'
import * as React from "react"

type Props = {
  data: Repeater[]
  activeTab?: string
  onTabChange?: (tab: string) => void
  isLoading?: boolean
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  return "Other"
}

export default function RepeaterBrowser({
  data,
  activeTab = "table",
  onTabChange,
  isLoading = false,
}: Props) {
  const t = useTranslations()
  const columns = useColumns()
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Repeater | null>(null)
  const modulationOptions = React.useMemo(() => {
    const set = new Set<string>()
    data.forEach((d) => d.modulation && set.add(d.modulation))
    return Array.from(set).sort()
  }, [data])

  const filtered = React.useMemo(() => {
    let result = data
    const callsign = columnFilters.find((f) => f.id === "callsign")?.value as
      | string
      | undefined
    const band = columnFilters.find((f) => f.id === "band")?.value as
      | string
      | undefined
    const owner = columnFilters.find((f) => f.id === "owner")?.value as
      | string
      | undefined
    const modulation = columnFilters.find((f) => f.id === "modulation")?.value as
      | string[]
      | undefined
    const qth = columnFilters.find((f) => f.id === "qth_locator")?.value as
      | string
      | undefined
    const dmrFilter = columnFilters.find((f) => f.id === "dmr")?.value as
      | boolean
      | undefined
    const dstarFilter = columnFilters.find((f) => f.id === "dstar")?.value as
      | boolean
      | undefined
    if (callsign && callsign.trim()) {
      const q = callsign.trim().toLowerCase()
      result = result.filter((r) => r.callsign.toLowerCase().includes(q))
    }
    if (band) {
      result = result.filter(
        (r) => getBandFromFrequency(r.outputFrequency) === band
      )
    }
    if (owner && owner.trim()) {
      const q = owner.trim().toLowerCase()
      result = result.filter((r) =>
        r.owner.toLowerCase().includes(q) || getOwnerShort(r.owner).toLowerCase().includes(q)
      )
    }
    if (modulation && modulation.length > 0) {
      result = result.filter((r) =>
        r.modulation && modulation.some(m => m.toLowerCase() === r.modulation?.toLowerCase())
      )
    }
    if (qth && qth.trim()) {
      const q = qth.trim().toLowerCase()
      result = result.filter((r) => r.qth_locator?.toLowerCase().includes(q))
    }
    if (typeof dmrFilter === "boolean") {
      result = result.filter((r) => Boolean(r.dmr) === dmrFilter)
    }
    if (typeof dstarFilter === "boolean") {
      result = result.filter((r) => Boolean(r.dstar) === dstarFilter)
    }
    return result
  }, [data, columnFilters])

  const dmrSelected = columnFilters.find((f) => f.id === "dmr")?.value as boolean | undefined
  const dstarSelected = columnFilters.find((f) => f.id === "dstar")?.value as boolean | undefined
  const dmrSelectValue = dmrSelected === undefined ? "all" : dmrSelected ? "yes" : "no"
  const dstarSelectValue = dstarSelected === undefined ? "all" : dstarSelected ? "yes" : "no"

  return (
    <>
      <Card className="w-full max-w-7xl">
        <CardContent>
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList>
              <TabsTrigger value="table">{t('nav.table')}</TabsTrigger>
              <TabsTrigger value="map">{t('nav.map')}</TabsTrigger>
            </TabsList>
            <TabsContent value="table">
              <DataTable
                columns={columns}
                data={data}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                onRowClick={(row) => {
                  setSelected(row as Repeater)
                  setOpen(true)
                }}
                isLoading={isLoading}
              />
            </TabsContent>
            <TabsContent value="map" className="h-[500px]">
              <div className="mb-3 flex items-center gap-4">
                <Input
                  placeholder={t('filters.callsign')}
                  value={(columnFilters.find((f) => f.id === "callsign")?.value as string) ?? ""}
                  onChange={(event) => {
                    const v = event.target.value
                    setColumnFilters((prev) => {
                      const next = prev.filter((f) => f.id !== "callsign")
                      if (v) next.push({ id: "callsign", value: v })
                      return next
                    })
                  }}
                  className="max-w-sm"
                />
                <Input
                  placeholder={t('filters.owner')}
                  value={(columnFilters.find((f) => f.id === "owner")?.value as string) ?? ""}
                  onChange={(event) => {
                    const v = event.target.value
                    setColumnFilters((prev) => {
                      const next = prev.filter((f) => f.id !== "owner")
                      if (v) next.push({ id: "owner", value: v })
                      return next
                    })
                  }}
                  className="max-w-sm"
                />
                <div className="flex items-center gap-2">
                  <Label htmlFor="band-map" className="text-sm text-muted-foreground">
                    {t('filters.band')}
                  </Label>
                  <Select
                    value={(columnFilters.find((f) => f.id === "band")?.value as string) ?? "all"}
                    onValueChange={(value) => {
                      setColumnFilters((prev) => {
                        const next = prev.filter((f) => f.id !== "band")
                        if (value && value !== "all") next.push({ id: "band", value })
                        return next
                      })
                    }}
                  >
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      <SelectItem value="2m">{t('filters.2m')}</SelectItem>
                      <SelectItem value="70cm">{t('filters.70cm')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="mod-map" className="text-sm text-muted-foreground">
                    {t('filters.modulation')}
                  </Label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex h-9 w-[180px] items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                        <span className="truncate">
                          {(() => {
                            const selected = columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined
                            if (!selected || selected.length === 0) return t('filters.all')
                            return selected.join(', ')
                          })()}
                        </span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-[180px]">
                      <DropdownMenuLabel>{t('filters.modulation')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {modulationOptions.map((m) => {
                        const selected = (columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined) || []
                        return (
                          <DropdownMenuCheckboxItem
                            key={m}
                            checked={selected.includes(m)}
                            onCheckedChange={(checked) => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "modulation")
                                const current = (prev.find((f) => f.id === "modulation")?.value as string[] | undefined) || []
                                const updated = checked
                                  ? [...current, m]
                                  : current.filter((v) => v !== m)
                                if (updated.length > 0) {
                                  next.push({ id: "modulation", value: updated })
                                }
                                return next
                              })
                            }}
                          >
                            {m}
                          </DropdownMenuCheckboxItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dmr-map" className="text-sm text-muted-foreground">
                    {t('filters.dmr')}
                  </Label>
                  <Select
                    value={dmrSelectValue}
                    onValueChange={(value) => {
                      setColumnFilters((prev) => {
                        const next = prev.filter((f) => f.id !== "dmr")
                        if (value === "yes") next.push({ id: "dmr", value: true })
                        if (value === "no") next.push({ id: "dmr", value: false })
                        return next
                      })
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      <SelectItem value="yes">{t('filters.yes')}</SelectItem>
                      <SelectItem value="no">{t('filters.no')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="dstar-map" className="text-sm text-muted-foreground">
                    {t('filters.dstar')}
                  </Label>
                  <Select
                    value={dstarSelectValue}
                    onValueChange={(value) => {
                      setColumnFilters((prev) => {
                        const next = prev.filter((f) => f.id !== "dstar")
                        if (value === "yes") next.push({ id: "dstar", value: true })
                        if (value === "no") next.push({ id: "dstar", value: false })
                        return next
                      })
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      <SelectItem value="yes">{t('filters.yes')}</SelectItem>
                      <SelectItem value="no">{t('filters.no')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder={t('filters.qth')}
                  value={(columnFilters.find((f) => f.id === "qth_locator")?.value as string) ?? ""}
                  onChange={(event) => {
                    const v = event.target.value
                    setColumnFilters((prev) => {
                      const next = prev.filter((f) => f.id !== "qth_locator")
                      if (v) next.push({ id: "qth_locator", value: v })
                      return next
                    })
                  }}
                  className="max-w-[10rem]"
                />
                <button
                  type="button"
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  onClick={() => setColumnFilters([])}
                >
                  <FunnelX className="h-4 w-4 text-gray-400" />
                </button>
              </div>
              <div className="h-[500px]">
                <MapClient repeaters={filtered} />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open && (
          <>
            <DrawerOverlay onClick={() => setOpen(false)} />
            <DrawerContent>
              <VisuallyHidden>
                <DrawerTitle>
                  {selected ? `${t('repeater.details')} - ${selected.callsign}` : t('repeater.details')}
                </DrawerTitle>
              </VisuallyHidden>
              <div className="p-4">
                {selected && <RepeaterDetails r={selected} />}
              </div>
              <DrawerFooter>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setOpen(false)}
                >
                  {t('repeater.close')}
                </button>
              </DrawerFooter>
            </DrawerContent>
          </>
        )}
      </Drawer>
    </>
  )
}
