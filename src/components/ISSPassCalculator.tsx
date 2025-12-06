'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Satellite, Map, Eye, Activity, AlertCircle, Radio } from 'lucide-react';
import { ObserverLocation, TLEData, ISSPass, PassFilters as PassFiltersType, SatellitePosition } from '@/lib/iss/types';
import { fetchSatelliteTLE, getCacheAge, formatCacheAge } from '@/lib/iss/tle-fetcher';
import { predictPasses } from '@/lib/iss/pass-predictor';
import { enrichPassesWithVisibility, filterVisiblePasses } from '@/lib/iss/visibility-calculator';
import { calculateSatellitePosition, calculateLookAngles } from '@/lib/iss/satellite-calculations';
import { fetchWeatherWithCache, getWeatherAtTime, isGoodWeatherConditions } from '@/lib/iss/weather-service';
import { LocationSelector } from '@/components/iss/LocationSelector';
import { PassFilters } from '@/components/iss/PassFilters';
import { PassList } from '@/components/iss/PassList';
import { SkyChart } from '@/components/iss/SkyChart';
import { GroundTrack } from '@/components/iss/GroundTrack';
import { RealTimeTracker } from '@/components/iss/RealTimeTracker';
import { SATELLITES, SatelliteInfo, DEFAULT_SATELLITE } from '@/lib/satellites/satellite-catalog';

