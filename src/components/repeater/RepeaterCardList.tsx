"use client";

import * as React from "react";
import { useTranslations } from "next-intl";

import {
  CallsignText,
  DistanceText,
  FavoriteButton,
  ModeBadges,
  StatusCell,
  getAllFrequencyPairs,
} from "@/components/repeater/RepeaterCells";
import type { UserLocation } from "@/contexts/UserLocationContext";
import { calculateDistance } from "@/lib/geolocation";
import { cn } from "@/lib/utils";
import type { Repeater } from "@/app/columns";

/**
 * Mobile surface for the repeater list (spec item 1).
 *
 * Below md the table is gone entirely and this list takes its place. DataTable
 * hands over the CURRENT PAGE's rows, already filtered, sorted and paginated,
 * so both surfaces answer to the same toolbar.
 *
 * Elevation is context aware: on its own a row is a card (Rule border + rest
 * shadow), but inside a Card it demotes to a Rule-bordered sub-section, because
 * DESIGN.md forbids nesting a card inside a card.
 *
 * Semantics mirror the table's: a real list of list items, one named card each,
 * with every datum left in the accessibility tree. The card carries NO
 * role="button" - that role makes its children presentational, which would hide
 * the frequencies, the tone, the status and the favourite heart from a screen
 * reader on the only breakpoint where this surface exists.
 */

/** A click or keypress that landed on a control nested inside a card. */
function isInteractiveTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return !!el.closest(
    'button, a, input, select, textarea, [role="menuitem"], [role="checkbox"], [role="combobox"]',
  );
}

export interface RepeaterCardListProps {
  /** Already filtered, sorted and paginated by DataTable. Render in order. */
  repeaters: Repeater[];
  userLocation?: UserLocation | null;
  /** Opens the details drawer. Same callback DataTable receives as onRowClick. */
  onSelect: (repeater: Repeater) => void;
  onFavoriteToggle?: (callsign: string, next: boolean) => void;
  /** Rendered in place of the list when repeaters.length === 0. */
  emptyState?: React.ReactNode;
  className?: string;
}

export function RepeaterCardList({
  repeaters,
  userLocation,
  onSelect,
  onFavoriteToggle,
  emptyState,
  className,
}: RepeaterCardListProps): React.ReactElement {
  const t = useTranslations("table.card");

  if (repeaters.length === 0) {
    return <div className={className}>{emptyState ?? null}</div>;
  }

  return (
    // role="list" is redundant in the markup but not in Safari: Tailwind's
    // preflight sets list-style:none, which drops list semantics in WebKit -
    // exactly the browser this mobile-only surface runs in most.
    <ul
      role="list"
      aria-label={t("listLabel")}
      className={cn("flex flex-col gap-2.5", className)}
    >
      {repeaters.map((repeater) => (
        <li key={repeater.callsign}>
          <RepeaterCard
            repeater={repeater}
            userLocation={userLocation}
            onSelect={onSelect}
            onFavoriteToggle={onFavoriteToggle}
          />
        </li>
      ))}
    </ul>
  );
}

export default RepeaterCardList;

/* Internal, exported only for tests: */
export interface RepeaterCardProps {
  repeater: Repeater;
  userLocation?: UserLocation | null;
  onSelect: (repeater: Repeater) => void;
  onFavoriteToggle?: (callsign: string, next: boolean) => void;
}

