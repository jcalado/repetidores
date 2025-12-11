"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BearingIndicator } from "@/components/BearingCompass";
import { MapPin, Navigation } from "lucide-react";
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
      <div className="space-y-3">
        {r.association ? (
          <Link
            href={`/association/${r.association.slug}`}
            className="rounded-lg border p-3 hover:bg-accent transition-colors block"
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("owner")}
            </div>
            <div className="mt-1 text-sm flex items-center gap-2">
              <span className="text-primary font-medium">{r.association.abbreviation}</span>
              <span className="text-muted-foreground">-</span>
              <span className="truncate">{r.association.name}</span>
            </div>
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
                  <Button variant="ghost" size="icon" asChild>
                    <a href={osmUrl} target="_blank" rel="noopener noreferrer">
                      <MapPin className="h-4 w-4" />
                    </a>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Abrir no OpenStreetMap</TooltipContent>
              </Tooltip>
            ) : null
          }
        />
        {hasValidLocations && (
          <div className="rounded-lg bg-gradient-to-r from-ship-cove-50 to-transparent dark:from-ship-cove-950/50 dark:to-transparent p-2 sm:p-3 border border-ship-cove-200/50 dark:border-ship-cove-800/50">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs sm:text-sm text-muted-foreground">Direção:</span>
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
