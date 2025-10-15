"use client";

import { Repeater } from "@/app/columns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getVoteStats, postVote, type VoteStats } from "@/lib/votes";
import { MessageSquare, ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

function fmtFreq(n?: number) {
  return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(6)} MHz` : "–";
}

function duplex(rx?: number, tx?: number) {
  if (typeof rx !== "number" || typeof tx !== "number") return { sign: "", offset: "–" };
  const sign = tx > rx ? "+" : tx < rx ? "-" : "";
  const off = Math.abs(tx - rx).toFixed(6) + " MHz";
  return { sign, offset: off };
}

export default function RepeaterDetails({ r }: { r: Repeater }) {
  const band = getBandFromFrequency(r.outputFrequency);
  const { sign, offset } = duplex(r.outputFrequency, r.inputFrequency);

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;
  const t = useTranslations("repeater");
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{r.callsign}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">{band}</span>
            {r.modulation && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                {r.modulation.toUpperCase()}
              </span>
            )}
            {r.qth_locator && (
              <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
                QTH {r.qth_locator}
              </span>
            )}
          </div>
        </div>
        <Button asChild>
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
            {t("maps")}
          </a>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard label={t("output")} value={fmtFreq(r.outputFrequency)} />
        <InfoCard label={t("input")} value={fmtFreq(r.inputFrequency)} />
        <InfoCard label={t("offset")} value={`${sign}${sign ? " " : ""}${offset}`} />
        <InfoCard label={t("tone")} value={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : "None"} />
        <InfoCard label={t("owner")} value={r.owner || "–"} className="sm:col-span-2" />
        <InfoCard label={t("coordinates")} value={`${r.latitude?.toFixed(5)}, ${r.longitude?.toFixed(5)}`} className="sm:col-span-2" />
      </div>

      <VoteSection repeaterId={r.callsign} />
    </div>
  );
}

function InfoCard({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border p-3", className)}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

// --- Voting (client-only placeholder) ---
type LocalVote = { vote: "up" | "down"; feedback?: string; ts: number };

function getVoteKey(repeaterId: string) {
  return `repeater-vote:${repeaterId}`;
}

function loadLocalVote(repeaterId: string): LocalVote | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getVoteKey(repeaterId));
    return raw ? (JSON.parse(raw) as LocalVote) : null;
  } catch {
    return null;
  }
}

function saveLocalVote(repeaterId: string, v: LocalVote) {
  try {
    localStorage.setItem(getVoteKey(repeaterId), JSON.stringify(v));
  } catch { }
}

function StatusPill({ status }: { status: "ok" | "prob-bad" | "bad" | "unknown" }) {
  const map: Record<typeof status, { label: string; className: string }> = {
    ok: { label: "Working OK", className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300" },
    "prob-bad": { label: "Probably Not Working", className: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300" },
    bad: { label: "Not Working", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300" },
    unknown: { label: "Status Unknown", className: "bg-muted text-muted-foreground" },
  } as const;
  const cfg = map[status];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs", cfg.className)}>{cfg.label}</span>;
}

function VoteSection({ repeaterId }: { repeaterId: string }) {
  const [vote, setVote] = React.useState<LocalVote | null>(null);
  const [open, setOpen] = React.useState(false);
  const [feedback, setFeedback] = React.useState("");
  const [stats, setStats] = React.useState<VoteStats | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    setVote(loadLocalVote(repeaterId));
    let alive = true;
    getVoteStats(repeaterId).then((s) => {
      if (alive) setStats(s);
    });
    return () => {
      alive = false;
    };
  }, [repeaterId]);

  const status = stats?.category ?? "unknown";

  function handleVote(type: "up" | "down") {
    const v: LocalVote = { vote: type, ts: Date.now(), feedback: vote?.feedback };
    setVote(v);
    saveLocalVote(repeaterId, v);
    setSubmitting(true);
    postVote({ repeaterId, vote: type, feedback: v.feedback })
      .then((s) => setStats(s))
      .finally(() => setSubmitting(false));
  }

  function handleSubmitFeedback() {
    const v: LocalVote = { vote: vote?.vote ?? "up", ts: Date.now(), feedback: feedback.trim() || undefined };
    setVote(v);
    saveLocalVote(repeaterId, v);
    setSubmitting(true);
    postVote({ repeaterId, vote: v.vote, feedback: v.feedback })
      .then((s) => setStats(s))
      .finally(() => setSubmitting(false));
    setOpen(false);
    setFeedback("");
  }

  return (
    <div className="rounded-xl border p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Community status</span>
          <StatusPill status={status} />
          {vote?.vote && (
            <Badge variant="secondary" className="ml-1 text-[10px]">You voted {vote.vote === "up" ? "Up" : "Down"}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant={vote?.vote === "up" ? "default" : "outline"} size="sm" onClick={() => handleVote("up")} disabled={submitting}>
            <ThumbsUp className="mr-1 h-4 w-4" /> Up
          </Button>
          <Button variant={vote?.vote === "down" ? "default" : "outline"} size="sm" onClick={() => handleVote("down")} disabled={submitting}>
            <ThumbsDown className="mr-1 h-4 w-4" /> Down
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1">
                <MessageSquare className="h-4 w-4" /> Feedback
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Feedback</DialogTitle>
                <DialogDescription>Tell us more about the repeater status (optional, max 500 chars).</DialogDescription>
              </DialogHeader>
              <div>
                <textarea
                  className="w-full rounded-md border bg-background p-2 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[120px]"
                  placeholder="E.g., no carrier, weak audio, tone mismatch, works fine, etc."
                  maxLength={500}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
                <div className="mt-1 text-xs text-muted-foreground">{feedback.length}/500</div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleSubmitFeedback}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
        <span>
          {stats ? (
            <>
              Last {stats.windowDays}d — Up {stats.up} · Down {stats.down}
            </>
          ) : (
            "Loading vote stats…"
          )}
        </span>
      </div>
    </div>
  );
}

