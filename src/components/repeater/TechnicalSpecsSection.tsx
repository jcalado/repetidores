"use client";

import { Settings2 } from "lucide-react";
import { SectionCard } from "./SectionCard";
import type { Repeater } from "./types";

interface TechnicalSpecsSectionProps {
  repeater: Repeater;
}

/**
 * Technical specifications section displaying power, antenna, coverage, and hours.
 * Returns null if no technical data is available.
 */
export function TechnicalSpecsSection({ repeater: r }: TechnicalSpecsSectionProps) {
  if (!r.power && !r.antennaHeight && !r.coverage && !r.operatingHours) {
    return null;
  }

  return (
    <SectionCard icon={Settings2} title="Especificações Técnicas">
      <div className="grid grid-cols-2 gap-2">
        {r.power && (
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Potência
            </div>
            <div className="text-sm font-medium mt-0.5">{r.power}W</div>
          </div>
        )}
        {r.antennaHeight && (
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Antena
            </div>
            <div className="text-sm font-medium mt-0.5">{r.antennaHeight}m AGL</div>
          </div>
        )}
        {r.coverage && (
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Cobertura
            </div>
            <div className="text-sm font-medium mt-0.5 capitalize">{r.coverage}</div>
          </div>
        )}
        {r.operatingHours && (
          <div className="rounded-lg bg-muted/50 p-2.5">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Horário
            </div>
            <div className="text-sm font-medium mt-0.5">{r.operatingHours}</div>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
