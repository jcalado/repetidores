"use client";

import { useUserLocation } from "@/contexts/UserLocationContext";
import type { Repeater } from "./types";

import { RepeaterHeader } from "./RepeaterHeader";
import { FrequencySection } from "./FrequencySection";
import { LocationSection } from "./LocationSection";
import { TechnicalSpecsSection } from "./TechnicalSpecsSection";
import { DigitalModesSection } from "./DigitalModesSection";
import { NotesSection } from "./NotesSection";
import { WebsiteLink } from "./WebsiteLink";
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

  return (
    <div className="space-y-3 sm:space-y-4">
      <RepeaterHeader repeater={r} />
      <FrequencySection repeater={r} />
      <LocationSection repeater={r} userLocation={userLocation} />
      <TechnicalSpecsSection repeater={r} />
      <DigitalModesSection repeater={r} />
      <NotesSection notes={r.notes} />
      <WebsiteLink url={r.website} />
      {r.status && r.status !== "unknown" && (
        <OperationalStatusCard status={r.status} lastVerified={r.lastVerified} />
      )}
      <CommunitySection repeaterId={r.callsign} />
    </div>
  );
}
