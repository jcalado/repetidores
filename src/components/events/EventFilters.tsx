"use client";

/**
 * EventFilters component - search + a single "Filtros" dropdown (Âmbito + Tipo) + actions.
 * All facet filters live in one dropdown so the page shows a single view switch, not stacked controls.
 */

import { useCallback, useRef } from "react";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Check,
  Download,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EventSubmitDialog from "@/components/EventSubmitDialog";
import { downloadMultipleICS } from "@/lib/calendar";
import { getTagIcon } from "./utils/tagColors";
import type { EventItem, FilterState, TranslationFunction } from "./types";

interface EventFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  tags: string[];
  allEvents: EventItem[];
  filteredEvents: EventItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
  t: TranslationFunction;
}

const SCOPE_OPTIONS = ["all", "international", "national"] as const;

export function EventFilters({
  filters,
  onFilterChange,
  tags,
  allEvents,
  filteredEvents,
  isRefreshing,
  onRefresh,
  t,
}: EventFiltersProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.tag !== "all" ||
    filters.category !== "all";

  // Active facet filters shown as a badge on the "Filtros" button (search has its own input).
  const facetCount =
    (filters.category !== "all" ? 1 : 0) + (filters.tag !== "all" ? 1 : 0);

  const clearFilters = useCallback(() => {
    onFilterChange({ search: "", tag: "all", category: "all" });
  }, [onFilterChange]);

  const handleExportFiltered = () => {
    if (filteredEvents.length === 0) return;
    const filename = hasActiveFilters
      ? "repetidores-eventos-filtrados"
      : "repetidores-eventos";
    downloadMultipleICS(filteredEvents, filename);
  };

  const handleExportAll = () => {
    if (allEvents.length === 0) return;
    downloadMultipleICS(allEvents, "repetidores-todos-eventos");
  };

  const scopeLabel = (value: (typeof SCOPE_OPTIONS)[number]) =>
    value === "all"
      ? t("allCategories") || "Todos"
      : value === "international"
        ? t("international") || "Internacional"
        : t("national") || "Nacional";

  return (
    <div className="space-y-4 mb-6">
      {/* Search and actions row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-azulejo-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t("searchPlaceholder") || "Pesquisar eventos..."}
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full h-12 pl-12 pr-12 rounded-xl border border-azulejo-200 dark:border-azulejo-800 bg-background dark:bg-azulejo-950/50 text-azulejo-900 dark:text-azulejo-100 placeholder:text-azulejo-400 dark:placeholder:text-azulejo-500 focus:outline-none focus:ring-2 focus:ring-azulejo-500/20 focus:border-azulejo-400 dark:focus:border-azulejo-600 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-azulejo-100 dark:bg-azulejo-800 text-azulejo-500 dark:text-azulejo-400 hover:bg-azulejo-200 dark:hover:bg-azulejo-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Filters dropdown (Âmbito + Tipo, collapsed into one control) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-4 gap-2 border-azulejo-200 dark:border-azulejo-800 bg-background dark:bg-azulejo-950/50"
              >
                <SlidersHorizontal className="h-4 w-4" />
                <span className="hidden sm:inline">{t("filters") || "Filtros"}</span>
                {facetCount > 0 && (
                  <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-azulejo-500 px-1 text-[11px] font-semibold text-white tabular-nums">
                    {facetCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{t("scope") || "Âmbito"}</DropdownMenuLabel>
              {SCOPE_OPTIONS.map((value) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => onFilterChange({ category: value })}
                >
                  <span>{scopeLabel(value)}</span>
                  {filters.category === value && (
                    <Check className="ml-auto h-4 w-4 text-azulejo-500" />
                  )}
                </DropdownMenuItem>
              ))}

              {tags.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel>{t("type") || "Tipo"}</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => onFilterChange({ tag: "all" })}>
                    <span>{t("allTags") || "Todos"}</span>
                    {filters.tag === "all" && (
                      <Check className="ml-auto h-4 w-4 text-azulejo-500" />
                    )}
                  </DropdownMenuItem>
                  {tags.map((tag) => {
                    const TagIcon = getTagIcon(tag);
                    return (
                      <DropdownMenuItem key={tag} onClick={() => onFilterChange({ tag })}>
                        <TagIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{tag}</span>
                        {filters.tag === tag && (
                          <Check className="ml-auto h-4 w-4 text-azulejo-500" />
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </>
              )}

              {hasActiveFilters && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={clearFilters}>
                    <X className="h-4 w-4" />
                    <span>{t("clearFilters") || "Limpar"}</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-4 gap-2 border-azulejo-200 dark:border-azulejo-800 bg-background dark:bg-azulejo-950/50"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{t("sortBy") || "Ordenar"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onFilterChange({ sort: "startAsc" })}
                className={filters.sort === "startAsc" ? "bg-azulejo-100 dark:bg-azulejo-800" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("soonestFirst") || "Mais próximos"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ sort: "startDesc" })}
                className={filters.sort === "startDesc" ? "bg-azulejo-100 dark:bg-azulejo-800" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("latestFirst") || "Mais distantes"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ sort: "title" })}
                className={filters.sort === "title" ? "bg-azulejo-100 dark:bg-azulejo-800" : ""}
              >
                <ArrowDownAZ className="h-4 w-4 mr-2" />
                {t("titleAZ") || "Título A-Z"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 border-azulejo-200 dark:border-azulejo-800 bg-background dark:bg-azulejo-950/50"
              >
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportFiltered} disabled={filteredEvents.length === 0}>
                {t("exportVisible") || "Exportar visíveis"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportAll} disabled={allEvents.length === 0}>
                {t("exportAll") || "Exportar todos"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-12 w-12 border-azulejo-200 dark:border-azulejo-800 bg-background dark:bg-azulejo-950/50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Submit event */}
          <div className="hidden sm:block">
            <EventSubmitDialog />
          </div>
        </div>
      </div>

      {/* Mobile: Submit event */}
      <div className="sm:hidden">
        <EventSubmitDialog />
      </div>
    </div>
  );
}

export default EventFilters;
