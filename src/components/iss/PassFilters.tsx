'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { PassFilters as PassFiltersType } from '@/lib/iss/types';
import { Eye, Mountain } from 'lucide-react';

interface PassFiltersProps {
  filters: PassFiltersType;
  onFiltersChange: (filters: PassFiltersType) => void;
}

export function PassFilters({ filters, onFiltersChange }: PassFiltersProps) {
  // Local state for immediate visual feedback
  const [localMinElevation, setLocalMinElevation] = useState(filters.minElevation);

  // Sync local state when filters prop changes externally
  useEffect(() => {
    setLocalMinElevation(filters.minElevation);
  }, [filters.minElevation]);

  // Update local state immediately for smooth slider interaction
  const handleMinElevationChange = (values: number[]) => {
    setLocalMinElevation(values[0]);
  };

  // Only trigger parent update when user releases the slider (commit)
  const handleMinElevationCommit = (values: number[]) => {
    onFiltersChange({
      ...filters,
      minElevation: values[0],
    });
  };

  const handleVisibleOnlyChange = (checked: boolean) => {
    onFiltersChange({
      ...filters,
      visibleOnly: checked,
    });
  };

  return (
    <div className="space-y-6 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mountain className="h-4 w-4 text-slate-600 dark:text-slate-400" />
            <Label htmlFor="min-elevation" className="text-sm font-medium">
              Elevação Mínima
            </Label>
          </div>
          <span className="text-sm font-mono text-slate-700 dark:text-slate-300">
            {localMinElevation}°
          </span>
        </div>
        <Slider
          id="min-elevation"
          value={[localMinElevation]}
          onValueChange={handleMinElevationChange}
          onValueCommit={handleMinElevationCommit}
          min={0}
          max={90}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Filtra passagens com elevação máxima abaixo de {localMinElevation}°
        </p>
      </div>

      <div className="flex items-center justify-between space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 flex-1">
          <Eye className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          <div className="flex flex-col">
            <Label htmlFor="visible-only" className="text-sm font-medium">
              Apenas Passagens Visíveis
            </Label>
            <span className="text-xs text-slate-600 dark:text-slate-400">
              ISS iluminado pelo sol + céu escuro
            </span>
          </div>
        </div>
        <Switch
          id="visible-only"
          checked={filters.visibleOnly}
          onCheckedChange={handleVisibleOnlyChange}
        />
      </div>
    </div>
  );
}
