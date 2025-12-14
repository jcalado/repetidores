"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { LOSStatus } from "@/lib/line-of-sight";

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Polyline = dynamic(
  () => import("react-leaflet").then((mod) => mod.Polyline),
  { ssr: false }
);
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
});

interface LOSMiniMapProps {
  startPosition: { latitude: number; longitude: number };
  endPosition: { latitude: number; longitude: number };
  status: LOSStatus;
  startLabel?: string;
  endLabel?: string;
}

export default function LOSMiniMap({
  startPosition,
  endPosition,
  status,
  startLabel = "Sua posicao",
  endLabel = "Alvo",
}: LOSMiniMapProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate bounds to fit both points
  const bounds = React.useMemo(() => {
    const latPadding =
      Math.abs(startPosition.latitude - endPosition.latitude) * 0.2 || 0.01;
    const lonPadding =
      Math.abs(startPosition.longitude - endPosition.longitude) * 0.2 || 0.01;

    return [
      [
        Math.min(startPosition.latitude, endPosition.latitude) - latPadding,
        Math.min(startPosition.longitude, endPosition.longitude) - lonPadding,
      ],
      [
        Math.max(startPosition.latitude, endPosition.latitude) + latPadding,
        Math.max(startPosition.longitude, endPosition.longitude) + lonPadding,
      ],
    ] as [[number, number], [number, number]];
  }, [startPosition, endPosition]);

  // Line color based on status
  const lineColor = {
    clear: "#22c55e",
    marginal: "#eab308",
    blocked: "#ef4444",
  }[status];

  if (!isMounted) {
    return (
      <div className="w-full h-[250px] bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground">A carregar mapa...</span>
      </div>
    );
  }

  return (
    <div className="w-full h-[250px] rounded-lg overflow-hidden border">
      <MapContainer
        bounds={bounds}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Path line */}
        <Polyline
          positions={[
            [startPosition.latitude, startPosition.longitude],
            [endPosition.latitude, endPosition.longitude],
          ]}
          pathOptions={{
            color: lineColor,
            weight: 3,
            opacity: 0.8,
            dashArray: "10, 10",
          }}
        />

        {/* Start marker (user position) */}
        <Marker position={[startPosition.latitude, startPosition.longitude]}>
          <Popup>{startLabel}</Popup>
        </Marker>

        {/* End marker (target position) */}
        <Marker position={[endPosition.latitude, endPosition.longitude]}>
          <Popup>{endLabel}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
