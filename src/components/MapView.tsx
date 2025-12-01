
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import type { Repeater } from "@/app/columns";

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
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

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

// Create cluster custom icon
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

type QuickFilter = {
  band: '2m' | '70cm' | 'all';
  modulation: 'fm' | 'dmr' | 'dstar' | 'all';
};

type Props = {
  repeaters: Repeater[];
  onSelectRepeater?: (repeater: Repeater) => void;
  quickFilter?: QuickFilter;
  onQuickFilterChange?: (filter: QuickFilter) => void;
};

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

// Quick filter chips
function QuickFilterChips({
  filter,
  onChange
}: {
  filter: QuickFilter;
  onChange: (filter: QuickFilter) => void;
}) {
  const chips = [
    { key: 'band', value: 'all', label: 'Todas' },
    { key: 'band', value: '2m', label: '2m' },
    { key: 'band', value: '70cm', label: '70cm' },
    { key: 'modulation', value: 'all', label: 'Todas Mod.' },
    { key: 'modulation', value: 'fm', label: 'FM' },
    { key: 'modulation', value: 'dmr', label: 'DMR' },
    { key: 'modulation', value: 'dstar', label: 'D-STAR' },
  ] as const;

  return (
    <div className="absolute top-4 left-4 right-16 z-[1000] overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {chips.map((chip) => {
          const isActive = chip.key === 'band'
            ? filter.band === chip.value
            : filter.modulation === chip.value;

          return (
            <button
              key={`${chip.key}-${chip.value}`}
              onClick={() => {
                if (chip.key === 'band') {
                  onChange({ ...filter, band: chip.value as QuickFilter['band'] });
                } else {
                  onChange({ ...filter, modulation: chip.value as QuickFilter['modulation'] });
                }
              }}
              className={`
                whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full border shadow-sm transition-all
                ${isActive
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {chip.label}
            </button>
          );
        })}
      </div>
    </div>
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

const MapView = ({ repeaters, onSelectRepeater, quickFilter, onQuickFilterChange }: Props) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [internalFilter, setInternalFilter] = useState<QuickFilter>({ band: 'all', modulation: 'all' });

  const activeFilter = quickFilter ?? internalFilter;
  const setActiveFilter = onQuickFilterChange ?? setInternalFilter;

  // Filter repeaters based on quick filter
  const filteredRepeaters = repeaters.filter(r => {
    // Band filter
    if (activeFilter.band !== 'all') {
      const band = getBandFromFrequency(r.outputFrequency);
      if (activeFilter.band === '2m' && band !== '2m') return false;
      if (activeFilter.band === '70cm' && band !== '70cm') return false;
    }

    // Modulation filter
    if (activeFilter.modulation !== 'all') {
      const mod = r.modulation?.toLowerCase() || '';
      if (activeFilter.modulation === 'fm' && mod !== 'fm' && mod !== 'nfm') return false;
      if (activeFilter.modulation === 'dmr' && !r.dmr) return false;
      if (activeFilter.modulation === 'dstar' && !r.dstar) return false;
    }

    return true;
  });

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

        setUserLocation(userPos);
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

      {/* Quick filter chips */}
      <QuickFilterChips filter={activeFilter} onChange={setActiveFilter} />

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
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Clustered markers */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createClusterCustomIcon}
          maxClusterRadius={50}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
          zoomToBoundsOnClick={true}
        >
          {filteredRepeaters.map((repeater) => {
            const band = getBandFromFrequency(repeater.outputFrequency);

            return (
              <Marker
                key={repeater.callsign}
                position={[repeater.latitude, repeater.longitude]}
                eventHandlers={{
                  click: () => {
                    // Marker click is handled by popup
                  }
                }}
              >
                <Popup>
                  <div className="repeater-popup">
                    <h3>{repeater.callsign}</h3>
                    <div className="badges">
                      <span className={`badge badge-${band.replace('cm', 'cm').toLowerCase()}`}>{band}</span>
                      {repeater.modulation && (
                        <span className="badge">{repeater.modulation.toUpperCase()}</span>
                      )}
                      {repeater.dmr && <span className="badge badge-dmr">DMR</span>}
                      {repeater.dstar && <span className="badge badge-dstar">D-STAR</span>}
                    </div>
                    <div className="info-row">
                      <span className="info-label">Saída</span>
                      <span className="info-value">{repeater.outputFrequency.toFixed(4)} MHz</span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Entrada</span>
                      <span className="info-value">{repeater.inputFrequency.toFixed(4)} MHz</span>
                    </div>
                    {repeater.tone && (
                      <div className="info-row">
                        <span className="info-label">Tom</span>
                        <span className="info-value">{repeater.tone} Hz</span>
                      </div>
                    )}
                    {onSelectRepeater && (
                      <button
                        className="open-details-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectRepeater(repeater);
                        }}
                      >
                        Abrir Detalhes
                      </button>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MarkerClusterGroup>

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
