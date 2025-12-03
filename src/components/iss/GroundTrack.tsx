'use client';

import { useEffect, useRef, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ObserverLocation, SatellitePosition } from '@/lib/iss/types';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface OrbitPaths {
  previous: SatellitePosition[];
  current: SatellitePosition[];
  next: SatellitePosition[];
}

interface GroundTrackProps {
  currentPosition: SatellitePosition | null;
  observer: ObserverLocation;
  orbitPaths?: OrbitPaths;
}

const defaultOrbitPaths: OrbitPaths = { previous: [], current: [], next: [] };

// Split path at antimeridian crossings to avoid horizontal lines across the map
function splitAtAntimeridian(path: SatellitePosition[]): [number, number][][] {
  if (path.length === 0) return [];

  const segments: [number, number][][] = [];
  let currentSegment: [number, number][] = [];

  for (let i = 0; i < path.length; i++) {
    const pos = path[i];
    currentSegment.push([pos.latitude, pos.longitude]);

    // Check if next point crosses antimeridian (longitude jump > 180°)
    if (i < path.length - 1) {
      const nextPos = path[i + 1];
      const lonDiff = Math.abs(pos.longitude - nextPos.longitude);
      if (lonDiff > 180) {
        // Antimeridian crossing - start new segment
        segments.push(currentSegment);
        currentSegment = [];
      }
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

export function GroundTrack({ currentPosition, observer, orbitPaths = defaultOrbitPaths }: GroundTrackProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const issMarkerRef = useRef<L.Marker | null>(null);
  const observerMarkerRef = useRef<L.Marker | null>(null);
  const previousOrbitRef = useRef<L.Polyline[] | null>(null);
  const currentOrbitRef = useRef<L.Polyline[] | null>(null);
  const nextOrbitRef = useRef<L.Polyline[] | null>(null);

  // Memoize icons to avoid recreating them on every render
  const issIcon = useMemo(() => L.divIcon({
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
  }), []);

  const observerIcon = useMemo(() => L.divIcon({
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
  }), []);

  // Initialize map once - intentionally empty dependency array
  // Position updates are handled by separate effects
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [currentPosition?.latitude || 0, currentPosition?.longitude || 0],
      zoom: 2,
      scrollWheelZoom: true,
      worldCopyJump: false,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1.0,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      noWrap: true,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      // Clear all layer refs so they get recreated on remount
      issMarkerRef.current = null;
      observerMarkerRef.current = null;
      previousOrbitRef.current = null;
      currentOrbitRef.current = null;
      nextOrbitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update ISS marker
  useEffect(() => {
    if (!mapInstanceRef.current || !currentPosition) return;

    if (issMarkerRef.current) {
      issMarkerRef.current.setLatLng([currentPosition.latitude, currentPosition.longitude]);
      // Update popup content
      issMarkerRef.current.setPopupContent(`
        <div style="font-family: sans-serif;">
          <strong>ISS</strong><br/>
          Lat: ${currentPosition.latitude.toFixed(2)}°<br/>
          Lon: ${currentPosition.longitude.toFixed(2)}°<br/>
          Alt: ${currentPosition.altitude.toFixed(0)} km<br/>
          Vel: ${(currentPosition.velocity * 3600).toFixed(0)} km/h
        </div>
      `);
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
  }, [currentPosition, issIcon]);

  // Update observer marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (observerMarkerRef.current) {
      observerMarkerRef.current.setLatLng([observer.latitude, observer.longitude]);
      observerMarkerRef.current.setPopupContent(`
        <div style="font-family: sans-serif;">
          <strong>Sua Localização</strong><br/>
          ${observer.name || ''}<br/>
          Lat: ${observer.latitude.toFixed(4)}°<br/>
          Lon: ${observer.longitude.toFixed(4)}°
        </div>
      `);
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
  }, [observer, observerIcon]);

  // Update orbit paths (previous, current, next)
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateOrbitLines = (
      ref: React.MutableRefObject<L.Polyline[] | null>,
      path: SatellitePosition[],
      color: string,
      opacity: number,
      dashArray?: string
    ) => {
      // Remove old polylines
      if (ref.current) {
        ref.current.forEach(line => line.remove());
      }

      // Split path at antimeridian crossings
      const segments = splitAtAntimeridian(path);

      // Create new polylines for each segment
      ref.current = segments.map(segment =>
        L.polyline(segment, {
          color,
          weight: 2,
          opacity,
          dashArray,
        }).addTo(mapInstanceRef.current!)
      );
    };

    // Previous orbit - faded gray dashed
    updateOrbitLines(previousOrbitRef, orbitPaths.previous, '#6b7280', 0.4, '5, 5');
    // Current orbit - solid yellow
    updateOrbitLines(currentOrbitRef, orbitPaths.current, '#eab308', 0.8);
    // Next orbit - dashed blue
    updateOrbitLines(nextOrbitRef, orbitPaths.next, '#3b82f6', 0.6, '5, 5');
  }, [orbitPaths]);


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
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white"></div>
            <span>ISS</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
            <span>Sua Localização</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-gray-500 opacity-40" style={{ borderTop: '2px dashed' }}></div>
            <span>Órbita Anterior</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-yellow-500 opacity-80"></div>
            <span>Órbita Atual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-0.5 bg-blue-500 opacity-60" style={{ borderTop: '2px dashed' }}></div>
            <span>Próxima Órbita</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
