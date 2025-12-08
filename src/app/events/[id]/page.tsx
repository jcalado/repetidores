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

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  try {
    const events = await getEvents();
    const event = events.find((e) => e.id === decodedId);

    if (!event) {
      return {
        title: "Evento não encontrado",
      };
    }

    const startDate = new Date(event.start);
    const formattedDate = startDate.toLocaleDateString("pt-PT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const title = event.title;
    const description = `${event.title} - ${formattedDate}${event.location ? ` em ${event.location}` : ""}. Evento de radioamadorismo.`;

    return {
      title,
      description,
      alternates: {
        canonical: `/events/${encodeURIComponent(event.id)}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/events/${encodeURIComponent(event.id)}`,
        siteName: "Repetidores",
        locale: "pt_PT",
      },
      twitter: {
        card: "summary",
        title,
        description,
      },
    };
  } catch {
    return {
      title: "Evento",
    };
  }
}

function generateEventJsonLd(event: EventItem) {
  const startDate = new Date(event.start);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start,
    ...(event.end && { endDate: event.end }),
    ...(event.location && {
      location: {
        "@type": "Place",
        name: event.location,
      },
    }),
    ...(event.url && { url: event.url }),
    organizer: {
      "@type": "Organization",
      name: "Repetidores",
      url: "https://repetidores.jcalado.com",
    },
    eventStatus: startDate > new Date() ? "https://schema.org/EventScheduled" : "https://schema.org/EventMovedOnline",
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const events = await getEvents();
  const event = events.find((e) => e.id === decodedId);

  const jsonLd = event ? generateEventJsonLd(event) : null;

  // Don't call notFound() here - let client handle fallback fetch from API
  return (
    <div className="min-h-screen bg-background">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <EventDetailsClient
        event={event}
        eventId={decodedId}
        allEvents={events}
      />
    </div>
  );
}
