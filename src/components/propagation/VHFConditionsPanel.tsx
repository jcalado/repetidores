'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { HamQSLData } from '@/lib/propagation/types';
import { useTranslations } from 'next-intl';
import { RadioIcon } from '@heroicons/react/24/outline';
import { ConditionBadge } from './ConditionBadge';

interface VHFConditionsPanelProps {
  hamQSL: HamQSLData | null;
}

interface VHFModeCardProps {
  title: string;
  status: 'open' | 'possible' | 'closed' | 'unknown';
  description?: string;
}

function VHFModeCard({ title, status, description }: VHFModeCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center dark:border-gray-700">
      <div className="text-sm font-medium text-muted-foreground mb-2">{title}</div>
      <ConditionBadge condition={status} type="vhf" />
      {description && (
        <div className="mt-2 text-xs text-muted-foreground">{description}</div>
      )}
    </div>
  );
}

export function VHFConditionsPanel({ hamQSL }: VHFConditionsPanelProps) {
  const t = useTranslations('propagation');

  const vhf = hamQSL?.vhf ?? {
    sporadicE: 'unknown' as const,
    tropospheric: 'unknown' as const,
    aurora: 'unknown' as const,
    meteorScatter: 'unknown' as const,
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <RadioIcon className="h-5 w-5 text-indigo-500" />
          {t('vhf.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <VHFModeCard
            title={t('vhf.sporadicE')}
            status={vhf.sporadicE}
          />
          <VHFModeCard
            title={t('vhf.tropo')}
            status={vhf.tropospheric}
          />
          <VHFModeCard
            title={t('vhf.aurora')}
            status={vhf.aurora}
          />
          <VHFModeCard
            title={t('vhf.meteor')}
            status={vhf.meteorScatter}
          />
        </div>
      </CardContent>
    </Card>
  );
}
