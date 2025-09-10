"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { Drawer, DrawerBody, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerTitle } from "@/components/ui/drawer"
import RepeaterDetails from "@/components/RepeaterDetails"
import MapClient from "@/components/MapClient"
import { columns, type Repeater, getOwnerShort } from "@/app/columns"
import type { ColumnFiltersState } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"

type Props = {
  data: Repeater[]
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm"
  if (mhz >= 144 && mhz <= 148) return "2m"
  if (mhz >= 50 && mhz <= 54) return "6m"
  return "Other"
}

export default function RepeaterBrowser({ data }: Props) {
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
      <CardHeader>
        <CardTitle>Repetidores</CardTitle>
        <CardDescription>Lista de repetidores de rádio amador em Portugal.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table">
          <TabsList>
            <TabsTrigger value="table">Tabela</TabsTrigger>
            <TabsTrigger value="map">Mapa</TabsTrigger>
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
                placeholder="Filtrar por indicativo..."
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
                placeholder="Filtrar por proprietário..."
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
                <label htmlFor="band-map" className="text-sm text-muted-foreground">
                  Banda
                </label>
                <select
                  id="band-map"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={(columnFilters.find((f) => f.id === "band")?.value as string) ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setColumnFilters((prev) => {
                      const next = prev.filter((f) => f.id !== "band")
                      if (v) next.push({ id: "band", value: v })
                      return next
                    })
                  }}
                >
                  <option value="">Todas</option>
                  <option value="2m">2m</option>
                  <option value="70cm">70cm</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="mod-map" className="text-sm text-muted-foreground">
                  Modulation
                </label>
                <select
                  id="mod-map"
                  className="h-9 rounded-md border bg-background px-2 text-sm"
                  value={(columnFilters.find((f) => f.id === "modulation")?.value as string) ?? ""}
                  onChange={(e) => {
                    const v = e.target.value
                    setColumnFilters((prev) => {
                      const next = prev.filter((f) => f.id !== "modulation")
                      if (v) next.push({ id: "modulation", value: v })
                      return next
                    })
                  }}
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
                Clear Filters
              </button>
            </div>
            <div className="h-[500px]">
              <MapClient repeaters={filtered} />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    <Drawer open={open} onOpenChange={setOpen}>
      {open && (
        <>
          <DrawerOverlay onClick={() => setOpen(false)} />
          <DrawerContent open={open} side="right">
            <DrawerHeader>
              <DrawerTitle>Repeater Details</DrawerTitle>
            </DrawerHeader>
            <DrawerBody>
              {selected && <RepeaterDetails r={selected} />}
            </DrawerBody>
            <DrawerFooter>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </DrawerFooter>
          </DrawerContent>
        </>
      )}
    </Drawer>
    </>
  )
}
