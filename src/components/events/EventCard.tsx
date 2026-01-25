"use client";

/**
 * EventCard component - Calendar-style event card
 * Features prominent date badge, clear title hierarchy, and color-coded event types
 */

import { memo } from "react";
import Link from "next/link";
import {
  Activity,
  ChevronRight,
  Clock,
  MapPin,
  Radio,
  Star,
} from "lucide-react";
import { useEventCountdown } from "./hooks/useEventCountdown";
import {
  getTagColors,
  getTagIcon,
  getTagIconBg,
  getDMRNetworkLabel,
} from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface EventCardProps {
  event: EventItem;
  t: TranslationFunction;
}

function DMRBadge({
  dmr,
  dmrNetwork,
  talkgroup,
  t,
}: {
  dmr?: boolean;
  dmrNetwork?: EventItem["dmrNetwork"];
  talkgroup?: number;
  t: (key: string) => string;
}) {
  if (!dmr || !talkgroup) return null;

  const isBrandmeister = dmrNetwork === "brandmeister";

  const handleClick = (e: React.MouseEvent) => {
    if (isBrandmeister) {
      e.preventDefault();
      e.stopPropagation();
      window.open(`https://hose.brandmeister.network/?tg=${talkgroup}`, "_blank");
    }
  };

  return (
    <span
      onClick={handleClick}
      className={`inline-flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400 font-medium
        ${isBrandmeister ? "hover:text-red-700 dark:hover:text-red-300 cursor-pointer" : ""}`}
      title={isBrandmeister ? t("dmr.listen") : `TG ${talkgroup}`}
    >
      <Radio className="w-3 h-3" />
      TG {talkgroup}
    </span>
  );
}

function EventCardComponent({ event, t }: EventCardProps) {
  const countdown = useEventCountdown(event.start, event.end, t);
  const tagColors = getTagColors(event.tag);
  const TagIcon = getTagIcon(event.tag);
  const iconBgClass = getTagIconBg(event.tag);

  // Parse date for the date badge
  const eventDate = new Date(event.start);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleDateString("pt-PT", { month: "short" }).replace(".", "");
  const time = eventDate.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });

  return (
    <Link href={`/events/${encodeURIComponent(event.id)}/`} className="block group">
      <article className="relative flex gap-4 p-4 rounded-xl bg-white dark:bg-ship-cove-950/50 border border-ship-cove-200/80 dark:border-ship-cove-800/80 hover:border-ship-cove-300 dark:hover:border-ship-cove-700 hover:shadow-lg hover:shadow-ship-cove-200/50 dark:hover:shadow-ship-cove-950/50 transition-all duration-200 h-full">

        {/* Left: Date badge */}
        <div className="flex flex-col items-center shrink-0">
          <div className={`w-14 rounded-lg overflow-hidden shadow-sm ${countdown.isInProgress ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-ship-cove-950' : ''}`}>
            {/* Month header */}
            <div className={`${iconBgClass} px-2 py-1 text-center`}>
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {month}
              </span>
            </div>
            {/* Day */}
            <div className="bg-ship-cove-50 dark:bg-ship-cove-900 px-2 py-2 text-center">
              <span className="text-2xl font-bold text-ship-cove-900 dark:text-ship-cove-100 leading-none">
                {day}
              </span>
            </div>
          </div>

          {/* Time below date */}
          <span className="mt-2 text-xs font-medium text-ship-cove-500 dark:text-ship-cove-400 tabular-nums">
            {time}
          </span>
        </div>

        {/* Right: Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Top row: Tag + Status */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tagColors.text}`}>
              <TagIcon className="w-3.5 h-3.5" />
              {event.tag}
            </span>

            {event.isFeatured && (
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            )}

            {countdown.isInProgress && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400">
                <Activity className="w-3 h-3 animate-pulse" />
                {t("live") || "LIVE"}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-ship-cove-900 dark:text-ship-cove-100 leading-snug line-clamp-2 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors mb-2">
            {event.title}
          </h3>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Bottom row: Location, DMR, Countdown */}
          <div className="flex items-center justify-between gap-3 mt-auto pt-2 border-t border-ship-cove-100 dark:border-ship-cove-800/50">
            <div className="flex items-center gap-3 min-w-0 text-ship-cove-500 dark:text-ship-cove-400">
              {event.location && (
                <span className="inline-flex items-center gap-1 text-xs truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
              <DMRBadge
                dmr={event.dmr}
                dmrNetwork={event.dmrNetwork}
                talkgroup={event.talkgroup}
                t={t}
              />
            </div>

            {/* Countdown or Arrow */}
            <div className="flex items-center gap-2 shrink-0">
              {!countdown.isInProgress && !countdown.hasEnded && (
                <span className="text-xs font-semibold text-ship-cove-600 dark:text-ship-cove-300 font-mono tabular-nums">
                  {countdown.formatted}
                </span>
              )}
              <ChevronRight className="w-4 h-4 text-ship-cove-400 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Memoized version with custom comparison
export const EventCard = memo(EventCardComponent, (prevProps, nextProps) => {
  // Re-render if event data or translation function changes
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.title === nextProps.event.title &&
    prevProps.event.start === nextProps.event.start &&
    prevProps.event.end === nextProps.event.end &&
    prevProps.event.isFeatured === nextProps.event.isFeatured &&
    prevProps.t === nextProps.t
  );
});

EventCard.displayName = "EventCard";

// CSS-based animation classes for card list (replaces framer-motion)
export const cardVariants = {
  // Kept for backwards compatibility, not used with CSS animations
  hidden: {},
  visible: {},
  exit: {},
};

// Animated wrapper for card lists using CSS animations
export function AnimatedEventCard({
  event,
  t,
}: EventCardProps) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-200">
      <EventCard event={event} t={t} />
    </div>
  );
}

export default EventCard;
