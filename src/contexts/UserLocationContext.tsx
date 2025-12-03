'use client';

import * as React from 'react';
import { getIPLocation } from '@/lib/geolocation';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  isApproximate?: boolean; // True when using IP-based fallback
}

interface UserLocationContextValue {
  userLocation: UserLocation | null;
  isLocating: boolean;
  error: string | null;
  requestLocation: () => void;
  setLocation: (location: UserLocation) => void;
  clearLocation: () => void;
}

const UserLocationContext = React.createContext<UserLocationContextValue | null>(null);

const LOCATION_STORAGE_KEY = 'user-location';
const LOCATION_MAX_AGE = 30 * 60 * 1000; // 30 minutes

export function UserLocationProvider({ children }: { children: React.ReactNode }) {
  const [userLocation, setUserLocation] = React.useState<UserLocation | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load cached location on mount
  React.useEffect(() => {
    try {
      const cached = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as UserLocation;
        // Check if location is still fresh
        if (parsed.timestamp && Date.now() - parsed.timestamp < LOCATION_MAX_AGE) {
          setUserLocation(parsed);
        } else {
          localStorage.removeItem(LOCATION_STORAGE_KEY);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const requestLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: Date.now(),
        };
        setUserLocation(location);
        setIsLocating(false);

        // Cache in localStorage
        try {
          localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
        } catch {
          // Ignore storage errors
        }
      },
      async (err) => {
        console.warn('Browser geolocation failed, trying IP fallback:', err.message);

        // Try IP-based geolocation as fallback
        const ipLocation = await getIPLocation();

        if (ipLocation) {
          const location: UserLocation = {
            latitude: ipLocation.latitude,
            longitude: ipLocation.longitude,
            timestamp: Date.now(),
            isApproximate: true,
          };
          setUserLocation(location);
          setError(null);
          setIsLocating(false);

          // Cache in localStorage
          try {
            localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
          } catch {
            // Ignore storage errors
          }
        } else {
          setError(err.message);
          setIsLocating(false);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const setLocation = React.useCallback((location: UserLocation) => {
    const locationWithTimestamp = {
      ...location,
      timestamp: location.timestamp ?? Date.now(),
    };
    setUserLocation(locationWithTimestamp);
    setError(null);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationWithTimestamp));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearLocation = React.useCallback(() => {
    setUserLocation(null);
    setError(null);
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  const value = React.useMemo(
    () => ({
      userLocation,
      isLocating,
      error,
      requestLocation,
      setLocation,
      clearLocation,
    }),
    [userLocation, isLocating, error, requestLocation, setLocation, clearLocation]
  );

  return (
    <UserLocationContext.Provider value={value}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = React.useContext(UserLocationContext);
  if (!context) {
    throw new Error('useUserLocation must be used within a UserLocationProvider');
  }
  return context;
}
