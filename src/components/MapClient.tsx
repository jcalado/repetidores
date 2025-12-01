
"use client";

import dynamic from 'next/dynamic';
import type { Repeater } from "@/app/columns";

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false });

type QuickFilter = {
  band: '2m' | '70cm' | 'all';
  modulation: 'fm' | 'dmr' | 'dstar' | 'all';
};

type Props = {
  repeaters: Repeater[];
  onSelectRepeater?: (repeater: Repeater) => void;
  quickFilter?: QuickFilter;
  onQuickFilterChange?: (filter: QuickFilter) => void;
};

const MapClient = ({ repeaters, onSelectRepeater, quickFilter, onQuickFilterChange }: Props) => {
  return (
    <MapView
      repeaters={repeaters}
      onSelectRepeater={onSelectRepeater}
      quickFilter={quickFilter}
      onQuickFilterChange={onQuickFilterChange}
    />
  );
};

export default MapClient;
