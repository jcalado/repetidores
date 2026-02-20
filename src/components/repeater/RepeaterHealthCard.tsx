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
import { useCommunityVoting } from "./hooks/useCommunityVoting";
import { operationalStatusConfig } from "./utils/statusConfig";
import { VoteDistributionBar } from "./community/VoteDistributionBar";
import { FeedbackDialog } from "./community/FeedbackDialog";
import { FeedbackList } from "./community/FeedbackList";
import type { OperationalStatus } from "./types";

interface RepeaterHealthCardProps {
  repeaterId: string;
  operationalStatus?: OperationalStatus;
  lastVerified?: string;
}

/**
 * Synthesized repeater health card combining admin operational status
 * and community voting into a single row.
 *
 * Priority: admin status overrides when maintenance/offline.
 * When active or unset, community percentage adds nuance.
 */
export function RepeaterHealthCard({
  repeaterId,
  operationalStatus,
  lastVerified,
}: RepeaterHealthCardProps) {
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

  const hasFeedback = voting.feedbackList.length > 0;
  const upPercent =
    voting.stats && voting.stats.total > 0
      ? Math.round((voting.stats.up / voting.stats.total) * 100)
      : null;

  // Synthesize status: admin overrides when not active/unknown
  const isAdminOverride =
    operationalStatus === "maintenance" || operationalStatus === "offline";

  const adminCfg = operationalStatus
    ? operationalStatusConfig[operationalStatus]
    : null;

  // Determine dot color and label
  let dotClass: string;
  let label: string;
  let textClass: string;

  if (isAdminOverride && adminCfg) {
    // Admin says maintenance/offline — that's the primary signal
    const adminDot: Record<string, string> = {
      maintenance: "bg-amber-500",
      offline: "bg-red-500",
    };
    dotClass = adminDot[operationalStatus!] || "bg-slate-400";
    label = adminCfg.label;
    textClass = adminCfg.textClass;
  } else if (operationalStatus === "active" && adminCfg) {
    dotClass = "bg-emerald-500";
    label = adminCfg.label;
    textClass = adminCfg.textClass;
  } else {
    // No admin status or unknown — fall back to community
    const communityDot: Record<string, string> = {
      ok: "bg-emerald-500",
      "prob-bad": "bg-amber-500",
      bad: "bg-red-500",
      unknown: "bg-slate-400",
    };
    dotClass = communityDot[voting.status] || "bg-slate-400";
    label = t(`status.${voting.status === "prob-bad" ? "probBad" : voting.status}.label`);
    textClass =
      voting.status === "ok"
        ? "text-emerald-700 dark:text-emerald-300"
        : voting.status === "prob-bad"
          ? "text-amber-700 dark:text-amber-300"
          : voting.status === "bad"
            ? "text-red-700 dark:text-red-300"
            : "text-ship-cove-500 dark:text-ship-cove-400";
  }

  // Show community percentage when admin is active or unset
  const showPercent = !isAdminOverride && upPercent !== null;

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
        <div className="flex items-center gap-2.5 px-4 py-3">
          <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotClass)} />
          <span className={cn("text-sm font-medium", textClass)}>
            {label}
            {showPercent && (
              <span className="text-ship-cove-400 dark:text-ship-cove-500 font-normal">
                {" "}({upPercent}%)
              </span>
            )}
          </span>
          {lastVerified && (
            <span className="text-xs text-ship-cove-400 dark:text-ship-cove-500">
              {new Date(lastVerified).toLocaleDateString("pt-PT", {
                day: "numeric",
                month: "short",
              })}
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
