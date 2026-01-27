import type { Repeater } from '@/app/columns';
import type {
  FrequencyPair,
  RepeaterMode,
  DMRConfig,
  DSTARConfig,
  C4FMConfig,
  TETRAConfig,
  EcholinkConfig,
  Sysop,
  PrivateUrl,
  NodeType,
  FMBandwidth,
} from '@/types/repeater';

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

// ============================================================================
// Type conversion helpers
// ============================================================================

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

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((v): v is string => typeof v === 'string');
  }
  return [];
}

// ============================================================================
// Association normalization
// ============================================================================

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

// ============================================================================
// V2 Field Normalizers
// ============================================================================

function normalizeFrequencies(doc: Record<string, unknown>): FrequencyPair[] {
  // Check for V2 frequencies array
  if (Array.isArray(doc.frequencies) && doc.frequencies.length > 0) {
    return doc.frequencies.map((f: unknown) => {
      const freq = f as Record<string, unknown>;
      return {
        outputFrequency: toNumber(freq.outputFrequency),
        inputFrequency: toNumber(freq.inputFrequency),
        tone: toOptionalNumber(freq.tone),
        isPrimary: toBoolean(freq.isPrimary),
      };
    });
  }

  // Fallback to legacy flat fields
  const outputFrequency = toNumber(doc.outputFrequency);
  const inputFrequency = toNumber(doc.inputFrequency);
  if (outputFrequency === 0 && inputFrequency === 0) {
    return [];
  }

  return [{
    outputFrequency,
    inputFrequency,
    tone: toOptionalNumber(doc.tone),
    isPrimary: true,
  }];
}

function normalizeModes(doc: Record<string, unknown>): RepeaterMode[] {
  // Check for V2 modes array
  if (Array.isArray(doc.modes) && doc.modes.length > 0) {
    const validModes: RepeaterMode[] = ['FM', 'DMR', 'C4FM', 'DSTAR', 'Digipeater', 'TETRA'];
    return doc.modes.filter((m): m is RepeaterMode =>
      typeof m === 'string' && validModes.includes(m as RepeaterMode)
    );
  }

  // Fallback to legacy modulation string + boolean flags
  const modes: RepeaterMode[] = [];
  const modulation = toStringOrEmpty(doc.modulation).toUpperCase();
  const dmr = toBoolean(doc.dmr);
  const dstar = toBoolean(doc.dstar);

  // Check explicit boolean flags first (most reliable)
  if (dmr) modes.push('DMR');
  if (dstar) modes.push('DSTAR');

  // Parse modulation string
  if (modulation.includes('FM') && !modes.includes('DMR') && !modes.includes('DSTAR')) {
    modes.push('FM');
  }
  if (modulation.includes('C4FM')) modes.push('C4FM');
  if (modulation.includes('TETRA')) modes.push('TETRA');
  if (modulation === 'DIGIPEATER') modes.push('Digipeater');

  // Handle combined values
  if (modulation === 'DMR' && !modes.includes('DMR')) modes.push('DMR');
  if (modulation === 'D-STAR' && !modes.includes('DSTAR')) modes.push('DSTAR');
  if ((modulation === 'DMR / D-STAR' || modulation === 'DMR/D-STAR')) {
    if (!modes.includes('DMR')) modes.push('DMR');
    if (!modes.includes('DSTAR')) modes.push('DSTAR');
  }

  // Default to FM if no modes detected
  if (modes.length === 0) {
    modes.push('FM');
  }

  return modes;
}

function normalizeNodeType(doc: Record<string, unknown>, frequencies: FrequencyPair[]): NodeType {
  // Check for explicit V2 nodeType
  if (doc.nodeType === 'simplex' || doc.nodeType === 'repeater') {
    return doc.nodeType;
  }

  // Auto-detect from frequencies
  if (frequencies.length > 0) {
    const primary = frequencies.find(f => f.isPrimary) || frequencies[0];
    if (Math.abs(primary.outputFrequency - primary.inputFrequency) < 0.0001) {
      return 'simplex';
    }
  }

  return 'repeater';
}

