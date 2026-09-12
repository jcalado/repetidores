"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertTriangle, CheckCircle2, Heart, HelpCircle, Link2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAllAutoStatus, type AutoStatusMap, type RepeaterAutoStatus } from "@/lib/auto-status";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { formatDistance } from "@/lib/geolocation";
import { linkDetail, linksOf } from "@/lib/links";
import { MODE_BADGE_COLORS } from "@/lib/mode-colors";
import { formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import {
  getAllVoteStats,
  peekAllVoteStats,
  type VoteStats,
  type VoteStatsMap,
} from "@/lib/votes";
import type { Repeater } from "@/app/columns";
import type { FrequencyPair } from "@/types/repeater";

/**
 * Shared presentational cells for the repeater table and the mobile card list.
 *
 * Both surfaces render the SAME components so they can never drift: the merged
 * status cell, the frequency pair display, the mode badges, the favourite heart,
 * the distance readout and the owner/association link all live here.
 *
 * The Callsign Rule (DESIGN.md): every callsign, frequency, CTCSS tone, QTH
 * locator and absolute timestamp renders in Geist Mono, numerics tabular.
 */

// ============================================================================
// Merged status (spec item 7)
// ============================================================================

export type MergedStatusSource = "auto" | "admin" | "votes" | "none";
export type MergedStatusKey =
  | "online"
  | "offline"
  | "active"
  | "maintenance"
  | "adminOffline"
  | "ok"
  | "probBad"
  | "bad"
  | "unknown";
export type MergedStatusTone = "success" | "warning" | "destructive" | "neutral";
/** The four legacy filter values the status column still accepts. */
export type MergedStatusFilterValue = "ok" | "prob-bad" | "bad" | "unknown";

export interface MergedStatus {
  key: MergedStatusKey;
  source: MergedStatusSource;
  tone: MergedStatusTone;
  /** ISO string: auto.lastSeen, or votes.lastPositiveVote. null for admin/none. */
  timestamp: string | null;
  up: number | null;
  down: number | null;
  /** e.g. ["brandmeister","echolink"]; empty unless source === "auto". */
  autoSources: string[];
  /** Which filter bucket this status answers to. */
  filterValue: MergedStatusFilterValue;
}

const TONE_BY_KEY: Record<MergedStatusKey, MergedStatusTone> = {
  online: "success",
  active: "success",
  ok: "success",
  maintenance: "warning",
  probBad: "warning",
  offline: "destructive",
  adminOffline: "destructive",
  bad: "destructive",
  unknown: "neutral",
};

const FILTER_VALUE_BY_KEY: Record<MergedStatusKey, MergedStatusFilterValue> = {
  online: "ok",
  active: "ok",
  ok: "ok",
  maintenance: "prob-bad",
  probBad: "prob-bad",
  offline: "bad",
  adminOffline: "bad",
  bad: "bad",
  unknown: "unknown",
};

function mergedStatus(
  key: MergedStatusKey,
  source: MergedStatusSource,
  extra?: Partial<Pick<MergedStatus, "timestamp" | "up" | "down" | "autoSources">>,
): MergedStatus {
  return {
    key,
    source,
    tone: TONE_BY_KEY[key],
    timestamp: extra?.timestamp ?? null,
    up: extra?.up ?? null,
    down: extra?.down ?? null,
    autoSources: extra?.autoSources ?? [],
    filterValue: FILTER_VALUE_BY_KEY[key],
  };
}

/**
 * Precedence, strictly: auto-check > admin-set status > community votes > none.
 */
export function resolveMergedStatus(args: {
  repeater: Repeater;
  auto?: RepeaterAutoStatus;
  votes?: VoteStats;
}): MergedStatus {
  const { repeater, auto, votes } = args;

  if (auto) {
    return mergedStatus(auto.isOnline ? "online" : "offline", "auto", {
      timestamp: auto.lastSeen ?? null,
      autoSources: (auto.sources ?? []).map((s) => s.source),
    });
  }

  const adminStatus = repeater?.status;
  if (adminStatus === "active") return mergedStatus("active", "admin");
  if (adminStatus === "maintenance") return mergedStatus("maintenance", "admin");
  if (adminStatus === "offline") return mergedStatus("adminOffline", "admin");

  if (votes && votes.category !== "unknown") {
    const key: MergedStatusKey =
      votes.category === "ok" ? "ok" : votes.category === "prob-bad" ? "probBad" : "bad";
    return mergedStatus(key, "votes", {
      timestamp: votes.lastPositiveVote ?? null,
      up: votes.up,
      down: votes.down,
    });
  }

  return mergedStatus("unknown", "none");
}

// ---- synchronous snapshot, for TanStack filterFn which cannot use hooks ----

let statusSnapshot: { voteStats: VoteStatsMap; autoStatus: AutoStatusMap } = {
  voteStats: {},
  autoStatus: {},
};

export function setStatusSnapshot(voteStats: VoteStatsMap, autoStatus: AutoStatusMap): void {
  statusSnapshot = { voteStats: voteStats ?? {}, autoStatus: autoStatus ?? {} };
}

export function getStatusSnapshot(): { voteStats: VoteStatsMap; autoStatus: AutoStatusMap } {
  return statusSnapshot;
}

/** Convenience used by the status column filterFn in columns.tsx. */
export function resolveMergedStatusFromSnapshot(repeater: Repeater): MergedStatus {
  return resolveMergedStatus({
    repeater,
    auto: statusSnapshot.autoStatus[repeater.callsign],
    votes: statusSnapshot.voteStats[repeater.callsign],
  });
}

// ---- refresh signal, so a vote can repaint every status cell ----

// Module level so it reaches loaders anywhere in the app, including the ones
// the details drawer cannot see: the drawer renders in a portal outside
// <RepeaterStatusProvider>, so context alone would never carry the signal.
type StatusRefreshListener = () => void;
const statusRefreshListeners = new Set<StatusRefreshListener>();

/**
 * Asks every mounted useRepeaterStatusData() to re-read the bulk maps. This is
 * a signal, not a fetch: getAllVoteStats() and getAllAutoStatus() still answer
 * from their module TTL caches, so a refresh only costs a request when someone
 * invalidated first. Call it right after a successful postVote(), which drops
 * the vote-stats cache - never on render.
 */
export function refreshRepeaterStatus(): void {
  for (const listener of Array.from(statusRefreshListeners)) listener();
}

// ---- React context, so cells never fetch ----

interface StatusContextValue {
  voteStats: VoteStatsMap;
  autoStatus: AutoStatusMap;
  /** False until the bulk fetches have resolved; suppresses a status flash. */
  ready: boolean;
  /** Bumped every time the maps are replaced, for memoised consumers. */
  epoch: number;
  /** Ask every mounted loader to re-read the bulk maps. See refreshRepeaterStatus. */
  refresh: () => void;
}

const RepeaterStatusContext = React.createContext<StatusContextValue>({
  voteStats: {},
  autoStatus: {},
  ready: true,
  epoch: 0,
  // Works outside a provider too: the signal is module level, not tree scoped.
  refresh: refreshRepeaterStatus,
});

export interface RepeaterStatusProviderProps {
  voteStats: VoteStatsMap;
  autoStatus: AutoStatusMap;
  /**
   * Optional. Defaults to "either map has entries". Pass the loader's own flag
   * when the endpoints can legitimately answer with an empty map, so a soft
   * backend failure still resolves to the "Sem dados" state instead of a
   * permanent placeholder.
   */
  ready?: boolean;
  /** Optional. The loader's epoch, so consumers can key a memo on it. */
  epoch?: number;
  children: React.ReactNode;
}

export function RepeaterStatusProvider({
  voteStats,
  autoStatus,
  ready,
  epoch,
  children,
}: RepeaterStatusProviderProps): React.ReactElement {
  const value = React.useMemo<StatusContextValue>(() => {
    // Keep the synchronous snapshot aligned with what the cells are about to
    // render: the status column's filterFn reads it and cannot use hooks.
    setStatusSnapshot(voteStats, autoStatus);
    const derived =
      Object.keys(voteStats ?? {}).length > 0 || Object.keys(autoStatus ?? {}).length > 0;
    return {
      voteStats: voteStats ?? {},
      autoStatus: autoStatus ?? {},
      ready: ready ?? derived,
      epoch: epoch ?? 0,
      refresh: refreshRepeaterStatus,
    };
  }, [voteStats, autoStatus, ready, epoch]);

  return (
    <RepeaterStatusContext.Provider value={value}>{children}</RepeaterStatusContext.Provider>
  );
}

export function useRepeaterStatus(callsign: string): {
  auto?: RepeaterAutoStatus;
  votes?: VoteStats;
} {
  const { voteStats, autoStatus } = React.useContext(RepeaterStatusContext);
  return { auto: autoStatus[callsign], votes: voteStats[callsign] };
}

/**
 * The refresh callback for anything rendered inside the provider. Components
 * mounted outside it (the details drawer is a portal sibling of the table) can
 * call refreshRepeaterStatus() directly instead.
 */
export function useRepeaterStatusRefresh(): () => void {
  return React.useContext(RepeaterStatusContext).refresh;
}

export interface RepeaterStatusData {
  voteStats: VoteStatsMap;
  autoStatus: AutoStatusMap;
  loaded: boolean;
  /** Bumped every time the bulk fetches resolve, so a memo can re-run. */
  epoch: number;
}

/**
 * Loads both bulk endpoints exactly once per mount (each behind its own 5 minute
 * module TTL cache), publishes the synchronous snapshot and hands the maps back
 * for <RepeaterStatusProvider>. Paging the table never refetches.
 */
export function useRepeaterStatusData(): RepeaterStatusData {
  const [state, setState] = React.useState<RepeaterStatusData>(() => {
    // Already fetched this session (module TTL cache): render warm, no flash.
    const cached = peekAllVoteStats();
    const snapshot = getStatusSnapshot();
    if (cached) {
      return { voteStats: cached, autoStatus: snapshot.autoStatus, loaded: true, epoch: 0 };
    }
    return { voteStats: {}, autoStatus: {}, loaded: false, epoch: 0 };
  });

  React.useEffect(() => {
    let alive = true;
    const load = () => {
      Promise.all([getAllVoteStats(), getAllAutoStatus()]).then(([voteStats, autoStatus]) => {
        setStatusSnapshot(voteStats, autoStatus);
        if (!alive) return;
        setState((prev) => ({ voteStats, autoStatus, loaded: true, epoch: prev.epoch + 1 }));
      });
    };

    load();
    statusRefreshListeners.add(load);
    return () => {
      alive = false;
      statusRefreshListeners.delete(load);
    };
  }, []);

  return state;
}

// ---- status cell ----

const TONE_CLASSES: Record<MergedStatusTone, { dot: string; text: string }> = {
  // Colours mirror the Badge success/warning/destructive variants verbatim.
  success: {
    dot: "bg-[oklch(0.40_0.13_145)] dark:bg-[oklch(0.78_0.13_145)]",
    text: "text-[oklch(0.40_0.13_145)] dark:text-[oklch(0.78_0.13_145)]",
  },
  warning: {
    dot: "bg-[oklch(0.42_0.13_75)] dark:bg-[oklch(0.80_0.13_75)]",
    text: "text-[oklch(0.42_0.13_75)] dark:text-[oklch(0.80_0.13_75)]",
  },
  destructive: {
    dot: "bg-destructive dark:bg-[oklch(0.85_0.18_22)]",
    text: "text-destructive dark:text-[oklch(0.85_0.18_22)]",
  },
  neutral: {
    dot: "bg-muted-foreground/40",
    text: "text-muted-foreground",
  },
};

const TONE_ICONS: Record<MergedStatusTone, React.ComponentType<{ className?: string }>> = {
  success: CheckCircle2,
  warning: AlertTriangle,
  destructive: XCircle,
  neutral: HelpCircle,
};

const SOURCE_LABEL_KEY: Record<MergedStatusSource, string> = {
  auto: "sourceAuto",
  admin: "sourceAdmin",
  votes: "sourceVotes",
  none: "sourceNone",
};

export interface StatusCellProps {
  repeater: Repeater;
  /** "md" = icon + colour always, text label from md: up. Default "md". */
  labelMode?: "always" | "md" | "never";
  /** Renders the source + relative timestamp under the label. Default false. */
  showSource?: boolean;
  className?: string;
}

export function StatusCell({
  repeater,
  labelMode = "md",
  showSource = false,
  className,
}: StatusCellProps): React.ReactElement {
  const t = useTranslations("table.statusCell");
  const { ready } = React.useContext(RepeaterStatusContext);
  const { auto, votes } = useRepeaterStatus(repeater.callsign);
  const status = React.useMemo(
    () => resolveMergedStatus({ repeater, auto, votes }),
    [repeater, auto, votes],
  );

  // Nothing has been fetched yet and the dataset carries no admin status: hold a
  // quiet placeholder rather than asserting "Sem dados" and then repainting.
  if (!ready && status.source === "none") {
    return (
      <span
        aria-hidden
        className={cn("inline-block h-2 w-2 rounded-full bg-muted-foreground/20", className)}
      />
    );
  }

  const tone = TONE_CLASSES[status.tone];
  const Glyph = TONE_ICONS[status.tone];
  // MergedStatusKey doubles as the i18n leaf under table.statusCell.
  const label = t(status.key);
  const sourceLabel = t(SOURCE_LABEL_KEY[status.source]);
  const relative = status.timestamp ? formatRelativeTime(status.timestamp) : null;
  const timeLine =
    relative && status.source === "auto"
      ? t("lastSeen", { time: relative })
      : relative && status.source === "votes"
        ? t("lastVote", { time: relative })
        : null;

  const labelClass =
    labelMode === "always" ? "inline" : labelMode === "never" ? "sr-only" : "hidden md:inline";

  // Source, timestamp and vote counts must never depend on hover: they live in
  // the DOM for every input modality, and the tooltip is keyboard-openable.
  const srText = [
    t("ariaLabel", { label, source: sourceLabel }),
    timeLine,
    status.timestamp,
    status.up !== null && status.down !== null
      ? t("voteCounts", { up: status.up, down: status.down })
      : null,
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className={cn(
            "inline-flex items-start gap-1.5 rounded-sm text-left",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500",
            className,
          )}
        >
          <span className="sr-only">{srText}</span>
          <span
            aria-hidden
            className={cn("mt-[5px] inline-block h-2 w-2 shrink-0 rounded-full", tone.dot)}
          />
          <Glyph className={cn("mt-px h-3.5 w-3.5 shrink-0", tone.text)} aria-hidden />
          <span aria-hidden className="min-w-0">
            <span className={cn("text-xs font-medium", tone.text, labelClass)}>{label}</span>
            {showSource && (
              <span className="block text-[11px] leading-tight text-muted-foreground">
                {sourceLabel}
                {timeLine && (
                  <>
                    {" · "}
                    <span className="font-mono" title={status.timestamp ?? undefined}>
                      {timeLine}
                    </span>
                  </>
                )}
              </span>
            )}
          </span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <span aria-hidden className={cn("inline-block h-2 w-2 rounded-full", tone.dot)} />
          <span>{label}</span>
        </div>
        <div className="mt-1 text-[11px] opacity-80">{sourceLabel}</div>
        {status.autoSources.length > 0 && (
          <div className="text-[11px] opacity-80">{status.autoSources.join(", ")}</div>
        )}
        {timeLine && (
          <div className="mt-0.5 font-mono text-[11px] opacity-80" title={status.timestamp ?? undefined}>
            {timeLine}
          </div>
        )}
        {status.up !== null && status.down !== null && (
          <div className="mt-0.5 text-[11px] tabular-nums opacity-80">
            {t("voteCounts", { up: status.up, down: status.down })}
          </div>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Frequencies (spec item 8)
// ============================================================================

/** Every pair the repeater carries, primary first. */
export function getAllFrequencyPairs(r: Repeater): FrequencyPair[] {
  const list = r?.frequencies ?? [];
  if (list.length === 0) return [];
  const primaryIndex = list.findIndex((f) => f.isPrimary);
  if (primaryIndex <= 0) return [...list];
  return [list[primaryIndex], ...list.filter((_, i) => i !== primaryIndex)];
}

export function getPrimaryPair(r: Repeater): FrequencyPair | null {
  return getAllFrequencyPairs(r)[0] ?? null;
}

function fmtMHz(n: number): string {
  return Number.isFinite(n) ? n.toFixed(3) : "";
}

export interface FrequencyPairCellProps {
  repeater: Repeater;
  /** "output" and "input" render one number; "pair" renders "out / in". */
  variant: "output" | "input" | "pair";
  /** Render the "+N" affordance when frequencies.length > 1. Default true. */
  showExtraCount?: boolean;
  className?: string;
}

export function FrequencyPairCell({
  repeater,
  variant,
  showExtraCount = true,
  className,
}: FrequencyPairCellProps): React.ReactElement | null {
  const t = useTranslations("table.frequencies");
  const pairs = getAllFrequencyPairs(repeater);
  const primary = pairs[0];
  if (!primary) return null;

  const extras = pairs.slice(1);
  const value =
    variant === "pair"
      ? `${fmtMHz(primary.outputFrequency)} / ${fmtMHz(primary.inputFrequency)}`
      : variant === "output"
        ? fmtMHz(primary.outputFrequency)
        : fmtMHz(primary.inputFrequency);

  const showChip = showExtraCount && extras.length > 0;
  const extraLines = extras.map((p) =>
    t("pair", { output: fmtMHz(p.outputFrequency), input: fmtMHz(p.inputFrequency) }),
  );
  const chipLabel = t("moreLabel", { count: extras.length });

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span className="font-mono tabular-nums">{value}</span>
      {/* The extra pairs are in the DOM for every input modality: the badge stays
          non-interactive (a nested activation target would break the row), so the
          tooltip alone would leave keyboard and touch users with a bare "+N". */}
      {showChip && <span className="sr-only">{`${chipLabel}: ${extraLines.join(", ")}`}</span>}
      {showChip && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="outline"
              aria-hidden
              title={`${chipLabel}: ${extraLines.join(", ")}`}
              className="h-5 cursor-default px-1.5 font-mono text-[10px] tabular-nums"
            >
              {t("more", { count: extras.length })}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <div className="font-medium">{chipLabel}</div>
            <ul className="mt-1 flex flex-col gap-0.5">
              {extraLines.map((line, i) => (
                <li key={i} className="font-mono tabular-nums">
                  {line}
                </li>
              ))}
            </ul>
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

// ============================================================================
// Small shared cells
// ============================================================================

export function ToneCell({
  tone,
  className,
}: {
  tone?: number | null;
  className?: string;
}): React.ReactElement {
  if (!tone) return <span className={className} />;
  return <span className={cn("font-mono tabular-nums", className)}>{tone.toFixed(1)}</span>;
}

/** Mode badges. EchoLink and AllStar live outside `modes` but share the taxonomy. */
export function ModeBadges({
  repeater,
  className,
}: {
  repeater: Repeater;
  className?: string;
}): React.ReactElement | null {
  // Two axes, two visual weights. A modulation is what the repeater IS, so it
  // keeps the saturated mode hue; a linking system is a property of it (any FM
  // repeater can be EchoLink enabled), so it reads as a quieter outline chip.
  // They used to render as identical pills, which said they were comparable.
  const modes: { key: string; label: string }[] = [];
  for (const mode of repeater?.modes ?? []) {
    modes.push({ key: mode, label: mode === "DSTAR" ? "D-STAR" : mode });
  }
  const links = linksOf(repeater);
  if (modes.length === 0 && links.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {modes.map(({ key, label }) => (
        <span
          key={key}
          className={cn(
            "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
            MODE_BADGE_COLORS[key] ?? "bg-muted text-muted-foreground",
          )}
        >
          {label}
        </span>
      ))}
      {links.map((link) => {
        // The node number is the actionable part: an operator wants something to
        // connect to, not just the fact that a link exists.
        const detail = linkDetail(repeater, link.value);
        return (
          <span
            key={link.value}
            className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            <Link2 className="size-3 shrink-0" aria-hidden />
            {link.label}
            {detail && (
              // Mono for a numeric identifier (a node you dial); a conference is a
              // name, so it reads as one. That also tells the two apart at a glance.
              <span className={/^\d+$/.test(detail) ? "font-mono tabular-nums" : undefined}>
                {detail}
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function CallsignText({
  callsign,
  className,
}: {
  callsign: string;
  className?: string;
}): React.ReactElement {
  return <span className={cn("font-mono", className)}>{callsign}</span>;
}

export function DistanceText({
  km,
  className,
}: {
  km: number | null;
  className?: string;
}): React.ReactElement {
  if (km === null || !Number.isFinite(km)) {
    return <span className={cn("font-mono tabular-nums", className)}>-</span>;
  }
  return <span className={cn("font-mono tabular-nums", className)}>{formatDistance(km)}</span>;
}

export function FavoriteButton({
  callsign,
  onToggle,
  className,
}: {
  callsign: string;
  onToggle?: (callsign: string, next: boolean) => void;
  className?: string;
}): React.ReactElement {
  const t = useTranslations("favorites");
  const [favorite, setFavorite] = React.useState(false);

  // localStorage is client-only: read after mount so SSR and hydration agree.
  React.useEffect(() => {
    setFavorite(isFavorite(callsign));
  }, [callsign]);

  const label = favorite ? t("remove") : t("add");

  const activate = () => {
    const next = toggleFavorite(callsign);
    setFavorite(next);
    onToggle?.(callsign, next);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={favorite}
          onClick={(e) => {
            e.stopPropagation();
            activate();
          }}
          onKeyDown={(e) => {
            // Never let Enter/Space bubble to the focusable row or card.
            if (e.key === "Enter" || e.key === " ") e.stopPropagation();
          }}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500",
            "transition-colors duration-150 ease-out motion-reduce:transition-none",
            className,
          )}
        >
          <Heart
            aria-hidden
            className={cn(
              "h-4 w-4",
              favorite
                ? "fill-azulejo-600 text-azulejo-600 dark:fill-azulejo-400 dark:text-azulejo-400"
                : "text-muted-foreground",
            )}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Owner / association cell: association link when populated, abbreviation otherwise. */
export function OwnerCell({
  repeater,
  className,
}: {
  repeater: Repeater;
  className?: string;
}): React.ReactElement | null {
  if (repeater.association) {
    return (
      <Link
        href={`/association/${repeater.association.slug}/`}
        className={cn("text-primary hover:underline", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {repeater.association.abbreviation}
      </Link>
    );
  }

  const full = String(repeater.owner ?? "");
  if (!full) return null;
  const short = getOwnerShortName(full);
  if (short === full) return <span className={className}>{full}</span>;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        {/* <abbr title> carries the expansion to pointer users and to assistive
            tech; the sr-only copy covers readers that ignore abbr titles. The
            HoverCard stays as the visual affordance. */}
        <abbr title={full} className={cn("cursor-help underline decoration-dotted", className)}>
          <span aria-hidden>{short}</span>
          <span className="sr-only">{full}</span>
        </abbr>
      </HoverCardTrigger>
      <HoverCardContent>
        <div className="text-sm">{full}</div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Known owner name shorteners. Single source of truth; columns.tsx re-exports
// this as getOwnerShort for the callers that already import it from there.
const OWNER_SHORTNAMES: Record<string, string> = {
  "associação de radioamadores marienses": "ARM",
  "associação de radioamadores da beira alta": "ARBA",
  "associação de radioamadores da beira baixa": "ARBB",
  "associação de radioamadores da beira litoral": "ARBL",
  "associação de radioamadores da costa de prata": "ARCP",
  "associação de radioamadores da linha de cascais": "ARLC",
  "associação de radioamadores da região de lisboa": "ARRLX",
  "liga amadores rádio sintra": "LARS",
  "liga de amadores de rádio transmissões": "LART",
  "rede dos emissores portugueses": "REP",
  "tertúlia radioamadorística guglielmo marconi": "TRGM",
  "união de radioamadores dos açores": "URAA",
  "associação de radioamadores entre tâmega e douro": "ARTD",
  "associação de radioamadores dos açores": "ARAA",
  "associação dos radioamadores da praia da vitória": "ARPV",
  "associação amigos da rádio do norte": "AARN",
  "arsul - associação de radioamadores do sul": "ARSUL",
  "associação de radioamadores da vila de moscavide": "ARVM",
  "associação de radioamadores do distrito de leiria": "ARDL",
  "associação de radioamadores do litoral alentejano": "ARLA",
  "associação de radioamadores do oeste": "ARADO",
};

export function getOwnerShortName(name: string): string {
  return OWNER_SHORTNAMES[name.trim().toLowerCase()] ?? name;
}
