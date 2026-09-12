"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
// The context type, not lib/geolocation's narrower pair: the map shows the
// approximate-position note, which only the context carries.
import type { UserLocation } from "@/contexts/UserLocationContext";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { useTranslations } from 'next-intl';
import { Crosshair, Layers, Maximize2, Minimize2, Scan } from 'lucide-react';
import type { Repeater } from "@/app/columns";
import { calculateDistance } from "@/lib/geolocation";
import {
  modeMarkerStyle,
  primaryMarkerMode,
  type MarkerMode,
} from "@/lib/mode-markers";
import {
  CallsignText,
  DistanceText,
  FavoriteButton,
  ModeBadges,
  OwnerCell,
  StatusCell,
  getAllFrequencyPairs,
  resolveMergedStatus,
  useRepeaterStatusData,
  type MergedStatusTone,
} from "@/components/repeater/RepeaterCells";

type Props = {
  repeaters: Repeater[]
  onRepeaterClick?: (repeater: Repeater) => void
  userLocation?: UserLocation | null
  radiusKm?: number | null
  /** Delegates to the shared UserLocationContext. The map must not run its own
   *  geolocation: a location found here has to reach the distance filter, the
   *  distance column and the radius circle, all of which read the context. */
  onLocate?: () => void
  isLocating?: boolean
  locationError?: string | null
  /** Clears every active filter from the empty state. */
  onClearFilters?: () => void
}

// Map state persistence keys
const MAP_STATE_KEY = 'repetidores_map_state';
const MAP_LAYER_KEY = 'repetidores_map_layer';

/** Tile sources. `labelKey` indexes map.layers.* so the names are translatable;
 *  the URLs and attributions are not copy and stay put. */
