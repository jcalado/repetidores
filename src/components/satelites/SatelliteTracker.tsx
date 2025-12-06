'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  RefreshCw,
  Satellite,
  Map,
  Eye,
  Activity,
  AlertCircle,
  Radio,
  ChevronUp,
} from 'lucide-react';
import { ObserverLocation, TLEData, ISSPass, PassFilters as PassFiltersType, SatellitePosition } from '@/lib/iss/types';
import { predictPasses } from '@/lib/iss/pass-predictor';
import { enrichPassesWithVisibility, filterVisiblePasses } from '@/lib/iss/visibility-calculator';
import { calculateSatellitePosition, calculateLookAngles } from '@/lib/iss/satellite-calculations';
import { fetchWeatherWithCache, getWeatherAtTime, isGoodWeatherConditions } from '@/lib/iss/weather-service';
import { PassFilters } from '@/components/iss/PassFilters';
import { PassList } from '@/components/iss/PassList';
import { SkyChart } from '@/components/iss/SkyChart';
import { GroundTrack } from '@/components/iss/GroundTrack';
import { RealTimeTracker } from '@/components/iss/RealTimeTracker';
import { LocationDisplay } from './LocationDisplay';
import { SatelliteSelector } from './SatelliteSelector';
import {
  SatelliteWithTLE,
  buildSatelliteCatalog,
  getDefaultSatellite,
  getSatelliteTLE,
} from '@/lib/satellites/satellite-catalog';
import { fetchBulkTLE, formatBulkCacheAge, getBulkCacheAge } from '@/lib/satellites/tle-bulk-fetcher';

