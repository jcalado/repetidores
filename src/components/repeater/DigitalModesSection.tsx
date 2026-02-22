"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/time";
import type { RepeaterAutoStatus } from "@/lib/auto-status";
import { Ban, Clock, Radio, ShieldCheck, Wifi } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectionCard } from "./SectionCard";
import type { Repeater } from "./types";

function translateDays(days: string): string {
  return days
    .replace(/Mon/g, 'Seg').replace(/Tue/g, 'Ter').replace(/Wed/g, 'Qua')
    .replace(/Thu/g, 'Qui').replace(/Fri/g, 'Sex').replace(/Sat/g, 'Sáb').replace(/Sun/g, 'Dom');
}

function formatTgTooltip(tg: { tgId: number; name?: string; type?: string; days?: string; startTime?: string; endTime?: string }): string {
  const parts = [tg.name || `TG ${tg.tgId}`];
  if (tg.type === 'timed') {
    const schedule: string[] = [];
    if (tg.days) schedule.push(translateDays(tg.days));
    if (tg.startTime) schedule.push(`${tg.startTime}${tg.endTime ? `-${tg.endTime}` : ''}`);
    if (schedule.length) parts.push(`(${schedule.join(' ')})`);
  }
  return parts.join(' ');
}

interface DigitalModesSectionProps {
  repeater: Repeater;
  autoStatus?: RepeaterAutoStatus | null;
}

/**
 * Digital modes and linking section displaying DMR, D-STAR, C4FM, TETRA, EchoLink, and AllStar.
 * Returns null if no digital mode data is available.
 */
