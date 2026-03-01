"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Eye,
  MapPin,
  Radio,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Navigation,
  Info,
  Search,
} from "lucide-react";
import { useUserLocation, type UserLocation } from "@/contexts/UserLocationContext";
import LocationPickerDialog from "@/components/LocationPickerDialog";
import { searchLocation, type GeocodingResult } from "@/lib/geolocation";
import { qthToLatLon, isValidQth } from "@/lib/iss/qth-locator";
import { formatNumber } from "@/lib/rf-calculations";
import {
  fetchElevationProfile,
  analyzeLOS,
  calculateDistanceKm,
  calculateBearing,
  bearingToCardinal,
  type LOSResult,
  type LatLon,
} from "@/lib/line-of-sight";
import dynamic from "next/dynamic";

// Dynamic imports for components with Leaflet
const ElevationProfile = dynamic(
  () => import("@/components/calculadoras/ElevationProfile"),
  { ssr: false }
);
const LOSMiniMap = dynamic(
  () => import("@/components/calculadoras/LOSMiniMap"),
  { ssr: false }
);

type TargetMode = "coords" | "qth" | "search";

// Default frequency presets (common amateur bands in MHz)
const FREQUENCY_PRESETS = [
  { label: "2m (145 MHz)", value: 145 },
  { label: "70cm (433 MHz)", value: 433 },
  { label: "23cm (1296 MHz)", value: 1296 },
  { label: "13cm (2320 MHz)", value: 2320 },
];

