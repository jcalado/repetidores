"use client"

import { Input } from "@/components/ui/input"
import type { CallsignStats } from "@/types/callsign"
import { Search, X, MapPin, Tag, ShieldCheck } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { FacetedFilter } from "./FacetedFilter"

export interface CallsignFilters {
  search: string
  distrito: string[]
  categoria: string[]
  estado: string[]
}

export const EMPTY_CALLSIGN_FILTERS: CallsignFilters = {
  search: "",
  distrito: [],
  categoria: [],
  estado: [],
}

interface FilterBarProps {
  stats: CallsignStats
  filters: CallsignFilters
  onFiltersChange: (filters: CallsignFilters) => void
  /** Extra controls rendered after the core filters (e.g. date range) */
  children?: React.ReactNode
  /** Override the clear action (e.g. to also clear date filters) */
  onClear?: () => void
  /** Whether extra (non-callsign) filters are active, affects clear button visibility */
  hasExtraFilters?: boolean
}

export function FilterBar({ stats, filters, onFiltersChange, children, onClear, hasExtraFilters }: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(filters.search)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const distritos = Object.keys(stats.byDistrito).sort()
  const categorias = Object.keys(stats.byCategoria).sort()
  const estados = Object.keys(stats.byEstado).sort()

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value)
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        onFiltersChange({ ...filters, search: value })
      }, 300)
    },
    [filters, onFiltersChange],
  )

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const hasActiveFilters =
    filters.search || filters.distrito.length > 0 || filters.categoria.length > 0 || filters.estado.length > 0 || hasExtraFilters

  const clearFilters = () => {
    setSearchInput("")
    if (onClear) {
      onClear()
    } else {
      onFiltersChange(EMPTY_CALLSIGN_FILTERS)
    }
  }

  // Collect active chip entries for the chip strip
  const activeChips: { key: string; label: string; onRemove: () => void }[] = []
  for (const d of filters.distrito) {
    activeChips.push({
      key: `d-${d}`,
      label: d,
      onRemove: () => onFiltersChange({ ...filters, distrito: filters.distrito.filter((v) => v !== d) }),
    })
  }
  for (const c of filters.categoria) {
    activeChips.push({
      key: `c-${c}`,
      label: `Cat. ${c}`,
      onRemove: () => onFiltersChange({ ...filters, categoria: filters.categoria.filter((v) => v !== c) }),
    })
  }
  for (const e of filters.estado) {
    activeChips.push({
      key: `e-${e}`,
      label: e,
      onRemove: () => onFiltersChange({ ...filters, estado: filters.estado.filter((v) => v !== e) }),
    })
  }

  return (
    <div className="space-y-2">
      {/* Main filter row */}
      <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center flex-wrap">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input
            placeholder="Pesquisar indicativo, nome..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9 h-8 text-sm bg-white dark:bg-white/5 border-slate-200 dark:border-slate-700"
          />
        </div>

        {/* Separator */}
        <div className="hidden sm:block h-5 w-px bg-slate-200 dark:bg-slate-700" />

        {/* Faceted Filters */}
        <FacetedFilter
          icon={<MapPin />}
          title="Distrito"
          options={distritos.map((d) => ({ value: d, label: d, count: stats.byDistrito[d] }))}
          selected={filters.distrito}
          onChange={(v) => onFiltersChange({ ...filters, distrito: v })}
        />

        <FacetedFilter
          icon={<Tag />}
          title="Categoria"
          options={categorias.map((c) => ({ value: c, label: `Categoria ${c}`, count: stats.byCategoria[c] }))}
          selected={filters.categoria}
          onChange={(v) => onFiltersChange({ ...filters, categoria: v })}
        />

        <FacetedFilter
          icon={<ShieldCheck />}
          title="Estado"
          options={estados.map((e) => ({ value: e, label: e, count: stats.byEstado[e] }))}
          selected={filters.estado}
          onChange={(v) => onFiltersChange({ ...filters, estado: v })}
        />

        {/* Extra controls slot (e.g. date range for trends) */}
        {children}

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 h-8 px-2 rounded-md text-xs text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
            Limpar tudo
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1 h-6 pl-2 pr-1 rounded-md text-xs font-medium bg-ship-cove-50 dark:bg-ship-cove-950/40 text-ship-cove-700 dark:text-ship-cove-300 border border-ship-cove-200 dark:border-ship-cove-800/60"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="inline-flex items-center justify-center h-4 w-4 rounded hover:bg-ship-cove-200 dark:hover:bg-ship-cove-800 transition-colors"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
