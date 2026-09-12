"use client";

import {
  getOwnerShort,
  repeaterGlobalFilter,
  useColumns,
  type Repeater,
} from "@/app/columns";
import LocationTip from "@/components/LocationTip";
import MapClient from "@/components/MapClient";
import RepeaterCardList from "@/components/repeater/RepeaterCardList";
import RepeaterFilterBar, {
  type RepeaterFilterChip,
} from "@/components/repeater/RepeaterFilterBar";
import {
  RepeaterStatusProvider,
  resolveMergedStatus,
  useRepeaterStatusData,
} from "@/components/repeater/RepeaterCells";
import RepeaterDetails from "@/components/RepeaterDetails";
import RepeaterSubmitDialog from "@/components/RepeaterSubmitDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerOverlay,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { applyRepeaterFilters } from "@/lib/repeater-filters";
import { MODE_TILE_COLORS } from "@/lib/mode-colors";
import { MODE_FILTER_VALUES, MODE_OPTIONS } from "@/lib/modes";
import { LINK_OPTIONS, linkOptionCounts } from "@/lib/links";
import {
  Globe,
  Heart,
  Hexagon,
  LayoutGrid,
  Link2,
  MapPin,
  MapPinOff,
  Radio,
  Shield,
  Signal,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import ImportantNotice from "../notice";
import { useRepeaters } from "./RepeatersProvider";
import {
  useRepeaterFilters,
  type Band,
  type OpStatus,
  type StatusFilter,
} from "./hooks/useRepeaterFilters";

type Props = {
  view: "table" | "map";
};

/**
 * Selected-chip styling for the mode strip.
 *
 * MODE_TILE_COLORS[x].active is a solid <hue>-500 fill with a white label, which sits
 * between 2.1:1 and 4.0:1 against white and fails WCAG 2.1 AA (1.4.3) at this 14px size.
 * mode-colors.ts is shared with the badges and the map legend and is not this change's to
 * alter, so the strip uses the soft-tint selected treatment from DESIGN.md instead:
 * <hue>-100 fill, <hue>-900 ink, a 1px inset ring and the solid mode dot for the pressed
 * state. The hue assignment is unchanged, so a mode still reads by its colour.
 */
const MODE_CHIP_SELECTED: Record<string, string> = {
  FM: "bg-blue-100 text-blue-900 border-blue-300 ring-1 ring-inset ring-blue-500 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700 dark:ring-blue-400",
  DMR: "bg-purple-100 text-purple-900 border-purple-300 ring-1 ring-inset ring-purple-500 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700 dark:ring-purple-400",
  DSTAR: "bg-cyan-100 text-cyan-900 border-cyan-300 ring-1 ring-inset ring-cyan-500 dark:bg-cyan-900/40 dark:text-cyan-100 dark:border-cyan-700 dark:ring-cyan-400",
  C4FM: "bg-rose-100 text-rose-900 border-rose-300 ring-1 ring-inset ring-rose-500 dark:bg-rose-900/40 dark:text-rose-100 dark:border-rose-700 dark:ring-rose-400",
  TETRA: "bg-amber-100 text-amber-900 border-amber-300 ring-1 ring-inset ring-amber-500 dark:bg-amber-900/40 dark:text-amber-100 dark:border-amber-700 dark:ring-amber-400",
  EchoLink: "bg-emerald-100 text-emerald-900 border-emerald-300 ring-1 ring-inset ring-emerald-500 dark:bg-emerald-900/40 dark:text-emerald-100 dark:border-emerald-700 dark:ring-emerald-400",
  AllStar: "bg-orange-100 text-orange-900 border-orange-300 ring-1 ring-inset ring-orange-500 dark:bg-orange-900/40 dark:text-orange-100 dark:border-orange-700 dark:ring-orange-400",
};

/** Same treatment for the "Todos" chip, which carries no mode hue. */
const MODE_CHIP_SELECTED_ALL =
  "bg-azulejo-100 text-azulejo-800 border-azulejo-300 ring-1 ring-inset ring-azulejo-500 dark:bg-azulejo-900/40 dark:text-azulejo-100 dark:border-azulejo-700 dark:ring-azulejo-400";

/** The one mode surface: display label, the value the filters speak, tile colour key.
 *  Built from the canonical vocabulary in lib/modes.ts, which the per-column "Modos"
 *  dropdown is fed as well, plus the leading "Todos" chip this strip alone carries. */
/** The merged status filter values speak table.statusCell.* keys, which are
 *  camelCase where the filter value is kebab. */
const STATUS_LABEL_KEY: Record<string, string> = {
  ok: "ok",
  "prob-bad": "probBad",
  bad: "bad",
  unknown: "unknown",
};

const MODE_CHIPS: { value: string | null; label: string; tileKey?: string }[] = [
  { value: null, label: "" },
  ...MODE_OPTIONS,
];

/** One glyph per mode, keyed by tile colour key ("all" for the leading chip).
 *  A mode is recognisable by its icon before its label is read, which is what the
 *  retired tile grid bought and the bare dot did not. */
const MODE_CHIP_ICONS: Record<string, LucideIcon> = {
  all: LayoutGrid,
  FM: Radio,
  DMR: Signal,
  DSTAR: Star,
  C4FM: Hexagon,
  TETRA: Shield,
  EchoLink: Globe,
  AllStar: Link2,
};


/**
 * Radius slider with a real accessible name.
 *
 * components/ui/slider.tsx spreads its props onto Radix's Root, and Radix builds the
 * thumb's accessible name from the Thumb's OWN props (`props["aria-label"] || getLabel()`,
 * and getLabel() is undefined for a single-thumb slider). So `<Slider aria-label>` names a
 * span with no role while the focusable `role="slider"` stays anonymous. That primitive is
 * outside this change's scope, so the name is applied to the thumb node here, together with
 * an aria-valuetext so the no-radius state announces "sem limite" instead of a bare "0".
 */
function DistanceSlider({
  label,
  valueText,
  value,
  onValueChange,
  className,
}: {
  label: string;
  valueText: string;
  value: number;
  onValueChange: (value: number) => void;
  className?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const thumb = containerRef.current?.querySelector('[role="slider"]');
    if (!thumb) return;
    thumb.setAttribute("aria-label", label);
    thumb.setAttribute("aria-valuetext", valueText);
  }, [label, valueText]);

  return (
    <div ref={containerRef} className={className}>
      <Slider
        value={[value]}
        min={0}
        max={100}
        step={5}
        onValueChange={(values) => onValueChange(values[0] ?? 0)}
      />
    </div>
  );
}