export function ISSPassCalculator() {
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteInfo>(DEFAULT_SATELLITE);
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [tle, setTle] = useState<TLEData | null>(null);
  const [allPasses, setAllPasses] = useState<ISSPass[]>([]); // Unfiltered passes
  const [filters, setFilters] = useState<PassFiltersType>({
    minElevation: 10,
    visibleOnly: false,
    goodWeatherOnly: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tleAge, setTleAge] = useState<number | null>(null);

  // Real-time updates every second
  const [currentTime, setCurrentTime] = useState(new Date());
  // Throttled time for orbit path (updates every 30 seconds)
  const [orbitBaseTime, setOrbitBaseTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Update orbit base time every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setOrbitBaseTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current ISS position and look angles
  const currentPosition = useMemo(() => {
    if (!tle) return null;
    return calculateSatellitePosition(tle, currentTime);
  }, [tle, currentTime]);

  const currentLookAngles = useMemo(() => {
    if (!tle || !location) return null;
    return calculateLookAngles(tle, location, currentTime);
  }, [tle, location, currentTime]);

  // Generate orbit paths for ground track
  // Uses throttled orbitBaseTime to avoid recalculating every second
  // ISS orbital period is ~92 minutes
  const orbitPaths = useMemo(() => {
    if (!tle) return { previous: [], current: [], next: [] };

    const ORBIT_MINUTES = 92;
    const generatePath = (startOffset: number, duration: number) => {
      const path: SatellitePosition[] = [];
      for (let i = 0; i <= duration; i++) {
        const time = new Date(orbitBaseTime.getTime() + (startOffset + i) * 60 * 1000);
        const pos = calculateSatellitePosition(tle, time);
        if (pos) path.push(pos);
      }
      return path;
    };

    return {
      previous: generatePath(-ORBIT_MINUTES, ORBIT_MINUTES),  // -92 to 0 minutes
      current: generatePath(0, ORBIT_MINUTES),                 // 0 to +92 minutes
      next: generatePath(ORBIT_MINUTES, ORBIT_MINUTES),        // +92 to +184 minutes
    };
  }, [tle, orbitBaseTime]);

  // Apply filters client-side (cheap operation)
  const filteredPasses = useMemo(() => {
    let result = allPasses;

    if (filters.minElevation > 0) {
      result = result.filter(pass => pass.maxElevation >= filters.minElevation);
    }

    if (filters.visibleOnly) {
      result = filterVisiblePasses(result);
    }

    if (filters.goodWeatherOnly) {
      result = result.filter(pass => isGoodWeatherConditions(pass.weather));
    }

    return result;
  }, [allPasses, filters]);

  // Calculate next pass time
  const nextPassTime = useMemo(() => {
    if (!tle || !location || filteredPasses.length === 0) return null;
    const nextPass = filteredPasses.find(pass => pass.startTime > currentTime);
    return nextPass ? nextPass.startTime : null;
  }, [tle, location, filteredPasses, currentTime]);

  // Load TLE function
  const loadTLE = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    const result = await fetchSatelliteTLE(selectedSatellite.noradId, forceRefresh);

    if (result.error) {
      setError(result.error);
    }

    if (result.data) {
      setTle(result.data);
      setTleAge(Date.now() - result.data.fetchedAt);
    }

    setIsLoading(false);
  }, [selectedSatellite.noradId]);

  // Load TLE data on mount and when satellite changes
  useEffect(() => {
    loadTLE();
    // Update cache age every minute
    const interval = setInterval(() => {
      setTleAge(getCacheAge(selectedSatellite.noradId));
    }, 60000);
    return () => clearInterval(interval);
  }, [loadTLE, selectedSatellite.noradId]);

  // Calculate passes when location or TLE changes (expensive operation)
  const calculatePasses = useCallback(async () => {
    if (!location || !tle) return;

    setIsLoading(true);

    try {
      // Predict ALL passes for next 7 days (no filtering here)
      let passes = predictPasses(tle, location, new Date(), 7);

      // Enrich with visibility information
      passes = enrichPassesWithVisibility(tle, location, passes);

      // Fetch weather forecast for the location
      const weatherForecast = await fetchWeatherWithCache(location);

      // Enrich passes with weather data
      if (weatherForecast) {
        passes = passes.map(pass => ({
          ...pass,
          weather: getWeatherAtTime(weatherForecast, pass.maxElevationTime) || undefined,
        }));
      }

      // Store unfiltered passes
      setAllPasses(passes);
    } catch (err) {
      console.error('Error calculating passes:', err);
      setError('Erro ao calcular passagens');
    } finally {
      setIsLoading(false);
    }
  }, [location, tle]);

  // Only recalculate when location or TLE changes (not when filters change!)
  useEffect(() => {
    if (location && tle) {
      calculatePasses();
    }
  }, [location, tle, calculatePasses]);

  const handleRefreshTLE = () => {
    loadTLE(true);
  };

  const handleSatelliteChange = (satelliteId: string) => {
    const sat = SATELLITES.find(s => s.id === satelliteId);
    if (sat) {
      setSelectedSatellite(sat);
      setTle(null);
      setAllPasses([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Satellite className="h-8 w-8" />
            Passagens de Satélites
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Previsões de passagens de satélites de radioamador
          </p>
        </div>
        <Button
          onClick={handleRefreshTLE}
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar TLE
        </Button>
      </div>

      {/* Satellite Selector */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex-1 max-w-xs">
          <Select value={selectedSatellite.id} onValueChange={handleSatelliteChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar satélite" />
            </SelectTrigger>
            <SelectContent>
              {SATELLITES.map((sat) => (
                <SelectItem key={sat.id} value={sat.id}>
                  {sat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedSatellite && (
          <div className="flex flex-wrap gap-2 text-sm">
            {selectedSatellite.mode && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                <Radio className="h-3 w-3" />
                {selectedSatellite.mode}
              </span>
            )}
            {selectedSatellite.downlink && (
              <span className="px-2 py-1 rounded-md bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                ↓ {selectedSatellite.downlink}
              </span>
            )}
            {selectedSatellite.uplink && (
              <span className="px-2 py-1 rounded-md bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300">
                ↑ {selectedSatellite.uplink}
              </span>
            )}
          </div>
        )}
      </div>

      {/* TLE Status */}
      {tleAge !== null && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dados Orbitais</AlertTitle>
          <AlertDescription>
            Última atualização: {formatCacheAge(tleAge)}
            {tleAge > 48 * 60 * 60 * 1000 && (
              <span className="text-orange-600 dark:text-orange-400 ml-2">
                (recomendamos atualizar)
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Location Selector */}
      <LocationSelector location={location} onLocationChange={setLocation} />

      {/* Show content only if location and TLE are available */}
      {location && tle ? (
        <>
          {/* Filters */}
          <PassFilters filters={filters} onFiltersChange={setFilters} />

          {/* Tabs */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                Lista
              </TabsTrigger>
              <TabsTrigger value="sky" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                Carta Celeste
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-1">
                <Map className="h-4 w-4" />
                Rastro no Solo
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-1">
                <Satellite className="h-4 w-4" />
                Tempo Real
              </TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <PassList passes={filteredPasses} currentTime={currentTime} />
            </TabsContent>

            <TabsContent value="sky" className="mt-6">
              <SkyChart passes={filteredPasses} currentPosition={currentLookAngles} />
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <GroundTrack
                currentPosition={currentPosition}
                observer={location}
                orbitPaths={orbitPaths}
              />
            </TabsContent>

            <TabsContent value="live" className="mt-6">
              <RealTimeTracker
                tle={tle}
                observer={location}
                currentTime={currentTime}
                currentPosition={currentPosition}
                currentLookAngles={currentLookAngles}
                nextPassTime={nextPassTime}
              />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuração Necessária</AlertTitle>
          <AlertDescription>
            {!location && 'Por favor, defina sua localização para calcular as passagens da ISS.'}
            {!tle && location && 'Carregando dados orbitais...'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
