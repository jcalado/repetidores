'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TLEData, ObserverLocation, SatellitePosition, LookAngles } from '@/lib/iss/types';
import { azimuthToCardinal } from '@/lib/iss/satellite-calculations';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Satellite, Compass, TrendingUp, Navigation, Clock, Eye } from 'lucide-react';
import { useDeviceCompass } from '@/hooks/useDeviceCompass';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface RealTimeTrackerProps {
  tle: TLEData | null;
  observer: ObserverLocation;
  currentTime: Date;
  currentPosition: SatellitePosition | null;
  currentLookAngles: LookAngles | null;
  nextPassTime: Date | null;
}

export function RealTimeTracker({
  tle,
  currentPosition,
  currentLookAngles,
  nextPassTime,
}: RealTimeTrackerProps) {
  const tCompass = useTranslations('compass');
  const compass = useDeviceCompass();
  const isOverhead = currentLookAngles ? currentLookAngles.elevation > 0 : false;

  // Calculate relative bearing when compass is active
  const relativeBearing = React.useMemo(() => {
    if (!currentLookAngles || compass.heading === null) return null;
    let relative = currentLookAngles.azimuth - compass.heading;
    while (relative > 180) relative -= 360;
    while (relative < -180) relative += 360;
    return relative;
  }, [currentLookAngles, compass.heading]);

  // Get direction instruction
  const getDirectionInstruction = (rel: number): string => {
    const abs = Math.abs(rel);
    if (abs <= 15) return tCompass('ahead');
    if (abs <= 45) return rel > 0 ? tCompass('slightRight') : tCompass('slightLeft');
    if (abs <= 135) return rel > 0 ? tCompass('right') : tCompass('left');
    return tCompass('behind');
  };

  if (!currentPosition || !currentLookAngles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rastreamento em Tempo Real</CardTitle>
          <CardDescription>Carregando dados da ISS...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overhead status */}
      <Card className={isOverhead
        ? 'bg-[oklch(0.96_0.03_145)] dark:bg-[oklch(0.28_0.05_145/0.4)] border-[oklch(0.85_0.08_145)] dark:border-[oklch(0.45_0.08_145/0.5)]'
        : undefined
      }>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Estado Atual
            </CardTitle>
            <div className="flex items-center gap-2">
              {compass.isSupported && (
                <Button
                  variant={compass.isEnabled ? "default" : "outline"}
                  size="sm"
                  className="gap-1"
                  onClick={() => compass.toggle()}
                >
                  <Compass className={cn("h-3 w-3", compass.isEnabled && "animate-pulse")} />
                  <span className="hidden sm:inline">
                    {compass.isEnabled ? tCompass('disable') : tCompass('enable')}
                  </span>
                </Button>
              )}
              {isOverhead ? (
                <Badge variant="success" className="animate-pulse">
                  <Eye className="h-3 w-3 mr-1" />
                  Visível agora
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Abaixo do Horizonte
                </Badge>
              )}
            </div>
          </div>
          {compass.error && (
            <p className="text-sm text-destructive mt-1">{compass.error}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Elevação
              </div>
              <div className={`text-2xl font-bold font-mono ${isOverhead ? 'text-[oklch(0.45_0.13_145)] dark:text-[oklch(0.78_0.13_145)]' : ''}`}>
                {currentLookAngles.elevation.toFixed(1)}°
              </div>
            </div>
            <div className={cn(
              "space-y-1 p-2 -m-2 rounded-lg transition-all",
              compass.isEnabled && "bg-azulejo-100 dark:bg-azulejo-950/40"
            )}>
              <div className={cn(
                "flex items-center gap-1",
                compass.isEnabled ? "text-azulejo-700 dark:text-azulejo-400" : "text-muted-foreground"
              )}>
                <Compass className="h-3 w-3" style={{
                  transform: compass.isEnabled && relativeBearing !== null
                    ? `rotate(${relativeBearing}deg)`
                    : `rotate(${currentLookAngles.azimuth}deg)`
                }} />
                Azimute
                {compass.isEnabled && (
                  <span className="text-[10px] font-medium ml-1">(LIVE)</span>
                )}
              </div>
              <div className="text-2xl font-bold font-mono">
                {currentLookAngles.azimuth.toFixed(1)}°
              </div>
              <div className="text-xs text-muted-foreground">
                {azimuthToCardinal(currentLookAngles.azimuth)}
              </div>
              {compass.isEnabled && relativeBearing !== null && (
                <div className={cn(
                  "text-xs font-medium",
                  Math.abs(relativeBearing) <= 15
                    ? "text-[oklch(0.45_0.13_145)] dark:text-[oklch(0.78_0.13_145)]"
                    : "text-[oklch(0.55_0.15_55)] dark:text-[oklch(0.78_0.13_75)]"
                )}>
                  {getDirectionInstruction(relativeBearing)}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                Distância
              </div>
              <div className="text-2xl font-bold font-mono">
                {currentLookAngles.range.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">km</div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground flex items-center gap-1">
                <Satellite className="h-3 w-3" />
                Altitude
              </div>
              <div className="text-2xl font-bold font-mono">
                {currentPosition.altitude.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">km</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ISS Position */}
      <Card>
        <CardHeader>
          <CardTitle>Posição da ISS</CardTitle>
          <CardDescription>
            Localização geográfica atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-muted-foreground">Latitude</div>
              <div className="text-xl font-mono">
                {currentPosition.latitude.toFixed(4)}°
              </div>
              <div className="text-xs text-muted-foreground">
                {currentPosition.latitude > 0 ? 'Norte' : 'Sul'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Longitude</div>
              <div className="text-xl font-mono">
                {currentPosition.longitude.toFixed(4)}°
              </div>
              <div className="text-xs text-muted-foreground">
                {currentPosition.longitude > 0 ? 'Este' : 'Oeste'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-muted-foreground">Velocidade</div>
              <div className="text-xl font-mono">
                {(currentPosition.velocity * 3600).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">km/h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Pass Countdown */}
      {!isOverhead && nextPassTime && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-azulejo-600 dark:text-azulejo-400" />
              Próxima Passagem
            </CardTitle>
            <CardDescription className="text-lg font-medium text-foreground">
              {formatDistanceToNow(nextPassTime, { locale: pt, addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-foreground">
              <strong>Dica:</strong> Configure um alarme para não perder a próxima passagem visível!
            </div>
          </CardContent>
        </Card>
      )}

      {/* TLE Age Warning */}
      {tle && (
        <div className="text-xs text-muted-foreground text-center">
          Dados orbitais de <span className="font-mono">{new Date(tle.fetchedAt).toLocaleString('pt-PT')}</span>
          {Date.now() - tle.fetchedAt > 48 * 60 * 60 * 1000 && (
            <span className="text-[oklch(0.55_0.15_55)] dark:text-[oklch(0.78_0.13_75)] ml-2">
              (atualize os dados para maior precisão)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
