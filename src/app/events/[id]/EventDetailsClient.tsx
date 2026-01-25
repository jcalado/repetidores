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
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Calendar as CalendarIcon,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  ExternalLink,
  Globe,
  Globe2,
  Hourglass,
  Info,
  Link2,
  MapPin,
  MessageCircle,
  Mic2,
  QrCode,
  Radio,
  SatelliteDish,
  Share2,
  Sparkles,
  Timer,
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

const tagIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Net: Radio,
  Contest: Activity,
  Meetup: Mic2,
  Satellite: SatelliteDish,
  DX: Globe2,
  Default: Info,
};

// Enhanced color system with richer gradients and more visual depth
const tagColorMap: Record<string, {
  text: string;
  textLight: string;
  bg: string;
  bgHover: string;
  border: string;
  gradient: string;
  heroGradient: string;
  solid: string;
  accent: string;
  ring: string;
}> = {
  Net: {
    text: 'text-blue-600 dark:text-blue-400',
    textLight: 'text-blue-100',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    bgHover: 'hover:bg-blue-100 dark:hover:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    heroGradient: 'from-blue-600 via-blue-700 to-indigo-800 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-950',
    solid: 'bg-blue-500',
    accent: 'bg-blue-400',
    ring: 'ring-blue-400/30',
  },
  Contest: {
    text: 'text-amber-600 dark:text-amber-400',
    textLight: 'text-amber-100',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    bgHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    heroGradient: 'from-amber-500 via-orange-600 to-red-700 dark:from-amber-700 dark:via-orange-800 dark:to-red-900',
    solid: 'bg-amber-500',
    accent: 'bg-amber-400',
    ring: 'ring-amber-400/30',
  },
  Meetup: {
    text: 'text-purple-600 dark:text-purple-400',
    textLight: 'text-purple-100',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    bgHover: 'hover:bg-purple-100 dark:hover:bg-purple-900/40',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    heroGradient: 'from-purple-600 via-violet-700 to-fuchsia-800 dark:from-purple-800 dark:via-violet-900 dark:to-fuchsia-950',
    solid: 'bg-purple-500',
    accent: 'bg-purple-400',
    ring: 'ring-purple-400/30',
  },
  Satellite: {
    text: 'text-cyan-600 dark:text-cyan-400',
    textLight: 'text-cyan-100',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    bgHover: 'hover:bg-cyan-100 dark:hover:bg-cyan-900/40',
    border: 'border-cyan-200 dark:border-cyan-800',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    heroGradient: 'from-cyan-600 via-teal-700 to-emerald-800 dark:from-cyan-800 dark:via-teal-900 dark:to-emerald-950',
    solid: 'bg-cyan-500',
    accent: 'bg-cyan-400',
    ring: 'ring-cyan-400/30',
  },
  DX: {
    text: 'text-emerald-600 dark:text-emerald-400',
    textLight: 'text-emerald-100',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    bgHover: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    heroGradient: 'from-emerald-600 via-green-700 to-teal-800 dark:from-emerald-800 dark:via-green-900 dark:to-teal-950',
    solid: 'bg-emerald-500',
    accent: 'bg-emerald-400',
    ring: 'ring-emerald-400/30',
  },
  Default: {
    text: 'text-ship-cove-600 dark:text-ship-cove-400',
    textLight: 'text-ship-cove-100',
    bg: 'bg-ship-cove-50 dark:bg-ship-cove-900/30',
    bgHover: 'hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/40',
    border: 'border-ship-cove-200 dark:border-ship-cove-700',
    gradient: 'from-ship-cove-500/20 via-ship-cove-500/5 to-transparent',
    heroGradient: 'from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950',
    solid: 'bg-ship-cove-500',
    accent: 'bg-ship-cove-400',
    ring: 'ring-ship-cove-400/30',
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

function getTimezoneInfo() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const offset = new Date().toLocaleString('pt-PT', { timeZoneName: 'shortOffset' }).split(' ').pop() || '';
  return { timezone: tz, offset };
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
    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-green-500/25 animate-in fade-in zoom-in-95 duration-300">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
      </span>
      <span className="text-sm font-bold uppercase tracking-wider text-white">
        {label}
      </span>
    </div>
  );
}

