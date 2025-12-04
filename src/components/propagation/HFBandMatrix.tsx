'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HF_BANDS } from '@/lib/propagation/constants';
import type { HamQSLData } from '@/lib/propagation/types';
import { useTranslations } from 'next-intl';
import { SignalIcon } from '@heroicons/react/24/outline';
import { ConditionBadge } from './ConditionBadge';

interface HFBandMatrixProps {
  hamQSL: HamQSLData | null;
}

export function HFBandMatrix({ hamQSL }: HFBandMatrixProps) {
  const t = useTranslations('propagation');

  const getBandConditions = (bandId: string) => {
    const band = hamQSL?.hfBands.find((b) => b.band === bandId);
    return {
      day: band?.day ?? 'unknown',
      night: band?.night ?? 'unknown',
    };
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <SignalIcon className="h-5 w-5 text-ship-cove-500" />
          {t('hf.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="pb-2 text-left text-sm font-medium text-muted-foreground">
                  {t('hf.band')}
                </th>
                <th className="pb-2 text-center text-sm font-medium text-muted-foreground">
                  {t('hf.day')}
                </th>
                <th className="pb-2 text-center text-sm font-medium text-muted-foreground">
                  {t('hf.night')}
                </th>
              </tr>
            </thead>
            <tbody>
              {HF_BANDS.map((band) => {
                const conditions = getBandConditions(band.id);
                return (
                  <tr key={band.id} className="border-b last:border-0 dark:border-gray-700">
                    <td className="py-3">
                      <div className="font-medium">{band.label}</div>
                      <div className="text-xs text-muted-foreground">{band.frequencies}</div>
                    </td>
                    <td className="py-3 text-center">
                      <ConditionBadge condition={conditions.day} type="band" size="sm" />
                    </td>
                    <td className="py-3 text-center">
                      <ConditionBadge condition={conditions.night} type="band" size="sm" />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
