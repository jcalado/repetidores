import { notFound } from 'next/navigation';
import type { EventItem } from '@/components/HamRadioEventsCountdown';
import EventDetailsClient from './EventDetailsClient';

async function getEvents(): Promise<EventItem[]> {
  const apiBaseUrl = (
    process.env.PAYLOAD_API_BASE_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');

  const params = new URLSearchParams({
    limit: '500',
    sort: 'startAsc',
  });

  const url = `${apiBaseUrl}/api/events/list?${params.toString()}`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      console.error('[EventDetailPage] Failed to fetch events:', response.status);
      return [];
    }

    const data = await response.json();
    return data.docs || [];
  } catch (error) {
    console.error('[EventDetailPage] Error fetching events:', error);
    return [];
  }
}

export async function generateStaticParams(): Promise<{ id: string }[]> {
  const events = await getEvents();
  return events.map((event) => ({
    id: encodeURIComponent(event.id),
  }));
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const events = await getEvents();
  const event = events.find((e) => e.id === decodedId);

  if (!event) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <EventDetailsClient event={event} allEvents={events} />
    </div>
  );
}