// Progress bar for multi-day events - refined with glow effect
function EventProgressBar({ start, end }: { start: string; end: string }) {
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const progress = Math.min(100, Math.max(0, ((now - startMs) / (endMs - startMs)) * 100));

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex justify-between items-center text-sm mb-2">
        <span className="text-white/70">Progresso</span>
        <span className="font-mono font-bold text-white">{Math.round(progress)}%</span>
      </div>
      <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute inset-y-0 left-0 bg-white/30 rounded-full blur-sm transition-all duration-700 ease-out delay-100"
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
          ? 'bg-white/10 backdrop-blur-sm'
          : 'bg-ship-cove-100 dark:bg-ship-cove-900/50'
      }`}>
        <span
          key={value}
          className={`block text-3xl sm:text-4xl md:text-5xl font-bold tabular-nums tracking-tight transition-all duration-150 ${
            isLight ? 'text-white' : 'text-ship-cove-900 dark:text-ship-cove-100'
          }`}
        >
          {value}
        </span>
      </div>
      <span className={`text-[10px] sm:text-xs uppercase tracking-wider mt-2 font-medium ${
        isLight ? 'text-white/70' : 'text-ship-cove-500 dark:text-ship-cove-400'
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
      <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-white/40' : 'bg-ship-cove-300 dark:bg-ship-cove-600'}`} />
      <div className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-white/40' : 'bg-ship-cove-300 dark:bg-ship-cove-600'}`} />
    </div>
  );
}

