"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { EventItem } from "@/components/HamRadioEventsCountdown";
import type { EventOperatingWindow } from "@/components/events";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  AudioLines,
  Building2,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  Globe,
  Globe2,
  IdCard,
  Info,
  Link2,
  Mail,
  MapPin,
  MessageCircle,
  Mic2,
  QrCode,
  Radio,
  RadioTower,
  SatelliteDish,
  Share2,
  Sparkles,
  Timer,
  Waves,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import {
  downloadICS,
  getGoogleCalendarUrl,
  getOutlookCalendarUrl,
  getTwitterShareUrl,
  getWhatsAppShareUrl,
  getTelegramShareUrl,
  getFacebookShareUrl,
} from "@/lib/calendar";

// ---- Utilities ----
function getImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || '';
  return `${baseUrl}${url}`;
}

// Rich text content renderer for Payload Lexical format
interface RichTextNode {
  type?: string;
  children?: Array<{ text?: string; bold?: boolean; italic?: boolean }>;
  tag?: string;
  text?: string;
}

function RichTextContent({ content }: { content: unknown }) {
  if (typeof content === 'string') {
    return <p>{content}</p>;
  }

  if (!Array.isArray(content)) {
    // Handle Lexical root object format
    if (content && typeof content === 'object' && 'root' in content) {
      const root = (content as { root: { children: RichTextNode[] } }).root;
      if (root && Array.isArray(root.children)) {
        return <>{root.children.map((node, index) => renderNode(node, index))}</>;
      }
    }
    return null;
  }

  return <>{content.map((node: RichTextNode, index: number) => renderNode(node, index))}</>;
}

function renderNode(node: RichTextNode, index: number): React.ReactNode {
  if (node.type === 'paragraph' && node.children) {
    return (
      <p key={index}>
        {node.children.map((child, childIndex) => (
          <span key={childIndex} className={`${child.bold ? 'font-bold' : ''} ${child.italic ? 'italic' : ''}`}>
            {child.text}
          </span>
        ))}
      </p>
    );
  }
  if (node.type === 'heading' && node.children) {
    const HeadingComponent = node.tag === 'h1' ? 'h1' : node.tag === 'h2' ? 'h2' : node.tag === 'h4' ? 'h4' : 'h3';
    return (
      <HeadingComponent key={index}>
        {node.children.map((child, childIndex) => (
          <span key={childIndex}>{child.text}</span>
        ))}
      </HeadingComponent>
    );
  }
  if (node.text !== undefined) {
    return <span key={index}>{node.text}</span>;
  }
  return null;
}

// Paragraphs of the description, in order. Events have no dedicated summary
// field, so the hero standfirst is derived from the first one — but only when
// there is more than one, otherwise the standfirst and the "Sobre o evento"
// panel below it would print the same prose twice.
function paragraphTexts(content: unknown): string[] {
  if (typeof content === 'string') {
    const text = content.trim();
    return text ? [text] : [];
  }

  let nodes: RichTextNode[] = [];
  if (Array.isArray(content)) {
    nodes = content as RichTextNode[];
  } else if (content && typeof content === 'object' && 'root' in content) {
    nodes = (content as { root?: { children?: RichTextNode[] } }).root?.children ?? [];
  }

  const paragraphs: string[] = [];
  for (const node of nodes) {
    if (!node || node.type !== 'paragraph') continue;
    const text = (node.children ?? []).map(child => child.text ?? '').join('').trim();
    if (text) paragraphs.push(text);
  }
  return paragraphs;
}

function truncateAtWord(text: string, max = 170): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

const tagIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Net: Radio,
  Contest: Activity,
  Meetup: Mic2,
  Satellite: SatelliteDish,
  DX: Globe2,
  Default: Info,
};

// Single azulejo brand palette for every tag — differentiate by icon, not hue.
const azulejoTagColors = {
  text: 'text-azulejo-600 dark:text-azulejo-400',
  textLight: 'text-azulejo-100',
  bg: 'bg-azulejo-50 dark:bg-azulejo-900/30',
  bgHover: 'hover:bg-azulejo-100 dark:hover:bg-azulejo-800/40',
  border: 'border-azulejo-200 dark:border-azulejo-800',
  solid: 'bg-azulejo-500',
  accent: 'bg-azulejo-400',
  ring: 'ring-azulejo-400/30',
};

function getTagColors(_tag?: string) {
  return azulejoTagColors;
}

function TagIcon({ tag, className }: { tag?: string; className?: string }) {
  const Cmp = tag && tagIconMap[tag] ? tagIconMap[tag] : tagIconMap.Default;
  return <Cmp className={className || "w-4 h-4"} />;
}

// Operating-plan modes. Digital voice modes are the destructive red used for
// DMR everywhere else in the app; analog voice takes the azulejo ramp.
// Every bar carries 13px white text, so the fill must clear 4.5:1 against
// white: azulejo-500 is 6.04:1, azulejo-400 only 4.26:1 — hence no 400 here.
type ModePresentation = {
  icon: React.ComponentType<{ className?: string }>;
  bar: string;
  accent: string;
  digital: boolean;
};

