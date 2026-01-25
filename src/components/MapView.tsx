
"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type { UserLocation } from "@/lib/geolocation";
import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Repeater } from "@/app/columns";

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Default blue icon for repeaters
const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for user location
const userIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom icon for offline repeaters
const offlineIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Props = {
  repeaters: Repeater[]
  onRepeaterClick?: (repeater: Repeater) => void
  userLocation?: UserLocation | null
  radiusKm?: number | null
};

// Map state persistence keys
const MAP_STATE_KEY = 'repetidores_map_state';
const MAP_LAYER_KEY = 'repetidores_map_layer';

// Available tile layers
const TILE_LAYERS = {
  osm: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    name: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
  terrain: {
    name: 'Terreno',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: 'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
  },
  dark: {
    name: 'Escuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
  },
} as const;

type TileLayerKey = keyof typeof TILE_LAYERS;

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

// Layer control component
function LayerControl({
  currentLayer,
  onLayerChange
}: {
  currentLayer: TileLayerKey
  onLayerChange: (layer: TileLayerKey) => void
}) {
  const map = useMap();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Create layer control container
    const controlContainer = L.DomUtil.create('div', 'leaflet-control-layers-custom');
    controlContainer.style.position = 'absolute';
    controlContainer.style.top = '80px';
    controlContainer.style.right = '10px';
    controlContainer.style.zIndex = '1000';

    const updateControl = () => {
      controlContainer.innerHTML = `
        <div class="bg-white rounded-md shadow-md border border-gray-300">
          <button class="layer-toggle px-3 py-2 text-sm font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-50 rounded-md transition-colors">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
            </svg>
            ${TILE_LAYERS[currentLayer].name}
          </button>
          ${isOpen ? `
            <div class="border-t border-gray-200">
              ${(Object.keys(TILE_LAYERS) as TileLayerKey[]).map(key => `
                <button
                  class="layer-option w-full px-3 py-2 text-sm text-left hover:bg-gray-50 ${key === currentLayer ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}"
                  data-layer="${key}"
                >
                  ${TILE_LAYERS[key].name}
                </button>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `;
    };

    updateControl();

    // Event handlers
    const handleToggleClick = (e: Event) => {
      e.stopPropagation();
      setIsOpen(prev => !prev);
    };

    const handleLayerClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const layer = target.getAttribute('data-layer') as TileLayerKey;
      if (layer) {
        onLayerChange(layer);
        saveLayer(layer);
        setIsOpen(false);
      }
    };

    // Add event listeners after DOM update
    setTimeout(() => {
      const toggleBtn = controlContainer.querySelector('.layer-toggle');
      const layerBtns = controlContainer.querySelectorAll('.layer-option');

      if (toggleBtn) {
        L.DomEvent.disableClickPropagation(toggleBtn as HTMLElement);
        toggleBtn.addEventListener('click', handleToggleClick);
      }

      layerBtns.forEach(btn => {
        L.DomEvent.disableClickPropagation(btn as HTMLElement);
        btn.addEventListener('click', handleLayerClick);
      });
    }, 0);

    const mapContainer = map.getContainer();
    mapContainer.appendChild(controlContainer);

    return () => {
      if (mapContainer.contains(controlContainer)) {
        mapContainer.removeChild(controlContainer);
      }
    };
  }, [map, currentLayer, isOpen, onLayerChange]);

  return null;
}

