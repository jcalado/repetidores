"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  swrToReflectionCoefficient,
  reflectionCoefficientToSwr,
  returnLossToSwr,
  returnLossToReflectionCoefficient,
  reflectionCoefficientToReturnLoss,
  reflectionCoefficientToMismatchLoss,
  reflectionCoefficientToReflectedPower,
  reflectionCoefficientToTransmittedPower,
  formatNumber,
  formatPercent,
} from "@/lib/rf-calculations";

type InputMode = "swr" | "gamma" | "returnLoss";

export default function SWRCalculator() {
  const t = useTranslations("calculadoras.swr");

  const [inputMode, setInputMode] = React.useState<InputMode>("swr");
  const [inputValue, setInputValue] = React.useState<string>("");

  // Calculated values
  const [swr, setSwr] = React.useState<number | null>(null);
  const [gamma, setGamma] = React.useState<number | null>(null);
  const [returnLoss, setReturnLoss] = React.useState<number | null>(null);
  const [mismatchLoss, setMismatchLoss] = React.useState<number | null>(null);
  const [reflectedPower, setReflectedPower] = React.useState<number | null>(null);
  const [transmittedPower, setTransmittedPower] = React.useState<number | null>(null);

  // Calculate all values from input
  React.useEffect(() => {
    const value = parseFloat(inputValue);

    if (!Number.isFinite(value)) {
      setSwr(null);
      setGamma(null);
      setReturnLoss(null);
      setMismatchLoss(null);
      setReflectedPower(null);
      setTransmittedPower(null);
      return;
    }

    let calculatedGamma: number;

    switch (inputMode) {
      case "swr":
        if (value < 1) {
          setSwr(null);
          setGamma(null);
          setReturnLoss(null);
          setMismatchLoss(null);
          setReflectedPower(null);
          setTransmittedPower(null);
          return;
        }
        calculatedGamma = swrToReflectionCoefficient(value);
        setSwr(value);
        break;
      case "gamma":
        if (value < 0 || value >= 1) {
          setSwr(null);
          setGamma(null);
          setReturnLoss(null);
          setMismatchLoss(null);
          setReflectedPower(null);
          setTransmittedPower(null);
          return;
        }
        calculatedGamma = value;
        setSwr(reflectionCoefficientToSwr(value));
        break;
      case "returnLoss":
        if (value <= 0) {
          setSwr(null);
          setGamma(null);
          setReturnLoss(null);
          setMismatchLoss(null);
          setReflectedPower(null);
          setTransmittedPower(null);
          return;
        }
        calculatedGamma = returnLossToReflectionCoefficient(value);
        setSwr(returnLossToSwr(value));
        break;
      default:
        return;
    }

    setGamma(calculatedGamma);
    setReturnLoss(reflectionCoefficientToReturnLoss(calculatedGamma));
    setMismatchLoss(reflectionCoefficientToMismatchLoss(calculatedGamma));
    setReflectedPower(reflectionCoefficientToReflectedPower(calculatedGamma));
    setTransmittedPower(reflectionCoefficientToTransmittedPower(calculatedGamma));
  }, [inputValue, inputMode]);

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode);
    setInputValue("");
  };

  const getPlaceholder = () => {
    switch (inputMode) {
      case "swr":
        return "1.5";
      case "gamma":
        return "0.2";
      case "returnLoss":
        return "14";
    }
  };

  const getInputLabel = () => {
    switch (inputMode) {
      case "swr":
        return "SWR";
      case "gamma":
        return t("reflectionCoefficient") + " (Γ)";
      case "returnLoss":
        return t("returnLoss") + " (dB)";
    }
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
            <div className="flex flex-wrap gap-2">
              <Button
                variant={inputMode === "swr" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("swr")}
              >
                SWR
              </Button>
              <Button
                variant={inputMode === "gamma" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("gamma")}
              >
                Γ ({t("reflectionCoefficient")})
              </Button>
              <Button
                variant={inputMode === "returnLoss" ? "default" : "outline"}
                size="sm"
                onClick={() => handleModeChange("returnLoss")}
              >
                {t("returnLoss")}
              </Button>
            </div>
          </div>

          {/* Input field */}
          <div className="space-y-2">
            <Label htmlFor="swr-input">{getInputLabel()}</Label>
            <Input
              id="swr-input"
              type="number"
              step="any"
              min={inputMode === "swr" ? "1" : "0"}
              max={inputMode === "gamma" ? "0.999" : undefined}
              placeholder={getPlaceholder()}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="font-mono text-lg"
            />
          </div>

          {/* Results */}
          {swr !== null && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t">
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">SWR</div>
                <div className="text-2xl font-bold font-mono">
                  {formatNumber(swr, 3)}:1
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">Γ</div>
                <div className="text-2xl font-bold font-mono">
                  {gamma !== null ? formatNumber(gamma, 4) : "-"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("returnLoss")}</div>
                <div className="text-2xl font-bold font-mono">
                  {returnLoss !== null ? `${formatNumber(returnLoss, 2)} dB` : "-"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("mismatchLoss")}</div>
                <div className="text-2xl font-bold font-mono">
                  {mismatchLoss !== null ? `${formatNumber(mismatchLoss, 3)} dB` : "-"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("reflectedPower")}</div>
                <div className="text-2xl font-bold font-mono">
                  {reflectedPower !== null ? formatPercent(reflectedPower) : "-"}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <div className="text-sm text-muted-foreground">{t("transmittedPower")}</div>
                <div className="text-2xl font-bold font-mono">
                  {transmittedPower !== null ? formatPercent(transmittedPower) : "-"}
                </div>
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
                  <th className="text-left py-2 px-2 font-medium">SWR</th>
                  <th className="text-left py-2 px-2 font-medium">Γ</th>
                  <th className="text-left py-2 px-2 font-medium">{t("returnLoss")}</th>
                  <th className="text-left py-2 px-2 font-medium">{t("reflectedPower")}</th>
                  <th className="text-left py-2 px-2 font-medium">{t("mismatchLoss")}</th>
                </tr>
              </thead>
              <tbody>
                {[1.0, 1.1, 1.2, 1.3, 1.5, 2.0, 2.5, 3.0, 5.0, 10.0].map((swrVal) => {
                  const g = swrToReflectionCoefficient(swrVal);
                  return (
                    <tr key={swrVal} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-2 font-mono">{swrVal}:1</td>
                      <td className="py-2 px-2 font-mono">{formatNumber(g, 3)}</td>
                      <td className="py-2 px-2 font-mono">{formatNumber(reflectionCoefficientToReturnLoss(g), 1)} dB</td>
                      <td className="py-2 px-2 font-mono">{formatPercent(reflectionCoefficientToReflectedPower(g))}</td>
                      <td className="py-2 px-2 font-mono">{formatNumber(reflectionCoefficientToMismatchLoss(g), 2)} dB</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Formulas */}
      <Card>
        <CardHeader>
          <CardTitle>{t("formulas")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <p>Γ = (SWR - 1) / (SWR + 1)</p>
            <p>SWR = (1 + |Γ|) / (1 - |Γ|)</p>
            <p>{t("returnLoss")} = -20 × log₁₀(|Γ|)</p>
            <p>{t("mismatchLoss")} = -10 × log₁₀(1 - Γ²)</p>
            <p>{t("reflectedPower")} = Γ² × 100%</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