export default function LOSCalculator() {
  const t = useTranslations("calculadoras.los");
  const { userLocation } = useUserLocation();

  // Antenna heights
  const [userAntennaHeight, setUserAntennaHeight] = React.useState("10");
  const [targetAntennaHeight, setTargetAntennaHeight] = React.useState("30");

  // Target position state
  const [targetMode, setTargetMode] = React.useState<TargetMode>("search");
  const [targetQth, setTargetQth] = React.useState("");
  const [targetLat, setTargetLat] = React.useState("");
  const [targetLon, setTargetLon] = React.useState("");

  // Address search state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = React.useState(false);

  // Calculation parameters
  const [frequencyMHz, setFrequencyMHz] = React.useState("145");

  // Results state
  const [isCalculating, setIsCalculating] = React.useState(false);
  const [result, setResult] = React.useState<LOSResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  // User position from global context
  const userPosition = React.useMemo((): LatLon | null => {
    if (userLocation) {
      return {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      };
    }
    return null;
  }, [userLocation]);

  // Target position
  const targetPosition = React.useMemo((): LatLon | null => {
    if (targetMode === "qth" && targetQth.length >= 4 && isValidQth(targetQth)) {
      const coords = qthToLatLon(targetQth);
      return coords
        ? { latitude: coords.latitude, longitude: coords.longitude }
        : null;
    }
    if (targetMode === "coords" || targetMode === "search") {
      const lat = parseFloat(targetLat);
      const lon = parseFloat(targetLon);
      if (
        Number.isFinite(lat) &&
        Number.isFinite(lon) &&
        lat >= -90 &&
        lat <= 90 &&
        lon >= -180 &&
        lon <= 180
      ) {
        return { latitude: lat, longitude: lon };
      }
    }
    return null;
  }, [targetMode, targetQth, targetLat, targetLon]);

  // Quick distance/bearing preview
  const preview = React.useMemo(() => {
    if (!userPosition || !targetPosition) return null;
    const distance = calculateDistanceKm(userPosition, targetPosition);
    const bearing = calculateBearing(userPosition, targetPosition);
    return { distance, bearing, cardinal: bearingToCardinal(bearing) };
  }, [userPosition, targetPosition]);

  // Debounced address search
  React.useEffect(() => {
    if (targetMode !== "search" || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchLocation(searchQuery);
        setSearchResults(results.slice(0, 5));
      } catch {
        setSearchResults([]);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, targetMode]);

  const handleSearchSelect = (result: GeocodingResult) => {
    setTargetLat(result.lat);
    setTargetLon(result.lon);
    setSearchQuery(result.display_name.split(",").slice(0, 2).join(","));
    setSearchResults([]);
  };

  // Calculate LOS
  const handleCalculate = async () => {
    if (!userPosition || !targetPosition) return;

    setIsCalculating(true);
    setError(null);
    setResult(null);

    try {
      const freq = parseFloat(frequencyMHz);
      const userHeight = parseFloat(userAntennaHeight) || 0;
      const targetHeight = parseFloat(targetAntennaHeight) || 0;

      if (!Number.isFinite(freq) || freq <= 0) {
        throw new Error(t("invalidFrequency"));
      }

      // Fetch elevation data
      const elevationProfile = await fetchElevationProfile(
        userPosition,
        targetPosition,
        50
      );

      // Analyze LOS
      const losResult = analyzeLOS(
        elevationProfile,
        userHeight,
        targetHeight,
        freq
      );

      setResult(losResult);
    } catch (err) {
      console.error("LOS calculation error:", err);
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setIsCalculating(false);
    }
  };

  // Status icon and color
  const getStatusDisplay = (status: LOSResult["status"]) => {
    switch (status) {
      case "clear":
        return {
          icon: CheckCircle2,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-950",
          border: "border-green-200 dark:border-green-800",
        };
      case "marginal":
        return {
          icon: AlertTriangle,
          color: "text-yellow-600",
          bg: "bg-yellow-50 dark:bg-yellow-950",
          border: "border-yellow-200 dark:border-yellow-800",
        };
      case "blocked":
        return {
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-950",
          border: "border-red-200 dark:border-red-800",
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Main calculator card */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* User Position Section - from global context */}
          <div className="space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("userPosition")}
            </h3>

            {userLocation ? (
              <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="text-sm">
                  <span className="font-mono">
                    {formatNumber(userLocation.latitude, 5)}°,{" "}
                    {formatNumber(userLocation.longitude, 5)}°
                  </span>
                  {userLocation.qthLocator && (
                    <span className="ml-2 text-muted-foreground">
                      ({userLocation.qthLocator})
                    </span>
                  )}
                  {userLocation.isApproximate && (
                    <span className="ml-2 text-yellow-600 text-xs">
                      (IP aprox.)
                    </span>
                  )}
                </div>
                {/* Antenna height for user */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="user-height" className="text-sm whitespace-nowrap">
                    {t("antennaHeight")}:
                  </Label>
                  <Input
                    id="user-height"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="10"
                    value={userAntennaHeight}
                    onChange={(e) => setUserAntennaHeight(e.target.value)}
                    className="font-mono w-20 h-8"
                  />
                  <span className="text-sm text-muted-foreground">m</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800 dark:text-amber-200">
                    <p className="font-medium">{t("noLocation")}</p>
                    <p className="mt-1 text-amber-700 dark:text-amber-300">
                      {t("useMenubarLocation")}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <hr className="border-dashed" />

          {/* Target Position Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium flex items-center gap-2">
                <Radio className="h-4 w-4" />
                {t("targetPosition")}
              </h3>
              <LocationPickerDialog
                onLocationSelect={(loc: UserLocation) => {
                  setTargetLat(String(loc.latitude));
                  setTargetLon(String(loc.longitude));
                  setTargetMode("coords");
                }}
              />
            </div>

            <Tabs
              value={targetMode}
              onValueChange={(v) => setTargetMode(v as TargetMode)}
            >
              <TabsList className="w-full">
                <TabsTrigger value="search">
                  <Search className="h-3.5 w-3.5" />
                  {t("searchAddress")}
                </TabsTrigger>
                <TabsTrigger value="qth">QTH</TabsTrigger>
                <TabsTrigger value="coords">{t("coordinates")}</TabsTrigger>
              </TabsList>

              {/* Search by address */}
              <TabsContent value="search">
                <div className="space-y-2 relative">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="target-search"
                      placeholder={t("searchPlaceholder")}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-8"
                    />
                    {isSearching && (
                      <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  {searchResults.length > 0 && (
                    <div className="absolute z-10 w-full rounded-md border bg-popover shadow-md">
                      {searchResults.map((r) => (
                        <button
                          key={r.place_id}
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-md last:rounded-b-md"
                          onClick={() => handleSearchSelect(r)}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground" />
                            <span className="line-clamp-2">{r.display_name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* QTH Locator */}
              <TabsContent value="qth">
                <div className="space-y-2">
                  <Input
                    id="target-qth"
                    placeholder="IN51qr"
                    value={targetQth}
                    onChange={(e) => setTargetQth(e.target.value.toUpperCase())}
                    className="font-mono uppercase max-w-[150px]"
                    maxLength={6}
                  />
                  {targetQth.length >= 4 && !isValidQth(targetQth) && (
                    <p className="text-xs text-red-500">{t("invalidQth")}</p>
                  )}
                </div>
              </TabsContent>

              {/* Manual coordinates */}
              <TabsContent value="coords">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="target-lat" className="text-xs">{t("latitude")}</Label>
                    <Input
                      id="target-lat"
                      type="number"
                      step="any"
                      placeholder="41.1496"
                      value={targetLat}
                      onChange={(e) => setTargetLat(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="target-lon" className="text-xs">{t("longitude")}</Label>
                    <Input
                      id="target-lon"
                      type="number"
                      step="any"
                      placeholder="-8.6109"
                      value={targetLon}
                      onChange={(e) => setTargetLon(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Resolved position feedback */}
            {targetPosition && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-md bg-muted/50">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="font-mono">
                  {formatNumber(targetPosition.latitude, 5)}°, {formatNumber(targetPosition.longitude, 5)}°
                </span>
              </div>
            )}

            {/* Target antenna height */}
            <div className="flex items-center gap-2">
              <Label htmlFor="target-height" className="text-sm whitespace-nowrap">
                {t("antennaHeight")}:
              </Label>
              <Input
                id="target-height"
                type="number"
                step="1"
                min="0"
                placeholder="30"
                value={targetAntennaHeight}
                onChange={(e) => setTargetAntennaHeight(e.target.value)}
                className="font-mono w-20 h-8"
              />
              <span className="text-sm text-muted-foreground">m</span>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-dashed" />

          {/* Frequency Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">{t("frequency")}</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="frequency"
                  type="number"
                  step="any"
                  min="1"
                  placeholder="145"
                  value={frequencyMHz}
                  onChange={(e) => setFrequencyMHz(e.target.value)}
                  className="font-mono max-w-[120px]"
                />
                <span className="text-sm text-muted-foreground">MHz</span>
              </div>
            </div>

            {/* Frequency presets */}
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => setFrequencyMHz(String(preset.value))}
                  className={
                    frequencyMHz === String(preset.value) ? "border-primary" : ""
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
              <span>
                <MapPin className="h-4 w-4 inline mr-1" />
                {formatNumber(preview.distance, 1)} km
              </span>
              <span>
                <Navigation className="h-4 w-4 inline mr-1" />
                {formatNumber(preview.bearing, 0)}° {preview.cardinal}
              </span>
            </div>
          )}

          {/* Calculate button */}
          <Button
            onClick={handleCalculate}
            disabled={!userPosition || !targetPosition || isCalculating}
            className="w-full"
            size="lg"
          >
            {isCalculating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t("loading")}
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                {t("calculate")}
              </>
            )}
          </Button>

          {/* Error message */}
          {error && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && userPosition && targetPosition && (
        <>
          {/* Status card */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status */}
                <div
                  className={`p-4 rounded-lg border ${getStatusDisplay(result.status).bg} ${getStatusDisplay(result.status).border}`}
                >
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    {React.createElement(getStatusDisplay(result.status).icon, {
                      className: `h-4 w-4 ${getStatusDisplay(result.status).color}`,
                    })}
                    {t("status")}
                  </div>
                  <div
                    className={`text-lg font-bold ${getStatusDisplay(result.status).color}`}
                  >
                    {t(`losStatus.${result.status}`)}
                  </div>
                </div>

                {/* Distance */}
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                  <div className="text-sm text-blue-100 mb-1">
                    {t("distance")}
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatNumber(result.totalDistance, 1)} km
                  </div>
                </div>

                {/* Bearing */}
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t("bearing")}
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    {formatNumber(result.bearing, 0)}°{" "}
                    {bearingToCardinal(result.bearing)}
                  </div>
                </div>

                {/* Fresnel clearance */}
                <div className="p-4 rounded-lg bg-muted">
                  <div className="text-sm text-muted-foreground mb-1">
                    {t("fresnelClearance")}
                  </div>
                  <div
                    className={`text-2xl font-bold font-mono ${
                      result.worstFresnelPercent >= 60
                        ? "text-green-600"
                        : result.worstFresnelPercent >= 20
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {formatNumber(Math.max(0, result.worstFresnelPercent), 0)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {t("worstClearance")}: {formatNumber(result.worstClearance, 0)} m
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Elevation profile */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("elevationProfile")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ElevationProfile points={result.points} status={result.status} />
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-slate-500" />
                  <span>{t("terrain")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 border-t-2 border-dashed border-green-500" />
                  <span>{t("losLine")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-green-500/20 rounded" />
                  <span>{t("fresnelZone")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Map */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("pathMap")}</CardTitle>
            </CardHeader>
            <CardContent>
              <LOSMiniMap
                startPosition={userPosition}
                endPosition={targetPosition}
                status={result.status}
                startLabel={t("userPosition")}
                endLabel={t("targetPosition")}
              />
            </CardContent>
          </Card>
        </>
      )}

      {/* Info legend */}
      <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
        <div className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>{t("info")}</p>
        </div>
        <div className="grid grid-cols-3 gap-px rounded-md overflow-hidden bg-border">
          <div className="flex flex-col items-center gap-1 px-3 py-2.5 bg-background">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">{t("losStatus.clear")}</span>
            <span className="text-[11px] text-muted-foreground text-center leading-tight">{t("clearDesc")}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-2.5 bg-background">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{t("losStatus.marginal")}</span>
            <span className="text-[11px] text-muted-foreground text-center leading-tight">{t("marginalDesc")}</span>
          </div>
          <div className="flex flex-col items-center gap-1 px-3 py-2.5 bg-background">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium text-red-700 dark:text-red-400">{t("losStatus.blocked")}</span>
            <span className="text-[11px] text-muted-foreground text-center leading-tight">{t("blockedDesc")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
