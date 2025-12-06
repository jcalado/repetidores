import type { EventsAPIResponse } from '@/components/HamRadioEventsCountdown';

const API_BASE_URL = (() => {
  const source =
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    'http://localhost:3000';
  return source.replace(/\/$/, '');
})();

export interface FetchEventsOptions {
  limit?: number;
  sort?: 'startAsc' | 'startDesc' | 'title';
}

export async function fetchEvents(options: FetchEventsOptions = {}): Promise<EventsAPIResponse> {
  const params = new URLSearchParams({
    limit: String(options.limit ?? 500),
    sort: options.sort ?? 'startAsc',
  });

  const response = await fetch(`${API_BASE_URL}/api/events/list?${params}`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch events: HTTP ${response.status}`);
  }

  return response.json();
}
