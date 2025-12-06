"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft, Navigation, MapPin, Compass } from "lucide-react";
import {
  qthToLatLon,
  distanceBetweenQth,
  bearingBetweenQth,
  bearingToCardinal,
  isValidQth,
} from "@/lib/iss/qth-locator";
import { formatNumber } from "@/lib/rf-calculations";
import { useDeviceCompass } from "@/hooks/useDeviceCompass";
import { cn } from "@/lib/utils";

export default function DistanceCalculator() {
  const t = useTranslations("calculadoras.distance");
  const tCompass = useTranslations("compass");

  const [qth1, setQth1] = React.useState<string>("");
  const [qth2, setQth2] = React.useState<string>("");

  const [distance, setDistance] = React.useState<number | null>(null);
  const [bearing, setBearing] = React.useState<number | null>(null);
  const [cardinal, setCardinal] = React.useState<string>("");
  const [error1, setError1] = React.useState<boolean>(false);
  const [error2, setError2] = React.useState<boolean>(false);

  // Device compass hook
  const compass = useDeviceCompass();

  React.useEffect(() => {
    const valid1 = qth1.length >= 4 && isValidQth(qth1);
    const valid2 = qth2.length >= 4 && isValidQth(qth2);

    setError1(qth1.length >= 4 && !valid1);
    setError2(qth2.length >= 4 && !valid2);

    if (valid1 && valid2) {
      const d = distanceBetweenQth(qth1, qth2);
      const b = bearingBetweenQth(qth1, qth2);

      setDistance(d);
      setBearing(b);
      setCardinal(b !== null ? bearingToCardinal(b) : "");
    } else {
      setDistance(null);
      setBearing(null);
      setCardinal("");
    }
  }, [qth1, qth2]);

  const handleSwap = () => {
    const temp = qth1;
    setQth1(qth2);
    setQth2(temp);
  };

  const coord1 = qthToLatLon(qth1);
  const coord2 = qthToLatLon(qth2);

  // Calculate relative bearing when compass is active
  const relativeBearing = React.useMemo(() => {
    if (bearing === null || compass.heading === null) return null;
    let relative = bearing - compass.heading;
    while (relative > 180) relative -= 360;
    while (relative < -180) relative += 360;
    return relative;
  }, [bearing, compass.heading]);

  // Get direction instruction
  const getDirectionInstruction = (rel: number): string => {
    const abs = Math.abs(rel);
    if (abs <= 15) return tCompass("ahead");
    if (abs <= 45) return rel > 0 ? tCompass("slightRight") : tCompass("slightLeft");
    if (abs <= 135) return rel > 0 ? tCompass("right") : tCompass("left");
    return tCompass("behind");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QTH inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="qth1">{t("qth1")}</Label>
              <Input
                id="qth1"
                type="text"
                placeholder="IM58kr"
                value={qth1}
                onChange={(e) => setQth1(e.target.value.toUpperCase())}
                className={`font-mono uppercase ${error1 ? "border-red-500" : ""}`}
                maxLength={6}
              />
              {coord1 && (
                <p className="text-xs text-muted-foreground">
                  {formatNumber(coord1.latitude, 4)}°, {formatNumber(coord1.longitude, 4)}°
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleSwap}
              className="h-10 w-10"
              title={t("swap")}
            >
              <ArrowRightLeft className="h-4 w-4" />
            </Button>

            <div className="space-y-2">
              <Label htmlFor="qth2">{t("qth2")}</Label>
              <Input
                id="qth2"
                type="text"
                placeholder="JN19bh"
                value={qth2}
                onChange={(e) => setQth2(e.target.value.toUpperCase())}
                className={`font-mono uppercase ${error2 ? "border-red-500" : ""}`}
                maxLength={6}
              />
              {coord2 && (
                <p className="text-xs text-muted-foreground">
                  {formatNumber(coord2.latitude, 4)}°, {formatNumber(coord2.longitude, 4)}°
                </p>
              )}
            </div>
          </div>

          {/* Results */}
          {distance !== null && bearing !== null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center gap-2 text-blue-100 text-sm">
                  <MapPin className="h-4 w-4" />
                  {t("distance")}
                </div>
                <div className="text-3xl font-bold font-mono mt-1">
                  {formatNumber(distance, 1)} km
                </div>
                {distance >= 1 && (
                  <div className="text-xs text-blue-100 mt-1">
                    {formatNumber(distance * 0.621371, 1)} mi
                  </div>
                )}
              </div>

              <div className={cn(
                "p-4 rounded-lg transition-all",
                compass.isEnabled
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white"
                  : "bg-muted"
              )}>
                <div className={cn(
                  "flex items-center gap-2 text-sm",
                  compass.isEnabled ? "text-green-100" : "text-muted-foreground"
                )}>
                  <Navigation className="h-4 w-4" style={{
                    transform: compass.isEnabled && relativeBearing !== null
                      ? `rotate(${relativeBearing}deg)`
                      : `rotate(${bearing}deg)`
                  }} />
                  {t("bearing")}
                </div>
                <div className="text-3xl font-bold font-mono mt-1">
                  {formatNumber(bearing, 1)}°
                </div>
                {compass.isEnabled && relativeBearing !== null && (
                  <div className={cn(
                    "text-sm font-medium mt-1",
                    Math.abs(relativeBearing) <= 15
                      ? "text-green-200"
                      : "text-yellow-200"
                  )}>
                    {getDirectionInstruction(relativeBearing)}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("direction")}</div>
                <div className="text-3xl font-bold font-mono mt-1">
                  {cardinal}
                </div>
                {compass.isEnabled && compass.heading !== null && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {tCompass("deviceHeading")}: {compass.heading}°
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Compass Toggle */}
          {distance !== null && bearing !== null && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-4 border-t">
              {compass.isSupported ? (
                <Button
                  variant={compass.isEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => compass.toggle()}
                  className={cn(
                    "gap-2",
                    compass.isEnabled && "bg-green-600 hover:bg-green-700"
                  )}
                >
                  <Compass className={cn("h-4 w-4", compass.isEnabled && "animate-pulse")} />
                  {compass.isEnabled ? tCompass("disable") : tCompass("enable")}
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Compass className="h-4 w-4 inline mr-1" />
                  {tCompass("notSupported")}
                </p>
              )}
              {compass.error && (
                <p className="text-sm text-red-500">{compass.error}</p>
              )}
            </div>
          )}

          {/* Info */}
          <div className="text-sm text-muted-foreground">
            <p>{t("info")}</p>
          </div>
        </CardContent>
      </Card>

      {/* Reference */}
      <Card>
        <CardHeader>
          <CardTitle>{t("qthFormat")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>4 caracteres (ex: IM58):</strong> ~120 × 60 km</p>
            <p><strong>6 caracteres (ex: IM58kr):</strong> ~5 × 2.5 km</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