// Component to persist map state and center on user location
function MapStatePersistence({ userLocation }: { userLocation?: [number, number] | null }) {
  const map = useMap();
  const hasPositionedRef = useRef(false);
  const hadSavedStateRef = useRef(false);

  // Initial positioning effect
  useEffect(() => {
    const savedState = getStoredMapState();
    hadSavedStateRef.current = !!savedState;

    if (savedState) {
      // Restore saved state
      map.setView(savedState.center, savedState.zoom);
      hasPositionedRef.current = true;
    }
  }, [map]);

  // Center on user location when it becomes available (only if no saved state)
  useEffect(() => {
    if (hasPositionedRef.current) return;
    if (!userLocation) return;
    if (hadSavedStateRef.current) return;

    // No saved state and user location just became available - center on user
    map.setView(userLocation, 10);
    hasPositionedRef.current = true;
  }, [map, userLocation]);

  // Save state on map movement
  useEffect(() => {
    const handleMoveEnd = () => {
      const center = map.getCenter();
      const zoom = map.getZoom();
      saveMapState({
        center: [center.lat, center.lng],
        zoom,
      });
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

// Create cluster custom icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
function createClusterCustomIcon(cluster: any) {
  const count = cluster.getChildCount();
  let size = 'small';
  let dimensions = 30;

  if (count >= 100) {
    size = 'large';
    dimensions = 50;
  } else if (count >= 10) {
    size = 'medium';
    dimensions = 40;
  }

  return L.divIcon({
    html: `<div class="cluster-icon cluster-${size}"><span>${count}</span></div>`,
    className: 'custom-marker-cluster',
    iconSize: L.point(dimensions, dimensions, true),
  });
}

// Floating Action Button for locating user
function FloatingLocateButton({ onClick, isLocating }: { onClick: () => void; isLocating: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={isLocating}
      className="absolute bottom-4 right-4 z-[1000] w-14 h-14 bg-white hover:bg-gray-50 border border-gray-300 rounded-full shadow-lg flex items-center justify-center transition-all active:scale-95 disabled:opacity-70"
      aria-label="Localizar-me"
    >
      {isLocating ? (
        <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <svg className="h-6 w-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      )}
    </button>
  );
}

// Fullscreen button
function FullscreenButton({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
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

  return (
    <button
      onClick={toggleFullscreen}
      className="absolute top-4 right-4 z-[1000] w-10 h-10 bg-white hover:bg-gray-50 border border-gray-300 rounded-md shadow-md flex items-center justify-center transition-all"
      aria-label={isFullscreen ? "Sair do ecrã inteiro" : "Ecrã inteiro"}
    >
      {isFullscreen ? (
        <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="h-5 w-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
        </svg>
      )}
    </button>
  );
}

// Component to invalidate map size
function MapSizeInvalidator() {
  const map = useMap();

  useEffect(() => {
    const invalidate = () => map.invalidateSize();
    const id = setTimeout(invalidate, 100);
    window.addEventListener('resize', invalidate);

    // Also invalidate on fullscreen change
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

const MapView = ({ repeaters, onRepeaterClick, userLocation: externalUserLocation, radiusKm }: Props) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [internalUserLocation, setInternalUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<TileLayerKey>(() => getStoredLayer());

  // Use external location if provided, otherwise use internal
  const userLocation = externalUserLocation
    ? [externalUserLocation.latitude, externalUserLocation.longitude] as [number, number]
    : internalUserLocation;

  // Note: Filtering is handled by RepeaterBrowser, not here
  const filteredRepeaters = repeaters;

  // Function to locate user
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocalização não é suportada pelo seu navegador');
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userPos: [number, number] = [latitude, longitude];

        setInternalUserLocation(userPos);
        setIsLocating(false);

        // Center map on user location
        if (mapRef.current) {
          mapRef.current.setView(userPos, 13);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Permissão de localização negada');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Localização indisponível');
            break;
          case error.TIMEOUT:
            setLocationError('Timeout ao obter localização');
            break;
          default:
            setLocationError('Erro desconhecido ao obter localização');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  // Clear error after 5 seconds
  useEffect(() => {
    if (locationError) {
      const timer = setTimeout(() => setLocationError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [locationError]);

  return (
    <div ref={containerRef} className="relative h-full w-full" style={{ minHeight: '500px' }}>
      {/* Cluster styles */}
      <style>{`
        .custom-marker-cluster {
          background: transparent;
        }
        .cluster-icon {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border: 3px solid white;
          border-radius: 50%;
          color: white;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .cluster-small {
          font-size: 12px;
        }
        .cluster-medium {
          font-size: 14px;
        }
        .cluster-large {
          font-size: 16px;
        }
        .leaflet-popup-content {
          margin: 8px 12px;
          min-width: 180px;
        }
        .repeater-popup {
          font-family: system-ui, -apple-system, sans-serif;
        }
        .repeater-popup h3 {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        .repeater-popup .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin: 4px 0;
        }
        .repeater-popup .info-label {
          color: #6b7280;
        }
        .repeater-popup .info-value {
          font-weight: 500;
        }
        .repeater-popup .badges {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin: 8px 0;
        }
        .repeater-popup .badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 9999px;
          background: #f3f4f6;
          color: #374151;
        }
        .repeater-popup .badge-2m { background: #dbeafe; color: #1d4ed8; }
        .repeater-popup .badge-70cm { background: #ffedd5; color: #c2410c; }
        .repeater-popup .badge-dmr { background: #dcfce7; color: #166534; }
        .repeater-popup .badge-dstar { background: #fae8ff; color: #86198f; }
        .repeater-popup .open-details-btn {
          width: 100%;
          margin-top: 8px;
          padding: 8px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }
        .repeater-popup .open-details-btn:hover {
          background: #2563eb;
        }
        .repeater-popup .open-details-btn:active {
          background: #1d4ed8;
        }
      `}</style>

      {/* Fullscreen button */}
      <FullscreenButton containerRef={containerRef} />

      <MapContainer
        center={[39.694444, -8.130556]}
        zoom={6}
        style={{ height: '100%', width: '100%', zIndex: 0, minHeight: '500px' }}
        ref={mapRef}
      >
        <MapSizeInvalidator />
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
        >
          {repeaters.map((repeater) => (
            <Marker
              key={repeater.callsign}
              position={[repeater.latitude, repeater.longitude]}
              icon={repeater.status === 'offline' ? offlineIcon : defaultIcon}
              eventHandlers={{
                click: () => onRepeaterClick?.(repeater),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="font-bold text-base">{repeater.callsign}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {repeater.outputFrequency.toFixed(3)} MHz
                    {repeater.modulation && (
                      <span className="ml-2 inline-block rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-800">
                        {repeater.modulation}
                      </span>
                    )}
                  </div>
                  {repeater.tone && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      Tom: {repeater.tone} Hz
                    </div>
                  )}
                  {onRepeaterClick && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRepeaterClick(repeater)
                      }}
                      className="mt-2 w-full rounded bg-blue-600 px-2 py-1 text-xs text-white hover:bg-blue-700 transition-colors"
                    >
                      Ver detalhes
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Radius circle for distance filter */}
        {userLocation && radiusKm && radiusKm > 0 && (
          <Circle
            center={userLocation}
            radius={radiusKm * 1000} // Convert km to meters
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 2,
              dashArray: '5, 5',
            }}
          />
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <b>Sua localização</b>
              <br />
              Você está aqui!
            </Popup>
          </Marker>
        )}

        <LayerControl currentLayer={currentLayer} onLayerChange={setCurrentLayer} />
        <MapStatePersistence userLocation={userLocation} />
      </MapContainer>

      {/* Floating locate button (FAB) */}
      <FloatingLocateButton onClick={locateUser} isLocating={isLocating} />

      {/* Error message */}
      {locationError && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-[1000]">
          <div className="flex items-center text-sm">
            <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {locationError}
          </div>
        </div>
      )}

      {/* Repeater count badge */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md text-sm text-gray-700 border border-gray-200">
        {filteredRepeaters.length} repetidor{filteredRepeaters.length !== 1 ? 'es' : ''}
      </div>
    </div>
  );
};

export default MapView;
