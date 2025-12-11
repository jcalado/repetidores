'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Slider } from '@/components/ui/slider';
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Check,
  Radio,
  TrendingUp,
  TrendingDown,
  AlertCircle,
} from 'lucide-react';
import {
  calculateDoppler,
  parseFrequencyMHz,
  formatShift,
  formatFrequency,
  getMaxDopplerShift,
  type DopplerResult,
} from '@/lib/satellites/doppler';
import { AudioTuningAid } from './AudioTuningAid';
import type { SatelliteWithTLE } from '@/lib/satellites/satellite-catalog';

interface DopplerCalculatorProps {
  satellite: SatelliteWithTLE | null;
  rangeRate: number | null; // km/s from look angles
  isVisible: boolean; // satellite above horizon
}

export function DopplerCalculator({
  satellite,
  rangeRate,
  isVisible,
}: DopplerCalculatorProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Parse satellite frequencies
  const uplinkMHz = useMemo(
    () => parseFrequencyMHz(satellite?.uplink),
    [satellite?.uplink]
  );
  const downlinkMHz = useMemo(
    () => parseFrequencyMHz(satellite?.downlink),
    [satellite?.downlink]
  );

  // Calculate Doppler shift
  const doppler: DopplerResult | null = useMemo(() => {
    if (rangeRate === null) return null;
    return calculateDoppler(uplinkMHz, downlinkMHz, rangeRate);
  }, [uplinkMHz, downlinkMHz, rangeRate]);

  // Calculate max shift for visualization
  const maxDownlinkShift = downlinkMHz ? getMaxDopplerShift(downlinkMHz) : 10000;
  const maxUplinkShift = uplinkMHz ? getMaxDopplerShift(uplinkMHz) : 10000;

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (!satellite) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Selecione um satélite para ver a correção Doppler.
        </AlertDescription>
      </Alert>
    );
  }

  if (!uplinkMHz && !downlinkMHz) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma frequência disponível para {satellite.name}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border">
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium">{satellite.name}</p>
            {satellite.mode && (
              <p className="text-sm text-muted-foreground">{satellite.mode}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isVisible ? (
            <Badge variant="default" className="bg-green-600">
              Acima do Horizonte
            </Badge>
          ) : (
            <Badge variant="secondary">Abaixo do Horizonte</Badge>
          )}
        </div>
      </div>

      {/* Velocity Status */}
      {doppler && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {doppler.isApproaching ? (
                  <>
                    <TrendingDown className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-600">A aproximar</span>
                  </>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-600">A afastar</span>
                  </>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-mono font-bold">
                  {Math.abs(doppler.radialVelocity).toFixed(2)} km/s
                </p>
                <p className="text-sm text-muted-foreground">Velocidade radial</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequency Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Downlink */}
        {downlinkMHz && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowDown className="h-4 w-4 text-green-600" />
                Downlink (Receção)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Original</p>
                <p className="font-mono">{formatFrequency(downlinkMHz)}</p>
              </div>
              {doppler?.downlinkCorrected && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Corrigida (sintonize aqui)
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-mono font-bold text-green-600">
                        {formatFrequency(doppler.downlinkCorrected, 4)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleCopy(
                            doppler.downlinkCorrected!.toFixed(4),
                            'downlink'
                          )
                        }
                      >
                        {copiedField === 'downlink' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Desvio</p>
                    <p
                      className={`font-mono ${
                        doppler.downlinkShift >= 0
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {formatShift(doppler.downlinkShift)}
                    </p>
                  </div>
                  {/* Shift visualization */}
                  <DopplerBar
                    shift={doppler.downlinkShift}
                    maxShift={maxDownlinkShift}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Uplink */}
        {uplinkMHz && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <ArrowUp className="h-4 w-4 text-orange-600" />
                Uplink (Transmissão)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Original</p>
                <p className="font-mono">{formatFrequency(uplinkMHz)}</p>
              </div>
              {doppler?.uplinkCorrected && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Corrigida (transmita aqui)
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-2xl font-mono font-bold text-orange-600">
                        {formatFrequency(doppler.uplinkCorrected, 4)}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          handleCopy(
                            doppler.uplinkCorrected!.toFixed(4),
                            'uplink'
                          )
                        }
                      >
                        {copiedField === 'uplink' ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Desvio</p>
                    <p
                      className={`font-mono ${
                        doppler.uplinkShift >= 0
                          ? 'text-orange-600'
                          : 'text-green-600'
                      }`}
                    >
                      {formatShift(doppler.uplinkShift)}
                    </p>
                  </div>
                  {/* Shift visualization */}
                  <DopplerBar
                    shift={doppler.uplinkShift}
                    maxShift={maxUplinkShift}
                  />
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Audio Tuning Aid */}
      <AudioTuningAid />

      {/* Info */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          <strong>Dica:</strong> Quando o satélite se aproxima, a frequência
          recebida é mais alta. Ajuste o seu rádio para as frequências corrigidas
          em tempo real. As frequências atualizam automaticamente.
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Visual bar showing Doppler shift magnitude
 */
function DopplerBar({
  shift,
  maxShift,
}: {
  shift: number;
  maxShift: number;
}) {
  const percentage = Math.min(Math.abs(shift) / maxShift, 1) * 100;
  const isPositive = shift >= 0;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>-{(maxShift / 1000).toFixed(0)} kHz</span>
        <span>0</span>
        <span>+{(maxShift / 1000).toFixed(0)} kHz</span>
      </div>
      <div className="relative h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-slate-400 dark:bg-slate-500 -translate-x-1/2 z-10" />
        {/* Shift bar */}
        <div
          className={`absolute top-0 bottom-0 transition-all ${
            isPositive
              ? 'left-1/2 bg-orange-500'
              : 'right-1/2 bg-green-500'
          }`}
          style={{
            width: `${percentage / 2}%`,
          }}
        />
      </div>
    </div>
  );
}
