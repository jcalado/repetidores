"use client";

import { cn } from "@/lib/utils";
import { Clock } from "lucide-react";
import { formatRelativeTime } from "@/lib/time";
import { communityStatusConfig } from "../utils/statusConfig";
import type { VoteStats, CommunityStatus } from "../types";

interface StatusDisplayProps {
  status: CommunityStatus;
  stats: VoteStats | null;
  t: {
    (key: string): string;
    (key: string, values: Record<string, string>): string;
  };
}

/**
 * Displays community voting status with statistics.
 */
export function StatusDisplay({ status, stats, t }: StatusDisplayProps) {
  const cfg = communityStatusConfig[status];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-lg border p-3", cfg.bgClass, cfg.borderClass)}>
      <div className="flex items-center gap-3">
        <div className={cn("rounded-full p-2", cfg.bgClass)}>
          <Icon className={cn("h-5 w-5", cfg.iconClass)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={cn("font-semibold text-sm", cfg.textClass)}>
            {t(cfg.labelKey)}
          </div>
          <div className="text-xs text-muted-foreground">{t(cfg.descriptionKey)}</div>
        </div>
        {stats && stats.total > 0 && (
          <div className="text-right">
            <div className="text-lg font-bold tabular-nums">
              {Math.round((stats.up / stats.total) * 100)}%
            </div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("positive")}
            </div>
          </div>
        )}
      </div>
      {stats?.lastPositiveVote && (
        <div className="mt-2 pt-2 border-t border-current/10 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{t("lastConfirmed", { time: formatRelativeTime(stats.lastPositiveVote) })}</span>
        </div>
      )}
    </div>
  );
}