export function SatelliteTracker() {
  // Satellite catalog state
  const [satellites, setSatellites] = useState<SatelliteWithTLE[]>([]);
  const [selectedSatellite, setSelectedSatellite] = useState<SatelliteWithTLE | null>(null);
  const [isCatalogLoading, setIsCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [showSatelliteSelector, setShowSatelliteSelector] = useState(false);

  // Location and TLE state
  const [location, setLocation] = useState<ObserverLocation | null>(null);
  const [tle, setTle] = useState<TLEData | null>(null);
  const [allPasses, setAllPasses] = useState<ISSPass[]>([]);
  const [filters, setFilters] = useState<PassFiltersType>({
    minElevation: 10,
    visibleOnly: false,
    goodWeatherOnly: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tleAge, setTleAge] = useState<number | null>(null);

  // Real-time updates
  const [currentTime, setCurrentTime] = useState(new Date());
  const [orbitBaseTime, setOrbitBaseTime] = useState(new Date());

  // Update current time every second
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

  // Load satellite catalog on mount
  useEffect(() => {
    async function loadCatalog() {
      setIsCatalogLoading(true);
      setCatalogError(null);

      try {
        const result = await buildSatelliteCatalog();

        if (result.satellites.length === 0) {
          setCatalogError(result.error || 'Nenhum satelite encontrado');
          return;
        }

        setSatellites(result.satellites);

        // Select default satellite (ISS)
        const defaultSat = getDefaultSatellite(result.satellites);
        if (defaultSat) {
          setSelectedSatellite(defaultSat);
        } else {
          setSelectedSatellite(result.satellites[0]);
        }

        if (result.error) {
          // Non-fatal error (e.g., using cached data)
          console.warn('Catalog warning:', result.error);
        }
      } catch (err) {
        console.error('Error loading catalog:', err);
        setCatalogError('Erro ao carregar catalogo de satelites');
      } finally {
        setIsCatalogLoading(false);
      }
    }

    loadCatalog();
  }, []);

  // Load TLE when satellite changes
  useEffect(() => {
    if (!selectedSatellite) return;

    // First try to get TLE from bulk cache
    const cachedTle = getSatelliteTLE(selectedSatellite.noradId);
    if (cachedTle) {
      setTle(cachedTle);
      setTleAge(Date.now() - cachedTle.fetchedAt);
    } else if (selectedSatellite.tle) {
      // Use TLE from satellite object
      setTle({
        line1: selectedSatellite.tle.line1,
        line2: selectedSatellite.tle.line2,
        fetchedAt: Date.now(),
      });
      setTleAge(getBulkCacheAge() || 0);
    }
  }, [selectedSatellite]);

  // Calculate current position and look angles
  const currentPosition = useMemo(() => {
    if (!tle) return null;
    return calculateSatellitePosition(tle, currentTime);
  }, [tle, currentTime]);

  const currentLookAngles = useMemo(() => {
    if (!tle || !location) return null;
    return calculateLookAngles(tle, location, currentTime);
  }, [tle, location, currentTime]);

  // Generate orbit paths for ground track
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
      previous: generatePath(-ORBIT_MINUTES, ORBIT_MINUTES),
      current: generatePath(0, ORBIT_MINUTES),
      next: generatePath(ORBIT_MINUTES, ORBIT_MINUTES),
    };
  }, [tle, orbitBaseTime]);

  // Apply filters to passes
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

  // Calculate passes when location or TLE changes
  const calculatePasses = useCallback(async () => {
    if (!location || !tle) return;

    setIsLoading(true);

    try {
      let passes = predictPasses(tle, location, new Date(), 7);
      passes = enrichPassesWithVisibility(tle, location, passes);

      const weatherForecast = await fetchWeatherWithCache(location);

      if (weatherForecast) {
        passes = passes.map(pass => ({
          ...pass,
          weather: getWeatherAtTime(weatherForecast, pass.maxElevationTime) || undefined,
        }));
      }

      setAllPasses(passes);
    } catch (err) {
      console.error('Error calculating passes:', err);
      setError('Erro ao calcular passagens');
    } finally {
      setIsLoading(false);
    }
  }, [location, tle]);

  // Recalculate when location or TLE changes
  useEffect(() => {
    if (location && tle) {
      calculatePasses();
    }
  }, [location, tle, calculatePasses]);

  // Handle TLE refresh
  const handleRefreshTLE = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await fetchBulkTLE(true);
      // Reload catalog to get fresh data
      const result = await buildSatelliteCatalog();
      setSatellites(result.satellites);

      // Re-select current satellite to update TLE
      if (selectedSatellite) {
        const updated = result.satellites.find(s => s.noradId === selectedSatellite.noradId);
        if (updated) {
          setSelectedSatellite(updated);
          if (updated.tle) {
            setTle({
              line1: updated.tle.line1,
              line2: updated.tle.line2,
              fetchedAt: Date.now(),
            });
            setTleAge(0);
          }
        }
      }
    } catch (err) {
      console.error('Error refreshing TLE:', err);
      setError('Erro ao atualizar dados orbitais');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle satellite selection
  const handleSatelliteSelect = (satellite: SatelliteWithTLE) => {
    setSelectedSatellite(satellite);
    setAllPasses([]);
    setShowSatelliteSelector(false);
  };

  // Show loading state while catalog loads
  if (isCatalogLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Satellite className="h-8 w-8 animate-pulse text-slate-400" />
          <p className="text-slate-600 dark:text-slate-400">
            Carregando catalogo de satelites...
          </p>
        </div>
      </div>
    );
  }

  // Show error if catalog failed to load
  if (catalogError && satellites.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{catalogError}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Satellite className="h-8 w-8" />
            Passagens de Satelites
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {satellites.length} satelites de radioamador disponiveis
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

      {/* Location Display */}
      <LocationDisplay onLocationChange={setLocation} />

      {/* Selected Satellite & Selector */}
      <Collapsible open={showSatelliteSelector} onOpenChange={setShowSatelliteSelector}>
        {/* Selected satellite summary */}
        {selectedSatellite && (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-semibold">{selectedSatellite.name}</h2>
                {selectedSatellite.mode && (
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                    {selectedSatellite.mode}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                {selectedSatellite.downlink && (
                  <span className="flex items-center gap-1">
                    <span className="text-green-600 dark:text-green-400">↓</span>
                    {selectedSatellite.downlink}
                  </span>
                )}
                {selectedSatellite.uplink && (
                  <span className="flex items-center gap-1">
                    <span className="text-orange-600 dark:text-orange-400">↑</span>
                    {selectedSatellite.uplink}
                  </span>
                )}
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="outline" size="sm">
                {showSatelliteSelector ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Fechar
                  </>
                ) : (
                  <>
                    <Radio className="h-4 w-4 mr-1" />
                    Alterar Satelite
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        )}

        <CollapsibleContent className="mt-4">
          <SatelliteSelector
            satellites={satellites}
            selectedSatellite={selectedSatellite}
            onSelect={handleSatelliteSelect}
            isLoading={isCatalogLoading}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* TLE Status */}
      {tleAge !== null && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Dados Orbitais</AlertTitle>
          <AlertDescription>
            Ultima atualizacao: {formatBulkCacheAge(tleAge)}
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

      {/* Main Content */}
      {location && tle ? (
        <>
          {/* Filters */}
          <PassFilters filters={filters} onFiltersChange={setFilters} />

          {/* Tabs */}
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="list" className="flex items-center gap-1">
                <Activity className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </TabsTrigger>
              <TabsTrigger value="sky" className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Carta Celeste</span>
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-1">
                <Map className="h-4 w-4" />
                <span className="hidden sm:inline">Rastro</span>
              </TabsTrigger>
              <TabsTrigger value="live" className="flex items-center gap-1">
                <Satellite className="h-4 w-4" />
                <span className="hidden sm:inline">Tempo Real</span>
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
          <AlertTitle>Configuracao Necessaria</AlertTitle>
          <AlertDescription>
            {!location && 'Por favor, defina sua localizacao para calcular as passagens.'}
            {!tle && location && 'Carregando dados orbitais...'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
