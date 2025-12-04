'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { K_INDEX_COLORS } from '@/lib/propagation/constants';
import type { SolarIndices, HamQSLData } from '@/lib/propagation/types';
import { useTranslations } from 'next-intl';
import { BoltIcon } from '@heroicons/react/24/outline';

interface GeomagneticCardProps {
  solarIndices: SolarIndices | null;
  hamQSL: HamQSLData | null;
}

function KIndexBar({ value }: { value: number }) {
  const segments = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <div className="flex gap-1">
      {segments.map((segment) => {
        const isActive = segment <= Math.round(value);
        const color = isActive ? K_INDEX_COLORS[segment]?.bg ?? 'bg-gray-300' : 'bg-gray-200 dark:bg-gray-700';

        return (
          <div
            key={segment}
            className={`h-6 flex-1 rounded ${color} transition-colors`}
            title={`K${segment}`}
          />
        );
      })}
    </div>
  );
}

export function GeomagneticCard({ solarIndices, hamQSL }: GeomagneticCardProps) {
  const t = useTranslations('propagation');

  // Prefer HamQSL data if available, fallback to NOAA
  const kIndex = hamQSL?.kIndex ?? solarIndices?.kIndex?.kp ?? 0;
  const aIndex = hamQSL?.aIndex ?? solarIndices?.kIndex?.aRunning ?? 0;
  const geomagField = hamQSL?.geomagField ?? 'quiet';

  const kIndexRounded = Math.round(kIndex);
  const statusColor = K_INDEX_COLORS[kIndexRounded] ?? K_INDEX_COLORS[0];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <BoltIcon className="h-5 w-5 text-purple-500" />
          {t('geomagnetic.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">{t('geomagnetic.kIndex')}</span>
            <span className={`text-2xl font-bold ${statusColor.text}`}>{kIndex.toFixed(1)}</span>
          </div>
          <KIndexBar value={kIndex} />
          <div className="flex justify-between mt-1 text-xs text-muted-foreground">
            <span>0</span>
            <span>9</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">{t('geomagnetic.aIndex')}</div>
            <div className="text-xl font-semibold">{aIndex}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground mb-1">{t('geomagnetic.status.title')}</div>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor.bg} text-white`}>
              {t(`geomagnetic.status.${geomagField}`)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