export function DigitalModesSection({ repeater: r, autoStatus }: DigitalModesSectionProps) {
  const t = useTranslations("repeater");
  const hasDmrDetails = r.modes?.includes('DMR') && (r.dmr?.colorCode || r.dmr?.ts1Talkgroups?.length || r.dmr?.ts2Talkgroups?.length);
  const hasDstarDetails = r.modes?.includes('DSTAR') && (r.dstar?.reflector || r.dstar?.module);
  const hasC4fmDetails = r.modes?.includes('C4FM') && (r.c4fm?.room || r.c4fm?.node || r.c4fm?.network);
  const hasTetraDetails = r.modes?.includes('TETRA') && r.tetra?.talkgroups?.length;
  const hasLinking = r.echolink?.enabled || r.allstarNode;

  if (!hasDmrDetails && !hasDstarDetails && !hasC4fmDetails && !hasTetraDetails && !hasLinking) {
    return null;
  }

  return (
    <SectionCard
      icon={Radio}
      title="Modos Digitais & Linking"
      titleExtra={autoStatus && (
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
          autoStatus.isOnline
            ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
        )}>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            autoStatus.isOnline ? "bg-emerald-500 animate-pulse" : "bg-red-500"
          )} />
          {autoStatus.isOnline ? t('autoStatus.online') : t('autoStatus.offline')}
          <ShieldCheck className="h-3 w-3 opacity-60" />
        </span>
      )}
    >
      <div className="space-y-2">
        {/* DMR Details */}
        {hasDmrDetails && (
          <div className="rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/50 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-purple-600 hover:bg-purple-700 text-white">DMR</Badge>
              {r.dmr?.colorCode && (
                <Badge
                  variant="outline"
                  className="text-xs border-purple-300 dark:border-purple-700"
                >
                  CC {r.dmr.colorCode}
                </Badge>
              )}
              {r.dmr?.network && (
                <Badge
                  variant="outline"
                  className="text-xs border-purple-300 dark:border-purple-700"
                >
                  {r.dmr.network}
                </Badge>
              )}
              {(() => {
                const bmSource = autoStatus?.sources.find(s => s.source === 'brandmeister');
                if (!bmSource) return null;
                return (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400">
                    <span className={cn(
                      "h-2 w-2 rounded-full",
                      bmSource.isOnline ? "bg-emerald-500" : "bg-red-500"
                    )} />
                    {bmSource.lastSeen && formatRelativeTime(bmSource.lastSeen)}
                  </span>
                );
              })()}
            </div>

            {/* Timeslot 1 Talkgroups */}
            {(() => {
              const ts1Blocked = r.dmr?.blockedTalkgroups?.filter(tg => tg.slot === '1' || tg.slot === 'both');
              const hasTs1 = (r.dmr?.ts1Talkgroups && r.dmr.ts1Talkgroups.length > 0) || (ts1Blocked && ts1Blocked.length > 0);
              if (!hasTs1) return null;
              return (
                <div className="mt-2.5">
                  <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                    TS1
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.dmr?.ts1Talkgroups?.map((tg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 text-xs"
                        title={formatTgTooltip(tg)}
                      >
                        {tg.type === 'timed' && <Clock className="h-3 w-3 shrink-0 text-purple-400" />}
                        <span className="font-mono font-medium">{tg.tgId}</span>
                        {tg.name && <span className="text-purple-500 dark:text-purple-400 max-w-[60px] truncate">{tg.name}</span>}
                      </span>
                    ))}
                    {ts1Blocked?.map((tg, idx) => (
                      <span
                        key={`blocked-${idx}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs"
                        title={`TG ${tg.tgId} (bloqueado)`}
                      >
                        <Ban className="h-3 w-3 shrink-0" />
                        <span className="font-mono font-medium">{tg.tgId}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Timeslot 2 Talkgroups */}
            {(() => {
              const ts2Blocked = r.dmr?.blockedTalkgroups?.filter(tg => tg.slot === '2' || tg.slot === 'both');
              const hasTs2 = (r.dmr?.ts2Talkgroups && r.dmr.ts2Talkgroups.length > 0) || (ts2Blocked && ts2Blocked.length > 0);
              if (!hasTs2) return null;
              return (
                <div className="mt-2">
                  <div className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                    TS2
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {r.dmr?.ts2Talkgroups?.map((tg, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 text-xs"
                        title={formatTgTooltip(tg)}
                      >
                        {tg.type === 'timed' && <Clock className="h-3 w-3 shrink-0 text-purple-400" />}
                        <span className="font-mono font-medium">{tg.tgId}</span>
                        {tg.name && <span className="text-purple-500 dark:text-purple-400 max-w-[60px] truncate">{tg.name}</span>}
                      </span>
                    ))}
                    {ts2Blocked?.map((tg, idx) => (
                      <span
                        key={`blocked-${idx}`}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs"
                        title={`TG ${tg.tgId} (bloqueado)`}
                      >
                        <Ban className="h-3 w-3 shrink-0" />
                        <span className="font-mono font-medium">{tg.tgId}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* D-STAR Details */}
        {hasDstarDetails && (
          <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white">D-STAR</Badge>
              {r.dstar?.module && (
                <Badge
                  variant="outline"
                  className="text-xs border-blue-300 dark:border-blue-700"
                >
                  Module {r.dstar.module}
                </Badge>
              )}
            </div>
            {r.dstar?.reflector && (
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Reflector:</span> {r.dstar.reflector}
              </div>
            )}
            {r.dstar?.gateway && (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Gateway:</span> {r.dstar.gateway}
              </div>
            )}
          </div>
        )}

        {/* C4FM Details */}
        {hasC4fmDetails && (
          <div className="rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-600 hover:bg-orange-700 text-white">C4FM</Badge>
              {r.c4fm?.network && (
                <Badge
                  variant="outline"
                  className="text-xs border-orange-300 dark:border-orange-700 uppercase"
                >
                  {r.c4fm.network}
                </Badge>
              )}
            </div>
            {r.c4fm?.room && (
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Sala:</span> {r.c4fm.room}
              </div>
            )}
            {r.c4fm?.node && (
              <div className="text-xs text-muted-foreground mt-1">
                <span className="font-medium">Node:</span> {r.c4fm.node}
              </div>
            )}
          </div>
        )}

        {/* TETRA Details */}
        {hasTetraDetails && (
          <div className="rounded-lg bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 p-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-cyan-600 hover:bg-cyan-700 text-white">TETRA</Badge>
              {r.tetra?.network && (
                <Badge
                  variant="outline"
                  className="text-xs border-cyan-300 dark:border-cyan-700"
                >
                  {r.tetra.network}
                </Badge>
              )}
            </div>
            {r.tetra?.talkgroups && r.tetra.talkgroups.length > 0 && (
              <div className="text-xs text-muted-foreground mt-2">
                <span className="font-medium">Talkgroups:</span> {r.tetra.talkgroups.join(', ')}
              </div>
            )}
          </div>
        )}

        {/* EchoLink & AllStar */}
        {hasLinking && (
          <div className="flex flex-wrap gap-2">
            {r.echolink?.enabled && r.echolink.nodeNumber && (() => {
              const elSource = autoStatus?.sources.find(s => s.source === 'echolink');
              return (
                <a
                  href={`echolink://${r.echolink.nodeNumber}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 px-3 py-2 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors"
                >
                  {elSource ? (
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      elSource.isOnline ? "bg-emerald-500" : "bg-red-500"
                    )} />
                  ) : (
                    <Wifi className="h-3.5 w-3.5" />
                  )}
                  EchoLink #{r.echolink.nodeNumber}
                  {r.echolink.conference && ` (${r.echolink.conference})`}
                  {elSource?.lastSeen && (
                    <span className="text-xs opacity-70">
                      · {formatRelativeTime(elSource.lastSeen)}
                    </span>
                  )}
                </a>
              );
            })()}
            {r.allstarNode && (() => {
              const asSource = autoStatus?.sources.find(s => s.source === 'allstar');
              return (
                <div className="inline-flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800/50 px-3 py-2 text-sm font-medium text-orange-700 dark:text-orange-300">
                  {asSource ? (
                    <span className={cn(
                      "h-2 w-2 rounded-full shrink-0",
                      asSource.isOnline ? "bg-emerald-500" : "bg-red-500"
                    )} />
                  ) : (
                    <Radio className="h-3.5 w-3.5" />
                  )}
                  AllStar #{r.allstarNode}
                  {asSource?.lastSeen && (
                    <span className="text-xs opacity-70">
                      · {formatRelativeTime(asSource.lastSeen)}
                    </span>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
