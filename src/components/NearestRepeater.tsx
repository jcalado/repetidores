'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Repeater } from '@/app/columns';
import { calculateDistance, formatDistance } from '@/lib/geolocation';
import { useDeviceCompass } from '@/hooks/useDeviceCompass';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  Compass,
  Loader2,
  AlertCircle,
  Radio,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface RepeaterWithDistance extends Repeater {
  distance: number;
  bearing: number;
}

// Calculate bearing from point A to point B
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
  return 'Other';
}

interface NearestRepeaterProps {
  repeaters: Repeater[];
}

export default function NearestRepeater({ repeaters }: NearestRepeaterProps) {
  const t = useTranslations('nearest');
  const tCompass = useTranslations('compass');

  const [userLocation, setUserLocation] = React.useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [sortedRepeaters, setSortedRepeaters] = React.useState<RepeaterWithDistance[]>([]);

  const compass = useDeviceCompass();

  // Get user location
  const handleGetLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError(t('errors.notSupported'));
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError(t('errors.denied'));
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError(t('errors.unavailable'));
            break;
          case error.TIMEOUT:
            setLocationError(t('errors.timeout'));
            break;
          default:
            setLocationError(t('errors.unknown'));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [t]);

  // Calculate distances and sort repeaters when location changes
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

  // Calculate relative bearing when compass is active
  const getRelativeBearing = (targetBearing: number): number | null => {
    if (compass.heading === null) return null;
    let relative = targetBearing - compass.heading;
    while (relative > 180) relative -= 360;
    while (relative < -180) relative += 360;
    return relative;
  };

  // Get direction instruction
  const getDirectionInstruction = (relativeBearing: number): string => {
    const abs = Math.abs(relativeBearing);
    if (abs <= 15) return tCompass('ahead');
    if (abs <= 45) return relativeBearing > 0 ? tCompass('slightRight') : tCompass('slightLeft');
    if (abs <= 135) return relativeBearing > 0 ? tCompass('right') : tCompass('left');
    return tCompass('behind');
  };

  // Auto-request location on mount
  React.useEffect(() => {
    handleGetLocation();
  }, [handleGetLocation]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={t('title')}
        description={t('description')}
        icon={Navigation}
        actions={
          <>
            {compass.isSupported && userLocation && (
              <Button
                variant={compass.isEnabled ? 'default' : 'outline'}
                size="sm"
                onClick={() => compass.toggle()}
                className={cn('gap-2', compass.isEnabled && 'bg-green-600 hover:bg-green-700')}
              >
                <Compass className={cn('h-4 w-4', compass.isEnabled && 'animate-pulse')} />
                {compass.isEnabled ? tCompass('disable') : tCompass('enable')}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetLocation}
              disabled={isLocating}
              className="gap-2"
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t('refreshLocation')}
            </Button>
          </>
        }
      />

      {/* Location Info */}
      {userLocation && (
        <Card className="rounded-2xl">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>
                {userLocation.latitude.toFixed(4)}°, {userLocation.longitude.toFixed(4)}°
              </span>
              {compass.isEnabled && compass.heading !== null && (
                <span className="ml-4 text-green-600 dark:text-green-400">
                  <Compass className="h-4 w-4 inline mr-1" />
                  {t('heading')}: {compass.heading}°
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Location Error */}
      {locationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{t('errors.title')}</AlertTitle>
          <AlertDescription>{locationError}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLocating && (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t('locating')}</p>
          </CardContent>
        </Card>
      )}

      {/* No Location State */}
      {!userLocation && !isLocating && !locationError && (
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">{t('noLocation')}</p>
            <Button onClick={handleGetLocation} className="gap-2">
              <MapPin className="h-4 w-4" />
              {t('getLocation')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Repeater List */}
      {userLocation && sortedRepeaters.length > 0 && (
        <div className="space-y-3">
          {sortedRepeaters.slice(0, 20).map((repeater, index) => {
            const relativeBearing = getRelativeBearing(repeater.bearing);
            const isFirst = index === 0;

            return (
              <Card
                key={repeater.callsign}
                className={cn(
                  'rounded-2xl transition-all hover:shadow-md',
                  isFirst && 'ring-2 ring-ship-cove-500 bg-ship-cove-50/50 dark:bg-ship-cove-950/20'
                )}
              >
                <CardContent className="py-4">
                  {/* Mobile: stacked layout / Desktop: horizontal flex */}
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                    {/* Mobile: rank + distance inline / Desktop: vertical stack */}
                    <div className="flex items-center gap-3 sm:flex-col sm:text-center sm:min-w-[60px] sm:gap-0">
                      <div
                        className={cn(
                          'text-2xl font-bold',
                          isFirst ? 'text-ship-cove-600 dark:text-ship-cove-400' : 'text-muted-foreground'
                        )}
                      >
                        #{index + 1}
                      </div>
                      <div className="text-sm font-medium">{formatDistance(repeater.distance)}</div>
                    </div>

                    {/* Bearing Indicator - smaller on mobile */}
                    <div
                      className={cn(
                        'flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all',
                        compass.isEnabled
                          ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-500'
                          : 'bg-muted'
                      )}
                    >
                      <Navigation
                        className={cn(
                          'h-6 w-6 sm:h-8 sm:w-8 transition-transform',
                          compass.isEnabled
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-muted-foreground'
                        )}
                        style={{
                          transform: `rotate(${
                            compass.isEnabled && relativeBearing !== null
                              ? relativeBearing
                              : repeater.bearing
                          }deg)`,
                        }}
                      />
                    </div>

                    {/* Repeater Info - full width on mobile */}
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/repeater/${repeater.callsign}`}
                          className="text-lg font-bold font-mono hover:text-ship-cove-600 dark:hover:text-ship-cove-400 transition-colors"
                        >
                          {repeater.callsign}
                        </Link>
                        <Badge variant="secondary">{getBandFromFrequency(repeater.outputFrequency)}</Badge>
                        <Badge variant="outline">{repeater.modulation}</Badge>
                        {repeater.dmr && <Badge className="bg-blue-600">DMR</Badge>}
                        {repeater.dstar && <Badge className="bg-purple-600">D-STAR</Badge>}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        <span className="font-mono">{repeater.outputFrequency.toFixed(4)} MHz</span>
                        {repeater.tone > 0 && <span className="ml-2">CTCSS: {repeater.tone} Hz</span>}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {repeater.owner} • {repeater.qth_locator}
                      </div>
                    </div>

                    {/* Bearing & Direction - inline on mobile, stacked on desktop */}
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0 sm:text-right sm:min-w-[100px]">
                      <div className="text-base sm:text-lg font-bold font-mono">
                        {Math.round(repeater.bearing)}° {bearingToCardinal(repeater.bearing)}
                      </div>
                      {compass.isEnabled && relativeBearing !== null && (
                        <div
                          className={cn(
                            'text-sm font-medium',
                            Math.abs(relativeBearing) <= 15
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-orange-600 dark:text-orange-400'
                          )}
                        >
                          {getDirectionInstruction(relativeBearing)}
                        </div>
                      )}
                    </div>

                    {/* Link - hidden on mobile (callsign is clickable) */}
                    <Link
                      href={`/repeater/${repeater.callsign}`}
                      className="hidden sm:flex flex-shrink-0 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <ExternalLink className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {sortedRepeaters.length > 20 && (
            <p className="text-center text-sm text-muted-foreground">
              {t('showingCount', { shown: 20, total: sortedRepeaters.length })}
            </p>
          )}
        </div>
      )}

      {/* Info */}
      {userLocation && (
        <Card className="rounded-2xl">
          <CardContent className="py-4">
            <div className="flex items-start gap-2 text-sm text-muted-foreground">
              <Radio className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>{t('info')}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
