"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchCallsigns } from "@/lib/callsigns"
import type { Callsign, CallsignStats, PaginatedCallsignResponse } from "@/types/callsign"
import { useCallback, useEffect, useState } from "react"
import { StatsCards } from "./StatsCards"
import { FilterBar, type CallsignFilters } from "./FilterBar"
import { CallsignTable } from "./CallsignTable"
import { ChangesFeed } from "./ChangesFeed"
import { TrendsCharts } from "./TrendsCharts"
import { IdCard, History, TrendingUp } from "lucide-react"

interface IndicativosContentProps {
  initialStats: CallsignStats
}

export function IndicativosContent({ initialStats }: IndicativosContentProps) {
  const [filters, setFilters] = useState<CallsignFilters>({
    search: "",
    distrito: [],
    categoria: [],
    estado: [],
  })
  const [data, setData] = useState<PaginatedCallsignResponse<Callsign> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const loadData = useCallback(async (p: number, f: CallsignFilters) => {
    setLoading(true)
    try {
      const result = await fetchCallsigns({
        page: p,
        limit: 50,
        search: f.search || undefined,
        distrito: f.distrito.length > 0 ? f.distrito.join(",") : undefined,
        categoria: f.categoria.length > 0 ? f.categoria.join(",") : undefined,
        estado: f.estado.length > 0 ? f.estado.join(",") : undefined,
      })
      setData(result)
    } catch (err) {
      console.error("Failed to fetch callsigns:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    loadData(1, filters)
  }, [filters, loadData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    loadData(newPage, filters)
  }

  return (
    <div className="space-y-6 mt-6">
      <StatsCards stats={initialStats} />

      <Tabs defaultValue="indicativos" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="indicativos" className="gap-2">
            <IdCard className="h-4 w-4" />
            Indicativos
          </TabsTrigger>
          <TabsTrigger value="alteracoes" className="gap-2">
            <History className="h-4 w-4" />
            Alterações
          </TabsTrigger>
          <TabsTrigger value="tendencias" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="indicativos" className="space-y-4">
          <FilterBar
            stats={initialStats}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <CallsignTable
            data={data?.docs || []}
            loading={loading}
            page={page}
            totalPages={data?.totalPages || 1}
            totalDocs={data?.totalDocs || 0}
            onPageChange={handlePageChange}
          />
        </TabsContent>

        <TabsContent value="alteracoes">
          <ChangesFeed />
        </TabsContent>

        <TabsContent value="tendencias">
          <TrendsCharts stats={initialStats} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
