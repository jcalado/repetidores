
'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import repeaters from '@/repeaters.json';

// Fix for default icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapView = () => {
  const mapRef = useRef<L.Map | null>(null);

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

  return (
    <div>
    <MapContainer
      center={[40.4168, -3.7038]}
      zoom={6}
      style={{ height: '100vh', width: '100%' }}
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
    </MapContainer>
    </div>
  );
};

export default MapView;
