"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { AnimatePresence, motion } from "framer-motion";
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

const tagColorMap: Record<string, { text: string; bg: string; border: string; gradient: string; solid: string }> = {
  Net: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    solid: 'bg-blue-500',
  },
  Contest: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
    solid: 'bg-amber-500',
  },
  Meetup: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    solid: 'bg-purple-500',
  },
  Satellite: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
    solid: 'bg-cyan-500',
  },
  DX: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
    solid: 'bg-emerald-500',
  },
  Default: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    gradient: 'from-slate-500/20 via-slate-500/5 to-transparent',
    solid: 'bg-slate-500',
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

// Live indicator with pulsing animation
function LiveIndicator({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
      </span>
      <span className="text-lg font-semibold text-green-600 dark:text-green-400">
        {label}
      </span>
    </div>
  );
}

// Progress bar for multi-day events
function EventProgressBar({ start, end, colorClass }: { start: string; end: string; colorClass: string }) {
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  const progress = Math.min(100, Math.max(0, ((now - startMs) / (endMs - startMs)) * 100));

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${colorClass}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

// Animated countdown digit
function AnimatedDigit({ value, colorClass }: { value: string; colorClass: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 10, opacity: 0 }}
        transition={{ duration: 0.15 }}
        className={`text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums ${colorClass}`}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

// Countdown display component with animated digits
function CountdownDisplay({
  ms,
  label,
  colorClass
}: {
  ms: number;
  label: string;
  colorClass: string;
}) {
  const { days, hours, minutes, seconds } = breakdown(ms);

  return (
    <div className="text-center">
      <div className="text-sm text-muted-foreground mb-3">{label}</div>
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {days > 0 && (
          <>
            <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
              <AnimatedDigit value={String(days)} colorClass={colorClass} />
              <span className="text-xs text-muted-foreground mt-1">dias</span>
            </div>
            <span className={`text-xl sm:text-2xl font-light ${colorClass}`}>:</span>
          </>
        )}
        <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
          <AnimatedDigit value={String(hours).padStart(2, '0')} colorClass={colorClass} />
          <span className="text-xs text-muted-foreground mt-1">horas</span>
        </div>
        <span className={`text-xl sm:text-2xl font-light ${colorClass}`}>:</span>
        <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
          <AnimatedDigit value={String(minutes).padStart(2, '0')} colorClass={colorClass} />
          <span className="text-xs text-muted-foreground mt-1">min</span>
        </div>
        <span className={`text-xl sm:text-2xl font-light ${colorClass}`}>:</span>
        <div className="flex flex-col items-center min-w-[3rem] sm:min-w-[4rem]">
          <AnimatedDigit value={String(seconds).padStart(2, '0')} colorClass={colorClass} />
          <span className="text-xs text-muted-foreground mt-1">seg</span>
        </div>
      </div>
    </div>
  );
}

// Related event card (compact)
function RelatedEventCard({ event, tagColors }: { event: EventItem; tagColors: ReturnType<typeof getTagColors> }) {
  return (
    <Link href={`/events/${encodeURIComponent(event.id)}/`} className="block">
      <div className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors min-w-[200px]">
        <div className="flex items-center gap-2 mb-1">
          <TagIcon tag={event.tag} className={`w-4 h-4 ${tagColors.text}`} />
          <span className="text-sm font-medium truncate">{event.title}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {new Date(event.start).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <Link href="/events/">
          <Button variant="ghost" size="sm" className="gap-2 pl-2">
            <ArrowLeft className="w-4 h-4" />
            {tDetails('backToEvents')}
          </Button>
        </Link>

        {/* Prev/Next navigation */}
        <div className="flex items-center gap-2">
          {prevEvent && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href={`/events/${encodeURIComponent(prevEvent.id)}/`}>
                    <Button variant="outline" size="icon" className="h-8 w-8">
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
                    <Button variant="outline" size="icon" className="h-8 w-8">
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
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`rounded-2xl overflow-hidden border-2 py-0 ${tagColors.border} ${event.isFeatured ? 'ring-2 ring-yellow-400/50' : ''}`}>
          {/* Featured Image */}
          {imageUrl && (
            <div className="relative w-full h-48 sm:h-64 md:h-80 overflow-hidden">
              <Image
                src={imageUrl}
                alt={event.featuredImage?.alt || event.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
                priority
              />
              {/* Category badge overlay on image */}
              {event.category && (
                <div className="absolute top-4 right-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm shadow-sm ${
                    event.category === 'international'
                      ? 'bg-sky-500/90 text-white'
                      : 'bg-green-500/90 text-white'
                  }`}>
                    {event.category === 'international' ? <Globe2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                    {event.category === 'international' ? 'Internacional' : 'Nacional'}
                  </span>
                </div>
              )}
            </div>
          )}
          {/* Hero header */}
          <div className={`relative bg-gradient-to-br ${tagColors.gradient} p-6 sm:p-8`}>
            {/* Featured ribbon */}
            {event.isFeatured && (
              <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
                <div className="absolute top-3 right-[-35px] w-[170px] text-center text-xs font-bold text-yellow-900 bg-gradient-to-r from-yellow-300 to-yellow-400 transform rotate-45 py-1.5 shadow-md">
                  {tDetails('featured')}
                </div>
              </div>
            )}

            <CardHeader className="p-0">
              {/* Hero icon */}
              <div className="flex items-start gap-4 sm:gap-6">
                <div className={`relative shrink-0`}>
                  <div className={`absolute inset-0 rounded-2xl ${tagColors.solid} blur-xl opacity-30`} />
                  <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${tagColors.bg} ${tagColors.border} border-2 flex items-center justify-center`}>
                    <TagIcon tag={event.tag} className={`w-8 h-8 sm:w-10 sm:h-10 ${tagColors.text}`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  {/* Tag and Category badges */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <Badge className={`${tagColors.bg} ${tagColors.text} ${tagColors.border} border`}>
                      {event.tag ?? t('event')}
                    </Badge>
                    {/* Category badge (shown when no image, since image shows overlay) */}
                    {!imageUrl && event.category && (
                      <Badge className={`inline-flex items-center gap-1 border ${
                        event.category === 'international'
                          ? 'bg-sky-50 dark:bg-sky-950/30 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800'
                          : 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800'
                      }`}>
                        {event.category === 'international' ? <Globe2 className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                        {event.category === 'international' ? 'Internacional' : 'Nacional'}
                      </Badge>
                    )}
                  </div>

                  {/* Title */}
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-tight">
                    {event.title}
                  </h1>
                </div>
              </div>
            </CardHeader>
          </div>

          <CardContent className="p-4 sm:p-6 md:p-8 space-y-6">
            {/* Status and countdown */}
            <div className={`rounded-xl p-4 sm:p-6 ${
              isInProgress
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                : hasEnded
                  ? 'bg-muted border border-border'
                  : `${tagColors.bg} border ${tagColors.border}`
            }`}>
              {isInProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <LiveIndicator label={t('happeningNow')} />
                  </div>
                  {event.end && remainingToEnd > 0 && (
                    <>
                      <EventProgressBar start={event.start} end={event.end} colorClass="bg-green-500" />
                      <CountdownDisplay
                        ms={remainingToEnd}
                        label={t('endsIn')}
                        colorClass="text-green-600 dark:text-green-400"
                      />
                    </>
                  )}
                </div>
              ) : hasEnded ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground py-4">
                  <Clock className="w-5 h-5" />
                  <span className="text-lg font-medium">{t('ended')}</span>
                </div>
              ) : (
                <CountdownDisplay
                  ms={remainingToStart}
                  label={t('startsIn')}
                  colorClass={tagColors.text}
                />
              )}
            </div>

            {/* Event details grid */}
            <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
              {/* Start time */}
              <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                  <CalendarIcon className={`w-5 h-5 ${tagColors.text}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs sm:text-sm text-muted-foreground">{tDetails('startTime')}</div>
                  <div className="font-medium text-sm sm:text-base">{formatDateTime(event.start)}</div>
                </div>
              </div>

              {/* End time */}
              {event.end && (
                <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                  <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                    <Clock className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm text-muted-foreground">{tDetails('endTime')}</div>
                    <div className="font-medium text-sm sm:text-base">{formatDateTime(event.end)}</div>
                  </div>
                </div>
              )}

              {/* Duration */}
              {duration && (
                <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                  <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                    <Hourglass className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{tDetails('duration')}</div>
                    <div className="font-medium text-sm sm:text-base">{duration}</div>
                  </div>
                </div>
              )}

              {/* Timezone */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50 cursor-help">
                      <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                        <Globe className={`w-5 h-5 ${tagColors.text}`} />
                      </div>
                      <div>
                        <div className="text-xs sm:text-sm text-muted-foreground">{tDetails('timezone')}</div>
                        <div className="font-medium text-sm sm:text-base">{tzInfo.timezone} ({tzInfo.offset})</div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">{tDetails('timezoneNote')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-muted/50">
                  <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                    <MapPin className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm text-muted-foreground">{tDetails('location')}</div>
                    <div className="font-medium text-sm sm:text-base">{event.location}</div>
                  </div>
                </div>
              )}

              {/* DMR Network */}
              {event.dmr && event.talkgroup && (
                <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Radio className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      {event.dmrNetwork === 'brandmeister' ? 'Brandmeister' :
                       event.dmrNetwork === 'adn' ? 'ADN Systems' :
                       event.dmrNetwork === 'other' ? (t('dmr.other') || 'Outra') : 'DMR'}
                    </div>
                    <div className="font-medium text-sm sm:text-base text-red-600 dark:text-red-400">
                      Talkgroup {event.talkgroup}
                    </div>
                    {event.dmrNetwork === 'brandmeister' && (
                      <a
                        href={`https://hose.brandmeister.network/?tg=${event.talkgroup}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs sm:text-sm text-red-600 dark:text-red-400 hover:underline mt-1"
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
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">{tDetails('description') || 'Descrição'}</h2>
                <div className="prose prose-sm dark:prose-invert max-w-none p-4 rounded-xl bg-muted/50">
                  {/* Rich text rendering - Payload returns richText as an object */}
                  <RichTextContent content={event.description} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 sm:gap-3 pt-4 border-t border-border">
              {/* Visit Website */}
              {event.url && (
                <a href={event.url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none">
                  <Button className="w-full gap-2" size="sm">
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">{tDetails('visitWebsite')}</span>
                    <span className="sm:hidden">Website</span>
                  </Button>
                </a>
              )}

              {/* Add to Calendar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <CalendarPlus className="w-4 h-4" />
                    <span className="hidden sm:inline">{tDetails('addToCalendar')}</span>
                    <span className="sm:hidden">Calendário</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => downloadICS(event)}>
                    <Download className="w-4 h-4 mr-2" />
                    {tDetails('downloadIcs')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open(getGoogleCalendarUrl(event), '_blank')}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {tDetails('googleCalendar')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(getOutlookCalendarUrl(event), '_blank')}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {tDetails('outlookCalendar')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadICS(event)}>
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    {tDetails('appleCalendar')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Share dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">{tDetails('share')}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={handleCopyLink}>
                    {linkCopied ? <Check className="w-4 h-4 mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                    {linkCopied ? tDetails('copied') : tDetails('copyLink')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => window.open(getWhatsAppShareUrl(shareText, shareUrl), '_blank')}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {tDetails('whatsapp')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(getTelegramShareUrl(shareText, shareUrl), '_blank')}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {tDetails('telegram')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(getTwitterShareUrl(shareText, shareUrl), '_blank')}>
                    <Globe2 className="w-4 h-4 mr-2" />
                    {tDetails('twitter')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(getFacebookShareUrl(shareUrl), '_blank')}>
                    <Globe2 className="w-4 h-4 mr-2" />
                    {tDetails('facebook')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* QR Code dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <QrCode className="w-4 h-4" />
                    <span className="hidden sm:inline">{tDetails('qrCode')}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>{tDetails('qrCodeTitle')}</DialogTitle>
                    <DialogDescription>{tDetails('qrCodeDescription')}</DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center p-6 bg-white rounded-lg">
                    <QRCodeSVG value={shareUrl} size={200} />
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Related events */}
            {relatedByTag.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">
                  {tDetails('sameTag', { tag: event.tag || '' })}
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2">
                  {relatedByTag.map(related => (
                    <RelatedEventCard
                      key={related.id}
                      event={related}
                      tagColors={getTagColors(related.tag)}
                    />
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Bottom navigation */}
      {(prevEvent || nextEvent) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-2 gap-4"
        >
          {prevEvent ? (
            <Link href={`/events/${encodeURIComponent(prevEvent.id)}/`} className="block">
              <div className="p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <ArrowLeft className="w-3 h-3" />
                  {tDetails('previousEvent')}
                </div>
                <div className="text-sm font-medium truncate">{prevEvent.title}</div>
              </div>
            </Link>
          ) : <div />}
          {nextEvent ? (
            <Link href={`/events/${encodeURIComponent(nextEvent.id)}/`} className="block">
              <div className="p-3 sm:p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors text-right">
                <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground mb-1">
                  {tDetails('nextEvent')}
                  <ArrowRight className="w-3 h-3" />
                </div>
                <div className="text-sm font-medium truncate">{nextEvent.title}</div>
              </div>
            </Link>
          ) : <div />}
        </motion.div>
      )}
    </div>
  );
}
