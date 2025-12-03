'use client';

import { useOffline } from '@/hooks/useOffline';
import { WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 animate-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 shadow-lg border border-amber-200 dark:border-amber-700">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm font-medium">Modo offline — a usar dados em cache</span>
      </div>
    </div>
  );
}