export default function RepeaterView({ view }: Props) {
  const t = useTranslations();
  const { repeaters, fetchError } = useRepeaters();
  const {
    userLocation,
    isLocating,
    error: locationError,
    requestLocation,
    clearLocation,
  } = useUserLocation();

  const {
    search,
    band,
    modes,
    links,
    owner,
    qthLocator,
    callsign,
    status,
    opStatus,
    favouritesOnly,
    outputFrequency,
    inputFrequency,
    tone,
    distanceRadius,
    advancedOpen,
    selectedCallsign,
    columnFilters,
    setColumnFilters,
    sorting,
    setSorting,
    paginationState,
    setPagination,
    setSearch,
    setCallsign,
    setBand,
    toggleMode,
    clearModes,
    toggleLink,
    setOwner,
    setQthLocator,
    setStatus,
    setOpStatus,
    setFavouritesOnly,
    setOutputFrequency,
    setInputFrequency,
    setTone,
    setDistanceRadius,
    setSelectedCallsign,
    setAdvancedOpen,
    resetFilters,
  } = useRepeaterFilters();

  // Vote stats + auto-check results, fetched once per mount behind their own TTL
  // caches. `epoch` bumps when they land, so the filtered row model recomputes.
  const { voteStats, autoStatus, loaded: statusLoaded } = useRepeaterStatusData();

  // Toggling a heart changes what the favourites filter matches (localStorage),
  // which TanStack cannot observe on its own.
  const [favoritesEpoch, setFavoritesEpoch] = React.useState(0);
  const handleFavoriteToggle = React.useCallback(() => {
    setFavoritesEpoch((n) => n + 1);
  }, []);

  const columns = useColumns({ userLocation, onFavoriteToggle: handleFavoriteToggle });




  const openRepeater = React.useCallback(
    (repeater: Repeater) => {
      setSelectedCallsign(repeater.callsign);
    },
    [setSelectedCallsign],
  );

  // The drawer is driven by the URL: the Repeater is resolved on every render and
  // never stored, so Back closes it and a shared link opens it.
  const selected = React.useMemo(() => {
    if (!selectedCallsign) return null;
    return (
      repeaters.find(
        (r) => r.callsign.toUpperCase() === selectedCallsign.toUpperCase(),
      ) ?? null
    );
  }, [repeaters, selectedCallsign]);

  // A shared link naming a callsign that is not in the dataset must not leave an
  // empty drawer open.
  React.useEffect(() => {
    if (selectedCallsign && !selected && repeaters.length > 0) {
      setSelectedCallsign(null);
    }
  }, [selectedCallsign, selected, repeaters.length, setSelectedCallsign]);


  // ONE filtering implementation for both surfaces. `applyRepeaterFilters` and the
  // table's column filterFns call the same predicates, so the map and the table
  // cannot show different result sets for the same filter state. The table is then
  // handed this already-filtered array and re-applies its column filters to it,
  // which is safe because every predicate is idempotent.
  const statusOf = React.useCallback(
    (repeater: Repeater) =>
      resolveMergedStatus({
        repeater,
        auto: autoStatus[repeater.callsign],
        votes: voteStats[repeater.callsign],
      }).filterValue,
    [autoStatus, voteStats],
  );

  const filtered = React.useMemo(
    () =>
      applyRepeaterFilters(
        repeaters,
        {
          search,
          callsign,
          band,
          modes,
          links,
          owner,
          qthLocator,
          status,
          opStatus,
          favouritesOnly,
          outputFrequency,
          inputFrequency,
          tone,
          distanceRadius,
        },
        getOwnerShort,
        { userLocation, statusOf },
      ),
    // favoritesEpoch: toggling a heart changes what the favourites filter matches
    // in localStorage, which nothing else here can observe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      repeaters,
      search,
      callsign,
      band,
      modes,
      links,
      owner,
      qthLocator,
      status,
      opStatus,
      favouritesOnly,
      outputFrequency,
      inputFrequency,
      tone,
      distanceRadius,
      userLocation,
      statusOf,
      favoritesEpoch,
    ],
  );

  /* ------------------------------------------------------------ toolbar bits */

  // Announced by the radius slider and printed next to it, so the visible text and the
  // accessible value text never disagree.
  const distanceValueText =
    distanceRadius !== null
      ? t("table.chips.distanceValue", { km: distanceRadius })
      : t("filters.distanceAll");

  const locationControl = userLocation ? (
    <Button
      variant="outline"
      size="icon-sm"
      onClick={clearLocation}
      aria-label={t("location.clearLocation")}
      title={t("location.clearLocation")}
    >
      <MapPinOff className="h-4 w-4" aria-hidden />
    </Button>
  ) : (
    <Button
      variant="outline"
      size="sm"
      onClick={() => requestLocation()}
      disabled={isLocating}
    >
      <MapPin className="h-4 w-4" aria-hidden />
      {isLocating ? t("location.locating") : t("location.locateMe")}
    </Button>
  );

  const tableToolbar = (
    <>
      <Select
        value={band ?? "all"}
        onValueChange={(value) => setBand(value === "all" ? null : (value as Band))}
      >
        <SelectTrigger size="sm" className="w-[7rem]" aria-label={t("filters.band")}>
          {/* The label is rendered here rather than by SelectValue: Radix resolves
              a Value from its registered items, which only mount once the content
              has opened, so the trigger renders blank on first paint and through
              SSR. Band codes are ITU (2m, 70cm) and stay as they are. */}
          <span className="truncate">{band ?? t("filters.all")}</span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>
          <SelectItem value="2m">{t("filters.2m")}</SelectItem>
          <SelectItem value="70cm">{t("filters.70cm")}</SelectItem>
        </SelectContent>
      </Select>

      {/* ONE state control. The merged status already CONTAINS the declared one:
          resolveMergedStatus falls through to repeater.status when there is no
          auto-check, and FILTER_VALUE_BY_KEY buckets admin active/maintenance/
          offline into ok/prob-bad/bad. Two dropdowns both reading "Todas" were
          therefore ~the same filter twice. They stay distinguishable here because
          the group headings name the claim each one makes: what was observed
          versus what the responsável declared. Picking from one group clears the
          other, so the control is never ambiguous about which question it asked. */}
      <Select
        value={status ? `obs:${status}` : opStatus ? `adm:${opStatus}` : "all"}
        onValueChange={(value) => {
          if (value === "all") {
            setStatus(null);
            setOpStatus(null);
            return;
          }
          const [group, key] = value.split(":");
          if (group === "obs") {
            setOpStatus(null);
            setStatus(key as StatusFilter);
          } else {
            setStatus(null);
            setOpStatus(key as OpStatus);
          }
        }}
      >
        <SelectTrigger
          size="sm"
          className="w-[12rem]"
          aria-label={t("table.toolbar.statusLabel")}
        >
          {/* The field name stands in while nothing is picked: three adjacent
              selects all reading "Todas" would not say which is which. */}
          <span className="truncate">
            {status
              ? t(`table.statusCell.${STATUS_LABEL_KEY[status]}` as Parameters<typeof t>[0])
              : opStatus
                ? t(`table.opStatus.${opStatus}` as Parameters<typeof t>[0])
                : t("table.toolbar.statusLabel")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("filters.all")}</SelectItem>

          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>{t("table.toolbar.statusGroupObserved")}</SelectLabel>
            {/* The merged status cell is the vocabulary of record: the filter reads
                the same table.statusCell.* keys, so an operator can never pick one
                word and get rows labelled another. */}
            <SelectItem value="obs:ok">{t("table.statusCell.ok")}</SelectItem>
            <SelectItem value="obs:prob-bad">{t("table.statusCell.probBad")}</SelectItem>
            <SelectItem value="obs:bad">{t("table.statusCell.bad")}</SelectItem>
            <SelectItem value="obs:unknown">{t("table.statusCell.unknown")}</SelectItem>
          </SelectGroup>

          <SelectSeparator />
          <SelectGroup>
            <SelectLabel>{t("table.toolbar.statusGroupDeclared")}</SelectLabel>
            <SelectItem value="adm:active">{t("table.opStatus.active")}</SelectItem>
            <SelectItem value="adm:maintenance">{t("table.opStatus.maintenance")}</SelectItem>
            <SelectItem value="adm:offline">{t("table.opStatus.offline")}</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {locationControl}

      {/* Distance radius: harvested from the deleted RepeaterBrowser, reachable
          from the table now that a location control lives in the toolbar. */}
      {userLocation && (
        <div className="flex min-w-[13rem] items-center gap-2">
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {t("filters.distance")}:{" "}
            <span className="font-mono tabular-nums">{distanceValueText}</span>
          </span>
          <DistanceSlider
            className="w-24"
            label={t("filters.distance")}
            valueText={distanceValueText}
            value={distanceRadius ?? 0}
            onValueChange={(val) => setDistanceRadius(val === 0 ? null : val)}
          />
        </div>
      )}
    </>
  );

  // Chips are derived ONCE, here, from the hook state, and handed to the shared
  // filter bar. DataTable used to derive its own from the TanStack column filters,
  // which the map had no way to reach: that is why the map never showed a chip for
  // a filter it also never applied.
  const filterChips = React.useMemo<RepeaterFilterChip[]>(() => {
    const list: RepeaterFilterChip[] = [];
    const push = (id: string, label: string, value: string | undefined, onRemove: () => void) =>
      list.push({ id, label, value, onRemove });

    if (search.trim()) push("search", t("table.chips.search"), search, () => setSearch(""));
    if (callsign.trim()) push("callsign", t("table.chips.callsign"), callsign, () => setCallsign(""));
    if (band) push("band", t("table.chips.band"), band, () => setBand(null));

    // One chip per selected mode, so a single mode can be dropped from the set.
    modes.forEach((mode) =>
      push(`modes:${mode}`, t("table.chips.modes"), mode, () => toggleMode(mode)),
    );
    links.forEach((link) =>
      push(
        `links:${link}`,
        t("table.chips.links"),
        LINK_OPTIONS.find((l) => l.value === link)?.label ?? link,
        () => toggleLink(link),
      ),
    );

    if (owner.trim()) push("owner", t("table.chips.owner"), owner, () => setOwner(""));
    if (qthLocator.trim())
      push("qthLocator", t("table.chips.qthLocator"), qthLocator, () => setQthLocator(""));
    if (status)
      push(
        "status",
        t("table.chips.status"),
        t(`table.status.${status}` as Parameters<typeof t>[0]),
        () => setStatus(null),
      );
    if (opStatus)
      push(
        "opStatus",
        t("table.chips.opStatus"),
        t(`table.opStatus.${opStatus}` as Parameters<typeof t>[0]),
        () => setOpStatus(null),
      );
    if (outputFrequency.trim())
      push("outputFrequency", t("table.chips.outputFrequency"), outputFrequency, () =>
        setOutputFrequency(""),
      );
    if (inputFrequency.trim())
      push("inputFrequency", t("table.chips.inputFrequency"), inputFrequency, () =>
        setInputFrequency(""),
      );
    if (tone.trim()) push("tone", t("table.chips.tone"), tone, () => setTone(""));
    // Label-only: "Favoritos" carries no value segment.
    if (favouritesOnly)
      push("favorite", t("table.chips.favorites"), undefined, () => setFavouritesOnly(false));
    if (distanceRadius !== null)
      push(
        "distance",
        t("table.chips.distance"),
        t("table.chips.distanceValue", { km: distanceRadius }),
        () => setDistanceRadius(null),
      );

    return list;
  }, [
    t,
    search, setSearch,
    callsign, setCallsign,
    band, setBand,
    modes, toggleMode,
    links, toggleLink,
    owner, setOwner,
    qthLocator, setQthLocator,
    status, setStatus,
    opStatus, setOpStatus,
    outputFrequency, setOutputFrequency,
    inputFrequency, setInputFrequency,
    tone, setTone,
    favouritesOnly, setFavouritesOnly,
    distanceRadius, setDistanceRadius,
  ]);

  // One count for both views, from the one filtered array.
  const resultCountLabel =
    filtered.length === 0
      ? t("table.resultsCountNone")
      : filterChips.length === 0
        ? t("table.resultsCountAll", { total: repeaters.length })
        : filtered.length === 1
          ? t("table.resultsCountSingular", { total: repeaters.length })
          : t("table.resultsCount", { count: filtered.length, total: repeaters.length });

  const favouritesLabel = favouritesOnly
    ? t("favorites.showAll")
    : t("favorites.showOnly");

  const tableLeftActions = (
    <>
      <Button
        variant={favouritesOnly ? "default" : "outline"}
        size="icon-sm"
        onClick={() => setFavouritesOnly(!favouritesOnly)}
        aria-label={favouritesLabel}
        title={favouritesLabel}
        aria-pressed={favouritesOnly}
      >
        <Heart className={`h-4 w-4 ${favouritesOnly ? "fill-current" : ""}`} aria-hidden />
      </Button>
      <RepeaterSubmitDialog repeaters={repeaters} />
    </>
  );

  // One mode surface at every breakpoint, multi-select everywhere.
  // The whole link axis, each chip carrying how many repeaters actually have it.
  const linkOptions = React.useMemo(() => linkOptionCounts(repeaters), [repeaters]);

  const modeChipStrip = (
    <div
      role="group"
      aria-label={t("table.modes.groupLabel")}
      className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {MODE_CHIPS.map(({ value, label, tileKey }) => {
        const isActive = value === null ? modes.length === 0 : modes.includes(value);
        // Per-mode colour (sanctioned Mode-Taxonomy exception, see DESIGN.md).
        // "Todos" carries the azulejo tint.
        const style = tileKey ? MODE_TILE_COLORS[tileKey] : null;
        const activeClass =
          (tileKey ? MODE_CHIP_SELECTED[tileKey] : undefined) ?? MODE_CHIP_SELECTED_ALL;
        const hoverClass = style
          ? style.hover
          : "hover:bg-azulejo-50 hover:border-azulejo-300 dark:hover:bg-azulejo-950/30";
        const Icon = MODE_CHIP_ICONS[tileKey ?? "all"];
        return (
          <button
            key={value ?? "all"}
            type="button"
            aria-pressed={isActive}
            onClick={() => (value === null ? clearModes() : toggleMode(value))}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border pl-3 pr-4 min-h-10 text-sm font-medium transition-colors duration-150 ease-out motion-reduce:transition-none ${
              isActive
                ? activeClass
                : `bg-card border-border text-foreground ${hoverClass}`
            }`}
          >
            {Icon && (
              // The icon keeps the solid mode hue in both states: on the tinted
              // selected fill it stays the second, non-textual cue for which mode
              // this is. The label carries the meaning, so it is decorative.
              <Icon
                aria-hidden
                className={`size-4 shrink-0 ${
                  tileKey
                    ? style?.icon ?? ""
                    : "text-azulejo-600 dark:text-azulejo-400"
                }`}
              />
            )}
            {value === null ? t("table.modes.all") : label}
          </button>
        );
      })}
    </div>
  );

  // A second, quieter axis. Linking is a PROPERTY of a repeater, not a modulation:
  // any FM repeater can be EchoLink or AllStar enabled, and every digital mode
  // carries its own network. It reads as secondary chrome to match.
  const linkChipStrip = (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          {t("filters.links")}
        </span>
        <div role="group" aria-label={t("filters.links")} className="flex flex-wrap gap-1.5">
          {linkOptions.map(({ value, label, ridesOn, count }) => {
            const isActive = links.includes(value);
            // A zero is shown, not hidden: it says the directory can record this
            // link but nobody has yet, which is a fact worth telling an operator.
            const empty = count === 0;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={isActive}
                disabled={empty}
                onClick={() => toggleLink(value)}
                title={
                  empty
                    ? t("filters.linkNone", { label })
                    : t("filters.linkRidesOn", { mode: ridesOn })
                }
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 min-h-8 text-xs font-medium transition-colors duration-150 ease-out motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-45 ${
                  isActive
                    ? "border-azulejo-300 bg-azulejo-100 text-azulejo-800 ring-1 ring-inset ring-azulejo-500 dark:border-azulejo-700 dark:bg-azulejo-900/40 dark:text-azulejo-100 dark:ring-azulejo-400"
                    : "border-border bg-card text-muted-foreground hover:border-azulejo-300 hover:text-foreground"
                }`}
              >
                <Link2 className="size-3" aria-hidden />
                {label}
                <span className="font-mono tabular-nums opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      </div>
    );

  return (
    <>
      <LocationTip />
      <Card className="w-full max-w-7xl">
        <CardContent>
          <RepeaterStatusProvider
            voteStats={voteStats}
            autoStatus={autoStatus}
            ready={statusLoaded}
          >
            {/* ONE filter bar for both views. Rendered here rather than inside
                DataTable so the map can show the identical controls. */}
            <RepeaterFilterBar
              search={{ value: search, onChange: setSearch }}
              modeStrip={
                <div className="flex flex-col gap-2">
                  {modeChipStrip}
                  {linkChipStrip}
                </div>
              }
              domainControls={tableToolbar}
              leadingActions={tableLeftActions}
              chips={filterChips}
              onClearFilters={resetFilters}
              resultCountLabel={resultCountLabel}
            />

            {view === "table" && (
              <DataTable
                columns={columns}
                // Already filtered by applyRepeaterFilters. The table re-applies its
                // column filters to it, which is a no-op: the predicates are the same
                // functions and every one of them is idempotent.
                data={filtered}
                totalCount={repeaters.length}
                hideToolbar
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                globalFilter={search}
                onGlobalFilterChange={(value) =>
                  setSearch(typeof value === "function" ? value(search) : value)
                }
                globalFilterFn={repeaterGlobalFilter}
                sorting={sorting}
                onSortingChange={setSorting}
                pagination={paginationState}
                onPaginationChange={setPagination}
                initialSorting={
                  userLocation ? [{ id: "distance", desc: false }] : undefined
                }
                onRowClick={(row) => openRepeater(row)}
                getRowId={(row) => row.callsign}
                getRowLabel={(row) => t("table.row.open", { callsign: row.callsign })}
                renderCardList={(rows) => (
                  <RepeaterCardList
                    repeaters={rows}
                    userLocation={userLocation}
                    onSelect={openRepeater}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                )}
                modeFilterOptions={MODE_FILTER_VALUES}
                advancedFiltersOpen={advancedOpen}
                onAdvancedFiltersOpenChange={setAdvancedOpen}
                onClearFilters={resetFilters}
                isLoading={false}
              />
            )}

            {view === "map" && (
            <>
              {/* The map is the content here, so it takes the viewport rather than a
                  fixed 500px letterbox: short enough to leave the shared filter bar
                  and the page chrome visible, tall enough to be worth panning. */}
              <div className="h-[clamp(24rem,calc(100vh-18rem),48rem)]">
                <MapClient
                  repeaters={filtered}
                  onRepeaterClick={openRepeater}
                  userLocation={userLocation}
                  radiusKm={distanceRadius}
                  onLocate={requestLocation}
                  isLocating={isLocating}
                  locationError={locationError}
                  onClearFilters={resetFilters}
                />
              </div>
            </>
            )}
          </RepeaterStatusProvider>
        </CardContent>
      </Card>

      {fetchError && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
          {fetchError}
        </div>
      )}

      <ImportantNotice />

      <Drawer
        open={selectedCallsign !== null}
        onOpenChange={(next) => {
          if (!next) setSelectedCallsign(null);
        }}
        direction="right"
      >
        {selectedCallsign !== null && (
          <>
            <DrawerOverlay onClick={() => setSelectedCallsign(null)} />
            <DrawerContent>
              <VisuallyHidden>
                <DrawerTitle>
                  {selected
                    ? `${t("repeater.details")} - ${selected.callsign}`
                    : t("repeater.details")}
                </DrawerTitle>
              </VisuallyHidden>
              <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                {selected && <RepeaterDetails r={selected} />}
              </div>
              <DrawerFooter>
                <button
                  type="button"
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors duration-150 ease-out hover:bg-accent hover:text-accent-foreground motion-reduce:transition-none"
                  onClick={() => setSelectedCallsign(null)}
                >
                  {t("repeater.close")}
                </button>
              </DrawerFooter>
            </DrawerContent>
          </>
        )}
      </Drawer>
    </>
  );
}
