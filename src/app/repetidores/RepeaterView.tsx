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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { useUserLocation } from "@/contexts/UserLocationContext";
import { calculateDistance } from "@/lib/geolocation";
import type { ColumnFiltersState } from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  FunnelX,
  Heart,
  MapIcon,
  MapPin,
  RefreshCw,
  TableIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import * as React from "react";
import { useRepeaters } from "./RepeatersProvider";
import ImportantNotice from "../notice";

type Props = {
  view: "table" | "map";
};

function getBandFromFrequency(mhz: number): string {
  if (mhz >= 430 && mhz <= 450) return "70cm";
  if (mhz >= 144 && mhz <= 148) return "2m";
  if (mhz >= 50 && mhz <= 54) return "6m";
  return "Other";
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
              <div className="mb-4 space-y-4">
                {/* Search + Filter toggle row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1">
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
                  <Button
                    variant={activeFilterCount > 0 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFiltersExpanded(!filtersExpanded)}
                    className="lg:hidden shrink-0"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    {t("filters.filter")}
                    {activeFilterCount > 0 && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-xs">
                        {activeFilterCount}
                      </span>
                    )}
                    {filtersExpanded ? (
                      <ChevronUp className="h-4 w-4 ml-1" />
                    ) : (
                      <ChevronDown className="h-4 w-4 ml-1" />
                    )}
                  </Button>
                </div>

                {/* Filter grid */}
                <div
                  className={`space-y-4 ${filtersExpanded ? "block" : "hidden"} lg:block`}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                      <Label>{t("filters.owner")}</Label>
                      <Input
                        placeholder={t("filters.owner")}
                        value={
                          (columnFilters.find((f) => f.id === "owner")?.value as string) ??
                          ""
                        }
                        onChange={(event) => {
                          const v = event.target.value;
                          setColumnFilters((prev) => {
                            const next = prev.filter((f) => f.id !== "owner");
                            if (v) next.push({ id: "owner", value: v });
                            return next;
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("filters.qth")}</Label>
                      <Input
                        placeholder={t("filters.qth")}
                        value={
                          (columnFilters.find((f) => f.id === "qth_locator")
                            ?.value as string) ?? ""
                        }
                        onChange={(event) => {
                          const v = event.target.value;
                          setColumnFilters((prev) => {
                            const next = prev.filter((f) => f.id !== "qth_locator");
                            if (v) next.push({ id: "qth_locator", value: v });
                            return next;
                          });
                        }}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("filters.band")}</Label>
                      <Select
                        value={
                          (columnFilters.find((f) => f.id === "band")?.value as string) ??
                          "all"
                        }
                        onValueChange={(value) => {
                          setColumnFilters((prev) => {
                            const next = prev.filter((f) => f.id !== "band");
                            if (value && value !== "all")
                              next.push({ id: "band", value });
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("filters.all")}</SelectItem>
                          <SelectItem value="2m">{t("filters.2m")}</SelectItem>
                          <SelectItem value="70cm">{t("filters.70cm")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("filters.modulation")}</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-between font-normal"
                          >
                            <span className="truncate">
                              {(() => {
                                const selected = columnFilters.find(
                                  (f) => f.id === "modulation"
                                )?.value as string[] | undefined;
                                if (!selected || selected.length === 0)
                                  return t("filters.all");
                                return selected.join(", ");
                              })()}
                            </span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-[200px]">
                          <DropdownMenuLabel>{t("filters.modulation")}</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {modulationOptions.map((m) => {
                            const selected =
                              (columnFilters.find((f) => f.id === "modulation")?.value as
                                | string[]
                                | undefined) || [];
                            return (
                              <DropdownMenuCheckboxItem
                                key={m}
                                checked={selected.includes(m)}
                                onCheckedChange={(checked) => {
                                  setColumnFilters((prev) => {
                                    const next = prev.filter((f) => f.id !== "modulation");
                                    const current =
                                      (prev.find((f) => f.id === "modulation")?.value as
                                        | string[]
                                        | undefined) || [];
                                    const updated = checked
                                      ? [...current, m]
                                      : current.filter((v) => v !== m);
                                    if (updated.length > 0) {
                                      next.push({ id: "modulation", value: updated });
                                    }
                                    return next;
                                  });
                                }}
                              >
                                {m}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2">
                      <Label>{t("filters.opStatus")}</Label>
                      <Select
                        value={
                          (columnFilters.find((f) => f.id === "opStatus")
                            ?.value as string) ?? "all"
                        }
                        onValueChange={(value) => {
                          setColumnFilters((prev) => {
                            const next = prev.filter((f) => f.id !== "opStatus");
                            if (value && value !== "all")
                              next.push({ id: "opStatus", value });
                            return next;
                          });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t("filters.all")}</SelectItem>
                          <SelectItem value="active">
                            {t("filters.opStatusActive")}
                          </SelectItem>
                          <SelectItem value="maintenance">
                            {t("filters.opStatusMaintenance")}
                          </SelectItem>
                          <SelectItem value="offline">
                            {t("filters.opStatusOffline")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className={!userLocation ? "opacity-50" : ""}>
                        {t("filters.distance")}:{" "}
                        {distanceRadius ? `${distanceRadius} km` : t("filters.distanceAll")}
                      </Label>
                      <Slider
                        disabled={!userLocation}
                        value={[distanceRadius ?? 0]}
                        min={0}
                        max={100}
                        step={5}
                        onValueChange={([val]) => {
                          setDistanceRadius(val === 0 ? null : val);
                        }}
                        className={!userLocation ? "opacity-50" : ""}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t("filters.distanceAll")}</span>
                        <span>100 km</span>
                      </div>
                    </div>
                    <div className="flex items-end sm:col-span-2 lg:col-span-1">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setColumnFilters([]);
                          setDistanceRadius(null);
                        }}
                      >
                        <FunnelX className="mr-2 h-4 w-4" />
                        {t("filters.clear")}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
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
              <div className="flex-1 overflow-y-auto p-4">
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
