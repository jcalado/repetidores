/**
 * Tag color mappings and utilities for events
 */

import {
  Activity,
  Globe2,
  Info,
  Mic2,
  Radio,
  SatelliteDish,
} from "lucide-react";
import type { ComponentType } from "react";

export type EventTag = 'Net' | 'Contest' | 'Meetup' | 'Satellite' | 'DX';
export type EventCategory = 'international' | 'national';
export type DMRNetwork = 'brandmeister' | 'adn' | 'other';

// Icon mapping for each tag type
export const tagIconMap: Record<string, ComponentType<{ className?: string }>> = {
  Net: Radio,
  Contest: Activity,
  Meetup: Mic2,
  Satellite: SatelliteDish,
  DX: Globe2,
  Default: Info,
};

// Color scheme for each tag - refined for better dark mode contrast
export const tagColorMap: Record<string, {
  text: string;
  bg: string;
  border: string;
  icon: string;
  gradient: string;
}> = {
  Net: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    icon: 'text-azulejo-600 dark:text-azulejo-400',
    gradient: 'from-azulejo-500/10 via-azulejo-500/5',
  },
  Contest: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    icon: 'text-azulejo-600 dark:text-azulejo-400',
    gradient: 'from-azulejo-500/10 via-azulejo-500/5',
  },
  Meetup: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    icon: 'text-azulejo-600 dark:text-azulejo-400',
    gradient: 'from-azulejo-500/10 via-azulejo-500/5',
  },
  Satellite: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    icon: 'text-azulejo-600 dark:text-azulejo-400',
    gradient: 'from-azulejo-500/10 via-azulejo-500/5',
  },
  DX: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    icon: 'text-azulejo-600 dark:text-azulejo-400',
    gradient: 'from-azulejo-500/10 via-azulejo-500/5',
  },
  Default: {
    text: 'text-muted-foreground',
    bg: 'bg-muted',
    border: 'border-border',
    icon: 'text-muted-foreground',
    gradient: 'from-azulejo-500/10 via-azulejo-500/5',
  },
};

// Border color for featured cards/sections
export const tagBorderColorMap: Record<string, string> = {
  Net: 'border-azulejo-200 dark:border-azulejo-800',
  Contest: 'border-azulejo-200 dark:border-azulejo-800',
  Meetup: 'border-azulejo-200 dark:border-azulejo-800',
  Satellite: 'border-azulejo-200 dark:border-azulejo-800',
  DX: 'border-azulejo-200 dark:border-azulejo-800',
  Default: 'border-border',
};

// Icon background for prominent displays
export const tagIconBgMap: Record<string, string> = {
  Net: 'bg-azulejo-500',
  Contest: 'bg-azulejo-500',
  Meetup: 'bg-azulejo-500',
  Satellite: 'bg-azulejo-500',
  DX: 'bg-azulejo-500',
  Default: 'bg-azulejo-500',
};

// Category colors
export const categoryColorMap: Record<string, {
  text: string;
  bg: string;
  border: string;
  overlay: string;
}> = {
  international: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    overlay: 'bg-azulejo-500/80 text-white',
  },
  national: {
    text: 'text-azulejo-700 dark:text-azulejo-400',
    bg: 'bg-azulejo-50 dark:bg-azulejo-950/40',
    border: 'border-azulejo-200 dark:border-azulejo-800',
    overlay: 'bg-azulejo-500/80 text-white',
  },
};

/**
 * Get tag colors with fallback to default
 */
export function getTagColors(tag?: string) {
  return tag && tagColorMap[tag] ? tagColorMap[tag] : tagColorMap.Default;
}

/**
 * Get tag icon component
 */
export function getTagIcon(tag?: string): ComponentType<{ className?: string }> {
  return tag && tagIconMap[tag] ? tagIconMap[tag] : tagIconMap.Default;
}

/**
 * Get border color for tag
 */
export function getTagBorderColor(tag?: string): string {
  return tag && tagBorderColorMap[tag] ? tagBorderColorMap[tag] : tagBorderColorMap.Default;
}

/**
 * Get icon background color for tag
 */
export function getTagIconBg(tag?: string): string {
  return tag && tagIconBgMap[tag] ? tagIconBgMap[tag] : tagIconBgMap.Default;
}

/**
 * Get category colors
 */
export function getCategoryColors(category?: string) {
  return category && categoryColorMap[category] ? categoryColorMap[category] : null;
}

/**
 * Get DMR network display label
 */
export function getDMRNetworkLabel(
  network: DMRNetwork | undefined,
  t: (key: string) => string
): string {
  switch (network) {
    case 'brandmeister':
      return 'Brandmeister';
    case 'adn':
      return 'ADN Systems';
    case 'other':
      return t('dmr.other') || 'Outra';
    default:
      return 'DMR';
  }
}
