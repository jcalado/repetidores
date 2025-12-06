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
        ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800'
        : 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950'
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
                  onClick={() => compass.toggle()}
                  className={cn(
                    "gap-1",
                    compass.isEnabled && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  <Compass className={cn("h-3 w-3", compass.isEnabled && "animate-pulse")} />
                  <span className="hidden sm:inline">
                    {compass.isEnabled ? tCompass('disable') : tCompass('enable')}
                  </span>
                </Button>
              )}
              {isOverhead ? (
                <Badge className="bg-green-600 hover:bg-green-700 animate-pulse">
                  <Eye className="h-3 w-3 mr-1" />
                  VISÍVEL AGORA
                </Badge>
              ) : (
                <Badge variant="secondary">
                  Abaixo do Horizonte
                </Badge>
              )}
            </div>
          </div>
          {compass.error && (
            <p className="text-sm text-red-500 mt-1">{compass.error}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Elevação
              </div>
              <div className={`text-2xl font-bold font-mono ${isOverhead ? 'text-green-700 dark:text-green-400' : ''}`}>
                {currentLookAngles.elevation.toFixed(1)}°
              </div>
            </div>
            <div className={cn(
              "space-y-1 p-2 -m-2 rounded-lg transition-all",
              compass.isEnabled && "bg-green-100 dark:bg-green-900/30"
            )}>
              <div className={cn(
                "flex items-center gap-1",
                compass.isEnabled ? "text-green-700 dark:text-green-400" : "text-slate-600 dark:text-slate-400"
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
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {azimuthToCardinal(currentLookAngles.azimuth)}
              </div>
              {compass.isEnabled && relativeBearing !== null && (
                <div className={cn(
                  "text-xs font-medium",
                  Math.abs(relativeBearing) <= 15
                    ? "text-green-600 dark:text-green-400"
                    : "text-orange-600 dark:text-orange-400"
                )}>
                  {getDirectionInstruction(relativeBearing)}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Navigation className="h-3 w-3" />
                Distância
              </div>
              <div className="text-2xl font-bold font-mono">
                {currentLookAngles.range.toFixed(0)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">km</div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Satellite className="h-3 w-3" />
                Altitude
              </div>
              <div className="text-2xl font-bold font-mono">
                {currentPosition.altitude.toFixed(0)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">km</div>
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
              <div className="text-slate-600 dark:text-slate-400">Latitude</div>
              <div className="text-xl font-mono">
                {currentPosition.latitude.toFixed(4)}°
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {currentPosition.latitude > 0 ? 'Norte' : 'Sul'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400">Longitude</div>
              <div className="text-xl font-mono">
                {currentPosition.longitude.toFixed(4)}°
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {currentPosition.longitude > 0 ? 'Este' : 'Oeste'}
              </div>
            </div>
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400">Velocidade</div>
              <div className="text-xl font-mono">
                {(currentPosition.velocity * 3600).toFixed(0)}
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">km/h</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Pass Countdown */}
      {!isOverhead && nextPassTime && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próxima Passagem
            </CardTitle>
            <CardDescription className="text-lg font-medium text-blue-900 dark:text-blue-100">
              {formatDistanceToNow(nextPassTime, { locale: pt, addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-700 dark:text-slate-300">
              <strong>Dica:</strong> Configure um alarme para não perder a próxima passagem visível!
            </div>
          </CardContent>
        </Card>
      )}

      {/* TLE Age Warning */}
      {tle && (
        <div className="text-xs text-slate-600 dark:text-slate-400 text-center">
          Dados orbitais de {new Date(tle.fetchedAt).toLocaleString('pt-PT')}
          {Date.now() - tle.fetchedAt > 48 * 60 * 60 * 1000 && (
            <span className="text-orange-600 dark:text-orange-400 ml-2">
              (atualize os dados para maior precisão)
            </span>
          )}
        </div>
      )}
    </div>
  );
}
