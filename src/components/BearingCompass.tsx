'use client';

import { cn } from '@/lib/utils';
import { Navigation2, Compass } from 'lucide-react';
import * as React from 'react';

interface BearingCompassProps {
  userLat: number;
  userLon: number;
  targetLat: number;
  targetLon: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDistance?: boolean;
  deviceHeading?: number | null;
  isCompassActive?: boolean;
}

// Calculate bearing from point A to point B
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360; // Normalize to 0-360

  return bearing;
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  if (km < 10) return `${km.toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

// Calculate relative bearing (how far to turn from device heading)
function calculateRelativeBearing(targetBearing: number, deviceHeading: number): number {
  let relative = targetBearing - deviceHeading;
  while (relative > 180) relative -= 360;
  while (relative < -180) relative += 360;
  return relative;
}

// Get direction instruction
function getDirectionInstruction(relativeBearing: number): string {
  const abs = Math.abs(relativeBearing);
  if (abs <= 15) return 'Em frente';
  if (abs <= 45) return relativeBearing > 0 ? 'Vire à direita' : 'Vire à esquerda';
  if (abs <= 135) return relativeBearing > 0 ? 'À direita' : 'À esquerda';
  return 'Para trás';
}

export default function BearingCompass({
  userLat,
  userLon,
  targetLat,
  targetLon,
  className,
  size = 'md',
  showDistance = true,
  deviceHeading = null,
  isCompassActive = false,
}: BearingCompassProps) {
  const bearing = calculateBearing(userLat, userLon, targetLat, targetLon);
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  const cardinal = getCardinalDirection(bearing);

  // Calculate relative bearing when compass is active
  const relativeBearing = deviceHeading !== null ? calculateRelativeBearing(bearing, deviceHeading) : null;
  const instruction = relativeBearing !== null ? getDirectionInstruction(relativeBearing) : null;

  const sizeClasses = {
    sm: { container: 'w-16 h-16', arrow: 'h-6 w-6', text: 'text-xs' },
    md: { container: 'w-24 h-24', arrow: 'h-8 w-8', text: 'text-sm' },
    lg: { container: 'w-32 h-32', arrow: 'h-10 w-10', text: 'text-base' },
  };

  const sizes = sizeClasses[size];

  // When compass is active, rotate the entire rose to match device heading
  // The arrow then points to the relative direction
  const roseRotation = deviceHeading !== null ? -deviceHeading : 0;
  const arrowRotation = deviceHeading !== null ? relativeBearing! : bearing;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Compass Rose */}
      <div
        className={cn(
          'relative rounded-full border-2 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner transition-all duration-300',
          sizes.container,
          isCompassActive
            ? 'border-green-500 ring-2 ring-green-500/30'
            : 'border-muted'
        )}
      >
        {/* Compass active indicator */}
        {isCompassActive && (
          <div className="absolute -top-1 -right-1 w-3 h-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
          </div>
        )}

        {/* Cardinal directions - rotate with device heading when active */}
        <div
          className="absolute inset-0 transition-transform duration-150"
          style={{ transform: `rotate(${roseRotation}deg)` }}
        >
          <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground">N</span>
          <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/60">S</span>
          <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground/60">W</span>
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground/60">E</span>
          {/* Compass ticks */}
          <div className="absolute inset-2 rounded-full border border-muted-foreground/20" />
        </div>

        {/* Direction arrow - shows relative bearing when compass active, absolute otherwise */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
          style={{ transform: `rotate(${arrowRotation}deg)` }}
        >
          <div className="flex flex-col items-center">
            <Navigation2
              className={cn(
                'fill-ship-cove-500 dark:fill-ship-cove-500',
                isCompassActive
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-ship-cove-600 dark:text-ship-cove-400',
                sizes.arrow
              )}
            />
          </div>
        </div>

        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted-foreground/30" />
      </div>

      {/* Bearing info */}
      <div className="text-center">
        <div className={cn('font-mono font-semibold', sizes.text)}>
          {Math.round(bearing)}° {cardinal}
        </div>
        {showDistance && (
          <div className="text-xs text-muted-foreground">{formatDistance(distance)}</div>
        )}
        {/* Real-time instruction when compass active */}
        {isCompassActive && instruction && (
          <div className={cn(
            'font-medium mt-1',
            sizes.text,
            Math.abs(relativeBearing!) <= 15
              ? 'text-green-600 dark:text-green-400'
              : 'text-orange-600 dark:text-orange-400'
          )}>
            {instruction}
          </div>
        )}
      </div>
    </div>
  );
}

// Compact inline version for tight spaces
export function BearingIndicator({
  userLat,
  userLon,
  targetLat,
  targetLon,
  className,
}: Omit<BearingCompassProps, 'size' | 'showDistance'>) {
  const bearing = calculateBearing(userLat, userLon, targetLat, targetLon);
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  const cardinal = getCardinalDirection(bearing);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div
        className="flex items-center justify-center w-6 h-6 rounded-full bg-ship-cove-100 dark:bg-ship-cove-900/50"
        style={{ transform: `rotate(${bearing}deg)` }}
      >
        <Navigation2 className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400 fill-ship-cove-500" />
      </div>
      <span className="font-mono font-medium">
        {Math.round(bearing)}° {cardinal}
      </span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">{formatDistance(distance)}</span>
    </div>
  );
}
