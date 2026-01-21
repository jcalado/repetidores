"use client";

/**
 * CurrentEvents component - displays events that are currently in progress
 * Styled with Radio Station Dashboard aesthetic
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Radio,
  Star,
} from "lucide-react";
import { useTick } from "./hooks/useOptimizedTick";
import { formatDateTime, formatSmartCountdown, msUntil } from "./utils/formatters";
import { getTagIcon, getTagIconBg, getDMRNetworkLabel } from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface CurrentEventsProps {
  events: EventItem[];
  t: TranslationFunction;
}

export function CurrentEvents({ events, t }: CurrentEventsProps) {
  // Subscribe to global tick for live updates
  useTick();

  const currentEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => {
        const start = new Date(e.start).getTime();
        const end = e.end ? new Date(e.end).getTime() : start + 3600000;
        return now >= start && now <= end;
      })
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  }, [events]);

  if (currentEvents.length === 0) return null;

  const heroEvent = currentEvents[0];
  const additionalEvents = currentEvents.slice(1);
  const heroTimeUntilEnd = heroEvent.end ? msUntil(heroEvent.end) : 0;
  const HeroTagIcon = getTagIcon(heroEvent.tag);
  const heroIconBgClass = getTagIconBg(heroEvent.tag);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Hero Card - First ongoing event */}
      <Link
        href={`/events/${encodeURIComponent(heroEvent.id)}/`}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 dark:from-emerald-800 dark:via-emerald-900 dark:to-emerald-950 p-5 shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-live" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-live)" className="text-white" />
            </svg>
          </div>

          {/* Decorative blur */}
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-emerald-500/30 blur-xl" />

          {/* Live pulse indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              {t("live") || "AO VIVO"}
            </span>
          </div>

          <div className="relative flex items-center gap-4">
            {/* Icon */}
            <div
              className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${heroIconBgClass} text-white shadow-lg shrink-0`}
            >
              <HeroTagIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-200 uppercase tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                {t("happeningNow")}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight truncate flex items-center gap-2 group-hover:text-emerald-100 transition-colors">
                {heroEvent.isFeatured && (
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                )}
                {heroEvent.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-emerald-200 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  {t("started")} {formatDateTime(heroEvent.start, { hideCurrentYear: true })}
                </span>
                {heroEvent.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {heroEvent.location}
                  </span>
                )}
                {heroEvent.dmr && heroEvent.talkgroup && (
                  <span
                    onClick={(e) => {
                      if (heroEvent.dmrNetwork === "brandmeister") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          `https://hose.brandmeister.network/?tg=${heroEvent.talkgroup}`,
                          "_blank"
                        );
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-200 border border-red-400/30 ${
                      heroEvent.dmrNetwork === "brandmeister" ? "hover:bg-red-500/30 cursor-pointer" : ""
                    } transition-colors`}
                    title={heroEvent.dmrNetwork === "brandmeister" ? t("dmr.listen") : undefined}
                  >
                    <Radio className="w-3 h-3" />
                    {getDMRNetworkLabel(heroEvent.dmrNetwork, t)} TG {heroEvent.talkgroup}
                  </span>
                )}
              </div>
            </div>

            {/* Countdown */}
            <div className="shrink-0 text-right hidden sm:block">
              {heroEvent.end && heroTimeUntilEnd > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                  <Clock className="w-4 h-4 text-emerald-200" />
                  <div>
                    <span className="text-xl font-bold text-white tabular-nums font-mono">
                      {formatSmartCountdown(heroTimeUntilEnd, t)}
                    </span>
                    <div className="text-xs text-emerald-200">
                      {t("endsIn").replace(/\s*$/, "")}
                    </div>
                  </div>
                </div>
              )}
              {heroEvent.url && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(heroEvent.url, "_blank");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-white transition-colors cursor-pointer mt-2"
                >
                  {t("eventDetails")}
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Mobile countdown */}
            <div className="shrink-0 sm:hidden flex items-center gap-1">
              {heroEvent.end && heroTimeUntilEnd > 0 && (
                <span className="text-base font-bold text-white tabular-nums font-mono">
                  {formatSmartCountdown(heroTimeUntilEnd, t)}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-emerald-300 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>

      {/* Additional ongoing events */}
      {additionalEvents.length > 0 && (
        <div className="mt-3 space-y-2">
          {additionalEvents.map((event) => {
            const timeUntilEnd = event.end ? msUntil(event.end) : 0;
            const TagIcon = getTagIcon(event.tag);

            return (
              <Link
                key={event.id}
                href={`/events/${encodeURIComponent(event.id)}/`}
                className="block group"
              >
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 hover:border-emerald-500/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 transition-all p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <TagIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-ship-cove-900 dark:text-ship-cove-100 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {event.isFeatured && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-1" />
                        )}
                        {event.title}
                      </span>
                      {event.location && (
                        <span className="text-xs text-ship-cove-500 dark:text-ship-cove-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {event.end && timeUntilEnd > 0 && (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                          {formatSmartCountdown(timeUntilEnd, t)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-ship-cove-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default CurrentEvents;
