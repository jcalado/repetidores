"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowRightLeft } from "lucide-react";
import {
  frequencyToWavelength,
  wavelengthToFrequency,
  hzToKhz,
  hzToMhz,
  hzToGhz,
  khzToHz,
  mhzToHz,
  ghzToHz,
  metersToCm,
  metersToMm,
  cmToMeters,
  mmToMeters,
  formatNumber,
  SPEED_OF_LIGHT,
} from "@/lib/rf-calculations";

type FrequencyUnit = "hz" | "khz" | "mhz" | "ghz";
type WavelengthUnit = "m" | "cm" | "mm";

const FREQUENCY_PRESETS = [
  { freq: 3.5, unit: "mhz" as FrequencyUnit, label: "3.5 MHz (80m)" },
  { freq: 7, unit: "mhz" as FrequencyUnit, label: "7 MHz (40m)" },
  { freq: 14, unit: "mhz" as FrequencyUnit, label: "14 MHz (20m)" },
  { freq: 21, unit: "mhz" as FrequencyUnit, label: "21 MHz (15m)" },
  { freq: 28, unit: "mhz" as FrequencyUnit, label: "28 MHz (10m)" },
  { freq: 50, unit: "mhz" as FrequencyUnit, label: "50 MHz (6m)" },
  { freq: 144, unit: "mhz" as FrequencyUnit, label: "144 MHz (2m)" },
  { freq: 432, unit: "mhz" as FrequencyUnit, label: "432 MHz (70cm)" },
  { freq: 1296, unit: "mhz" as FrequencyUnit, label: "1.3 GHz (23cm)" },
  { freq: 2.4, unit: "ghz" as FrequencyUnit, label: "2.4 GHz (13cm)" },
];

export default function FrequencyCalculator() {
  const t = useTranslations("calculadoras.frequencia");

  const [mode, setMode] = React.useState<"freqToWave" | "waveToFreq">("freqToWave");
  const [inputValue, setInputValue] = React.useState<string>("");
  const [frequencyUnit, setFrequencyUnit] = React.useState<FrequencyUnit>("mhz");
  const [wavelengthUnit, setWavelengthUnit] = React.useState<WavelengthUnit>("m");

  // Convert input to Hz or meters depending on mode
  const convertToBase = React.useCallback((value: number): number => {
    if (mode === "freqToWave") {
      switch (frequencyUnit) {
        case "hz":
          return value;
        case "khz":
          return khzToHz(value);
        case "mhz":
          return mhzToHz(value);
        case "ghz":
          return ghzToHz(value);
      }
    } else {
      switch (wavelengthUnit) {
        case "m":
          return value;
        case "cm":
          return cmToMeters(value);
        case "mm":
          return mmToMeters(value);
      }
    }
  }, [mode, frequencyUnit, wavelengthUnit]);

  // Calculate result
  const result = React.useMemo(() => {
    const value = parseFloat(inputValue);
    if (!Number.isFinite(value) || value <= 0) return null;

    const baseValue = convertToBase(value);

    if (mode === "freqToWave") {
      // Input is frequency, output is wavelength
      const wavelengthM = frequencyToWavelength(baseValue);
      return {
        m: wavelengthM,
        cm: metersToCm(wavelengthM),
        mm: metersToMm(wavelengthM),
      };
    } else {
      // Input is wavelength, output is frequency
      const freqHz = wavelengthToFrequency(baseValue);
      return {
        hz: freqHz,
        khz: hzToKhz(freqHz),
        mhz: hzToMhz(freqHz),
        ghz: hzToGhz(freqHz),
      };
    }
  }, [inputValue, mode, convertToBase]);

  const handleModeToggle = () => {
    setMode((prev) => (prev === "freqToWave" ? "waveToFreq" : "freqToWave"));
    setInputValue("");
  };

  const handlePresetClick = (preset: typeof FREQUENCY_PRESETS[0]) => {
    setMode("freqToWave");
    setFrequencyUnit(preset.unit);
    setInputValue(preset.freq.toString());
  };

  const formatResult = (value: number, decimals: number = 4): string => {
    if (value >= 1000000) {
      return formatNumber(value, 0);
    }
    return formatNumber(value, decimals);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${mode === "freqToWave" ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t("frequency")}
            </span>
            <Button variant="outline" size="icon" onClick={handleModeToggle}>
              <ArrowRightLeft className="h-4 w-4" />
            </Button>
            <span
              className={`text-sm font-medium ${mode === "waveToFreq" ? "text-foreground" : "text-muted-foreground"}`}
            >
              {t("wavelength")}
            </span>
          </div>

          {/* Input */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="value-input">
                {mode === "freqToWave" ? t("frequency") : t("wavelength")}
              </Label>
              <Input
                id="value-input"
                type="number"
                step="any"
                min="0"
                placeholder={mode === "freqToWave" ? "144" : "2.08"}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="font-mono text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label>{t("unit")}</Label>
              {mode === "freqToWave" ? (
                <Select value={frequencyUnit} onValueChange={(v) => setFrequencyUnit(v as FrequencyUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hz">Hz</SelectItem>
                    <SelectItem value="khz">kHz</SelectItem>
                    <SelectItem value="mhz">MHz</SelectItem>
                    <SelectItem value="ghz">GHz</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Select value={wavelengthUnit} onValueChange={(v) => setWavelengthUnit(v as WavelengthUnit)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="mm">mm</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Presets */}
          {mode === "freqToWave" && (
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_PRESETS.slice(0, 6).map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetClick(preset)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="pt-4 border-t">
              <div className="text-sm text-muted-foreground mb-2">
                {mode === "freqToWave" ? t("wavelength") : t("frequency")}
              </div>
              {mode === "freqToWave" ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold font-mono">
                      {formatResult((result as { m: number }).m)} m
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold font-mono">
                      {formatResult((result as { cm: number }).cm)} cm
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-2xl font-bold font-mono">
                      {formatResult((result as { mm: number }).mm)} mm
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-lg font-bold font-mono">
                      {formatResult((result as { hz: number }).hz)} Hz
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-lg font-bold font-mono">
                      {formatResult((result as { khz: number }).khz)} kHz
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-lg font-bold font-mono">
                      {formatResult((result as { mhz: number }).mhz)} MHz
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted">
                    <div className="text-lg font-bold font-mono">
                      {formatResult((result as { ghz: number }).ghz)} GHz
                    </div>
                  </div>
                </div>
              )}
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
                  <th className="text-left py-2 px-3 font-medium">{t("band")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("frequency")}</th>
                  <th className="text-left py-2 px-3 font-medium">{t("wavelength")}</th>
                </tr>
              </thead>
              <tbody>
                {FREQUENCY_PRESETS.map((preset) => {
                  const freqHz = preset.unit === "mhz" ? mhzToHz(preset.freq) : ghzToHz(preset.freq);
                  const wavelengthM = frequencyToWavelength(freqHz);
                  return (
                    <tr key={preset.label} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3">{preset.label}</td>
                      <td className="py-2 px-3 font-mono">
                        {preset.freq} {preset.unit.toUpperCase()}
                      </td>
                      <td className="py-2 px-3 font-mono">
                        {wavelengthM >= 1 ? `${formatNumber(wavelengthM, 2)} m` : `${formatNumber(metersToCm(wavelengthM), 1)} cm`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formula */}
      <Card>
        <CardHeader>
          <CardTitle>{t("formula")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p>λ = c / f</p>
            <p>f = c / λ</p>
            <p className="text-muted-foreground">c = {formatNumber(SPEED_OF_LIGHT, 0)} m/s</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
