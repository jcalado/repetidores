"use client";

/**
 * Hook for managing filter state with URL synchronization
 */

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import type { FilterState, SortOption } from "../types";

const DEFAULT_FILTERS: FilterState = {
  search: "",
  tag: "all",
  category: "all",
  sort: "startAsc",
  view: "cards",
};

interface UseFilterStateOptions {
  /** Whether to sync state with URL (default: true) */
  syncToUrl?: boolean;
  /** Initial state overrides */
  initial?: Partial<FilterState>;
}

/**
 * Hook that manages filter state and optionally syncs to URL query params.
 * Enables shareable filter links.
 */
export function useFilterState(options: UseFilterStateOptions = {}) {
  const { syncToUrl = true, initial } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize from URL or defaults
  const [filters, setFiltersInternal] = useState<FilterState>(() => {
    if (syncToUrl && searchParams) {
      return {
        search: searchParams.get("q") || initial?.search || DEFAULT_FILTERS.search,
        tag: searchParams.get("tag") || initial?.tag || DEFAULT_FILTERS.tag,
        category: searchParams.get("cat") || initial?.category || DEFAULT_FILTERS.category,
        sort: (searchParams.get("sort") as SortOption) || initial?.sort || DEFAULT_FILTERS.sort,
        view: (searchParams.get("view") as FilterState["view"]) || initial?.view || DEFAULT_FILTERS.view,
      };
    }
    return { ...DEFAULT_FILTERS, ...initial };
  });

  // Sync to URL when filters change
  useEffect(() => {
    if (!syncToUrl) return;

    const params = new URLSearchParams();

    if (filters.search) params.set("q", filters.search);
    if (filters.tag !== "all") params.set("tag", filters.tag);
    if (filters.category !== "all") params.set("cat", filters.category);
    if (filters.sort !== "startAsc") params.set("sort", filters.sort);
    if (filters.view !== "cards") params.set("view", filters.view);

    const queryString = params.toString();
    const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Only update if URL actually changed
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [filters, pathname, router, searchParams, syncToUrl]);

  // Partial update function
  const setFilters = useCallback((updates: Partial<FilterState>) => {
    setFiltersInternal((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset to defaults
  const resetFilters = useCallback(() => {
    setFiltersInternal({ ...DEFAULT_FILTERS, ...initial });
  }, [initial]);

  // Check if any filter is active
  const hasActiveFilters =
    filters.search.trim() !== "" ||
    filters.tag !== "all" ||
    filters.category !== "all";

  return {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters,
  };
}

/**
 * Hook for keyboard shortcuts in the events page
 */
export function useKeyboardShortcuts(options: {
  onFocusSearch?: () => void;
  onClearFilters?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
}) {
  const { onFocusSearch, onClearFilters, onNextTab, onPrevTab } = options;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = e.target as HTMLElement;
      const isInputFocused =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      // "/" to focus search (only if not in input)
      if (e.key === "/" && !isInputFocused && onFocusSearch) {
        e.preventDefault();
        onFocusSearch();
      }

      // Escape to clear filters
      if (e.key === "Escape" && onClearFilters) {
        onClearFilters();
      }

      // Alt+Arrow for tab navigation
      if (e.altKey && e.key === "ArrowRight" && onNextTab) {
        e.preventDefault();
        onNextTab();
      }

      if (e.altKey && e.key === "ArrowLeft" && onPrevTab) {
        e.preventDefault();
        onPrevTab();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onFocusSearch, onClearFilters, onNextTab, onPrevTab]);
}

export default useFilterState;
