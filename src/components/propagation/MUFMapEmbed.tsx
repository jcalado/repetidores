'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MUF_MAP_URL, MUF_MAP_REFRESH_INTERVAL } from '@/lib/propagation/constants';
import { useTranslations } from 'next-intl';
import { MapIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export function MUFMapEmbed() {
  const t = useTranslations('propagation');
  const [refreshKey, setRefreshKey] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshKey(Date.now());
    }, MUF_MAP_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapIcon className="h-5 w-5 text-emerald-500" />
          {t('muf.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-hidden rounded-lg border bg-slate-900 dark:border-gray-700">
          <img
            src={`${MUF_MAP_URL}?t=${refreshKey}`}
            alt="MUF Map - Current Propagation Prediction"
            className="h-full w-full"
            loading="lazy"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {t('muf.source')}
        </p>
      </CardContent>
    </Card>
  );
}
