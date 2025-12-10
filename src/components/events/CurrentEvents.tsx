"use client";

/**
 * CurrentEvents component - displays events that are currently in progress
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Clock,
  ExternalLink,
  MapPin,
  Radio,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTick } from "./hooks/useOptimizedTick";
import { formatDateTime, formatSmartCountdown, msUntil } from "./utils/formatters";
import { getTagIcon, getDMRNetworkLabel } from "./utils/tagColors";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Card className="rounded-2xl shadow-md border-green-500/40 bg-gradient-to-br from-green-500/10 to-transparent">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <Activity className="w-5 h-5 animate-pulse" />
            <CardTitle className="text-lg sm:text-xl">{t("happeningNow")}</CardTitle>
            <Badge variant="secondary" className="ml-auto">
              {currentEvents.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {currentEvents.map((event) => {
            const timeUntilEnd = event.end ? msUntil(event.end) : 0;
            const TagIcon = getTagIcon(event.tag);

            return (
              <Link
                key={event.id}
                href={`/events/${encodeURIComponent(event.id)}/`}
                className="block group"
              >
                <div className="p-3 sm:p-4 rounded-lg bg-background/60 border border-green-500/20 hover:border-green-500/40 hover:bg-background/80 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-green-600 dark:text-green-400 shrink-0" />
                        <span className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                          {event.title}
                        </span>
                      </div>

                      {/* Meta row */}
                      <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {t("started")} {formatDateTime(event.start, { hideCurrentYear: true })}
                        </span>
                        {event.location && (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {event.location}
                          </span>
                        )}
                      </div>

                      {/* DMR and time remaining */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {event.dmr && event.talkgroup && (
                          event.dmrNetwork === "brandmeister" ? (
                            <span
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(
                                  `https://hose.brandmeister.network/?tg=${event.talkgroup}`,
                                  "_blank"
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                              title={t("dmr.listen")}
                            >
                              <Radio className="w-3 h-3" />{" "}
                              {getDMRNetworkLabel(event.dmrNetwork, t)} TG{" "}
                              {event.talkgroup}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                              <Radio className="w-3 h-3" />{" "}
                              {getDMRNetworkLabel(event.dmrNetwork, t)} TG{" "}
                              {event.talkgroup}
                            </span>
                          )
                        )}

                        {event.end && timeUntilEnd > 0 && (
                          <span className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                            {t("endsIn")} {formatSmartCountdown(timeUntilEnd, t)}
                          </span>
                        )}
                      </div>

                      {/* Tag badge */}
                      {event.tag && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {event.tag}
                        </Badge>
                      )}
                    </div>

                    {/* External link */}
                    {event.url && (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(event.url, "_blank");
                        }}
                        className="text-primary hover:underline flex items-center gap-1 text-xs shrink-0 cursor-pointer"
                      >
                        {t("details")} <ExternalLink className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default CurrentEvents;
