'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { fetchSolarIndices, fetchHamQSLData } from '@/lib/propagation/api';
import { REFRESH_INTERVALS } from '@/lib/propagation/constants';
import type { SolarIndices, HamQSLData } from '@/lib/propagation/types';
import { SolarIndicesCard } from './SolarIndicesCard';
import { GeomagneticCard } from './GeomagneticCard';
import { HFBandMatrix } from './HFBandMatrix';
import { VHFConditionsPanel } from './VHFConditionsPanel';
import { MUFMapEmbed } from './MUFMapEmbed';

export function PropagationStatus() {
  const t = useTranslations('propagation');

  const [solarIndices, setSolarIndices] = useState<SolarIndices | null>(null);
  const [hamQSL, setHamQSL] = useState<HamQSLData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) {
      setIsRefreshing(true);
    }
    setError(null);

    try {
      const [noaaData, hamQSLData] = await Promise.all([
        fetchSolarIndices(),
        fetchHamQSLData(),
      ]);

      setSolarIndices(noaaData);
      setHamQSL(hamQSLData);
      setLastUpdated(new Date());
    } catch (err) {
      setError(t('error'));
      console.error('Failed to fetch propagation data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [t]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh for solar indices (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, REFRESH_INTERVALS.SOLAR_INDICES);

    return () => clearInterval(interval);
  }, [fetchData]);

  const handleManualRefresh = () => {
    fetchData(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">{t('loading')}</p>
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Solar & Geomagnetic Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <SolarIndicesCard solarIndices={solarIndices} hamQSL={hamQSL} />
        <GeomagneticCard solarIndices={solarIndices} hamQSL={hamQSL} />
      </div>

      {/* HF Band Conditions */}
      <HFBandMatrix hamQSL={hamQSL} />

      {/* VHF/UHF Conditions */}
      <VHFConditionsPanel hamQSL={hamQSL} />

      {/* MUF Map */}
      <MUFMapEmbed />

      {/* Footer with last updated and refresh button */}
      <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground sm:flex-row sm:gap-4">
        {lastUpdated && (
          <span>
            {t('lastUpdated')}: {lastUpdated.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })} UTC
          </span>
        )}
        <span className="hidden sm:inline">•</span>
        <span>{t('autoRefresh')}: 5 min</span>
        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-medium text-ship-cove-600 hover:bg-ship-cove-50 disabled:opacity-50 dark:text-ship-cove-400 dark:hover:bg-ship-cove-900/20"
        >
          <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {t('refreshNow')}
        </button>
      </div>
    </div>
  );
}
