import type { EventItem } from '@/components/HamRadioEventsCountdown';

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

  // Add description with tag and BrandMeister info
  const descParts: string[] = [];
  if (event.tag) descParts.push(`Categoria: ${event.tag}`);
  if (event.brandmeister && event.talkgroup) {
    descParts.push(`BrandMeister TG: ${event.talkgroup}`);
  }
  if (event.url) descParts.push(`Mais info: ${event.url}`);

  if (descParts.length > 0) {
    lines.push(`DESCRIPTION:${escapeICS(descParts.join('\\n'))}`);
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

  const details: string[] = [];
  if (event.tag) details.push(`Categoria: ${event.tag}`);
  if (event.brandmeister && event.talkgroup) {
    details.push(`BrandMeister TG: ${event.talkgroup}`);
  }
  if (event.url) details.push(`Mais info: ${event.url}`);

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

  const details: string[] = [];
  if (event.tag) details.push(`Categoria: ${event.tag}`);
  if (event.brandmeister && event.talkgroup) {
    details.push(`BrandMeister TG: ${event.talkgroup}`);
  }
  if (event.url) details.push(`Mais info: ${event.url}`);

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
