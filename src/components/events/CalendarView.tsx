"use client";

/**
 * CalendarView component - Full-width calendar with month and week views
 * Inspired by Google Calendar / Apple Calendar design patterns
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  dateKeyLocal,
  eventOccursOnDay,
  getWeekStart,
  getWeekDays,
  formatTime,
} from "./utils/formatters";
import { getTagIconBg } from "./utils/tagColors";
import type { EventItem, TranslationFunction } from "./types";

interface CalendarViewProps {
  events: EventItem[];
  t: TranslationFunction;
}

// Week day names in Portuguese
const WEEK_DAYS_PT = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const WEEK_DAYS_FULL_PT = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
const MONTHS_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export function CalendarView({ events, t }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekStart(new Date()));

  // Get all days for the current month view (including padding days)
  const monthDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week for the first day (0 = Sunday, adjust for Monday start)
    let startPadding = firstDay.getDay() - 1;
    if (startPadding < 0) startPadding = 6; // Sunday becomes 6

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Add padding days from previous month
    for (let i = startPadding - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({ date, isCurrentMonth: false });
    }

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }

    // Add padding days for next month to complete the grid
    const remainingDays = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    return days;
  }, [currentMonth]);

  // Group events by day
  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventItem[]>();

    for (const event of events) {
      const startDate = new Date(event.start);
      const endDate = event.end ? new Date(event.end) : startDate;

      const currentDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const lastDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      while (currentDay <= lastDay) {
        const k = dateKeyLocal(currentDay);
        const existing = map.get(k) || [];
        if (!existing.find(e => e.id === event.id)) {
          existing.push(event);
          existing.sort((a, b) => {
            if (a.isFeatured && !b.isFeatured) return -1;
            if (!a.isFeatured && b.isFeatured) return 1;
            return new Date(a.start).getTime() - new Date(b.start).getTime();
          });
          map.set(k, existing);
        }
        currentDay.setDate(currentDay.getDate() + 1);
      }
    }
    return map;
  }, [events]);

  // Events for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    return eventsByDay.get(dateKeyLocal(selectedDate)) || [];
  }, [eventsByDay, selectedDate]);

  // Week days array
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart]);

  // Events grouped by week day
  const eventsByWeekDay = useMemo(() => {
    const result: Map<string, EventItem[]> = new Map();
    for (const day of weekDays) {
      const key = dateKeyLocal(day);
      result.set(key, eventsByDay.get(key) || []);
    }
    return result;
  }, [eventsByDay, weekDays]);

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setWeekStart(getWeekStart(today));
    setSelectedDate(today);
  };

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

  const todayKey = dateKeyLocal(new Date());

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {/* View mode toggle */}
          <div className="flex rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800/50 p-1">
            <button
              onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "month"
                  ? "bg-white dark:bg-ship-cove-900 text-ship-cove-900 dark:text-ship-cove-100 shadow-sm"
                  : "text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-900 dark:hover:text-ship-cove-200"
              }`}
            >
              {t("monthView") || "Mês"}
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                viewMode === "week"
                  ? "bg-white dark:bg-ship-cove-900 text-ship-cove-900 dark:text-ship-cove-100 shadow-sm"
                  : "text-ship-cove-600 dark:text-ship-cove-400 hover:text-ship-cove-900 dark:hover:text-ship-cove-200"
              }`}
            >
              {t("weekView") || "Semana"}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === "month" ? goToPreviousMonth : goToPreviousWeek}
              className="h-9 w-9"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={viewMode === "month" ? goToNextMonth : goToNextWeek}
              className="h-9 w-9"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Current period */}
          <h2 className="text-xl font-bold text-ship-cove-900 dark:text-ship-cove-100">
            {viewMode === "month" ? (
              `${MONTHS_PT[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`
            ) : (
              `${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${MONTHS_PT[weekDays[6].getMonth()]} ${weekDays[6].getFullYear()}`
            )}
          </h2>
        </div>

        <Button variant="outline" size="sm" onClick={goToToday} className="gap-2">
          <CalendarIcon className="h-4 w-4" />
          {t("today") || "Hoje"}
        </Button>
      </div>

      {/* Month View */}
      {viewMode === "month" && (
        <div className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 overflow-hidden bg-white dark:bg-ship-cove-950/50">
          {/* Week day headers */}
          <div className="grid grid-cols-7 bg-ship-cove-50 dark:bg-ship-cove-900/50 border-b border-ship-cove-200 dark:border-ship-cove-800">
            {WEEK_DAYS_PT.map((day) => (
              <div
                key={day}
                className="px-2 py-3 text-center text-xs font-semibold text-ship-cove-600 dark:text-ship-cove-400 uppercase tracking-wider"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {monthDays.map(({ date, isCurrentMonth }, index) => {
              const dayKey = dateKeyLocal(date);
              const dayEvents = eventsByDay.get(dayKey) || [];
              const isToday = dayKey === todayKey;
              const isSelected = selectedDate && dayKey === dateKeyLocal(selectedDate);

              return (
                <div
                  key={index}
                  onClick={() => setSelectedDate(date)}
                  className={`min-h-[100px] sm:min-h-[120px] p-1.5 border-b border-r border-ship-cove-100 dark:border-ship-cove-800/50 cursor-pointer transition-colors ${
                    !isCurrentMonth ? "bg-ship-cove-50/50 dark:bg-ship-cove-900/20" : ""
                  } ${isSelected ? "bg-ship-cove-100 dark:bg-ship-cove-800/50" : "hover:bg-ship-cove-50 dark:hover:bg-ship-cove-900/30"}`}
                >
                  {/* Day number */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium ${
                        isToday
                          ? "bg-ship-cove-600 text-white"
                          : isCurrentMonth
                            ? "text-ship-cove-900 dark:text-ship-cove-100"
                            : "text-ship-cove-400 dark:text-ship-cove-600"
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {dayEvents.length > 3 && (
                      <span className="text-[10px] text-ship-cove-500 dark:text-ship-cove-400 font-medium">
                        +{dayEvents.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Events */}
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <CalendarEventPill key={event.id} event={event} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Week View */}
      {viewMode === "week" && (
        <div className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 overflow-hidden bg-white dark:bg-ship-cove-950/50">
          {/* Week header */}
          <div className="grid grid-cols-7 bg-ship-cove-50 dark:bg-ship-cove-900/50 border-b border-ship-cove-200 dark:border-ship-cove-800">
            {weekDays.map((day, idx) => {
              const isToday = dateKeyLocal(day) === todayKey;
              return (
                <div
                  key={dateKeyLocal(day)}
                  className={`px-2 py-3 text-center border-r last:border-r-0 border-ship-cove-200 dark:border-ship-cove-800 ${
                    isToday ? "bg-ship-cove-100 dark:bg-ship-cove-800/50" : ""
                  }`}
                >
                  <div className="text-xs font-medium text-ship-cove-500 dark:text-ship-cove-400 uppercase tracking-wider">
                    {WEEK_DAYS_PT[idx]}
                  </div>
                  <div
                    className={`text-2xl font-bold mt-1 ${
                      isToday
                        ? "text-ship-cove-600 dark:text-ship-cove-300"
                        : "text-ship-cove-900 dark:text-ship-cove-100"
                    }`}
                  >
                    {day.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Week events grid */}
          <div className="grid grid-cols-7 min-h-[400px]">
            {weekDays.map((day) => {
              const dayKey = dateKeyLocal(day);
              const dayEvents = eventsByWeekDay.get(dayKey) || [];
              const isToday = dayKey === todayKey;

              return (
                <div
                  key={`events-${dayKey}`}
                  className={`p-2 border-r last:border-r-0 border-ship-cove-100 dark:border-ship-cove-800/50 ${
                    isToday ? "bg-ship-cove-50/50 dark:bg-ship-cove-900/20" : ""
                  }`}
                >
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-ship-cove-400 dark:text-ship-cove-600">
                      —
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {dayEvents.map((event) => (
                        <WeekEventCard key={event.id} event={event} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected date events panel */}
      {selectedDate && selectedEvents.length > 0 && viewMode === "month" && (
        <div className="mt-6 rounded-xl border border-ship-cove-200 dark:border-ship-cove-800 bg-white dark:bg-ship-cove-950/50 p-4">
          <h3 className="text-lg font-bold text-ship-cove-900 dark:text-ship-cove-100 mb-4">
            {t("eventsOn") || "Eventos em"}{" "}
            {selectedDate.toLocaleDateString("pt-PT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </h3>
          <div className="space-y-3">
            {selectedEvents.map((event) => (
              <SelectedDayEventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Small event pill for month view cells
function CalendarEventPill({ event }: { event: EventItem }) {
  const iconBgClass = getTagIconBg(event.tag);

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}/`}
      onClick={(e) => e.stopPropagation()}
      className={`block px-1.5 py-0.5 rounded text-[10px] sm:text-xs font-medium text-white truncate hover:opacity-90 transition-opacity ${iconBgClass}`}
      title={event.title}
    >
      {event.title}
    </Link>
  );
}

// Event card for week view
function WeekEventCard({ event }: { event: EventItem }) {
  const iconBgClass = getTagIconBg(event.tag);
  const time = formatTime(event.start);

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}/`}
      className="block rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className={`${iconBgClass} px-2 py-1`}>
        <span className="text-[10px] font-bold text-white/90">{time}</span>
      </div>
      <div className="bg-ship-cove-50 dark:bg-ship-cove-900/50 px-2 py-1.5">
        <span className="text-xs font-medium text-ship-cove-900 dark:text-ship-cove-100 line-clamp-2">
          {event.title}
        </span>
        {event.location && (
          <span className="text-[10px] text-ship-cove-500 dark:text-ship-cove-400 truncate block mt-0.5">
            {event.location}
          </span>
        )}
      </div>
    </Link>
  );
}

// Event card for selected date panel
function SelectedDayEventCard({ event }: { event: EventItem }) {
  const iconBgClass = getTagIconBg(event.tag);
  const time = formatTime(event.start);

  return (
    <Link
      href={`/events/${encodeURIComponent(event.id)}/`}
      className="flex gap-3 p-3 rounded-lg bg-ship-cove-50 dark:bg-ship-cove-900/30 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/50 transition-colors group"
    >
      {/* Time badge */}
      <div className={`${iconBgClass} px-3 py-2 rounded-lg text-center shrink-0`}>
        <span className="text-sm font-bold text-white">{time}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-ship-cove-900 dark:text-ship-cove-100 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors">
          {event.title}
        </h4>
        <div className="flex items-center gap-3 mt-1 text-sm text-ship-cove-500 dark:text-ship-cove-400">
          <span className="font-medium">{event.tag}</span>
          {event.location && (
            <>
              <span>•</span>
              <span className="truncate">{event.location}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

export default CalendarView;
