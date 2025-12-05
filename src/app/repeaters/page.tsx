import { Suspense } from "react";
import RepeaterBrowser from "@/components/RepeaterBrowser";
import RepeaterBrowserClient from "@/components/RepeaterBrowserClient";
import { Repeater } from "../columns";
import ImportantNotice from "../notice";

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
    // Extended fields (optional)
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

  console.log('[RepeatersPage] Starting fetch from baseUrl:', baseUrl);

  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      page: page.toString(),
    });

    const url = `${baseUrl}/api/repeaters?${params.toString()}`;
    console.log(`[RepeatersPage] Fetching page ${page} from:`, url);

    const response = await fetch(url);

    console.log(`[RepeatersPage] Response status:`, response.status);

    if (!response.ok) {
      console.error(`[RepeatersPage] Failed to fetch: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to fetch repeaters: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as PayloadRepeatersResponse;
    console.log(`[RepeatersPage] Payload keys:`, Object.keys(payload), 'docs is array:', Array.isArray(payload.docs), 'docs length:', payload.docs?.length);
    const docs = Array.isArray(payload.docs) ? payload.docs : [];
    repeaters.push(...docs.map(normalizeRepeater));

    console.log(`[RepeatersPage] Fetched ${docs.length} repeaters from page ${page}, total so far: ${repeaters.length}`);

    const totalPages = typeof payload.totalPages === "number" ? payload.totalPages : undefined;
    const hasNext = Boolean(payload.hasNextPage);
    const reachedEnd = docs.length === 0 || (!hasNext && (!totalPages || page >= totalPages));

    if (reachedEnd) {
      console.log(`[RepeatersPage] Reached end. Total repeaters fetched: ${repeaters.length}`);
      break;
    }

    page += 1;
    if (totalPages && page > totalPages) {
      break;
    }
  }

  return repeaters.sort((a, b) => a.callsign.localeCompare(b.callsign));
}

async function RepeatersContent() {
  const data = await fetchRepeaters();
  return <RepeaterBrowserClient data={data} />;
}

export default function RepeatersPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
      <Suspense fallback={<RepeaterBrowser data={[]} isLoading />}>
        <RepeatersContent />
      </Suspense>
      <ImportantNotice />
    </main>
  );
}
