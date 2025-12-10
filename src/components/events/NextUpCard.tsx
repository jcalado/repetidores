"use client";

/**
 * NextUpCard component - highlights the next upcoming event
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CalendarClock,
  Calendar as CalendarIcon,
  ExternalLink,
  MapPin,
  Radio,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTick } from "./hooks/useOptimizedTick";
import { formatDateTime, formatSmartCountdown, msUntil } from "./utils/formatters";
import {
  getTagColors,
  getTagIcon,
  getTagBorderColor,
  getTagIconBg,
  getDMRNetworkLabel,
} from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface NextUpCardProps {
  events: EventItem[];
  t: TranslationFunction;
}

export function NextUpCard({ events, t }: NextUpCardProps) {
  // Subscribe to global tick for live countdown
  useTick();

  const next = useMemo(() => {
    const now = Date.now();
    const future = events.filter((e) => {
      const start = new Date(e.start).getTime();
      const end = e.end ? new Date(e.end).getTime() : start;
      // Only show events that haven't started or ended yet
      return start > now || (end > now && start <= now);
    });
    future.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    // Find the first event that hasn't started yet
    return future.find((e) => new Date(e.start).getTime() > now);
  }, [events]);

  if (!next) return null;

  const remaining = msUntil(next.start);
  const tagColors = getTagColors(next.tag);
  const borderClass = getTagBorderColor(next.tag);
  const iconBgClass = getTagIconBg(next.tag);
  const TagIcon = getTagIcon(next.tag);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      <Link
        href={`/events/${encodeURIComponent(next.id)}/`}
        className="block group"
      >
        <Card
          className={`relative overflow-hidden rounded-xl shadow-md border ${borderClass} bg-gradient-to-br ${tagColors.gradient} to-transparent hover:shadow-lg transition-all`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* Icon */}
              <div
                className={`flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg ${iconBgClass} text-white shadow shrink-0`}
              >
                <TagIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className={`flex items-center gap-1.5 text-xs font-medium ${tagColors.text}`}
                >
                  <CalendarClock className="w-3.5 h-3.5" />
                  {t("nextUp")}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight truncate flex items-center gap-1.5 group-hover:text-primary transition-colors">
                  {next.isFeatured && (
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  {next.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5">
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {formatDateTime(next.start, { hideCurrentYear: true })}
                  </span>
                  {next.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {next.location}
                    </span>
                  )}
                  {next.dmr && next.talkgroup && (
                    next.dmrNetwork === "brandmeister" ? (
                      <span
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(
                            `https://hose.brandmeister.network/?tg=${next.talkgroup}`,
                            "_blank"
                          );
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors cursor-pointer"
                        title={t("dmr.listen")}
                      >
                        <Radio className="w-3 h-3" />{" "}
                        {getDMRNetworkLabel(next.dmrNetwork, t)} TG{" "}
                        {next.talkgroup}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800">
                        <Radio className="w-3 h-3" />{" "}
                        {getDMRNetworkLabel(next.dmrNetwork, t)} TG{" "}
                        {next.talkgroup}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Time remaining + link */}
              <div className="shrink-0 text-right hidden sm:block">
                <div
                  className={`text-lg font-bold tabular-nums ${tagColors.text}`}
                >
                  {formatSmartCountdown(remaining, t)}
                </div>
                {next.url && (
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(next.url, "_blank");
                    }}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {t("eventDetails")}
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Mobile countdown */}
              <div className="shrink-0 sm:hidden">
                <div
                  className={`text-base font-bold tabular-nums ${tagColors.text}`}
                >
                  {formatSmartCountdown(remaining, t)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

export default NextUpCard;
