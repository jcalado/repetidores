"use client";

/**
 * CurrentEvents component - displays events that are currently in progress
 * Shows the first event as a hero card, with additional events listed below
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin,
  Radio,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        <Card
          className="relative overflow-hidden rounded-xl shadow-md border-green-500/50 bg-gradient-to-br from-green-500/15 to-transparent hover:shadow-lg transition-all"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon */}
              <div
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${heroIconBgClass} text-white shadow shrink-0 relative`}
              >
                <HeroTagIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                {/* Live indicator */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse border-2 border-white dark:border-gray-900" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
                  <Activity className="w-3.5 h-3.5 animate-pulse" />
                  {t("happeningNow")}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate flex items-center gap-1.5 group-hover:text-primary transition-colors">
                  {heroEvent.isFeatured && (
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  {heroEvent.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {t("started")} {formatDateTime(heroEvent.start, { hideCurrentYear: true })}
                  </span>
                  {heroEvent.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {heroEvent.location}
                    </span>
                  )}
                  {heroEvent.dmr && heroEvent.talkgroup && (
                    heroEvent.dmrNetwork === "brandmeister" ? (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            `https://hose.brandmeister.network/?tg=${heroEvent.talkgroup}`,
                            "_blank"
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                        title={t("dmr.listen")}
                      >
                        <Radio className="w-3 h-3" />{" "}
                        {getDMRNetworkLabel(heroEvent.dmrNetwork, t)} TG{" "}
                        {heroEvent.talkgroup}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <Radio className="w-3 h-3" />{" "}
                        {getDMRNetworkLabel(heroEvent.dmrNetwork, t)} TG{" "}
                        {heroEvent.talkgroup}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Time remaining + link */}
              <div className="shrink-0 text-right hidden sm:block">
                {heroEvent.end && heroTimeUntilEnd > 0 && (
                  <div className="text-lg font-bold tabular-nums text-green-600 dark:text-green-400">
                    {formatSmartCountdown(heroTimeUntilEnd, t)}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {t("endsIn").replace(/\s*$/, "")}
                </div>
                {heroEvent.url && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(heroEvent.url, "_blank");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer mt-1"
                  >
                    {t("eventDetails")}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Mobile countdown */}
              <div className="shrink-0 sm:hidden text-right">
                {heroEvent.end && heroTimeUntilEnd > 0 && (
                  <>
                    <div className="text-base font-bold tabular-nums text-green-600 dark:text-green-400">
                      {formatSmartCountdown(heroTimeUntilEnd, t)}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {t("endsIn").replace(/\s*$/, "")}
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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
                <Card className="rounded-lg border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent hover:border-green-500/50 transition-all">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <TagIcon className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm truncate block group-hover:text-primary transition-colors">
                          {event.isFeatured && (
                            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 inline mr-1" />
                          )}
                          {event.title}
                        </span>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {event.location && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {event.end && timeUntilEnd > 0 && (
                        <span className="text-sm font-medium text-green-600 dark:text-green-400 shrink-0">
                          {formatSmartCountdown(timeUntilEnd, t)}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default CurrentEvents;