function getModePresentation(mode: string): ModePresentation {
  switch ((mode || '').toUpperCase()) {
    case 'DMR':
    case 'D-STAR':
    case 'C4FM':
      return { icon: Radio, bar: 'bg-destructive', accent: 'text-destructive', digital: true };
    case 'SSB':
    case 'CW':
      return {
        icon: AudioLines,
        bar: 'bg-azulejo-500',
        accent: 'text-azulejo-600 dark:text-azulejo-400',
        digital: false,
      };
    case 'FT8':
      return {
        icon: Waves,
        bar: 'bg-azulejo-500',
        accent: 'text-azulejo-600 dark:text-azulejo-400',
        digital: false,
      };
    default:
      return {
        icon: RadioTower,
        bar: 'bg-azulejo-500',
        accent: 'text-azulejo-600 dark:text-azulejo-400',
        digital: false,
      };
  }
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
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(start: string, end?: string): string | null {
  if (!end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const minutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

  if (minutes < 60) return `${minutes} minutos`;
  if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.round(minutes / 1440);
  return `${days} ${days === 1 ? 'dia' : 'dias'}`;
}

// ---- Time zone handling ----
// displayTimezone defaults to UTC, the convention for contests and nets: in that
// case local and UTC are the same instant rendering, so only one line is shown.
// A real zone makes local time lead, with the UTC equivalent underneath.
const UTC_ZONE = 'UTC';

const ZONE_LABEL_KEYS: Record<string, string> = {
  'UTC': 'zoneUtc',
  'Europe/Lisbon': 'zoneLisbon',
  'Atlantic/Azores': 'zoneAzores',
  'Atlantic/Madeira': 'zoneMadeira',
};

// Intl's timeZoneName: 'short' yields "GMT+1" for Europe/Lisbon in every common
// locale, so the radio-facing abbreviations come from a static table instead.
const ZONE_ABBREVIATIONS: Record<string, { standard: string; summer: string }> = {
  'Europe/Lisbon': { standard: 'WET', summer: 'WEST' },
  'Atlantic/Madeira': { standard: 'WET', summer: 'WEST' },
  'Atlantic/Azores': { standard: 'AZOT', summer: 'AZOST' },
  'UTC': { standard: 'UTC', summer: 'UTC' },
};

function tzOffsetMinutes(value: string | number, zone: string): number {
  try {
    const date = new Date(value);
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).formatToParts(date);
    const get = (type: string) => Number(parts.find(p => p.type === type)?.value ?? '0');
    const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
    return Math.round((asUtc - date.getTime()) / 60000);
  } catch {
    return 0;
  }
}

function offsetLabel(value: string | number, zone: string): string {
  const minutes = tzOffsetMinutes(value, zone);
  if (minutes === 0) return 'UTC';
  const sign = minutes > 0 ? '+' : '-';
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const rest = abs % 60;
  return `UTC${sign}${hours}${rest ? `:${String(rest).padStart(2, '0')}` : ''}`;
}

function zoneAbbreviation(value: string | number, zone: string): string {
  const entry = ZONE_ABBREVIATIONS[zone];
  if (!entry) return offsetLabel(value, zone);
  const january = Date.UTC(new Date(value).getUTCFullYear(), 0, 15);
  return tzOffsetMinutes(value, zone) > tzOffsetMinutes(january, zone) ? entry.summer : entry.standard;
}

function formatInZone(value: string | number, zone: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(value).toLocaleString('pt-PT', { timeZone: zone, ...opts });
}

function formatClock(value: string | number, zone: string) {
  return formatInZone(value, zone, { hour: '2-digit', minute: '2-digit' });
}

function formatShortDate(value: string | number, zone: string, withYear = false) {
  return formatInZone(value, zone, {
    day: '2-digit',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

function formatLongDate(value: string | number, zone: string) {
  return formatInZone(value, zone, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Drift-resistant ticker
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

// Live indicator with pulsing animation - enhanced editorial style
function LiveIndicator({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-green-600 shadow-sm animate-in fade-in zoom-in-95 duration-300">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
      </span>
      <span className="text-sm font-bold tracking-wider text-white">
        {label}
      </span>
    </div>
  );
}

// Progress bar for multi-day events - refined with glow effect
function EventProgressBar({ start, end, label }: { start: string; end: string; label: string }) {
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const progress = Math.min(100, Math.max(0, ((now - startMs) / (endMs - startMs)) * 100));

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-white/70">{label}</span>
        <span className="font-mono font-bold text-white">{Math.round(progress)}%</span>
      </div>
      <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// Editorial-style countdown unit with CSS animation
function CountdownUnit({ value, label, isLight = false }: { value: string; label: string; isLight?: boolean }) {
  return (
    <div className="flex flex-col items-center">
      <div className={`relative px-3 sm:px-4 py-2 sm:py-3 rounded-xl ${
        isLight
          ? 'bg-white/10'
          : 'bg-azulejo-100 dark:bg-azulejo-900/50'
      }`}>
        <span
          key={value}
          className={`block text-3xl sm:text-4xl md:text-5xl font-bold font-mono tabular-nums tracking-tight transition-all duration-150 ${
            isLight ? 'text-white' : 'text-azulejo-900 dark:text-azulejo-100'
          }`}
        >
          {value}
        </span>
      </div>
      <span className={`text-[10px] sm:text-xs tracking-wider mt-2 font-medium ${
        isLight ? 'text-white/70' : 'text-azulejo-500 dark:text-azulejo-400'
      }`}>
        {label}
      </span>
    </div>
  );
}

// Separator for countdown
function CountdownSeparator({ isLight = false }: { isLight?: boolean }) {
  return (
    <div className="flex flex-col justify-center gap-1.5 px-1">
      <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-white/40' : 'bg-azulejo-300 dark:bg-azulejo-600'}`} />
      <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-white/40' : 'bg-azulejo-300 dark:bg-azulejo-600'}`} />
    </div>
  );
}

// Countdown display component - editorial magazine style
function CountdownDisplay({
  ms,
  label,
  isLight = false,
  align = 'center',
}: {
  ms: number;
  label: string;
  isLight?: boolean;
  align?: 'left' | 'center';
}) {
  const { days, hours, minutes, seconds } = breakdown(ms);

  return (
    <div className={align === 'left' ? 'text-left' : 'text-center'}>
      <div className={`text-sm font-medium tracking-wider mb-4 ${
        isLight ? 'text-white/70' : 'text-azulejo-500 dark:text-azulejo-400'
      }`}>
        {label}
      </div>
      <div className={`flex items-start gap-1 sm:gap-2 ${align === 'left' ? 'justify-start' : 'justify-center'}`}>
        {days > 0 && (
          <>
            <CountdownUnit value={String(days)} label="dias" isLight={isLight} />
            <CountdownSeparator isLight={isLight} />
          </>
        )}
        <CountdownUnit value={String(hours).padStart(2, '0')} label="horas" isLight={isLight} />
        <CountdownSeparator isLight={isLight} />
        <CountdownUnit value={String(minutes).padStart(2, '0')} label="min" isLight={isLight} />
        <CountdownSeparator isLight={isLight} />
        <CountdownUnit value={String(seconds).padStart(2, '0')} label="seg" isLight={isLight} />
      </div>
    </div>
  );
}

// Related event card - magazine-style compact cards
function RelatedEventCard({ event, tagColors }: { event: EventItem; tagColors: ReturnType<typeof getTagColors> }) {
  return (
    <Link href={`/events/${encodeURIComponent(event.id)}/`} className="block group">
      <div
        className={`p-4 rounded-xl border ${tagColors.border} ${tagColors.bg} ${tagColors.bgHover} transition-all duration-200 min-w-[220px] hover:-translate-y-0.5`}
      >
        <div className="flex items-start gap-3">
          <div className={`shrink-0 p-2 rounded-lg ${tagColors.solid}/10`}>
            <TagIcon tag={event.tag} className={`w-4 h-4 ${tagColors.text}`} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-semibold line-clamp-2 group-hover:text-foreground transition-colors">
              {event.title}
            </span>
            <div className={`text-xs mt-1 ${tagColors.text} font-medium font-mono`}>
              {new Date(event.start).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

const API_BASE_URL = (() => {
  const source =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000'
      : process.env.PAYLOAD_API_BASE_URL || process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || 'http://localhost:3000';
  return source.replace(/\/$/, '');
})();

async function fetchEventById(eventId: string): Promise<EventItem | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/events/list?limit=500`);
    if (!response.ok) return null;
    const data = await response.json();
    const events: EventItem[] = data.docs || [];
    return events.find(e => e.id === eventId) || null;
  } catch {
    return null;
  }
}

// ---- Operating-plan geometry ----
const HOUR_MS = 3_600_000;
const DAY_MS = 24 * HOUR_MS;
const MIN_BAR_PCT = 1.5;
const INLINE_LABEL_MIN_PCT = 20;
// A multi-day range reads "12/09 10:00 – 13/09 02:00": about twice as wide as a
// same-day one, so it needs about twice the bar before it fits inside it.
const INLINE_LABEL_MIN_PCT_MULTIDAY = 45;

type PlanRow = {
  key: string;
  window: EventOperatingWindow;
  leftPct: number;
  widthPct: number;
  clippedStart: boolean;
  clippedEnd: boolean;
  outside: boolean;
};

interface EventDetailsClientProps {
  event?: EventItem;
  eventId: string;
  allEvents?: EventItem[];
}

export default function EventDetailsClient({ event: initialEvent, eventId, allEvents = [] }: EventDetailsClientProps) {
  const t = useTranslations('events');
  const tDetails = useTranslations('events.detailsPage');
  const [event, setEvent] = useState<EventItem | null>(initialEvent || null);
  const [loading, setLoading] = useState(!initialEvent);
  const [notFoundState, setNotFoundState] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [callsignCopied, setCallsignCopied] = useState(false);

  useTick(1000);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback: fetch from API if event wasn't pre-rendered
  useEffect(() => {
    if (!initialEvent && !event && !notFoundState) {
      setLoading(true);
      fetchEventById(eventId)
        .then(data => {
          if (data) {
            setEvent(data);
          } else {
            setNotFoundState(true);
          }
        })
        .finally(() => setLoading(false));
    }
  }, [initialEvent, eventId, event, notFoundState]);

  // Calculate values only when event is available
  const now = Date.now();
  const startTime = event ? new Date(event.start).getTime() : 0;
  const endTime = event?.end ? new Date(event.end).getTime() : startTime + 3600000;
  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;
  const isInProgress = hasStarted && !hasEnded;

  const remainingToStart = event ? msUntil(event.start) : 0;
  const remainingToEnd = event?.end ? msUntil(event.end) : 0;

  const tagColors = getTagColors(event?.tag);
  const duration = event ? formatDuration(event.start, event.end) : null;
  const imageUrl = getImageUrl(event?.featuredImage?.url);

  const extras: Partial<EventItem> = event ?? {};
  const zone = extras.displayTimezone || UTC_ZONE;
  // UTC is the schema default: local and UTC then render identically, so the
  // dual-time treatment collapses to the single line the page has always shown.
  const showsDualTime = zone !== UTC_ZONE;

  // Real event bounds for the timeline (unlike endTime, no +1h fallback).
  // An event may legitimately have no `end` while still carrying a plan, so the
  // last window's end closes the scale — otherwise the span would be zero and
  // every window would read as out of bounds, blanking the whole timeline.
  const planStartMs = startTime;
  const lastWindowEndMs = (extras.operatingPlan ?? []).reduce((max, w) => {
    const end = Date.parse(w?.end ?? '');
    return Number.isFinite(end) && end > max ? end : max;
  }, 0);
  const planEndMs = event?.end
    ? new Date(event.end).getTime()
    : Math.max(startTime, lastWindowEndMs);
  const planSpan = planEndMs - planStartMs;
  const isMultiDay = planSpan > DAY_MS;
  const usesCardListOnly = planSpan <= 0 || planSpan > 7 * DAY_MS;

  const planRows = useMemo<PlanRow[]>(() => {
    const windows = (extras.operatingPlan ?? []).filter(
      w => w && typeof w.start === 'string' && typeof w.end === 'string'
        && Number.isFinite(Date.parse(w.start)) && Number.isFinite(Date.parse(w.end))
    );
    const sorted = [...windows].sort(
      (a, b) => Date.parse(a.start) - Date.parse(b.start) || Date.parse(b.end) - Date.parse(a.end)
    );

    return sorted.map((w, index) => {
      const rawStart = Date.parse(w.start);
      const rawEnd = Date.parse(w.end);
      const clampedStart = Math.min(Math.max(rawStart, planStartMs), planEndMs);
      const clampedEnd = Math.min(Math.max(rawEnd, planStartMs), planEndMs);
      const outside = planSpan <= 0 || rawEnd <= planStartMs || rawStart >= planEndMs;
      const widthPct = planSpan > 0
        ? Math.min(100, Math.max(((clampedEnd - clampedStart) / planSpan) * 100, MIN_BAR_PCT))
        : 100;
      const leftPct = planSpan > 0
        ? Math.min(((clampedStart - planStartMs) / planSpan) * 100, 100 - widthPct)
        : 0;

      return {
        key: w.id ?? `${w.mode}-${w.start}-${index}`,
        window: w,
        leftPct,
        widthPct,
        clippedStart: rawStart < planStartMs,
        clippedEnd: rawEnd > planEndMs,
        outside,
      };
    });
  }, [extras.operatingPlan, planStartMs, planEndMs, planSpan]);

  const barRows = useMemo(() => planRows.filter(row => !row.outside), [planRows]);
  const outsideRows = useMemo(() => planRows.filter(row => row.outside), [planRows]);

  // Hour scale ticks, aligned to whole hours in the display timezone.
  const planTicks = useMemo(() => {
    if (planSpan <= 0) return [];
    const stepHours = planSpan <= 8 * HOUR_MS ? 1
      : planSpan <= 16 * HOUR_MS ? 2
      : planSpan <= 24 * HOUR_MS ? 3
      : planSpan <= 48 * HOUR_MS ? 6
      : 24;
    const step = stepHours * HOUR_MS;

    // The first and last ticks are the event bounds themselves; drop any hour
    // boundary that would collide with them when the event starts off the hour.
    const edgeGuard = planSpan * 0.08;
    const values: number[] = [planStartMs];
    // The offset is resolved per candidate instant: sampling it once at the
    // event start would step in UTC hours, so an event crossing a DST
    // changeover would repeat (or skip) a wall-clock hour on the scale.
    let t = planStartMs;
    while (t < planEndMs) {
      const offset = tzOffsetMinutes(t, zone) * 60000;
      const next = Math.floor((t + offset) / step) * step + step - offset;
      t = next > t ? next : t + step;
      if (t < planEndMs && t - planStartMs > edgeGuard && planEndMs - t > edgeGuard) values.push(t);
    }
    values.push(planEndMs);

    const max = 9;
    const kept = values.length > max
      ? values.filter((_, i) => i === 0 || i === values.length - 1 || i % Math.ceil(values.length / max) === 0)
      : values;

    // Belt and braces: a repeated wall-clock hour must never print twice. The
    // two bounds are exempt — a 24h event legitimately opens and closes at the
    // same wall-clock time, and the scale needs both of its ends.
    const seen = new Set<string>();
    const ticks: Array<{ value: number; pct: number; label: string }> = [];
    kept.forEach((value, index) => {
      const label = isMultiDay
        ? `${formatShortDate(value, zone)} ${formatClock(value, zone)}`
        : formatClock(value, zone);
      const isBound = index === 0 || index === kept.length - 1;
      if (!isBound && seen.has(label)) return;
      seen.add(label);
      ticks.push({ value, pct: ((value - planStartMs) / planSpan) * 100, label });
    });
    return ticks;
  }, [planStartMs, planEndMs, planSpan, zone, isMultiDay]);

  // Mobile groups consecutive windows that share a mode + network.
  const planGroups = useMemo(() => {
    const groups: Array<{ key: string; mode: string; network?: string; rows: PlanRow[] }> = [];
    for (const row of planRows) {
      const last = groups[groups.length - 1];
      if (last && last.mode === row.window.mode && (last.network ?? '') === (row.window.network ?? '')) {
        last.rows.push(row);
      } else {
        groups.push({ key: row.key, mode: row.window.mode, network: row.window.network, rows: [row] });
      }
    }
    return groups;
  }, [planRows]);

  const secondBucket = Math.floor(now / 1000);
  // Derived from barRows, not planRows: a window the timeline files under
  // "outside the event" must not drive the hero tiles or the "opens with" strip.
  const { currentWindows, upcomingWindows, openingWindows } = useMemo(() => {
    const current = barRows
      .filter(row => Date.parse(row.window.start) <= now && now < Date.parse(row.window.end))
      .sort((a, b) =>
        Date.parse(b.window.start) - Date.parse(a.window.start)
        || (Date.parse(a.window.end) - Date.parse(a.window.start))
           - (Date.parse(b.window.end) - Date.parse(b.window.start))
      );
    const upcoming = barRows
      .filter(row => Date.parse(row.window.start) > now)
      .sort((a, b) => Date.parse(a.window.start) - Date.parse(b.window.start));
    const firstStart = barRows.length
      ? Math.min(...barRows.map(row => Date.parse(row.window.start)))
      : 0;
    const opening = barRows.filter(row => Date.parse(row.window.start) === firstStart);
    return { currentWindows: current, upcomingWindows: upcoming, openingWindows: opening };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barRows, secondBucket]);

  // Location splits on an explicit separator into place + venue detail.
  const [locationPrimary, locationSecondary] = useMemo(() => {
    const raw = event?.location?.trim();
    if (!raw) return [null, null] as const;
    const parts = raw.split(/\s+[·—]\s+/);
    return parts.length > 1 ? ([parts[0], parts.slice(1).join(' · ')] as const) : ([raw, null] as const);
  }, [event?.location]);

  const heroSummary = useMemo(() => {
    const paragraphs = paragraphTexts(event?.description);
    // A single-paragraph description is reprinted in full by the "Sobre o
    // evento" panel, so a standfirst there would be pure duplication.
    return paragraphs.length > 1 ? truncateAtWord(paragraphs[0]) : null;
  }, [event?.description]);

  // Related events by tag
  const relatedByTag = useMemo(() => {
    if (!event?.tag) return [];
    return allEvents
      .filter(e => e.id !== event.id && e.tag === event.tag && new Date(e.start).getTime() > Date.now())
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
      .slice(0, 4);
  }, [allEvents, event?.id, event?.tag]);

  // Next/Previous events
  const sortedEvents = useMemo(() =>
    [...allEvents].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()),
    [allEvents]
  );

  const currentIndex = event ? sortedEvents.findIndex(e => e.id === event.id) : -1;
  const prevEvent = currentIndex > 0 ? sortedEvents[currentIndex - 1] : null;
  const nextEvent = currentIndex < sortedEvents.length - 1 ? sortedEvents[currentIndex + 1] : null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleCopyCallsign = async () => {
    if (!extras.callsign) return;
    try {
      await navigator.clipboard.writeText(extras.callsign);
      setCallsignCopied(true);
      setTimeout(() => setCallsignCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareText = event ? `${event.title} - ${new Date(event.start).toLocaleDateString('pt-PT')}` : '';
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  // Loading skeleton
  if (!mounted || loading) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Not found state
  if (notFoundState || !event) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <Link href="/events/">
          <Button variant="ghost" size="sm" className="gap-2 pl-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            {tDetails('backToEvents')}
          </Button>
        </Link>
        <Card className="rounded-2xl p-8 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-2">{t('notFound') || 'Evento não encontrado'}</h1>
          <p className="text-muted-foreground mb-4">
            {t('notFoundDescription') || 'O evento que procura não existe ou foi removido.'}
          </p>
          <Link href="/events/">
            <Button>{t('backToEvents') || 'Ver todos os eventos'}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  // ---- Derived presentation values (event is guaranteed from here on) ----
  const currentEvent = event;
  const eventYear = new Date(currentEvent.start).getUTCFullYear();
  const showYear = eventYear !== new Date().getUTCFullYear();

  const clockIn = (value: string | number) => formatClock(value, zone);
  const clockUtc = (value: string | number) => formatClock(value, UTC_ZONE);

  // A window whose end is not after its start (a legacy dmr/talkgroup event with
  // no `end` synthesizes exactly that) has no range worth printing: "10–10h"
  // says nothing, so the label and network carry the card on their own.
  const windowRange = (row: PlanRow): string | null => {
    if (Date.parse(row.window.end) <= Date.parse(row.window.start)) return null;
    const startLabel = isMultiDay
      ? `${formatShortDate(row.window.start, zone)} ${clockIn(row.window.start)}`
      : clockIn(row.window.start);
    const endLabel = isMultiDay
      ? `${formatShortDate(row.window.end, zone)} ${clockIn(row.window.end)}`
      : clockIn(row.window.end);
    const range = tDetails('timeRange', { start: startLabel, end: endLabel });
    return `${row.clippedStart ? '‹' : ''}${range}${row.clippedEnd ? '›' : ''}`;
  };

  const windowShortRange = (row: PlanRow): string | null => {
    if (Date.parse(row.window.end) <= Date.parse(row.window.start)) return null;
    if (isMultiDay) return windowRange(row);
    const startLabel = clockIn(row.window.start);
    const endLabel = clockIn(row.window.end);
    if (startLabel.endsWith(':00') && endLabel.endsWith(':00')) {
      return tDetails('timeRangeShort', {
        start: startLabel.slice(0, -3),
        end: endLabel.slice(0, -3),
      });
    }
    return tDetails('timeRange', { start: startLabel, end: endLabel });
  };

  const windowSecondary = (w: EventOperatingWindow) =>
    [w.network || w.mode, w.frequency].filter(Boolean).join(' · ');

  const zoneName = ZONE_LABEL_KEYS[zone] ? tDetails(ZONE_LABEL_KEYS[zone]) : zone;
  const zoneCaptionShort = tDetails('timesInZone', { zone: zoneName });
  const zoneCaptionLong = showsDualTime
    ? tDetails('timesInZoneOffset', { zone: zoneName, offset: offsetLabel(currentEvent.start, zone) })
    : zoneCaptionShort;

  const heroDateTitle = formatLongDate(currentEvent.start, zone);
  const primaryRange = currentEvent.end
    ? `${clockIn(currentEvent.start)}–${clockIn(currentEvent.end)}`
    : clockIn(currentEvent.start);
  const utcRange = currentEvent.end
    ? `${clockUtc(currentEvent.start)}–${clockUtc(currentEvent.end)}`
    : clockUtc(currentEvent.start);
  const heroTimeLine = showsDualTime
    ? tDetails('timeRangeLocalUtc', { local: primaryRange, utc: utcRange })
    : tDetails('utcSuffix', { time: utcRange });

  const organizer = extras.organizer;
  const organizerPrimary = organizer
    ? (organizer.abbreviation || organizer.displayName || organizer.name)
    : extras.organizerName;
  const organizerSecondary = organizer && organizer.name !== organizerPrimary ? organizer.name : null;
  const organizerLogoUrl = getImageUrl(organizer?.logo?.url);

  const qsl = extras.qsl;
  const qslAvailable = Boolean(qsl?.available);
  const qslPending = Boolean(qsl?.availableFrom && Date.parse(qsl.availableFrom) > now);
  const qslFromLabel = qsl?.availableFrom
    ? tDetails('qslAvailableFrom', { date: formatShortDate(qsl.availableFrom, zone, true) })
    : null;
  const qslClaimLabel = organizerPrimary
    ? tDetails('qslClaimAt', { org: organizerPrimary })
    : tDetails('qslClaimGeneric');

  // Duration sub-line: a single window (or a set that all but covers the event)
  // reads as a continuous session; anything else is a count of windows. One
  // full-span window alongside shorter ones is still several windows, so this
  // tests every row rather than any row.
  const durationDetail = planRows.length === 0
    ? null
    : planRows.length === 1 || planRows.every(row => row.widthPct >= 95)
      ? tDetails('continuousSession')
      : tDetails('sessionCount', { count: planRows.length });

  const planNotes = Array.from(
    new Set(planRows.map(row => row.window.notes?.trim()).filter((note): note is string => Boolean(note)))
  );
  // Every BrandMeister talkgroup in the plan gets its own hose link, labelled
  // with its number — a single unlabelled link would silently point at the
  // first talkgroup even while a later one is the live one.
  const brandmeisterTalkgroups = Array.from(
    new Set(
      planRows
        .filter(row => row.window.talkgroup && /brandmeister/i.test(row.window.network ?? ''))
        .map(row => row.window.talkgroup as number)
    )
  );

  const heroGradient = hasEnded
    ? 'bg-gradient-to-br from-azulejo-800 to-azulejo-700'
    : 'bg-gradient-to-br from-azulejo-900 via-azulejo-700 via-[58%] to-azulejo-600';

  const mapUrl = currentEvent.location
    ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(currentEvent.location)}`
    : null;

  const calendarMenuItems = (
    <>
      <DropdownMenuItem onClick={() => downloadICS(currentEvent)} className="gap-2">
        <Download className="w-4 h-4" />
        {tDetails('downloadIcs')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(currentEvent), '_blank')} className="gap-2">
        <CalendarIcon className="w-4 h-4" />
        {tDetails('googleCalendar')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(currentEvent), '_blank')} className="gap-2">
        <CalendarIcon className="w-4 h-4" />
        {tDetails('outlookCalendar')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => downloadICS(currentEvent)} className="gap-2">
        <CalendarIcon className="w-4 h-4" />
        {tDetails('appleCalendar')}
      </DropdownMenuItem>
    </>
  );

  const shareMenuItems = (
    <>
      <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
        {linkCopied ? <Check className="w-4 h-4 text-green-500" /> : <Link2 className="w-4 h-4" />}
        {linkCopied ? tDetails('copied') : tDetails('copyLink')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => window.open(getWhatsAppShareUrl(shareText, shareUrl), '_blank')} className="gap-2">
        <MessageCircle className="w-4 h-4" />
        {tDetails('whatsapp')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(getTelegramShareUrl(shareText, shareUrl), '_blank')} className="gap-2">
        <MessageCircle className="w-4 h-4" />
        {tDetails('telegram')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(getTwitterShareUrl(shareText, shareUrl), '_blank')} className="gap-2">
        <Globe2 className="w-4 h-4" />
        {tDetails('twitter')}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => window.open(getFacebookShareUrl(shareUrl), '_blank')} className="gap-2">
        <Globe2 className="w-4 h-4" />
        {tDetails('facebook')}
      </DropdownMenuItem>
    </>
  );

  // ---- Hero state blocks ----
  const renderOnAirTile = (
    eyebrow: string,
    row: PlanRow,
    detail: string,
    extraCount = 0,
    dimmed = false,
    onAir = false,
  ) => {
    const mode = getModePresentation(row.window.mode);
    return (
      <div className="flex-1 min-w-0 p-3.5 px-4 rounded-xl bg-white/10 border border-white/15">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-xs tracking-wider text-white/65">{eyebrow}</span>
          {extraCount > 0 && (
            <span className="shrink-0 font-mono text-[11px] px-1.5 py-0.5 rounded-full bg-white/15 text-white/80">
              {tDetails('moreWindows', { count: extraCount })}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          {onAir && mode.digital && (
            <span className="inline-flex size-2 shrink-0 rounded-full bg-destructive" />
          )}
          <span className={`font-mono text-lg font-bold truncate ${dimmed ? 'text-white/70' : 'text-white'}`}>
            {`${row.window.mode} ${row.window.label}`}
          </span>
        </div>
        <div className="text-[13px] text-white/65 mt-1 truncate">{detail}</div>
      </div>
    );
  };

  const renderLiveState = () => {
    const activeRow = currentWindows[0];
    const nextRow = upcomingWindows[0];

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <LiveIndicator label={t('happeningNow')} />
          {currentEvent.end && (
            <span className="font-mono text-sm text-white/75">
              {showsDualTime
                ? tDetails('endsAtLocalUtc', {
                    local: clockIn(currentEvent.end),
                    utc: clockUtc(currentEvent.end),
                  })
                : tDetails('endsAtUtc', { time: clockUtc(currentEvent.end) })}
            </span>
          )}
        </div>

        {currentEvent.end && remainingToEnd > 0 && (
          <EventProgressBar start={currentEvent.start} end={currentEvent.end} label={tDetails('progress')} />
        )}

        {activeRow || nextRow ? (
          <div className="flex flex-col sm:flex-row gap-3">
            {activeRow
              ? renderOnAirTile(
                  tDetails('onAirNow'),
                  activeRow,
                  [activeRow.window.network, tDetails('untilTime', { time: clockIn(activeRow.window.end) })]
                    .filter(Boolean)
                    .join(' · '),
                  Math.max(0, currentWindows.length - 1),
                  false,
                  true,
                )
              : nextRow
                ? renderOnAirTile(
                    tDetails('onAirNext'),
                    nextRow,
                    tDetails('fromTo', {
                      start: clockIn(nextRow.window.start),
                      end: clockIn(nextRow.window.end),
                    }),
                    0,
                    true,
                  )
                : null}
            {activeRow && nextRow && renderOnAirTile(
              tDetails('upNext'),
              nextRow,
              tDetails('fromTo', {
                start: clockIn(nextRow.window.start),
                end: clockIn(nextRow.window.end),
              }),
            )}
          </div>
        ) : (
          currentEvent.end && remainingToEnd > 0 && (
            <CountdownDisplay ms={remainingToEnd} label={t('endsIn')} isLight align="left" />
          )
        )}
      </div>
    );
  };

  const renderEndedState = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Clock className="w-[22px] h-[22px] text-white/70" />
        <span className="text-xl font-semibold text-white/90">{t('ended')}</span>
        <span className="font-mono text-sm text-white/60">
          {tDetails('endedOn', {
            date: formatShortDate(currentEvent.start, zone, true),
            range: primaryRange,
          })}
        </span>
      </div>

      {qslAvailable && (
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-4.5 sm:px-5 rounded-2xl bg-white/10 border border-white/15">
          <div className="flex-1 min-w-0">
            {/* The instructions prose sits in the "Depois do contacto" card
                directly below; repeating it here would print it twice. */}
            <div className="text-base font-semibold text-white mb-1">{tDetails('qslReadyTitle')}</div>
            {qslPending && qslFromLabel && (
              <div className="text-sm text-white/70 mt-1">{qslFromLabel}</div>
            )}
          </div>
          {qsl?.url && !qslPending && (
            <Button
              asChild
              className="shrink-0 h-11 px-4.5 bg-none bg-white text-azulejo-700 hover:bg-white/90 shadow-[0_2px_6px_oklch(0.27_0.05_245/0.35)]"
            >
              <a href={qsl.url} target="_blank" rel="noreferrer">
                <Download className="w-4 h-4" />
                {tDetails('qslClaim')}
              </a>
            </Button>
          )}
        </div>
      )}
    </div>
  );

  const renderUpcomingState = () => (
    <div className="space-y-5">
      <CountdownDisplay ms={remainingToStart} label={t('startsIn')} isLight align="left" />
      {openingWindows.length > 0 && (
        <div className="flex items-start gap-2.5 p-3 px-4 rounded-xl bg-white/10 border border-white/15">
          <Clock className="w-[18px] h-[18px] text-white/70 shrink-0 mt-0.5" />
          <span className="text-sm text-white/85">
            {tDetails.rich('opensWith', {
              what: openingWindows.map(row => row.window.label).join(tDetails('andJoin')),
              time: clockIn(openingWindows[0].window.start),
              b: (chunks) => <strong className="font-semibold text-white">{chunks}</strong>,
            })}
          </span>
        </div>
      )}
    </div>
  );

  // ---- Body sections ----
  const planSection = planRows.length > 0 && (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-3.5 sm:mb-4">
        <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-[-0.01em]">
          <Radio className="w-5 h-5 text-azulejo-600 dark:text-azulejo-400" />
          {tDetails('operatingPlan')}
        </h2>
        <span className="font-mono text-xs sm:text-[13px] text-muted-foreground pl-[30px] sm:pl-0">
          <span className="hidden sm:inline">{zoneCaptionLong}</span>
          <span className="sm:hidden">{zoneCaptionShort}</span>
        </span>
      </div>

      {/* Desktop: labelled timeline with a fixed 192px label column */}
      {!usesCardListOnly && (
        <Card
          className="hidden md:block rounded-2xl p-6 gap-0"
          role="group"
          aria-label={tDetails('operatingPlanAria', {
            start: `${formatShortDate(currentEvent.start, zone, showYear)} ${clockIn(currentEvent.start)}`,
            end: `${formatShortDate(planEndMs, zone, showYear)} ${clockIn(planEndMs)}`,
          })}
        >
          {planTicks.length > 0 && (
            <div className="relative h-4 ml-52 mb-2.5" aria-hidden="true">
              {planTicks.map((tick, index) => (
                <span
                  key={tick.value}
                  className={`absolute top-0 font-mono text-xs text-muted-foreground whitespace-nowrap ${
                    index === 0 ? '' : index === planTicks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'
                  }`}
                  style={{ left: `${tick.pct}%` }}
                >
                  {tick.label}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            {barRows.map(row => {
              const mode = getModePresentation(row.window.mode);
              const ModeIcon = mode.icon;
              const secondary = windowSecondary(row.window);
              const range = windowRange(row);
              // A multi-day range is a date+time pair on both ends — roughly
              // twice as wide — so it needs twice the bar before it fits.
              const labelInside = Boolean(range)
                && row.widthPct >= (isMultiDay ? INLINE_LABEL_MIN_PCT_MULTIDAY : INLINE_LABEL_MIN_PCT);
              const barClasses = [
                'absolute inset-y-0 rounded-lg',
                mode.bar,
                row.clippedStart ? 'rounded-l-none' : '',
                row.clippedEnd ? 'rounded-r-none' : '',
              ].join(' ');

              return (
                <div
                  key={row.key}
                  className="flex items-center gap-4"
                  role="group"
                  aria-label={tDetails('windowAria', {
                    label: row.window.label,
                    mode: row.window.mode,
                    start: clockIn(row.window.start),
                    end: clockIn(row.window.end),
                  })}
                >
                  <div className="w-48 shrink-0 flex items-center gap-2.5">
                    <ModeIcon className={`w-[18px] h-[18px] shrink-0 ${mode.accent}`} />
                    <div className="min-w-0">
                      <div className={`text-sm truncate ${mode.digital ? 'font-mono font-bold text-destructive' : 'font-semibold'}`}>
                        {row.window.label}
                      </div>
                      {secondary && (
                        <div className="text-xs text-muted-foreground truncate">{secondary}</div>
                      )}
                    </div>
                  </div>
                  <div className="relative flex-1 h-9 rounded-lg bg-azulejo-50 dark:bg-azulejo-950/50">
                    <div
                      className={labelInside ? `${barClasses} flex items-center px-3.5` : barClasses}
                      style={{ left: `${row.leftPct}%`, width: `${row.widthPct}%` }}
                    >
                      {labelInside && (
                        <span className="text-[13px] font-semibold text-white whitespace-nowrap">{range}</span>
                      )}
                    </div>
                    {!labelInside && range && (
                      <span
                        className="absolute top-1/2 -translate-y-1/2 text-[13px] text-muted-foreground whitespace-nowrap"
                        style={
                          row.leftPct > 80
                            ? { right: `calc(${100 - row.leftPct}% + 8px)` }
                            : { left: `calc(${row.leftPct + row.widthPct}% + 8px)` }
                        }
                      >
                        {range}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {outsideRows.map(row => {
              const range = windowRange(row);
              return (
                <div key={row.key} className="flex items-center gap-4">
                  <div className="w-48 shrink-0 text-sm font-semibold truncate">{row.window.label}</div>
                  <div className="flex-1 text-[13px] text-muted-foreground">
                    {range ? `${range} · ` : ''}{tDetails('windowOutsideEvent')}
                  </div>
                </div>
              );
            })}
          </div>

          {(planNotes.length > 0 || brandmeisterTalkgroups.length > 0) && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-5 pt-4.5 border-t border-border">
              {planNotes.length > 0 ? (
                <div className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-muted-foreground max-w-[560px]">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{planNotes.join(' · ')}</span>
                </div>
              ) : <span />}
              {brandmeisterTalkgroups.length > 0 && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 shrink-0">
                  {brandmeisterTalkgroups.map(talkgroup => (
                    <a
                      key={talkgroup}
                      href={`https://hose.brandmeister.network/?tg=${talkgroup}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-destructive hover:underline"
                    >
                      {tDetails('listenTalkgroupTg', { tg: talkgroup })}
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Mobile (and very long events): one card per window, same proportions */}
      <div className={`${usesCardListOnly ? '' : 'md:hidden '}flex flex-col gap-2.5`}>
        {planGroups.map(group => {
          const mode = getModePresentation(group.mode);
          const ModeIcon = mode.icon;
          const grouped = group.rows.length > 1;

          if (!grouped) {
            const row = group.rows[0];
            const secondary = windowSecondary(row.window);
            const shortRange = windowShortRange(row);
            return (
              <Card key={group.key} className="rounded-2xl p-3.5 px-4 gap-0">
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ModeIcon className={`w-[18px] h-[18px] shrink-0 ${mode.accent}`} />
                    <div className="min-w-0">
                      <div className={`text-[15px] truncate ${mode.digital ? 'font-mono font-bold text-destructive' : 'font-semibold'}`}>
                        {row.window.label}
                      </div>
                      {secondary && <div className="text-xs text-muted-foreground truncate">{secondary}</div>}
                    </div>
                  </div>
                  {shortRange && (
                    <span className="font-mono text-[13px] text-muted-foreground shrink-0">
                      {shortRange}
                    </span>
                  )}
                </div>
                {row.outside && planSpan > 0 && (
                  <div className="text-xs text-muted-foreground mb-2.5">{tDetails('windowOutsideEvent')}</div>
                )}
                {!row.outside && (
                  <div className="relative h-2 rounded-full bg-azulejo-50 dark:bg-azulejo-950/50">
                    <div
                      className={`absolute inset-y-0 rounded-full ${mode.bar}`}
                      style={{ left: `${row.leftPct}%`, width: `${row.widthPct}%` }}
                    />
                  </div>
                )}
              </Card>
            );
          }

          return (
            <Card key={group.key} className="rounded-2xl p-3.5 px-4 gap-0">
              <div className="flex items-center gap-2.5 mb-3">
                <ModeIcon className={`w-[18px] h-[18px] shrink-0 ${mode.accent}`} />
                <span className="text-[15px] font-semibold truncate">
                  {[group.mode, group.network].filter(Boolean).join(' ')}
                </span>
              </div>
              <div className="flex flex-col gap-2.5">
                {group.rows.map(row => {
                  const range = windowRange(row);
                  return (
                    <div key={row.key}>
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span className={`text-[13px] truncate ${mode.digital ? 'font-mono font-bold text-destructive' : 'font-semibold'}`}>
                          {row.window.label}
                        </span>
                        {range && (
                          <span className="font-mono text-[13px] text-muted-foreground shrink-0">
                            {range}
                          </span>
                        )}
                      </div>
                      {row.outside && planSpan > 0 && (
                        <div className="text-xs text-muted-foreground mb-1.5">{tDetails('windowOutsideEvent')}</div>
                      )}
                      {!row.outside && (
                        <div className="relative h-2 rounded-full bg-azulejo-50 dark:bg-azulejo-950/50">
                          <div
                            className={`absolute inset-y-0 rounded-full ${mode.bar}`}
                            style={{ left: `${row.leftPct}%`, width: `${row.widthPct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}

        {(planNotes.length > 0 || brandmeisterTalkgroups.length > 0) && (
          <div className="flex flex-col gap-2.5 px-1">
            {planNotes.length > 0 && (
              <div className="flex items-start gap-2 text-[13px] leading-[1.5] text-muted-foreground">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{planNotes.join(' · ')}</span>
              </div>
            )}
            {brandmeisterTalkgroups.map(talkgroup => (
              <a
                key={talkgroup}
                href={`https://hose.brandmeister.network/?tg=${talkgroup}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 min-h-11 text-[13px] font-semibold text-destructive"
              >
                {tDetails('listenTalkgroupTg', { tg: talkgroup })}
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );

  const afterContactSection = qslAvailable && (
    <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-[-0.01em] mb-4">
        <Mail className="w-5 h-5 text-azulejo-600 dark:text-azulejo-400" />
        {tDetails('afterContact')}
      </h2>
      <Card className="rounded-2xl p-5 sm:p-6 gap-0">
        <div className="flex items-center gap-2.5 mb-2.5">
          <IdCard className="w-5 h-5 text-azulejo-600 dark:text-azulejo-400" />
          <h3 className="text-base font-bold">{tDetails('qslTitle')}</h3>
        </div>
        {qsl?.instructions && (
          <p className="text-sm leading-[1.6] text-muted-foreground text-pretty mb-4">{qsl.instructions}</p>
        )}
        {qsl?.url && !qslPending && (
          <Button asChild className="h-11 w-full sm:h-9 sm:w-auto sm:self-start">
            <a href={qsl.url} target="_blank" rel="noreferrer">
              <Download className="w-4 h-4" />
              {qslClaimLabel}
            </a>
          </Button>
        )}
        <div className="text-xs text-muted-foreground mt-2.5">
          {qslFromLabel ?? tDetails('qslNote')}
        </div>
      </Card>
    </section>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Full-width Hero Section */}
      <div className="relative animate-in fade-in duration-300">
        <div className={`relative overflow-hidden rounded-b-3xl shadow-lg ${heroGradient}`}>
          {/* Navigation bar */}
          <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-4 sm:pt-5">
            <div className="flex items-center justify-between">
              <Link href="/events/">
                <Button variant="ghost" size="sm" className="gap-2 pl-2 text-white/80 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4" />
                  {tDetails('backToEvents')}
                </Button>
              </Link>

              <div className="flex items-center gap-1 sm:gap-2">
                {prevEvent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/events/${encodeURIComponent(prevEvent.id)}/`} aria-label={tDetails('previousEvent')}>
                          <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-8 sm:w-8 text-white/70 hover:text-white hover:bg-white/10">
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{prevEvent.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {nextEvent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/events/${encodeURIComponent(nextEvent.id)}/`} aria-label={tDetails('nextEvent')}>
                          <Button variant="ghost" size="icon" className="h-11 w-11 sm:h-8 sm:w-8 text-white/70 hover:text-white hover:bg-white/10">
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{nextEvent.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>

          {/* Hero body — single column on mobile, content + rail on desktop */}
          <div className="relative z-10 grid gap-6 lg:gap-8 px-4 sm:px-6 md:px-8 pt-6 pb-8 sm:pb-9 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start">
            {/* Featured image — first on mobile, top of the rail on desktop */}
            {imageUrl && (
              <div className="lg:col-start-2 lg:row-start-1 rounded-2xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <div className="relative h-44 lg:h-[214px]">
                  <Image
                    src={imageUrl}
                    alt={currentEvent.featuredImage?.alt || currentEvent.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 380px"
                    priority
                  />
                </div>
              </div>
            )}

            {/* Main hero column */}
            <div className="min-w-0 lg:col-start-1 lg:row-start-1 lg:row-span-2">
              {/* Event Meta Row */}
              <div className="flex flex-wrap items-center gap-2 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-white/20 text-white border border-white/20">
                  <TagIcon tag={currentEvent.tag} className="w-3.5 h-3.5" />
                  {currentEvent.tag ?? t('event')}
                </span>

                {currentEvent.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold border bg-white/20 text-white border-white/20">
                    {currentEvent.category === 'international' ? <Globe2 className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                    {currentEvent.category === 'international' ? 'Internacional' : 'Nacional'}
                  </span>
                )}

                {currentEvent.isFeatured && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-semibold bg-amber-300 text-azulejo-900 border border-transparent">
                    <Sparkles className="w-3.5 h-3.5" />
                    {tDetails('featured')}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-[1.75rem] sm:text-4xl lg:text-[2.5rem] leading-[1.08] font-bold tracking-[-0.02em] text-white text-pretty mb-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {currentEvent.title}
              </h1>

              {/* Standfirst, derived from the description's opening paragraph */}
              {heroSummary && (
                <p className="text-[15px] sm:text-[17px] leading-[1.55] text-white/75 max-w-[500px] text-pretty mb-6">
                  {heroSummary}
                </p>
              )}

              {/* Special callsign */}
              {extras.callsign && (
                <div className="flex items-center gap-3 sm:gap-4 p-3.5 sm:px-4.5 mb-6 rounded-2xl bg-white/10 border border-white/15">
                  <div className="hidden sm:flex items-center justify-center size-11 shrink-0 rounded-xl bg-white/10 text-white">
                    <Radio className="w-[22px] h-[22px]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs tracking-wider font-medium text-white/65 mb-0.5">
                      {tDetails('callsignLabel')}
                    </div>
                    <div className="font-mono text-[26px] sm:text-3xl font-bold tracking-[-0.01em] text-white leading-[1.1] truncate">
                      {extras.callsign}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCallsign}
                    aria-label={tDetails('copyCallsign')}
                    className="hidden sm:inline-flex items-center gap-1.5 h-8 px-3 shrink-0 rounded-full text-[13px] text-white/90 border border-white/25 transition-colors hover:bg-white/10"
                  >
                    {callsignCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {callsignCopied ? tDetails('copied') : tDetails('copy')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyCallsign}
                    aria-label={tDetails('copyCallsign')}
                    className="sm:hidden inline-flex items-center justify-center size-11 shrink-0 rounded-xl text-white border border-white/25 transition-colors hover:bg-white/10"
                  >
                    {callsignCopied ? <Check className="w-[18px] h-[18px]" /> : <Copy className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              )}

              {/* Countdown / live / ended */}
              <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
                {isInProgress ? renderLiveState() : hasEnded ? renderEndedState() : renderUpcomingState()}
              </div>
            </div>

            {/* Hero rail — facts + primary actions */}
            <div className={`flex flex-col gap-4 min-w-0 lg:col-start-2 ${imageUrl ? 'lg:row-start-2' : 'lg:row-start-1'}`}>
              <div className="rounded-2xl p-4 sm:p-4.5 sm:px-5 bg-white/10 border border-white/15 flex flex-col gap-3.5">
                <div className="flex gap-3 items-start">
                  <CalendarIcon className="w-[18px] h-[18px] text-white/60 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold text-white leading-[1.35] first-letter:uppercase">
                      {heroDateTitle}
                    </div>
                    <div className="font-mono text-[13px] text-white/65 mt-0.5">{heroTimeLine}</div>
                  </div>
                </div>

                {currentEvent.location && (
                  <>
                    <div className="h-px bg-white/15" />
                    <div className="flex gap-3 items-start">
                      <MapPin className="w-[18px] h-[18px] text-white/60 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-white leading-[1.35]">{locationPrimary}</div>
                        {locationSecondary && (
                          <div className="text-[13px] text-white/65 mt-0.5">{locationSecondary}</div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {organizerPrimary && (
                  <>
                    <div className="h-px bg-white/15" />
                    <div className="flex gap-3 items-start">
                      <Building2 className="w-[18px] h-[18px] text-white/60 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[15px] font-semibold text-white leading-[1.35]">{organizerPrimary}</div>
                        {organizerSecondary && (
                          <div className="text-[13px] text-white/65 mt-0.5">{organizerSecondary}</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="flex-1 h-12 sm:h-10 bg-none bg-white text-azulejo-700 hover:bg-white/90 shadow-[0_2px_6px_oklch(0.27_0.05_245/0.35)]">
                      <CalendarPlus className="w-4 h-4" />
                      {tDetails('addToCalendar')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {calendarMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-12 sm:h-10 px-4 text-white border border-white/30 hover:bg-white/10 hover:text-white">
                      <Share2 className="w-4 h-4" />
                      {tDetails('share')}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    {shareMenuItems}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150">
        {/* Once the event is over the page serves the QSL first */}
        {hasEnded ? (
          <>
            {afterContactSection}
            {planSection}
          </>
        ) : (
          planSection
        )}

        {/* Quick Info Cards - Magazine style info blocks */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Start time */}
          <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 hover:-translate-y-0.5`}>
            <div className="hidden sm:inline-flex p-2.5 rounded-xl bg-azulejo-100 dark:bg-azulejo-800/50 mb-3">
              <CalendarIcon className={`w-5 h-5 ${tagColors.text}`} />
            </div>
            <div className="text-xs tracking-wider text-muted-foreground font-medium mb-1">
              {tDetails('startTime')}
            </div>
            <div className="font-semibold text-sm sm:text-base leading-snug font-mono">
              {showsDualTime
                ? `${formatShortDate(currentEvent.start, zone, showYear)} · ${clockIn(currentEvent.start)}`
                : formatDateTime(currentEvent.start)}
            </div>
            {showsDualTime && (
              <div className="font-mono text-xs text-muted-foreground mt-0.5">
                {tDetails('utcSuffix', { time: clockUtc(currentEvent.start) })}
              </div>
            )}
          </div>

          {/* End time */}
          {currentEvent.end && (
            <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 hover:-translate-y-0.5`}>
              <div className="hidden sm:inline-flex p-2.5 rounded-xl bg-azulejo-100 dark:bg-azulejo-800/50 mb-3">
                <Clock className={`w-5 h-5 ${tagColors.text}`} />
              </div>
              <div className="text-xs tracking-wider text-muted-foreground font-medium mb-1">
                {tDetails('endTime')}
              </div>
              <div className="font-semibold text-sm sm:text-base leading-snug font-mono">
                {showsDualTime
                  ? `${formatShortDate(currentEvent.end, zone, showYear)} · ${clockIn(currentEvent.end)}`
                  : formatDateTime(currentEvent.end)}
              </div>
              {showsDualTime && (
                <div className="font-mono text-xs text-muted-foreground mt-0.5">
                  {tDetails('utcSuffix', { time: clockUtc(currentEvent.end) })}
                </div>
              )}
            </div>
          )}

          {/* Duration */}
          {duration && (
            <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 hover:-translate-y-0.5`}>
              <div className="hidden sm:inline-flex p-2.5 rounded-xl bg-azulejo-100 dark:bg-azulejo-800/50 mb-3">
                <Timer className={`w-5 h-5 ${tagColors.text}`} />
              </div>
              <div className="text-xs tracking-wider text-muted-foreground font-medium mb-1">
                {tDetails('duration')}
              </div>
              <div className="font-semibold text-sm sm:text-base">
                {duration}
              </div>
              {durationDetail && (
                <div className="text-xs text-muted-foreground mt-0.5">{durationDetail}</div>
              )}
            </div>
          )}

          {/* Timezone */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 cursor-help hover:-translate-y-0.5`}>
                  <div className="hidden sm:inline-flex p-2.5 rounded-xl bg-azulejo-100 dark:bg-azulejo-800/50 mb-3">
                    <Globe className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div className="text-xs tracking-wider text-muted-foreground font-medium mb-1">
                    {tDetails('timezone')}
                  </div>
                  <div className="font-semibold text-sm sm:text-base truncate font-mono">
                    {zone}
                  </div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {showsDualTime
                      ? `${zoneAbbreviation(currentEvent.start, zone)} · ${offsetLabel(currentEvent.start, zone)}`
                      : 'UTC'}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {showsDualTime
                    ? tDetails('timezoneNoteLocal', { zone: zoneName })
                    : tDetails('timezoneNoteUtc')}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Location + organizer */}
        {(currentEvent.location || organizerPrimary) && (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
            {currentEvent.location && (
              <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-azulejo-50 dark:bg-azulejo-900/30 border border-azulejo-200 dark:border-azulejo-800">
                <div className="shrink-0 p-3 rounded-xl bg-azulejo-100 dark:bg-azulejo-800/50">
                  <MapPin className="w-6 h-6 text-azulejo-600 dark:text-azulejo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs tracking-wider text-muted-foreground font-medium mb-0.5">
                    {tDetails('location')}
                  </div>
                  <div className="font-semibold text-base sm:text-[17px] truncate">
                    {locationPrimary}
                  </div>
                  {locationSecondary && (
                    <div className="text-[13px] text-muted-foreground truncate mt-0.5">{locationSecondary}</div>
                  )}
                </div>
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={tDetails('viewOnMap')}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-11 min-w-11 sm:min-w-0 text-[13px] font-semibold text-azulejo-600 dark:text-azulejo-400 hover:underline"
                  >
                    <span className="hidden sm:inline">{tDetails('viewOnMap')}</span>
                    <ChevronRight className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                  </a>
                )}
              </div>
            )}

            {organizerPrimary && (
              <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-azulejo-100 dark:bg-azulejo-900/40 border border-border">
                <div className="shrink-0 flex items-center justify-center size-12 rounded-xl bg-background overflow-hidden">
                  {organizerLogoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={organizerLogoUrl}
                      alt={organizer?.logo?.alt || organizerPrimary}
                      className="size-6 object-contain"
                    />
                  ) : (
                    <Building2 className="w-6 h-6 text-azulejo-600 dark:text-azulejo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs tracking-wider text-muted-foreground font-medium mb-0.5">
                    {tDetails('organizer')}
                  </div>
                  <div className="font-semibold text-base sm:text-[17px] truncate">{organizerPrimary}</div>
                  {organizerSecondary && (
                    <div className="text-[13px] text-muted-foreground truncate mt-0.5">{organizerSecondary}</div>
                  )}
                </div>
                {organizer?.slug ? (
                  <Link
                    href={`/association/${organizer.slug}/`}
                    aria-label={tDetails('visitOrganizer')}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-11 min-w-11 sm:min-w-0 text-[13px] font-semibold text-azulejo-600 dark:text-azulejo-400 hover:underline"
                  >
                    <span className="hidden sm:inline">{tDetails('visitOrganizer')}</span>
                    <ChevronRight className="w-5 h-5 sm:w-3.5 sm:h-3.5" />
                  </Link>
                ) : organizer?.website ? (
                  <a
                    href={organizer.website}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={tDetails('visitOrganizer')}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 min-h-11 min-w-11 sm:min-w-0 text-[13px] font-semibold text-azulejo-600 dark:text-azulejo-400 hover:underline"
                  >
                    <span className="hidden sm:inline">{tDetails('visitOrganizer')}</span>
                    <ExternalLink className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </a>
                ) : null}
              </div>
            )}
          </div>
        )}

        {/* After the contact — QSL (before the plan once the event has ended) */}
        {!hasEnded && afterContactSection}

        {/* Description */}
        {Boolean(currentEvent.description) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="flex items-center gap-2.5 text-lg sm:text-xl font-bold tracking-[-0.01em]">
              <Info className={`w-5 h-5 ${tagColors.text}`} />
              {tDetails('about')}
            </h2>
            <div className="prose prose-azulejo dark:prose-invert max-w-none p-5 sm:p-7 sm:px-8 rounded-2xl bg-muted border border-border prose-p:first-of-type:text-[17px] prose-p:first-of-type:font-medium">
              <RichTextContent content={currentEvent.description} />
            </div>
          </div>
        )}

        {/* Action buttons - Refined magazine style */}
        <div className="flex flex-wrap gap-3 p-4 sm:p-5 rounded-2xl bg-muted border border-border animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Visit Website */}
          {currentEvent.url && (
            <Button asChild className="h-11 sm:h-9 basis-full sm:basis-auto">
              <a href={currentEvent.url} target="_blank" rel="noreferrer">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('visitWebsite')}</span>
                <span className="sm:hidden">Website</span>
              </a>
            </Button>
          )}

          {/* Add to Calendar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 sm:h-9 flex-1 sm:flex-none border-2">
                <CalendarPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('addToCalendar')}</span>
                <span className="sm:hidden">Calendário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {calendarMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-11 w-11 sm:h-9 sm:w-auto border-2" aria-label={tDetails('share')}>
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('share')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {shareMenuItems}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* QR Code dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-11 sm:h-9 flex-1 sm:flex-none border-2">
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('qrCode')}</span>
                <span className="sm:hidden">{tDetails('qrCode')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <QrCode className={`w-5 h-5 ${tagColors.text}`} />
                  {tDetails('qrCodeTitle')}
                </DialogTitle>
                <DialogDescription>{tDetails('qrCodeDescription')}</DialogDescription>
              </DialogHeader>
              <div className="flex justify-center p-8 bg-white rounded-xl shadow-inner">
                <QRCodeSVG value={shareUrl} size={200} level="H" />
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Related events */}
        {relatedByTag.length > 0 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-base font-bold tracking-tight flex items-center gap-2">
              <TagIcon tag={currentEvent.tag} className={`w-5 h-5 ${tagColors.text}`} />
              {tDetails('sameTag', { tag: currentEvent.tag || '' })}
            </h3>
            <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2 snap-x snap-mandatory">
              {relatedByTag.map((related, index) => (
                <div
                  key={related.id}
                  className="snap-start animate-in fade-in slide-in-from-right-4 duration-200"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <RelatedEventCard
                    event={related}
                    tagColors={getTagColors(related.tag)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation - Editorial pagination style */}
      {(prevEvent || nextEvent) && (
        <div className="px-4 sm:px-6 md:px-8 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-4">
            {prevEvent ? (
              <Link href={`/events/${encodeURIComponent(prevEvent.id)}/`} className="group block">
                <div className="relative min-h-11 p-4 sm:p-5 rounded-2xl border border-border bg-card transition-all duration-200 overflow-hidden hover:-translate-x-1">
                  <div className="flex items-center gap-2 text-xs tracking-wider text-muted-foreground font-medium mb-2">
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    {tDetails('previousEvent')}
                  </div>
                  <div className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300 transition-colors">
                    {prevEvent.title}
                  </div>
                </div>
              </Link>
            ) : <div />}
            {nextEvent ? (
              <Link href={`/events/${encodeURIComponent(nextEvent.id)}/`} className="group block">
                <div className="relative min-h-11 p-4 sm:p-5 rounded-2xl border border-border bg-card text-right transition-all duration-200 overflow-hidden hover:translate-x-1">
                  <div className="flex items-center justify-end gap-2 text-xs tracking-wider text-muted-foreground font-medium mb-2">
                    {tDetails('nextEvent')}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300 transition-colors">
                    {nextEvent.title}
                  </div>
                </div>
              </Link>
            ) : <div />}
          </div>
        </div>
      )}
    </div>
  );
}
