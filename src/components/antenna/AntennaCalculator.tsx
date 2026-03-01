'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Radio, Calculator, Ruler } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { calculateAntenna, calculateYagi, COMMON_FREQUENCIES, type AntennaResult, type YagiResult } from '@/lib/antenna';

export function AntennaCalculator() {
  const t = useTranslations('antenna');
  const [frequencyInput, setFrequencyInput] = useState('');
  const [selectedBand, setSelectedBand] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [numElements, setNumElements] = useState(3);

  const result: AntennaResult | null = useMemo(() => {
    const freq = parseFloat(frequencyInput);
    if (isNaN(freq) || freq <= 0) {
      return null;
    }
    return calculateAntenna(freq);
  }, [frequencyInput]);

  const yagiResult: YagiResult | null = useMemo(() => {
    const freq = parseFloat(frequencyInput);
    if (isNaN(freq) || freq <= 0) {
      return null;
    }
    return calculateYagi(freq, numElements);
  }, [frequencyInput, numElements]);

  const handleBandSelect = (freq: number, label: string) => {
    setFrequencyInput(freq.toString());
    setSelectedBand(label);
    setError('');
  };

  const handleInputChange = (value: string) => {
    setFrequencyInput(value);
    setSelectedBand(null);
    setError('');

    const freq = parseFloat(value);
    if (value && (isNaN(freq) || freq <= 0)) {
      setError(t('invalidFrequency'));
    }
  };

  const formatNumber = (num: number, decimals: number = 2) => {
    return num.toFixed(decimals);
  };

  return (
    <div className="grid gap-6">
        {/* Frequency Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Radio className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
              {t('frequency')}
            </CardTitle>
            <CardDescription>{t('frequencyDescription')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder={t('frequencyPlaceholder')}
                  value={frequencyInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  className="font-mono text-lg"
                />
              </div>
              <span className="flex items-center text-muted-foreground font-medium">MHz</span>
            </div>
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            {/* Common bands */}
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-3">{t('commonBands')}</p>
              <div className="flex flex-wrap gap-2">
                {COMMON_FREQUENCIES.map((band) => (
                  <Button
                    key={band.label}
                    variant={selectedBand === band.label ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleBandSelect(band.freq, band.label)}
                    className={cn(
                      'font-mono',
                      selectedBand === band.label && 'bg-ship-cove-600 hover:bg-ship-cove-700'
                    )}
                  >
                    {band.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {result ? (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Half-Wave Dipole */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
                  {t('dipole')}
                </CardTitle>
                <CardDescription>{t('dipoleDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Total length */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-ship-cove-50 to-ship-cove-100 dark:from-ship-cove-900/20 dark:to-ship-cove-800/20 border border-ship-cove-200 dark:border-ship-cove-800">
                  <p className="text-sm text-muted-foreground mb-1">{t('totalLength')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-bold text-ship-cove-700 dark:text-ship-cove-400">
                      {formatNumber(result.halfWaveDipole)}
                    </span>
                    <span className="text-lg text-muted-foreground">{t('meters')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({formatNumber(result.halfWaveDipoleFeet)} {t('feet')})
                  </p>
                </div>

                {/* Each leg */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-muted-foreground mb-1">{t('eachLeg')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                      {formatNumber(result.halfWaveDipoleLeg)}
                    </span>
                    <span className="text-muted-foreground">{t('meters')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({formatNumber(result.halfWaveDipoleLegFeet)} {t('feet')})
                  </p>
                </div>

                {/* Diagram */}
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/30">
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                    <div className="flex-1 h-1 bg-ship-cove-500 rounded-l-full"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                    <div className="flex-1 h-1 bg-ship-cove-500 rounded-r-full"></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>{formatNumber(result.halfWaveDipoleLeg)}m</span>
                    <span>{t('feedpoint')}</span>
                    <span>{formatNumber(result.halfWaveDipoleLeg)}m</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quarter-Wave Vertical */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Ruler className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
                  {t('vertical')}
                </CardTitle>
                <CardDescription>{t('verticalDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Vertical length */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-ship-cove-50 to-ship-cove-100 dark:from-ship-cove-900/20 dark:to-ship-cove-800/20 border border-ship-cove-200 dark:border-ship-cove-800">
                  <p className="text-sm text-muted-foreground mb-1">{t('height')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-mono font-bold text-ship-cove-700 dark:text-ship-cove-400">
                      {formatNumber(result.quarterWaveVertical)}
                    </span>
                    <span className="text-lg text-muted-foreground">{t('meters')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ({formatNumber(result.quarterWaveVerticalFeet)} {t('feet')})
                  </p>
                </div>

                {/* Wavelength info */}
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700">
                  <p className="text-sm text-muted-foreground mb-1">{t('wavelength')}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">
                      {formatNumber(result.wavelength)}
                    </span>
                    <span className="text-muted-foreground">{t('meters')}</span>
                  </div>
                </div>

                {/* Vertical diagram */}
                <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-slate-800/30">
                  <div className="flex flex-col items-center">
                    <div className="w-1 h-16 bg-ship-cove-500 rounded-t-full"></div>
                    <div className="w-16 h-1 bg-slate-400"></div>
                  </div>
                  <div className="flex justify-center mt-2 text-xs text-muted-foreground">
                    <span>{formatNumber(result.quarterWaveVertical)}m + {t('groundRadials')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Yagi-Uda */}
          {yagiResult && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Ruler className="h-5 w-5 text-ship-cove-600 dark:text-ship-cove-400" />
                      {t('yagi')}
                    </CardTitle>
                    <CardDescription>{t('yagiDescription')}</CardDescription>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-muted-foreground">{t('numElements')}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={2}
                        max={10}
                        value={numElements}
                        onChange={(e) => setNumElements(parseInt(e.target.value))}
                        className="w-24 accent-ship-cove-600"
                      />
                      <span className="font-mono text-lg font-bold w-6 text-center">{numElements}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Summary stats */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-ship-cove-50 to-ship-cove-100 dark:from-ship-cove-900/20 dark:to-ship-cove-800/20 border border-ship-cove-200 dark:border-ship-cove-800">
                    <p className="text-sm text-muted-foreground mb-1">{t('boomLength')}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-ship-cove-700 dark:text-ship-cove-400">
                        {formatNumber(yagiResult.boomLength)}
                      </span>
                      <span className="text-lg text-muted-foreground">{t('meters')}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      ({formatNumber(yagiResult.boomLengthFeet)} {t('feet')})
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-ship-cove-50 to-ship-cove-100 dark:from-ship-cove-900/20 dark:to-ship-cove-800/20 border border-ship-cove-200 dark:border-ship-cove-800">
                    <p className="text-sm text-muted-foreground mb-1">{t('estimatedGain')}</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-bold text-ship-cove-700 dark:text-ship-cove-400">
                        {formatNumber(yagiResult.estimatedGainDbd, 1)}
                      </span>
                      <span className="text-lg text-muted-foreground">dBd</span>
                    </div>
                  </div>
                </div>

                {/* Element table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-800/50">
                        <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t('element')}</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('length')}</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('spacing')}</th>
                        <th className="text-right px-3 py-2 font-medium text-muted-foreground">{t('position')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {yagiResult.elements.map((el, i) => (
                        <tr key={i} className="border-t border-gray-100 dark:border-slate-800">
                          <td className="px-3 py-2 font-medium">
                            {el.type === 'reflector' ? t('reflector') : el.type === 'driven' ? t('drivenElement') : `${t('director')} ${el.label.replace('D', '')}`}
                          </td>
                          <td className="text-right px-3 py-2 font-mono">
                            {formatNumber(el.length, 3)} m
                            <span className="text-muted-foreground ml-1 text-xs">({formatNumber(el.lengthFeet)} ft)</span>
                          </td>
                          <td className="text-right px-3 py-2 font-mono">
                            {el.spacing > 0 ? `${formatNumber(el.spacing, 3)} m` : '—'}
                          </td>
                          <td className="text-right px-3 py-2 font-mono">
                            {formatNumber(el.position, 3)} m
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Visual diagram */}
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/30 overflow-x-auto">
                  <div className="relative mx-auto" style={{ minWidth: '280px', maxWidth: '600px', height: '120px' }}>
                    {/* Boom (horizontal line) */}
                    <div className="absolute top-1/2 -translate-y-1/2 h-1 rounded-full bg-slate-300 dark:bg-slate-600" style={{ left: '8%', right: '8%' }} />
                    {/* Arrow head (direction) */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-slate-400 dark:border-l-slate-500"
                      style={{ right: '6%' }}
                    />
                    {/* Elements */}
                    {yagiResult.elements.map((el, i) => {
                      const pos = yagiResult.boomLength > 0
                        ? 8 + (el.position / yagiResult.boomLength) * 84
                        : 8;
                      const longestElement = Math.max(...yagiResult.elements.map(e => e.length));
                      const relHeight = longestElement > 0 ? (el.length / longestElement) : 1;
                      const maxHalf = 42;
                      const halfHeight = relHeight * maxHalf;
                      return (
                        <div
                          key={i}
                          className="absolute flex flex-col items-center"
                          style={{ left: `${pos}%`, top: '50%', transform: 'translate(-50%, -50%)' }}
                        >
                          {/* Element bar (centered on boom) */}
                          <div
                            className={cn(
                              'rounded-full',
                              el.type === 'driven' ? 'w-1 bg-ship-cove-500' : el.type === 'reflector' ? 'w-0.5 bg-amber-500' : 'w-0.5 bg-slate-500 dark:bg-slate-400'
                            )}
                            style={{ height: `${halfHeight * 2}px` }}
                          />
                          {/* Label */}
                          <span
                            className="absolute text-[10px] font-medium text-muted-foreground whitespace-nowrap"
                            style={{ top: `${halfHeight + 6}px` }}
                          >
                            {el.type === 'reflector' ? 'R' : el.type === 'driven' ? 'DE' : el.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-center gap-4 text-[10px] text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber-500 rounded-full" /> {t('reflector')}</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-1 bg-ship-cove-500 rounded-full" /> {t('drivenElement')}</span>
                    <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-slate-500 dark:bg-slate-400 rounded-full" /> {t('director')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('enterFrequency')}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Formula reference */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">{t('formulas')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 font-mono text-sm">
                <p className="text-muted-foreground mb-1">{t('wavelength')}:</p>
                <p className="text-slate-900 dark:text-white">λ = 300 / f(MHz)</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 font-mono text-sm">
                <p className="text-muted-foreground mb-1">{t('dipole')}:</p>
                <p className="text-slate-900 dark:text-white">L = (λ / 2) × 0.95</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 font-mono text-sm">
                <p className="text-muted-foreground mb-1">{t('vertical')}:</p>
                <p className="text-slate-900 dark:text-white">L = (λ / 4) × 0.95</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50 font-mono text-sm">
                <p className="text-muted-foreground mb-1">{t('yagi')}:</p>
                <p className="text-slate-900 dark:text-white">{t('yagiFormula')}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                <p className="text-muted-foreground mb-1 text-sm">{t('note')}:</p>
                <p className="text-xs text-slate-600 dark:text-slate-400">{t('correctionNote')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
