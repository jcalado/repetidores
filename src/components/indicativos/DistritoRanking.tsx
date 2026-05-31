"use client"

import type { DistritoStats } from "@/types/distrito-stats"
import { useState } from "react"
import { ArrowUpDown } from "lucide-react"

type SortKey = "distrito" | "total" | "active" | "pct"
type SortDir = "asc" | "desc"

interface DistritoRankingProps {
  data: DistritoStats[]
  highlightedDistrito: string | null
  onHover: (distrito: string | null) => void
}

export function DistritoRanking({ data, highlightedDistrito, onHover }: DistritoRankingProps) {
  const [sortKey, setSortKey] = useState<SortKey>("total")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const sorted = [...data].sort((a, b) => {
    const pctA = a.total > 0 ? a.active / a.total : 0
    const pctB = b.total > 0 ? b.active / b.total : 0
    let cmp = 0
    switch (sortKey) {
      case "distrito": cmp = a.distrito.localeCompare(b.distrito, "pt"); break
      case "total": cmp = a.total - b.total; break
      case "active": cmp = a.active - b.active; break
      case "pct": cmp = pctA - pctB; break
    }
    return sortDir === "asc" ? cmp : -cmp
  })

  const SortHeader = ({ label, field }: { label: string; field: SortKey }) => (
    <button
      onClick={() => toggleSort(field)}
      className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-foreground transition-colors"
    >
      {label}
      <ArrowUpDown className="h-3 w-3 opacity-40" />
      {sortKey === field && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
    </button>
  )

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="overflow-y-auto max-h-[500px]">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-muted">
            <tr>
              <th className="text-left px-3 py-2"><SortHeader label="Distrito" field="distrito" /></th>
              <th className="text-right px-3 py-2"><SortHeader label="Total" field="total" /></th>
              <th className="text-right px-3 py-2"><SortHeader label="Activos" field="active" /></th>
              <th className="text-right px-3 py-2"><SortHeader label="%" field="pct" /></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr
                key={row.distrito}
                onMouseEnter={() => onHover(row.distrito)}
                onMouseLeave={() => onHover(null)}
                className={`border-t border-border transition-colors cursor-default ${
                  highlightedDistrito === row.distrito
                    ? "bg-azulejo-50 dark:bg-azulejo-950/30"
                    : "hover:bg-accent"
                }`}
              >
                <td className="px-3 py-1.5 font-medium text-foreground">{row.distrito}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{row.total.toLocaleString("pt-PT")}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{row.active.toLocaleString("pt-PT")}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {row.total > 0 ? `${((row.active / row.total) * 100).toFixed(1)}%` : "\u2014"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
