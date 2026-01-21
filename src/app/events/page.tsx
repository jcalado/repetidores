import HamRadioEventsCountdown from '@/components/HamRadioEventsCountdown'
import type { EventItem } from '@/components/HamRadioEventsCountdown'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Eventos de Radioamadorismo",
  description: "Calendário de eventos, contests e nets de radioamadorismo em Portugal e internacional.",
  keywords: ["eventos", "contests", "nets", "radioamador", "ham radio", "Portugal", "calendário"],
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "Eventos de Radioamadorismo",
    description: "Calendário de eventos, contests e nets de radioamadorismo em Portugal e internacional.",
    type: "website",
    url: "/events",
    siteName: "Radioamador.info",
    locale: "pt_PT",
    images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: "Eventos de Radioamadorismo" }],
  },
  twitter: {
    card: "summary",
    title: "Eventos de Radioamadorismo",
    description: "Calendário de eventos, contests e nets de radioamadorismo em Portugal e internacional.",
    images: ["/og-default.png"],
  },
}

async function getEvents(): Promise<EventItem[]> {
  const apiBaseUrl = (
    process.env.PAYLOAD_API_BASE_URL ??
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ??
    'http://localhost:3000'
  ).replace(/\/$/, '');

  // Use the custom /api/events/list endpoint which expands recurring events
  const params = new URLSearchParams({
    limit: '500', // Higher limit to account for expanded recurring events
    sort: 'startAsc',
  });

  const url = `${apiBaseUrl}/api/events/list?${params.toString()}`;
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
