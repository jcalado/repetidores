"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Maximize2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ShareButton } from "./ShareButton";
import { getBandFromFrequency } from "./utils/formatters";
import { getPrimaryFrequency } from "@/types/repeater-helpers";
import type { Repeater } from "./types";

interface RepeaterHeaderProps {
  repeater: Repeater;
}

/**
 * Header section displaying callsign, badges, and action buttons.
 * Styled with Radio Station Dashboard aesthetic.
 */
export function RepeaterHeader({ repeater: r }: RepeaterHeaderProps) {
  const t = useTranslations("repeater");
  const primary = getPrimaryFrequency(r);
  const band = primary ? getBandFromFrequency(primary.outputFrequency) : 'unknown';
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Callsign */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <Radio className="h-4 w-4 text-azulejo-600 dark:text-azulejo-400" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight font-mono truncate">
              {r.callsign}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground text-xs font-medium">
              {band}
            </span>
            {r.modes?.map((mode) => (
              <span
                key={mode}
                className="px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground text-xs font-medium"
              >
                {mode === 'DSTAR' ? 'D-STAR' : mode}
              </span>
            ))}
            {r.qthLocator && (
              <span className="px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground text-xs font-mono">
                {r.qthLocator}
              </span>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={`/repeater/${encodeURIComponent(r.callsign)}/`}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
              >
                <Maximize2 className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent>Ver página completa</TooltipContent>
          </Tooltip>
          <ShareButton callsign={r.callsign} variant="header" />
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
              >
                <MapPin className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>{t("maps")}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
