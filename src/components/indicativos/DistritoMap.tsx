"use client"

import { MapContainer, GeoJSON, useMap } from "react-leaflet"
import { useEffect, useRef } from "react"
import type { DistritoStats } from "@/types/distrito-stats"
import type { Feature, FeatureCollection } from "geojson"
import type L from "leaflet"
import "leaflet/dist/leaflet.css"

const COLOR_SCALE = [
  "#dde6f0", // azulejo-100
  "#84a4c7", // azulejo-300
  "#1d65a8", // azulejo-500
  "#0a467f", // azulejo-700
  "#052741", // azulejo-900
]

function getColor(value: number, breaks: number[]): string {
  for (let i = breaks.length - 1; i >= 0; i--) {
    if (value >= breaks[i]) return COLOR_SCALE[i]
  }
  return COLOR_SCALE[0]
}

function computeBreaks(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  if (n === 0) return [0, 0, 0, 0, 0]
  return [
    sorted[0],
    sorted[Math.floor(n * 0.25)] || 0,
    sorted[Math.floor(n * 0.5)] || 0,
    sorted[Math.floor(n * 0.75)] || 0,
    sorted[n - 1] || 0,
  ]
}

function FitBounds({ geojson }: { geojson: FeatureCollection }) {
  const map = useMap()
  useEffect(() => {
    import("leaflet").then((L) => {
      const layer = L.geoJSON(geojson)
      map.fitBounds(layer.getBounds(), { padding: [20, 20] })
    })
  }, [map, geojson])
  return null
}

function getDistritoName(feature: Feature): string {
  const props = feature.properties || {}
  return props.distrito || props.Distrito || props.NAME_1 || props.name || ""
}

interface DistritoMapProps {
  data: DistritoStats[]
  geojson: FeatureCollection
  highlightedDistrito: string | null
  onHover: (distrito: string | null) => void
}

export default function DistritoMap({ data, geojson, highlightedDistrito, onHover }: DistritoMapProps) {
  const statsMap = new Map(data.map((d) => [d.distrito, d]))
  const breaks = computeBreaks(data.map((d) => d.total))
  const geoJsonRef = useRef<L.GeoJSON | null>(null)

  function style(feature: Feature | undefined) {
    if (!feature) return {}
    const name = getDistritoName(feature)
    const stats = statsMap.get(name)
    const value = stats?.total || 0
    const isHighlighted = highlightedDistrito === name
    return {
      fillColor: getColor(value, breaks),
      weight: isHighlighted ? 2 : 1,
      opacity: 1,
      color: isHighlighted ? "#0a467f" : "#84a4c7", // azulejo-700 / azulejo-300
      fillOpacity: isHighlighted ? 0.9 : 0.7,
    }
  }

  function onEachFeature(feature: Feature, layer: L.Layer) {
    const name = getDistritoName(feature)
    const stats = statsMap.get(name)

    layer.on({
      mouseover: () => onHover(name),
      mouseout: () => onHover(null),
    })

    if (stats) {
      layer.bindTooltip(
        `<strong>${name}</strong><br/>Total: ${stats.total.toLocaleString("pt-PT")}<br/>Activos: ${stats.active.toLocaleString("pt-PT")}`,
        { sticky: true },
      )
    }
  }

  useEffect(() => {
    if (geoJsonRef.current) {
      geoJsonRef.current.setStyle((feature) => style(feature as Feature))
    }
  }, [highlightedDistrito])

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <MapContainer
        center={[39.5, -8]}
        zoom={7}
        style={{ height: "500px", width: "100%" }}
        scrollWheelZoom={false}
        className="bg-muted"
      >
        <FitBounds geojson={geojson} />
        <GeoJSON
          ref={geoJsonRef}
          data={geojson}
          style={style}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {/* Legend */}
      <div className="flex items-center justify-between px-3 py-2 bg-card border-t border-border text-[10px] text-muted-foreground">
        <span>{breaks[0]?.toLocaleString("pt-PT")}</span>
        <div className="flex gap-0.5">
          {COLOR_SCALE.map((color, i) => (
            <div key={i} className="h-3 w-6 rounded-sm" style={{ backgroundColor: color }} />
          ))}
        </div>
        <span>{breaks[4]?.toLocaleString("pt-PT")}</span>
      </div>
    </div>
  )
}
