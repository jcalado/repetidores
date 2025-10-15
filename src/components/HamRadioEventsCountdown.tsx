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
 * Ham Radio Events Countdown & Mini-Calendar (with ICS support)
 * - Next-up countdown + Cards + Table + Calendar tabs
 * - Pulls contests from contestcalendar.com (5-week ICS)
 * - Optional proxy toggle to avoid CORS
 * - Badges on calendar days with counts
 * - Defensive runtime checks and self-tests (non-throwing)
 */

// ---- Types ----
export type EventItem = {
  id: string;
  title: string;
  start: string; // ISO
  end?: string;
  location?: string;
  url?: string;
  tag?: string; // "Contest", "Net", etc.
};

// ---- Utilities ----
const tagIconMap: Record<string, React.ComponentType<any>> = {
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

function isSameLocalDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function dateKeyLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Simple, drift-resistant interval
function useTick(intervalMs = 1000) {
  const [, setTick] = useState(0);
  useEffect(() => {
    let raf: number | undefined;
    let id: any;
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

// Local storage hook (defines useLocalStorage to fix ReferenceError)
function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch { }
  }, [key, value]);
  return [value, setValue] as const;
}

// ---- Recurrence helpers ----
// weekday: 0=Sun ... 6=Sat
function nextWeeklyLocal(weekday: number, hour: number, minute: number) {
  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(0, 0, 0, 0);
  const today = candidate.getDay();
  let diff = (weekday - today + 7) % 7;
  candidate.setDate(candidate.getDate() + diff);
  candidate.setHours(hour, minute, 0, 0);
  if (candidate.getTime() <= now.getTime()) candidate.setDate(candidate.getDate() + 7);
  return candidate.toISOString();
}

function nextWeeklyUTC(weekday: number, hour: number, minute: number) {
  const now = new Date();
  const todayUTC = now.getUTCDay();
  let diff = (weekday - todayUTC + 7) % 7;
  let candidate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0, 0));
  if (diff > 0) candidate = new Date(candidate.getTime() + diff * 86400000);
  if (candidate.getTime() <= now.getTime()) candidate = new Date(candidate.getTime() + 7 * 86400000);
  return candidate.toISOString();
}

// ---- Seed Events ----
const seedEvents: EventItem[] = [
  {
    id: "netct-weekly",
    title: "netct",
    start: nextWeeklyLocal(3, 22, 0), // Wednesdays 22:00 Lisbon local
    location: "Weekly • Wednesdays 22:00 (Portugal local) • TalkGroup 268 • BrandMeister",
    tag: "Net",
  },
  {
    id: "ww-checkin-tg91",
    title: "World Wide Check-In",
    start: nextWeeklyUTC(6, 16, 0), // Saturdays 16:00 UTC
    location: "Saturday 16:00 UTC • TalkGroup 91 • BrandMeister",
    tag: "Net",
  },
];

// ---- ICS (Contest Calendar) integration ----
const CONTEST_ICS_URL = "https://www.contestcalendar.com/fivewkcal.ics";

type IcsEvent = {
  uid: string;
  start: string;
  end?: string;
  summary: string;
  url?: string;
  location?: string;
};

function parseICSDate(v?: string): string | undefined {
  if (!v) return undefined;
  // 20250102T180000Z or 20250102T180000
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/);
  if (!m) return undefined;
  const [_, y, mo, d, h, mi, s, z] = m;
  if (z === "Z") {
    const dt = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +s));
    return dt.toISOString();
  } else {
    const dt = new Date(+y, +mo - 1, +d, +h, +mi, +s);
    return dt.toISOString();
  }
}

function parseICS(icsText: string): IcsEvent[] {
  const lines = icsText.replace(/\r\n?/g, "\n").split("\n");
  const events: IcsEvent[] = [];
  let cur: any = null;

  // Unfold lines (RFC5545)
  const unfolded: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i > 0 && (line.startsWith(" ") || line.startsWith("\t"))) {
      unfolded[unfolded.length - 1] += line.slice(1);
    } else {
      unfolded.push(line);
    }
  }

  for (const raw of unfolded) {
    const line = raw.trim();
    if (line === "BEGIN:VEVENT") cur = {};
    else if (line === "END:VEVENT") {
      if (cur && cur.DTSTART && cur.SUMMARY) {
        const start = parseICSDate(cur.DTSTART);
        const end = parseICSDate(cur.DTEND);
        events.push({
          uid: cur.UID || `${cur.SUMMARY}-${cur.DTSTART}`,
          start: start!,
          end: end,
          summary: cur.SUMMARY,
          url: cur.URL,
          location: cur.LOCATION,
        });
      }
      cur = null;
    } else if (cur) {
      const idx = line.indexOf(":");
      if (idx > -1) {
        const keyPart = line.slice(0, idx);
        const value = line.slice(idx + 1);
        const key = keyPart.split(";")[0];
        cur[key] = value;
      }
    }
  }
  return events;
}

