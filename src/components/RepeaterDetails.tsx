"use client";

import { Repeater } from "@/app/columns";
import { BearingIndicator } from "@/components/BearingCompass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { cn } from "@/lib/utils";
import { getVoteStats, postVote, type VoteStats } from "@/lib/votes";
import { Check, Copy, ExternalLink, MapPin, MessageSquare, Radio, Share2, ThumbsDown, ThumbsUp, Wifi, Zap, Maximize2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

function fmtMHzDisplay(n?: number) {
  return typeof n === "number" && Number.isFinite(n) ? `${n.toFixed(4)} MHz` : "–";
}
function fmtMHzCopy(n?: number) {
  return typeof n === "number" && Number.isFinite(n) ? n.toFixed(4) : "";
}

function duplex(rx?: number, tx?: number) {
  if (typeof rx !== "number" || typeof tx !== "number") return { sign: "", offsetDisplay: "–", offsetCopy: "" };
  const sign = tx > rx ? "+" : tx < rx ? "-" : "";
  const diff = Math.abs(tx - rx);
  return { sign, offsetDisplay: `${diff.toFixed(4)} MHz`, offsetCopy: diff.toFixed(4) };
}

interface RepeaterDetailsProps {
  r: Repeater;
}

export default function RepeaterDetails({ r }: RepeaterDetailsProps) {
  const { userLocation } = useUserLocation();
  const band = getBandFromFrequency(r.outputFrequency);
  const { sign, offsetDisplay, offsetCopy } = duplex(r.outputFrequency, r.inputFrequency);

  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;
  const osmUrl =
    typeof r.latitude === "number" && typeof r.longitude === "number"
      ? `https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}&zoom=14`
      : undefined;
  const t = useTranslations("repeater");

  const hasValidLocations = userLocation && r.latitude && r.longitude;

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild aria-label="Ver página completa">
            <Link href={`/repeater/${encodeURIComponent(r.callsign)}`}>
              <Maximize2 className="h-4 w-4" />
            </Link>
          </Button>
          <ShareButton callsign={r.callsign} />
          <Button asChild>
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              {t("maps")}
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <InfoCard label={t("output")} value={fmtMHzDisplay(r.outputFrequency)} copyValue={fmtMHzCopy(r.outputFrequency)} />
        <InfoCard label={t("input")} value={fmtMHzDisplay(r.inputFrequency)} copyValue={fmtMHzCopy(r.inputFrequency)} />
        <InfoCard label={t("offset")} value={`${sign}${sign ? " " : ""}${offsetDisplay}`} copyValue={`${sign}${offsetCopy}`} />
        <InfoCard label={t("tone")} value={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : "None"} copyValue={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : undefined} />
        <InfoCard label={t("owner")} value={r.owner || "–"} className="sm:col-span-2" />
        <InfoCard
          label={t("coordinates")}
          value={`${r.latitude?.toFixed(5)}, ${r.longitude?.toFixed(5)}`}
          className="sm:col-span-2"
          right={
            osmUrl ? (
              <Button variant="ghost" size="icon" asChild aria-label="Open in OpenStreetMap">
                <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4" />
                </a>
              </Button>
            ) : null
          }
        />
      </div>

      {/* Bearing to Repeater */}
      {hasValidLocations && (
        <div className="rounded-lg border bg-gradient-to-r from-ship-cove-50 to-transparent dark:from-ship-cove-950 dark:to-transparent p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Direção para o repetidor:</span>
            <BearingIndicator
              userLat={userLocation.latitude}
              userLon={userLocation.longitude}
              targetLat={r.latitude}
              targetLon={r.longitude}
            />
          </div>
        </div>
      )}

      {/* Operational Status Badge */}
      {r.status && r.status !== 'unknown' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <OperationalStatusBadge status={r.status} />
          {r.lastVerified && (
            <span className="text-xs text-muted-foreground">
              (verified {new Date(r.lastVerified).toLocaleDateString()})
            </span>
          )}
        </div>
      )}

      {/* Technical Specs Section */}
      {(r.power || r.antennaHeight || r.coverage || r.operatingHours) && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Technical Specs
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {r.power && (
                <div>
                  <span className="text-muted-foreground">Power:</span>{" "}
                  <span className="font-medium">{r.power}W</span>
                </div>
              )}
              {r.antennaHeight && (
                <div>
                  <span className="text-muted-foreground">Antenna:</span>{" "}
                  <span className="font-medium">{r.antennaHeight}m AGL</span>
                </div>
              )}
              {r.coverage && (
                <div>
                  <span className="text-muted-foreground">Coverage:</span>{" "}
                  <span className="font-medium capitalize">{r.coverage}</span>
                </div>
              )}
              {r.operatingHours && (
                <div>
                  <span className="text-muted-foreground">Hours:</span>{" "}
                  <span className="font-medium">{r.operatingHours}</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Digital Modes Section */}
      {(r.dmr || r.dstar || r.echolinkNode || r.allstarNode) && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Radio className="h-4 w-4" />
              Digital Modes & Linking
            </h4>

            {/* DMR Details */}
            {r.dmr && (r.dmrColorCode || r.dmrTalkgroups) && (
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">DMR</Badge>
                  {r.dmrColorCode && (
                    <span className="text-xs">CC {r.dmrColorCode}</span>
                  )}
                </div>
                {r.dmrTalkgroups && (
                  <div className="text-xs text-muted-foreground">
                    TGs: {r.dmrTalkgroups}
                  </div>
                )}
              </div>
            )}

            {/* D-STAR Details */}
            {r.dstar && (r.dstarReflector || r.dstarModule) && (
              <div className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">D-STAR</Badge>
                  {r.dstarModule && (
                    <span className="text-xs">Module {r.dstarModule}</span>
                  )}
                </div>
                {r.dstarReflector && (
                  <div className="text-xs text-muted-foreground">
                    Reflector: {r.dstarReflector}
                  </div>
                )}
              </div>
            )}

            {/* EchoLink & AllStar */}
            <div className="flex flex-wrap gap-2">
              {r.echolinkNode && (
                <a
                  href={`echolink://${r.echolinkNode}`}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <Wifi className="h-3 w-3" />
                  EchoLink #{r.echolinkNode}
                </a>
              )}
              {r.allstarNode && (
                <div className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm">
                  <Radio className="h-3 w-3" />
                  AllStar #{r.allstarNode}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Notes Section */}
      {r.notes && (
        <>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{r.notes}</p>
          </div>
        </>
      )}

      {/* Website Link */}
      {r.website && (
        <a
          href={r.website}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <ExternalLink className="h-4 w-4" />
          Visit website
        </a>
      )}

      <VoteSection repeaterId={r.callsign} />
    </div>
  );
}

function InfoCard({ label, value, className, copyValue, right }: { label: string; value: React.ReactNode; className?: string; copyValue?: string; right?: React.ReactNode }) {
  const [copied, setCopied] = React.useState(false);
  const isCopyable = typeof copyValue === "string" && copyValue.length > 0;

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isCopyable || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(copyValue!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // noop
    }
  }

  return (
    <div className={cn("rounded-lg border p-3", className)}>
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm flex items-center justify-between gap-2">
        <span className="truncate">{value}</span>
        <div className="flex items-center gap-1">
          {right}
          {isCopyable && (
            <Button variant="ghost" size="icon" onClick={handleCopy} aria-label="Copy value">
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
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

function OperationalStatusBadge({ status }: { status: 'active' | 'maintenance' | 'offline' | 'unknown' }) {
  const config = {
    active: { label: 'Active', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' },
    maintenance: { label: 'Maintenance', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
    offline: { label: 'Offline', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    unknown: { label: 'Unknown', className: 'bg-muted text-muted-foreground' },
  } as const;
  const cfg = config[status];
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", cfg.className)}>{cfg.label}</span>;
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

// --- Share Button ---
function ShareButton({ callsign }: { callsign: string }) {
  const [copied, setCopied] = React.useState(false);
  const t = useTranslations("repeater");

  const handleShare = async () => {
    // Build share URL using the dedicated repeater page
    const shareUrl = `${window.location.origin}/repeater/${encodeURIComponent(callsign)}`;

    // Try native share first (mobile), fall back to clipboard
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Repeater ${callsign}`,
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={handleShare} aria-label={t("share")}>
      {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
    </Button>
  );
}

