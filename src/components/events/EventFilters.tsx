"use client";

/**
 * EventFilters component - search, filters, and controls for events
 */

import { useCallback, useRef } from "react";
import {
  Download,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EventSubmitDialog from "@/components/EventSubmitDialog";
import { downloadMultipleICS } from "@/lib/calendar";
import { getTagColors, getTagIcon } from "./utils/tagColors";
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
    <Card className="rounded-2xl mb-6">
      <CardContent className="p-4 space-y-4">
        {/* Search and Controls Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input with Icon */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder={t("searchPlaceholder")}
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              className="pl-9 h-10"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <Select
            value={filters.sort}
            onValueChange={(value) =>
              onFilterChange({ sort: value as SortOption })
            }
          >
            <SelectTrigger className="w-full sm:w-[160px] h-10">
              <SelectValue placeholder={t("sortBy")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startAsc">{t("soonestFirst")}</SelectItem>
              <SelectItem value="startDesc">{t("latestFirst")}</SelectItem>
              <SelectItem value="title">{t("titleAZ")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleExportFiltered}
                disabled={filteredEvents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {hasActiveFilters
                  ? t("exportFiltered") || "Exportar filtrados"
                  : t("exportVisible") || "Exportar visíveis"}{" "}
                ({filteredEvents.length})
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportAll}
                disabled={allEvents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                {t("exportAll") || "Exportar todos"} ({allEvents.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Submit Event Button */}
          <EventSubmitDialog />

          {/* Refresh Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="h-10 w-10 shrink-0"
            title={t("refresh")}
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>
        </div>

        {/* Combined Filter: Category + Tag */}
        <div className="flex flex-col gap-3">
          {/* Category Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-thin">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              {t("scope") || "Âmbito"}:
            </span>
            <button
              onClick={() => onFilterChange({ category: "all" })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                filters.category === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("allCategories") || "Todos"}
            </button>
            <button
              onClick={() => onFilterChange({ category: "international" })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                filters.category === "international"
                  ? "bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              <Globe2 className="w-4 h-4" />
              {t("international") || "Internacional"}
            </button>
            <button
              onClick={() => onFilterChange({ category: "national" })}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                filters.category === "national"
                  ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800"
                  : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              <MapPin className="w-4 h-4" />
              {t("national") || "Nacional"}
            </button>
          </div>

          {/* Tag Filter Chips */}
          {tags.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mb-1 scrollbar-thin">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">
                {t("type") || "Tipo"}:
              </span>
              <button
                onClick={() => onFilterChange({ tag: "all" })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  filters.tag === "all"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("allTags")}
              </button>
              {tags.map((tag) => {
                const colors = getTagColors(tag);
                const TagIcon = getTagIcon(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onFilterChange({ tag })}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border whitespace-nowrap ${
                      filters.tag === tag
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-transparent"
                    }`}
                  >
                    <TagIcon
                      className={`w-4 h-4 ${filters.tag === tag ? "" : colors.icon}`}
                    />
                    {tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Results Count and Clear Filters */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <span className="text-sm text-muted-foreground">
            {filteredCount === 1
              ? t("resultsCountSingular")
              : t("resultsCount", { count: filteredCount })}
          </span>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              {t("clearFilters")}
            </button>
          )}
        </div>

        {/* Keyboard hint */}
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground pt-1">
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">
              /
            </kbd>{" "}
            {t("focusSearch") || "Pesquisar"}
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">
              Esc
            </kbd>{" "}
            {t("clearFiltersShort") || "Limpar"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default EventFilters;
