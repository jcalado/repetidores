"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { fetchCallsigns, fetchCallsignStats } from "@/lib/callsigns"
import type { Callsign, CallsignStats, PaginatedCallsignResponse } from "@/types/callsign"
import { useCallback, useEffect, useState } from "react"
import { StatsCards } from "./StatsCards"
import { FilterBar, type CallsignFilters, EMPTY_CALLSIGN_FILTERS } from "./FilterBar"
import { CallsignTable } from "./CallsignTable"
import { ChangesFeed } from "./ChangesFeed"
import { TrendsCharts } from "./TrendsCharts"
import { IdCard, History, TrendingUp } from "lucide-react"
import { useIndicativosFilters } from "./hooks/useIndicativosFilters"
import { ErrorBoundary } from "react-error-boundary"

function TabErrorFallback({ resetErrorBoundary }: { error: unknown; resetErrorBoundary: () => void }) {
  return (
    <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center">
      <p className="text-sm text-red-600 dark:text-red-400">
        Erro inesperado. Tente recarregar a página.
      </p>
      <button
        onClick={resetErrorBoundary}
        className="mt-3 text-sm text-ship-cove-600 dark:text-ship-cove-400 hover:underline"
      >
        Tentar novamente
      </button>
    </div>
  )
}

const emptyStats: CallsignStats = {
  total: 0,
  byEstado: {},
  byCategoria: {},
  byDistrito: {},
  newThisMonth: 0,
  changesThisMonth: 0,
  lastSyncAt: null,
}

export function IndicativosContent() {
  const {
    tab, setTab,
    filters, setFilters,
    page, setPage,
    changeType, setChangeType,
    startDate, endDate, setDateRange,
  } = useIndicativosFilters()

  const [stats, setStats] = useState<CallsignStats>(emptyStats)
  const [statsLoading, setStatsLoading] = useState(true)
  const [data, setData] = useState<PaginatedCallsignResponse<Callsign> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCallsignStats()
      .then(setStats)
      .catch((err) => console.error("Failed to fetch stats:", err))
      .finally(() => setStatsLoading(false))
  }, [])

  const loadData = useCallback(async (p: number, f: CallsignFilters) => {
    setLoading(true)
    try {
      const result = await fetchCallsigns({
        page: p,
        limit: 50,
        search: f.search || undefined,
        searchField: f.searchField !== "todos" ? f.searchField : undefined,
        distrito: f.distrito.length > 0 ? f.distrito.join(",") : undefined,
        categoria: f.categoria.length > 0 ? f.categoria.join(",") : undefined,
        estado: f.estado.length > 0 ? f.estado.join(",") : undefined,
        concelho: f.concelho.length > 0 ? f.concelho.join(",") : undefined,
      })
      setData(result)
    } catch (err) {
      console.error("Failed to fetch callsigns:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData(page, filters)
  }, [filters, page, loadData])

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  return (
    <div className="space-y-6 mt-6">
      <StatsCards stats={stats} loading={statsLoading} />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
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
          <ErrorBoundary FallbackComponent={TabErrorFallback}>
            <FilterBar
              stats={stats}
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
              onClearFilters={() => setFilters(EMPTY_CALLSIGN_FILTERS)}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="alteracoes">
          <ErrorBoundary FallbackComponent={TabErrorFallback}>
            <ChangesFeed
              changeType={changeType}
              onChangeTypeChange={setChangeType}
            />
          </ErrorBoundary>
        </TabsContent>

        <TabsContent value="tendencias">
          <ErrorBoundary FallbackComponent={TabErrorFallback}>
            <TrendsCharts
              stats={stats}
              startDate={startDate}
              endDate={endDate}
              onDateRangeChange={setDateRange}
            />
          </ErrorBoundary>
        </TabsContent>
      </Tabs>
    </div>
  )
}
