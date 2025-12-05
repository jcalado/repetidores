"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { COAX_CABLES, REFERENCE_FREQUENCIES, calculateCableLoss, getCableById } from "@/lib/coax-data";
import { formatNumber } from "@/lib/rf-calculations";

export default function CoaxLossCalculator() {
  const t = useTranslations("calculadoras.coax");

  const [selectedCable, setSelectedCable] = React.useState<string>("rg213");
  const [length, setLength] = React.useState<string>("10");
  const [frequency, setFrequency] = React.useState<string>("144");

  const cable = getCableById(selectedCable);
  const lengthNum = parseFloat(length);
  const freqNum = parseFloat(frequency);

  const loss = React.useMemo(() => {
    if (!cable || !Number.isFinite(lengthNum) || !Number.isFinite(freqNum) || lengthNum <= 0 || freqNum <= 0) {
      return null;
    }
    return calculateCableLoss(cable, freqNum, lengthNum);
  }, [cable, lengthNum, freqNum]);

  // Calculate losses at reference frequencies for the selected cable and length
  const refLosses = React.useMemo(() => {
    if (!cable || !Number.isFinite(lengthNum) || lengthNum <= 0) return [];
    return REFERENCE_FREQUENCIES.map((ref) => ({
      ...ref,
      loss: calculateCableLoss(cable, ref.mhz, lengthNum),
    }));
  }, [cable, lengthNum]);

  const handleFrequencyPreset = (mhz: number) => {
    setFrequency(mhz.toString());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cable selection */}
          <div className="space-y-2">
            <Label htmlFor="cable-select">{t("cableType")}</Label>
            <Select value={selectedCable} onValueChange={setSelectedCable}>
              <SelectTrigger id="cable-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COAX_CABLES.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.impedance}Ω)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Cable info */}
          {cable && (
            <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="font-medium">{t("impedance")}:</span> {cable.impedance}Ω
                </div>
                <div>
                  <span className="font-medium">{t("velocityFactor")}:</span> {(cable.velocityFactor * 100).toFixed(0)}%
                </div>
                <div>
                  <span className="font-medium">{t("diameter")}:</span> {cable.outerDiameter} mm
                </div>
              </div>
            </div>
          )}

          {/* Length and frequency inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length-input">{t("length")} (m)</Label>
              <Input
                id="length-input"
                type="number"
                step="0.1"
                min="0"
                placeholder="10"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freq-input">{t("frequency")} (MHz)</Label>
              <Input
                id="freq-input"
                type="number"
                step="0.1"
                min="0"
                placeholder="144"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                className="font-mono"
              />
            </div>
          </div>

          {/* Frequency presets */}
          <div className="flex flex-wrap gap-2">
            {[
              { mhz: 7, label: "7 MHz" },
              { mhz: 14, label: "14 MHz" },
              { mhz: 28, label: "28 MHz" },
              { mhz: 50, label: "50 MHz" },
              { mhz: 144, label: "144 MHz" },
              { mhz: 432, label: "432 MHz" },
            ].map((preset) => (
              <Button
                key={preset.mhz}
                variant="outline"
                size="sm"
                onClick={() => handleFrequencyPreset(preset.mhz)}
                className="text-xs"
              >
                {preset.label}
              </Button>
            ))}
          </div>

          {/* Result */}
          {loss !== null && (
            <div className="p-6 rounded-lg bg-muted text-center">
              <div className="text-sm text-muted-foreground">{t("totalLoss")}</div>
              <div className="text-4xl font-bold font-mono text-destructive">
                {formatNumber(loss, 2)} dB
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                {cable?.name} · {length} m · {frequency} MHz
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Loss at reference frequencies */}
      {refLosses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("lossAtFrequencies")}</CardTitle>
            <CardDescription>
              {cable?.name} · {length} m
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">{t("frequency")}</th>
                    <th className="text-right py-2 px-3 font-medium">{t("loss")} (dB)</th>
                  </tr>
                </thead>
                <tbody>
                  {refLosses.map((ref) => (
                    <tr key={ref.mhz} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="py-2 px-3">{ref.label}</td>
                      <td className="py-2 px-3 text-right font-mono text-destructive">
                        {formatNumber(ref.loss, 2)} dB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cable comparison */}
      <Card>
        <CardHeader>
          <CardTitle>{t("cableComparison")}</CardTitle>
          <CardDescription>
            {t("lossAt")} {frequency} MHz · {length} m
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium">{t("cable")}</th>
                  <th className="text-right py-2 px-3 font-medium">{t("loss")} (dB)</th>
                </tr>
              </thead>
              <tbody>
                {COAX_CABLES
                  .filter((c) => c.impedance === 50)
                  .map((c) => {
                    const cableLoss = Number.isFinite(lengthNum) && Number.isFinite(freqNum) && lengthNum > 0 && freqNum > 0
                      ? calculateCableLoss(c, freqNum, lengthNum)
                      : null;
                    return (
                      <tr
                        key={c.id}
                        className={`border-b last:border-0 hover:bg-muted/50 ${c.id === selectedCable ? "bg-muted" : ""}`}
                      >
                        <td className="py-2 px-3">
                          {c.name}
                          {c.id === selectedCable && (
                            <span className="ml-2 text-xs text-muted-foreground">({t("selected")})</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-destructive">
                          {cableLoss !== null ? `${formatNumber(cableLoss, 2)} dB` : "-"}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
