'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MUF_MAP_URL } from '@/lib/propagation/constants';
import { useTranslations } from 'next-intl';
import { MapIcon } from '@heroicons/react/24/outline';

export function MUFMapEmbed() {
  const t = useTranslations('propagation');

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapIcon className="h-5 w-5 text-emerald-500" />
          {t('muf.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border dark:border-gray-700">
          <iframe
            src={MUF_MAP_URL}
            title="MUF Map - Portugal"
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
        <p className="mt-2 text-xs text-muted-foreground text-center">
          {t('muf.source')}
        </p>
      </CardContent>
    </Card>
  );
}
