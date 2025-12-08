import { Suspense } from "react";
import { notFound } from "next/navigation";
import RepeaterPageClient from "./RepeaterPageClient";
import { Repeater } from "@/app/columns";

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

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toStringOrEmpty(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return Boolean(value);
}

function toOptionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function toOptionalString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

function normalizeAssociation(
  assocData: unknown
): Repeater["association"] | undefined {
  if (!assocData || typeof assocData !== "object") return undefined;
  const assoc = assocData as Record<string, unknown>;
  if (!assoc.id || !assoc.abbreviation) return undefined;
  return {
    id: toNumber(assoc.id),
    name: toStringOrEmpty(assoc.name),
    abbreviation: toStringOrEmpty(assoc.abbreviation),
    slug: toStringOrEmpty(assoc.slug),
  };
}

function normalizeRepeater(doc: Record<string, unknown>): Repeater {
  return {
    callsign: toStringOrEmpty(doc.callsign),
    outputFrequency: toNumber(doc.outputFrequency),
    inputFrequency: toNumber(doc.inputFrequency),
    tone: toNumber(doc.tone),
    modulation: toStringOrEmpty(doc.modulation),
    latitude: toNumber(doc.latitude),
    longitude: toNumber(doc.longitude),
    qth_locator: toStringOrEmpty(doc.qth_locator),
    owner: toStringOrEmpty(doc.owner),
    dmr: toBoolean(doc.dmr),
    dstar: toBoolean(doc.dstar),
    association: normalizeAssociation(doc.association),
    status: toOptionalString(doc.status) as Repeater['status'],
    power: toOptionalNumber(doc.power),
    antennaHeight: toOptionalNumber(doc.antennaHeight),
    coverage: toOptionalString(doc.coverage) as Repeater['coverage'],
    dmrColorCode: toOptionalNumber(doc.dmrColorCode),
    dmrTalkgroups: toOptionalString(doc.dmrTalkgroups),
    dstarReflector: toOptionalString(doc.dstarReflector),
    dstarModule: toOptionalString(doc.dstarModule) as Repeater['dstarModule'],
    echolinkNode: toOptionalNumber(doc.echolinkNode),
    allstarNode: toOptionalNumber(doc.allstarNode),
    operatingHours: toOptionalString(doc.operatingHours),
    lastVerified: toOptionalString(doc.lastVerified),
    notes: toOptionalString(doc.notes),
    website: toOptionalString(doc.website),
  };
}

async function fetchAllRepeaters(): Promise<Repeater[]> {
  const baseUrl = resolveApiBaseUrl();
  const repeaters: Repeater[] = [];

  try {
    let page = 1;
    while (true) {
      const params = new URLSearchParams({
        limit: "200",
        page: page.toString(),
        depth: "1", // Populate association relationship
      });

      const response = await fetch(`${baseUrl}/api/repeaters?${params.toString()}`, {
        next: { revalidate: 3600 },
      });

      if (!response.ok) break;

      const payload = (await response.json()) as PayloadRepeatersResponse & { hasNextPage?: boolean };
      const docs = Array.isArray(payload.docs) ? payload.docs : [];
      repeaters.push(...docs.map(normalizeRepeater));

      if (!payload.hasNextPage || docs.length === 0) break;
      page++;
    }
  } catch (error) {
    console.error("[RepeaterPage] Error fetching all repeaters:", error);
  }

  return repeaters;
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

    const title = `${repeater.callsign} - Repetidor ${repeater.modulation} ${repeater.outputFrequency.toFixed(3)} MHz`;
    const description = `Informação do repetidor ${repeater.callsign}: frequência ${repeater.outputFrequency.toFixed(3)} MHz, tom ${repeater.tone} Hz, modulação ${repeater.modulation}.${repeater.qth_locator ? ` Localização: ${repeater.qth_locator}.` : ""}`;

    const keywords = [
      repeater.callsign,
      repeater.modulation,
      repeater.qth_locator,
      "repetidor",
      "radioamador",
      "ham radio",
      "Portugal",
    ].filter(Boolean);

    return {
      title,
      description,
      alternates: {
        canonical: `/repeater/${encodeURIComponent(repeater.callsign)}`,
      },
      openGraph: {
        title,
        description,
        type: "website",
        url: `/repeater/${encodeURIComponent(repeater.callsign)}`,
        siteName: "Repetidores",
        locale: "pt_PT",
      },
      twitter: {
        card: "summary",
        title,
        description,
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
  return {
    "@context": "https://schema.org",
    "@type": "RadioBroadcastService",
    name: repeater.callsign,
    description: `Repetidor ${repeater.modulation} - ${repeater.outputFrequency.toFixed(3)} MHz`,
    broadcastFrequency: {
      "@type": "BroadcastFrequencySpecification",
      broadcastFrequencyValue: repeater.outputFrequency,
      broadcastFrequencyUnit: "MHz",
    },
    ...(repeater.latitude && repeater.longitude && {
      areaServed: {
        "@type": "Place",
        geo: {
          "@type": "GeoCoordinates",
          latitude: repeater.latitude,
          longitude: repeater.longitude,
        },
        ...(repeater.qth_locator && { name: repeater.qth_locator }),
      },
    }),
    provider: {
      "@type": "Organization",
      name: "Repetidores",
      url: "https://www.radioamador.info",
    },
  };
}

async function RepeaterContent({ callsign }: { callsign: string }) {
  const allRepeaters = await fetchAllRepeaters();
  const repeater = findRepeaterByCallsign(allRepeaters, callsign);

  if (!repeater) {
    notFound();
  }

  const jsonLd = generateRepeaterJsonLd(repeater);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <RepeaterPageClient repeater={repeater} allRepeaters={allRepeaters} />
    </>
  );
}

export default async function RepeaterPage({ params }: { params: Promise<{ callsign: string }> }) {
  const { callsign } = await params;
  const decodedCallsign = decodeURIComponent(callsign);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<RepeaterPageSkeleton />}>
        <RepeaterContent callsign={decodedCallsign} />
      </Suspense>
    </main>
  );
}

function RepeaterPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="h-6 w-32 bg-muted rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 bg-muted rounded-lg" />
        ))}
      </div>
    </div>
  );
}
