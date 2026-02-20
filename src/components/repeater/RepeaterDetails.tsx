"use client";

import * as React from "react";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { getAllAutoStatus, type RepeaterAutoStatus } from "@/lib/auto-status";
import type { Repeater } from "./types";

import { RepeaterHeader } from "./RepeaterHeader";
import { FrequencySection } from "./FrequencySection";
import { LocationSection } from "./LocationSection";
import { TechnicalSpecsSection } from "./TechnicalSpecsSection";
import { DigitalModesSection } from "./DigitalModesSection";
import { NotesSection } from "./NotesSection";
import { OperationalStatusCard } from "./OperationalStatusCard";
import { CommunitySection } from "./community/CommunitySection";

interface RepeaterDetailsProps {
  r: Repeater;
}

/**
 * Main component displaying detailed information about a ham radio repeater.
 * Composes multiple focused section components.
 */
export default function RepeaterDetails({ r }: RepeaterDetailsProps) {
  const { userLocation } = useUserLocation();
  const [autoStatus, setAutoStatus] = React.useState<RepeaterAutoStatus | null>(null);

  React.useEffect(() => {
    getAllAutoStatus().then((data) => {
      const status = data[r.callsign];
      if (status) setAutoStatus(status);
    });
  }, [r.callsign]);

  return (
    <div className="space-y-3 sm:space-y-4">
      <RepeaterHeader repeater={r} />
      {r.status && r.status !== "unknown" && (
        <OperationalStatusCard status={r.status} lastVerified={r.lastVerified} />
      )}
      <CommunitySection repeaterId={r.callsign} />
      <FrequencySection repeater={r} />
      <LocationSection repeater={r} userLocation={userLocation} websiteUrl={r.website} />
      <TechnicalSpecsSection repeater={r} />
      <DigitalModesSection repeater={r} autoStatus={autoStatus} />
      <NotesSection notes={r.notes} />
    </div>
  );
}
