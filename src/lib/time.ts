/**
 * Time formatting utilities
 */

/**
 * Format an ISO timestamp as a relative time string in Portuguese.
 * Returns strings like "agora mesmo", "há 5 minutos", "há 2 horas", "há 3 dias",
 * or a formatted date for older timestamps.
 */
export function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "agora mesmo";
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
  if (diffDays < 30) return `há ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;

  return date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

/**
 * Portuguese short month names, indexed by month number (0-11).
 */
export const PT_MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

/**
 * Format a Date as a Portuguese short date in local time, e.g. "9 set 2026".
 */
export function formatDatePT(d: Date): string {
  return `${d.getDate()} ${PT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
