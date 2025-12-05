"use client";

import * as React from "react";
import { Repeater } from "@/app/columns";
import { fetchRepeaters } from "@/lib/repeaters";

type RepeatersContextType = {
  repeaters: Repeater[];
  isRefreshing: boolean;
  fetchError: string | null;
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

  const refreshRepeaters = React.useCallback(async () => {
    setIsRefreshing(true);
    setFetchError(null);
    try {
      const data = await fetchRepeaters();
      setRepeaters(data);
    } catch (err) {
      console.error("Failed to refresh repeaters:", err);
      setFetchError("Failed to refresh repeaters");
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Fetch fresh data on mount
  React.useEffect(() => {
    fetchRepeaters()
      .then(setRepeaters)
      .catch((err) => console.error("Failed to refresh repeaters:", err));
  }, []);

  return (
    <RepeatersContext.Provider
      value={{ repeaters, isRefreshing, fetchError, refreshRepeaters }}
    >
      {children}
    </RepeatersContext.Provider>
  );
}
