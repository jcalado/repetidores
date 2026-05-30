"use client";

import * as React from "react";
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
 * Styled with Radio Station Dashboard aesthetic.
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
    <div
      onClick={isCopyable ? handleCopy : undefined}
      className={cn(
        "group rounded-lg p-2.5 sm:p-3 transition-all",
        "bg-azulejo-50 dark:bg-azulejo-900/50",
        isCopyable && "cursor-pointer hover:bg-azulejo-100 dark:hover:bg-azulejo-800/50 active:scale-[0.98]",
        className
      )}
    >
      <div className="text-[10px] sm:text-xs uppercase tracking-wider text-azulejo-500 mb-1">
        {label}
      </div>
      <div className="flex items-center justify-between gap-1.5 sm:gap-2">
        <span className="font-mono text-sm sm:text-base font-medium text-azulejo-900 dark:text-azulejo-100 tabular-nums">
          {value}
        </span>
        <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
          {right}
          {isCopyable && (
            copied ? (
              <Check className="h-4 w-4 text-emerald-500" />
            ) : (
              <Copy className="h-4 w-4 text-azulejo-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            )
          )}
        </div>
      </div>
    </div>
  );
}
