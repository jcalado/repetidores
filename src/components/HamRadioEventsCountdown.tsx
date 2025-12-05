"use client"

import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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
  Loader2,
  MapPin,
  Mic2,
  Radio,
  RefreshCw,
  SatelliteDish,
  Search,
  Star,
  Table as TableIcon,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { fetchEvents } from "@/lib/events";

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
  isFeatured?: boolean;
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

// Subtle accent colors for each tag type
const tagColorMap: Record<string, { text: string; bg: string; border: string }> = {
  Net: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800'
  },
  Contest: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800'
  },
  Meetup: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800'
  },
  Satellite: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800'
  },
  DX: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800'
  },
  Default: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700'
  },
};

function getTagColors(tag?: string) {
  return tag && tagColorMap[tag] ? tagColorMap[tag] : tagColorMap.Default;
}

function TagIcon({ tag, className }: { tag?: string; className?: string }) {
  const Cmp = tag && tagIconMap[tag] ? tagIconMap[tag] : tagIconMap.Default;
  return <Cmp className={className || "w-4 h-4"} />;
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
  return d.toLocaleString('pt-PT', {
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

function EventCard({ evt, t }: { evt: EventItem; t: (key: string) => string }) {
  useTick(1000);
  const remaining = msUntil(evt.start);
  const isPast = remaining === 0;
  const tagColors = getTagColors(evt.tag);
  return (
    <Card className="group relative rounded-2xl shadow-sm transition-shadow hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring">
      <CardHeader className="space-y-2 pb-0">
        <div className="flex items-start gap-3">
          <div className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full ${tagColors.bg} ${tagColors.text}`}>
            <TagIcon tag={evt.tag} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <CardTitle className="text-base sm:text-lg font-semibold truncate leading-tight inline-flex items-center gap-1.5">
                {evt.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />}
                {evt.title}
              </CardTitle>
              {evt.url && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <a
                        href={evt.url}
                        target="_blank"
                        rel="noreferrer"
                        className="ml-auto inline-flex items-center h-6 px-2 rounded-md border text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                        aria-label={t('openEventPage')}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-1" /> {t('info')}
                      </a>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('openEventPage')}</p>
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
              <span className={`rounded-full px-2 py-0.5 text-[10px] sm:text-xs inline-flex items-center gap-1 border ${tagColors.bg} ${tagColors.text} ${tagColors.border}`}>
                <TagIcon tag={evt.tag} className="w-3 h-3" /> {evt.tag ?? t('event')}
              </span>
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
                <Clock className="w-4 h-4" /> {t('started')}
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

function CurrentEvents({ events, t }: { events: EventItem[]; t: (key: string) => string }) {
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
            <CardTitle className="text-xl">{t('happeningNow')}</CardTitle>
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
                        <Clock className="w-4 h-4 mr-1" /> {t('started')} {formatDateTime(event.start)}
                      </span>
                      {event.location && (
                        <span className="inline-flex items-center">
                          <MapPin className="w-4 h-4 mr-1" /> {event.location}
                        </span>
                      )}
                    </div>
                    {event.end && timeUntilEnd > 0 && (
                      <div className="mt-2 text-sm">
                        <span className="text-muted-foreground">{t('endsIn')} </span>
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
                      {t('details')} <ExternalLink className="w-3 h-3" />
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

function CountdownSegment({ value, label, colorClass }: { value: number; label: string; colorClass: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`text-3xl sm:text-4xl md:text-5xl font-black tabular-nums ${colorClass}`}>
        {String(value).padStart(2, '0')}
      </div>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground mt-1">
        {label}
      </div>
    </div>
  );
}

function NextUp({ events, t }: { events: EventItem[]; t: (key: string) => string }) {
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
  const { days, hours, minutes, seconds } = breakdown(remaining);
  const tagColors = getTagColors(next.tag);

  // Dynamic border and background classes based on tag
  const borderColorMap: Record<string, string> = {
    Net: 'border-blue-400/50 dark:border-blue-500/50',
    Contest: 'border-amber-400/50 dark:border-amber-500/50',
    Meetup: 'border-purple-400/50 dark:border-purple-500/50',
    Satellite: 'border-cyan-400/50 dark:border-cyan-500/50',
    DX: 'border-emerald-400/50 dark:border-emerald-500/50',
    Default: 'border-primary/50',
  };

  const bgGradientMap: Record<string, string> = {
    Net: 'from-blue-500/10 via-blue-500/5',
    Contest: 'from-amber-500/10 via-amber-500/5',
    Meetup: 'from-purple-500/10 via-purple-500/5',
    Satellite: 'from-cyan-500/10 via-cyan-500/5',
    DX: 'from-emerald-500/10 via-emerald-500/5',
    Default: 'from-primary/10 via-primary/5',
  };

  const iconBgMap: Record<string, string> = {
    Net: 'bg-blue-500',
    Contest: 'bg-amber-500',
    Meetup: 'bg-purple-500',
    Satellite: 'bg-cyan-500',
    DX: 'bg-emerald-500',
    Default: 'bg-primary',
  };

  const borderClass = next.tag && borderColorMap[next.tag] ? borderColorMap[next.tag] : borderColorMap.Default;
  const bgClass = next.tag && bgGradientMap[next.tag] ? bgGradientMap[next.tag] : bgGradientMap.Default;
  const iconBgClass = next.tag && iconBgMap[next.tag] ? iconBgMap[next.tag] : iconBgMap.Default;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid">
      <Card className={`relative overflow-hidden rounded-2xl shadow-lg border-2 ${borderClass} bg-gradient-to-br ${bgClass} to-transparent`}>
        {/* Decorative background element */}
        <div className={`absolute -top-20 -right-20 w-56 h-56 ${iconBgClass} opacity-[0.07] rounded-full blur-3xl pointer-events-none`} />

        <CardContent className="p-5 sm:p-6">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${iconBgClass} text-white shadow-lg`}>
                <TagIcon tag={next.tag} className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className={`flex items-center gap-2 text-sm font-medium ${tagColors.text}`}>
                  <CalendarClock className="w-4 h-4" />
                  {t('nextUp')}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground leading-tight mt-0.5 flex items-center gap-2">
                  {next.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />}
                  {next.title}
                </h3>
              </div>
            </div>

            {/* Tag badge */}
            <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium border ${tagColors.bg} ${tagColors.text} ${tagColors.border}`}>
              {next.tag ?? t('event')}
            </span>
          </div>

          {/* Event details */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mb-5">
            <span className="inline-flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1.5" /> {formatDateTime(next.start)}
            </span>
            {next.location && (
              <span className="inline-flex items-center">
                <MapPin className="w-4 h-4 mr-1.5" /> {next.location}
              </span>
            )}
          </div>

          {/* Countdown */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 py-4 px-2 rounded-xl bg-background/50 backdrop-blur-sm border border-border/50">
            <CountdownSegment value={days} label={t('days')} colorClass={tagColors.text} />
            <span className={`text-2xl sm:text-3xl font-light ${tagColors.text} opacity-50`}>:</span>
            <CountdownSegment value={hours} label={t('hours')} colorClass={tagColors.text} />
            <span className={`text-2xl sm:text-3xl font-light ${tagColors.text} opacity-50`}>:</span>
            <CountdownSegment value={minutes} label={t('minutes')} colorClass={tagColors.text} />
            <span className={`text-2xl sm:text-3xl font-light ${tagColors.text} opacity-50`}>:</span>
            <CountdownSegment value={seconds} label={t('seconds')} colorClass={tagColors.text} />
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <MiniProgress startISO={next.start} />
          </div>

          {/* Action button */}
          {next.url && (
            <div className="mt-4 flex justify-end">
              <a
                href={next.url}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tagColors.bg} ${tagColors.text} ${tagColors.border} border hover:opacity-80`}
              >
                {t('eventDetails')}
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventsTable({ events, t }: { events: EventItem[]; t: (key: string) => string }) {
  useTick(1000);
  return (
    <div className="rounded-2xl border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('tableHeaders.title')}</TableHead>
            <TableHead>{t('tableHeaders.start')}</TableHead>
            <TableHead>{t('tableHeaders.tag')}</TableHead>
            <TableHead>{t('tableHeaders.location')}</TableHead>
            <TableHead>{t('tableHeaders.countdown')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((e) => {
            const remaining = msUntil(e.start);
            const isPast = remaining === 0;
            const tagColors = getTagColors(e.tag);
            return (
              <TableRow key={e.id}>
                <TableCell className="font-medium flex items-center gap-2">
                  {e.isFeatured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />}
                  <span className={tagColors.text}><TagIcon tag={e.tag} /></span> {e.title}
                </TableCell>
                <TableCell>{formatDateTime(e.start)}</TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${tagColors.bg} ${tagColors.text} ${tagColors.border}`}>
                    <TagIcon tag={e.tag} className="w-3 h-3" /> {e.tag ?? t('event')}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">{e.location ?? "—"}</TableCell>
                <TableCell className="tabular-nums">{isPast ? t('started') : <CountdownText ms={remaining} />}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

function CalendarView({ events, t }: { events: EventItem[]; t: (key: string) => string }) {
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
    return events
      .filter((e) => eventOccursOnDay(e, date))
      .sort((a, b) => {
        // Featured events come first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Then sort by start time
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
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
              {t('eventsOn')} {date ? date.toLocaleDateString('pt-PT', { weekday: "long", year: "numeric", month: "short", day: "numeric" }) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {selectedEvents.length === 0 && <div className="text-sm text-muted-foreground">{t('noEventsOnDate')}</div>}
            {selectedEvents.map((evt) => (
              <EventCard key={evt.id} evt={evt} t={t} />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Skeleton components for loading states
function EventCardSkeleton() {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="space-y-2 pb-0">
        <div className="flex items-start gap-3">
          <Skeleton className="h-9 w-9 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-end">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterSkeleton() {
  return (
    <Card className="rounded-2xl mb-6">
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-[160px]" />
          <Skeleton className="h-10 w-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

interface HamRadioEventsCountdownProps {
  initialEvents?: EventItem[];
}

export default function HamRadioEventsCountdown({ initialEvents = [] }: HamRadioEventsCountdownProps) {
  const t = useTranslations('events');
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // State
  const [events, setEvents] = useState<EventItem[]>(initialEvents);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("startAsc");
  const [tab, setTab] = useState<string>("cards");

  // Pagination state for infinite scroll
  const ITEMS_PER_PAGE = 12;
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const cardsLoadMoreRef = useRef<HTMLDivElement>(null);
  const tableLoadMoreRef = useRef<HTMLDivElement>(null);

  // Refresh events from API
  const refreshEvents = useCallback(async (showIndicator = true) => {
    if (showIndicator) setIsRefreshing(true);
    setFetchError(null);
    try {
      const response = await fetchEvents({ limit: 500, sort: 'startAsc' });
      setEvents(response.docs);
    } catch {
      // Silently fail - CMS may not be running in dev mode
      // Keep showing initial events from build time
      setFetchError('error');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Set mounted on client and fetch fresh events
  useEffect(() => {
    setMounted(true);
    refreshEvents(false); // Fetch on mount without spinner
  }, [refreshEvents]);

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
      // Featured events come first
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;

      // Then apply normal sort
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const da = new Date(a.start).getTime();
      const db = new Date(b.start).getTime();
      return sortBy === "startDesc" ? db - da : da - db;
    });

    return list;
  }, [events, sortBy, applyFilters]);

  // Paginated visible events for infinite scroll
  const visibleEvents = useMemo(() => {
    return filtered.slice(0, visibleCount);
  }, [filtered, visibleCount]);

  const hasMoreEvents = visibleCount < filtered.length;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [search, filterTag, sortBy]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const currentRef = tab === 'cards' ? cardsLoadMoreRef.current : tableLoadMoreRef.current;
    if (!currentRef) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMoreEvents && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate a small delay for smooth UX
          setTimeout(() => {
            setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [hasMoreEvents, isLoadingMore, tab]);

  // Filtered events for calendar view (includes past events but applies filters)
  const filteredForCalendar = useMemo(() => {
    return applyFilters(events);
  }, [events, applyFilters]);

  // Don't render time-sensitive content until client is mounted - show skeleton
  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        {/* Filter Skeleton */}
        <FilterSkeleton />

        {/* Tabs Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-10 w-full max-w-md rounded-lg" />
        </div>

        {/* Cards Skeleton */}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters = search.trim() !== '' || filterTag !== 'all';
  const clearFilters = () => {
    setSearch('');
    setFilterTag('all');
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Filter Section */}
      <Card className="rounded-2xl mb-6">
        <CardContent className="p-4 space-y-4">
          {/* Search and Controls Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input with Icon */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[160px] h-10">
                <SelectValue placeholder={t('sortBy')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startAsc">{t('soonestFirst')}</SelectItem>
                <SelectItem value="startDesc">{t('latestFirst')}</SelectItem>
                <SelectItem value="title">{t('titleAZ')}</SelectItem>
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <button
              onClick={() => refreshEvents(true)}
              disabled={isRefreshing}
              className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:pointer-events-none shrink-0 transition-colors"
              title={t('refresh')}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tag Filter Chips */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterTag('all')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterTag === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('allTags')}
              </button>
              {tags.map((tag) => {
                const colors = getTagColors(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => setFilterTag(tag)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      filterTag === tag
                        ? `${colors.bg} ${colors.text} ${colors.border}`
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border-transparent'
                    }`}
                  >
                    <TagIcon tag={tag} className={filterTag === tag ? '' : colors.text} />
                    {tag}
                  </button>
                );
              })}
            </div>
          )}

          {/* Results Count and Clear Filters */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <span className="text-sm text-muted-foreground">
              {filtered.length === 1 ? t('resultsCountSingular') : t('resultsCount', { count: filtered.length })}
            </span>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                {t('clearFilters')}
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {fetchError && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mb-4">{t('refreshError')}</div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="cards" className="inline-flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" /> {t('tabs.cards')}
          </TabsTrigger>
          <TabsTrigger value="table" className="inline-flex items-center gap-2">
            <TableIcon className="w-4 h-4" /> {t('tabs.table')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="inline-flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" /> {t('tabs.calendar')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cards" className="mt-6">
          <CurrentEvents events={filtered} t={t} />
          <NextUp events={filtered} t={t} />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence>
              {visibleEvents.map((evt) => (
                <motion.div key={evt.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <EventCard evt={evt} t={t} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {/* Infinite scroll sentinel and loading indicator */}
          {hasMoreEvents && (
            <div ref={cardsLoadMoreRef} className="flex justify-center items-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{t('loadingMore')}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('showingCount', { visible: visibleEvents.length, total: filtered.length })}
                </span>
              )}
            </div>
          )}
          {filtered.length === 0 && <div className="text-center text-muted-foreground mt-12">{t('noMatching')}</div>}
        </TabsContent>

        <TabsContent value="table" className="mt-6">
          <EventsTable events={visibleEvents} t={t} />
          {/* Infinite scroll sentinel and loading indicator */}
          {hasMoreEvents && (
            <div ref={tableLoadMoreRef} className="flex justify-center items-center py-8">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{t('loadingMore')}</span>
                </div>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {t('showingCount', { visible: visibleEvents.length, total: filtered.length })}
                </span>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CalendarView events={filteredForCalendar} t={t} />
        </TabsContent>
      </Tabs>

      <footer className="mt-10 text-xs text-muted-foreground text-center">
        {t('tip')}
      </footer>
    </div>
  );
}
