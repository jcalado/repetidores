"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";

interface InfoCardProps {
  label: string;
  value: React.ReactNode;
  className?: string;
  copyValue?: string;
  right?: React.ReactNode;
}

/**
 * Displays a label/value pair with optional copy-to-clipboard functionality.
 */
export function InfoCard({ label, value, className, copyValue, right }: InfoCardProps) {
  const [copied, setCopied] = React.useState(false);
  const isCopyable = typeof copyValue === "string" && copyValue.length > 0;

  async function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isCopyable || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(copyValue!);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className={cn("rounded-lg border p-2 sm:p-3", className)}>
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 sm:mt-1 text-sm flex items-center justify-between gap-1 sm:gap-2">
        <span className="font-mono">{value}</span>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {right}
          {isCopyable && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8"
              onClick={handleCopy}
              aria-label="Copy value"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
