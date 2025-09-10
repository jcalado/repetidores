
"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useEffect, useRef, useState } from 'react';
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

type Props = { repeaters: Repeater[] };

// Component to handle map controls
function MapControls({ onLocateUser }: { onLocateUser: () => void }) {
  const map = useMap();

  useEffect(() => {
    // Create a simple button control
    const controlContainer = L.DomUtil.create('div', 'leaflet-control-locate');
    controlContainer.style.position = 'absolute';
    controlContainer.style.top = '10px';
    controlContainer.style.right = '10px';
    controlContainer.style.zIndex = '1000';

    controlContainer.innerHTML = `
      <button class="bg-white hover:bg-gray-50 border border-gray-300 rounded-md px-3 py-2 shadow-md text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors">
        <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Localizar-me
      </button>
    `;

    const button = controlContainer.querySelector('button');
    if (button) {
      L.DomEvent.disableClickPropagation(button);
      L.DomEvent.disableScrollPropagation(button);
      button.addEventListener('click', onLocateUser);
    }

    // Add to map container
    const mapContainer = map.getContainer();
    mapContainer.appendChild(controlContainer);

    return () => {
      if (mapContainer.contains(controlContainer)) {
        mapContainer.removeChild(controlContainer);
      }
    };
  }, [map, onLocateUser]);

  return null;
}

const MapView = ({ repeaters }: Props) => {
  const mapRef = useRef<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Ensure Leaflet recalculates size after mount and on window resize.
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const invalidate = () => map.invalidateSize();
    // Defer to next tick to catch cases where parent just became visible
    const id = setTimeout(invalidate, 0);
    window.addEventListener('resize', invalidate);
    return () => {
      clearTimeout(id);
      window.removeEventListener('resize', invalidate);
    };
  }, []);

  // Function to locate user
  const locateUser = () => {
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
  };

  return (
    <div style={{ position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={[39.694444, -8.130556]}
        zoom={6}
        style={{ height: '500px', width: '100%', zIndex: 0 }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {repeaters.map((repeater) => (
          <Marker key={repeater.callsign} position={[repeater.latitude, repeater.longitude]}>
            <Popup>
              <b>{repeater.callsign}</b>
              <br />
              {repeater.outputFrequency.toFixed(3)} MHz
            </Popup>
          </Marker>
        ))}

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

        <MapControls onLocateUser={locateUser} />
      </MapContainer>

      {/* Error message */}
      {locationError && (
        <div className="absolute top-4 left-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg z-10">
          <div className="flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {locationError}
          </div>
        </div>
      )}

      {/* Loading indicator */}
      {isLocating && (
        <div className="absolute top-4 left-4 bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded shadow-lg z-10">
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            A obter localização...
          </div>
        </div>
      )}
    </div>
  );
};

export default MapView;
