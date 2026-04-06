"use client"

import "leaflet/dist/leaflet.css"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import MarkerClusterGroup from "react-leaflet-cluster"
import L from "leaflet"
import type { SimplexFrequency } from "@/types/simplex-frequency"
import { useTranslations } from "next-intl"

const MODE_COLORS: Record<string, string> = {
  FM: "bg-blue-100 text-blue-800",
  DMR: "bg-purple-100 text-purple-800",
  "D-STAR": "bg-cyan-100 text-cyan-800",
  C4FM: "bg-rose-100 text-rose-800",
}

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
})

const defaultIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

type Props = {
  frequencies: SimplexFrequency[]
  onFrequencyClick?: (frequency: SimplexFrequency) => void
}

const SimplexMapView = ({ frequencies, onFrequencyClick }: Props) => {
  const t = useTranslations("simplex")

  return (
    <div className="relative h-full w-full" style={{ minHeight: "500px" }}>
      <MapContainer
        center={[39.5, -8.0]}
        zoom={7}
        style={{ height: "100%", width: "100%", zIndex: 0, minHeight: "500px" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <MarkerClusterGroup chunkedLoading maxClusterRadius={50} spiderfyOnMaxZoom showCoverageOnHover={false}>
          {frequencies.map((freq) => (
            <Marker
              key={freq.id}
              position={[freq.latitude, freq.longitude]}
              icon={defaultIcon}
              eventHandlers={{
                click: () => onFrequencyClick?.(freq),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-bold text-base font-mono">{freq.frequency.toFixed(4)} MHz</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {freq.municipality}, {freq.district}
                  </div>
                  <div className="text-sm mt-0.5">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs ${MODE_COLORS[freq.mode] || "bg-blue-100 text-blue-800"}`}>{freq.mode}</span>
                    {freq.band && (
                      <span className="ml-1 inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700">{freq.band}</span>
                    )}
                  </div>
                  {freq.tone && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      {t("tone")}: {freq.tone} Hz
                    </div>
                  )}
                  {onFrequencyClick && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onFrequencyClick(freq)
                      }}
                      className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 transition-colors"
                    >
                      {t("viewDetails")}
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Frequency count badge */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-sm text-gray-700 border border-gray-200">
        {frequencies.length} {t("frequencies")}
      </div>
    </div>
  )
}

export default SimplexMapView
