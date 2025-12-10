"use client";

/**
 * Compact EventCard variant for calendar day views and lists
 * Shows minimal information in a condensed layout
 */

import { memo } from "react";
import Link from "next/link";
import { Clock, MapPin, Radio, Star } from "lucide-react";
import { useEventCountdown } from "./hooks/useEventCountdown";
import { formatTime } from "./utils/formatters";
import { getTagColors, getTagIcon, getDMRNetworkLabel } from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface EventCardCompactProps {
  event: EventItem;
  t: TranslationFunction;
  showCountdown?: boolean;
}

function EventCardCompactComponent({
  event,
  t,
  showCountdown = true,
}: EventCardCompactProps) {
  const countdown = useEventCountdown(event.start, event.end, t);
  const tagColors = getTagColors(event.tag);
  const TagIcon = getTagIcon(event.tag);

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}/`}
      className="block group"
    >
      <div
        className={`p-3 rounded-lg border transition-all duration-200
          hover:border-primary/30 hover:bg-muted/30 cursor-pointer
          ${tagColors.border} ${tagColors.bg}`}
      >
        <div className="flex items-start gap-2">
          {/* Tag Icon */}
          <div
            className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${tagColors.bg} ${tagColors.icon}`}
          >
            <TagIcon className="w-3.5 h-3.5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title */}
            <h4 className="text-sm font-medium leading-tight truncate group-hover:text-primary transition-colors flex items-center gap-1">
              {event.isFeatured && (
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 shrink-0" />
              )}
              {event.title}
            </h4>

            {/* Time & Status */}
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(event.start)}
              </span>
              {event.location && (
                <span className="inline-flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>

            {/* Countdown (optional) */}
            {showCountdown && (
              <div className="mt-1.5">
                {countdown.isInProgress ? (
                  <span className="text-xs font-medium text-green-600 dark:text-green-400">
                    {t("happeningNow")}
                  </span>
                ) : countdown.hasEnded ? (
                  <span className="text-xs text-muted-foreground">
                    {t("ended")}
                  </span>
                ) : (
                  <span className={`text-xs font-medium ${tagColors.text}`}>
                    {t("startsIn")} {countdown.formatted}
                  </span>
                )}
              </div>
            )}

            {/* DMR Badge */}
            {event.dmr && event.talkgroup && (
              <div className="mt-1.5">
                <span
                  onClick={(e) => {
                    if (event.dmrNetwork === "brandmeister") {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(
                        `https://hose.brandmeister.network/?tg=${event.talkgroup}`,
                        "_blank"
                      );
                    }
                  }}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]
                    bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400
                    ${event.dmrNetwork === "brandmeister" ? "hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer" : ""}
                    transition-colors`}
                  title={
                    event.dmrNetwork === "brandmeister"
                      ? t("dmr.listen")
                      : `${getDMRNetworkLabel(event.dmrNetwork, t)} TG ${event.talkgroup}`
                  }
                >
                  <Radio className="w-2.5 h-2.5" /> TG {event.talkgroup}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export const EventCardCompact = memo(
  EventCardCompactComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.event.id === nextProps.event.id &&
      prevProps.event.title === nextProps.event.title &&
      prevProps.event.start === nextProps.event.start &&
      prevProps.showCountdown === nextProps.showCountdown &&
      prevProps.t === nextProps.t
    );
  }
);

EventCardCompact.displayName = "EventCardCompact";

export default EventCardCompact;
