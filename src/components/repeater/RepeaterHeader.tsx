"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MapPin, Maximize2 } from "lucide-react";
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
 */
export function RepeaterHeader({ repeater: r }: RepeaterHeaderProps) {
  const t = useTranslations("repeater");
  const band = getBandFromFrequency(r.outputFrequency);
  const mapsUrl = `https://www.google.com/maps?q=${encodeURIComponent(r.latitude + "," + r.longitude)}`;

  return (
    <div className="flex items-start justify-between gap-2 sm:gap-3">
      <div>
        <h3 className="text-2xl font-semibold tracking-tight">{r.callsign}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="font-mono">
            {band}
          </Badge>
          {r.modulation && <Badge variant="outline">{r.modulation.toUpperCase()}</Badge>}
          {r.qth_locator && (
            <Badge variant="outline" className="font-mono text-xs">
              QTH {r.qth_locator}
            </Badge>
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
  );
}