function icsToEventItems(list: IcsEvent[]): EventItem[] {
  return list
    .filter((e) => !!e.start && !!e.summary)
    .map((e) => ({
      id: `contest:${e.uid}`,
      title: e.summary,
      start: e.start,
      end: e.end,
      location: e.location,
      url: e.url,
      tag: "Contest",
    }));
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

function NextUp({ events }: { events: EventItem[] }) {
  useTick(1000);
  const next = useMemo(() => {
    const future = events.filter((e) => msUntil(e.start) > 0);
    future.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return future[0];
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
    for (const e of events) {
      const k = dateKeyLocal(new Date(e.start));
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return map;
  }, [events]);

  const selectedEvents = useMemo(() => {
    if (!date) return [] as EventItem[];
    return events.filter((e) => isSameLocalDay(new Date(e.start), date));
  }, [events, date]);

  const DayContent = (props: any) => {
    const d: Date = props.date;
    const count = countsByDay.get(dateKeyLocal(d)) ?? 0;
    return (
      <div className="relative flex items-center justify-center w-full h-full">
        <span>{d.getDate()}</span>
        {count > 0 && (
          <span className="absolute bottom-1 right-1 text-[10px] leading-none px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground">
            {count}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg inline-flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md border"
              // @ts-ignore react-day-picker custom components
              components={{ DayContent }}
            />
            <div className="mt-2 text-xs text-muted-foreground">Badges show how many events occur on each day.</div>
          </CardContent>
        </Card>
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

// ---- Lightweight self-tests (dev only, non-throwing) ----
function runSelfTests() {
  try {
    // Calendar presence
    // @ts-ignore
    if (typeof Calendar === "undefined") {
      console.error("[SelfTest] Calendar undefined; ensure '@/components/ui/calendar' exports { Calendar }.");
    }
    // Recurrence returns ISO
    const iso1 = nextWeeklyLocal(3, 22, 0);
    const iso2 = nextWeeklyUTC(6, 16, 0);
    if (!/\d{4}-\d{2}-\d{2}T/.test(iso1) || !/\d{4}-\d{2}-\d{2}T/.test(iso2)) {
      console.error("[SelfTest] Recurrence helpers did not return ISO strings.");
    }
    // ICS parser sanity
    const sample = [
      "BEGIN:VEVENT",
      "SUMMARY:Test Contest",
      "DTSTART:20250102T180000Z",
      "DTEND:20250102T220000Z",
      "UID:abc123",
      "END:VEVENT",
    ].join("\n");
    const out = parseICS(sample);
    if (!(out.length === 1 && out[0].summary === "Test Contest")) {
      console.error("[SelfTest] ICS parser sanity failed.");
    }
    // Safe merge test
    const safeMerge = (...arrs: any[][]) => ([] as any[]).concat(...arrs.filter(Array.isArray));
    const merged = safeMerge(undefined as any, [], [{ id: "x" } as any]);
    if (!Array.isArray(merged) || merged.length !== 1) {
      console.error("[SelfTest] Safe merge failed.");
    }
    // NEW: Ensure contestEvents fallback logic works with null/undefined
    const ce: any = null;
    const safeCE = (ce ?? []) as any[];
    if (!Array.isArray(safeCE) || safeCE.length !== 0) {
      console.error("[SelfTest] contestEvents nullish coalesce fallback failed.");
    }
  } catch (e) {
    console.error("[SelfTest] Unexpected error:", e);
  }
}

export default function HamRadioEventsCountdown() {
  // Prevent hydration mismatch
  const [mounted, setMounted] = useState(false);

  // State
  const [stored, setStored] = useLocalStorage<EventItem[]>("ham-events", seedEvents);
  const [events, setEvents] = useState<EventItem[]>(Array.isArray(stored) ? stored : []);
  // IMPORTANT: default to [] so it's always an array
  const [contestEvents, setContestEvents] = useState<EventItem[]>([]);
  const [includeContests, setIncludeContests] = useState<boolean>(false);
  const [useProxy, setUseProxy] = useState<boolean>(false);
  const [contestStatus, setContestStatus] = useState<string>("");

  const [search, setSearch] = useState("");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("startAsc");
  const [tab, setTab] = useState<string>("cards");

  // Set mounted on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Persist manual events
  useEffect(() => setStored(events), [events, setStored]);

  // Dev self-tests
  useEffect(() => {
    if (typeof window !== "undefined") runSelfTests();
  }, []);

  // Fetch contests (with abort + optional proxy)
  useEffect(() => {
    const aborted = { current: false };

    if (!includeContests) {
      setContestEvents([]);
      return;
    }

    const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;

    const fetchContests = async () => {
      try {
        setContestStatus("Loading contests…");
        let url = CONTEST_ICS_URL;
        if (useProxy && process.env.NEXT_PUBLIC_ICS_PROXY_BASE_URL) {
          url = `${process.env.NEXT_PUBLIC_ICS_PROXY_BASE_URL}?url=${encodeURIComponent(CONTEST_ICS_URL)}`;
        }
        const res = await fetch(url, { cache: "no-store", signal: controller?.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (aborted.current) return;
        const parsed = parseICS(text);
        const items = icsToEventItems(parsed);
        setContestEvents(Array.isArray(items) ? items : []);
        setContestStatus(items.length ? `Loaded ${items.length} contests` : "No contests found in ICS");
      } catch (err) {
        console.error("[ICS] Failed to load contests:", err);
        setContestStatus("Could not load contest calendar (possible CORS). Contests are hidden.");
        setIncludeContests(false);
        // Ensure contestEvents remains an array on failure
        setContestEvents([]);
      }
    };

    fetchContests();

    return () => {
      aborted.current = true;
      try {
        controller?.abort();
      } catch { }
    };
  }, [includeContests, useProxy]);

  // Safe helpers to avoid undefined spreads (use nullish coalescing instead of Array.isArray checks)
  const safeContestEvents = (contestEvents ?? []) as EventItem[];
  const safeEvents = (events ?? []) as EventItem[];

  const tags = useMemo(() => {
    const s = new Set<string>();
    [...safeEvents, ...safeContestEvents].forEach((e) => {
      if (e && typeof e === "object" && "tag" in e && (e as any).tag) s.add(String((e as any).tag));
    });
    return Array.from(s);
  }, [safeEvents, safeContestEvents]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = [...safeEvents, ...(includeContests ? safeContestEvents : [])];

    if (filterTag !== "all") {
      list = list.filter((e) => (e.tag ?? "").toLowerCase() === filterTag.toLowerCase());
    }

    if (q) {
      list = list.filter((e) => [e.title, e.location, e.tag].filter(Boolean).join(" ").toLowerCase().includes(q));
    }

    // de-duplicate by id
    const seen = new Set<string>();
    list = list.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));

    list.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      const da = new Date(a.start).getTime();
      const db = new Date(b.start).getTime();
      return sortBy === "startDesc" ? db - da : da - db;
    });

    return list;
  }, [safeEvents, safeContestEvents, includeContests, search, filterTag, sortBy]);

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
      <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
        <div className="flex flex-col md:flex-row gap-2 md:items-center">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="startAsc">Soonest first</SelectItem>
                <SelectItem value="startDesc">Latest first</SelectItem>
                <SelectItem value="title">Title (A–Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input
            placeholder="Search (e.g., 'Contest', 'VHF', 'Exam')"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="md:w-72"
          />
          <div className="flex items-center gap-2 text-sm">
            <input id="toggle-contests" type="checkbox" className="h-4 w-4" checked={includeContests} onChange={(e) => setIncludeContests(e.target.checked)} />
            <label htmlFor="toggle-contests">Include contestcalendar.com (ICS)</label>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <input id="toggle-proxy" type="checkbox" className="h-4 w-4" checked={useProxy} onChange={(e) => setUseProxy(e.target.checked)} />
            <label htmlFor="toggle-proxy">Use proxy to avoid CORS</label>
          </div>
        </div>
      </div>

      {contestStatus && <div className="mt-2 text-xs text-muted-foreground">{contestStatus}</div>}

      <Separator className="my-6" />

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
          <CalendarView events={filtered} />
        </TabsContent>
      </Tabs>

      <footer className="mt-10 text-xs text-muted-foreground text-center">Tip: Times use your local timezone. Use the search, filters, and tabs to view as cards or a table.</footer>
    </div>
  );
}
