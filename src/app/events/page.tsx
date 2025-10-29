import HamRadioEventsCountdown from '@/components/HamRadioEventsCountdown'
import type { EventItem } from '@/components/HamRadioEventsCountdown'

async function getEvents(): Promise<EventItem[]> {
  const apiBaseUrl = (
    process.env.PAYLOAD_API_BASE_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');

  // Fetch events from 30 days ago to show historical events in calendar
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const params = new URLSearchParams({
    limit: '200',
    sort: 'start',
    'where[start][greater_than_equal]': thirtyDaysAgo.toISOString(),
  });

  const url = `${apiBaseUrl}/api/events?${params.toString()}`;
  console.log('[EventsPage] Fetching events at build time from:', url);

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Revalidate every hour in case using ISR
    });

    if (!response.ok) {
      console.error('[EventsPage] Failed to fetch events:', response.status);
      return [];
    }

    const data = await response.json();
    return data.docs || [];
  } catch (error) {
    console.error('[EventsPage] Error fetching events:', error);
    return [];
  }
}

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-background">
      <HamRadioEventsCountdown initialEvents={events} />
    </div>
  )
}
