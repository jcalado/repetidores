import type { EventItem } from '@/components/HamRadioEventsCountdown';
import EventDetailsClient from './EventDetailsClient';
import { BreadcrumbJsonLd } from "@/components/seo";

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

    // Handle event featured image
    const imageUrl = event.featuredImage?.url
      ? event.featuredImage.url.startsWith("http")
        ? event.featuredImage.url
        : `${process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL || ""}${event.featuredImage.url}`
      : null;

    const ogImage = imageUrl
      ? {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: event.featuredImage?.alt || title,
        }
      : {
          url: "/og-default.png",
          width: 512,
          height: 512,
          alt: "Radioamador.info",
        };

    return {
      title,
      description,
      alternates: {
        canonical: `/events/${encodeURIComponent(event.id)}/`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/events/${encodeURIComponent(event.id)}/`,
        siteName: "Radioamador.info",
        locale: "pt_PT",
        images: [ogImage],
      },
      twitter: {
        card: imageUrl ? "summary_large_image" : "summary",
        title,
        description,
        images: [ogImage.url],
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
  const isOnline = event.location?.toLowerCase().includes('online') ||
                   event.location?.toLowerCase().includes('internet') ||
                   event.location?.toLowerCase().includes('web');

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start,
    ...(event.end && { endDate: event.end }),
    ...(event.location && {
      location: isOnline ? {
        "@type": "VirtualLocation",
        url: event.url || "https://www.radioamador.info",
      } : {
        "@type": "Place",
        name: event.location,
      },
    }),
    ...(event.url && { url: event.url }),
    eventAttendanceMode: isOnline
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: startDate > new Date()
      ? "https://schema.org/EventScheduled"
      : "https://schema.org/EventPostponed",
    organizer: {
      "@type": "Organization",
      name: "Radioamador.info",
      url: "https://www.radioamador.info",
    },
  };
}

function generateBreadcrumbs(event: EventItem) {
  return [
    { name: "Início", url: "https://www.radioamador.info/" },
    { name: "Eventos", url: "https://www.radioamador.info/events/" },
    { name: event.title, url: `https://www.radioamador.info/events/${encodeURIComponent(event.id)}/` },
  ];
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);
  const events = await getEvents();
  const event = events.find((e) => e.id === decodedId);

  const jsonLd = event ? generateEventJsonLd(event) : null;
  const breadcrumbs = event ? generateBreadcrumbs(event) : null;

  // Don't call notFound() here - let client handle fallback fetch from API
  return (
    <div className="min-h-screen bg-background">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {breadcrumbs && <BreadcrumbJsonLd items={breadcrumbs} />}
      <EventDetailsClient
        event={event}
        eventId={decodedId}
        allEvents={events}
      />
    </div>
  );
}
