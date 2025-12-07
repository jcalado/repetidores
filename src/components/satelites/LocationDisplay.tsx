'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Pencil, Navigation, Loader2 } from 'lucide-react';
import { useUserLocation, UserLocation } from '@/contexts/UserLocationContext';
import { latLonToQth } from '@/lib/iss/qth-locator';
import { ObserverLocation } from '@/lib/iss/types';
import { LocationEditor } from './LocationEditor';

interface LocationDisplayProps {
  onLocationChange?: (location: ObserverLocation) => void;
}

/**
 * Converts UserLocation to ObserverLocation format used by satellite tracking
 */
function toObserverLocation(location: UserLocation): ObserverLocation {
  const qth = latLonToQth(location.latitude, location.longitude, 6);
  return {
    latitude: location.latitude,
    longitude: location.longitude,
    altitude: 0,
    name: qth || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
  };
}

export function LocationDisplay({ onLocationChange }: LocationDisplayProps) {
  const { userLocation, isLocating, error, requestLocation, setLocation } = useUserLocation();
  const [showEditor, setShowEditor] = useState(false);

  // Notify parent when location changes
  useEffect(() => {
    if (userLocation && onLocationChange) {
      onLocationChange(toObserverLocation(userLocation));
    }
  }, [userLocation, onLocationChange]);

  // Format QTH locator for display
  const qth = userLocation
    ? latLonToQth(userLocation.latitude, userLocation.longitude, 6)
    : null;

  // Handle location update from editor
  const handleLocationUpdate = (observer: ObserverLocation) => {
    setLocation({
      latitude: observer.latitude,
      longitude: observer.longitude,
      timestamp: Date.now(),
    });
    setShowEditor(false);
  };

  // If no location and not editing, show prompt
  if (!userLocation && !showEditor) {
    return (
      <div className="space-y-3">
        <Alert>
          <MapPin className="h-4 w-4" />
          <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3">
            <span>Defina sua localizacao para ver passagens de satelites.</span>
            <div className="flex gap-2">
              <Button
                onClick={() => requestLocation()}
                disabled={isLocating}
                size="sm"
                variant="default"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-4 w-4 mr-2" />
                )}
                Detectar
              </Button>
              <Button
                onClick={() => setShowEditor(true)}
                size="sm"
                variant="outline"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Manual
              </Button>
            </div>
          </AlertDescription>
        </Alert>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  // If editing, show the editor
  if (showEditor) {
    return (
      <LocationEditor
        initialLocation={userLocation ? toObserverLocation(userLocation) : null}
        onSave={handleLocationUpdate}
        onCancel={() => setShowEditor(false)}
      />
    );
  }

  // Show compact location display (userLocation is guaranteed to be non-null here)
  if (!userLocation) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <MapPin className="h-4 w-4 flex-shrink-0 text-slate-600 dark:text-slate-400" />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="text-slate-700 dark:text-slate-300">
            {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
          </span>
          {qth && (
            <span className="font-mono text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
              {qth}
            </span>
          )}
          {userLocation.isApproximate && (
            <span className="text-xs text-orange-600 dark:text-orange-400">
              (aproximado)
            </span>
          )}
        </div>
      </div>
      <Button
        onClick={() => setShowEditor(true)}
        size="sm"
        variant="ghost"
        className="flex-shrink-0"
      >
        <Pencil className="h-4 w-4 mr-1" />
        Alterar
      </Button>
    </div>
  );
}
