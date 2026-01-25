"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BearingIndicator } from "@/components/BearingCompass";
import { MapPin, Navigation, ChevronRight, Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SectionCard } from "./SectionCard";
import { InfoCard } from "./InfoCard";
import type { Repeater, UserLocation } from "./types";

interface LocationSectionProps {
  repeater: Repeater;
  userLocation: UserLocation | null;
}

/**
 * Location section displaying owner, coordinates, and bearing to repeater.
 */
export function LocationSection({ repeater: r, userLocation }: LocationSectionProps) {
  const t = useTranslations("repeater");

  const osmUrl =
    typeof r.latitude === "number" && typeof r.longitude === "number"
      ? `https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}&zoom=14`
      : undefined;

  const hasValidLocations = userLocation && r.latitude && r.longitude;

  return (
    <SectionCard icon={Navigation} title="Localização">
      <div className="space-y-2">
        {r.association ? (
          <Link
            href={`/association/${r.association.slug}/`}
            className="group flex items-center gap-3 rounded-lg p-2.5 sm:p-3 bg-ship-cove-50 dark:bg-ship-cove-900/50 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800/50 transition-colors"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
              <Building2 className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10px] sm:text-xs uppercase tracking-wider text-ship-cove-500 mb-0.5">
                {t("owner")}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-ship-cove-900 dark:text-ship-cove-100">
                  {r.association.abbreviation}
                </span>
                <span className="text-ship-cove-400">-</span>
                <span className="truncate text-ship-cove-600 dark:text-ship-cove-400">
                  {r.association.name}
                </span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-ship-cove-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Link>
        ) : (
          <InfoCard label={t("owner")} value={r.owner || "–"} />
        )}
        <InfoCard
          label={t("coordinates")}
          value={`${r.latitude?.toFixed(5)}, ${r.longitude?.toFixed(5)}`}
          right={
            osmUrl ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400 hover:bg-ship-cove-200 dark:hover:bg-ship-cove-700 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                  </a>
                </TooltipTrigger>
                <TooltipContent>Abrir no OpenStreetMap</TooltipContent>
              </Tooltip>
            ) : null
          }
        />
        {hasValidLocations && (
          <div className="rounded-lg bg-gradient-to-r from-ship-cove-100 to-ship-cove-50 dark:from-ship-cove-800/50 dark:to-ship-cove-900/30 p-2.5 sm:p-3 border border-ship-cove-200/50 dark:border-ship-cove-700/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-ship-cove-600 dark:text-ship-cove-400">
                Direção:
              </span>
              <BearingIndicator
                userLat={userLocation.latitude}
                userLon={userLocation.longitude}
                targetLat={r.latitude}
                targetLon={r.longitude}
              />
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
