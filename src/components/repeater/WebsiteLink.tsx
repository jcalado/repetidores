"use client";

import { ExternalLink, Globe } from "lucide-react";

interface WebsiteLinkProps {
  url?: string;
}

/**
 * External website link component.
 * Returns null if no URL is provided.
 */
export function WebsiteLink({ url }: WebsiteLinkProps) {
  if (!url) {
    return null;
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 rounded-xl border p-3 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
    >
      <Globe className="h-4 w-4" />
      Visitar website
      <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-50" />
    </a>
  );
}
