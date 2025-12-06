'use client';

import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Radio, Antenna, Wifi, CloudSun, Satellite } from 'lucide-react';
import { SatelliteCard } from './SatelliteCard';
import {
  SatelliteWithTLE,
  SatelliteCategory,
  CATEGORY_LABELS,
  groupSatellitesByCategory,
  searchSatellites,
  getCategoryCounts,
} from '@/lib/satellites/satellite-catalog';

interface SatelliteSelectorProps {
  satellites: SatelliteWithTLE[];
  selectedSatellite: SatelliteWithTLE | null;
  onSelect: (satellite: SatelliteWithTLE) => void;
  isLoading?: boolean;
}

const CATEGORY_ICONS: Record<SatelliteCategory, React.ReactNode> = {
  [SatelliteCategory.FM_VOICE]: <Radio className="h-4 w-4" />,
  [SatelliteCategory.LINEAR]: <Antenna className="h-4 w-4" />,
  [SatelliteCategory.DIGITAL]: <Wifi className="h-4 w-4" />,
  [SatelliteCategory.WEATHER]: <CloudSun className="h-4 w-4" />,
  [SatelliteCategory.OTHER]: <Satellite className="h-4 w-4" />,
};

const CATEGORY_ORDER: SatelliteCategory[] = [
  SatelliteCategory.FM_VOICE,
  SatelliteCategory.LINEAR,
  SatelliteCategory.DIGITAL,
  SatelliteCategory.WEATHER,
  SatelliteCategory.OTHER,
];

export function SatelliteSelector({
  satellites,
  selectedSatellite,
  onSelect,
  isLoading,
}: SatelliteSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SatelliteCategory>(SatelliteCategory.FM_VOICE);

  // Filter satellites by search
  const filteredSatellites = useMemo(() => {
    if (!searchQuery.trim()) return satellites;
    return searchSatellites(satellites, searchQuery);
  }, [satellites, searchQuery]);

  // Group by category
  const groupedSatellites = useMemo(
    () => groupSatellitesByCategory(filteredSatellites),
    [filteredSatellites]
  );

  // Get counts
  const counts = useMemo(
    () => getCategoryCounts(filteredSatellites),
    [filteredSatellites]
  );

  // If searching, show all results in one list
  const isSearching = searchQuery.trim().length > 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Satellite className="h-8 w-8 animate-pulse text-slate-400" />
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Carregando satelites...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Pesquisar satelites..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Results */}
      {isSearching ? (
        // Search results - flat list
        <div className="space-y-2">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {filteredSatellites.length} satelite(s) encontrado(s)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
            {filteredSatellites.map((sat) => (
              <SatelliteCard
                key={sat.noradId}
                satellite={sat}
                isSelected={selectedSatellite?.noradId === sat.noradId}
                onClick={() => onSelect(sat)}
              />
            ))}
          </div>
        </div>
      ) : (
        // Category tabs
        <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as SatelliteCategory)}>
          <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-transparent p-0">
            {CATEGORY_ORDER.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="flex items-center gap-1.5 data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 dark:data-[state=active]:bg-blue-900 dark:data-[state=active]:text-blue-300"
              >
                {CATEGORY_ICONS[category]}
                <span className="hidden sm:inline">{CATEGORY_LABELS[category]}</span>
                <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                  {counts[category]}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {CATEGORY_ORDER.map((category) => (
            <TabsContent key={category} value={category} className="mt-4">
              {groupedSatellites[category].length === 0 ? (
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">
                  Nenhum satelite nesta categoria
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto">
                  {groupedSatellites[category].map((sat) => (
                    <SatelliteCard
                      key={sat.noradId}
                      satellite={sat}
                      isSelected={selectedSatellite?.noradId === sat.noradId}
                      onClick={() => onSelect(sat)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
