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
    <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{t("title")}</span>
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

      <div className="p-4 space-y-4">
        {/* Stats and voting */}
        {voting.isStatsLoading ? (
          <div className="space-y-3 animate-pulse">
            <div className="h-16 rounded-lg bg-muted" />
            <div className="h-2 rounded-full bg-muted" />
            <div className="h-10 rounded-lg bg-muted" />
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
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="font-medium uppercase tracking-wider">
                {t("feedbackSection.title")}
              </span>
              {hasFeedback && (
                <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">
                  {voting.totalCount}
                </Badge>
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
    </div>
  );
}
