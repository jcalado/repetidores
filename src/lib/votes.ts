export type VoteKind = "up" | "down";

export type VoteInput = {
  repeaterId: string;
  vote: VoteKind;
  feedback?: string;
};

export type VoteStats = {
  up: number;
  down: number;
  total: number;
  net: number; // up - down
  ratio: number; // up / total
  windowDays: number;
  category: "ok" | "prob-bad" | "bad" | "unknown";
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

function readLocalVote(repeaterId: string): { vote: VoteKind; feedback?: string } | null {
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
  return { up, down, total, net, ratio, category, windowDays: 60 };
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
  return { up, down, total, net, ratio, windowDays, category };
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
  } catch (e) {
    // Fallback to local in case of network errors
    return statsFromLocal(repeaterId);
  }
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
        }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return normalizeVoteStats(data);
  } catch (e) {
    // Don't lose the user's action: save locally as a fallback
    writeLocalVote(input);
    return statsFromLocal(input.repeaterId);
  }
}
