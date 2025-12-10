"use client";

/**
 * Redesigned EventCard component with cleaner, less cluttered layout
 *
 * Layout hierarchy:
 * +----------------------------------+
 * | [Featured Image with overlay]    |
 * +----------------------------------+
 * | [Tag Icon] Title [Star]          |
 * +----------------------------------+
 * | [Calendar] Date & Time           |
 * | [Clock] Countdown                |
 * +----------------------------------+
 * | [Location] Place  [DMR badge]    |
 * +----------------------------------+
 */

import { memo } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  Calendar as CalendarIcon,
  ChevronRight,
  Clock,
  Globe2,
  MapPin,
  Radio,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useEventCountdown } from "./hooks/useEventCountdown";
import { formatDateTime } from "./utils/formatters";
import {
  getTagColors,
  getTagIcon,
  getCategoryColors,
  getDMRNetworkLabel,
} from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface EventCardProps {
  event: EventItem;
  t: TranslationFunction;
}

function getImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || "";
  return `${baseUrl}${url}`;
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
  const networkLabel = getDMRNetworkLabel(dmrNetwork, t);

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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-xs
        bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400
        border border-red-200 dark:border-red-800
        ${isBrandmeister ? "hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer" : ""}
        transition-colors`}
      title={isBrandmeister ? t("dmr.listen") : `${networkLabel} TG ${talkgroup}`}
    >
      <Radio className="w-3 h-3" /> TG {talkgroup}
    </span>
  );
}

function EventCardComponent({ event, t }: EventCardProps) {
  const countdown = useEventCountdown(event.start, event.end, t);
  const tagColors = getTagColors(event.tag);
  const categoryColors = getCategoryColors(event.category);
  const TagIcon = getTagIcon(event.tag);
  const imageUrl = getImageUrl(event.featuredImage?.url);

  return (
    <Link href={`/events/${encodeURIComponent(event.id)}/`} className="block group">
      <Card className="relative rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 focus-within:ring-2 focus-within:ring-ring cursor-pointer overflow-hidden h-full">
        {/* Featured Image */}
        {imageUrl && (
          <div className="relative w-full h-36 overflow-hidden">
            <Image
              src={imageUrl}
              alt={event.featuredImage?.alt || event.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Category overlay badge */}
            {categoryColors && (
              <div className="absolute top-2 right-2">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm ${categoryColors.overlay}`}
                >
                  {event.category === "international" ? (
                    <Globe2 className="w-3 h-3" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  {event.category === "international"
                    ? t("international") || "Internacional"
                    : t("national") || "Nacional"}
                </span>
              </div>
            )}
          </div>
        )}

        <CardContent className={`p-4 space-y-3 ${imageUrl ? "" : "pt-4"}`}>
          {/* Title Row */}
          <div className="flex items-start gap-3">
            <div
              className={`shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full ${tagColors.bg} ${tagColors.icon}`}
            >
              <TagIcon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors flex items-center gap-1.5">
                {event.isFeatured && (
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                )}
                {event.title}
              </h3>
              {/* Category badge when no image */}
              {!imageUrl && categoryColors && (
                <span
                  className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${categoryColors.bg} ${categoryColors.text} ${categoryColors.border}`}
                >
                  {event.category === "international" ? (
                    <Globe2 className="w-3 h-3" />
                  ) : (
                    <MapPin className="w-3 h-3" />
                  )}
                  {event.category === "international"
                    ? t("international") || "Internacional"
                    : t("national") || "Nacional"}
                </span>
              )}
            </div>
          </div>

          {/* Date & Countdown Row */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarIcon className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {formatDateTime(event.start, { hideCurrentYear: true })}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              {countdown.isInProgress ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                  <Activity className="w-4 h-4 animate-pulse" />
                  {t("endsIn")} {countdown.formatted}
                </span>
              ) : countdown.hasEnded ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {t("ended")}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 text-sm font-medium ${tagColors.text}`}
                >
                  <Clock className="w-4 h-4" />
                  {t("startsIn")} {countdown.formatted}
                </span>
              )}
            </div>
          </div>

          {/* Footer Row: Location & DMR */}
          {(event.location || (event.dmr && event.talkgroup)) && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
              {event.location ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2 shrink-0">
                <DMRBadge
                  dmr={event.dmr}
                  dmrNetwork={event.dmrNetwork}
                  talkgroup={event.talkgroup}
                  t={t}
                />
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          )}

          {/* Minimal footer when no location/DMR */}
          {!event.location && !(event.dmr && event.talkgroup) && (
            <div className="flex justify-end pt-2 border-t border-border/50">
              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          )}
        </CardContent>
      </Card>
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

// Animation variants for card list
export const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] as const },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: { duration: 0.15 },
  },
};

// Animated wrapper for card lists
export function AnimatedEventCard({
  event,
  t,
}: EventCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <EventCard event={event} t={t} />
    </motion.div>
  );
}

export default EventCard;
