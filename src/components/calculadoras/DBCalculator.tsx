"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  dbToPowerRatio,
  powerRatioToDb,
  dbToVoltageRatio,
  voltageRatioToDb,
  formatNumber,
} from "@/lib/rf-calculations";

const COMMON_DB_VALUES = [
  { db: 3, label: "+3 dB", description: "2×" },
  { db: 6, label: "+6 dB", description: "4×" },
  { db: 10, label: "+10 dB", description: "10×" },
  { db: 20, label: "+20 dB", description: "100×" },
  { db: -3, label: "-3 dB", description: "½×" },
  { db: -6, label: "-6 dB", description: "¼×" },
  { db: -10, label: "-10 dB", description: "0.1×" },
];

export default function DBCalculator() {
  const t = useTranslations("calculadoras.db");

  // State for dB to ratio conversion
  const [dbValue, setDbValue] = React.useState<string>("");
  const [powerRatio, setPowerRatio] = React.useState<string>("");
  const [voltageRatio, setVoltageRatio] = React.useState<string>("");

  // State for ratio to dB conversion
  const [inputRatio, setInputRatio] = React.useState<string>("");
  const [ratioType, setRatioType] = React.useState<"power" | "voltage">("power");
  const [resultDb, setResultDb] = React.useState<string>("");

  // Calculate ratios from dB
  React.useEffect(() => {
    const db = parseFloat(dbValue);
    if (Number.isFinite(db)) {
      setPowerRatio(formatNumber(dbToPowerRatio(db), 6));
      setVoltageRatio(formatNumber(dbToVoltageRatio(db), 6));
    } else {
      setPowerRatio("");
      setVoltageRatio("");
    }
  }, [dbValue]);

  // Calculate dB from ratio
  React.useEffect(() => {
    const ratio = parseFloat(inputRatio);
    if (Number.isFinite(ratio) && ratio > 0) {
      if (ratioType === "power") {
        setResultDb(formatNumber(powerRatioToDb(ratio), 4));
      } else {
        setResultDb(formatNumber(voltageRatioToDb(ratio), 4));
      }
    } else {
      setResultDb("");
    }
  }, [inputRatio, ratioType]);

  const handlePresetClick = (db: number) => {
    setDbValue(db.toString());
  };

  return (
    <div className="space-y-6">
      {/* dB to Ratio */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dbToRatio")}</CardTitle>
          <CardDescription>{t("dbToRatioDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="db-input">{t("dbValue")}</Label>
            <Input
              id="db-input"
              type="number"
              step="any"
              placeholder="0"
              value={dbValue}
              onChange={(e) => setDbValue(e.target.value)}
              className="font-mono"
            />
          </div>

          {/* Quick presets */}
          <div className="flex flex-wrap gap-2">
            {COMMON_DB_VALUES.map((preset) => (
              <Button
                key={preset.db}
                variant="outline"
                size="sm"
                onClick={() => handlePresetClick(preset.db)}
                className="text-xs"
              >
                {preset.label} ({preset.description})
              </Button>
            ))}
          </div>

          {/* Results */}
          {dbValue && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("powerRatio")}</div>
                <div className="text-2xl font-bold font-mono">
                  {powerRatio ? `${powerRatio}×` : "-"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  10^(dB/10)
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("voltageRatio")}</div>
                <div className="text-2xl font-bold font-mono">
                  {voltageRatio ? `${voltageRatio}×` : "-"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  10^(dB/20)
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ratio to dB */}
      <Card>
        <CardHeader>
          <CardTitle>{t("ratioToDb")}</CardTitle>
          <CardDescription>{t("ratioToDbDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ratio-input">{t("ratio")}</Label>
              <Input
                id="ratio-input"
                type="number"
                step="any"
                min="0"
                placeholder="1"
                value={inputRatio}
                onChange={(e) => setInputRatio(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("ratioType")}</Label>
              <div className="flex gap-2">
                <Button
                  variant={ratioType === "power" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatioType("power")}
                  className="flex-1"
                >
                  {t("power")}
                </Button>
                <Button
                  variant={ratioType === "voltage" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setRatioType("voltage")}
                  className="flex-1"
                >
                  {t("voltage")}
                </Button>
              </div>
            </div>
          </div>

          {/* Result */}
          {inputRatio && (
            <div className="p-4 rounded-lg bg-muted">
              <div className="text-sm text-muted-foreground">{t("result")}</div>
              <div className="text-2xl font-bold font-mono">
                {resultDb ? `${resultDb} dB` : "-"}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {ratioType === "power" ? "10 × log₁₀(ratio)" : "20 × log₁₀(ratio)"}
              </div>
            </div>
          )}
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
                  <th className="text-left py-2 px-3 font-medium">dB</th>
                  <th className="text-left py-2 px-3 font-medium">{t("powerRatio")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("voltageRatio")}</th>
                </tr>
              </thead>
              <tbody>
                {[20, 10, 6, 3, 0, -3, -6, -10, -20].map((db) => (
                  <tr key={db} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="py-2 px-3 font-mono">{db > 0 ? `+${db}` : db}</td>
                    <td className="py-2 px-3 font-mono">{formatNumber(dbToPowerRatio(db), 4)}×</td>
                    <td className="py-2 px-3 font-mono">{formatNumber(dbToVoltageRatio(db), 4)}×</td>
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
