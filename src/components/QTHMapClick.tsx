'use client';

import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslations } from 'next-intl';

// Fix for default markers in Next.js
const DefaultIcon = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
delete DefaultIcon._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapClickHandlerProps {
  onLocationClick: (lat: number, lon: number) => void;
}

function MapClickHandler({ onLocationClick }: MapClickHandlerProps) {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onLocationClick(lat, lng);
    },
  });
  return null;
}

interface QTHMapClickProps {
  onLocationSelect: (lat: number, lon: number) => void;
  selectedLocation?: { lat: number; lon: number } | null;
}

export default function QTHMapClick({ onLocationSelect, selectedLocation }: QTHMapClickProps) {
  const t = useTranslations('qth.mapClick');
  const [mapCenter] = useState<[number, number]>([39.694444, -8.130556]); // Portugal center

  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        {t('instruction')}
      </div>
      <div className="h-[400px] w-full rounded-lg overflow-hidden border border-border shadow-lg">
        <MapContainer
          center={mapCenter}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onLocationClick={onLocationSelect} />
          {selectedLocation && (
            <Marker position={[selectedLocation.lat, selectedLocation.lon]}>
              <Popup>
                <div className="text-sm">
                  <strong>Localização Selecionada</strong>
                  <br />
                  Lat: {selectedLocation.lat.toFixed(4)}
                  <br />
                  Lon: {selectedLocation.lon.toFixed(4)}
                </div>
              </Popup>
            </Marker>
          )}
        </MapContainer>
      </div>
    </div>
  );
}
