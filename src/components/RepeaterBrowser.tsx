"use client"

import { getOwnerShort, useColumns, type Repeater } from "@/app/columns"
import MapClient from "@/components/MapClient"
import RepeaterDetails from "@/components/RepeaterDetails"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { DataTable } from "@/components/ui/data-table"
import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerTitle } from "@/components/ui/drawer"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { FunnelX } from "lucide-react"
import { useTranslations } from 'next-intl'
import * as React from "react"

type Props = {
  data: Repeater[]
  activeTab?: string
  onTabChange?: (tab: string) => void
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  return "Other"
}

export default function RepeaterBrowser({ data, activeTab = "table", onTabChange }: Props) {
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
      | string
      | undefined
    const qth = columnFilters.find((f) => f.id === "qth_locator")?.value as
      | string
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
    if (modulation) {
      const q = modulation.toLowerCase()
      result = result.filter((r) => r.modulation?.toLowerCase() === q)
    }
    if (qth && qth.trim()) {
      const q = qth.trim().toLowerCase()
      result = result.filter((r) => r.qth_locator?.toLowerCase().includes(q))
    }
    return result
  }, [data, columnFilters])

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
                  <Select
                    value={(columnFilters.find((f) => f.id === "modulation")?.value as string) ?? "all"}
                    onValueChange={(value) => {
                      setColumnFilters((prev) => {
                        const next = prev.filter((f) => f.id !== "modulation")
                        if (value && value !== "all") next.push({ id: "modulation", value })
                        return next
                      })
                    }}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('filters.all')}</SelectItem>
                      {modulationOptions.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
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
              <DrawerHeader>
                <DrawerTitle>{t('repeater.details')}</DrawerTitle>
              </DrawerHeader>
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
