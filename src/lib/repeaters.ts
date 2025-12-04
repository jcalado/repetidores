import type { Repeater } from '@/app/columns';

const API_BASE_URL = (() => {
  const source =
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    'http://localhost:3000';
  return source.replace(/\/$/, '');
})();

const PAGE_SIZE = 200;

type PayloadRepeatersResponse = {
  docs?: Array<Record<string, unknown>>;
  totalPages?: number;
  hasNextPage?: boolean;
};

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

export async function fetchRepeaters(): Promise<Repeater[]> {
  const repeaters: Repeater[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      page: page.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/api/repeaters?${params}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repeaters: HTTP ${response.status}`);
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
