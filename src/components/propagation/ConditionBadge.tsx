'use client';

import { BAND_CONDITION_COLORS, VHF_CONDITION_COLORS } from '@/lib/propagation/constants';
import type { BandCondition, VHFConditionStatus } from '@/lib/propagation/types';
import { useTranslations } from 'next-intl';

interface ConditionBadgeProps {
  condition: BandCondition | VHFConditionStatus;
  type?: 'band' | 'vhf';
  size?: 'sm' | 'md';
}

export function ConditionBadge({ condition, type = 'band', size = 'md' }: ConditionBadgeProps) {
  const t = useTranslations('propagation');

  const colors = type === 'band'
    ? BAND_CONDITION_COLORS[condition as BandCondition]
    : VHF_CONDITION_COLORS[condition as VHFConditionStatus];

  const sizeClasses = size === 'sm'
    ? 'px-2 py-0.5 text-xs'
    : 'px-3 py-1 text-sm';

  const getLabel = () => {
    if (type === 'band') {
      return t(`hf.${condition}`);
    }
    return t(`vhf.${condition}`);
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-medium ${sizeClasses} ${colors.bg} text-white`}
    >
      {getLabel()}
    </span>
  );
}