function normalizeDMRConfig(doc: Record<string, unknown>): DMRConfig | undefined {
  // Check for V2 dmrConfig group
  if (doc.dmrConfig && typeof doc.dmrConfig === 'object') {
    const cfg = doc.dmrConfig as Record<string, unknown>;
    const colorCode = toOptionalNumber(cfg.colorCode);
    if (colorCode === undefined) return undefined;

    return {
      colorCode,
      dmrId: toOptionalNumber(cfg.dmrId),
      network: toOptionalString(cfg.network),
      ts1StaticTalkgroups: normalizeTalkgroups(cfg.ts1StaticTalkgroups),
      ts2StaticTalkgroups: normalizeTalkgroups(cfg.ts2StaticTalkgroups),
      ts2DynamicAllowed: cfg.ts2DynamicAllowed !== false,
    };
  }

  // Fallback to legacy flat fields
  const colorCode = toOptionalNumber(doc.dmrColorCode);
  const talkgroupsStr = toOptionalString(doc.dmrTalkgroups);

  if (colorCode === undefined && !talkgroupsStr) return undefined;

  return {
    colorCode: colorCode || 1,
    ts2StaticTalkgroups: parseLegacyTalkgroups(talkgroupsStr),
    ts2DynamicAllowed: true,
  };
}

function normalizeTalkgroups(value: unknown): { tgId: number; name?: string }[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value.map((tg: unknown) => {
    const t = tg as Record<string, unknown>;
    return {
      tgId: toNumber(t.tgId),
      name: toOptionalString(t.name),
    };
  }).filter(tg => tg.tgId > 0);
}

function parseLegacyTalkgroups(str: string | undefined): { tgId: number; name?: string }[] | undefined {
  if (!str?.trim()) return undefined;

  const result = str
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const slashIndex = item.indexOf('/');
      if (slashIndex > 0) {
        const tgId = parseInt(item.substring(0, slashIndex).trim(), 10);
        const name = item.substring(slashIndex + 1).trim();
        return Number.isFinite(tgId) ? { tgId, name: name || undefined } : null;
      }
      const tgId = parseInt(item, 10);
      return Number.isFinite(tgId) ? { tgId } : null;
    })
    .filter((tg): tg is { tgId: number; name?: string } => tg !== null);

  return result.length > 0 ? result : undefined;
}

function normalizeDSTARConfig(doc: Record<string, unknown>): DSTARConfig | undefined {
  // Check for V2 dstarConfig group
  if (doc.dstarConfig && typeof doc.dstarConfig === 'object') {
    const cfg = doc.dstarConfig as Record<string, unknown>;
    const reflector = toOptionalString(cfg.reflector);
    const module = toOptionalString(cfg.module) as DSTARConfig['module'];
    const gateway = toOptionalString(cfg.gateway);

    if (!reflector && !module && !gateway) return undefined;

    return { reflector, module, gateway };
  }

  // Fallback to legacy flat fields
  const reflector = toOptionalString(doc.dstarReflector);
  const module = toOptionalString(doc.dstarModule) as DSTARConfig['module'];

  if (!reflector && !module) return undefined;

  return { reflector, module };
}

function normalizeC4FMConfig(doc: Record<string, unknown>): C4FMConfig | undefined {
  if (!doc.c4fmConfig || typeof doc.c4fmConfig !== 'object') return undefined;

  const cfg = doc.c4fmConfig as Record<string, unknown>;
  const node = toOptionalString(cfg.node);
  const room = toOptionalString(cfg.room);
  const network = toOptionalString(cfg.network) as C4FMConfig['network'];

  if (!node && !room && !network) return undefined;

  return { node, room, network };
}

function normalizeTETRAConfig(doc: Record<string, unknown>): TETRAConfig | undefined {
  if (!doc.tetraConfig || typeof doc.tetraConfig !== 'object') return undefined;

  const cfg = doc.tetraConfig as Record<string, unknown>;
  const talkgroups = Array.isArray(cfg.talkgroups)
    ? cfg.talkgroups.map((tg: unknown) => {
        const t = tg as Record<string, unknown>;
        return toNumber(t.id);
      }).filter(id => id > 0)
    : [];
  const network = toOptionalString(cfg.network);

  if (talkgroups.length === 0 && !network) return undefined;

  return { talkgroups, network };
}

function normalizeEcholinkConfig(doc: Record<string, unknown>): EcholinkConfig | undefined {
  // Check for V2 echolinkConfig group
  if (doc.echolinkConfig && typeof doc.echolinkConfig === 'object') {
    const cfg = doc.echolinkConfig as Record<string, unknown>;
    if (!toBoolean(cfg.enabled)) return undefined;

    return {
      enabled: true,
      nodeNumber: toOptionalNumber(cfg.nodeNumber),
      conference: toOptionalString(cfg.conference),
    };
  }

  // Fallback to legacy echolinkNode field
  const nodeNumber = toOptionalNumber(doc.echolinkNode);
  if (!nodeNumber) return undefined;

  return {
    enabled: true,
    nodeNumber,
  };
}

