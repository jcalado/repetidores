"use client"

import { fetchCategoryFlows } from "@/lib/callsigns"
import type { CategoryFlows as CategoryFlowsType } from "@/types/callsign"
import { Loader2 } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const CATEGORY_ORDER = ["3", "2", "1", "A", "B", "C"]

function formatReason(reason: string): string {
  if (reason === "added") return "Novo"
  if (reason === "removed") return "Removido"
  if (reason.startsWith("from_")) return `De Cat. ${reason.slice(5)}`
  if (reason.startsWith("to_")) return `Para Cat. ${reason.slice(3)}`
  return reason
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-")
  const date = new Date(Number(year), Number(m) - 1)
  return date.toLocaleDateString("pt-PT", { month: "short", year: "2-digit" })
}

export function CategoryFlows() {
  const [data, setData] = useState<CategoryFlowsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })
  const abortRef = useRef<AbortController | null>(null)

  const load = useCallback(async (month: string) => {
    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)
    try {
      const result = await fetchCategoryFlows(month)
      if (controller.signal.aborted) return
      setData(result)
    } catch (err) {
      if (controller.signal.aborted) return
      console.error("Failed to load category flows:", err)
      setError(err instanceof Error ? err.message : "Erro ao carregar dados")
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    load(selectedMonth)
    return () => abortRef.current?.abort()
  }, [selectedMonth, load])

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value)
  }

  const availableMonths = data?.availableMonths ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          Movimentos por categoria
        </h3>
        <select
          value={selectedMonth}
          onChange={handleMonthChange}
          disabled={loading && availableMonths.length === 0}
          className="rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {availableMonths.length > 0 ? (
            availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonth(m)}
              </option>
            ))
          ) : (
            <option value={selectedMonth}>{formatMonth(selectedMonth)}</option>
          )}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar movimentos...
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-12 text-red-500 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORY_ORDER.map((cat) => {
            const catData = data.categories[cat]
            const entering = catData?.entering ?? []
            const leaving = catData?.leaving ?? []
            const totalFlow = entering.length + leaving.length

            return (
              <div
                key={cat}
                className="rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Categoria {cat}
                  </h4>
                  {totalFlow > 0 && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                      {totalFlow}
                    </span>
                  )}
                </div>

                {totalFlow === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                    Sem alterações
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {/* Entering column */}
                    <div>
                      <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">
                        ↗ Entradas ({entering.length})
                      </p>
                      <div className="space-y-1">
                        {entering.length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">—</p>
                        ) : (
                          entering.map((entry) => (
                            <div key={entry.indicativo} className="text-xs">
                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                {entry.indicativo}
                              </span>
                              <span className="ml-1 text-slate-400 dark:text-slate-500">
                                {formatReason(entry.reason)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Leaving column */}
                    <div>
                      <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                        ↙ Saídas ({leaving.length})
                      </p>
                      <div className="space-y-1">
                        {leaving.length === 0 ? (
                          <p className="text-xs text-slate-400 dark:text-slate-500 italic">—</p>
                        ) : (
                          leaving.map((entry) => (
                            <div
                              key={entry.indicativo}
                              className={`text-xs ${
                                entry.flagged
                                  ? "bg-red-50 dark:bg-red-950/30 border-l-2 border-red-400 pl-1.5"
                                  : ""
                              }`}
                            >
                              <span className="font-medium text-slate-700 dark:text-slate-200">
                                {entry.flagged && (
                                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500 mr-1 align-middle" />
                                )}
                                {entry.indicativo}
                              </span>
                              <span className="ml-1 text-slate-400 dark:text-slate-500">
                                {formatReason(entry.reason)}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