const TILE_LAYERS = {
  osm: {
    labelKey: 'osm',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    labelKey: 'satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  terrain: {
    labelKey: 'terrain',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
  },
  dark: {
    labelKey: 'dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
} as const;

type TileLayerKey = keyof typeof TILE_LAYERS;
const TILE_LAYER_KEYS = Object.keys(TILE_LAYERS) as TileLayerKey[];

interface MapState {
  center: [number, number]
  zoom: number
}

function getStoredMapState(): MapState | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(MAP_STATE_KEY);
    if (stored) {
      return JSON.parse(stored) as MapState;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveMapState(state: MapState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAP_STATE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

function getStoredLayer(): TileLayerKey {
  if (typeof window === 'undefined') return 'osm';
  try {
    const stored = localStorage.getItem(MAP_LAYER_KEY);
    if (stored && stored in TILE_LAYERS) {
      return stored as TileLayerKey;
    }
  } catch {
    // Ignore errors
  }
  return 'osm';
}

function saveLayer(layer: TileLayerKey) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(MAP_LAYER_KEY, layer);
  } catch {
    // Ignore errors
  }
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/* --------------------------------------------------------------- markers */

// Markers are inline SVG, not hotlinked PNGs. The old icons pulled from unpkg
// and raw.githubusercontent.com, which is not a CDN, rate-limits, and left the
// map pinless offline even though this app ships a service worker and a PWA
// manifest. These cost no requests and work in the installed app.
//
// The pin body carries the MODE (colour + lucide glyph, from lib/mode-markers),
// and the status rides in a corner badge. Mode is what a map is scanned for, and
// the chip strip directly above the map uses the same hue and glyph per mode, so
// it doubles as the legend.
//
// Colours are fixed rather than theme-tokened on purpose: a pin sits on map
// tiles, not on the app background, and the white stroke is what keeps it
// legible across the light, dark and satellite layers alike.

/** Status badge fill per merged-status tone. */
const STATUS_DOT: Record<MergedStatusTone, string | null> = {
  success: '#10b981',
  warning: '#f59e0b',
  destructive: '#dc2626',
  // "Sem dados" gets no badge: an empty corner is quieter than a grey dot on
  // every pin, and the popup and alt text still say the status.
  neutral: null,
};

function pinSvg(fill: string, glyph: string, statusDot: string | null): string {
  return (
    `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<path d="M15 2C8.9 2 4 6.9 4 13c0 8.2 9.6 22.2 10.1 22.8a1.1 1.1 0 0 0 1.8 0C16.4 35.2 26 21.2 26 13 26 6.9 21.1 2 15 2z" fill="${fill}" stroke="#ffffff" stroke-width="2"/>` +
    (glyph
      ? `<g transform="translate(8 6) scale(0.583)" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>`
      : '') +
    (statusDot
      ? `<circle cx="24" cy="7" r="4.5" fill="${statusDot}" stroke="#ffffff" stroke-width="2"/>`
      : '') +
    `</svg>`
  );
}

const pinIconCache = new Map<string, L.DivIcon>();

function pinIcon(mode: MarkerMode | null, tone: MergedStatusTone): L.DivIcon {
  const key = `${mode ?? 'none'}:${tone}`;
  const cached = pinIconCache.get(key);
  if (cached) return cached;
  const { fill, glyph } = modeMarkerStyle(mode);
  const icon = L.divIcon({
    html: pinSvg(fill, glyph, STATUS_DOT[tone]),
    className: 'repeater-pin',
    iconSize: [30, 40],
    iconAnchor: [15, 39],
    popupAnchor: [0, -35],
  });
  pinIconCache.set(key, icon);
  return icon;
}

// A disc, deliberately not a teardrop. The old user marker was the same red pin
// as an offline repeater, so "you are here" and "this repeater is down" were
// indistinguishable. Shape separates them before colour does.
const userIcon = L.divIcon({
  html:
    `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">` +
    `<circle cx="14" cy="14" r="13" fill="#1d65a8" fill-opacity="0.18"/>` +
    `<circle cx="14" cy="14" r="6.5" fill="#1d65a8" stroke="#ffffff" stroke-width="2.5"/>` +
    `</svg>`,
  className: 'user-location-dot',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -12],
});

// Azulejo 300 -> 500 -> 700 by cluster size, as DESIGN.md section 5 specifies.
// The old version painted every cluster the same 500 regardless of count.
function createClusterCustomIcon(cluster: { getChildCount: () => number }) {
  const count = cluster.getChildCount();
  const bucket = count >= 100 ? 'large' : count >= 10 ? 'medium' : 'small';
  const dimensions = count >= 100 ? 50 : count >= 10 ? 40 : 32;

  return L.divIcon({
    html: `<div class="cluster-icon cluster-${bucket}"><span>${count}</span></div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(dimensions, dimensions, true),
  });
}

/* ------------------------------------------------------------- map hooks */

/** Persists centre and zoom, and centres on the user the first time a location
 *  arrives with no saved view to respect. */
function MapStatePersistence({ userLocation }: { userLocation?: [number, number] | null }) {
  const map = useMap();
  const hasPositionedRef = useRef(false);
  const hadSavedStateRef = useRef(false);

  useEffect(() => {
    const savedState = getStoredMapState();
    hadSavedStateRef.current = !!savedState;

    if (savedState) {
      map.setView(savedState.center, savedState.zoom);
      hasPositionedRef.current = true;
    }
  }, [map]);

  useEffect(() => {
    if (hasPositionedRef.current) return;
    if (!userLocation) return;
    if (hadSavedStateRef.current) return;

    map.setView(userLocation, 10);
    hasPositionedRef.current = true;
  }, [map, userLocation]);

  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      saveMapState({ center: [center.lat, center.lng], zoom });
    };

    map.on('moveend', handleMoveEnd);
    map.on('zoomend', handleMoveEnd);

    return () => {
      map.off('moveend', handleMoveEnd);
      map.off('zoomend', handleMoveEnd);
    };
  }, [map]);

  return null;
}

/**
 * Frames the filtered results. Filtering to four DMR repeaters in the Algarve
 * used to leave the map wherever it was, so the operator had to go hunting for
 * their own result set; this moves the map to the answer.
 *
 * Deliberately inert on first render, so it never overrides a restored view, and
 * inert when nothing is filtered, since the unfiltered set is the whole country
 * and that is already the default framing.
 */
function FitToResults({
  signature,
  points,
  active,
  onMapReady,
}: {
  signature: string
  points: [number, number][]
  active: boolean
  onMapReady: (map: L.Map) => void
}) {
  const map = useMap();
  const isFirstRun = useRef(true);

  useEffect(() => {
    onMapReady(map);
  }, [map, onMapReady]);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    if (!active || points.length === 0) return;

    map.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 13,
      animate: !prefersReducedMotion(),
    });
    // `signature` is the dependency that matters: it changes only when the result
    // set does. `points` is a fresh array every render and would refit forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, active, map]);

  return null;
}

// Component to invalidate map size
function MapSizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const id = setTimeout(invalidate, 100);
    window.addEventListener('resize', invalidate);

    const handleFullscreen = () => {
      setTimeout(invalidate, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreen);

    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', invalidate);
      document.removeEventListener('fullscreenchange', handleFullscreen);
    };
  }, [map]);

  return null;
}

/* ------------------------------------------------------------- controls */

const CONTROL_BUTTON =
  "inline-flex items-center justify-center rounded-md border border-border bg-popover text-foreground shadow-md transition-colors duration-150 ease-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 motion-reduce:transition-none";

/**
 * Layer picker. Previously this built its markup with innerHTML inside an effect,
 * re-created the whole control on every toggle and attached listeners through a
 * setTimeout(0), which left it unreachable by keyboard. It is a plain React
 * overlay now: it sits beside the map rather than inside it, so Leaflet never
 * sees the clicks and no propagation plumbing is needed.
 */
function LayerControl({
  currentLayer,
  onLayerChange,
}: {
  currentLayer: TileLayerKey
  onLayerChange: (layer: TileLayerKey) => void
}) {
  const t = useTranslations('map');
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="absolute right-4 top-16 z-[1000]">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t('layers.label')}
        className={`${CONTROL_BUTTON} h-10 gap-2 px-3 text-sm font-medium`}
      >
        <Layers className="size-4" aria-hidden />
        <span className="hidden sm:inline">{t(`layers.${TILE_LAYERS[currentLayer].labelKey}`)}</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-label={t('layers.label')}
          className="mt-1 min-w-[10rem] overflow-hidden rounded-md border border-border bg-popover shadow-md"
        >
          {TILE_LAYER_KEYS.map((key) => {
            const isCurrent = key === currentLayer;
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={isCurrent}
                onClick={() => {
                  onLayerChange(key);
                  saveLayer(key);
                  setIsOpen(false);
                }}
                className={`block w-full px-3 py-2 text-left text-sm transition-colors duration-150 ease-out hover:bg-accent focus-visible:outline-none focus-visible:bg-accent motion-reduce:transition-none ${
                  isCurrent
                    ? 'bg-azulejo-50 font-medium text-azulejo-700 dark:bg-azulejo-950/40 dark:text-azulejo-300'
                    : 'text-foreground'
                }`}
              >
                {t(`layers.${TILE_LAYERS[key].labelKey}`)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FullscreenButton({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  const t = useTranslations('map');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const label = isFullscreen ? t('fullscreenExit') : t('fullscreenEnter');

  return (
    <button
      type="button"
      onClick={toggleFullscreen}
      className={`${CONTROL_BUTTON} absolute right-4 top-4 z-[1000] size-10`}
      aria-label={label}
      title={label}
    >
      {isFullscreen ? (
        <Minimize2 className="size-5" aria-hidden />
      ) : (
        <Maximize2 className="size-5" aria-hidden />
      )}
    </button>
  );
}

/* ----------------------------------------------------------------- view */

const MapView = ({
  repeaters,
  onRepeaterClick,
  userLocation: externalUserLocation,
  radiusKm,
  onLocate,
  isLocating = false,
  locationError,
  onClearFilters,
}: Props) => {
  const t = useTranslations('map');
  const tStatus = useTranslations('table.statusCell');
  const tCard = useTranslations('table.card');
  const tColumns = useTranslations('table.columns');
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentLayer, setCurrentLayer] = useState<TileLayerKey>(() => getStoredLayer());

  // One source of truth. The map used to run its own navigator.geolocation call
  // into local state, so a location found from the map's own button never
  // reached the distance filter, the radius circle or the table's distance
  // column. It delegates to the shared context now.
  const userLocation = externalUserLocation
    ? ([externalUserLocation.latitude, externalUserLocation.longitude] as [number, number])
    : null;

  const { voteStats, autoStatus } = useRepeaterStatusData();

  const points = useMemo(
    () => repeaters.map((r) => [r.latitude, r.longitude] as [number, number]),
    [repeaters]
  );

  // Cheap, order-sensitive digest of the result set, so FitToResults reframes
  // when the filters change and not on every render.
  const signature = useMemo(() => {
    let hash = 0;
    for (const repeater of repeaters) {
      for (let i = 0; i < repeater.callsign.length; i++) {
        hash = (hash * 31 + repeater.callsign.charCodeAt(i)) | 0;
      }
    }
    return `${repeaters.length}:${hash}`;
  }, [repeaters]);

  const handleMapReady = useCallback((map: L.Map) => {
    mapRef.current = map;
  }, []);

  const fitNow = useCallback(() => {
    if (!mapRef.current || points.length === 0) return;
    mapRef.current.fitBounds(L.latLngBounds(points), {
      padding: [48, 48],
      maxZoom: 13,
      animate: !prefersReducedMotion(),
    });
  }, [points]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl border border-border"
      role="region"
      aria-label={t('regionLabel')}
    >
      <style>{`
        .custom-marker-cluster,
        .repeater-pin,
        .user-location-dot {
          background: transparent;
          border: 0;
        }
        .cluster-icon {
          /* Fill the square divIcon box rather than shrink-wrapping the number:
             without this the div sizes to its text, so a three-digit cluster came
             out wider than tall and the "circle" read as an oval. border-box keeps
             the 3px ring inside those dimensions. */
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          aspect-ratio: 1 / 1;
          border: 3px solid #ffffff;
          border-radius: 50%;
          color: #ffffff;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          /* Cool ink shadow at hue 250, never pure black (DESIGN.md). */
          box-shadow: 0 2px 8px oklch(0.20 0.012 250 / 0.35);
        }
        /* Azulejo 300 / 500 / 700 by size. */
        .cluster-small  { background: #84a4c7; color: #052741; font-size: 12px; }
        .cluster-medium { background: #1d65a8; font-size: 14px; }
        .cluster-large  { background: #0a467f; font-size: 16px; }

        /* Popups are app surfaces, so they follow the theme tokens. The previous
           version hardcoded light-mode hexes and was unreadable in dark mode. */
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: var(--color-popover);
          color: var(--color-popover-foreground);
          border: 1px solid var(--color-border);
          box-shadow: 0 4px 16px oklch(0.20 0.012 250 / 0.18);
        }
        .leaflet-popup-content-wrapper { border-radius: 0.75rem; }
        .leaflet-popup-content { margin: 0.75rem; min-width: 12rem; }
        .leaflet-popup-close-button { color: var(--color-muted-foreground) !important; }
        .leaflet-container a.leaflet-popup-close-button:hover { color: var(--color-foreground) !important; }
        .leaflet-bar a, .leaflet-control-attribution {
          background: var(--color-popover);
          color: var(--color-popover-foreground);
        }
        .leaflet-control-attribution a { color: var(--color-muted-foreground); }
      `}</style>

      <FullscreenButton containerRef={containerRef} />
      <LayerControl currentLayer={currentLayer} onLayerChange={setCurrentLayer} />

      <MapContainer
        center={[39.694444, -8.130556]}
        zoom={6}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <MapSizeInvalidator />
        <FitToResults
          signature={signature}
          points={points}
          active={repeaters.length > 0}
          onMapReady={handleMapReady}
        />
        <TileLayer
          key={currentLayer}
          url={TILE_LAYERS[currentLayer].url}
          attribution={TILE_LAYERS[currentLayer].attribution}
        />
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          iconCreateFunction={createClusterCustomIcon}
        >
          {repeaters.map((repeater) => {
            const status = resolveMergedStatus({
              repeater,
              auto: autoStatus[repeater.callsign],
              votes: voteStats[repeater.callsign],
            });
            const statusLabel = tStatus(status.key);
            // Primary first, then the rest: a dual-mode repeater's second pair is
            // as real as its first and the popup is where an operator reads it off.
            const markerMode = primaryMarkerMode(repeater.modes);
            const pairs = getAllFrequencyPairs(repeater);
            const distanceKm = userLocation
              ? calculateDistance(
                  userLocation[0],
                  userLocation[1],
                  repeater.latitude,
                  repeater.longitude,
                )
              : null;

            return (
              <Marker
                key={repeater.callsign}
                position={[repeater.latitude, repeater.longitude]}
                icon={pinIcon(markerMode, status.tone)}
                alt={
                  // The pin's colour and glyph say the mode, so the accessible
                  // name has to say it in words as well.
                  markerMode
                    ? t('markerLabel', {
                        callsign: repeater.callsign,
                        mode: markerMode === 'DSTAR' ? 'D-STAR' : markerMode,
                        status: statusLabel,
                      })
                    : t('markerLabelNoMode', {
                        callsign: repeater.callsign,
                        status: statusLabel,
                      })
                }
              >
                {/* Clicking a marker opens this popup and nothing else. It used to
                    also fire onRepeaterClick, so one click opened the drawer AND a
                    popup behind it. The popup is the peek; its button is the drawer. */}
                <Popup>
                  <div className="min-w-[14rem] max-w-[17rem]">
                    <div className="flex items-start justify-between gap-2">
                      <CallsignText
                        callsign={repeater.callsign}
                        className="text-base font-semibold"
                      />
                      <FavoriteButton callsign={repeater.callsign} />
                    </div>

                    {/* The same status cell the table and the cards use, with its
                        source and timestamp: PRODUCT.md wants staleness visible
                        wherever a status is claimed, and a map pin claims one. */}
                    <StatusCell
                      repeater={repeater}
                      labelMode="always"
                      showSource
                      className="mt-1.5"
                    />

                    {/* EVERY frequency pair, not just the primary one. A dual-mode
                        repeater showing a single pair is the bug the table fixed. */}
                    <dl className="mt-2.5 space-y-1 border-t border-border pt-2.5 text-sm">
                      {pairs.map((pair, index) => (
                        <Fragment key={`${pair.outputFrequency}-${index}`}>
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground">
                              {index === 0 ? tCard("rx") : `${tCard("rx")} ${index + 1}`}
                            </dt>
                            <dd className="font-mono tabular-nums">
                              {pair.outputFrequency.toFixed(3)}
                            </dd>
                          </div>
                          {pair.inputFrequency ? (
                            <div className="flex items-baseline justify-between gap-3">
                              <dt className="text-xs text-muted-foreground">
                                {index === 0 ? tCard("tx") : `${tCard("tx")} ${index + 1}`}
                              </dt>
                              <dd className="font-mono tabular-nums">
                                {pair.inputFrequency.toFixed(3)}
                              </dd>
                            </div>
                          ) : null}
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground">{tCard("tone")}</dt>
                            <dd className="font-mono tabular-nums">
                              {pair.tone ? pair.tone.toFixed(1) : tCard("noTone")}
                            </dd>
                          </div>
                        </Fragment>
                      ))}
                    </dl>

                    <div className="mt-2.5 border-t border-border pt-2.5">
                      <ModeBadges repeater={repeater} />

                      <dl className="mt-2 space-y-1 text-sm">
                        {repeater.qthLocator && (
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground">
                              {tColumns("qthLocator")}
                            </dt>
                            <dd className="font-mono">{repeater.qthLocator}</dd>
                          </div>
                        )}
                        {distanceKm !== null && (
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground">
                              {tColumns("distance")}
                            </dt>
                            <dd>
                              <DistanceText km={distanceKm} />
                            </dd>
                          </div>
                        )}
                        {(repeater.association || repeater.owner) && (
                          <div className="flex items-baseline justify-between gap-3">
                            <dt className="text-xs text-muted-foreground">
                              {tColumns("owner")}
                            </dt>
                            <dd className="text-right">
                              <OwnerCell repeater={repeater} />
                            </dd>
                          </div>
                        )}
                      </dl>
                    </div>

                    {onRepeaterClick && (
                      <button
                        type="button"
                        onClick={() => onRepeaterClick(repeater)}
                        className="mt-3 w-full rounded-lg bg-azulejo-600 px-2 py-2 text-xs font-medium text-white transition-colors duration-150 ease-out hover:bg-azulejo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 motion-reduce:transition-none"
                      >
                        {t('popupDetails')}
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

        {userLocation && radiusKm && radiusKm > 0 && (
          <Circle
            center={userLocation}
            radius={radiusKm * 1000}
            pathOptions={{
              color: '#1d65a8',
              fillColor: '#1d65a8',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}

        {userLocation && (
          <Marker position={userLocation} icon={userIcon} alt={t('userMarker')}>
            <Popup>
              <div className="text-sm font-medium">{t('userMarker')}</div>
              {externalUserLocation?.isApproximate && (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t('userMarkerApproximate')}
                </div>
              )}
              {radiusKm ? (
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t('radiusLabel', { km: radiusKm })}
                </div>
              ) : null}
            </Popup>
          </Marker>
        )}

        <MapStatePersistence userLocation={userLocation} />
      </MapContainer>

      {/* Bottom-right control stack */}
      <div className="absolute bottom-4 right-4 z-[1000] flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={fitNow}
          disabled={repeaters.length === 0}
          className={`${CONTROL_BUTTON} size-12 disabled:opacity-50`}
          aria-label={repeaters.length === 0 ? t('fitBoundsEmpty') : t('fitBounds')}
          title={repeaters.length === 0 ? t('fitBoundsEmpty') : t('fitBounds')}
        >
          <Scan className="size-5" aria-hidden />
        </button>

        {onLocate && (
          <button
            type="button"
            onClick={onLocate}
            disabled={isLocating}
            className={`${CONTROL_BUTTON} size-14 rounded-full disabled:opacity-70`}
            aria-label={t('userMarker')}
            title={t('userMarker')}
          >
            <Crosshair
              className={`size-6 ${isLocating ? 'animate-spin text-azulejo-600 motion-reduce:animate-none' : ''}`}
              aria-hidden
            />
          </button>
        )}
      </div>

      {locationError && (
        <div
          role="alert"
          className="absolute bottom-4 left-4 right-20 z-[1000] rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive shadow-lg"
        >
          {locationError}
        </div>
      )}

      {/* Result count, and the way out when the filters emptied the map. */}
      {repeaters.length === 0 ? (
        <div className="absolute inset-x-4 top-1/2 z-[1000] mx-auto max-w-sm -translate-y-1/2 rounded-xl border border-border bg-popover p-4 text-center shadow-lg">
          <p className="text-sm font-medium text-foreground">{t('emptyTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('emptyBody')}</p>
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="mt-3 inline-flex h-9 items-center rounded-md border border-border px-3 text-sm font-medium transition-colors duration-150 ease-out hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 motion-reduce:transition-none"
            >
              {t('emptyAction')}
            </button>
          )}
        </div>
      ) : (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-4 left-4 z-[1000] rounded-full border border-border bg-background/95 px-3 py-1.5 text-sm tabular-nums text-foreground"
        >
          {t('count', { count: repeaters.length })}
        </div>
      )}
    </div>
  );
};

export default MapView;
