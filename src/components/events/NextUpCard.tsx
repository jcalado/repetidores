"use client";

/**
 * NextUpCard component - highlights the next upcoming event
 * Styled with Radio Station Dashboard aesthetic
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CalendarClock,
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
import {
  getTagColors,
  getTagIcon,
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
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950 p-5 shadow-lg shadow-ship-cove-500/20 hover:shadow-xl transition-all">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-next" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-next)" className="text-white" />
            </svg>
          </div>

          {/* Decorative blur */}
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-ship-cove-500/20 blur-xl" />

          <div className="relative flex items-center gap-4">
            {/* Icon */}
            <div
              className={`flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${iconBgClass} text-white shadow-lg shrink-0`}
            >
              <TagIcon className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-ship-cove-200 uppercase tracking-wider mb-1">
                <CalendarClock className="w-3.5 h-3.5" />
                {t("nextUp")}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-tight truncate flex items-center gap-2 group-hover:text-ship-cove-100 transition-colors">
                {next.isFeatured && (
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                )}
                {next.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ship-cove-200 mt-2">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4" />
                  {formatDateTime(next.start, { hideCurrentYear: true })}
                </span>
                {next.location && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {next.location}
                  </span>
                )}
                {next.dmr && next.talkgroup && (
                  <span
                    onClick={(e) => {
                      if (next.dmrNetwork === "brandmeister") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          `https://hose.brandmeister.network/?tg=${next.talkgroup}`,
                          "_blank"
                        );
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-200 border border-red-400/30 ${
                      next.dmrNetwork === "brandmeister" ? "hover:bg-red-500/30 cursor-pointer" : ""
                    } transition-colors`}
                    title={next.dmrNetwork === "brandmeister" ? t("dmr.listen") : undefined}
                  >
                    <Radio className="w-3 h-3" />
                    {getDMRNetworkLabel(next.dmrNetwork, t)} TG {next.talkgroup}
                  </span>
                )}
              </div>
            </div>

            {/* Countdown */}
            <div className="shrink-0 text-right hidden sm:block">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm">
                <Clock className="w-4 h-4 text-ship-cove-200" />
                <span className="text-xl font-bold text-white tabular-nums font-mono">
                  {formatSmartCountdown(remaining, t)}
                </span>
              </div>
              {next.url && (
                <span
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.open(next.url, "_blank");
                  }}
                  className="inline-flex items-center gap-1 text-xs text-ship-cove-300 hover:text-white transition-colors cursor-pointer mt-2"
                >
                  {t("eventDetails")}
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Mobile countdown */}
            <div className="shrink-0 sm:hidden flex items-center gap-1">
              <span className="text-base font-bold text-white tabular-nums font-mono">
                {formatSmartCountdown(remaining, t)}
              </span>
              <ChevronRight className="w-4 h-4 text-ship-cove-300 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default NextUpCard;