function normalizeSysops(doc: Record<string, unknown>): Sysop[] | undefined {
  if (!Array.isArray(doc.sysops) || doc.sysops.length === 0) return undefined;

  return doc.sysops.map((s: unknown) => {
    const sysop = s as Record<string, unknown>;
    return {
      callsign: toStringOrEmpty(sysop.callsign),
      name: toOptionalString(sysop.name),
      role: toOptionalString(sysop.role) as Sysop['role'],
    };
  }).filter(s => s.callsign);
}

function normalizePrivateUrls(doc: Record<string, unknown>): PrivateUrl[] | undefined {
  if (!Array.isArray(doc.privateUrls) || doc.privateUrls.length === 0) return undefined;

  return doc.privateUrls.map((p: unknown) => {
    const priv = p as Record<string, unknown>;
    return {
      type: toStringOrEmpty(priv.type),
      url: toStringOrEmpty(priv.url),
      description: toOptionalString(priv.description),
    };
  }).filter(p => p.type && p.url);
}

function isCrossband(frequencies: FrequencyPair[]): boolean {
  if (frequencies.length === 0) return false;

  const primary = frequencies.find(f => f.isPrimary) || frequencies[0];
  const inputBand = getBandFromFrequency(primary.inputFrequency);
  const outputBand = getBandFromFrequency(primary.outputFrequency);

  return inputBand !== outputBand;
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 50 && mhz <= 54) return '6m';
  if (mhz >= 144 && mhz <= 148) return '2m';
  if (mhz >= 430 && mhz <= 450) return '70cm';
  if (mhz >= 1240 && mhz <= 1300) return '23cm';
  if (mhz >= 2300 && mhz <= 2450) return '13cm';
  return 'other';
}

// ============================================================================
// Main Normalizer (outputs RepeaterV2 format)
// ============================================================================

function normalizeRepeater(doc: Record<string, unknown>): Repeater {
  const frequencies = normalizeFrequencies(doc);
  const modes = normalizeModes(doc);
  const nodeType = normalizeNodeType(doc, frequencies);

  return {
    id: doc.id as string | number | undefined,
    callsign: toStringOrEmpty(doc.callsign),
    nodeType,
    frequencies,
    modes,
    fmBandwidth: toOptionalString(doc.fmBandwidth) as FMBandwidth | undefined,
    latitude: toNumber(doc.latitude),
    longitude: toNumber(doc.longitude),
    qthLocator: toOptionalString(doc.qth_locator),
    address: toOptionalString(doc.address),
    power: toOptionalNumber(doc.power),
    antennaHeight: toOptionalNumber(doc.antennaHeight),
    coverage: toOptionalString(doc.coverage) as Repeater['coverage'],
    isCrossband: isCrossband(frequencies) || undefined,
    dmr: normalizeDMRConfig(doc),
    dstar: normalizeDSTARConfig(doc),
    c4fm: normalizeC4FMConfig(doc),
    tetra: normalizeTETRAConfig(doc),
    echolink: normalizeEcholinkConfig(doc),
    allstarNode: toOptionalNumber(doc.allstarNode),
    association: normalizeAssociation(doc.association),
    owner: toOptionalString(doc.owner),
    sysops: normalizeSysops(doc),
    authorizedUntil: toOptionalString(doc.authorizedUntil),
    status: toOptionalString(doc.status) as Repeater['status'],
    operatingHours: toOptionalString(doc.operatingHours),
    lastVerified: toOptionalString(doc.lastVerified),
    notes: toOptionalString(doc.notes),
    website: toOptionalString(doc.website),
    privateUrls: normalizePrivateUrls(doc),
  };
}

// ============================================================================
// API Fetcher
// ============================================================================

export async function fetchRepeaters(): Promise<Repeater[]> {
  const repeaters: Repeater[] = [];
  let page = 1;

  while (true) {
    const params = new URLSearchParams({
      limit: PAGE_SIZE.toString(),
      page: page.toString(),
      depth: "1", // Populate association relationship
    });

    // Use force-cache at build time (server) to allow static generation
    // Use no-store at runtime (client) to fetch fresh data
    const isServer = typeof window === 'undefined';
    const response = await fetch(`${API_BASE_URL}/api/repeaters?${params}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: isServer ? 'force-cache' : 'no-store',
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
