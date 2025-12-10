"use client";

/**
 * CalendarView component - calendar with month and week views
 */

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventCard } from "./EventCard";
import { EventCardCompact } from "./EventCardCompact";
import {
  dateKeyLocal,
  eventOccursOnDay,
  getWeekStart,
  getWeekDays,
  formatWeekRange,
  formatTime,
} from "./utils/formatters";
import type { EventItem, TranslationFunction } from "./types";

interface CalendarViewProps {
  events: EventItem[];
  t: TranslationFunction;
}

// Week day names in Portuguese
const WEEK_DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function CalendarView({ events, t }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [calendarTab, setCalendarTab] = useState<string>("month");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Count events per day for calendar badges
  const countsByDay = useMemo(() => {
    const map = new Map<string, number>();

    for (const event of events) {
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : startDate;

      // Iterate through each day from start to end
      const currentDay = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );
      const lastDay = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      while (currentDay <= lastDay) {
        const k = dateKeyLocal(currentDay);
        map.set(k, (map.get(k) ?? 0) + 1);
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  // Events for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events
      .filter((e) => eventOccursOnDay(e.start, e.end, selectedDate))
      .sort((a, b) => {
        // Featured events come first
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        // Then sort by start time
        return new Date(a.start).getTime() - new Date(b.start).getTime();
      });
  }, [events, selectedDate]);

  // Week days array
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Events grouped by week day
  const eventsByWeekDay = useMemo(() => {
    const result: Map<string, EventItem[]> = new Map();

    for (const day of weekDays) {
      const key = dateKeyLocal(day);
      const dayEvents = events
        .filter((e) => eventOccursOnDay(e.start, e.end, day))
        .sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(a.start).getTime() - new Date(b.start).getTime();
        });
      result.set(key, dayEvents);
    }

    return result;
  }, [events, weekDays]);

  // Navigation for week view
  const goToPreviousWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() - 7);
    setWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(weekStart);
    newWeekStart.setDate(weekStart.getDate() + 7);
    setWeekStart(newWeekStart);
  };

  const goToCurrentWeek = () => {
    setWeekStart(getWeekStart(new Date()));
  };

  // Custom day component for calendar with event count badge
  const CustomDay = ({
    day,
    ...props
  }: {
    day: { date: Date };
    className?: string;
    children?: React.ReactNode;
  } & React.TdHTMLAttributes<HTMLTableCellElement>) => {
    const count = countsByDay.get(dateKeyLocal(day.date)) ?? 0;
    return (
      <td {...props} className={`${props.className} relative`}>
        {props.children}
        {count > 0 && (
          <span className="absolute top-1 right-1 text-[8px] leading-none bg-primary text-primary-foreground font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center pointer-events-none">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </td>
    );
  };

  return (
    <Tabs value={calendarTab} onValueChange={setCalendarTab} className="w-full">
      <TabsList className="grid grid-cols-2 w-full max-w-xs mb-4">
        <TabsTrigger value="month">{t("monthView") || "Mês"}</TabsTrigger>
        <TabsTrigger value="week">{t("weekView") || "Semana"}</TabsTrigger>
      </TabsList>

      {/* Month View */}
      <TabsContent value="month" className="mt-0">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border"
              classNames={{
                root: "w-full",
              }}
              components={{
                Day: CustomDay,
              }}
            />
          </div>

          <div className="md:col-span-2">
            <Card className="rounded-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  {t("eventsOn")}{" "}
                  {selectedDate
                    ? selectedDate.toLocaleDateString("pt-PT", {
                        weekday: "long",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedEvents.length === 0 && (
                  <div className="text-sm text-muted-foreground py-4">
                    {t("noEventsOnDate")}
                  </div>
                )}
                {selectedEvents.map((evt) => (
                  <EventCard key={evt.id} event={evt} t={t} />
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* Week View */}
      <TabsContent value="week" className="mt-0">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToPreviousWeek}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-base sm:text-lg">
                  {formatWeekRange(weekStart)}
                </CardTitle>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goToNextWeek}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={goToCurrentWeek}
                className="text-xs"
              >
                {t("today") || "Hoje"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Header row */}
              {weekDays.map((day, idx) => {
                const isToday =
                  dateKeyLocal(day) === dateKeyLocal(new Date());
                return (
                  <div
                    key={dateKeyLocal(day)}
                    className={`text-center py-2 rounded-lg ${
                      isToday
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-muted-foreground"
                    }`}
                  >
                    <div className="text-xs font-medium">
                      {WEEK_DAYS_PT[idx]}
                    </div>
                    <div className="text-lg sm:text-xl font-bold">
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}

              {/* Events row */}
              {weekDays.map((day) => {
                const dayKey = dateKeyLocal(day);
                const dayEvents = eventsByWeekDay.get(dayKey) || [];
                const isToday = dayKey === dateKeyLocal(new Date());

                return (
                  <div
                    key={`events-${dayKey}`}
                    className={`min-h-[120px] sm:min-h-[150px] p-1 sm:p-2 rounded-lg border ${
                      isToday
                        ? "border-primary/30 bg-primary/5"
                        : "border-border/50"
                    }`}
                  >
                    {dayEvents.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        —
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map((event) => (
                          <WeekEventItem
                            key={event.id}
                            event={event}
                            t={t}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center pt-1">
                            +{dayEvents.length - 3} {t("more") || "mais"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected day events (mobile-friendly detail) */}
            <div className="mt-6 sm:hidden">
              <h3 className="font-semibold mb-3">
                {t("eventsThisWeek") || "Eventos esta semana"}
              </h3>
              <div className="space-y-2">
                {weekDays.map((day) => {
                  const dayKey = dateKeyLocal(day);
                  const dayEvents = eventsByWeekDay.get(dayKey) || [];
                  if (dayEvents.length === 0) return null;

                  return (
                    <div key={dayKey} className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {day.toLocaleDateString("pt-PT", {
                          weekday: "long",
                          day: "numeric",
                        })}
                      </h4>
                      {dayEvents.map((event) => (
                        <EventCardCompact
                          key={event.id}
                          event={event}
                          t={t}
                          showCountdown={false}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}

// Compact event item for week grid cells
function WeekEventItem({
  event,
  t,
}: {
  event: EventItem;
  t: (key: string) => string;
}) {
  const tagColors =
    event.tag === "Net"
      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
      : event.tag === "Contest"
        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
        : event.tag === "Meetup"
          ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800"
          : event.tag === "Satellite"
            ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800"
            : event.tag === "DX"
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

  return (
    <a
      href={`/events/${encodeURIComponent(event.id)}/`}
      className={`block p-1.5 rounded text-[10px] sm:text-xs border truncate hover:opacity-80 transition-opacity ${tagColors}`}
      title={event.title}
    >
      <div className="font-medium truncate">{formatTime(event.start)}</div>
      <div className="truncate opacity-80">{event.title}</div>
    </a>
  );
}

export default CalendarView;
