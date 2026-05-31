'use client';

import { Radio, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SatelliteWithTLE } from '@/lib/satellites/satellite-catalog';

interface SatelliteCardProps {
  satellite: SatelliteWithTLE;
  isSelected: boolean;
  onClick: () => void;
}

const BADGE_CLASS = 'bg-azulejo-100 text-azulejo-700 dark:bg-azulejo-950 dark:text-azulejo-300';

export function SatelliteCard({ satellite, isSelected, onClick }: SatelliteCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border shadow-sm transition-all',
        'hover:border-azulejo-300 dark:hover:border-azulejo-700',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500 focus-visible:ring-offset-2',
        isSelected
          ? 'border-azulejo-500 bg-azulejo-50 dark:bg-azulejo-950 dark:border-azulejo-400'
          : 'border-border bg-card'
      )}
    >
      <div className="flex flex-col gap-2">
        {/* Name and mode badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm leading-tight line-clamp-2">
            {satellite.name}
          </h3>
          {satellite.mode && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded-full flex-shrink-0',
              BADGE_CLASS
            )}>
              {satellite.mode.length > 10 ? satellite.mode.slice(0, 10) + '...' : satellite.mode}
            </span>
          )}
        </div>

        {/* Frequencies */}
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          {satellite.downlink && (
            <div className="flex items-center gap-1">
              <ArrowDown className="h-3 w-3 text-green-600 dark:text-green-400" />
              <span className="font-mono">{satellite.downlink}</span>
            </div>
          )}
          {satellite.uplink && (
            <div className="flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-orange-600 dark:text-orange-400" />
              <span className="font-mono">{satellite.uplink}</span>
            </div>
          )}
          {!satellite.downlink && !satellite.uplink && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <Radio className="h-3 w-3" />
              <span>Frequencias desconhecidas</span>
            </div>
          )}
        </div>

        {/* NORAD ID */}
        <div className="text-xs text-muted-foreground">
          NORAD: <span className="font-mono">{satellite.noradId}</span>
        </div>
      </div>
    </button>
  );
}
