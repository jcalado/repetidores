"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  Filter,
  Globe2,
  MapPin,
  RefreshCw,
  Search,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search.trim()) count++;
    if (filters.category !== "all") count++;
    if (filters.tag !== "all") count++;
    return count;
  }, [filters.search, filters.category, filters.tag]);

  return (
    <Card className="rounded-xl border shadow-sm bg-card mb-6">
      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        {/* Header row - always visible */}
        <div className="p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={searchInputRef}
                placeholder={t("searchPlaceholder")}
                value={filters.search}
                onChange={(e) => onFilterChange({ search: e.target.value })}
                className="pl-9 pr-9 h-10 bg-background"
              />
              {filters.search && (
                <button
                  onClick={() => onFilterChange({ search: "" })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
                  aria-label={t("clearSearch") || "Clear search"}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant={activeFiltersCount > 0 ? "default" : "outline"}
                  className="h-10 gap-2"
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("filters")}</span>
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="h-5 min-w-5 px-1.5 text-xs bg-background/20"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                  {filtersOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleExportFiltered} disabled={filteredEvents.length === 0}>
                    {t("exportVisible")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportAll} disabled={allEvents.length === 0}>
                    {t("exportAll")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="outline"
                size="icon"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="h-10 w-10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>

              <div className="hidden sm:block">
                <EventSubmitDialog />
              </div>
            </div>
          </div>

          {/* Mobile: EventSubmitDialog on its own row */}
          <div className="sm:hidden mt-3">
            <EventSubmitDialog />
          </div>
        </div>

        {/* Expanded filters panel */}
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-3 sm:px-4 space-y-4">
            {/* Filter sections */}
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Scope filter */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm mb-2.5">
                  <Globe2 className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{t("scope") || "Âmbito"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
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
                    activeClass="bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 border-sky-300 dark:border-sky-700"
                  />
                  <FilterChip
                    isActive={filters.category === "national"}
                    onClick={() => onFilterChange({ category: "national" })}
                    label={t("national") || "Nacional"}
                    icon={<MapPin className="w-3.5 h-3.5" />}
                    activeClass="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700"
                  />
                </div>
              </div>

              {/* Tags filter */}
              {tags.length > 0 && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center gap-2 text-sm mb-2.5">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{t("type") || "Tipo"}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <FilterChip
                      isActive={filters.tag === "all"}
                      onClick={() => onFilterChange({ tag: "all" })}
                      label={t("allTags")}
                    />
                    {tags.map((tag) => {
                      const colors = getTagColors(tag);
                      const TagIcon = getTagIcon(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => onFilterChange({ tag })}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
                            filters.tag === tag
                              ? `${colors.bg} ${colors.text} ${colors.border} shadow-sm`
                              : "bg-background hover:bg-muted text-muted-foreground border-border hover:border-muted-foreground/30"
                          }`}
                        >
                          <TagIcon className={`w-3.5 h-3.5 ${filters.tag === tag ? "" : "opacity-70"}`} />
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom bar: results count, sort, and clear */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {filteredCount === 1
                    ? t("resultsCountSingular")
                    : t("resultsCount", { count: filteredCount })}
                </span>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                    {t("clearFilters")}
                  </button>
                )}
              </div>

              <Select
                value={filters.sort}
                onValueChange={(value) => onFilterChange({ sort: value as SortOption })}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-sm">
                  <SelectValue placeholder={t("sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startAsc">{t("soonestFirst")}</SelectItem>
                  <SelectItem value="startDesc">{t("latestFirst")}</SelectItem>
                  <SelectItem value="title">{t("titleAZ")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

function FilterChip({
  isActive,
  onClick,
  label,
  icon,
  activeClass = "bg-primary text-primary-foreground shadow-sm"
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
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
        isActive
          ? activeClass
          : "bg-background hover:bg-muted text-muted-foreground border-border hover:border-muted-foreground/30"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export default EventFilters;
