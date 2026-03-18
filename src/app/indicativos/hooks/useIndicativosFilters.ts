"use client"

import { useCallback, useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { CallsignFilters } from "../FilterBar"

const VALID_TABS = ["indicativos", "alteracoes", "tendencias"] as const
type Tab = (typeof VALID_TABS)[number]

function isValidTab(value: string | null): value is Tab {
  return VALID_TABS.includes(value as Tab)
}

function parseCommaSeparated(value: string | null): string[] {
  if (!value) return []
  return value.split(",").filter(Boolean)
}

function toCommaSeparated(arr: string[]): string | undefined {
  return arr.length > 0 ? arr.join(",") : undefined
}

export interface IndicativosFilterState {
  tab: Tab
  filters: CallsignFilters
  page: number
  changeType: string
  startDate: string
  endDate: string
}

export function useIndicativosFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize state from URL params
  const [state, setStateInternal] = useState<IndicativosFilterState>(() => {
    const tabParam = searchParams.get("tab")
    return {
      tab: isValidTab(tabParam) ? tabParam : "indicativos",
      filters: {
        search: searchParams.get("search") || "",
        distrito: parseCommaSeparated(searchParams.get("distrito")),
        categoria: parseCommaSeparated(searchParams.get("categoria")),
        estado: parseCommaSeparated(searchParams.get("estado")),
        concelho: parseCommaSeparated(searchParams.get("concelho")),
      },
      page: Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1),
      changeType: searchParams.get("changeType") || "",
      startDate: searchParams.get("startDate") || "",
      endDate: searchParams.get("endDate") || "",
    }
  })

  // Sync state → URL (with URL-comparison guard to prevent loops)
  // Follows the same pattern as src/components/events/hooks/useFilterState.ts
  // Seed with current URL to avoid a spurious router.replace on first render
  const currentQs = searchParams.toString()
  const currentUrl = currentQs ? `${pathname}?${currentQs}` : pathname
  const lastUrlRef = useRef<string>(currentUrl)
  useEffect(() => {
    const params = new URLSearchParams()
    if (state.tab !== "indicativos") params.set("tab", state.tab)
    if (state.filters.search) params.set("search", state.filters.search)
    const distrito = toCommaSeparated(state.filters.distrito)
    if (distrito) params.set("distrito", distrito)
    const categoria = toCommaSeparated(state.filters.categoria)
    if (categoria) params.set("categoria", categoria)
    const estado = toCommaSeparated(state.filters.estado)
    if (estado) params.set("estado", estado)
    const concelho = toCommaSeparated(state.filters.concelho)
    if (concelho) params.set("concelho", concelho)
    if (state.page > 1) params.set("page", String(state.page))
    if (state.changeType) params.set("changeType", state.changeType)
    if (state.startDate) params.set("startDate", state.startDate)
    if (state.endDate) params.set("endDate", state.endDate)

    const queryString = params.toString()
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname

    // Only update if URL actually changed (prevents infinite loops)
    if (newUrl !== lastUrlRef.current) {
      lastUrlRef.current = newUrl
      router.replace(newUrl, { scroll: false })
    }
  }, [state, pathname, router])

  const setTab = useCallback((tab: string) => {
    if (isValidTab(tab)) {
      setStateInternal((prev) => ({ ...prev, tab, page: 1 }))
    }
  }, [])

  const setFilters = useCallback((filters: CallsignFilters) => {
    setStateInternal((prev) => ({ ...prev, filters, page: 1 }))
  }, [])

  const setPage = useCallback((page: number) => {
    setStateInternal((prev) => ({ ...prev, page }))
  }, [])

  const setChangeType = useCallback((changeType: string) => {
    setStateInternal((prev) => ({ ...prev, changeType }))
  }, [])

  const setDateRange = useCallback((startDate: string, endDate: string) => {
    setStateInternal((prev) => ({ ...prev, startDate, endDate }))
  }, [])

  return {
    ...state,
    setTab,
    setFilters,
    setPage,
    setChangeType,
    setDateRange,
  }
}
