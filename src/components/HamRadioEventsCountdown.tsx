"use client";

/**
 * Ham Radio Events Countdown & Mini-Calendar (with Payload CMS API)
 * - Refactored to use modular components for better performance and maintainability
 * - Clean editorial design matching the news pages
 * - Next-up countdown + Cards + Table + Calendar tabs
 * - Fetches events from Payload CMS API
 * - Supports filtering, sorting, and searching
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  LayoutGrid,
  Loader2,
  Radio,
  Table as TableIcon,
  Trophy,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { StandardPageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslations } from "next-intl";
import { fetchEvents } from "@/lib/events";

// Import modular event components
import {
  TickProvider,
  EventCard,
  cardVariants,
  CurrentEvents,
  NextUpCard,
  EventsTable,
  EventFilters,
  CalendarView,
  useKeyboardShortcuts,
} from "@/components/events";
import type { EventItem, FilterState, SortOption } from "@/components/events";

// Re-export types for backwards compatibility
export type { EventItem };
export type { EventTag, EventCategory, DMRNetwork, EventFeaturedImage, EventsAPIResponse } from "@/components/events";

const ITEMS_PER_PAGE = 12;

// Skeleton components for loading states
function EventCardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-[16/10] w-full rounded-xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

function FilterSkeleton() {
  return (
    <div className="mb-8 space-y-4">
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
    </div>
  );
}

interface HamRadioEventsCountdownProps {
  initialEvents?: EventItem[];
}

export default function HamRadioEventsCountdown({
  initialEvents = [],
}: HamRadioEventsCountdownProps) {
  const t = useTranslations("events");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // State
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    tag: "all",
    category: "all",
    sort: "startAsc",
    view: "cards",
  });

  // Pagination state for infinite scroll
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cardsLoadMoreRef = useRef<HTMLDivElement>(null);
  const tableLoadMoreRef = useRef<HTMLDivElement>(null);

  // Refresh events from API
  const refreshEvents = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true);
    setFetchError(null);
    try {
      const response = await fetchEvents({ limit: 500, sort: "startAsc" });
      setEvents(response.docs);
    } catch {
      setFetchError("error");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Set mounted on client and fetch fresh events
  useEffect(() => {
    setMounted(true);
    refreshEvents(false);
  }, [refreshEvents]);

  // Extract unique tags
  const tags = useMemo(() => {
    const s = new Set<string>();
    events.forEach((e) => {
      if (e?.tag) s.add(e.tag);
    });
    return Array.from(s);
  }, [events]);

  // Filter events for cards/table view (future/current events only)
  const filtered = useMemo(() => {
    const now = Date.now();
    const q = filters.search.trim().toLowerCase();

    // Only show events that haven't ended yet
    let list = events.filter((e) => {
      const endTime = e.end
        ? new Date(e.end).getTime()
        : new Date(e.start).getTime();
      return endTime >= now;
    });

    // Apply tag filter
    if (filters.tag !== "all") {
      list = list.filter(
        (e) => (e.tag ?? "").toLowerCase() === filters.tag.toLowerCase()
      );
    }

    // Apply category filter
    if (filters.category !== "all") {
      list = list.filter(
        (e) =>
          (e.category ?? "").toLowerCase() === filters.category.toLowerCase()
      );
    }

    // Apply search filter
    if (q) {
      list = list.filter((e) =>
        [e.title, e.location, e.tag]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // De-duplicate by id
    const seen = new Set<string>();
    list = list.filter((e) =>
      seen.has(e.id) ? false : (seen.add(e.id), true)
    );

    // Sort
    list.sort((a, b) => {
      // Featured events come first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      if (filters.sort === "title") return a.title.localeCompare(b.title);
      const da = new Date(a.start).getTime();
      const db = new Date(b.start).getTime();
      return filters.sort === "startDesc" ? db - da : da - db;
    });

    return list;
  }, [events, filters.search, filters.tag, filters.category, filters.sort]);

  // Paginated visible events for infinite scroll
  const visibleEvents = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const hasMoreEvents = visibleCount < filtered.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters.search, filters.tag, filters.category, filters.sort]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef =
      filters.view === "cards"
        ? cardsLoadMoreRef.current
        : tableLoadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreEvents && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [hasMoreEvents, isLoadingMore, filters.view]);

  // Filtered events for calendar view (includes past events but applies filters)
  const filteredForCalendar = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    let list = [...events];

    if (filters.tag !== "all") {
      list = list.filter(
        (e) => (e.tag ?? "").toLowerCase() === filters.tag.toLowerCase()
      );
    }

    if (filters.category !== "all") {
      list = list.filter(
        (e) =>
          (e.category ?? "").toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (q) {
      list = list.filter((e) =>
        [e.title, e.location, e.tag]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // De-duplicate
    const seen = new Set<string>();
    return list.filter((e) =>
      seen.has(e.id) ? false : (seen.add(e.id), true)
    );
  }, [events, filters.search, filters.tag, filters.category]);

  // Handle filter changes
  const handleFilterChange = useCallback((updates: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search: "",
      tag: "all",
      category: "all",
    }));
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onFocusSearch: () => searchInputRef.current?.focus(),
    onClearFilters: clearFilters,
    onNextTab: () => {
      const tabs = ["cards", "table", "calendar"];
      const currentIndex = tabs.indexOf(filters.view);
      const nextIndex = (currentIndex + 1) % tabs.length;
      handleFilterChange({ view: tabs[nextIndex] as FilterState["view"] });
    },
    onPrevTab: () => {
      const tabs = ["cards", "table", "calendar"];
      const currentIndex = tabs.indexOf(filters.view);
      const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
      handleFilterChange({ view: tabs[prevIndex] as FilterState["view"] });
    },
  });

  // Calculate stats for header
  const totalEvents = events.length;
  const upcomingCount = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => new Date(e.start).getTime() > now).length;
  }, [events]);

  // Don't render time-sensitive content until client is mounted
  if (!mounted) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header skeleton */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-900 dark:to-ship-cove-950 p-8 mb-8 animate-pulse">
          <div className="h-8 w-64 bg-ship-cove-200 dark:bg-ship-cove-800 rounded mb-3" />
          <div className="h-5 w-96 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
        </div>
        <FilterSkeleton />
        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TickProvider interval={1000}>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Header - Radio Station Dashboard style */}
        <StandardPageHeader
          icon={<CalendarDays className="h-7 w-7" />}
          title={t("title") || "Eventos"}
          description={t("description") || "Calendário de eventos, contests e nets de radioamadorismo"}
          stats={[
            {
              icon: <CalendarDays className="h-4 w-4" />,
              value: totalEvents,
              label: t("totalEvents") || "eventos",
            },
            {
              icon: <Trophy className="h-4 w-4" />,
              value: upcomingCount,
              label: t("upcoming") || "próximos",
              variant: "success",
            },
          ]}
          floatingIcons={[
            <Trophy key="trophy" className="h-12 w-12 text-white" />,
            <Radio key="radio" className="h-10 w-10 text-white" />,
          ]}
        />

        {/* Filter Section */}
        <EventFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          tags={tags}
          filteredCount={filtered.length}
          allEvents={events}
          filteredEvents={filtered}
          isRefreshing={isRefreshing}
          onRefresh={() => refreshEvents(true)}
          t={t}
        />

        {fetchError && (
          <div className="text-sm text-amber-600 dark:text-amber-400 mb-6">
            {t("refreshError")}
          </div>
        )}

        <Tabs
          value={filters.view}
          onValueChange={(value) =>
            handleFilterChange({ view: value as FilterState["view"] })
          }
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 w-full max-w-sm mb-6 bg-ship-cove-100 dark:bg-ship-cove-800/50">
            <TabsTrigger value="cards" className="inline-flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tabs.cards")}</span>
            </TabsTrigger>
            <TabsTrigger value="table" className="inline-flex items-center gap-2">
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tabs.table")}</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="inline-flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{t("tabs.calendar")}</span>
            </TabsTrigger>
          </TabsList>

          {/* Cards View */}
          <TabsContent value="cards" className="mt-0">
            <CurrentEvents events={filtered} t={t} />
            <NextUpCard events={filtered} t={t} />

            {/* Section divider */}
            {visibleEvents.length > 0 && (
              <div className="border-t border-ship-cove-200 dark:border-ship-cove-800 my-8" />
            )}

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visibleEvents.map((evt) => (
                  <motion.div
                    key={evt.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    layout
                  >
                    <EventCard event={evt} t={t} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Infinite scroll sentinel */}
            {hasMoreEvents && (
              <div
                ref={cardsLoadMoreRef}
                className="flex justify-center items-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">{t("loadingMore")}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("showingCount", {
                      visible: visibleEvents.length,
                      total: filtered.length,
                    })}
                  </span>
                )}
              </div>
            )}

            {filtered.length === 0 && (
              <div className="text-center text-muted-foreground py-12">
                {t("noMatching")}
              </div>
            )}
          </TabsContent>

          {/* Table View */}
          <TabsContent value="table" className="mt-0">
            <EventsTable events={visibleEvents} t={t} />

            {hasMoreEvents && (
              <div
                ref={tableLoadMoreRef}
                className="flex justify-center items-center py-8"
              >
                {isLoadingMore ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="text-sm">{t("loadingMore")}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {t("showingCount", {
                      visible: visibleEvents.length,
                      total: filtered.length,
                    })}
                  </span>
                )}
              </div>
            )}
          </TabsContent>

          {/* Calendar View */}
          <TabsContent value="calendar" className="mt-0">
            <CalendarView events={filteredForCalendar} t={t} />
          </TabsContent>
        </Tabs>

        <footer className="mt-10 text-xs text-muted-foreground text-center">
          {t("tip")}
        </footer>
      </div>
    </TickProvider>
  );
}
