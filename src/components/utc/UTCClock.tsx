'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Clock, Globe, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UTCClock() {
  const t = useTranslations('utc');
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set initial time
    setCurrentTime(new Date());

    // Update every second
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date, timeZone: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  };

  const formatDate = (date: Date, timeZone: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone,
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatDateShort = (date: Date, timeZone: string) => {
    return new Intl.DateTimeFormat('pt-PT', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  };

  // Get local timezone name
  const getTimezoneAbbr = () => {
    try {
      const formatter = new Intl.DateTimeFormat('en', {
        timeZoneName: 'short',
      });
      const parts = formatter.formatToParts(new Date());
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return tzPart?.value || 'Local';
    } catch {
      return 'Local';
    }
  };

  if (!currentTime) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-48 mb-4"></div>
          <div className="h-64 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
          {t('title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* UTC Time - Primary */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Globe className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
              {t('utcTime')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-6 py-4 rounded-2xl bg-gradient-to-br from-ship-cove-500 to-ship-cove-700 text-white shadow-xl">
                <span className="text-5xl sm:text-7xl md:text-8xl font-mono font-bold tracking-wider">
                  {formatTime(currentTime, 'UTC')}
                </span>
              </div>
              <p className="mt-4 text-lg text-muted-foreground capitalize">
                {formatDate(currentTime, 'UTC')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground font-mono">
                {formatDateShort(currentTime, 'UTC')} UTC
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Local Time */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
              {t('localTime')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center px-4 py-3 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                <span className="text-3xl sm:text-4xl font-mono font-bold text-slate-900 dark:text-white tracking-wider">
                  {formatTime(currentTime, Intl.DateTimeFormat().resolvedOptions().timeZone)}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground capitalize">
                {formatDate(currentTime, Intl.DateTimeFormat().resolvedOptions().timeZone)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground font-mono">
                {getTimezoneAbbr()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Day of Year / Julian Date */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
              {t('dayInfo')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <span className="text-sm text-muted-foreground">{t('dayOfYear')}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <span className="text-sm text-muted-foreground">{t('week')}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {Math.ceil((Math.floor((currentTime.getTime() - new Date(currentTime.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + new Date(currentTime.getFullYear(), 0, 1).getDay() + 1) / 7)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <span className="text-sm text-muted-foreground">{t('unixTimestamp')}</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white text-sm">
                  {Math.floor(currentTime.getTime() / 1000)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
