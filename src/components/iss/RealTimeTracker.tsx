'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TLEData, ObserverLocation, SatellitePosition, LookAngles } from '@/lib/iss/types';
import { azimuthToCardinal } from '@/lib/iss/satellite-calculations';
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Satellite, Compass, TrendingUp, Navigation, Clock, Eye } from 'lucide-react';

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
  const isOverhead = currentLookAngles ? currentLookAngles.elevation > 0 : false;

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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Estado Atual
            </CardTitle>
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
            <div className="space-y-1">
              <div className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Compass className="h-3 w-3" />
                Azimute
              </div>
              <div className="text-2xl font-bold font-mono">
                {currentLookAngles.azimuth.toFixed(1)}°
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                {azimuthToCardinal(currentLookAngles.azimuth)}
              </div>
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
