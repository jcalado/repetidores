'use client';

import * as React from 'react';
import { getIPLocation } from '@/lib/geolocation';
import { latLonToQth } from '@/lib/iss/qth-locator';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
  isApproximate?: boolean; // True when using IP-based fallback
  qthLocator?: string; // Maidenhead grid locator
}

interface UserLocationContextValue {
  userLocation: UserLocation | null;
  isLocating: boolean;
  error: string | null;
  requestLocation: (highAccuracy?: boolean) => void;
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

  const requestLocation = React.useCallback((highAccuracy = true) => {
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
          qthLocator: latLonToQth(position.coords.latitude, position.coords.longitude),
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
            qthLocator: latLonToQth(ipLocation.latitude, ipLocation.longitude),
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
        enableHighAccuracy: highAccuracy,
        timeout: highAccuracy ? 15000 : 10000, // More time for GPS
        maximumAge: 0, // Always get fresh position
      }
    );
  }, []);

  const setLocation = React.useCallback((location: UserLocation) => {
    const locationWithMeta = {
      ...location,
      timestamp: location.timestamp ?? Date.now(),
      qthLocator: location.qthLocator ?? latLonToQth(location.latitude, location.longitude),
    };
    setUserLocation(locationWithMeta);
    setError(null);
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationWithMeta));
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

// Default value for SSR or when provider isn't mounted yet
const defaultContextValue: UserLocationContextValue = {
  userLocation: null,
  isLocating: false,
  error: null,
  requestLocation: () => {},
  setLocation: () => {},
  clearLocation: () => {},
};

export function useUserLocation() {
  const context = React.useContext(UserLocationContext);
  // Return default value during SSR to avoid hydration errors
  // The real context will be available after hydration
  return context ?? defaultContextValue;
}
