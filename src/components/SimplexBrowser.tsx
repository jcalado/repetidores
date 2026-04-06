"use client"

import { useSimplexColumns } from "@/app/simplex/columns"
import { DataTable } from "@/components/ui/data-table"
import { Drawer, DrawerContent, DrawerFooter, DrawerOverlay, DrawerTitle } from "@/components/ui/drawer"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import type { SimplexFrequency } from "@/types/simplex-frequency"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"
import * as React from "react"

const SimplexMapView = dynamic(() => import("@/components/SimplexMapView"), { ssr: false })

const MODE_COLORS: Record<string, string> = {
  FM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  DMR: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "D-STAR": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  C4FM: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

type Props = {
  data: SimplexFrequency[]
}

export default function SimplexBrowser({ data }: Props) {
  const t = useTranslations("simplex")
  const columns = useSimplexColumns()
  const [activeTab, setActiveTab] = React.useState<"table" | "map">("table")
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<SimplexFrequency | null>(null)

  const handleSelect = React.useCallback((freq: SimplexFrequency) => {
    setSelected(freq)
    setOpen(true)
  }, [])

  return (
    <>
      {/* Tab buttons */}
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("table")}
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "table"
              ? "bg-ship-cove-600 text-white dark:bg-ship-cove-500"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("tableView")}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("map")}
          className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "map"
              ? "bg-ship-cove-600 text-white dark:bg-ship-cove-500"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {t("mapView")}
        </button>
        <span className="ml-auto text-sm text-muted-foreground">
          {data.length} {t("frequencies")}
        </span>
      </div>

      {/* Table view */}
      {activeTab === "table" && (
        <DataTable
          columns={columns}
          data={data}
          onRowClick={(row) => handleSelect(row as SimplexFrequency)}
          initialSorting={[{ id: "frequency", desc: false }]}
        />
      )}

      {/* Map view */}
      {activeTab === "map" && (
        <div className="h-[500px]">
          <SimplexMapView
            frequencies={data}
            onFrequencyClick={handleSelect}
          />
        </div>
      )}

      {/* Detail drawer */}
      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open && selected && (
          <>
            <DrawerOverlay onClick={() => setOpen(false)} />
            <DrawerContent>
              <VisuallyHidden>
                <DrawerTitle>
                  {selected.frequency.toFixed(4)} MHz - {selected.municipality}
                </DrawerTitle>
              </VisuallyHidden>
              <div className="p-4 space-y-4">
                <div>
                  <h2 className="text-xl font-bold font-mono">{selected.frequency.toFixed(4)} MHz</h2>
                  <p className="text-muted-foreground">{selected.municipality}, {selected.district}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-muted-foreground">{t("mode")}</span>
                    <div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${MODE_COLORS[selected.mode] || ""}`}>
                        {selected.mode}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("band")}</span>
                    <div className="font-medium">{selected.band}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("tone")}</span>
                    <div className="font-mono">{selected.tone ? `${selected.tone} Hz` : "\u2014"}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">{t("status")}</span>
                    <div className="font-medium">
                      {selected.status === "active" ? t("active") : t("inactive")}
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div>
                    <span className="text-xs text-muted-foreground">{t("notes")}</span>
                    <p className="text-sm mt-1">{selected.notes}</p>
                  </div>
                )}
              </div>
              <DrawerFooter>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setOpen(false)}
                >
                  {t("close")}
                </button>
              </DrawerFooter>
            </DrawerContent>
          </>
        )}
      </Drawer>
    </>
  )
}
