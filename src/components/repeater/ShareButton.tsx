"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface ShareButtonProps {
  callsign: string;
  variant?: "default" | "header";
}

/**
 * Share button with native share API support and clipboard fallback.
 */
export function ShareButton({ callsign, variant = "default" }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);
  const t = useTranslations("repeater");

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/repeater/${encodeURIComponent(callsign)}/`;

    if (navigator.share) {
      try {
        await navigator.share({ title: `Repeater ${callsign}`, url: shareUrl });
        return;
      } catch {
        // User cancelled or share failed, fall back to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard failed
    }
  };

  if (variant === "header") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleShare}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent transition-colors"
            aria-label={t("share")}
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>{t("share")}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" onClick={handleShare} aria-label={t("share")}>
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{t("share")}</TooltipContent>
    </Tooltip>
  );
}
