"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import { FeedbackEntryItem } from "./FeedbackEntryItem";
import type { FeedbackEntry } from "../types";

interface FeedbackListProps {
  loading: boolean;
  feedbackList: FeedbackEntry[];
  totalCount: number;
  hasMore: boolean;
  hiddenCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Feedback list section with expand/collapse functionality.
 */
export function FeedbackList({
  loading,
  feedbackList,
  totalCount,
  hasMore,
  hiddenCount,
  isExpanded,
  onToggleExpand,
  t,
}: FeedbackListProps) {
  if (loading) {
    return (
      <div className="border-t">
        <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{t("feedbackSection.title")}</span>
        </div>
        <div className="p-4 space-y-3 animate-pulse">
          <div className="h-16 rounded-lg bg-muted" />
          <div className="h-16 rounded-lg bg-muted" />
        </div>
      </div>
    );
  }

  if (feedbackList.length === 0) {
    return null;
  }

  return (
    <div className="border-t">
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/20">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("feedbackSection.title")}</span>
        <Badge variant="secondary" className="ml-auto text-xs">
          {totalCount}
        </Badge>
      </div>
      <div className="divide-y">
        {feedbackList.map((entry) => (
          <FeedbackEntryItem key={entry.id} entry={entry} />
        ))}
      </div>
      {hasMore && (
        <div className="border-t p-2">
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
        </div>
      )}
    </div>
  );
}
