'use client';

import { useState, useEffect, useCallback } from 'react';

export interface DeviceCompassState {
  heading: number | null;
  accuracy: number | null;
  isSupported: boolean;
  isEnabled: boolean;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unknown';
  error: string | null;
}

interface DeviceOrientationEventWithPermission extends DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

interface DeviceOrientationEventStatic {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export function useDeviceCompass() {
  const [state, setState] = useState<DeviceCompassState>({
    heading: null,
    accuracy: null,
    isSupported: false,
    isEnabled: false,
    permissionState: 'unknown',
    error: null,
  });

  // Check if device orientation is supported
  useEffect(() => {
    const isSupported = typeof window !== 'undefined' &&
      ('DeviceOrientationEvent' in window || 'ondeviceorientation' in window);

    setState(prev => ({ ...prev, isSupported }));
  }, []);

  // Handle orientation event
  const handleOrientation = useCallback((event: DeviceOrientationEventWithPermission) => {
    let heading: number | null = null;
    let accuracy: number | null = null;

    // iOS provides webkitCompassHeading (more accurate, 0 = North)
    if (event.webkitCompassHeading !== undefined) {
      heading = event.webkitCompassHeading;
      accuracy = event.webkitCompassAccuracy ?? null;
    }
    // Android/others use alpha (0 = North when absolute is true)
    else if (event.alpha !== null) {
      if (event.absolute) {
        // When absolute=true, alpha is compass heading: 0=North, 90=East, etc.
        heading = event.alpha;
      } else {
        // For non-absolute, alpha is relative and may not represent compass heading
        // This is a fallback - less accurate
        heading = event.alpha;
      }
    }

    if (heading !== null) {
      setState(prev => ({
        ...prev,
        heading: Math.round(heading!),
        accuracy,
        error: null,
      }));
    }
  }, []);

  // Request permission (iOS 13+)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;

    const DeviceOrientationEventTyped = DeviceOrientationEvent as unknown as DeviceOrientationEventStatic;

    // Check if permission request is required (iOS 13+)
    if (typeof DeviceOrientationEventTyped.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEventTyped.requestPermission();
        setState(prev => ({
          ...prev,
          permissionState: permission,
          error: permission === 'denied' ? 'Permissão de bússola negada' : null,
        }));
        return permission === 'granted';
      } catch {
        setState(prev => ({
          ...prev,
          permissionState: 'denied',
          error: 'Erro ao solicitar permissão',
        }));
        return false;
      }
    }

    // No permission required (Android, desktop)
    setState(prev => ({ ...prev, permissionState: 'granted' }));
    return true;
  }, []);

  // Enable compass
  const enable = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({
        ...prev,
        error: 'Bússola não suportada neste dispositivo',
      }));
      return false;
    }

    const hasPermission = await requestPermission();
    if (!hasPermission) return false;

    window.addEventListener('deviceorientation', handleOrientation as EventListener, true);
    setState(prev => ({ ...prev, isEnabled: true, error: null }));
    return true;
  }, [state.isSupported, requestPermission, handleOrientation]);

  // Disable compass
  const disable = useCallback(() => {
    window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
    setState(prev => ({
      ...prev,
      isEnabled: false,
      heading: null,
      accuracy: null,
    }));
  }, [handleOrientation]);

  // Toggle compass
  const toggle = useCallback(async () => {
    if (state.isEnabled) {
      disable();
      return false;
    } else {
      return enable();
    }
  }, [state.isEnabled, enable, disable]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isEnabled) {
        window.removeEventListener('deviceorientation', handleOrientation as EventListener, true);
      }
    };
  }, [state.isEnabled, handleOrientation]);

  return {
    ...state,
    enable,
    disable,
    toggle,
    requestPermission,
  };
}

/**
 * Calculate relative bearing from device heading to target
 * Returns how many degrees to turn (0 = pointing at target)
 */
export function calculateRelativeBearing(
  targetBearing: number,
  deviceHeading: number | null
): number | null {
  if (deviceHeading === null) return null;

  let relative = targetBearing - deviceHeading;

  // Normalize to -180 to 180
  while (relative > 180) relative -= 360;
  while (relative < -180) relative += 360;

  return relative;
}

/**
 * Get direction instruction text
 */
export function getDirectionInstruction(relativeBearing: number): string {
  if (Math.abs(relativeBearing) <= 10) return 'Em frente';
  if (relativeBearing > 0 && relativeBearing <= 45) return 'Vire ligeiramente à direita';
  if (relativeBearing > 45 && relativeBearing <= 135) return 'Vire à direita';
  if (relativeBearing > 135) return 'Vire para trás';
  if (relativeBearing < 0 && relativeBearing >= -45) return 'Vire ligeiramente à esquerda';
  if (relativeBearing < -45 && relativeBearing >= -135) return 'Vire à esquerda';
  return 'Vire para trás';
}
