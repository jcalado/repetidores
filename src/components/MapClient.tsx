
"use client";

import dynamic from 'next/dynamic';
import type { Repeater } from "@/app/columns";
import type { UserLocation } from "@/lib/geolocation";

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type Props = {
  repeaters: Repeater[]
  onRepeaterClick?: (repeater: Repeater) => void
  userLocation?: UserLocation | null
  radiusKm?: number | null
};

const MapClient = ({ repeaters, onRepeaterClick, userLocation, radiusKm }: Props) => {
  return (
    <MapView
      repeaters={repeaters}
      onRepeaterClick={onRepeaterClick}
      userLocation={userLocation}
      radiusKm={radiusKm}
    />
  );
};

export default MapClient;
