/**
 * Date/time formatting utilities for events
 */

export function msUntil(dateISO: string): number {
  const target = new Date(dateISO).getTime();
  const now = Date.now();
  return Math.max(0, target - now);
}

export function breakdown(ms: number) {
  const sec = Math.floor(ms / 1000);
  const days = Math.floor(sec / 86400);
  const hours = Math.floor((sec % 86400) / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  return { days, hours, minutes, seconds };
}

/**
 * Format datetime for display, hiding year if it's the current year
 */
export function formatDateTime(iso: string, options?: { hideCurrentYear?: boolean }): string {
  const d = new Date(iso);
  const isCurrentYear = d.getFullYear() === new Date().getFullYear();
  const shouldHideYear = options?.hideCurrentYear && isCurrentYear;

  return d.toLocaleString('pt-PT', {
    weekday: "short",
    year: shouldHideYear ? undefined : "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format time only (HH:mm)
 */
export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('pt-PT', {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date only
 */
export function formatDate(iso: string, options?: { hideCurrentYear?: boolean }): string {
  const d = new Date(iso);
  const isCurrentYear = d.getFullYear() === new Date().getFullYear();
  const shouldHideYear = options?.hideCurrentYear && isCurrentYear;

  return d.toLocaleDateString('pt-PT', {
    weekday: "short",
    year: shouldHideYear ? undefined : "numeric",
    month: "short",
    day: "2-digit",
  });
}

/**
 * Get local date key for calendar operations
 */
export function dateKeyLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Smart countdown display: shows days if > 24h, otherwise hours/minutes/seconds
 */
export function formatSmartCountdown(
  ms: number,
  t: (key: string, params?: Record<string, unknown>) => string
): string {
  const { days, hours, minutes, seconds } = breakdown(ms);

  if (days > 0) {
    return t('inDays', { count: days });
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

/**
 * Check if an event occurs on a specific day (handles multi-day events)
 */
export function eventOccursOnDay(
  eventStart: string,
  eventEnd: string | undefined,
  day: Date
): boolean {
  const startDate = new Date(eventStart);
  const endDate = eventEnd ? new Date(eventEnd) : startDate;

  // Normalize dates to midnight local time for comparison
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  const eventStartDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const eventEndDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999);

  // Check if the day falls within the event's date range
  return dayStart <= eventEndDay && dayEnd >= eventStartDay;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  return new Date(d.setDate(diff));
}

/**
 * Get array of dates for a week starting from Monday
 */
export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Format week range for display (e.g., "16-22 Dez 2024")
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const month = weekEnd.toLocaleDateString('pt-PT', { month: 'short' });
  const year = weekEnd.getFullYear();

  return `${startDay}-${endDay} ${month} ${year}`;
}
