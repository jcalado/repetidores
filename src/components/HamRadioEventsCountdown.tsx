"use client"

import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  CalendarClock,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Globe2,
  Info,
  LayoutGrid,
  MapPin,
  Mic2,
  Radio,
  SatelliteDish,
  SlidersHorizontal,
  Table as TableIcon
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

/**
 * Ham Radio Events Countdown & Mini-Calendar (with Payload CMS API)
 * - Next-up countdown + Cards + Table + Calendar tabs
 * - Fetches events from Payload CMS API
 * - Supports filtering, sorting, and searching
 * - Badges on calendar days with counts
 */

// ---- Types ----
export type EventTag = 'Net' | 'Contest' | 'Meetup' | 'Satellite' | 'DX';

export type EventItem = {
  id: string;
  title: string;
  start: string; // ISO 8601 datetime
  end?: string;
  location?: string;
  url?: string;
  tag?: EventTag;
};

export type EventsAPIResponse = {
  docs: EventItem[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

// ---- Utilities ----
const tagIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Net: Radio,
  Contest: Activity,
  Meetup: Mic2,
  Satellite: SatelliteDish,
  DX: Globe2,
  Default: Info,
};

function TagIcon({ tag }: { tag?: string }) {
  const Cmp = tag && tagIconMap[tag] ? tagIconMap[tag] : tagIconMap.Default;
  return <Cmp className="w-4 h-4" />;
}

function msUntil(dateISO: string) {
  const target = new Date(dateISO).getTime();
  const now = Date.now();
  return Math.max(0, target - now);
}

function breakdown(ms: number) {
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds };
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function eventOccursOnDay(event: EventItem, day: Date): boolean {
  const startDate = new Date(event.start);
  const endDate = event.end ? new Date(event.end) : startDate;

  // Normalize dates to midnight local time for comparison
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  const eventStart = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eventEnd = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

  // Check if the day falls within the event's date range
  return dayStart <= eventEnd && dayEnd >= eventStart;
}

// Simple, drift-resistant interval
function useTick(intervalMs = 1000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    let raf: number | undefined;
    let id: ReturnType<typeof setInterval> | undefined;
    let last = typeof performance !== "undefined" ? performance.now() : Date.now();

    const loop = (now: number) => {
      if (now - last >= intervalMs) {
        last = now;
        setTick((t) => t + 1);
      }
      raf = requestAnimationFrame(loop);
    };

    if (typeof window !== "undefined" && "requestAnimationFrame" in window) {
      raf = requestAnimationFrame(loop);
      return () => {
        if (raf) cancelAnimationFrame(raf);
      };
    } else {
      id = setInterval(() => setTick((t) => t + 1), intervalMs);
      return () => clearInterval(id);
    }
  }, [intervalMs]);
}

// ---- Components ----
function CountdownText({ ms }: { ms: number }) {
  const { days, hours, minutes, seconds } = breakdown(ms);
  return (
    <span className="tabular-nums font-semibold">
      {days}d {hours}h {minutes}m {seconds}s
    </span>
  );
}

