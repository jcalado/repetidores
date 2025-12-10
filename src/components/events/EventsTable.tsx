"use client";

/**
 * EventsTable component - table view of events
 */

import { memo } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Clock, MapPin, Radio, Star } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTick } from "./hooks/useOptimizedTick";
import { formatDateTime, formatSmartCountdown, msUntil } from "./utils/formatters";
import { getTagColors, getTagIcon, getDMRNetworkLabel } from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface EventsTableProps {
  events: EventItem[];
  t: TranslationFunction;
}

function EventsTableComponent({ events, t }: EventsTableProps) {
  const router = useRouter();
  // Subscribe to global tick for live countdown
  useTick();

  return (
    <div className="rounded-2xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">{t("tableHeaders.title")}</TableHead>
            <TableHead className="hidden sm:table-cell">{t("tableHeaders.start")}</TableHead>
            <TableHead className="hidden md:table-cell">{t("tableHeaders.tag")}</TableHead>
            <TableHead className="hidden lg:table-cell">{t("tableHeaders.location")}</TableHead>
            <TableHead>{t("tableHeaders.countdown")}</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => {
            const now = Date.now();
            const startTime = new Date(event.start).getTime();
            const endTime = event.end
              ? new Date(event.end).getTime()
              : startTime + 3600000;
            const hasStarted = now >= startTime;
            const hasEnded = now >= endTime;
            const isInProgress = hasStarted && !hasEnded;
            const remainingToStart = msUntil(event.start);
            const remainingToEnd = event.end ? msUntil(event.end) : 0;
            const tagColors = getTagColors(event.tag);
            const TagIcon = getTagIcon(event.tag);

            return (
              <TableRow
                key={event.id}
                className="group cursor-pointer hover:bg-muted/50"
                onClick={() =>
                  router.push(`/events/${encodeURIComponent(event.id)}/`)
                }
              >
                {/* Title */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2 min-w-0">
                    {event.isFeatured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                    )}
                    <span className={tagColors.icon}>
                      <TagIcon className="w-4 h-4 shrink-0" />
                    </span>
                    <span className="truncate group-hover:text-primary transition-colors">
                      {event.title}
                    </span>
                  </div>
                  {/* Mobile: show date below title */}
                  <div className="sm:hidden text-xs text-muted-foreground mt-1">
                    {formatDateTime(event.start, { hideCurrentYear: true })}
                  </div>
                </TableCell>

                {/* Start Date */}
                <TableCell className="hidden sm:table-cell text-muted-foreground">
                  {formatDateTime(event.start, { hideCurrentYear: true })}
                </TableCell>

                {/* Tag */}
                <TableCell className="hidden md:table-cell">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border ${tagColors.bg} ${tagColors.text} ${tagColors.border}`}
                  >
                    <TagIcon className="w-3 h-3" />
                    {event.tag ?? t("event")}
                  </span>
                </TableCell>

                {/* Location */}
                <TableCell className="hidden lg:table-cell text-muted-foreground">
                  <div className="flex flex-wrap items-center gap-2">
                    {event.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {event.location}
                      </span>
                    ) : (
                      "—"
                    )}
                    {event.dmr && event.talkgroup && (
                      <span
                        onClick={(e) => {
                          if (event.dmrNetwork === "brandmeister") {
                            e.stopPropagation();
                            window.open(
                              `https://hose.brandmeister.network/?tg=${event.talkgroup}`,
                              "_blank"
                            );
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 ${
                          event.dmrNetwork === "brandmeister"
                            ? "hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer"
                            : ""
                        } transition-colors`}
                        title={
                          event.dmrNetwork === "brandmeister"
                            ? t("dmr.listen")
                            : `${getDMRNetworkLabel(event.dmrNetwork, t)} TG ${event.talkgroup}`
                        }
                      >
                        <Radio className="w-3 h-3" /> TG {event.talkgroup}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Countdown */}
                <TableCell className="tabular-nums">
                  {isInProgress ? (
                    <span className="inline-flex items-center gap-1 text-green-600 dark:text-green-400 text-sm font-medium">
                      <Clock className="w-3.5 h-3.5 animate-pulse" />
                      {formatSmartCountdown(remainingToEnd, t)}
                    </span>
                  ) : hasEnded ? (
                    <span className="text-muted-foreground text-sm">
                      {t("ended")}
                    </span>
                  ) : (
                    <span className={`${tagColors.text} text-sm font-medium`}>
                      {formatSmartCountdown(remainingToStart, t)}
                    </span>
                  )}
                </TableCell>

                {/* Arrow */}
                <TableCell>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {events.length === 0 && (
        <div className="text-center text-muted-foreground py-12">
          {t("noMatching")}
        </div>
      )}
    </div>
  );
}

export const EventsTable = memo(EventsTableComponent);
EventsTable.displayName = "EventsTable";

export default EventsTable;
