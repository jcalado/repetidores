'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RefreshCw, Satellite, Map, Eye, Activity, AlertCircle } from 'lucide-react';
import { ObserverLocation, TLEData, ISSPass, PassFilters as PassFiltersType, SatellitePosition } from '@/lib/iss/types';
import { fetchISSTLE, getCacheAge, formatCacheAge } from '@/lib/iss/tle-fetcher';
import { predictPasses } from '@/lib/iss/pass-predictor';
import { enrichPassesWithVisibility, filterVisiblePasses } from '@/lib/iss/visibility-calculator';
import { calculateSatellitePosition, calculateLookAngles } from '@/lib/iss/satellite-calculations';
import { LocationSelector } from '@/components/iss/LocationSelector';
import { PassFilters } from '@/components/iss/PassFilters';
import { PassList } from '@/components/iss/PassList';
import { SkyChart } from '@/components/iss/SkyChart';
import { GroundTrack } from '@/components/iss/GroundTrack';
import { RealTimeTracker } from '@/components/iss/RealTimeTracker';

export function ISSPassCalculator() {
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [tle, setTle] = useState<TLEData | null>(null);
  const [passes, setPasses] = useState<ISSPass[]>([]);
  const [filters, setFilters] = useState<PassFiltersType>({
    minElevation: 10,
    visibleOnly: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tleAge, setTleAge] = useState<number | null>(null);

  // Real-time updates every second
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
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

  // Generate orbit path for ground track (next 90 minutes)
  const orbitPath = useMemo(() => {
    if (!tle) return [];
    const path: SatellitePosition[] = [];
    const steps = 90; // 90 minutes
    for (let i = 0; i <= steps; i++) {
      const time = new Date(currentTime.getTime() + i * 60 * 1000);
      const pos = calculateSatellitePosition(tle, time);
      if (pos) path.push(pos);
    }
    return path;
  }, [tle, currentTime]);

  // Calculate next pass time
  const nextPassTime = useMemo(() => {
    if (!tle || !location || passes.length === 0) return null;
    const nextPass = passes.find(pass => pass.startTime > currentTime);
    return nextPass ? nextPass.startTime : null;
  }, [tle, location, passes, currentTime]);

  // Load TLE data on mount
  useEffect(() => {
    loadTLE();
    // Update cache age every minute
    const interval = setInterval(() => {
      setTleAge(getCacheAge());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate passes when location or TLE changes
  useEffect(() => {
    if (location && tle) {
      calculatePasses();
    }
  }, [location, tle, filters]);

  const loadTLE = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    const result = await fetchISSTLE(forceRefresh);

    if (result.error) {
      setError(result.error);
    }

    if (result.data) {
      setTle(result.data);
      setTleAge(Date.now() - result.data.fetchedAt);
    }

    setIsLoading(false);
  };

  const calculatePasses = () => {
    if (!location || !tle) return;

    setIsLoading(true);

    try {
      // Predict passes for next 7 days
      let allPasses = predictPasses(tle, location, new Date(), 7);

      // Enrich with visibility information
      allPasses = enrichPassesWithVisibility(tle, location, allPasses);

      // Apply filters
      let filteredPasses = allPasses;

      if (filters.minElevation > 0) {
        filteredPasses = filteredPasses.filter(
          pass => pass.maxElevation >= filters.minElevation
        );
      }

      if (filters.visibleOnly) {
        filteredPasses = filterVisiblePasses(filteredPasses);
      }

      setPasses(filteredPasses);
    } catch (err) {
      console.error('Error calculating passes:', err);
      setError('Erro ao calcular passagens');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshTLE = () => {
    loadTLE(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Satellite className="h-8 w-8" />
            Passagens da ISS
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Previsões de passagens da Estação Espacial Internacional
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
              <PassList passes={passes} currentTime={currentTime} />
            </TabsContent>

            <TabsContent value="sky" className="mt-6">
              <SkyChart passes={passes} currentPosition={currentLookAngles} />
            </TabsContent>

            <TabsContent value="map" className="mt-6">
              <GroundTrack
                currentPosition={currentPosition}
                observer={location}
                orbitPath={orbitPath}
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