function MiniProgress({ startISO }: { startISO: string }) {
  const ms = msUntil(startISO);
  const sevenDays = 7 * 24 * 3600 * 1000;
  const pct = Math.round(100 - Math.min(100, (ms / sevenDays) * 100));
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function EventCard({ evt }: { evt: EventItem }) {
  useTick(1000);
  const remaining = msUntil(evt.start);
  const isPast = remaining === 0;
  return (
    <Card className="group relative rounded-2xl shadow-sm transition-shadow hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring">
      <CardHeader className="space-y-2 pb-0">
        <div className="flex items-start gap-3">
          <div className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary">
            <TagIcon tag={evt.tag} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold truncate leading-tight">{evt.title}</CardTitle>
              {evt.url && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={evt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center h-6 px-2 rounded-md border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        aria-label="Open event page"
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> Info
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Open official event page</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              <span className="inline-flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" /> {formatDateTime(evt.start)}
              </span>
              {evt.location && (
                <span className="inline-flex items-center">
                  <MapPin className="w-4 h-4 mr-1" /> {evt.location}
                </span>
              )}
              <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] sm:text-xs inline-flex items-center gap-1">
                <TagIcon tag={evt.tag} /> {evt.tag ?? "Event"}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[160px]">
            <MiniProgress startISO={evt.start} />
          </div>
          <div className="text-sm">
            {isPast ? (
              <span className="inline-flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" /> Started
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Clock className="w-4 h-4" /> <CountdownText ms={remaining} />
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CurrentEvents({ events }: { events: EventItem[] }) {
  useTick(1000);
  const currentEvents = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      const start = new Date(e.start).getTime();
      const end = e.end ? new Date(e.end).getTime() : start + 3600000; // Default 1 hour if no end time
      return now >= start && now <= end;
    }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  if (currentEvents.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
      <Card className="rounded-2xl shadow-md border-green-500/40 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <CardTitle className="text-xl">Happening Now</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentEvents.map((event) => {
            const timeUntilEnd = event.end ? msUntil(event.end) : 0;
            return (
              <div key={event.id} className="p-4 rounded-lg bg-background/50 border border-green-500/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <TagIcon tag={event.tag} />
                      <span>{event.title}</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3 mt-1">
                      <span className="inline-flex items-center">
                        <Clock className="w-4 h-4 mr-1" /> Started {formatDateTime(event.start)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center">
                          <MapPin className="w-4 h-4 mr-1" /> {event.location}
                        </span>
                      )}
                    </div>
                    {event.end && timeUntilEnd > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">Ends in: </span>
                        <CountdownText ms={timeUntilEnd} />
                      </div>
                    )}
                    {event.tag && (
                      <Badge variant="outline" className="mt-2">
                        {event.tag}
                      </Badge>
                    )}
                  </div>
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-sm shrink-0"
                    >
                      Details <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function NextUp({ events }: { events: EventItem[] }) {
  useTick(1000);
  const next = useMemo(() => {
    const now = Date.now();
    const future = events.filter((e) => {
      const start = new Date(e.start).getTime();
      const end = e.end ? new Date(e.end).getTime() : start;
      // Only show events that haven't started or ended yet
      return start > now || (end > now && start <= now);
    });
    future.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    // Find the first event that hasn't started yet
    return future.find(e => new Date(e.start).getTime() > now);
  }, [events]);

  if (!next) return null;
  const remaining = msUntil(next.start);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid">
      <Card className="rounded-2xl shadow-md border-primary/40 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-3 text-primary">
            <CalendarClock className="w-5 h-5" />
            <CardTitle className="text-xl">Next Up</CardTitle>
          </div>
          <div className="mt-1 flex items-center gap-2 text-2xl font-bold leading-tight">
            <TagIcon tag={next.tag} />
            <span>{next.title}</span>
          </div>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" /> {formatDateTime(next.start)}
            </span>
            {next.location && (
              <span className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> {next.location}
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl md:text-5xl font-black tracking-tight tabular-nums">
            <CountdownText ms={remaining} />
          </div>
          {next.url && (
            <div className="mt-3">
              <a href={next.url} target="_blank" rel="noreferrer" className="inline-flex items-center underline hover:no-underline">
                <ExternalLink className="w-4 h-4 mr-1" /> Event details
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventsTable({ events }: { events: EventItem[] }) {
  useTick(1000);
  return (
    <div className="rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Start (local)</TableHead>
            <TableHead>Tag</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Countdown</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => {
            const remaining = msUntil(e.start);
            const isPast = remaining === 0;
            return (
              <TableRow key={e.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  <TagIcon tag={e.tag} /> {e.title}
                </TableCell>
                <TableCell>{formatDateTime(e.start)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="inline-flex items-center gap-1">
                    <TagIcon tag={e.tag} /> {e.tag ?? "Event"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{e.location ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{isPast ? "Started" : <CountdownText ms={remaining} />}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CalendarView({ events }: { events: EventItem[] }) {
  const [date, setDate] = useState<Date | undefined>(new Date());

  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();

    // For each event, add it to all days it spans
    for (const e of events) {
      const startDate = new Date(e.start);
      const endDate = e.end ? new Date(e.end) : startDate;

      // Iterate through each day from start to end
      const currentDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const lastDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      while (currentDay <= lastDay) {
        const k = dateKeyLocal(currentDay);
        map.set(k, (map.get(k) ?? 0) + 1);
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!date) return [] as EventItem[];
    return events.filter((e) => eventOccursOnDay(e, date));
  }, [events, date]);

  const CustomDay = ({ day, ...props }: { day: { date: Date }; className?: string; children?: React.ReactNode } & React.TdHTMLAttributes<HTMLTableCellElement>) => {
    const count = countsByDay.get(dateKeyLocal(day.date)) ?? 0;
    return (
      <td {...props} className={`${props.className} relative`}>
        {props.children}
        {count > 0 && (
          <span className="absolute top-1 right-1 text-[8px] leading-none bg-red-900 text-primary-foreground font-bold w-3 h-3 rounded-full flex items-center justify-center pointer-events-none">
            {count}
          </span>
        )}
      </td>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md border"
          classNames={{
            root: "w-full",
          }}
          components={{
            Day: CustomDay
          }}
        />
      </div>

      <div className="md:col-span-2">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">
              Events on {date ? date.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "short", day: "numeric" }) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedEvents.length === 0 && <div className="text-sm text-muted-foreground">No events on this date.</div>}
            {selectedEvents.map((evt) => (
              <EventCard key={evt.id} evt={evt} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface HamRadioEventsCountdownProps {
  initialEvents?: EventItem[];
}

export default function HamRadioEventsCountdown({ initialEvents = [] }: HamRadioEventsCountdownProps) {
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // State
  const [events] = useState<EventItem[]>(initialEvents);

  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("startAsc");
  const [tab, setTab] = useState<string>("cards");

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const tags = useMemo(() => {
    const s = new Set<string>();
    events.forEach((e) => {
      if (e?.tag) s.add(e.tag);
    });
    return Array.from(s);
  }, [events]);

  // Helper function to apply tag and search filters
  const applyFilters = useMemo(() => {
    return (list: EventItem[]) => {
      const q = search.trim().toLowerCase();
      let filtered = [...list];

      if (filterTag !== "all") {
        filtered = filtered.filter((e) => (e.tag ?? "").toLowerCase() === filterTag.toLowerCase());
      }

      if (q) {
        filtered = filtered.filter((e) => [e.title, e.location, e.tag].filter(Boolean).join(" ").toLowerCase().includes(q));
      }

      // de-duplicate by id
      const seen = new Set<string>();
      filtered = filtered.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));

      return filtered;
    };
  }, [search, filterTag]);

  // Filter events for cards/table view (future/current events only)
  const filtered = useMemo(() => {
    const now = Date.now();

    // Only show events that haven't ended yet
    let list = events.filter((e) => {
      const endTime = e.end ? new Date(e.end).getTime() : new Date(e.start).getTime();
      return endTime >= now;
    });

    // Apply tag and search filters
    list = applyFilters(list);

    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const da = new Date(a.start).getTime();
      const db = new Date(b.start).getTime();
      return sortBy === "startDesc" ? db - da : da - db;
    });

    return list;
  }, [events, sortBy, applyFilters]);

  // Filtered events for calendar view (includes past events but applies filters)
  const filteredForCalendar = useMemo(() => {
    return applyFilters(events);
  }, [events, applyFilters]);

  // Don't render time-sensitive content until client is mounted
  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Loading events...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="flex items-center gap-2 text-muted-foreground shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="text-sm font-medium">Filter:</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-0 h-9"
          />
          {tags.length > 0 && (
            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="w-full sm:w-[130px] h-9">
                <SelectValue placeholder="All tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tags</SelectItem>
                {tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[140px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startAsc">Soonest first</SelectItem>
              <SelectItem value="startDesc">Latest first</SelectItem>
              <SelectItem value="title">Title (A–Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Separator className="my-4" />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="cards" className="inline-flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> Cards
          </TabsTrigger>
          <TabsTrigger value="table" className="inline-flex items-center gap-2">
            <TableIcon className="w-4 h-4" /> Table
          </TabsTrigger>
          <TabsTrigger value="calendar" className="inline-flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6">
          <CurrentEvents events={filtered} />
          <NextUp events={filtered} />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {filtered.map((evt) => (
                <motion.div key={evt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <EventCard evt={evt} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {filtered.length === 0 && <div className="text-center text-muted-foreground mt-12">No matching events. Try clearing filters.</div>}
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <EventsTable events={filtered} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView events={filteredForCalendar} />
        </TabsContent>
      </Tabs>

      <footer className="mt-10 text-xs text-muted-foreground text-center">
        Tip: Times are displayed in your local timezone. Use search, filters, and tabs to view events.
      </footer>
    </div>
  );
}
