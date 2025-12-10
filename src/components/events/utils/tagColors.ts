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
    text: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-50/80 dark:bg-blue-950/40',
    border: 'border-blue-200/80 dark:border-blue-700/50',
    icon: 'text-blue-500 dark:text-blue-400',
    gradient: 'from-blue-500/10 via-blue-500/5',
  },
  Contest: {
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50/80 dark:bg-amber-950/40',
    border: 'border-amber-200/80 dark:border-amber-700/50',
    icon: 'text-amber-500 dark:text-amber-400',
    gradient: 'from-amber-500/10 via-amber-500/5',
  },
  Meetup: {
    text: 'text-purple-700 dark:text-purple-300',
    bg: 'bg-purple-50/80 dark:bg-purple-950/40',
    border: 'border-purple-200/80 dark:border-purple-700/50',
    icon: 'text-purple-500 dark:text-purple-400',
    gradient: 'from-purple-500/10 via-purple-500/5',
  },
  Satellite: {
    text: 'text-cyan-700 dark:text-cyan-300',
    bg: 'bg-cyan-50/80 dark:bg-cyan-950/40',
    border: 'border-cyan-200/80 dark:border-cyan-700/50',
    icon: 'text-cyan-500 dark:text-cyan-400',
    gradient: 'from-cyan-500/10 via-cyan-500/5',
  },
  DX: {
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50/80 dark:bg-emerald-950/40',
    border: 'border-emerald-200/80 dark:border-emerald-700/50',
    icon: 'text-emerald-500 dark:text-emerald-400',
    gradient: 'from-emerald-500/10 via-emerald-500/5',
  },
  Default: {
    text: 'text-slate-700 dark:text-slate-300',
    bg: 'bg-slate-50/80 dark:bg-slate-800/50',
    border: 'border-slate-200/80 dark:border-slate-700/50',
    icon: 'text-slate-500 dark:text-slate-400',
    gradient: 'from-slate-500/10 via-slate-500/5',
  },
};

// Border color for featured cards/sections
export const tagBorderColorMap: Record<string, string> = {
  Net: 'border-blue-400/50 dark:border-blue-500/50',
  Contest: 'border-amber-400/50 dark:border-amber-500/50',
  Meetup: 'border-purple-400/50 dark:border-purple-500/50',
  Satellite: 'border-cyan-400/50 dark:border-cyan-500/50',
  DX: 'border-emerald-400/50 dark:border-emerald-500/50',
  Default: 'border-primary/50',
};

// Icon background for prominent displays
export const tagIconBgMap: Record<string, string> = {
  Net: 'bg-blue-500',
  Contest: 'bg-amber-500',
  Meetup: 'bg-purple-500',
  Satellite: 'bg-cyan-500',
  DX: 'bg-emerald-500',
  Default: 'bg-primary',
};

// Category colors
export const categoryColorMap: Record<string, {
  text: string;
  bg: string;
  border: string;
  overlay: string;
}> = {
  international: {
    text: 'text-sky-700 dark:text-sky-300',
    bg: 'bg-sky-50/80 dark:bg-sky-950/40',
    border: 'border-sky-200/80 dark:border-sky-700/50',
    overlay: 'bg-sky-500/80 text-white',
  },
  national: {
    text: 'text-green-700 dark:text-green-300',
    bg: 'bg-green-50/80 dark:bg-green-950/40',
    border: 'border-green-200/80 dark:border-green-700/50',
    overlay: 'bg-green-500/80 text-white',
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
