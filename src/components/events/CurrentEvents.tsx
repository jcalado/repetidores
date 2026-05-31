"use client";

/**
 * CurrentEvents component - displays events that are currently in progress
 * Styled with Radio Station Dashboard aesthetic
 */

import { useMemo } from "react";
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
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Hero Card - First ongoing event */}
      <Link
        href={`/events/${encodeURIComponent(heroEvent.id)}/`}
        className="block group"
      >
        <div className="relative overflow-hidden rounded-xl bg-azulejo-700 dark:bg-azulejo-900 p-5 shadow-lg hover:shadow-xl transition-all">
          {/* Live pulse indicator */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
            </span>
            <span className="text-xs font-bold text-white tracking-wider">
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
              <div className="flex items-center gap-1.5 text-xs font-semibold text-azulejo-200 tracking-wider mb-1">
                <Activity className="w-3.5 h-3.5 animate-pulse" />
                {t("happeningNow")}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight truncate flex items-center gap-2 group-hover:text-azulejo-100 transition-colors">
                {heroEvent.isFeatured && (
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                )}
                {heroEvent.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-azulejo-200 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  {t("started")} <span className="font-mono">{formatDateTime(heroEvent.start, { hideCurrentYear: true })}</span>
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
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-white/15 text-white border border-white/20 ${
                      heroEvent.dmrNetwork === "brandmeister" ? "hover:bg-white/25 cursor-pointer" : ""
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
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10">
                  <Clock className="w-4 h-4 text-azulejo-200" />
                  <div>
                    <span className="text-xl font-bold text-white tabular-nums font-mono">
                      {formatSmartCountdown(heroTimeUntilEnd, t)}
                    </span>
                    <div className="text-xs text-azulejo-200">
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
                  className="inline-flex items-center gap-1 text-xs text-azulejo-300 hover:text-white transition-colors cursor-pointer mt-2"
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
              <ChevronRight className="w-4 h-4 text-azulejo-300 group-hover:translate-x-0.5 transition-transform" />
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
                <div className="rounded-xl border border-azulejo-200 dark:border-azulejo-800 bg-azulejo-50 dark:bg-azulejo-950/30 hover:border-azulejo-300 dark:hover:border-azulejo-700 hover:bg-azulejo-100 dark:hover:bg-azulejo-950/50 transition-all p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-azulejo-500/20 text-azulejo-600 dark:text-azulejo-400">
                      <TagIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-sm text-azulejo-900 dark:text-azulejo-100 truncate block group-hover:text-azulejo-600 dark:group-hover:text-azulejo-400 transition-colors">
                        {event.isFeatured && (
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500 inline mr-1" />
                        )}
                        {event.title}
                      </span>
                      {event.location && (
                        <span className="text-xs text-azulejo-500 dark:text-azulejo-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {event.end && timeUntilEnd > 0 && (
                        <span className="text-sm font-bold text-green-600 dark:text-green-400 font-mono tabular-nums">
                          {formatSmartCountdown(timeUntilEnd, t)}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-azulejo-400 group-hover:text-azulejo-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CurrentEvents;
