"use client";

import * as React from "react";
import type { LocalVote } from "../types";

const USER_CALLSIGN_KEY = "user-callsign";

function getVoteKey(repeaterId: string): string {
  return `repeater-vote:${repeaterId}`;
}

/**
 * Hook for managing local vote state persisted to localStorage.
 * Handles both the vote itself and the user's saved callsign.
 */
export function useLocalVote(repeaterId: string) {
  const [vote, setVote] = React.useState<LocalVote | null>(null);
  const [savedCallsign, setSavedCallsign] = React.useState("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(getVoteKey(repeaterId));
      if (raw) setVote(JSON.parse(raw));
      setSavedCallsign(localStorage.getItem(USER_CALLSIGN_KEY) || "");
    } catch {
      // localStorage not available or parse error
    }
  }, [repeaterId]);

  const saveVote = React.useCallback(
    (v: LocalVote) => {
      setVote(v);
      try {
        localStorage.setItem(getVoteKey(repeaterId), JSON.stringify(v));
        if (v.reporterCallsign?.trim()) {
          localStorage.setItem(USER_CALLSIGN_KEY, v.reporterCallsign.trim());
          setSavedCallsign(v.reporterCallsign.trim());
        }
      } catch {
        // localStorage not available
      }
    },
    [repeaterId]
  );

  return { vote, savedCallsign, saveVote };
}
