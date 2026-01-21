"use client";

/**
 * EventFilters component - Clean, inline filter bar
 * Shows search, filters, and actions in a streamlined layout
 */

import { useCallback, useRef } from "react";
import {
  ArrowDownAZ,
  ArrowUpDown,
  Calendar,
  Download,
  Globe2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EventSubmitDialog from "@/components/EventSubmitDialog";
import { downloadMultipleICS } from "@/lib/calendar";
import { getTagColors, getTagIcon, getTagIconBg } from "./utils/tagColors";
import type { EventItem, FilterState, SortOption, TranslationFunction } from "./types";

interface EventFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  tags: string[];
  filteredCount: number;
  allEvents: EventItem[];
  filteredEvents: EventItem[];
  isRefreshing: boolean;
  onRefresh: () => void;
  t: TranslationFunction;
}

export function EventFilters({
  filters,
  onFilterChange,
  tags,
  filteredCount,
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

  const clearFilters = useCallback(() => {
    onFilterChange({
      search: "",
      tag: "all",
      category: "all",
    });
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

  return (
    <div className="space-y-4 mb-8">
      {/* Search and actions row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-ship-cove-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t("searchPlaceholder") || "Pesquisar eventos..."}
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="w-full h-12 pl-12 pr-12 rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 bg-white dark:bg-ship-cove-950/50 text-ship-cove-900 dark:text-ship-cove-100 placeholder:text-ship-cove-400 dark:placeholder:text-ship-cove-500 focus:outline-none focus:ring-2 focus:ring-ship-cove-500/20 focus:border-ship-cove-400 dark:focus:border-ship-cove-600 transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: "" })}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-6 w-6 flex items-center justify-center rounded-full bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-500 dark:text-ship-cove-400 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="h-12 px-4 gap-2 border-ship-cove-200 dark:border-ship-cove-800 bg-white dark:bg-ship-cove-950/50"
              >
                <ArrowUpDown className="h-4 w-4" />
                <span className="hidden sm:inline">{t("sortBy") || "Ordenar"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => onFilterChange({ sort: "startAsc" })}
                className={filters.sort === "startAsc" ? "bg-ship-cove-100 dark:bg-ship-cove-800" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("soonestFirst") || "Mais próximos"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ sort: "startDesc" })}
                className={filters.sort === "startDesc" ? "bg-ship-cove-100 dark:bg-ship-cove-800" : ""}
              >
                <Calendar className="h-4 w-4 mr-2" />
                {t("latestFirst") || "Mais distantes"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onFilterChange({ sort: "title" })}
                className={filters.sort === "title" ? "bg-ship-cove-100 dark:bg-ship-cove-800" : ""}
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
                className="h-12 w-12 border-ship-cove-200 dark:border-ship-cove-800 bg-white dark:bg-ship-cove-950/50"
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
            className="h-12 w-12 border-ship-cove-200 dark:border-ship-cove-800 bg-white dark:bg-ship-cove-950/50"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>

          {/* Submit event */}
          <div className="hidden sm:block">
            <EventSubmitDialog />
          </div>
        </div>
      </div>

      {/* Filter chips row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Category filters */}
        <div className="flex items-center gap-1.5 mr-2">
          <span className="text-xs font-medium text-ship-cove-500 dark:text-ship-cove-400 uppercase tracking-wider mr-1">
            {t("scope") || "Âmbito"}:
          </span>
          <FilterChip
            isActive={filters.category === "all"}
            onClick={() => onFilterChange({ category: "all" })}
            label={t("allCategories") || "Todos"}
          />
          <FilterChip
            isActive={filters.category === "international"}
            onClick={() => onFilterChange({ category: "international" })}
            label={t("international") || "Internacional"}
            icon={<Globe2 className="w-3.5 h-3.5" />}
            activeClass="bg-sky-500 text-white border-sky-500"
          />
          <FilterChip
            isActive={filters.category === "national"}
            onClick={() => onFilterChange({ category: "national" })}
            label={t("national") || "Nacional"}
            icon={<MapPin className="w-3.5 h-3.5" />}
            activeClass="bg-emerald-500 text-white border-emerald-500"
          />
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-6 bg-ship-cove-200 dark:bg-ship-cove-800" />

        {/* Tag filters */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-ship-cove-500 dark:text-ship-cove-400 uppercase tracking-wider mr-1">
              {t("type") || "Tipo"}:
            </span>
            <FilterChip
              isActive={filters.tag === "all"}
              onClick={() => onFilterChange({ tag: "all" })}
              label={t("allTags") || "Todos"}
            />
            {tags.map((tag) => {
              const colors = getTagColors(tag);
              const TagIcon = getTagIcon(tag);
              const iconBgClass = getTagIconBg(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onFilterChange({ tag })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    filters.tag === tag
                      ? `${iconBgClass} text-white shadow-sm`
                      : "bg-ship-cove-100 dark:bg-ship-cove-800/50 text-ship-cove-600 dark:text-ship-cove-400 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-800"
                  }`}
                >
                  <TagIcon className="w-3.5 h-3.5" />
                  {tag}
                </button>
              );
            })}
          </div>
        )}

        {/* Clear filters & results count */}
        <div className="flex items-center gap-3 ml-auto">
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-ship-cove-600 dark:text-ship-cove-400 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/50 transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t("clearFilters") || "Limpar"}
            </button>
          )}
          <span className="text-sm text-ship-cove-500 dark:text-ship-cove-400 tabular-nums">
            {filteredCount} {filteredCount === 1 ? (t("event") || "evento") : (t("events") || "eventos")}
          </span>
        </div>
      </div>

      {/* Mobile: Submit event */}
      <div className="sm:hidden">
        <EventSubmitDialog />
      </div>
    </div>
  );
}

function FilterChip({
  isActive,
  onClick,
  label,
  icon,
  activeClass = "bg-ship-cove-600 text-white border-ship-cove-600",
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
        isActive
          ? activeClass
          : "bg-ship-cove-100 dark:bg-ship-cove-800/50 text-ship-cove-600 dark:text-ship-cove-400 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-800"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default EventFilters;
