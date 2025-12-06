"use client";

import * as React from "react";
import { Repeater } from "@/app/columns";
import { fetchRepeaters } from "@/lib/repeaters";
import {
  saveRepeatersCache,
  getRepeatersCache,
  getCacheTimestamp,
} from "@/lib/offline-storage";

type RepeatersContextType = {
  repeaters: Repeater[];
  isRefreshing: boolean;
  fetchError: string | null;
  lastSyncTime: number | null;
  refreshRepeaters: () => Promise<void>;
};

const RepeatersContext = React.createContext<RepeatersContextType | null>(null);

export function useRepeaters() {
  const context = React.useContext(RepeatersContext);
  if (!context) {
    throw new Error("useRepeaters must be used within a RepeatersProvider");
  }
  return context;
}

type Props = {
  initialData: Repeater[];
  children: React.ReactNode;
};

export default function RepetidoresProvider({ initialData, children }: Props) {
  const [repeaters, setRepeaters] = React.useState<Repeater[]>(initialData);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = React.useState<number | null>(null);

  const refreshRepeaters = React.useCallback(async () => {
    setIsRefreshing(true);
    setFetchError(null);
    try {
      const data = await fetchRepeaters();
      setRepeaters(data);
      // Save to cache on successful fetch
      saveRepeatersCache(data);
      setLastSyncTime(Date.now());
    } catch (err) {
      console.error("Failed to refresh repeaters:", err);
      setFetchError("Failed to refresh repeaters");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // On mount: Load cache first, then fetch fresh data
  React.useEffect(() => {
    // Try to load cached data immediately for instant UI
    const cached = getRepeatersCache();
    const cachedTimestamp = getCacheTimestamp();

    if (cached && cached.length > 0) {
      setRepeaters(cached);
      setLastSyncTime(cachedTimestamp);
    }

    // Then fetch fresh data from network
    fetchRepeaters()
      .then((data) => {
        setRepeaters(data);
        saveRepeatersCache(data);
        setLastSyncTime(Date.now());
        setFetchError(null);
      })
      .catch((err) => {
        console.error("Failed to refresh repeaters:", err);
        // If we have cached data, don't show an error - just use the cache
        if (!cached || cached.length === 0) {
          setFetchError("Failed to fetch repeaters");
        }
      });
  }, []);

  return (
    <RepeatersContext.Provider
      value={{ repeaters, isRefreshing, fetchError, lastSyncTime, refreshRepeaters }}
    >
      {children}
    </RepeatersContext.Provider>
  );
}
