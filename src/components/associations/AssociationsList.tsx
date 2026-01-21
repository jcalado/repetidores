"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Search, Radio, SlidersHorizontal } from "lucide-react"
import { AssociationCard } from "./AssociationCard"
import type { Association } from "@/lib/associations"

interface AssociationsListProps {
  associations: Association[]
}

export function AssociationsList({ associations }: AssociationsListProps) {
  const t = useTranslations("associations")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredAssociations = useMemo(() => {
    if (!searchQuery.trim()) {
      return associations
    }

    const query = searchQuery.toLowerCase().trim()
    return associations.filter(
      (assoc) =>
        assoc.name.toLowerCase().includes(query) ||
        assoc.abbreviation.toLowerCase().includes(query)
    )
  }, [associations, searchQuery])

  // Sort by name
  const sortedAssociations = useMemo(() => {
    return [...filteredAssociations].sort((a, b) =>
      a.name.localeCompare(b.name, "pt")
    )
  }, [filteredAssociations])

  // Stats for the header
  const totalRepeaters = useMemo(() => {
    return associations.reduce((sum, a) => sum + (a.repeaterCount ?? 0), 0)
  }, [associations])

  return (
    <div className="space-y-8">
      {/* Search and Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ship-cove-400" />
          <Input
            type="search"
            placeholder={t("search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white dark:bg-ship-cove-950 border-ship-cove-200 dark:border-ship-cove-800 focus:border-ship-cove-400 focus:ring-ship-cove-400/20 placeholder:text-ship-cove-400"
          />
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ship-cove-100 dark:bg-ship-cove-900/50 text-ship-cove-700 dark:text-ship-cove-300 font-medium">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="tabular-nums">{sortedAssociations.length}</span>
            <span className="text-ship-cove-500 dark:text-ship-cove-500">/</span>
            <span className="tabular-nums">{associations.length}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
            <Radio className="h-3.5 w-3.5" />
            <span className="tabular-nums">{totalRepeaters}</span>
            <span className="text-emerald-600/70 dark:text-emerald-500/70">repetidores</span>
          </div>
        </div>
      </div>

      {/* Results count when searching */}
      {searchQuery && (
        <p className="text-sm text-ship-cove-600 dark:text-ship-cove-400 -mt-4">
          {t("resultsCount", {
            shown: sortedAssociations.length,
            total: associations.length,
          })}
        </p>
      )}

      {/* Grid */}
      {sortedAssociations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {sortedAssociations.map((association, index) => (
            <AssociationCard
              key={association.id}
              association={association}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-ship-cove-100 dark:bg-ship-cove-900/50 flex items-center justify-center mb-4">
            <Search className="h-8 w-8 text-ship-cove-400" />
          </div>
          <p className="text-lg font-medium text-ship-cove-700 dark:text-ship-cove-300 mb-1">
            {t("noResults")}
          </p>
          <p className="text-sm text-ship-cove-500">
            Tente pesquisar por outro termo
          </p>
        </div>
      )}
    </div>
  )
}
