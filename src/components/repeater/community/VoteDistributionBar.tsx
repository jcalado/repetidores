"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import type { VoteStats } from "../types";

interface VoteDistributionBarProps {
  stats: VoteStats | null;
  t: {
    (key: string): string;
    (key: string, values: Record<string, string | number>): string;
  };
}

/**
 * Visual representation of voting distribution with animated progress bars.
 */
export function VoteDistributionBar({ stats, t }: VoteDistributionBarProps) {
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
