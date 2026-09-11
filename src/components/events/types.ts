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

/** Modes an operating-plan window can run in */
export type EventOperatingMode =
  | 'SSB'
  | 'FM'
  | 'CW'
  | 'FT8'
  | 'DMR'
  | 'D-STAR'
  | 'C4FM'
  | 'Misto';

/**
 * One window of an event's operating plan: which bands/modes/talkgroups are
 * active between `start` and `end`. Both are full ISO 8601 UTC datetimes,
 * like `EventItem.start`.
 */
export type EventOperatingWindow = {
  id?: string;
  mode: EventOperatingMode;
  label: string; // e.g. "40 m e 20 m", "VHF / UHF", "TG 268"
  network?: string; // e.g. "BrandMeister", "Rede LART Lusofona"
  talkgroup?: number;
  frequency?: string; // blank means "por confirmar"
  start: string; // ISO 8601 datetime
  end: string; // ISO 8601 datetime
  notes?: string;
};

export type EventOrganizerLogo = {
  url: string;
  alt?: string;
};

/** Association organizing the event, resolved from the associations collection */
export type EventOrganizer = {
  id: number | string;
  name: string;
  displayName?: string;
  abbreviation?: string;
  slug?: string;
  website?: string;
  logo?: EventOrganizerLogo;
};

export type EventQsl = {
  available: boolean;
  url?: string;
  availableFrom?: string; // ISO 8601 datetime
  instructions?: string;
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
  callsign?: string; // special callsign, e.g. "CS5AIRA/M"
  displayTimezone?: string; // IANA id, e.g. "UTC" | "Europe/Lisbon"
  organizer?: EventOrganizer;
  organizerName?: string; // fallback for organizers not in the collection
  qsl?: EventQsl;
  operatingPlan?: EventOperatingWindow[];
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
