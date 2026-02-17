"use client"

import { fetchCallsignTrends } from "@/lib/callsigns"
import type { CallsignStats, CallsignTrends } from "@/types/callsign"
import { useCallback, useEffect, useRef, useState } from "react"
import { type CallsignFilters, EMPTY_CALLSIGN_FILTERS, FilterBar } from "./FilterBar"
import { type DateRange, TrendsDateFilter } from "./TrendsDateFilter"
import { Loader2 } from "lucide-react"
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

function formatMonth(month: string): string {
  const [year, m] = month.split("-")
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
}

const CATEGORIA_COLORS = [
  "#6366f1", // indigo
  "#0ea5e9", // sky
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#14b8a6", // teal
]

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-4">{title}</h3>
      {children}
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 shadow-md text-xs">
      <p className="font-medium text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: <span className="font-semibold">{entry.value?.toLocaleString("pt-PT")}</span>
        </p>
      ))}
    </div>
  )
}

interface TrendsChartsProps {
  stats: CallsignStats
}

export function TrendsCharts({ stats }: TrendsChartsProps) {
  const [trends, setTrends] = useState<CallsignTrends | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CallsignFilters>(EMPTY_CALLSIGN_FILTERS)
  const [dateRange, setDateRange] = useState<DateRange>({})
  const dateFilterResetRef = useRef<{ reset: () => void } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const hasAny =
        dateRange.startDate || dateRange.endDate ||
        filters.distrito.length > 0 || filters.categoria.length > 0 || filters.estado.length > 0 || filters.search
      const data = await fetchCallsignTrends(hasAny ? {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        distrito: filters.distrito.length > 0 ? filters.distrito.join(",") : undefined,
        categoria: filters.categoria.length > 0 ? filters.categoria.join(",") : undefined,
        estado: filters.estado.length > 0 ? filters.estado.join(",") : undefined,
        search: filters.search || undefined,
      } : undefined)
      setTrends(data)
    } catch (err) {
      console.error("Failed to load trends:", err)
    } finally {
      setLoading(false)
    }
  }, [filters, dateRange])

  useEffect(() => {
    load()
  }, [load])

  const hasDateFilter = !!(dateRange.startDate || dateRange.endDate)

  const handleClearAll = useCallback(() => {
    setFilters(EMPTY_CALLSIGN_FILTERS)
    setDateRange({})
    dateFilterResetRef.current?.reset()
  }, [])

  const filterBar = (
    <FilterBar
      stats={stats}
      filters={filters}
      onFiltersChange={setFilters}
      hasExtraFilters={hasDateFilter}
      onClear={handleClearAll}
    >
      <TrendsDateFilter value={dateRange} onChange={setDateRange} resetRef={dateFilterResetRef} />
    </FilterBar>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        {filterBar}
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar tendências...
        </div>
      </div>
    )
  }

  if (!trends || trends.monthly.length === 0) {
    return (
      <div className="space-y-6">
        {filterBar}
        <div className="text-center py-12 text-slate-400">
          Ainda não existem dados suficientes para mostrar tendências.
          <br />
          <span className="text-xs">Os dados acumulam-se com as sincronizações diárias.</span>
        </div>
      </div>
    )
  }

  const monthlyData = trends.monthly.map((m) => ({
    ...m,
    month: formatMonth(m.month),
    net: m.added - m.removed,
  }))

  const cumulativeData = trends.cumulative.map((c) => ({
    ...c,
    month: formatMonth(c.month),
  }))

  const categoriaData = Object.entries(trends.byCategoria)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      {filterBar}

      {/* Total callsigns over time */}
      <ChartCard title="Total de indicativos ao longo do tempo">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-slate-500"
                tickFormatter={(v) => v.toLocaleString("pt-PT")}
              />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#totalGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Monthly changes bar chart */}
      <ChartCard title="Alterações mensais por tipo">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-slate-500" />
              <YAxis tick={{ fontSize: 12 }} className="text-slate-500" />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="added" name="Novos" fill="#10b981" radius={[2, 2, 0, 0]} />
              <Bar dataKey="removed" name="Removidos" fill="#ef4444" radius={[2, 2, 0, 0]} />
              <Bar dataKey="modified" name="Alterados" fill="#6366f1" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ChartCard>

      {/* Bottom row: pie chart + net change */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Categoria distribution */}
        <ChartCard title="Distribuição por categoria">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoriaData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={50}
                  paddingAngle={2}
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {categoriaData.map((_, i) => (
                    <Cell key={i} fill={CATEGORIA_COLORS[i % CATEGORIA_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Net monthly change */}
        <ChartCard title="Variação líquida mensal (novos − removidos)">
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} className="text-slate-500" />
                <YAxis tick={{ fontSize: 12 }} className="text-slate-500" />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="net" name="Variação" radius={[2, 2, 0, 0]}>
                  {monthlyData.map((entry, i) => (
                    <Cell key={i} fill={entry.net >= 0 ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}
