'use client';

import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Repeater } from '@/app/columns';
import { calculateDistance, formatDistance } from '@/lib/geolocation';
import { useDeviceCompass } from '@/hooks/useDeviceCompass';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { StandardPageHeader } from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  Compass,
  Loader2,
  RefreshCw,
  Signal,
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

function getPrimaryFrequency(r: Repeater) {
  if (!r.frequencies || r.frequencies.length === 0) return null;
  return r.frequencies.find((f) => f.isPrimary) || r.frequencies[0];
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
    <Card>
      <CardContent>
        <StandardPageHeader
          icon={<Crosshair className="h-5 w-5" />}
          title={t('title')}
          description={t('description')}
          noMargin
          actions={
            <div className="flex items-center gap-1.5">
              {compass.isSupported && userLocation && (
                <Button
                  variant={compass.isEnabled ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => compass.toggle()}
                >
                  <Compass className="h-4 w-4" />
                  <span className="hidden sm:inline">
                    {compass.isEnabled ? tCompass('disable') : tCompass('enable')}
                  </span>
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => requestLocation(true)}
                disabled={isLocating}
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t('refreshLocation')}</span>
              </Button>
            </div>
          }
        />

        {/* Position strip — calm meta-line, no extra card */}
        {userLocation && (
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
                Posição atual
              </span>
              <span className="font-mono tabular-nums text-foreground">
                {userLocation.qthLocator ||
                  `${userLocation.latitude.toFixed(5)}, ${userLocation.longitude.toFixed(5)}`}
              </span>
            </div>
            {compass.isEnabled && compass.heading !== null && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Compass
                  className="h-3.5 w-3.5 text-azulejo-600 dark:text-azulejo-400"
                  aria-hidden="true"
                />
                <span>{t('heading')}</span>
                <span className="font-mono tabular-nums text-foreground">
                  {compass.heading}° {bearingToCardinal(compass.heading)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Loading */}
        {isLocating && !userLocation && (
          <div className="mt-5 flex flex-col items-center justify-center py-12 text-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm text-muted-foreground">{t('locating')}</p>
          </div>
        )}

        {/* No location */}
        {!userLocation && !isLocating && (
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 text-center">
            <div className="flex size-12 items-center justify-center rounded-lg border border-border bg-muted">
              <MapPin className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">{t('noLocation')}</p>
            <p className="mt-1 max-w-xs text-xs text-muted-foreground">
              {t('setLocationHint')}
            </p>
            <Button className="mt-4" size="sm" onClick={() => requestLocation(true)}>
              <Crosshair className="h-4 w-4" />
              Obter localização
            </Button>
          </div>
        )}

        {/* List */}
        {userLocation && sortedRepeaters.length > 0 && (
          <ol className="mt-4 divide-y divide-border border-t border-border">
            {sortedRepeaters.slice(0, 20).map((repeater, index) => {
              const relativeBearing = getRelativeBearing(repeater.bearing);
              return (
                <NearestRow
                  key={repeater.callsign}
                  repeater={repeater}
                  index={index}
                  compassEnabled={compass.isEnabled}
                  relativeBearing={relativeBearing}
                  getDirectionInstruction={getDirectionInstruction}
                />
              );
            })}
          </ol>
        )}

        {userLocation && sortedRepeaters.length > 20 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {t('showingCount', { shown: 20, total: sortedRepeaters.length })}
          </p>
        )}

        {/* Footer hint */}
        {userLocation && (
          <p className="mt-4 flex items-start gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <Signal className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t('info')}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface NearestRowProps {
  repeater: RepeaterWithDistance;
  index: number;
  compassEnabled: boolean;
  relativeBearing: number | null;
  getDirectionInstruction: (bearing: number) => string;
}

function NearestRow({
  repeater,
  index,
  compassEnabled,
  relativeBearing,
  getDirectionInstruction,
}: NearestRowProps) {
  const primary = getPrimaryFrequency(repeater);
  const modesStr =
    repeater.modes?.map((m) => (m === 'DSTAR' ? 'D-STAR' : m)).join(' · ') || 'FM';

  const aligned =
    compassEnabled && relativeBearing !== null && Math.abs(relativeBearing) <= 15;

  return (
    <li>
      <Link
        href={`/repeater/${repeater.callsign}/`}
        className="group flex items-center gap-3 py-2.5 transition-colors hover:bg-azulejo-50/40 dark:hover:bg-azulejo-950/20"
      >
        {/* Rank */}
        <span className="w-5 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted-foreground">
          {index + 1}
        </span>

        {/* Bearing tile — rotates to point at the repeater */}
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-lg border bg-muted',
            compassEnabled
              ? 'border-azulejo-300 dark:border-azulejo-700'
              : 'border-border'
          )}
          aria-label={`${Math.round(repeater.bearing)}° ${bearingToCardinal(repeater.bearing)}`}
        >
          <Navigation
            className={cn(
              'h-4 w-4 transition-transform duration-300',
              compassEnabled
                ? 'text-azulejo-600 dark:text-azulejo-400'
                : 'text-muted-foreground'
            )}
            style={{
              transform: `rotate(${
                compassEnabled && relativeBearing !== null
                  ? relativeBearing
                  : repeater.bearing
              }deg)`,
            }}
            aria-hidden="true"
          />
        </div>

        {/* Identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold tabular-nums text-foreground transition-colors group-hover:text-azulejo-700 dark:group-hover:text-azulejo-300">
              {repeater.callsign}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
              {modesStr}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[12.5px] text-muted-foreground">
            {primary && (
              <span className="whitespace-nowrap font-mono tabular-nums">
                {primary.outputFrequency.toFixed(3)}
                <span className="text-muted-foreground/70"> MHz</span>
              </span>
            )}
            {primary?.tone ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="whitespace-nowrap font-mono tabular-nums">
                  {primary.tone} Hz
                </span>
              </>
            ) : null}
            {repeater.qthLocator && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{repeater.qthLocator}</span>
              </>
            )}
          </div>
        </div>

        {/* Right column: distance + bearing + direction */}
        <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatDistance(repeater.distance)}
          </span>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
            {Math.round(repeater.bearing)}° {bearingToCardinal(repeater.bearing)}
          </span>
          {compassEnabled && relativeBearing !== null && (
            <span
              className={cn(
                'text-[10px] font-medium',
                aligned
                  ? 'text-[oklch(0.45_0.13_145)] dark:text-[oklch(0.78_0.13_145)]'
                  : 'text-[oklch(0.55_0.13_75)] dark:text-[oklch(0.78_0.13_75)]'
              )}
            >
              {getDirectionInstruction(relativeBearing)}
            </span>
          )}
        </div>
      </Link>
    </li>
  );
}
