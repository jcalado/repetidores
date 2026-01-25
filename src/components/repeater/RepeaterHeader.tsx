"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Maximize2, Radio } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { ShareButton } from "./ShareButton";
import { getBandFromFrequency } from "./utils/formatters";
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
  const band = getBandFromFrequency(r.outputFrequency);
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-ship-cove-600 via-ship-cove-700 to-ship-cove-800 dark:from-ship-cove-800 dark:via-ship-cove-900 dark:to-ship-cove-950 p-4 shadow-lg shadow-ship-cove-500/20">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-sidebar" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M 24 0 L 0 0 0 24" fill="none" stroke="currentColor" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-sidebar)" className="text-white" />
        </svg>
      </div>

      {/* Decorative blur */}
      <div className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-ship-cove-500/20 blur-xl" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Callsign */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <Radio className="h-4 w-4 text-white" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-mono truncate">
              {r.callsign}
            </h3>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-xs font-medium backdrop-blur-sm">
              {band}
            </span>
            {r.modulation && (
              <span className="px-2 py-0.5 rounded-md bg-ship-cove-500/30 text-ship-cove-100 text-xs font-medium">
                {r.modulation.toUpperCase()}
              </span>
            )}
            {r.qth_locator && (
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white text-xs font-mono backdrop-blur-sm">
                {r.qth_locator}
              </span>
            )}
            {r.dmr && (
              <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-100 text-xs font-medium">
                DMR
              </span>
            )}
            {r.dstar && (
              <span className="px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-100 text-xs font-medium">
                D-STAR
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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
              >
                <MapPin className="h-4 w-4" />
              </a>
            </TooltipTrigger>
            <TooltipContent>{t("maps")}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Status LED */}
      <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse" />
    </div>
  );
}
