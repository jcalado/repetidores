"use client";

import { getOwnerShort, useColumns, type Repeater } from "@/app/columns";
import MapClient from "@/components/MapClient";
import RepeaterDetails from "@/components/RepeaterDetails";
import SearchAutocomplete from "@/components/SearchAutocomplete";
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
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { calculateDistance } from "@/lib/geolocation";
import type { ColumnFiltersState } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Heart,
  MapIcon,
  MapPin,
  Radio,
  RefreshCw,
  Signal,
  TableIcon,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { useRepeaters } from "./RepeatersProvider";
import ImportantNotice from "../notice";
import LocationTip from "@/components/LocationTip";
import RepeaterSubmitDialog from "@/components/RepeaterSubmitDialog";

type Props = {
  view: "table" | "map";
};

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
}

function getModulationColors(modulation: string): string {
  switch (modulation.toUpperCase()) {
    case "FM":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border-blue-300 dark:border-blue-700";
    case "DMR":
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300 dark:border-purple-700";
    case "D-STAR":
      return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700";
    case "C4FM":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300 border-orange-300 dark:border-orange-700";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300 border-gray-300 dark:border-gray-700";
  }
}

function FilterChip({
  isActive,
  onClick,
  label,
  activeClass = "bg-primary text-primary-foreground shadow-sm border-primary"
}: {
  isActive: boolean;
  onClick: () => void;
  label: string;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-medium transition-all border whitespace-nowrap ${
        isActive
          ? activeClass
          : "bg-background hover:bg-muted text-muted-foreground border-border hover:border-muted-foreground/30"
      }`}
    >
      {label}
    </button>
  );
}

export default function RepeaterView({ view }: Props) {
  const t = useTranslations();
  const { repeaters: data, isRefreshing, fetchError, refreshRepeaters } = useRepeaters();
  const { userLocation } = useUserLocation();
  const columns = useColumns({ userLocation });
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Repeater | null>(null);
  const [distanceRadius, setDistanceRadius] = React.useState<number | null>(null);
  const [filtersExpanded, setFiltersExpanded] = React.useState(false);

  // Count active filters for badge display
  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (columnFilters.find((f) => f.id === "callsign")?.value) count++;
    if (columnFilters.find((f) => f.id === "band")?.value) count++;
    if (columnFilters.find((f) => f.id === "owner")?.value) count++;
    if (
      (columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined)
        ?.length
    )
      count++;
    if (columnFilters.find((f) => f.id === "qth_locator")?.value) count++;
    if (columnFilters.find((f) => f.id === "opStatus")?.value) count++;
    if (distanceRadius !== null) count++;
    return count;
  }, [columnFilters, distanceRadius]);

  const modulationOptions = React.useMemo(() => {
    const set = new Set<string>();
    data.forEach((d) => d.modulation && set.add(d.modulation));
    return Array.from(set).sort();
  }, [data]);

  const filtered = React.useMemo(() => {
    let result = data;
    const callsign = columnFilters.find((f) => f.id === "callsign")?.value as
      | string
      | undefined;
    const band = columnFilters.find((f) => f.id === "band")?.value as string | undefined;
    const owner = columnFilters.find((f) => f.id === "owner")?.value as
      | string
      | undefined;
    const modulation = columnFilters.find((f) => f.id === "modulation")?.value as
      | string[]
      | undefined;
    const qth = columnFilters.find((f) => f.id === "qth_locator")?.value as
      | string
      | undefined;
    const opStatus = columnFilters.find((f) => f.id === "opStatus")?.value as
      | string
      | undefined;

    if (callsign && callsign.trim()) {
      const q = callsign.trim().toLowerCase();
      result = result.filter((r) => r.callsign.toLowerCase().includes(q));
    }
    if (band) {
      result = result.filter((r) => getBandFromFrequency(r.outputFrequency) === band);
    }
    if (owner && owner.trim()) {
      const q = owner.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.owner.toLowerCase().includes(q) ||
          getOwnerShort(r.owner).toLowerCase().includes(q)
      );
    }
    if (modulation && modulation.length > 0) {
      result = result.filter((r) =>
        modulation.some((m) => {
          if (m === "DMR" && r.dmr) return true;
          if (m === "D-STAR" && r.dstar) return true;
          return r.modulation && m.toLowerCase() === r.modulation.toLowerCase();
        })
      );
    }
    if (qth && qth.trim()) {
      const q = qth.trim().toLowerCase();
      result = result.filter((r) => r.qth_locator?.toLowerCase().includes(q));
    }
    if (opStatus) {
      result = result.filter((r) => r.status === opStatus);
    }
    if (userLocation && distanceRadius !== null) {
      result = result.filter((r) => {
        const dist = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          r.latitude,
          r.longitude
        );
        return dist <= distanceRadius;
      });
    }
    return result;
  }, [data, columnFilters, userLocation, distanceRadius]);

  return (
    <>
      <LocationTip />
      <Card className="w-full max-w-7xl">
        <CardContent>
          {/* View toggle tabs */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
              <Link
                href="/repetidores"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  view === "table"
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50"
                }`}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                {t("nav.table")}
              </Link>
              <Link
                href="/repetidores/mapa"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                  view === "map"
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/50"
                }`}
              >
                <MapIcon className="h-4 w-4 mr-2" />
                {t("nav.map")}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <RepeaterSubmitDialog repeaters={data} />
              <Button
                variant="outline"
                size="icon"
                onClick={refreshRepeaters}
                disabled={isRefreshing}
                title="Refresh repeaters"
                className="h-9 w-9"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </div>

          {view === "table" && (
            <>
              {/* Location display and favorites */}
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {userLocation && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="font-mono">
                      {userLocation.qthLocator ||
                        `${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)}`}
                    </span>
                  </div>
                )}

                <div className="flex-1" />

                <Button
                  variant={
                    columnFilters.find((f) => f.id === "favorite")?.value
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    setColumnFilters((prev) => {
                      const hasFavoriteFilter = prev.find((f) => f.id === "favorite");
                      if (hasFavoriteFilter) {
                        return prev.filter((f) => f.id !== "favorite");
                      }
                      return [...prev, { id: "favorite", value: true }];
                    });
                  }}
                >
                  <Heart className="mr-2 h-4 w-4" />
                  {columnFilters.find((f) => f.id === "favorite")?.value
                    ? t("favorites.showAll")
                    : t("favorites.showOnly")}
                </Button>
              </div>
              <DataTable
                columns={columns}
                data={data}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                onRowClick={(row) => {
                  setSelected(row as Repeater);
                  setOpen(true);
                }}
                isLoading={false}
              />
            </>
          )}

          {view === "map" && (
            <>
              <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded} className="mb-4">
                {/* Header row - always visible */}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  {/* Search input */}
                  <div className="flex-1 min-w-0">
                    <SearchAutocomplete
                      repeaters={data}
                      value={
                        (columnFilters.find((f) => f.id === "callsign")?.value as string) ??
                        ""
                      }
                      onChange={(v) => {
                        setColumnFilters((prev) => {
                          const next = prev.filter((f) => f.id !== "callsign");
                          if (v) next.push({ id: "callsign", value: v });
                          return next;
                        });
                      }}
                      onSelect={(repeater) => {
                        setSelected(repeater);
                        setOpen(true);
                      }}
                      className="w-full"
                      placeholder={t("filters.callsign")}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    <CollapsibleTrigger asChild>
                      <Button
                        variant={activeFilterCount > 0 ? "default" : "outline"}
                        className="h-10 gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        <span className="hidden sm:inline">{t("filters.filter")}</span>
                        {activeFilterCount > 0 && (
                          <Badge
                            variant="secondary"
                            className="h-5 min-w-5 px-1.5 text-xs bg-background/20"
                          >
                            {activeFilterCount}
                          </Badge>
                        )}
                        {filtersExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refreshRepeaters}
                      disabled={isRefreshing}
                      className="h-10 w-10"
                    >
                      <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>

                {/* Expanded filters panel */}
                <CollapsibleContent>
                  <div className="pt-4 space-y-4">
                    {/* Filter sections */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Band filter */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Radio className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.band")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <FilterChip
                            isActive={!columnFilters.find((f) => f.id === "band")?.value}
                            onClick={() => {
                              setColumnFilters((prev) => prev.filter((f) => f.id !== "band"));
                            }}
                            label={t("filters.all")}
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "band")?.value === "2m"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "band");
                                next.push({ id: "band", value: "2m" });
                                return next;
                              });
                            }}
                            label={t("filters.2m")}
                            activeClass="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "band")?.value === "70cm"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "band");
                                next.push({ id: "band", value: "70cm" });
                                return next;
                              });
                            }}
                            label={t("filters.70cm")}
                            activeClass="bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 border-violet-300 dark:border-violet-700"
                          />
                        </div>
                      </div>

                      {/* Modulation filter */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Signal className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.modulation")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {modulationOptions.map((m) => {
                            const selectedMods = (columnFilters.find((f) => f.id === "modulation")?.value as string[] | undefined) || [];
                            const isActive = selectedMods.includes(m);
                            const colors = getModulationColors(m);
                            return (
                              <FilterChip
                                key={m}
                                isActive={isActive}
                                onClick={() => {
                                  setColumnFilters((prev) => {
                                    const next = prev.filter((f) => f.id !== "modulation");
                                    const current = (prev.find((f) => f.id === "modulation")?.value as string[] | undefined) || [];
                                    const updated = isActive
                                      ? current.filter((v) => v !== m)
                                      : [...current, m];
                                    if (updated.length > 0) {
                                      next.push({ id: "modulation", value: updated });
                                    }
                                    return next;
                                  });
                                }}
                                label={m}
                                activeClass={colors}
                              />
                            );
                          })}
                        </div>
                      </div>

                      {/* Status filter */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Signal className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.opStatus")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <FilterChip
                            isActive={!columnFilters.find((f) => f.id === "opStatus")?.value}
                            onClick={() => {
                              setColumnFilters((prev) => prev.filter((f) => f.id !== "opStatus"));
                            }}
                            label={t("filters.all")}
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "opStatus")?.value === "active"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "opStatus");
                                next.push({ id: "opStatus", value: "active" });
                                return next;
                              });
                            }}
                            label={t("filters.opStatusActive")}
                            activeClass="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-green-300 dark:border-green-700"
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "opStatus")?.value === "maintenance"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "opStatus");
                                next.push({ id: "opStatus", value: "maintenance" });
                                return next;
                              });
                            }}
                            label={t("filters.opStatusMaintenance")}
                            activeClass="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                          />
                          <FilterChip
                            isActive={columnFilters.find((f) => f.id === "opStatus")?.value === "offline"}
                            onClick={() => {
                              setColumnFilters((prev) => {
                                const next = prev.filter((f) => f.id !== "opStatus");
                                next.push({ id: "opStatus", value: "offline" });
                                return next;
                              });
                            }}
                            label={t("filters.opStatusOffline")}
                            activeClass="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-300 dark:border-red-700"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Advanced filters row */}
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {/* Owner input */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <Filter className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.owner")}</span>
                        </div>
                        <Input
                          placeholder={t("filters.owner")}
                          value={(columnFilters.find((f) => f.id === "owner")?.value as string) ?? ""}
                          onChange={(event) => {
                            const v = event.target.value;
                            setColumnFilters((prev) => {
                              const next = prev.filter((f) => f.id !== "owner");
                              if (v) next.push({ id: "owner", value: v });
                              return next;
                            });
                          }}
                          className="h-9 bg-background"
                        />
                      </div>

                      {/* QTH input */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{t("filters.qth")}</span>
                        </div>
                        <Input
                          placeholder={t("filters.qth")}
                          value={(columnFilters.find((f) => f.id === "qth_locator")?.value as string) ?? ""}
                          onChange={(event) => {
                            const v = event.target.value;
                            setColumnFilters((prev) => {
                              const next = prev.filter((f) => f.id !== "qth_locator");
                              if (v) next.push({ id: "qth_locator", value: v });
                              return next;
                            });
                          }}
                          className="h-9 bg-background"
                        />
                      </div>

                      {/* Distance slider */}
                      <div className="rounded-lg border bg-muted/30 p-3">
                        <div className="flex items-center gap-2 text-sm mb-2.5">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">
                            {t("filters.distance")}: {distanceRadius ? `${distanceRadius} km` : t("filters.distanceAll")}
                          </span>
                        </div>
                        {userLocation ? (
                          <>
                            <Slider
                              value={[distanceRadius ?? 0]}
                              min={0}
                              max={100}
                              step={5}
                              onValueChange={([val]) => {
                                setDistanceRadius(val === 0 ? null : val);
                              }}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>{t("filters.distanceAll")}</span>
                              <span>100 km</span>
                            </div>
                          </>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            {t("locationTip.title")}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer: results count and clear */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {filtered.length === 1
                            ? t("filters.resultsCountSingular")
                            : t("filters.resultsCount", { count: filtered.length })}
                        </span>

                        {activeFilterCount > 0 && (
                          <button
                            onClick={() => {
                              setColumnFilters([]);
                              setDistanceRadius(null);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="h-3 w-3" />
                            {t("filters.clear")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="h-[500px]">
                <MapClient
                  repeaters={filtered}
                  onRepeaterClick={(repeater) => {
                    setSelected(repeater);
                    setOpen(true);
                  }}
                  userLocation={userLocation}
                  radiusKm={distanceRadius}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {fetchError && (
        <div className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
          {fetchError}
        </div>
      )}

      <ImportantNotice />

      <Drawer open={open} onOpenChange={setOpen} direction="right">
        {open && (
          <>
            <DrawerOverlay onClick={() => setOpen(false)} />
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
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setOpen(false)}
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
