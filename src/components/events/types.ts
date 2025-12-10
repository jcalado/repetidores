/**
 * Shared types for events components
 */

import type { EventTag, EventCategory, DMRNetwork } from "./utils/tagColors";

export type { EventTag, EventCategory, DMRNetwork };

// Translation function type that's compatible with next-intl
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslationFunction = (key: string, params?: Record<string, any>) => string;

export type EventFeaturedImage = {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
};

export type EventItem = {
  id: string;
  title: string;
  start: string; // ISO 8601 datetime
  end?: string;
  location?: string;
  url?: string;
  tag?: EventTag;
  isFeatured?: boolean;
  dmr?: boolean;
  dmrNetwork?: DMRNetwork;
  talkgroup?: number;
  featuredImage?: EventFeaturedImage;
  description?: unknown;
  category?: EventCategory;
};

export type EventsAPIResponse = {
  docs: EventItem[];
  totalDocs: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type SortOption = 'startAsc' | 'startDesc' | 'title';

export interface FilterState {
  search: string;
  tag: string;
  category: string;
  sort: SortOption;
  view: 'cards' | 'table' | 'calendar';
}
