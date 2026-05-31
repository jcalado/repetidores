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
      className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm font-medium text-azulejo-600 hover:text-azulejo-700 dark:text-azulejo-400 dark:hover:text-azulejo-300 hover:bg-azulejo-50/40 dark:hover:bg-azulejo-950/30 transition-colors"
    >
      <Globe className="h-4 w-4" />
      Visitar website
      <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-50" />
    </a>
  );
}
