"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { EventItem } from "@/components/HamRadioEventsCountdown";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  ExternalLink,
  Globe2,
  Info,
  MapPin,
  Mic2,
  Radio,
  SatelliteDish,
  Share2,
  Star,
} from "lucide-react";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

// ---- Utilities (shared with HamRadioEventsCountdown) ----
const tagIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Net: Radio,
  Contest: Activity,
  Meetup: Mic2,
  Satellite: SatelliteDish,
  DX: Globe2,
  Default: Info,
};

const tagColorMap: Record<string, { text: string; bg: string; border: string; gradient: string }> = {
  Net: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
  },
  Contest: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800',
    gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
  },
  Meetup: {
    text: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-950/30',
    border: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
  },
  Satellite: {
    text: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-950/30',
    border: 'border-cyan-200 dark:border-cyan-800',
    gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
  },
  DX: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
  },
  Default: {
    text: 'text-slate-600 dark:text-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-200 dark:border-slate-700',
    gradient: 'from-slate-500/20 via-slate-500/5 to-transparent',
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

// Countdown display component
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
      <div className="text-sm text-muted-foreground mb-2">{label}</div>
      <div className="flex items-center justify-center gap-2">
        {days > 0 && (
          <>
            <div className="flex flex-col items-center">
              <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${colorClass}`}>{days}</span>
              <span className="text-xs text-muted-foreground">dias</span>
            </div>
            <span className={`text-2xl sm:text-3xl font-light ${colorClass}`}>:</span>
          </>
        )}
        <div className="flex flex-col items-center">
          <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${colorClass}`}>
            {String(hours).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground">horas</span>
        </div>
        <span className={`text-2xl sm:text-3xl font-light ${colorClass}`}>:</span>
        <div className="flex flex-col items-center">
          <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${colorClass}`}>
            {String(minutes).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground">min</span>
        </div>
        <span className={`text-2xl sm:text-3xl font-light ${colorClass}`}>:</span>
        <div className="flex flex-col items-center">
          <span className={`text-3xl sm:text-4xl font-bold tabular-nums ${colorClass}`}>
            {String(seconds).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground">seg</span>
        </div>
      </div>
    </div>
  );
}

interface EventDetailsClientProps {
  event: EventItem;
}

export default function EventDetailsClient({ event }: EventDetailsClientProps) {
  const t = useTranslations('events');
  const tDetails = useTranslations('events.detailsPage');
  const [mounted, setMounted] = useState(false);

  useTick(1000);

  useEffect(() => {
    setMounted(true);
  }, []);

  const now = Date.now();
  const startTime = new Date(event.start).getTime();
  const endTime = event.end ? new Date(event.end).getTime() : startTime + 3600000;
  const hasStarted = now >= startTime;
  const hasEnded = now >= endTime;
  const isInProgress = hasStarted && !hasEnded;

  const remainingToStart = msUntil(event.start);
  const remainingToEnd = event.end ? msUntil(event.end) : 0;

  const tagColors = getTagColors(event.tag);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `${event.title} - ${formatDateTime(event.start)}`,
          url: window.location.href,
        });
      } catch {
        // User cancelled or share failed
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href);
    }
  };

  // Loading skeleton
  if (!mounted) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="h-8 w-32 bg-muted rounded animate-pulse mb-6" />
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link href="/events/">
          <Button variant="ghost" className="gap-2 pl-2">
            <ArrowLeft className="w-4 h-4" />
            {tDetails('backToEvents')}
          </Button>
        </Link>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`rounded-2xl overflow-hidden border-2 ${tagColors.border}`}>
          {/* Header with gradient */}
          <div className={`bg-gradient-to-br ${tagColors.gradient} p-6 sm:p-8`}>
            <CardHeader className="p-0">
              {/* Tag and featured badge */}
              <div className="flex items-center gap-2 mb-4">
                <Badge
                  className={`${tagColors.bg} ${tagColors.text} ${tagColors.border} border px-3 py-1`}
                >
                  <TagIcon tag={event.tag} className="w-4 h-4 mr-1.5" />
                  {event.tag ?? t('event')}
                </Badge>
                {event.isFeatured && (
                  <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700">
                    <Star className="w-3.5 h-3.5 mr-1 fill-current" />
                    {tDetails('featured')}
                  </Badge>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground leading-tight">
                {event.title}
              </h1>
            </CardHeader>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Status and countdown */}
            <div className={`rounded-xl p-6 ${
              isInProgress
                ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                : hasEnded
                  ? 'bg-muted border border-border'
                  : `${tagColors.bg} border ${tagColors.border}`
            }`}>
              {isInProgress ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                    <Activity className="w-5 h-5 animate-pulse" />
                    <span className="text-lg font-semibold">{t('happeningNow')}</span>
                  </div>
                  {event.end && remainingToEnd > 0 && (
                    <CountdownDisplay
                      ms={remainingToEnd}
                      label={t('endsIn')}
                      colorClass="text-green-600 dark:text-green-400"
                    />
                  )}
                </div>
              ) : hasEnded ? (
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
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
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Start time */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                  <CalendarIcon className={`w-5 h-5 ${tagColors.text}`} />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{tDetails('startTime')}</div>
                  <div className="font-medium">{formatDateTime(event.start)}</div>
                </div>
              </div>

              {/* End time */}
              {event.end && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                  <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                    <Clock className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{tDetails('endTime')}</div>
                    <div className="font-medium">{formatDateTime(event.end)}</div>
                  </div>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50">
                  <div className={`p-2 rounded-lg ${tagColors.bg}`}>
                    <MapPin className={`w-5 h-5 ${tagColors.text}`} />
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">{tDetails('location')}</div>
                    <div className="font-medium">{event.location}</div>
                  </div>
                </div>
              )}

              {/* BrandMeister */}
              {event.brandmeister && event.talkgroup && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
                  <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/50">
                    <Radio className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground">BrandMeister DMR</div>
                    <div className="font-medium text-red-600 dark:text-red-400">
                      Talkgroup {event.talkgroup}
                    </div>
                    <a
                      href={`https://hose.brandmeister.network/?tg=${event.talkgroup}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:underline mt-1"
                    >
                      {t('brandmeister.listen')}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-border">
              {event.url && (
                <a href={event.url} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none">
                  <Button className="w-full gap-2">
                    <ExternalLink className="w-4 h-4" />
                    {tDetails('visitWebsite')}
                  </Button>
                </a>
              )}
              <Button variant="outline" onClick={handleShare} className="gap-2">
                <Share2 className="w-4 h-4" />
                {tDetails('share')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
