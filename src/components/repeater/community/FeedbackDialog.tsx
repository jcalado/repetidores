"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  voteType: "up" | "down";
  initialCallsign: string;
  onSubmit: (feedback: string, reporterCallsign: string) => void;
  submitting: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Dialog for submitting vote feedback with optional callsign and comment.
 */
export function FeedbackDialog({
  open,
  onOpenChange,
  voteType,
  initialCallsign,
  onSubmit,
  submitting,
  t,
}: FeedbackDialogProps) {
  const [feedback, setFeedback] = React.useState("");
  const [reporterCallsign, setReporterCallsign] = React.useState(initialCallsign);

  React.useEffect(() => {
    if (open) {
      setReporterCallsign(initialCallsign);
      setFeedback("");
    }
  }, [open, initialCallsign]);

  const handleSubmit = () => {
    onSubmit(feedback, reporterCallsign);
    setFeedback("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {voteType === "up" ? t("feedbackTitleWorking") : t("feedbackTitleIssues")}
          </DialogTitle>
          <DialogDescription>{t("feedbackDescription")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("callsignLabel")}
            </label>
            <input
              type="text"
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring uppercase"
              placeholder={t("callsignPlaceholder")}
              maxLength={20}
              value={reporterCallsign}
              onChange={(e) => setReporterCallsign(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              {t("feedbackLabel")}
            </label>
            <textarea
              className="w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring min-h-[120px] resize-none"
              placeholder={
                voteType === "up" ? t("feedbackPlaceholderWorking") : t("feedbackPlaceholder")
              }
              maxLength={500}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-muted-foreground">
                {t("characters", { count: feedback.length })}
              </span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              voteType === "up"
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {voteType === "up" ? t("submitWorking") : t("submitIssues")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
