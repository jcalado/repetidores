"use client";

import * as React from "react";
import {
  getVoteStats,
  postVote,
  getFeedbackList,
  type VoteStats,
  type FeedbackEntry,
} from "@/lib/votes";
import { useLocalVote } from "./useLocalVote";
import type { LocalVote, CommunityStatus } from "../types";

const INITIAL_DISPLAY_COUNT = 5;

/**
 * Hook encapsulating all community voting state and API interactions.
 * Manages vote stats, feedback list, submission state, and local vote persistence.
 */
export function useCommunityVoting(repeaterId: string) {
  const { vote, savedCallsign, saveVote } = useLocalVote(repeaterId);

  // Stats state
  const [stats, setStats] = React.useState<VoteStats | null>(null);
  const [isStatsLoading, setIsStatsLoading] = React.useState(true);

  // Feedback list state
  const [feedbackList, setFeedbackList] = React.useState<FeedbackEntry[]>([]);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isFeedbackLoading, setIsFeedbackLoading] = React.useState(true);
  const [isExpanded, setIsExpanded] = React.useState(false);

  // Submission state
  const [submitting, setSubmitting] = React.useState(false);

  // Load data on mount
  React.useEffect(() => {
    let alive = true;
    setIsStatsLoading(true);
    setIsFeedbackLoading(true);

    getVoteStats(repeaterId)
      .then((s) => {
        if (alive) setStats(s);
      })
      .finally(() => {
        if (alive) setIsStatsLoading(false);
      });

    getFeedbackList(repeaterId, { limit: 50 })
      .then((res) => {
        if (alive) {
          setFeedbackList(res.docs);
          setTotalCount(res.totalDocs);
        }
      })
      .finally(() => {
        if (alive) setIsFeedbackLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [repeaterId]);

  // Submit vote
  const submitVote = React.useCallback(
    async (voteType: "up" | "down", feedback: string, reporterCallsign: string) => {
      const callsign = reporterCallsign.trim() || undefined;
      const v: LocalVote = {
        vote: voteType,
        ts: Date.now(),
        feedback: feedback.trim() || undefined,
        reporterCallsign: callsign,
      };

      saveVote(v);
      setSubmitting(true);

      try {
        const s = await postVote({
          repeaterId,
          vote: voteType,
          feedback: v.feedback,
          reporterCallsign: callsign,
        });
        setStats(s);

        // Add to local feedback list if there is feedback text
        if (v.feedback) {
          const newEntry: FeedbackEntry = {
            id: `local-${Date.now()}`,
            vote: voteType,
            feedback: v.feedback,
            reporterCallsign: callsign ?? null,
            createdAt: new Date().toISOString(),
          };
          setFeedbackList((prev) => [newEntry, ...prev]);
          setTotalCount((prev) => prev + 1);
        }
      } finally {
        setSubmitting(false);
      }
    },
    [repeaterId, saveVote]
  );

  const displayedFeedback = isExpanded
    ? feedbackList
    : feedbackList.slice(0, INITIAL_DISPLAY_COUNT);
  const hiddenCount = feedbackList.length - INITIAL_DISPLAY_COUNT;
  const hasMoreFeedback = feedbackList.length > INITIAL_DISPLAY_COUNT;

  return {
    // Vote state
    vote,
    savedCallsign,
    stats,
    status: (stats?.category ?? "unknown") as CommunityStatus,

    // Loading states
    isStatsLoading,
    isFeedbackLoading,
    submitting,

    // Feedback list
    feedbackList,
    displayedFeedback,
    totalCount,
    hiddenCount,
    hasMoreFeedback,
    isExpanded,
    setIsExpanded,

    // Actions
    submitVote,
  };
}
