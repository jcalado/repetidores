'use client';

import { cn } from '@/lib/utils';
import { Navigation2 } from 'lucide-react';
import * as React from 'react';

interface BearingCompassProps {
  userLat: number;
  userLon: number;
  targetLat: number;
  targetLon: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDistance?: boolean;
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

export default function BearingCompass({
  userLat,
  userLon,
  targetLat,
  targetLon,
  className,
  size = 'md',
  showDistance = true,
}: BearingCompassProps) {
  const bearing = calculateBearing(userLat, userLon, targetLat, targetLon);
  const distance = calculateDistance(userLat, userLon, targetLat, targetLon);
  const cardinal = getCardinalDirection(bearing);

  const sizeClasses = {
    sm: { container: 'w-16 h-16', arrow: 'h-6 w-6', text: 'text-xs' },
    md: { container: 'w-24 h-24', arrow: 'h-8 w-8', text: 'text-sm' },
    lg: { container: 'w-32 h-32', arrow: 'h-10 w-10', text: 'text-base' },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      {/* Compass Rose */}
      <div
        className={cn(
          'relative rounded-full border-2 border-muted bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-inner',
          sizes.container
        )}
      >
        {/* Cardinal directions */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground">N</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/60">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground/60">W</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] font-medium text-muted-foreground/60">E</span>

        {/* Compass ticks */}
        <div className="absolute inset-2 rounded-full border border-muted-foreground/20" />

        {/* Direction arrow */}
        <div
          className="absolute inset-0 flex items-center justify-center transition-transform duration-300"
          style={{ transform: `rotate(${bearing}deg)` }}
        >
          <div className="flex flex-col items-center">
            <Navigation2
              className={cn(
                'text-ship-cove-600 dark:text-ship-cove-400 fill-ship-cove-500 dark:fill-ship-cove-500',
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
