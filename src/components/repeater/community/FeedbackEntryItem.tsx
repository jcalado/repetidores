"use client";

import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { formatRelativeTime } from "@/lib/time";
import { useTranslations } from "next-intl";
import type { FeedbackEntry } from "../types";

interface FeedbackEntryItemProps {
  entry: FeedbackEntry;
}

/**
 * Individual feedback entry in the feedback list.
 */
export function FeedbackEntryItem({ entry }: FeedbackEntryItemProps) {
  const t = useTranslations("communityStatus");

  return (
    <div className="px-4 py-3">
      <div className="flex items-start gap-3">
        {/* Vote indicator */}
        <div
          className={cn(
            "rounded-full p-1.5 shrink-0",
            entry.vote === "up"
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
          )}
        >
          {entry.vote === "up" ? (
            <ThumbsUp className="h-3.5 w-3.5" />
          ) : (
            <ThumbsDown className="h-3.5 w-3.5" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Reporter and time */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">
              {entry.reporterCallsign || t("feedbackSection.anonymous")}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              {formatRelativeTime(entry.createdAt)}
            </span>
          </div>

          {/* Feedback text */}
          <p className="text-sm text-muted-foreground mt-1">
            {entry.feedback || (
              <span className="italic">{t("feedbackSection.noComment")}</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
