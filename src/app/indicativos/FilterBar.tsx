"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type { CallsignStats } from "@/types/callsign"
import { Search, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { MultiSelectFilter } from "./MultiSelectFilter"

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

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Pesquisar indicativo, nome, localidade..."
          value={searchInput}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-9 bg-white dark:bg-input/30"
        />
      </div>

      {/* Distrito */}
      <MultiSelectFilter
        label="Distrito"
        options={distritos.map((d) => ({ value: d, label: `${d} (${stats.byDistrito[d]})` }))}
        selected={filters.distrito}
        onChange={(v) => onFiltersChange({ ...filters, distrito: v })}
        className="w-full sm:w-44"
      />

      {/* Categoria */}
      <MultiSelectFilter
        label="Categoria"
        options={categorias.map((c) => ({ value: c, label: `${c} (${stats.byCategoria[c]})` }))}
        selected={filters.categoria}
        onChange={(v) => onFiltersChange({ ...filters, categoria: v })}
        className="w-full sm:w-44"
      />

      {/* Estado */}
      <MultiSelectFilter
        label="Estado"
        options={estados.map((e) => ({ value: e, label: `${e} (${stats.byEstado[e]})` }))}
        selected={filters.estado}
        onChange={(v) => onFiltersChange({ ...filters, estado: v })}
        className="w-full sm:w-40"
      />

      {/* Extra controls slot (e.g. date range for trends) */}
      {children}

      {/* Clear */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500">
          <X className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      )}
    </div>
  )
}
