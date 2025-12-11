"use client";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface VotingButtonsProps {
  currentVote?: "up" | "down";
  submitting: boolean;
  onVote: (type: "up" | "down") => void;
  t: (key: string) => string;
}

/**
 * Voting buttons for reporting repeater status (working/issues).
 */
export function VotingButtons({ currentVote, submitting, onVote, t }: VotingButtonsProps) {
  return (
    <div className="flex gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentVote === "up" ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 gap-2 transition-all",
              currentVote === "up" &&
                "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700"
            )}
            onClick={() => onVote("up")}
            disabled={submitting}
          >
            <ThumbsUp className="h-4 w-4" />
            <span>{t("workingButton")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("reportWorking")}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={currentVote === "down" ? "default" : "outline"}
            size="sm"
            className={cn(
              "flex-1 gap-2 transition-all",
              currentVote === "down" &&
                "bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            )}
            onClick={() => onVote("down")}
            disabled={submitting}
          >
            <ThumbsDown className="h-4 w-4" />
            <span>{t("issuesButton")}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("reportIssues")}</TooltipContent>
      </Tooltip>
    </div>
  );
}
