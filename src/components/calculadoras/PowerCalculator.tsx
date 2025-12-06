"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  wattsToDbm,
  dbmToWatts,
  wattsToDbw,
  dbwToWatts,
  dbmToDbw,
  dbwToDbm,
  formatNumber,
} from "@/lib/rf-calculations";

type InputMode = "watts" | "dbm" | "dbw";

const POWER_PRESETS = [
  { watts: 0.5, label: "0.5 W" },
  { watts: 1, label: "1 W" },
  { watts: 5, label: "5 W" },
  { watts: 10, label: "10 W" },
  { watts: 25, label: "25 W" },
  { watts: 50, label: "50 W" },
  { watts: 100, label: "100 W" },
];

const REFERENCE_TABLE = [
  { watts: 0.001, label: "1 mW" },
  { watts: 0.01, label: "10 mW" },
  { watts: 0.1, label: "100 mW" },
  { watts: 0.5, label: "500 mW" },
  { watts: 1, label: "1 W" },
  { watts: 5, label: "5 W" },
  { watts: 10, label: "10 W" },
  { watts: 25, label: "25 W" },
  { watts: 50, label: "50 W" },
  { watts: 100, label: "100 W" },
  { watts: 500, label: "500 W" },
  { watts: 1000, label: "1 kW" },
];

export default function PowerCalculator() {
  const t = useTranslations("calculadoras.power");

  const [inputMode, setInputMode] = React.useState<InputMode>("watts");
  const [inputValue, setInputValue] = React.useState<string>("");

  const [watts, setWatts] = React.useState<number | null>(null);
  const [dbm, setDbm] = React.useState<number | null>(null);
  const [dbw, setDbw] = React.useState<number | null>(null);

  React.useEffect(() => {
    const value = parseFloat(inputValue);
    if (!Number.isFinite(value)) {
      setWatts(null);
      setDbm(null);
      setDbw(null);
      return;
    }

    let w: number;
    switch (inputMode) {
      case "watts":
        w = value;
        break;
      case "dbm":
        w = dbmToWatts(value);
        break;
      case "dbw":
        w = dbwToWatts(value);
        break;
    }

    if (w > 0) {
      setWatts(w);
      setDbm(wattsToDbm(w));
      setDbw(wattsToDbw(w));
    } else {
      setWatts(null);
      setDbm(null);
      setDbw(null);
    }
  }, [inputValue, inputMode]);

  const handlePresetClick = (presetWatts: number) => {
    setInputMode("watts");
    setInputValue(presetWatts.toString());
  };

  const formatWatts = (w: number): string => {
    if (w >= 1000) return `${formatNumber(w / 1000, 3)} kW`;
    if (w >= 1) return `${formatNumber(w, 3)} W`;
    if (w >= 0.001) return `${formatNumber(w * 1000, 3)} mW`;
    return `${formatNumber(w * 1000000, 3)} µW`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Input mode selector */}
          <div className="space-y-2">
            <Label>{t("inputType")}</Label>
            <div className="flex gap-2">
              <Button
                variant={inputMode === "watts" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("watts")}
                className="flex-1"
              >
                {t("watts")}
              </Button>
              <Button
                variant={inputMode === "dbm" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("dbm")}
                className="flex-1"
              >
                {t("dbm")}
              </Button>
              <Button
                variant={inputMode === "dbw" ? "default" : "outline"}
                size="sm"
                onClick={() => setInputMode("dbw")}
                className="flex-1"
              >
                {t("dbw")}
              </Button>
            </div>
          </div>

          {/* Input field */}
          <div className="space-y-2">
            <Label htmlFor="power-input">
              {inputMode === "watts" ? t("watts") : inputMode === "dbm" ? t("dbm") : t("dbw")}
            </Label>
            <Input
              id="power-input"
              type="number"
              step="any"
              placeholder="0"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-2">
            <Label>{t("presets")}</Label>
            <div className="flex flex-wrap gap-2">
              {POWER_PRESETS.map((preset) => (
                <Button
                  key={preset.watts}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset.watts)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Results */}
          {watts !== null && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className={`p-4 rounded-lg ${inputMode === "watts" ? "bg-primary/10 ring-2 ring-primary" : "bg-muted"}`}>
                <div className="text-sm text-muted-foreground">{t("watts")}</div>
                <div className="text-2xl font-bold font-mono">
                  {formatWatts(watts)}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${inputMode === "dbm" ? "bg-primary/10 ring-2 ring-primary" : "bg-muted"}`}>
                <div className="text-sm text-muted-foreground">{t("dbm")}</div>
                <div className="text-2xl font-bold font-mono">
                  {dbm !== null ? `${formatNumber(dbm, 2)} dBm` : "-"}
                </div>
              </div>
              <div className={`p-4 rounded-lg ${inputMode === "dbw" ? "bg-primary/10 ring-2 ring-primary" : "bg-muted"}`}>
                <div className="text-sm text-muted-foreground">{t("dbw")}</div>
                <div className="text-2xl font-bold font-mono">
                  {dbw !== null ? `${formatNumber(dbw, 2)} dBW` : "-"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("formulas")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p>dBm = 10 × log₁₀(P<sub>watts</sub> × 1000)</p>
            <p>dBW = 10 × log₁₀(P<sub>watts</sub>)</p>
            <p>dBW = dBm - 30</p>
          </div>
        </CardContent>
      </Card>

      {/* Reference table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("referenceTable")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">{t("watts")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("dbm")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("dbw")}</th>
                </tr>
              </thead>
              <tbody>
                {REFERENCE_TABLE.map((row) => (
                  <tr key={row.watts} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-mono">{row.label}</td>
                    <td className="py-2 px-3 font-mono">{formatNumber(wattsToDbm(row.watts), 1)} dBm</td>
                    <td className="py-2 px-3 font-mono">{formatNumber(wattsToDbw(row.watts), 1)} dBW</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
