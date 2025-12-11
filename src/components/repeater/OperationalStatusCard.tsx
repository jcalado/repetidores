"use client";

import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";
import { operationalStatusConfig } from "./utils/statusConfig";
import type { OperationalStatus } from "./types";

interface OperationalStatusCardProps {
  status: OperationalStatus;
  lastVerified?: string;
}

/**
 * Displays the admin-set operational status of a repeater.
 */
export function OperationalStatusCard({ status, lastVerified }: OperationalStatusCardProps) {
  const cfg = operationalStatusConfig[status];
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
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Status Operacional
              </span>
            </div>
            <div className={cn("font-semibold mt-0.5", cfg.textClass)}>{cfg.label}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{cfg.description}</div>
          </div>
        </div>
        {lastVerified && (
          <div className="mt-3 pt-3 border-t border-current/10 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>
              Verificado em{" "}
              {new Date(lastVerified).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
