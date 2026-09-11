import { getEventDmrSummary } from '@/components/events/utils/dmr';
import type { EventItem, EventOperatingWindow } from '@/components/events/types';

/**
 * Format a date for ICS files (YYYYMMDDTHHMMSSZ)
 */
function formatICSDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Format a date for Google Calendar URL (YYYYMMDDTHHMMSSZ)
 */
function formatGoogleDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

const DMR_NETWORK_NAMES: Record<string, string> = {
  brandmeister: 'Brandmeister',
  adn: 'ADN Systems',
};

/**
 * Format one operating window's time range in the event's display timezone.
 * Dates are included because a window may not fall on the event's first day.
 */
function formatWindowRange(window: EventOperatingWindow, timeZone: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  const start = new Date(window.start).toLocaleString('pt-PT', opts);
  const end = new Date(window.end).toLocaleString('pt-PT', opts);
  return `${start} - ${end}`;
}

/**
 * The description body shared by every calendar target (.ics, Google, Outlook).
 *
 * Returns plain lines; each target joins them with whatever newline it needs.
 * When the event carries an operating plan, every window is listed — a saved
 * calendar entry is often the only thing an operator has in the field, so it
 * must carry the callsign, bands, talkgroups and time windows, not just a tag.
 */
function buildDescriptionLines(event: EventItem): string[] {
  const lines: string[] = [];

  if (event.tag) lines.push(`Categoria: ${event.tag}`);
  if (event.callsign) lines.push(`Indicativo: ${event.callsign}`);

  const plan = event.operatingPlan ?? [];
  if (plan.length > 0) {
    const timeZone = event.displayTimezone || 'UTC';
    lines.push(`Plano de operação (horas de ${timeZone}):`);
    for (const window of plan) {
      const what = [window.mode, window.label].filter(Boolean).join(' ');
      const extra = [
        window.network,
        window.talkgroup ? `TG ${window.talkgroup}` : '',
        window.frequency,
      ]
        .filter(Boolean)
        .join(' - ');
      lines.push(`- ${formatWindowRange(window, timeZone)} ${what}${extra ? ` (${extra})` : ''}`);
    }
  } else {
    // No plan: fall back to the legacy dmr/talkgroup pair.
    const dmr = getEventDmrSummary(event);
    if (dmr) {
      const network = DMR_NETWORK_NAMES[dmr.network ?? ''] || 'DMR';
      lines.push(`${network} TG: ${dmr.talkgroup}`);
    }
  }

  if (event.organizer?.name || event.organizerName) {
    lines.push(`Organização: ${event.organizer?.name || event.organizerName}`);
  }
  if (event.qsl?.available && event.qsl.url) {
    lines.push(`QSL: ${event.qsl.url}`);
  }
  if (event.url) lines.push(`Mais info: ${event.url}`);

  return lines;
}

/**
 * Escape special characters for ICS format
 */
function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Generate an ICS calendar file content for an event
 */
export function generateICS(event: EventItem): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = event.end || new Date(new Date(event.start).getTime() + 3600000).toISOString();

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Repetidores//Events//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@repetidores.pt`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatICSDate(event.start)}`,
    `DTEND:${formatICSDate(endDate)}`,
    `SUMMARY:${escapeICS(event.title)}`,
  ];

  if (event.location) {
    lines.push(`LOCATION:${escapeICS(event.location)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  // escapeICS turns each real newline into the ICS "\n" escape, so the parts
  // are joined with a real newline rather than a pre-escaped one.
  const descParts = buildDescriptionLines(event);

  if (descParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeICS(descParts.join('\n'))}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Download an ICS file for an event
 */
export function downloadICS(event: EventItem): void {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, '_').substring(0, 50)}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generate Google Calendar URL for an event
 */
export function getGoogleCalendarUrl(event: EventItem): string {
  const endDate = event.end || new Date(new Date(event.start).getTime() + 3600000).toISOString();

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${formatGoogleDate(event.start)}/${formatGoogleDate(endDate)}`,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  const details = buildDescriptionLines(event);

  if (details.length > 0) {
    params.set('details', details.join('\n'));
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook.com calendar URL for an event
 */
export function getOutlookCalendarUrl(event: EventItem): string {
  const endDate = event.end || new Date(new Date(event.start).getTime() + 3600000).toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: event.start,
    enddt: endDate,
  });

  if (event.location) {
    params.set('location', event.location);
  }

  const details = buildDescriptionLines(event);

  if (details.length > 0) {
    params.set('body', details.join('\n'));
  }

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate Yahoo Calendar URL for an event
 */
export function getYahooCalendarUrl(event: EventItem): string {
  const endDate = event.end || new Date(new Date(event.start).getTime() + 3600000).toISOString();

  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    st: formatGoogleDate(event.start),
    et: formatGoogleDate(endDate),
  });

  if (event.location) {
    params.set('in_loc', event.location);
  }

  const details: string[] = [];
  if (event.url) details.push(event.url);

  if (details.length > 0) {
    params.set('desc', details.join('\n'));
  }

  return `https://calendar.yahoo.com/?${params.toString()}`;
}

/**
 * Social sharing URLs
 */
export function getTwitterShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    text,
    url,
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

export function getWhatsAppShareUrl(text: string, url: string): string {
  return `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
}

export function getTelegramShareUrl(text: string, url: string): string {
  const params = new URLSearchParams({
    url,
    text,
  });
  return `https://t.me/share/url?${params.toString()}`;
}

export function getFacebookShareUrl(url: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
}

export function getLinkedInShareUrl(url: string, title: string): string {
  const params = new URLSearchParams({
    url,
    title,
  });
  return `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
}

/**
 * Generate ICS calendar file for multiple events
 */
export function generateMultipleICS(events: EventItem[]): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Repetidores//Events//PT',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Repetidores - Eventos de Radioamadorismo',
  ];

  for (const event of events) {
    const endDate = event.end || new Date(new Date(event.start).getTime() + 3600000).toISOString();

    lines.push(
      'BEGIN:VEVENT',
      `UID:${event.id}@repetidores.pt`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICSDate(event.start)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${escapeICS(event.title)}`
    );

    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`);
    }

    if (event.url) {
      lines.push(`URL:${event.url}`);
    }

    const descParts = buildDescriptionLines(event);

    if (descParts.length > 0) {
      lines.push(`DESCRIPTION:${escapeICS(descParts.join('\n'))}`);
    }

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
}

/**
 * Download ICS file for multiple events
 */
export function downloadMultipleICS(events: EventItem[], filename = 'repetidores-eventos'): void {
  const ics = generateMultipleICS(events);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
