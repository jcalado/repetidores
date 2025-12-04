'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SFI_THRESHOLDS } from '@/lib/propagation/constants';
import type { SolarIndices, HamQSLData } from '@/lib/propagation/types';
import { useTranslations } from 'next-intl';
import { SunIcon } from '@heroicons/react/24/outline';

interface SolarIndicesCardProps {
  solarIndices: SolarIndices | null;
  hamQSL: HamQSLData | null;
}

function getSFIColor(sfi: number): string {
  if (sfi >= SFI_THRESHOLDS.EXCELLENT) return 'text-green-500';
  if (sfi >= SFI_THRESHOLDS.HIGH) return 'text-green-400';
  if (sfi >= SFI_THRESHOLDS.MODERATE) return 'text-yellow-500';
  if (sfi >= SFI_THRESHOLDS.LOW) return 'text-orange-500';
  return 'text-red-500';
}

function SFIGauge({ value }: { value: number }) {
  // Map SFI (typically 60-300) to percentage (0-100)
  const percentage = Math.min(100, Math.max(0, ((value - 60) / 240) * 100));

  return (
    <div className="relative h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
      <div
        className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export function SolarIndicesCard({ solarIndices, hamQSL }: SolarIndicesCardProps) {
  const t = useTranslations('propagation');

  // Prefer HamQSL data if available, fallback to NOAA
  const sfi = hamQSL?.solarFlux ?? solarIndices?.solarFlux?.flux ?? 0;
  const ssn = hamQSL?.sunspotNumber ?? 0;
  const windSpeed = hamQSL?.solarWind ?? solarIndices?.solarWind?.speed ?? 0;
  const xRay = hamQSL?.xRay ?? 'N/A';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SunIcon className="h-5 w-5 text-yellow-500" />
          {t('solar.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-muted-foreground">{t('solar.flux')}</span>
            <span className={`text-2xl font-bold ${getSFIColor(sfi)}`}>{sfi}</span>
          </div>
          <SFIGauge value={sfi} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t('solar.sunspots')}</div>
            <div className="text-xl font-semibold">{ssn}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t('solar.wind')}</div>
            <div className="text-xl font-semibold">{windSpeed}</div>
            <div className="text-xs text-muted-foreground">km/s</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t('solar.xray')}</div>
            <div className="text-xl font-semibold">{xRay}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
