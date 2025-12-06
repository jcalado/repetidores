'use client';

import { Radio, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SatelliteWithTLE, SatelliteCategory } from '@/lib/satellites/satellite-catalog';

interface SatelliteCardProps {
  satellite: SatelliteWithTLE;
  isSelected: boolean;
  onClick: () => void;
}

const CATEGORY_COLORS: Record<SatelliteCategory, string> = {
  [SatelliteCategory.FM_VOICE]: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  [SatelliteCategory.LINEAR]: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  [SatelliteCategory.DIGITAL]: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  [SatelliteCategory.WEATHER]: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  [SatelliteCategory.OTHER]: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

export function SatelliteCard({ satellite, isSelected, onClick }: SatelliteCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left p-3 rounded-lg border transition-all',
        'hover:border-blue-300 dark:hover:border-blue-700',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400'
          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
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
              'text-xs px-1.5 py-0.5 rounded flex-shrink-0',
              CATEGORY_COLORS[satellite.category]
            )}>
              {satellite.mode.length > 10 ? satellite.mode.slice(0, 10) + '...' : satellite.mode}
            </span>
          )}
        </div>

        {/* Frequencies */}
        <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-400">
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
            <div className="flex items-center gap-1 text-slate-400">
              <Radio className="h-3 w-3" />
              <span>Frequencias desconhecidas</span>
            </div>
          )}
        </div>

        {/* NORAD ID */}
        <div className="text-xs text-slate-400 dark:text-slate-500">
          NORAD: {satellite.noradId}
        </div>
      </div>
    </button>
  );
}
