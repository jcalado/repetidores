"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Users, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCommunityVoting } from "../hooks/useCommunityVoting";
import { StatusDisplay } from "./StatusDisplay";
import { VoteDistributionBar } from "./VoteDistributionBar";
import { VotingButtons } from "./VotingButtons";
import { FeedbackDialog } from "./FeedbackDialog";
import { FeedbackList } from "./FeedbackList";

interface CommunitySectionProps {
  repeaterId: string;
}

/**
 * Unified community section combining voting status and feedback.
 */
export function CommunitySection({ repeaterId }: CommunitySectionProps) {
  const t = useTranslations("communityStatus");
  const voting = useCommunityVoting(repeaterId);

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [pendingVoteType, setPendingVoteType] = React.useState<"up" | "down">("up");

  const handleOpenFeedback = (type: "up" | "down") => {
    setPendingVoteType(type);
    setDialogOpen(true);
  };

  const handleSubmitFeedback = (feedback: string, reporterCallsign: string) => {
    voting.submitVote(pendingVoteType, feedback, reporterCallsign);
    setDialogOpen(false);
  };

  const hasFeedback = voting.feedbackList.length > 0;

  return (
    <div className="relative overflow-hidden rounded-xl border border-ship-cove-200 dark:border-ship-cove-800/50 bg-gradient-to-br from-white via-white to-ship-cove-50/50 dark:from-ship-cove-950 dark:via-ship-cove-950 dark:to-ship-cove-900/30 shadow-sm">
      {/* Top accent */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-ship-cove-500 to-transparent opacity-60" />

      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-ship-cove-200 dark:border-ship-cove-800/50">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800">
          <Users className="h-4 w-4 text-ship-cove-600 dark:text-ship-cove-400" />
        </div>
        <span className="text-lg font-semibold text-ship-cove-900 dark:text-ship-cove-100">
          {t("title")}
        </span>
        {voting.vote?.vote && (
          <Badge
            variant="outline"
            className={cn(
              "ml-auto text-[10px] gap-1",
              voting.vote.vote === "up"
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                : "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/50 dark:text-red-300"
            )}
          >
            {voting.vote.vote === "up" ? (
              <ThumbsUp className="h-3 w-3" />
            ) : (
              <ThumbsDown className="h-3 w-3" />
            )}
            {t("yourVote")}
          </Badge>
        )}
      </div>

      <div className="p-5 space-y-4">
        {/* Stats and voting */}
        {voting.isStatsLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800" />
            <div className="h-2 rounded-full bg-ship-cove-100 dark:bg-ship-cove-800" />
            <div className="h-10 rounded-lg bg-ship-cove-100 dark:bg-ship-cove-800" />
          </div>
        ) : (
          <>
            <StatusDisplay status={voting.status} stats={voting.stats} t={t} />
            <VoteDistributionBar stats={voting.stats} t={t} />
            <VotingButtons
              currentVote={voting.vote?.vote}
              submitting={voting.submitting}
              onVote={handleOpenFeedback}
              t={t}
            />
            <FeedbackDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              voteType={pendingVoteType}
              initialCallsign={voting.savedCallsign}
              onSubmit={handleSubmitFeedback}
              submitting={voting.submitting}
              t={t}
            />
          </>
        )}

        {/* Feedback entries */}
        {(voting.isFeedbackLoading || hasFeedback) && (
          <div className="space-y-3 pt-4 border-t border-ship-cove-200 dark:border-ship-cove-800/50">
            <div className="flex items-center gap-2 text-xs text-ship-cove-500">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium uppercase tracking-wider">
                {t("feedbackSection.title")}
              </span>
              {hasFeedback && (
                <span className="ml-auto px-2 py-0.5 rounded-full bg-ship-cove-100 dark:bg-ship-cove-800 text-ship-cove-600 dark:text-ship-cove-400 text-[10px] font-medium tabular-nums">
                  {voting.totalCount}
                </span>
              )}
            </div>
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
        )}
      </div>

      {/* Corner LED */}
      <div className="absolute top-3 right-3 h-2 w-2 rounded-full bg-emerald-500/80 shadow-sm shadow-emerald-500/50 animate-pulse" />
    </div>
  );
}
