'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Repeater } from '@/app/columns';
import { calculateDistance, formatDistance } from '@/lib/geolocation';
import { useDeviceCompass } from '@/hooks/useDeviceCompass';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { PageHeader, PageHeaderIcon } from '@/components/ui/PageHeader';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  Compass,
  Loader2,
  RefreshCw,
  Radio,
  Signal,
  ChevronRight,
  Crosshair,
} from 'lucide-react';

interface RepeaterWithDistance extends Repeater {
  distance: number;
  bearing: number;
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return '70cm';
  if (mhz >= 144 && mhz <= 148) return '2m';
  if (mhz >= 50 && mhz <= 54) return '6m';
  if (mhz >= 1240 && mhz <= 1300) return '23cm';
  if (mhz >= 2300 && mhz <= 2450) return '13cm';
  return 'Other';
}

// Helper to get primary frequency from repeater
function getPrimaryFrequency(r: Repeater) {
  if (!r.frequencies || r.frequencies.length === 0) return null;
  return r.frequencies.find(f => f.isPrimary) || r.frequencies[0];
}

interface NearestRepeaterProps {
  repeaters: Repeater[];
}

export default function NearestRepeater({ repeaters }: NearestRepeaterProps) {
  const t = useTranslations('nearest');
  const tCompass = useTranslations('compass');

  const { userLocation, isLocating, requestLocation } = useUserLocation();
  const [sortedRepeaters, setSortedRepeaters] = React.useState<RepeaterWithDistance[]>([]);

  const compass = useDeviceCompass();

  React.useEffect(() => {
    if (!userLocation) {
      setSortedRepeaters([]);
      return;
    }

    const withDistances = repeaters
      .filter((r) => r.latitude && r.longitude)
      .filter((r) => !r.status || r.status === 'active' || r.status === 'unknown')
      .map((repeater) => ({
        ...repeater,
        distance: calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          repeater.latitude,
          repeater.longitude
        ),
        bearing: calculateBearing(
          userLocation.latitude,
          userLocation.longitude,
          repeater.latitude,
          repeater.longitude
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    setSortedRepeaters(withDistances);
  }, [userLocation, repeaters]);

  const getRelativeBearing = (targetBearing: number): number | null => {
    if (compass.heading === null) return null;
    let relative = targetBearing - compass.heading;
    while (relative > 180) relative -= 360;
    while (relative < -180) relative += 360;
    return relative;
  };

  const getDirectionInstruction = (relativeBearing: number): string => {
    const abs = Math.abs(relativeBearing);
    if (abs <= 15) return tCompass('ahead');
    if (abs <= 45) return relativeBearing > 0 ? tCompass('slightRight') : tCompass('slightLeft');
    if (abs <= 135) return relativeBearing > 0 ? tCompass('right') : tCompass('left');
    return tCompass('behind');
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Hero Header */}
      <PageHeader compact noMargin className="relative">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <PageHeaderIcon icon={<Crosshair />} size="sm" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t('title')}
                </h1>
                <p className="text-sm text-ship-cove-200">
                  {t('description')}
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {compass.isSupported && userLocation && (
              <button
                onClick={() => compass.toggle()}
                className={cn(
                  'flex h-9 sm:h-10 items-center gap-2 px-3 sm:px-4 rounded-lg transition-all text-sm font-medium',
                  compass.isEnabled
                    ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50'
                    : 'bg-white/10 text-white hover:bg-white/20'
                )}
              >
                <Compass className={cn('h-4 w-4', compass.isEnabled && 'animate-pulse')} />
                <span className="hidden sm:inline">
                  {compass.isEnabled ? tCompass('disable') : tCompass('enable')}
                </span>
              </button>
            )}
            <button
              onClick={() => requestLocation(true)}
              disabled={isLocating}
              className="flex h-9 sm:h-10 items-center gap-2 px-3 sm:px-4 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm font-medium disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{t('refreshLocation')}</span>
            </button>
          </div>
        </div>

      </PageHeader>

      {/* Location Status Panel */}
      {userLocation && (
        <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-60" />

          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
                  <MapPin className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-ship-cove-500 mb-0.5">
                    Posição Atual
                  </div>
                  <div className="font-mono text-sm sm:text-base font-medium text-ship-cove-900 dark:text-ship-cove-100">
                    {userLocation.qthLocator || `${userLocation.latitude.toFixed(5)}°, ${userLocation.longitude.toFixed(5)}°`}
                  </div>
                </div>
              </div>

              {compass.isEnabled && compass.heading !== null && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 ring-1 ring-emerald-200 dark:ring-emerald-800">
                  <Compass className="h-4 w-4 text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <div className="text-right">
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">{t('heading')}</div>
                    <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                      {compass.heading}° {bearingToCardinal(compass.heading)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* Loading State */}
      {isLocating && !userLocation && (
        <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />

          <div className="py-12 sm:py-16 text-center">
            <div className="flex h-16 w-16 mx-auto mb-4 items-center justify-center rounded-2xl bg-ship-cove-100 dark:bg-ship-cove-800">
              <Loader2 className="h-8 w-8 animate-spin text-ship-cove-600 dark:text-ship-cove-400" />
            </div>
            <p className="text-sm sm:text-base text-ship-cove-600 dark:text-ship-cove-400 font-medium">
              {t('locating')}
            </p>
            <p className="text-xs text-ship-cove-500 mt-1">
              A obter coordenadas GPS...
            </p>
          </div>
        </div>
      )}

      {/* No Location State */}
      {!userLocation && !isLocating && (
        <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-60" />

          <div className="py-12 sm:py-16 text-center">
            <div className="flex h-16 w-16 mx-auto mb-4 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-900/30">
              <MapPin className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm sm:text-base text-ship-cove-900 dark:text-ship-cove-100 font-medium mb-1">
              {t('noLocation')}
            </p>
            <p className="text-xs text-ship-cove-500 max-w-xs mx-auto">
              {t('setLocationHint')}
            </p>
            <button
              onClick={() => requestLocation(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-ship-cove-600 text-white hover:bg-ship-cove-700 transition-colors text-sm font-medium"
            >
              <Crosshair className="h-4 w-4" />
              Obter Localização
            </button>
          </div>

        </div>
      )}

      {/* Repeater List */}
      {userLocation && sortedRepeaters.length > 0 && (
        <div className="space-y-3">
          {sortedRepeaters.slice(0, 20).map((repeater, index) => {
            const relativeBearing = getRelativeBearing(repeater.bearing);
            const isFirst = index === 0;

            return (
              <RepeaterCard
                key={repeater.callsign}
                repeater={repeater}
                index={index}
                isFirst={isFirst}
                compassEnabled={compass.isEnabled}
                relativeBearing={relativeBearing}
                getDirectionInstruction={getDirectionInstruction}
              />
            );
          })}

          {sortedRepeaters.length > 20 && (
            <div className="text-center py-3">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ship-cove-100 dark:bg-ship-cove-800/50 text-sm text-ship-cove-600 dark:text-ship-cove-400">
                <Signal className="h-3.5 w-3.5" />
                {t('showingCount', { shown: 20, total: sortedRepeaters.length })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      {userLocation && (
        <div className="relative overflow-hidden rounded-xl border border-ship-cove-200/50 dark:border-ship-cove-800/30 bg-ship-cove-50/50 dark:bg-ship-cove-900/20">
          <div className="p-3 sm:p-4">
            <div className="flex items-start gap-3 text-xs sm:text-sm text-ship-cove-600 dark:text-ship-cove-400">
              <Signal className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{t('info')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface RepeaterCardProps {
  repeater: RepeaterWithDistance;
  index: number;
  isFirst: boolean;
  compassEnabled: boolean;
  relativeBearing: number | null;
  getDirectionInstruction: (bearing: number) => string;
}

function RepeaterCard({
  repeater,
  index,
  isFirst,
  compassEnabled,
  relativeBearing,
  getDirectionInstruction,
}: RepeaterCardProps) {
  return (
    <Link
      href={`/repeater/${repeater.callsign}/`}
      className={cn(
        'group block relative overflow-hidden rounded-xl border transition-all hover:shadow-md',
        isFirst
          ? 'border-ship-cove-300 dark:border-ship-cove-700 bg-gradient-to-br from-ship-cove-50 via-white to-ship-cove-50/50 dark:from-ship-cove-900/50 dark:via-ship-cove-950 dark:to-ship-cove-900/30 ring-1 ring-ship-cove-200 dark:ring-ship-cove-800'
          : 'border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/30 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/20'
      )}
    >
      {/* Top accent */}
      <div className={cn(
        'absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent to-transparent opacity-60',
        isFirst ? 'via-ship-cove-500' : 'via-ship-cove-400/50'
      )} />

      <div className="p-3 sm:p-4">
        {/* Desktop Layout */}
        <div className="hidden sm:flex sm:items-center sm:gap-4">
          {/* Rank & Distance */}
          <div className="flex flex-col items-center min-w-[70px]">
            <div className={cn(
              'text-2xl font-bold font-mono',
              isFirst ? 'text-ship-cove-600 dark:text-ship-cove-400' : 'text-ship-cove-400 dark:text-ship-cove-600'
            )}>
              #{index + 1}
            </div>
            <div className="text-sm font-medium text-ship-cove-600 dark:text-ship-cove-300 bg-ship-cove-100 dark:bg-ship-cove-800 px-2 py-0.5 rounded-md">
              {formatDistance(repeater.distance)}
            </div>
          </div>

          {/* Bearing Indicator */}
          <div className={cn(
            'flex-shrink-0 w-16 h-16 rounded-xl flex items-center justify-center transition-all',
            compassEnabled
              ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-400 dark:ring-emerald-600'
              : 'bg-ship-cove-100 dark:bg-ship-cove-800'
          )}>
            <Navigation
              className={cn(
                'h-8 w-8 transition-transform duration-300',
                compassEnabled
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-ship-cove-500 dark:text-ship-cove-400'
              )}
              style={{
                transform: `rotate(${
                  compassEnabled && relativeBearing !== null
                    ? relativeBearing
                    : repeater.bearing
                }deg)`,
              }}
            />
          </div>

          {/* Repeater Info */}
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-lg font-bold font-mono text-ship-cove-900 dark:text-ship-cove-100 group-hover:text-ship-cove-600 dark:group-hover:text-ship-cove-300 transition-colors">
                {repeater.callsign}
              </span>
              {(() => {
                const primary = getPrimaryFrequency(repeater);
                return primary ? (
                  <span className="px-2 py-0.5 rounded-md bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400 text-xs font-medium">
                    {getBandFromFrequency(primary.outputFrequency)}
                  </span>
                ) : null;
              })()}
              {repeater.modes?.map(mode => (
                <span
                  key={mode}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-xs font-medium",
                    mode === 'DMR' && "bg-purple-500/20 text-purple-600 dark:text-purple-400",
                    mode === 'DSTAR' && "bg-blue-500/20 text-blue-600 dark:text-blue-400",
                    mode === 'FM' && "bg-ship-cove-50 dark:bg-ship-cove-800/50 text-ship-cove-500 ring-1 ring-ship-cove-200 dark:ring-ship-cove-700",
                    mode === 'C4FM' && "bg-orange-500/20 text-orange-600 dark:text-orange-400",
                    mode === 'TETRA' && "bg-red-500/20 text-red-600 dark:text-red-400"
                  )}
                >
                  {mode === 'DSTAR' ? 'D-STAR' : mode}
                </span>
              ))}
            </div>
            <div className="text-sm text-ship-cove-600 dark:text-ship-cove-400">
              {(() => {
                const primary = getPrimaryFrequency(repeater);
                return primary ? (
                  <>
                    <span className="font-mono">{primary.outputFrequency.toFixed(4)} MHz</span>
                    {primary.tone && primary.tone > 0 && <span className="ml-2">CTCSS: {primary.tone} Hz</span>}
                  </>
                ) : null;
              })()}
            </div>
            <div className="text-sm text-ship-cove-500">
              {repeater.owner ?? ''} • <span className="font-mono">{repeater.qthLocator}</span>
            </div>
          </div>

          {/* Bearing & Direction */}
          <div className="flex flex-col items-end text-right min-w-[100px]">
            <div className="text-lg font-bold font-mono text-ship-cove-900 dark:text-ship-cove-100">
              {Math.round(repeater.bearing)}° {bearingToCardinal(repeater.bearing)}
            </div>
            {compassEnabled && relativeBearing !== null && (
              <div className={cn(
                'text-sm font-medium px-2 py-0.5 rounded-md mt-1',
                Math.abs(relativeBearing) <= 15
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
              )}>
                {getDirectionInstruction(relativeBearing)}
              </div>
            )}
          </div>

          {/* Arrow */}
          <ChevronRight className="h-5 w-5 text-ship-cove-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden">
          <div className="flex items-start gap-3">
            {/* Bearing Indicator with rank */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center',
                compassEnabled
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 ring-2 ring-emerald-400'
                  : 'bg-ship-cove-100 dark:bg-ship-cove-800'
              )}>
                <Navigation
                  className={cn(
                    'h-7 w-7 transition-transform duration-300',
                    compassEnabled
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-ship-cove-500 dark:text-ship-cove-400'
                  )}
                  style={{
                    transform: `rotate(${
                      compassEnabled && relativeBearing !== null
                        ? relativeBearing
                        : repeater.bearing
                    }deg)`,
                  }}
                />
              </div>
              {/* Rank badge */}
              <div className={cn(
                'absolute -top-1 -left-1 min-w-[1.25rem] h-5 px-1.5 rounded-md text-xs font-bold flex items-center justify-center',
                isFirst
                  ? 'bg-ship-cove-600 text-white'
                  : 'bg-ship-cove-200 dark:bg-ship-cove-700 text-ship-cove-600 dark:text-ship-cove-300'
              )}>
                {index + 1}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold font-mono text-ship-cove-900 dark:text-ship-cove-100">
                      {repeater.callsign}
                    </span>
                    {(() => {
                      const primary = getPrimaryFrequency(repeater);
                      return primary ? (
                        <span className="px-1.5 py-0.5 rounded bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400 text-xs">
                          {getBandFromFrequency(primary.outputFrequency)}
                        </span>
                      ) : null;
                    })()}
                    {repeater.modes?.includes('DMR') && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs">
                        DMR
                      </span>
                    )}
                    {repeater.modes?.includes('DSTAR') && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs">
                        D-STAR
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-semibold text-ship-cove-900 dark:text-ship-cove-100 bg-ship-cove-100 dark:bg-ship-cove-800 px-1.5 py-0.5 rounded">
                    {formatDistance(repeater.distance)}
                  </div>
                </div>
              </div>

              {/* Middle row */}
              <div className="mt-1 flex items-center justify-between text-xs text-ship-cove-600 dark:text-ship-cove-400">
                <div className="font-mono">
                  {(() => {
                    const primary = getPrimaryFrequency(repeater);
                    return primary ? (
                      <>
                        {primary.outputFrequency.toFixed(3)} MHz
                        {primary.tone && primary.tone > 0 && <span className="ml-1.5">• {primary.tone}Hz</span>}
                      </>
                    ) : null;
                  })()}
                </div>
                <div className="font-mono font-medium">
                  {Math.round(repeater.bearing)}° {bearingToCardinal(repeater.bearing)}
                </div>
              </div>

              {/* Bottom row */}
              <div className="mt-1 flex items-center justify-between">
                <span className="text-xs text-ship-cove-500 font-mono">{repeater.qthLocator}</span>
                {compassEnabled && relativeBearing !== null && (
                  <span className={cn(
                    'text-xs font-medium px-1.5 py-0.5 rounded',
                    Math.abs(relativeBearing) <= 15
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
                  )}>
                    {getDirectionInstruction(relativeBearing)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </Link>
  );
}
