
"use client";

import dynamic from 'next/dynamic';
import type { Repeater } from "@/app/columns";
import type { UserLocation } from "@/contexts/UserLocationContext";

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type Props = {
  repeaters: Repeater[]
  onRepeaterClick?: (repeater: Repeater) => void
  userLocation?: UserLocation | null
  radiusKm?: number | null
  /** Delegated to the shared UserLocationContext by the caller. */
  onLocate?: () => void
  isLocating?: boolean
  locationError?: string | null
  onClearFilters?: () => void
};

const MapClient = ({
  repeaters,
  onRepeaterClick,
  userLocation,
  radiusKm,
  onLocate,
  isLocating,
  locationError,
  onClearFilters,
}: Props) => {
  return (
    <MapView
      repeaters={repeaters}
      onRepeaterClick={onRepeaterClick}
      userLocation={userLocation}
      radiusKm={radiusKm}
      onLocate={onLocate}
      isLocating={isLocating}
      locationError={locationError}
      onClearFilters={onClearFilters}
    />
  );
};

export default MapClient;
