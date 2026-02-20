"use client";

import { cn } from "@/lib/utils";
import { operationalStatusConfig } from "./utils/statusConfig";
import type { OperationalStatus } from "./types";

interface OperationalStatusCardProps {
  status: OperationalStatus;
  lastVerified?: string;
}

const dotColor: Record<string, string> = {
  active: "bg-emerald-500",
  maintenance: "bg-amber-500",
  offline: "bg-red-500",
  unknown: "bg-slate-400",
};

/**
 * Displays the admin-set operational status of a repeater.
 */
export function OperationalStatusCard({ status, lastVerified }: OperationalStatusCardProps) {
  const cfg = operationalStatusConfig[status];

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950 px-4 py-3">
      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor[status])} />
      <span className={cn("text-sm font-medium", cfg.textClass)}>{cfg.label}</span>
      {lastVerified && (
        <span className="ml-auto text-xs text-ship-cove-400 dark:text-ship-cove-500">
          {new Date(lastVerified).toLocaleDateString("pt-PT", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      )}
    </div>
  );
}
