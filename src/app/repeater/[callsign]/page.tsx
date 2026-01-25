import { Suspense } from "react";
import { notFound } from "next/navigation";
import RepeaterPageClient from "./RepeaterPageClient";
import { Repeater } from "@/app/columns";
import { BreadcrumbJsonLd } from "@/components/seo";
import { fetchRepeaters } from "@/lib/repeaters";
import { getPrimaryFrequency } from "@/types/repeater-helpers";

type PayloadRepeatersResponse = {
  docs?: Array<Record<string, unknown>>;
};

function resolveApiBaseUrl(): string {
  const envBase =
    process.env.PAYLOAD_API_BASE_URL ?? process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL;
  if (envBase) {
    return envBase.replace(/\/$/, "");
  }
  return "http://localhost:3000";
}

async function fetchAllRepeaters(): Promise<Repeater[]> {
  try {
    return await fetchRepeaters();
  } catch (error) {
    console.error("[RepeaterPage] Error fetching all repeaters:", error);
    return [];
  }
}

function findRepeaterByCallsign(repeaters: Repeater[], callsign: string): Repeater | null {
  return repeaters.find((r) => r.callsign === callsign) ?? null;
}

// Generate static params for all repeaters at build time
export async function generateStaticParams() {
  const baseUrl = resolveApiBaseUrl();
  const params: { callsign: string }[] = [];

  try {
    let page = 1;
    while (true) {
      const searchParams = new URLSearchParams({
        limit: "200",
        page: page.toString(),
      });

      const response = await fetch(`${baseUrl}/api/repeaters?${searchParams.toString()}`);
      if (!response.ok) break;

      const payload = (await response.json()) as PayloadRepeatersResponse & { hasNextPage?: boolean };
      const docs = Array.isArray(payload.docs) ? payload.docs : [];

      for (const doc of docs) {
        if (typeof doc.callsign === "string" && doc.callsign) {
          params.push({ callsign: doc.callsign });
        }
      }

      if (!payload.hasNextPage || docs.length === 0) break;
      page++;
    }
  } catch (error) {
    console.error("[RepeaterPage] Error generating static params:", error);
  }

  return params;
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ callsign: string }> }) {
  const { callsign } = await params;
  const decodedCallsign = decodeURIComponent(callsign);

  try {
    const allRepeaters = await fetchAllRepeaters();
    const repeater = findRepeaterByCallsign(allRepeaters, decodedCallsign);

    if (!repeater) {
      return {
        title: "Repetidor não encontrado",
      };
    }

    const primary = getPrimaryFrequency(repeater);
    const modesStr = repeater.modes?.map(m => m === 'DSTAR' ? 'D-STAR' : m).join('/') || 'FM';
    const freqStr = primary ? `${primary.outputFrequency.toFixed(3)} MHz` : '';
    const toneStr = primary?.tone ? `${primary.tone} Hz` : '';

    const title = `${repeater.callsign} - Repetidor ${modesStr} ${freqStr}`;
    const description = `Informação do repetidor ${repeater.callsign}: frequência ${freqStr}${toneStr ? `, tom ${toneStr}` : ''}, modulação ${modesStr}.${repeater.qthLocator ? ` Localização: ${repeater.qthLocator}.` : ""}`;

    const keywords = [
      repeater.callsign,
      ...(repeater.modes || []),
      repeater.qthLocator,
      "repetidor",
      "radioamador",
      "ham radio",
      "Portugal",
    ].filter(Boolean);

    return {
      title,
      description,
      alternates: {
        canonical: `/repeater/${encodeURIComponent(repeater.callsign)}/`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/repeater/${encodeURIComponent(repeater.callsign)}/`,
        siteName: "Radioamador.info",
        locale: "pt_PT",
        images: [{ url: "/og-default.jpg", width: 1200, height: 630, alt: title }],
      },
      twitter: {
        card: "summary",
        title,
        description,
        images: ["/og-default.png"],
      },
      keywords,
    };
  } catch {
    return {
      title: `${decodedCallsign} - Repetidores`,
      description: `Informação detalhada sobre o repetidor ${decodedCallsign}`,
    };
  }
}

function generateRepeaterJsonLd(repeater: Repeater) {
  const primary = getPrimaryFrequency(repeater);
  const modesStr = repeater.modes?.map(m => m === 'DSTAR' ? 'D-STAR' : m).join('/') || 'FM';

  return {
    "@context": "https://schema.org",
    "@type": "RadioBroadcastService",
    name: repeater.callsign,
    description: `Repetidor ${modesStr} - ${primary ? `${primary.outputFrequency.toFixed(3)} MHz` : ''}`,
    ...(primary && {
      broadcastFrequency: {
        "@type": "BroadcastFrequencySpecification",
        broadcastFrequencyValue: primary.outputFrequency,
        broadcastFrequencyUnit: "MHz",
      },
    }),
    ...(repeater.latitude && repeater.longitude && {
      areaServed: {
        "@type": "Place",
        geo: {
          "@type": "GeoCoordinates",
          latitude: repeater.latitude,
          longitude: repeater.longitude,
        },
        ...(repeater.qthLocator && { name: repeater.qthLocator }),
      },
    }),
    provider: {
      "@type": "Organization",
      name: "Repetidores",
      url: "https://www.radioamador.info",
    },
  };
}

function generateBreadcrumbs(repeater: Repeater) {
  return [
    { name: "Início", url: "https://www.radioamador.info/" },
    { name: "Repetidores", url: "https://www.radioamador.info/repetidores/" },
    { name: repeater.callsign, url: `https://www.radioamador.info/repeater/${encodeURIComponent(repeater.callsign)}/` },
  ];
}

async function RepeaterContent({ callsign }: { callsign: string }) {
  const allRepeaters = await fetchAllRepeaters();
  const repeater = findRepeaterByCallsign(allRepeaters, callsign);

  if (!repeater) {
    notFound();
  }

  const jsonLd = generateRepeaterJsonLd(repeater);
  const breadcrumbs = generateBreadcrumbs(repeater);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BreadcrumbJsonLd items={breadcrumbs} />
      <RepeaterPageClient repeater={repeater} allRepeaters={allRepeaters} />
    </>
  );
}

export default async function RepeaterPage({ params }: { params: Promise<{ callsign: string }> }) {
  const { callsign } = await params;
  const decodedCallsign = decodeURIComponent(callsign);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<RepeaterPageSkeleton />}>
        <RepeaterContent callsign={decodedCallsign} />
      </Suspense>
    </main>
  );
}

function RepeaterPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Back link skeleton */}
      <div className="h-5 w-32 bg-ship-cove-100 dark:bg-ship-cove-900 rounded animate-pulse" />

      {/* Hero skeleton */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-900 dark:to-ship-cove-950 p-8 animate-pulse">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1 space-y-4">
            <div className="h-10 w-48 bg-ship-cove-200 dark:bg-ship-cove-800 rounded" />
            <div className="flex gap-2">
              <div className="h-6 w-16 bg-ship-cove-200 dark:bg-ship-cove-800 rounded-full" />
              <div className="h-6 w-20 bg-ship-cove-200 dark:bg-ship-cove-800 rounded-full" />
              <div className="h-6 w-24 bg-ship-cove-200 dark:bg-ship-cove-800 rounded-full" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-24 bg-ship-cove-200 dark:bg-ship-cove-800 rounded-lg" />
            <div className="h-10 w-28 bg-ship-cove-200 dark:bg-ship-cove-800 rounded-lg" />
          </div>
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-56 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl animate-pulse" />
        <div className="h-56 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl animate-pulse" />
      </div>

      {/* Additional cards skeleton */}
      <div className="h-32 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl animate-pulse" />
      <div className="h-40 bg-ship-cove-100 dark:bg-ship-cove-900 rounded-xl animate-pulse" />
    </div>
  );
}
