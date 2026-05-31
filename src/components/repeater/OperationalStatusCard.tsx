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
  unknown: "bg-muted-foreground",
};

/**
 * Displays the admin-set operational status of a repeater.
 */
export function OperationalStatusCard({ status, lastVerified }: OperationalStatusCardProps) {
  const cfg = operationalStatusConfig[status];

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border bg-card shadow-sm px-4 py-3">
      <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor[status])} />
      <span className={cn("text-sm font-medium", cfg.textClass)}>{cfg.label}</span>
      {lastVerified && (
        <span className="ml-auto text-xs text-muted-foreground font-mono">
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
