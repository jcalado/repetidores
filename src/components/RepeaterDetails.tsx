"use client";

import { Repeater } from "@/app/columns";
import { BearingIndicator } from "@/components/BearingCompass";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { cn } from "@/lib/utils";
import { getVoteStats, postVote, getFeedbackList, type VoteStats, type FeedbackEntry } from "@/lib/votes";
import { Check, ChevronDown, ChevronUp, Clock, Copy, ExternalLink, MapPin, MessageSquare, Radio, Share2, ThumbsDown, ThumbsUp, Wifi, Maximize2, Users, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, XCircle, HelpCircle, Antenna, Navigation, Settings2, FileText, Globe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
    <div className="space-y-3 sm:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{r.callsign}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="font-mono">{band}</Badge>
            {r.modulation && (
              <Badge variant="outline">{r.modulation.toUpperCase()}</Badge>
            )}
            {r.qth_locator && (
              <Badge variant="outline" className="font-mono text-xs">QTH {r.qth_locator}</Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/repeater/${encodeURIComponent(r.callsign)}`}>
                  <Maximize2 className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ver página completa</TooltipContent>
          </Tooltip>
          <ShareButton callsign={r.callsign} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t("maps")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Frequency Info Section */}
      <SectionCard icon={Antenna} title="Frequências">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
          <InfoCard label={t("output")} value={fmtMHzDisplay(r.outputFrequency)} copyValue={fmtMHzCopy(r.outputFrequency)} />
          <InfoCard label={t("input")} value={fmtMHzDisplay(r.inputFrequency)} copyValue={fmtMHzCopy(r.inputFrequency)} />
          <InfoCard label={t("offset")} value={`${sign}${sign ? " " : ""}${offsetDisplay}`} copyValue={`${sign}${offsetCopy}`} />
          <InfoCard label={t("tone")} value={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : "None"} copyValue={r.tone ? `${Number(r.tone.toFixed(1))} Hz` : undefined} />
        </div>
      </SectionCard>

      {/* Location Section */}
      <SectionCard icon={Navigation} title="Localização">
        <div className="space-y-3">
          {r.association ? (
            <Link
              href={`/association/${r.association.slug}`}
              className="rounded-lg border p-3 hover:bg-accent transition-colors block"
            >
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {t("owner")}
              </div>
              <div className="mt-1 text-sm flex items-center gap-2">
                <span className="text-primary font-medium">
                  {r.association.abbreviation}
                </span>
                <span className="text-muted-foreground">-</span>
                <span className="truncate">{r.association.name}</span>
              </div>
            </Link>
          ) : (
            <InfoCard label={t("owner")} value={r.owner || "–"} />
          )}
          <InfoCard
            label={t("coordinates")}
            value={`${r.latitude?.toFixed(5)}, ${r.longitude?.toFixed(5)}`}
            right={
              osmUrl ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" asChild>
                      <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                        <MapPin className="h-4 w-4" />
                      </a>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Abrir no OpenStreetMap</TooltipContent>
                </Tooltip>
              ) : null
            }
          />
          {/* Bearing to Repeater */}
          {hasValidLocations && (
            <div className="rounded-lg bg-gradient-to-r from-ship-cove-50 to-transparent dark:from-ship-cove-950/50 dark:to-transparent p-2 sm:p-3 border border-ship-cove-200/50 dark:border-ship-cove-800/50">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm text-muted-foreground">Direção:</span>
                <BearingIndicator
                  userLat={userLocation.latitude}
                  userLon={userLocation.longitude}
                  targetLat={r.latitude}
                  targetLon={r.longitude}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Operational Status */}
      {r.status && r.status !== 'unknown' && (
        <OperationalStatusCard status={r.status} lastVerified={r.lastVerified} />
      )}

      {/* Technical Specs Section */}
      {(r.power || r.antennaHeight || r.coverage || r.operatingHours) && (
        <SectionCard icon={Settings2} title="Especificações Técnicas">
          <div className="grid grid-cols-2 gap-2">
            {r.power && (
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Potência</div>
                <div className="text-sm font-medium mt-0.5">{r.power}W</div>
              </div>
            )}
            {r.antennaHeight && (
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Antena</div>
                <div className="text-sm font-medium mt-0.5">{r.antennaHeight}m AGL</div>
              </div>
            )}
            {r.coverage && (
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Cobertura</div>
                <div className="text-sm font-medium mt-0.5 capitalize">{r.coverage}</div>
              </div>
            )}
            {r.operatingHours && (
              <div className="rounded-lg bg-muted/50 p-2.5">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Horário</div>
                <div className="text-sm font-medium mt-0.5">{r.operatingHours}</div>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Digital Modes Section */}
      {((r.dmr && (r.dmrColorCode || r.dmrTalkgroups)) || (r.dstar && (r.dstarReflector || r.dstarModule)) || r.echolinkNode || r.allstarNode) && (
        <SectionCard icon={Radio} title="Modos Digitais & Linking">
          <div className="space-y-2">
            {/* DMR Details */}
            {r.dmr && (r.dmrColorCode || r.dmrTalkgroups) && (
              <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 p-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-600 hover:bg-purple-700 text-white">DMR</Badge>
                  {r.dmrColorCode && (
                    <Badge variant="outline" className="text-xs border-purple-300 dark:border-purple-700">CC {r.dmrColorCode}</Badge>
                  )}
                </div>
                {r.dmrTalkgroups && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Talkgroups:</span> {r.dmrTalkgroups}
                  </div>
                )}
              </div>
            )}

            {/* D-STAR Details */}
            {r.dstar && (r.dstarReflector || r.dstarModule) && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white">D-STAR</Badge>
                  {r.dstarModule && (
                    <Badge variant="outline" className="text-xs border-blue-300 dark:border-blue-700">Module {r.dstarModule}</Badge>
                  )}
                </div>
                {r.dstarReflector && (
                  <div className="text-xs text-muted-foreground mt-2">
                    <span className="font-medium">Reflector:</span> {r.dstarReflector}
                  </div>
                )}
              </div>
            )}

            {/* EchoLink & AllStar */}
            {(r.echolinkNode || r.allstarNode) && (
              <div className="flex flex-wrap gap-2">
                {r.echolinkNode && (
                  <a
                    href={`echolink://${r.echolinkNode}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                  >
                    <Wifi className="h-3.5 w-3.5" />
                    EchoLink #{r.echolinkNode}
                  </a>
                )}
                {r.allstarNode && (
                  <div className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                    <Radio className="h-3.5 w-3.5" />
                    AllStar #{r.allstarNode}
                  </div>
                )}
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* Notes Section */}
      {r.notes && (
        <SectionCard icon={FileText} title="Notas">
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{r.notes}</p>
        </SectionCard>
      )}

      {/* Website Link */}
      {r.website && (
        <a
          href={r.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
        >
          <Globe className="h-4 w-4" />
          Visitar website
          <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-50" />
        </a>
      )}

      {/* Community Voting */}
      <VoteSection repeaterId={r.callsign} />

      {/* Community Feedback */}
      <CommunityFeedbackSection repeaterId={r.callsign} />
    </div>
  );
}

