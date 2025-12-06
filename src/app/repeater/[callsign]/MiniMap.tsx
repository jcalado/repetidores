"use client";

import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useState, useCallback } from "react";
import { Maximize2, X } from "lucide-react";

// Repeater marker icon (blue)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// User marker icon (red)
const userMarkerIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Component to fit map bounds when user location is available
function FitBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [map, bounds]);
  return null;
}

// Component to invalidate map size when container changes
function InvalidateSize({ trigger }: { trigger: boolean }) {
  const map = useMap();
  useEffect(() => {
    // Small delay to let the DOM update
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map, trigger]);
  return null;
}

interface MiniMapProps {
  latitude: number;
  longitude: number;
  callsign: string;
  userLatitude?: number;
  userLongitude?: number;
}

export default function MiniMap({ latitude, longitude, callsign, userLatitude, userLongitude }: MiniMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Handle Escape key to exit fullscreen
  useEffect(() => {
    if (!isFullscreen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    // Prevent body scroll when fullscreen
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isFullscreen]);

  if (!latitude || !longitude) {
    return (
      <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
        <span className="text-muted-foreground text-sm">Coordenadas não disponíveis</span>
      </div>
    );
  }

  const hasUserLocation = typeof userLatitude === "number" && typeof userLongitude === "number";

  const mapContent = (
    <MapContainer
      center={[latitude, longitude]}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={isFullscreen}
      dragging={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {/* Repeater marker */}
      <Marker position={[latitude, longitude]} icon={markerIcon}>
        <Popup>
          <div className="text-center">
            <strong>{callsign}</strong>
            <br />
            <span className="text-xs text-gray-600">
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </span>
          </div>
        </Popup>
      </Marker>
      {/* User location marker and line */}
      {hasUserLocation && (
        <>
          <Polyline
            positions={[[userLatitude, userLongitude], [latitude, longitude]]}
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              opacity: 0.7,
              dashArray: '8, 8',
            }}
          />
          <Marker position={[userLatitude, userLongitude]} icon={userMarkerIcon}>
            <Popup>A sua localização</Popup>
          </Marker>
          <FitBounds bounds={[[userLatitude, userLongitude], [latitude, longitude]]} />
        </>
      )}
      <InvalidateSize trigger={isFullscreen} />
    </MapContainer>
  );

  if (isFullscreen) {
    return (
      <>
        {/* Placeholder to maintain layout */}
        <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
          <span className="text-muted-foreground text-sm">Mapa em ecrã completo</span>
        </div>
        {/* Fullscreen overlay */}
        <div className="fixed inset-0 z-50 bg-background">
          {/* Close button */}
          <button
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-[1000] p-2 bg-background/90 hover:bg-accent rounded-lg shadow-lg border transition-colors"
            aria-label="Fechar ecrã completo"
          >
            <X className="h-5 w-5" />
          </button>
          {/* Callsign label */}
          <div className="absolute top-4 left-4 z-[1000] px-3 py-2 bg-background/90 rounded-lg shadow-lg border">
            <span className="font-semibold">{callsign}</span>
          </div>
          {mapContent}
        </div>
      </>
    );
  }

  return (
    <div className="relative h-64 rounded-lg overflow-hidden border">
      {/* Expand button */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 z-[1000] p-2 bg-background/90 hover:bg-accent rounded-lg shadow-md border transition-colors"
        aria-label="Expandir mapa"
      >
        <Maximize2 className="h-4 w-4" />
      </button>
      {mapContent}
    </div>
  );
}
