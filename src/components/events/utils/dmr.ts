/**
 * DMR talkgroup resolution for events.
 *
 * An event can describe its DMR activity two ways: the legacy `dmr` +
 * `dmrNetwork` + `talkgroup` fields (still written by the public submission
 * form), or an `operatingPlan` window in DMR mode. List and summary views only
 * ever knew the legacy trio, so a plan-only event used to show no DMR marking
 * anywhere outside its detail page. Everything that renders a talkgroup badge
 * goes through `getEventDmrSummary` so both shapes land in the same badge.
 */

import type { DMRNetwork, EventItem } from "../types";

export type EventDmrSummary = {
  network?: DMRNetwork;
  talkgroup: number;
};

/** Map an operating window's free-text network onto the legacy select values. */
function toDMRNetwork(network: string | undefined): DMRNetwork | undefined {
  if (!network) return undefined;
  if (/brandmeister/i.test(network)) return 'brandmeister';
  if (/\badn\b/i.test(network)) return 'adn';
  return 'other';
}

/** The talkgroup an event should be badged with, or null when it has none. */
export function getEventDmrSummary(
  event: Pick<EventItem, 'dmr' | 'dmrNetwork' | 'talkgroup' | 'operatingPlan'>
): EventDmrSummary | null {
  if (event.dmr && event.talkgroup) {
    return { network: event.dmrNetwork, talkgroup: event.talkgroup };
  }

  const window = (event.operatingPlan ?? []).find(
    (w) => w?.mode === 'DMR' && typeof w.talkgroup === 'number'
  );
  if (!window || typeof window.talkgroup !== 'number') return null;

  return { network: toDMRNetwork(window.network), talkgroup: window.talkgroup };
}