// Countdown display component - editorial magazine style
function CountdownDisplay({
  ms,
  label,
  isLight = false,
}: {
  ms: number;
  label: string;
  isLight?: boolean;
}) {
  const { days, hours, minutes, seconds } = breakdown(ms);

  return (
    <div className="text-center">
      <div className={`text-sm font-medium uppercase tracking-wider mb-4 ${
        isLight ? 'text-white/70' : 'text-ship-cove-500 dark:text-ship-cove-400'
      }`}>
        {label}
      </div>
      <div className="flex items-start justify-center gap-1 sm:gap-2">
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
            <div className={`text-xs mt-1 ${tagColors.text} font-medium`}>
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
  const tzInfo = getTimezoneInfo();
  const imageUrl = getImageUrl(event?.featuredImage?.url);

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

  return (
    <div className="max-w-5xl mx-auto">
      {/* Full-width Hero Section */}
      <div className="relative animate-in fade-in duration-300">
        {/* Hero Background with Dynamic Gradient */}
        <div className={`relative overflow-hidden rounded-b-3xl bg-gradient-to-br ${tagColors.heroGradient} shadow-2xl`}>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="event-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#event-grid)" className="text-white" />
            </svg>
          </div>

          {/* Decorative elements */}
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-8 -bottom-8 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute right-1/4 top-1/3 w-32 h-32 rounded-full bg-white/5 blur-xl" />

          {/* Featured ribbon */}
          {event.isFeatured && (
            <div className="absolute top-0 right-0 w-40 h-40 overflow-hidden pointer-events-none z-20">
              <div className="absolute top-5 right-[-45px] w-[200px] text-center text-xs font-bold uppercase tracking-wider text-amber-900 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 transform rotate-45 py-2 shadow-lg">
                <Sparkles className="inline w-3 h-3 mr-1" />
                {tDetails('featured')}
              </div>
            </div>
          )}

          {/* Navigation bar */}
          <div className="relative z-10 px-4 sm:px-6 md:px-8 pt-4 sm:pt-6">
            <div className="flex items-center justify-between">
              <Link href="/events/">
                <Button variant="ghost" size="sm" className="gap-2 pl-2 text-white/80 hover:text-white hover:bg-white/10">
                  <ArrowLeft className="w-4 h-4" />
                  {tDetails('backToEvents')}
                </Button>
              </Link>

              <div className="flex items-center gap-2">
                {prevEvent && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/events/${encodeURIComponent(prevEvent.id)}/`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
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
                        <Link href={`/events/${encodeURIComponent(nextEvent.id)}/`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/70 hover:text-white hover:bg-white/10">
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

          {/* Hero Content */}
          <div className="relative z-10 px-4 sm:px-6 md:px-8 pb-8 sm:pb-12 pt-6 sm:pt-8">
            {/* Featured Image (if exists) */}
            {imageUrl && (
              <div className="relative w-full h-48 sm:h-64 md:h-72 rounded-2xl overflow-hidden mb-6 sm:mb-8 ring-1 ring-white/20 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
                <Image
                  src={imageUrl}
                  alt={event.featuredImage?.alt || event.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 900px"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>
            )}

            {/* Event Meta Row */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Tag badge */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white/20 text-white backdrop-blur-sm border border-white/20">
                <TagIcon tag={event.tag} className="w-3.5 h-3.5" />
                {event.tag ?? t('event')}
              </span>

              {/* Category badge */}
              {event.category && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold backdrop-blur-sm border ${
                  event.category === 'international'
                    ? 'bg-sky-500/30 text-white border-sky-400/30'
                    : 'bg-emerald-500/30 text-white border-emerald-400/30'
                }`}>
                  {event.category === 'international' ? <Globe2 className="w-3.5 h-3.5" /> : <MapPin className="w-3.5 h-3.5" />}
                  {event.category === 'international' ? 'Internacional' : 'Nacional'}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-6 sm:mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {event.title}
            </h1>

            {/* Countdown Section - Integrated into Hero */}
            <div className="relative animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
              {isInProgress ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <LiveIndicator label={t('happeningNow')} />
                  </div>
                  {event.end && remainingToEnd > 0 && (
                    <>
                      <EventProgressBar start={event.start} end={event.end} />
                      <CountdownDisplay ms={remainingToEnd} label={t('endsIn')} isLight />
                    </>
                  )}
                </div>
              ) : hasEnded ? (
                <div className="flex items-center justify-center gap-3 py-6 px-6 rounded-2xl bg-white/10 backdrop-blur-sm">
                  <Clock className="w-6 h-6 text-white/70" />
                  <span className="text-xl font-semibold text-white/90">{t('ended')}</span>
                </div>
              ) : (
                <CountdownDisplay ms={remainingToStart} label={t('startsIn')} isLight />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="px-4 sm:px-6 md:px-8 py-6 sm:py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 delay-150">
        {/* Quick Info Cards - Magazine style info blocks */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {/* Start time */}
          <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 hover:-translate-y-0.5`}>
            <div className={`inline-flex p-2.5 rounded-xl ${tagColors.solid}/10 mb-3`}>
              <CalendarIcon className={`w-5 h-5 ${tagColors.text}`} />
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
              {tDetails('startTime')}
            </div>
            <div className="font-semibold text-sm sm:text-base leading-snug">
              {formatDateTime(event.start)}
            </div>
          </div>

          {/* End time */}
          {event.end && (
            <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 hover:-translate-y-0.5`}>
              <div className={`inline-flex p-2.5 rounded-xl ${tagColors.solid}/10 mb-3`}>
                <Clock className={`w-5 h-5 ${tagColors.text}`} />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {tDetails('endTime')}
              </div>
              <div className="font-semibold text-sm sm:text-base leading-snug">
                {formatDateTime(event.end)}
              </div>
            </div>
          )}

          {/* Duration */}
          {duration && (
            <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 hover:-translate-y-0.5`}>
              <div className={`inline-flex p-2.5 rounded-xl ${tagColors.solid}/10 mb-3`}>
                <Timer className={`w-5 h-5 ${tagColors.text}`} />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                {tDetails('duration')}
              </div>
              <div className="font-semibold text-sm sm:text-base">
                {duration}
              </div>
            </div>
          )}

          {/* Timezone */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`group p-4 sm:p-5 rounded-2xl border ${tagColors.border} ${tagColors.bg} transition-all duration-200 cursor-help hover:-translate-y-0.5`}>
                  <div className={`inline-flex p-2.5 rounded-xl ${tagColors.solid}/10 mb-3`}>
                    <Globe className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
                    {tDetails('timezone')}
                  </div>
                  <div className="font-semibold text-sm sm:text-base truncate">
                    {tzInfo.timezone}
                  </div>
                  <div className="text-xs text-muted-foreground">{tzInfo.offset}</div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{tDetails('timezoneNote')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Secondary Info Row */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-ship-cove-50 dark:bg-ship-cove-900/30 border border-ship-cove-200 dark:border-ship-cove-800 transition-transform hover:scale-[1.01]">
              <div className="shrink-0 p-3 rounded-xl bg-ship-cove-100 dark:bg-ship-cove-800/50">
                <MapPin className="w-6 h-6 text-ship-cove-600 dark:text-ship-cove-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                  {tDetails('location')}
                </div>
                <div className="font-semibold text-base sm:text-lg truncate">
                  {event.location}
                </div>
              </div>
            </div>
          )}

          {/* DMR Network */}
          {event.dmr && event.talkgroup && (
            <div className="flex items-center gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border border-red-200 dark:border-red-800 transition-transform hover:scale-[1.01]">
              <div className="shrink-0 p-3 rounded-xl bg-red-100 dark:bg-red-900/50">
                <Radio className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-0.5">
                  {event.dmrNetwork === 'brandmeister' ? 'Brandmeister' :
                   event.dmrNetwork === 'adn' ? 'ADN Systems' :
                   event.dmrNetwork === 'other' ? (t('dmr.other') || 'Outra') : 'DMR'}
                </div>
                <div className="font-bold text-lg sm:text-xl text-red-600 dark:text-red-400 font-mono">
                  TG {event.talkgroup}
                </div>
                {event.dmrNetwork === 'brandmeister' && (
                  <a
                    href={`https://hose.brandmeister.network/?tg=${event.talkgroup}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline mt-1 font-medium"
                  >
                    {t('dmr.listen')}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {Boolean(event.description) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h2 className="text-lg font-bold tracking-tight flex items-center gap-2">
              <Info className={`w-5 h-5 ${tagColors.text}`} />
              {tDetails('description') || 'Descrição'}
            </h2>
            <div className="prose prose-ship-cove dark:prose-invert max-w-none p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-ship-cove-50 to-slate-50 dark:from-ship-cove-950/50 dark:to-slate-900/50 border border-ship-cove-200/50 dark:border-ship-cove-800/50">
              <RichTextContent content={event.description} />
            </div>
          </div>
        )}

        {/* Action buttons - Refined magazine style */}
        <div className="flex flex-wrap gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-ship-cove-50 via-slate-50 to-ship-cove-50 dark:from-ship-cove-950/50 dark:via-slate-900/50 dark:to-ship-cove-950/50 border border-ship-cove-200/50 dark:border-ship-cove-800/50 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Visit Website */}
          {event.url && (
            <a href={event.url} target="_blank" rel="noreferrer">
              <Button className={`gap-2 ${tagColors.solid} hover:opacity-90 text-white shadow-lg`} size="default">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('visitWebsite')}</span>
                <span className="sm:hidden">Website</span>
              </Button>
            </a>
          )}

          {/* Add to Calendar dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-2 border-2 hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/50">
                <CalendarPlus className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('addToCalendar')}</span>
                <span className="sm:hidden">Calendário</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem onClick={() => downloadICS(event)} className="gap-2">
                <Download className="w-4 h-4" />
                {tDetails('downloadIcs')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')} className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {tDetails('googleCalendar')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), '_blank')} className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {tDetails('outlookCalendar')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadICS(event)} className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {tDetails('appleCalendar')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Share dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="default" className="gap-2 border-2 hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/50">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('share')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
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
            </DropdownMenuContent>
          </DropdownMenu>

          {/* QR Code dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="default" className="gap-2 border-2 hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/50">
                <QrCode className="w-4 h-4" />
                <span className="hidden sm:inline">{tDetails('qrCode')}</span>
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
              <TagIcon tag={event.tag} className={`w-5 h-5 ${tagColors.text}`} />
              {tDetails('sameTag', { tag: event.tag || '' })}
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
                <div className="relative p-4 sm:p-5 rounded-2xl border-2 border-ship-cove-200 dark:border-ship-cove-800 bg-gradient-to-br from-ship-cove-50 to-white dark:from-ship-cove-950/50 dark:to-slate-900/50 transition-all duration-200 overflow-hidden hover:-translate-x-1">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-ship-cove-400 dark:bg-ship-cove-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
                    {tDetails('previousEvent')}
                  </div>
                  <div className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-ship-cove-700 dark:group-hover:text-ship-cove-300 transition-colors">
                    {prevEvent.title}
                  </div>
                </div>
              </Link>
            ) : <div />}
            {nextEvent ? (
              <Link href={`/events/${encodeURIComponent(nextEvent.id)}/`} className="group block">
                <div className="relative p-4 sm:p-5 rounded-2xl border-2 border-ship-cove-200 dark:border-ship-cove-800 bg-gradient-to-bl from-ship-cove-50 to-white dark:from-ship-cove-950/50 dark:to-slate-900/50 text-right transition-all duration-200 overflow-hidden hover:translate-x-1">
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-ship-cove-400 dark:bg-ship-cove-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-end gap-2 text-xs uppercase tracking-wider text-muted-foreground font-medium mb-2">
                    {tDetails('nextEvent')}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                  <div className="font-semibold text-sm sm:text-base line-clamp-2 group-hover:text-ship-cove-700 dark:group-hover:text-ship-cove-300 transition-colors">
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