export function RepeaterCard({
  repeater,
  userLocation,
  onSelect,
  onFavoriteToggle,
}: RepeaterCardProps): React.ReactElement {
  const t = useTranslations("table.card");
  const tf = useTranslations("table.frequencies");

  // The card is named by its callsign and described by the action, so the
  // content underneath stays readable instead of being replaced by a label.
  const baseId = React.useId();
  const callsignId = `${baseId}-callsign`;
  const actionId = `${baseId}-action`;

  const pairs = getAllFrequencyPairs(repeater);
  const primary = pairs[0];
  const distanceKm = userLocation
    ? calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        repeater.latitude,
        repeater.longitude,
      )
    : null;

  const handleActivate = (e: React.SyntheticEvent) => {
    // The favourite heart and any other nested control own their own activation.
    if (isInteractiveTarget(e.target)) return;
    onSelect(repeater);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (isInteractiveTarget(e.target)) return;
    // Space would otherwise scroll the page.
    e.preventDefault();
    handleActivate(e);
  };

  return (
    <article
      tabIndex={0}
      aria-labelledby={callsignId}
      aria-describedby={actionId}
      onClick={handleActivate}
      onKeyDown={handleKeyDown}
      className={cn(
        "min-h-[44px] cursor-pointer rounded-xl border border-border bg-card p-3.5",
        "shadow-[0_1px_2px_oklch(0.20_0.012_250/0.06),0_4px_12px_oklch(0.20_0.012_250/0.04)]",
        // DESIGN.md: never nest a card inside a card. When the list is rendered
        // inside a Card the row demotes to a Rule-bordered sub-section, dropping
        // the second surface and the second elevation. Standalone it keeps both.
        "[[data-slot=card]_&]:rounded-lg [[data-slot=card]_&]:bg-transparent",
        "[[data-slot=card]_&]:shadow-none",
        "hover:bg-accent/40 [[data-slot=card]_&]:hover:bg-accent/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azulejo-500",
        "focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "transition-colors duration-150 ease-out motion-reduce:transition-none",
      )}
    >
      {/* Row 1: callsign + merged status, favourite pinned right */}
      <div className="flex items-start gap-2">
        <span id={callsignId}>
          <CallsignText callsign={repeater.callsign} className="text-base font-semibold" />
        </span>
        <StatusCell repeater={repeater} labelMode="always" showSource className="ml-auto" />
        <FavoriteButton
          callsign={repeater.callsign}
          onToggle={onFavoriteToggle}
          className="-mr-1.5 -mt-1 shrink-0"
        />
      </div>

      {/* Row 2: RX / TX pair. dt/dd ties each label to its value in the
          accessibility tree instead of relying on visual adjacency. */}
      {primary && (
        <dl className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <div className="flex items-baseline gap-1">
            <dt className="flex items-baseline text-xs text-muted-foreground">
              <span aria-hidden>{t("rx")}</span>
              <span className="sr-only">{t("rxLabel")}</span>
            </dt>
            <dd className="font-mono tabular-nums">
              {primary.outputFrequency.toFixed(3)}
              <span className="ml-0.5 text-xs text-muted-foreground">MHz</span>
              {/* Separator lives inside the dd because a <dl> may only hold
                  dt/dd groups; spacing matches the list's own gap-x-2. */}
              <span aria-hidden className="ml-2 font-sans text-muted-foreground">
                ·
              </span>
            </dd>
          </div>
          <div className="flex items-baseline gap-1">
            <dt className="flex items-baseline text-xs text-muted-foreground">
              <span aria-hidden>{t("tx")}</span>
              <span className="sr-only">{t("txLabel")}</span>
            </dt>
            <dd className="font-mono tabular-nums">
              {primary.inputFrequency.toFixed(3)}
              <span className="ml-0.5 text-xs text-muted-foreground">MHz</span>
            </dd>
          </div>
        </dl>
      )}

      {/* Extra frequency pairs, listed inline: a hover tooltip is unreachable on touch */}
      {pairs.length > 1 && (
        <ul role="list" aria-label={tf("allLabel")} className="mt-1 flex flex-col gap-0.5">
          {pairs.slice(1).map((pair, i) => (
            <li key={i} className="font-mono text-xs tabular-nums text-muted-foreground">
              {tf("pair", {
                output: pair.outputFrequency.toFixed(3),
                input: pair.inputFrequency.toFixed(3),
              })}
            </li>
          ))}
        </ul>
      )}

      {/* Row 3: CTCSS tone + distance */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {primary?.tone ? (
          <span className="flex items-baseline gap-1">
            <span>{t("tone")}</span>
            <span className="font-mono tabular-nums text-foreground">
              {primary.tone.toFixed(1)}
            </span>
          </span>
        ) : (
          <span>{t("noTone")}</span>
        )}
        {distanceKm !== null && (
          <>
            <span aria-hidden>·</span>
            <DistanceText km={distanceKm} className="text-foreground" />
          </>
        )}
      </div>

      {/* Row 4: modes */}
      <ModeBadges repeater={repeater} className="mt-2" />

      {/* What activating the card does. Read as the card's description on focus,
          and last in reading order so the data comes first. */}
      <span id={actionId} className="sr-only">
        {t("open", { callsign: repeater.callsign })}
      </span>
    </article>
  );
}
