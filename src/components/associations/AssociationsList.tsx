"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("search")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="text-sm text-muted-foreground">
          {t("resultsCount", {
            shown: sortedAssociations.length,
            total: associations.length,
          })}
        </p>
      )}

      {/* Grid */}
      {sortedAssociations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAssociations.map((association) => (
            <AssociationCard key={association.id} association={association} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p>{t("noResults")}</p>
        </div>
      )}
    </div>
  )
}
