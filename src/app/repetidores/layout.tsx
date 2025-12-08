import { Suspense } from "react";
import { Repeater } from "../columns";
import RepetidoresProvider from "./RepeatersProvider";

type PayloadRepeatersResponse = {
  docs?: Array<Record<string, unknown>>;
  totalPages?: number;
  hasNextPage?: boolean;
};

const PAGE_SIZE = 200;

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
    if (Number.isFinite(parsed)) {
      return parsed;
    }
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

async function fetchRepeaters(): Promise<Repeater[]> {
  const baseUrl = resolveApiBaseUrl();
  const repeaters: Repeater[] = [];

  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      page: page.toString(),
      depth: "1", // Populate association relationship
    });

    const url = `${baseUrl}/api/repeaters?${params.toString()}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[RepeatersLayout] Failed to fetch: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch repeaters: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as PayloadRepeatersResponse;
    const docs = Array.isArray(payload.docs) ? payload.docs : [];
    repeaters.push(...docs.map(normalizeRepeater));

    const totalPages = typeof payload.totalPages === "number" ? payload.totalPages : undefined;
    const hasNext = Boolean(payload.hasNextPage);
    const reachedEnd = docs.length === 0 || (!hasNext && (!totalPages || page >= totalPages));

    if (reachedEnd) {
      break;
    }

    page += 1;
    if (totalPages && page > totalPages) {
      break;
    }
  }

  return repeaters.sort((a, b) => a.callsign.localeCompare(b.callsign));
}

function LoadingSkeleton() {
  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex gap-2 mb-4">
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
          <div className="h-10 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function RepetidoresContent({ children }: { children: React.ReactNode }) {
  const data = await fetchRepeaters();
  return <RepetidoresProvider initialData={data}>{children}</RepetidoresProvider>;
}

export default function RepetidoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main>
      <Suspense fallback={<LoadingSkeleton />}>
        <RepetidoresContent>{children}</RepetidoresContent>
      </Suspense>
    </main>
  );
}
