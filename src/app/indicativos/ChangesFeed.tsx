"use client"

import { Button } from "@/components/ui/button"
import { fetchCallsignChanges } from "@/lib/callsigns"
import type { CallsignChange } from "@/types/callsign"
import { ArrowRight, Loader2, Plus, Minus, Pencil } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

const CHANGE_TYPE_CONFIG = {
  added: {
    label: "novo",
    icon: Plus,
    iconBgClass: "bg-emerald-100 dark:bg-emerald-900/40",
    iconTextClass: "text-emerald-600 dark:text-emerald-400",
    labelClass: "text-emerald-600 dark:text-emerald-400",
  },
  removed: {
    label: "removido",
    icon: Minus,
    iconBgClass: "bg-red-100 dark:bg-red-900/40",
    iconTextClass: "text-red-600 dark:text-red-400",
    labelClass: "text-red-600 dark:text-red-400",
  },
  modified: {
    label: "alterado",
    icon: Pencil,
    iconBgClass: "bg-blue-100 dark:bg-blue-900/40",
    iconTextClass: "text-blue-600 dark:text-blue-400",
    labelClass: "text-blue-600 dark:text-blue-400",
  },
}

const FILTER_OPTIONS = [
  { value: "", label: "Todos" },
  { value: "added", label: "Novos" },
  { value: "removed", label: "Removidos" },
  { value: "modified", label: "Alterados" },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function ChangeEntry({ change }: { change: CallsignChange }) {
  const config = CHANGE_TYPE_CONFIG[change.changeType]
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
      <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded ${config.iconBgClass}`}>
        <Icon className={`h-3.5 w-3.5 ${config.iconTextClass}`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm text-ship-cove-700 dark:text-ship-cove-400">
            {change.indicativo}
          </span>
          <span className={`text-xs font-medium ${config.labelClass}`}>
            {config.label}
          </span>
        </div>
        {change.changedFields && change.changedFields.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {change.changedFields.map((cf, i) => (
              <div key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 flex-wrap">
                <span className="font-medium text-slate-600 dark:text-slate-300 capitalize">
                  {cf.field}:
                </span>
                <span className="line-through text-red-400/70">{cf.from || "—"}</span>
                <ArrowRight className="h-2.5 w-2.5 text-slate-300 dark:text-slate-600 shrink-0" />
                <span className="text-emerald-600 dark:text-emerald-400">{cf.to || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <span className="text-xs text-slate-400 shrink-0 tabular-nums">{formatTime(change.detectedAt)}</span>
    </div>
  )
}

export function ChangesFeed() {
  const [changes, setChanges] = useState<CallsignChange[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState("")

  const loadChanges = useCallback(async (p: number, changeType: string) => {
    setLoading(true)
    try {
      const result = await fetchCallsignChanges({
        page: p,
        limit: 50,
        changeType: changeType || undefined,
      })
      if (p === 1) {
        setChanges(result.docs)
      } else {
        setChanges((prev) => [...prev, ...result.docs])
      }
      setTotalPages(result.totalPages)
    } catch (err) {
      console.error("Failed to load changes:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    setPage(1)
    loadChanges(1, filter)
  }, [filter, loadChanges])

  const loadMore = () => {
    const next = page + 1
    setPage(next)
    loadChanges(next, filter)
  }

  // Group changes by date
  const grouped = changes.reduce<Record<string, CallsignChange[]>>((acc, change) => {
    const dateKey = formatDate(change.detectedAt)
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(change)
    return acc
  }, {})

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTER_OPTIONS.map((opt) => (
          <Button
            key={opt.value}
            variant={filter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {loading && changes.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          A carregar alterações...
        </div>
      ) : changes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          Nenhuma alteração encontrada.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3">
                {date}
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-lg border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                {items.map((change) => (
                  <ChangeEntry key={change.id} change={change} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {page < totalPages && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                A carregar...
              </>
            ) : (
              "Carregar mais"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