function SectionCard({ icon: Icon, title, children }: { icon: React.ComponentType<{ className?: string }>; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border-b bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="p-2 sm:p-3">
        {children}
      </div>
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
    <div className={cn("rounded-lg border p-2 sm:p-3", className)}>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 sm:mt-1 text-sm flex items-center justify-between gap-1 sm:gap-2">
        <span className="font-mono">{value}</span>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {right}
          {isCopyable && (
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={handleCopy} aria-label="Copy value">
              {copied ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Voting (client-only placeholder) ---
type LocalVote = { vote: "up" | "down"; feedback?: string; reporterCallsign?: string; ts: number };

function getVoteKey(repeaterId: string) {
  return `repeater-vote:${repeaterId}`;
}

const USER_CALLSIGN_KEY = "user-callsign";

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

function loadUserCallsign(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(USER_CALLSIGN_KEY) || "";
  } catch {
    return "";
  }
}

function saveUserCallsign(callsign: string) {
  if (typeof window === "undefined") return;
  try {
    if (callsign.trim()) {
      localStorage.setItem(USER_CALLSIGN_KEY, callsign.trim());
    }
  } catch { }
}

function formatRelativeTime(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "agora mesmo";
  if (diffMins < 60) return `há ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`;
  if (diffHours < 24) return `há ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
  if (diffDays < 30) return `há ${diffDays} dia${diffDays !== 1 ? "s" : ""}`;

  return date.toLocaleDateString("pt-PT", { day: "numeric", month: "short" });
}

function OperationalStatusCard({ status, lastVerified }: { status: 'active' | 'maintenance' | 'offline' | 'unknown'; lastVerified?: string }) {
  const config = {
    active: {
      label: 'Operacional',
      description: 'Repetidor a funcionar normalmente',
      icon: CheckCircle2,
      bgClass: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20',
      borderClass: 'border-emerald-200 dark:border-emerald-800/50',
      iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/50',
      iconClass: 'text-emerald-600 dark:text-emerald-400',
      textClass: 'text-emerald-700 dark:text-emerald-300',
    },
    maintenance: {
      label: 'Em Manutenção',
      description: 'Temporariamente indisponível para manutenção',
      icon: AlertCircle,
      bgClass: 'bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/40 dark:to-amber-900/20',
      borderClass: 'border-amber-200 dark:border-amber-800/50',
      iconBgClass: 'bg-amber-100 dark:bg-amber-900/50',
      iconClass: 'text-amber-600 dark:text-amber-400',
      textClass: 'text-amber-700 dark:text-amber-300',
    },
    offline: {
      label: 'Offline',
      description: 'Repetidor fora de serviço',
      icon: XCircle,
      bgClass: 'bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20',
      borderClass: 'border-red-200 dark:border-red-800/50',
      iconBgClass: 'bg-red-100 dark:bg-red-900/50',
      iconClass: 'text-red-600 dark:text-red-400',
      textClass: 'text-red-700 dark:text-red-300',
    },
    unknown: {
      label: 'Desconhecido',
      description: 'Estado não verificado',
      icon: HelpCircle,
      bgClass: 'bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/20',
      borderClass: 'border-slate-200 dark:border-slate-700/50',
      iconBgClass: 'bg-slate-100 dark:bg-slate-800/50',
      iconClass: 'text-slate-500 dark:text-slate-400',
      textClass: 'text-slate-600 dark:text-slate-300',
    },
  } as const;

  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border overflow-hidden", cfg.bgClass, cfg.borderClass)}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("rounded-full p-2.5 shrink-0", cfg.iconBgClass)}>
            <Icon className={cn("h-5 w-5", cfg.iconClass)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Status Operacional</span>
            </div>
            <div className={cn("font-semibold mt-0.5", cfg.textClass)}>{cfg.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{cfg.description}</div>
          </div>
        </div>
        {lastVerified && (
          <div className="mt-3 pt-3 border-t border-current/10 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>Verificado em {new Date(lastVerified).toLocaleDateString('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusDisplay({ status, stats, t }: { status: "ok" | "prob-bad" | "bad" | "unknown"; stats: VoteStats | null; t: ReturnType<typeof useTranslations<"communityStatus">> }) {
  const config = {
    ok: {
      labelKey: "status.ok.label" as const,
      descriptionKey: "status.ok.description" as const,
      icon: CheckCircle2,
      bgClass: "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/30",
      borderClass: "border-emerald-200 dark:border-emerald-800/50",
      iconClass: "text-emerald-600 dark:text-emerald-400",
      textClass: "text-emerald-700 dark:text-emerald-300",
    },
    "prob-bad": {
      labelKey: "status.probBad.label" as const,
      descriptionKey: "status.probBad.description" as const,
      icon: AlertCircle,
      bgClass: "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/40 dark:to-amber-900/30",
      borderClass: "border-amber-200 dark:border-amber-800/50",
      iconClass: "text-amber-600 dark:text-amber-400",
      textClass: "text-amber-700 dark:text-amber-300",
    },
    bad: {
      labelKey: "status.bad.label" as const,
      descriptionKey: "status.bad.description" as const,
      icon: XCircle,
      bgClass: "bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950/40 dark:to-red-900/30",
      borderClass: "border-red-200 dark:border-red-800/50",
      iconClass: "text-red-600 dark:text-red-400",
      textClass: "text-red-700 dark:text-red-300",
    },
    unknown: {
      labelKey: "status.unknown.label" as const,
      descriptionKey: "status.unknown.description" as const,
      icon: HelpCircle,
      bgClass: "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-800/30",
      borderClass: "border-slate-200 dark:border-slate-700/50",
      iconClass: "text-slate-500 dark:text-slate-400",
      textClass: "text-slate-600 dark:text-slate-300",
    },
  } as const;

  const cfg = config[status];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-lg border p-3", cfg.bgClass, cfg.borderClass)}>
      <div className="flex items-center gap-3">
        <div className={cn("rounded-full p-2", cfg.bgClass)}>
          <Icon className={cn("h-5 w-5", cfg.iconClass)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("font-semibold text-sm", cfg.textClass)}>{t(cfg.labelKey)}</div>
          <div className="text-xs text-muted-foreground">{t(cfg.descriptionKey)}</div>
        </div>
        {stats && stats.total > 0 && (
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums">
              {Math.round((stats.up / stats.total) * 100)}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("positive")}</div>
          </div>
        )}
      </div>
      {/* Freshness indicator */}
      {stats?.lastPositiveVote && (
        <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{t("lastConfirmed", { time: formatRelativeTime(stats.lastPositiveVote) })}</span>
        </div>
      )}
    </div>
  );
}

function VoteDistributionBar({ stats, t }: { stats: VoteStats | null; t: ReturnType<typeof useTranslations<"communityStatus">> }) {
  if (!stats || stats.total === 0) return null;

  const upPercent = (stats.up / stats.total) * 100;
  const downPercent = (stats.down / stats.total) * 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
          <TrendingUp className="h-3 w-3" />
          <span className="font-medium">{stats.up}</span>
          <span className="text-muted-foreground">{t("working")}</span>
        </span>
        <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
          <span className="text-muted-foreground">{t("issues")}</span>
          <span className="font-medium">{stats.down}</span>
          <TrendingDown className="h-3 w-3" />
        </span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${upPercent}%` }}
        />
        <div
          className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-400 transition-all duration-500 ease-out"
          style={{ width: `${downPercent}%` }}
        />
      </div>
      <div className="text-center text-[10px] text-muted-foreground">
        {t("reportsInDays", { count: stats.total, days: stats.windowDays })}
      </div>
    </div>
  );
}

function VoteSection({ repeaterId }: { repeaterId: string }) {
  const t = useTranslations("communityStatus");
  const [vote, setVote] = React.useState<LocalVote | null>(null);
  const [open, setOpen] = React.useState(false);
  const [pendingVoteType, setPendingVoteType] = React.useState<"up" | "down">("up");
  const [feedback, setFeedback] = React.useState("");
  const [reporterCallsign, setReporterCallsign] = React.useState("");
  const [stats, setStats] = React.useState<VoteStats | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setVote(loadLocalVote(repeaterId));
    setReporterCallsign(loadUserCallsign());
    setIsLoading(true);
    let alive = true;
    getVoteStats(repeaterId)
      .then((s) => {
        if (alive) setStats(s);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [repeaterId]);

  const status = stats?.category ?? "unknown";

  function handleOpenFeedback(type: "up" | "down") {
    setPendingVoteType(type);
    setOpen(true);
  }

  function handleSubmitFeedback() {
    const callsign = reporterCallsign.trim() || undefined;
    const v: LocalVote = { vote: pendingVoteType, ts: Date.now(), feedback: feedback.trim() || undefined, reporterCallsign: callsign };
    setVote(v);
    saveLocalVote(repeaterId, v);
    if (callsign) saveUserCallsign(callsign);
    setSubmitting(true);
    postVote({ repeaterId, vote: pendingVoteType, feedback: v.feedback, reporterCallsign: callsign })
      .then((s) => setStats(s))
      .finally(() => setSubmitting(false));
    setOpen(false);
    setFeedback("");
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("title")}</span>
        {vote?.vote && (
          <Badge
            variant="outline"
            className={cn(
              "ml-auto text-[10px] gap-1",
              vote.vote === "up"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
            )}
          >
            {vote.vote === "up" ? <ThumbsUp className="h-3 w-3" /> : <ThumbsDown className="h-3 w-3" />}
            {t("yourVote")}
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-2 rounded-full bg-muted" />
            <div className="h-10 rounded-lg bg-muted" />
          </div>
        ) : (
          <>
            {/* Status Display */}
            <StatusDisplay status={status} stats={stats} t={t} />

            {/* Vote Distribution Bar */}
            <VoteDistributionBar stats={stats} t={t} />

            {/* Voting Buttons */}
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={vote?.vote === "up" ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1 gap-2 transition-all",
                      vote?.vote === "up" && "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
                    )}
                    onClick={() => handleOpenFeedback("up")}
                    disabled={submitting}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>{t("workingButton")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("reportWorking")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={vote?.vote === "down" ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "flex-1 gap-2 transition-all",
                      vote?.vote === "down" && "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
                    )}
                    onClick={() => handleOpenFeedback("down")}
                    disabled={submitting}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>{t("issuesButton")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("reportIssues")}</TooltipContent>
              </Tooltip>
            </div>

            {/* Feedback Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {pendingVoteType === "up" ? t("feedbackTitleWorking") : t("feedbackTitleIssues")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("feedbackDescription")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t("callsignLabel")}
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring uppercase"
                      placeholder={t("callsignPlaceholder")}
                      maxLength={20}
                      value={reporterCallsign}
                      onChange={(e) => setReporterCallsign(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                      {t("feedbackLabel")}
                    </label>
                    <textarea
                      className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
                      placeholder={pendingVoteType === "up" ? t("feedbackPlaceholderWorking") : t("feedbackPlaceholder")}
                      maxLength={500}
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">{t("characters", { count: feedback.length })}</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>{t("cancel")}</Button>
                  <Button
                    onClick={handleSubmitFeedback}
                    disabled={submitting}
                    className={cn(
                      pendingVoteType === "up"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-red-600 hover:bg-red-700"
                    )}
                  >
                    {pendingVoteType === "up" ? t("submitWorking") : t("submitIssues")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  );
}

// --- Community Feedback Section ---
const INITIAL_DISPLAY_COUNT = 5;

function CommunityFeedbackSection({ repeaterId }: { repeaterId: string }) {
  const t = useTranslations("communityStatus");
  const [feedbackList, setFeedbackList] = React.useState<FeedbackEntry[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    setIsLoading(true);
    getFeedbackList(repeaterId, { limit: 50 })
      .then((res) => {
        if (alive) {
          setFeedbackList(res.docs);
          setTotalCount(res.totalDocs);
        }
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [repeaterId]);

  const displayedFeedback = isExpanded
    ? feedbackList
    : feedbackList.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = feedbackList.length - INITIAL_DISPLAY_COUNT;
  const hasMore = feedbackList.length > INITIAL_DISPLAY_COUNT;

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("feedbackSection.title")}</span>
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return (
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("feedbackSection.title")}</span>
        </div>
        <div className="p-4 text-center text-sm text-muted-foreground">
          {t("feedbackSection.noFeedback")}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("feedbackSection.title")}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {totalCount}
        </Badge>
      </div>

      {/* Feedback List */}
      <div className="divide-y">
        {displayedFeedback.map((entry) => (
          <FeedbackEntryItem key={entry.id} entry={entry} />
        ))}
      </div>

      {/* Show More/Less Button */}
      {hasMore && (
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                {t("feedbackSection.showLess")}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                {t("feedbackSection.showMore", { count: hiddenCount })}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

function FeedbackEntryItem({ entry }: { entry: FeedbackEntry }) {
  const t = useTranslations("communityStatus");

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Vote indicator */}
        <div
          className={cn(
            "rounded-full p-1.5 shrink-0",
            entry.vote === "up"
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
          )}
        >
          {entry.vote === "up" ? (
            <ThumbsUp className="h-3.5 w-3.5" />
          ) : (
            <ThumbsDown className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Reporter and time */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">
              {entry.reporterCallsign || t("feedbackSection.anonymous")}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>

          {/* Feedback text */}
          <p className="text-sm text-muted-foreground mt-1">
            {entry.feedback || (
              <span className="italic">{t("feedbackSection.noComment")}</span>
            )}
          </p>
        </div>
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

