// Client-side vote helpers with a simple feature flag.
// Mode is controlled by NEXT_PUBLIC_VOTES_MODE: 'local' | 'live'

export type VoteKind = "up" | "down";

export type VoteInput = {
  repeaterId: string;
  vote: VoteKind;
  feedback?: string;
  captchaToken?: string;
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

const MODE = (process.env.NEXT_PUBLIC_VOTES_MODE || "local").toLowerCase();
const CMS_BASE_URL = process.env.NEXT_PUBLIC_CMS_BASE_URL || "";

export function isLiveVotes() {
  return MODE === "live" && !!CMS_BASE_URL;
}

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

export async function getVoteStats(repeaterId: string): Promise<VoteStats> {
  if (!isLiveVotes()) {
    return statsFromLocal(repeaterId);
  }
  try {
    const res = await fetch(
      `${CMS_BASE_URL}/api/repeaters/${encodeURIComponent(repeaterId)}/votes/stats`,
      { method: "GET", headers: { "Accept": "application/json" }, mode: "cors", cache: "no-store" }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Expect the CMS to return the VoteStats shape. Fallback minimal mapping if needed.
    const stats: VoteStats = {
      up: Number(data?.up ?? 0),
      down: Number(data?.down ?? 0),
      total: Number(data?.total ?? (Number(data?.up ?? 0) + Number(data?.down ?? 0))),
      net: Number(data?.net ?? ((Number(data?.up ?? 0)) - (Number(data?.down ?? 0)))),
      ratio: Number(data?.ratio ?? 0),
      windowDays: Number(data?.windowDays ?? 60),
      category: (data?.category as VoteStats["category"]) ?? "unknown",
    };
    return stats;
  } catch (e) {
    // Fallback to local in case of network errors
    return statsFromLocal(repeaterId);
  }
}

export async function postVote(input: VoteInput): Promise<VoteStats> {
  if (!isLiveVotes()) {
    writeLocalVote(input);
    return statsFromLocal(input.repeaterId);
  }
  try {
    const res = await fetch(
      `${CMS_BASE_URL}/api/repeaters/${encodeURIComponent(input.repeaterId)}/votes`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        mode: "cors",
        body: JSON.stringify({ vote: input.vote, feedback: input.feedback, captchaToken: input.captchaToken }),
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    // Assume API returns updated stats
    return {
      up: Number(data?.up ?? 0),
      down: Number(data?.down ?? 0),
      total: Number(data?.total ?? (Number(data?.up ?? 0) + Number(data?.down ?? 0))),
      net: Number(data?.net ?? ((Number(data?.up ?? 0)) - (Number(data?.down ?? 0)))),
      ratio: Number(data?.ratio ?? 0),
      windowDays: Number(data?.windowDays ?? 60),
      category: (data?.category as VoteStats["category"]) ?? "unknown",
    };
  } catch (e) {
    // Don't lose the user's action: save locally as a fallback
    writeLocalVote(input);
    return statsFromLocal(input.repeaterId);
  }
}
