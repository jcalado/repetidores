"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCommunityVoting } from "../hooks/useCommunityVoting";
import { communityStatusConfig } from "../utils/statusConfig";
import { VoteDistributionBar } from "./VoteDistributionBar";
import { FeedbackDialog } from "./FeedbackDialog";
import { FeedbackList } from "./FeedbackList";

interface CommunitySectionProps {
  repeaterId: string;
}

const dotColor: Record<string, string> = {
  ok: "bg-emerald-500",
  "prob-bad": "bg-amber-500",
  bad: "bg-red-500",
  unknown: "bg-slate-400",
};

/**
 * Compact community status row with vote buttons and reports dialog.
 */
export function CommunitySection({ repeaterId }: CommunitySectionProps) {
  const t = useTranslations("communityStatus");
  const voting = useCommunityVoting(repeaterId);

  const [feedbackDialogOpen, setFeedbackDialogOpen] = React.useState(false);
  const [reportsOpen, setReportsOpen] = React.useState(false);
  const [pendingVoteType, setPendingVoteType] = React.useState<"up" | "down">("up");

  const handleOpenFeedback = (type: "up" | "down") => {
    setPendingVoteType(type);
    setFeedbackDialogOpen(true);
  };

  const handleSubmitFeedback = (feedback: string, reporterCallsign: string) => {
    voting.submitVote(pendingVoteType, feedback, reporterCallsign);
    setFeedbackDialogOpen(false);
  };

  const cfg = communityStatusConfig[voting.status];
  const hasFeedback = voting.feedbackList.length > 0;
  const upPercent =
    voting.stats && voting.stats.total > 0
      ? Math.round((voting.stats.up / voting.stats.total) * 100)
      : null;

  if (voting.isStatsLoading) {
    return (
      <div className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950 px-4 py-3">
        <div className="h-5 w-40 rounded bg-ship-cove-100 dark:bg-ship-cove-800 animate-pulse" />
      </div>
    );
  }

  return (
    <>
      <div className="rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-white dark:bg-ship-cove-950">
        {/* Compact status row */}
        <div className="flex items-center gap-2.5 px-4 py-3">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor[voting.status])} />
          <span className={cn("text-sm font-medium", cfg.textClass)}>
            {t(cfg.labelKey)}
          </span>
          {upPercent !== null && (
            <span className="text-xs text-ship-cove-400 dark:text-ship-cove-500 tabular-nums">
              {upPercent}% {t("positive")}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1.5">
            {(hasFeedback || voting.isFeedbackLoading) && (
              <button
                onClick={() => setReportsOpen(true)}
                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-ship-cove-500 hover:text-ship-cove-700 dark:hover:text-ship-cove-300 hover:bg-ship-cove-100 dark:hover:bg-ship-cove-800 transition-colors"
              >
                <MessageSquare className="h-3 w-3" />
                {voting.totalCount}
              </button>
            )}
            <button
              onClick={() => handleOpenFeedback("up")}
              disabled={voting.submitting}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                voting.vote?.vote === "up"
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400"
                  : "text-ship-cove-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/30"
              )}
              aria-label={t("reportWorking")}
            >
              <ThumbsUp className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => handleOpenFeedback("down")}
              disabled={voting.submitting}
              className={cn(
                "p-1.5 rounded-md transition-colors",
                voting.vote?.vote === "down"
                  ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400"
                  : "text-ship-cove-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/30"
              )}
              aria-label={t("reportIssues")}
            >
              <ThumbsDown className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Vote feedback dialog */}
      <FeedbackDialog
        open={feedbackDialogOpen}
        onOpenChange={setFeedbackDialogOpen}
        voteType={pendingVoteType}
        initialCallsign={voting.savedCallsign}
        onSubmit={handleSubmitFeedback}
        submitting={voting.submitting}
        t={t}
      />

      {/* Reports dialog */}
      <Dialog open={reportsOpen} onOpenChange={setReportsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("feedbackSection.title")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <VoteDistributionBar stats={voting.stats} t={t} />
            <FeedbackList
              loading={voting.isFeedbackLoading}
              feedbackList={voting.displayedFeedback}
              hasMore={voting.hasMoreFeedback}
              hiddenCount={voting.hiddenCount}
              isExpanded={voting.isExpanded}
              onToggleExpand={() => voting.setIsExpanded(!voting.isExpanded)}
              t={t}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
