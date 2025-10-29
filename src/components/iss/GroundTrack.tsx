'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ObserverLocation, SatellitePosition } from '@/lib/iss/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface GroundTrackProps {
  currentPosition: SatellitePosition | null;
  observer: ObserverLocation;
  orbitPath?: SatellitePosition[]; // Array of positions for orbit visualization
}

export function GroundTrack({ currentPosition, observer, orbitPath = [] }: GroundTrackProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const issMarkerRef = useRef<L.Marker | null>(null);
  const observerMarkerRef = useRef<L.Marker | null>(null);
  const orbitLineRef = useRef<L.Polyline | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [currentPosition?.latitude || 0, currentPosition?.longitude || 0],
      zoom: 3,
      scrollWheelZoom: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [currentPosition?.latitude, currentPosition?.longitude]);

  // Update ISS marker
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    const issIcon = L.divIcon({
      html: `<div style="
        width: 16px;
        height: 16px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: '',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });

    if (issMarkerRef.current) {
      issMarkerRef.current.setLatLng([currentPosition.latitude, currentPosition.longitude]);
    } else {
      issMarkerRef.current = L.marker([currentPosition.latitude, currentPosition.longitude], {
        icon: issIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong>ISS</strong><br/>
            Lat: ${currentPosition.latitude.toFixed(2)}°<br/>
            Lon: ${currentPosition.longitude.toFixed(2)}°<br/>
            Alt: ${currentPosition.altitude.toFixed(0)} km<br/>
            Vel: ${(currentPosition.velocity * 3600).toFixed(0)} km/h
          </div>
        `);
    }
  }, [currentPosition]);

  // Update observer marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const observerIcon = L.divIcon({
      html: `<div style="
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      className: '',
      iconSize: [12, 12],
      iconAnchor: [6, 6],
    });

    if (observerMarkerRef.current) {
      observerMarkerRef.current.setLatLng([observer.latitude, observer.longitude]);
    } else {
      observerMarkerRef.current = L.marker([observer.latitude, observer.longitude], {
        icon: observerIcon,
      })
        .addTo(mapInstanceRef.current)
        .bindPopup(`
          <div style="font-family: sans-serif;">
            <strong>Sua Localização</strong><br/>
            ${observer.name || ''}<br/>
            Lat: ${observer.latitude.toFixed(4)}°<br/>
            Lon: ${observer.longitude.toFixed(4)}°
          </div>
        `);
    }
  }, [observer]);

  // Update orbit path
  useEffect(() => {
    if (!mapInstanceRef.current || orbitPath.length === 0) return;

    const coordinates: [number, number][] = orbitPath.map(pos => [pos.latitude, pos.longitude]);

    if (orbitLineRef.current) {
      orbitLineRef.current.setLatLngs(coordinates);
    } else {
      orbitLineRef.current = L.polyline(coordinates, {
        color: '#ef4444',
        weight: 2,
        opacity: 0.6,
        dashArray: '5, 5',
      }).addTo(mapInstanceRef.current);
    }
  }, [orbitPath]);

  // Auto-center map on ISS when position updates
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    // Only pan if ISS is significantly off-center
    const center = mapInstanceRef.current.getCenter();
    const distance = mapInstanceRef.current.distance(
      center,
      L.latLng(currentPosition.latitude, currentPosition.longitude)
    );

    // Re-center if more than 500km away from center
    if (distance > 500000) {
      mapInstanceRef.current.panTo([currentPosition.latitude, currentPosition.longitude], {
        animate: true,
        duration: 1,
      });
    }
  }, [currentPosition]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rastro no Solo</CardTitle>
        <CardDescription>
          Posição atual da ISS e trajetória orbital
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={mapRef}
          className="w-full h-[500px] rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800"
        />
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span>ISS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <span>Sua Localização</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-red-500 opacity-60" style={{ borderTop: '2px dashed' }}></div>
            <span>Órbita</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
