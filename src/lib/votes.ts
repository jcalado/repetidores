export type VoteKind = "up" | "down";

export type VoteInput = {
  repeaterId: string;
  vote: VoteKind;
  feedback?: string;
  reporterCallsign?: string;
};

export type VoteStats = {
  up: number;
  down: number;
  total: number;
  net: number; // up - down
  ratio: number; // up / total
  windowDays: number;
  category: "ok" | "prob-bad" | "bad" | "unknown";
  lastPositiveVote: string | null; // ISO timestamp of most recent positive vote
};

export type VoteStatsMap = Record<string, VoteStats>;

export type FeedbackEntry = {
  id: string;
  vote: VoteKind;
  feedback: string | null;
  reporterCallsign: string | null;
  createdAt: string; // ISO timestamp
};

export type FeedbackListResponse = {
  docs: FeedbackEntry[];
  totalDocs: number;
  totalPages: number;
  page: number;
  hasNextPage: boolean;
};

const API_BASE_URL = (() => {
  const source =
    process.env.NEXT_PUBLIC_VOTES_API_BASE_URL ||
    process.env.NEXT_PUBLIC_PAYLOAD_API_BASE_URL ||
    process.env.PAYLOAD_API_BASE_URL ||
    "http://localhost:3000";
  return source.replace(/\/$/, "");
})();

function localKey(repeaterId: string) {
  return `repeater-vote:${repeaterId}`;
}

function readLocalVote(repeaterId: string): { vote: VoteKind; feedback?: string; ts?: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(localKey(repeaterId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalVote(input: VoteInput) {
  if (typeof window === "undefined") return;
  try {
    const payload = { vote: input.vote, feedback: input.feedback, ts: Date.now() };
    localStorage.setItem(localKey(input.repeaterId), JSON.stringify(payload));
  } catch {}
}

function statsFromLocal(repeaterId: string): VoteStats {
  const v = readLocalVote(repeaterId);
  const up = v?.vote === "up" ? 1 : 0;
  const down = v?.vote === "down" ? 1 : 0;
  const total = up + down;
  const net = up - down;
  const ratio = total > 0 ? up / total : 0;
  let category: VoteStats["category"] = "unknown";
  if (total === 0) category = "unknown";
  else if (up === 1) category = "ok";
  else if (down === 1) category = "prob-bad";
  // For local votes, use the stored timestamp if it was an upvote
  const lastPositiveVote = v?.vote === "up" && v?.ts ? new Date(v.ts).toISOString() : null;
  return { up, down, total, net, ratio, category, windowDays: 60, lastPositiveVote };
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function toCategory(value: unknown): VoteStats["category"] {
  if (value === "ok" || value === "prob-bad" || value === "bad" || value === "unknown") {
    return value;
  }
  return "unknown";
}

function normalizeVoteStats(data: unknown): VoteStats {
  const payload = (data ?? {}) as Record<string, unknown>;
  const up = toNumber(payload.up ?? payload.votesUp);
  const down = toNumber(payload.down ?? payload.votesDown);
  const totalRaw = toNumber(payload.total);
  const total = totalRaw > 0 ? totalRaw : up + down;
  const netRaw = toNumber(payload.net);
  const net = netRaw !== 0 ? netRaw : up - down;
  const ratioRaw = toNumber(payload.ratio);
  const ratio = ratioRaw > 0 ? ratioRaw : total > 0 ? up / total : 0;
  const windowDays = toNumber(payload.windowDays) || 60;
  const category = toCategory(payload.category);
  const lastPositiveVote = typeof payload.lastPositiveVote === "string" ? payload.lastPositiveVote : null;
  return { up, down, total, net, ratio, windowDays, category, lastPositiveVote };
}

export async function getVoteStats(repeaterId: string): Promise<VoteStats> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/repeaters/stats/${encodeURIComponent(repeaterId)}`,
      { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return normalizeVoteStats(data);
  } catch {
    // Fallback to local in case of network errors
    return statsFromLocal(repeaterId);
  }
}

// Cache for bulk vote stats (shared across components)
let cachedVoteStats: VoteStatsMap | null = null;
let voteStatsCacheTimestamp = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Bulk vote stats for every repeater that has feedback, keyed by callsign.
 * Repeaters with no feedback are ABSENT from the map: callers should treat a
 * missing entry as "unknown" rather than expecting a zero-filled record.
 */
export async function getAllVoteStats(): Promise<VoteStatsMap> {
  const now = Date.now();
  if (cachedVoteStats && now - voteStatsCacheTimestamp < CACHE_TTL_MS) {
    return cachedVoteStats;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/vote-stats`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    const map: VoteStatsMap = {};
    for (const [callsign, stats] of Object.entries(data ?? {})) {
      map[callsign] = normalizeVoteStats(stats);
    }
    cachedVoteStats = map;
    voteStatsCacheTimestamp = now;
    return map;
  } catch {
    return cachedVoteStats ?? {};
  }
}

/** Non-async peek at the bulk cache; null when it has never been fetched. */
export function peekAllVoteStats(): VoteStatsMap | null {
  return cachedVoteStats;
}

/**
 * Drops the bulk cache so the next getAllVoteStats() goes back to the network.
 * A vote the server accepted changes the aggregate that /api/vote-stats returns,
 * and the merged status cell reads nothing but that map: without this the cell
 * would keep showing the pre-vote category for up to CACHE_TTL_MS.
 */
export function invalidateVoteStats(): void {
  cachedVoteStats = null;
  voteStatsCacheTimestamp = 0;
}

export async function postVote(input: VoteInput): Promise<VoteStats> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/repeaters/vote`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          repeaterId: input.repeaterId,
          vote: input.vote,
          feedback: input.feedback,
          reporterCallsign: input.reporterCallsign,
        }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // The vote landed, so every cached aggregate that counts it is now stale.
    invalidateVoteStats();
    return normalizeVoteStats(data);
  } catch {
    // Don't lose the user's action: save locally as a fallback.
    // No invalidation here on purpose: the vote never reached the server, so a
    // refetch would return the very same map, and while the request is failing
    // getAllVoteStats() falls back to the cache it still holds - dropping it
    // would blank every repeater's status instead of leaving it as it was.
    writeLocalVote(input);
    return statsFromLocal(input.repeaterId);
  }
}

export async function getFeedbackList(
  repeaterId: string,
  options?: { limit?: number; page?: number }
): Promise<FeedbackListResponse> {
  const { limit = 20, page = 1 } = options ?? {};
  try {
    const url = new URL(
      `${API_BASE_URL}/api/repeaters/feedback/${encodeURIComponent(repeaterId)}`
    );
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("page", String(page));

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch {
    // Return empty list on error
    return {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
    };
  }
}
