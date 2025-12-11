"use client";

import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FeedbackEntryItem } from "./FeedbackEntryItem";
import type { FeedbackEntry } from "../types";

interface FeedbackListProps {
  loading: boolean;
  feedbackList: FeedbackEntry[];
  hasMore: boolean;
  hiddenCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Feedback entries list with expand/collapse functionality.
 * Renders as part of the unified community section without its own header.
 */
export function FeedbackList({
  loading,
  feedbackList,
  hasMore,
  hiddenCount,
  isExpanded,
  onToggleExpand,
  t,
}: FeedbackListProps) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-14 rounded-lg bg-muted" />
        <div className="h-14 rounded-lg bg-muted" />
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className="divide-y rounded-lg border overflow-hidden">
        {feedbackList.map((entry) => (
          <FeedbackEntryItem key={entry.id} entry={entry} />
        ))}
      </div>
      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={onToggleExpand}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              {t("feedbackSection.showLess")}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              {t("feedbackSection.showMore", { count: hiddenCount })}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
