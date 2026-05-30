'use client';

import { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ISSPass } from '@/lib/iss/types';
import { azimuthToCardinal } from '@/lib/iss/satellite-calculations';
import { formatPassDuration, getPassQuality } from '@/lib/iss/pass-predictor';
import { Eye, EyeOff, Clock, Compass, TrendingUp, Cloud, Sun, CloudOff } from 'lucide-react';

interface PassListProps {
  passes: ISSPass[];
  currentTime: Date;
}

type Quality = 'excellent' | 'good' | 'fair' | 'poor';
type QualityVariant = 'success' | 'default' | 'warning' | 'outline';

const QUALITY_LABEL: Record<Quality, string> = {
  excellent: 'Excelente',
  good: 'Boa',
  fair: 'Razoável',
  poor: 'Fraca',
};

// Quality is a 4-step ordinal scale. Map it to Badge variants from
// brightest-positive → muted, matching the underlying ordering instead of
// arbitrary visual stops.
const QUALITY_VARIANT: Record<Quality, QualityVariant> = {
  excellent: 'success',
  good: 'default',
  fair: 'warning',
  poor: 'outline',
};

export function PassList({ passes, currentTime }: PassListProps) {
  const nextPass = useMemo(() => {
    return passes.find((pass) => pass.startTime > currentTime);
  }, [passes, currentTime]);

  if (passes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma passagem encontrada</CardTitle>
          <CardDescription>
            Não foram encontradas passagens para os próximos 7 dias com os filtros atuais.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {nextPass && <NextPassPanel pass={nextPass} />}

      <Card>
        <CardHeader>
          <CardTitle>Todas as passagens</CardTitle>
          <CardDescription>
            Próximos 7 dias{' '}
            <span className="ml-1 font-mono tabular-nums text-foreground/60">
              {passes.length}
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data / hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center justify-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      Elev. máx.
                    </span>
                  </TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center justify-center gap-1">
                      <Compass className="h-3.5 w-3.5" aria-hidden="true" />
                      Direção
                    </span>
                  </TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Visibilidade</TableHead>
                  <TableHead className="text-center">
                    <span className="inline-flex items-center justify-center gap-1">
                      <Cloud className="h-3.5 w-3.5" aria-hidden="true" />
                      Tempo
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passes.map((pass, index) => {
                  const isNext = pass === nextPass;
                  const quality = getPassQuality(pass.maxElevation) as Quality;
                  return (
                    <TableRow
                      key={index}
                      className={
                        isNext ? 'bg-azulejo-50/40 dark:bg-azulejo-950/20' : ''
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-mono tabular-nums">
                            {format(pass.startTime, 'dd/MM/yyyy', { locale: pt })}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {format(pass.startTime, 'HH:mm:ss', { locale: pt })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm tabular-nums">
                          {formatPassDuration(pass.duration)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono text-sm font-medium tabular-nums">
                          {pass.maxElevation.toFixed(1)}°
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-mono text-sm font-medium tabular-nums">
                            {azimuthToCardinal(pass.maxAzimuth)}
                          </span>
                          <span className="font-mono text-xs tabular-nums text-muted-foreground">
                            {pass.maxAzimuth.toFixed(0)}°
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <QualityBadge quality={quality} />
                      </TableCell>
                      <TableCell>
                        <VisibilityBadge isVisible={pass.isVisible} compact />
                      </TableCell>
                      <TableCell className="text-center">
                        <WeatherBadge weather={pass.weather} compact />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function NextPassPanel({ pass }: { pass: ISSPass }) {
  const quality = getPassQuality(pass.maxElevation) as Quality;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-azulejo-600 dark:text-azulejo-400" aria-hidden="true" />
          Próxima passagem
        </CardTitle>
        <CardDescription className="text-foreground">
          {formatDistanceToNow(pass.startTime, { locale: pt, addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Stat label="Início" value={format(pass.startTime, 'HH:mm:ss', { locale: pt })} mono />
          <Stat label="Duração" value={formatPassDuration(pass.duration)} mono />
          <Stat
            label="Elevação máx."
            value={`${pass.maxElevation.toFixed(1)}°`}
            mono
          />
          <Stat label="Direção" value={azimuthToCardinal(pass.maxAzimuth)} mono />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <QualityBadge quality={quality} />
          <VisibilityBadge isVisible={pass.isVisible} />
          <WeatherBadge weather={pass.weather} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground">
        {label}
      </div>
      <div
        className={`mt-0.5 text-foreground ${mono ? 'font-mono text-sm font-semibold tabular-nums' : 'font-medium'}`}
      >
        {value}
      </div>
    </div>
  );
}

function QualityBadge({ quality }: { quality: Quality }) {
  return <Badge variant={QUALITY_VARIANT[quality]}>{QUALITY_LABEL[quality]}</Badge>;
}

function VisibilityBadge({
  isVisible,
  compact,
}: {
  isVisible: boolean;
  compact?: boolean;
}) {
  if (isVisible) {
    return (
      <Badge variant="success">
        <Eye />
        {compact ? 'Sim' : 'Visível'}
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <EyeOff />
      {compact ? 'Não' : 'Não visível'}
    </Badge>
  );
}

function WeatherBadge({
  weather,
  compact,
}: {
  weather?: { isGoodWeather: boolean; cloudCover: number };
  compact?: boolean;
}) {
  if (!weather) {
    return (
      <Badge variant="outline">
        <CloudOff />
        N/D
      </Badge>
    );
  }
  if (weather.isGoodWeather) {
    return (
      <Badge variant="success">
        <Sun />
        {compact ? 'Bom' : 'Bom tempo'}
      </Badge>
    );
  }
  const pct = weather.cloudCover.toFixed(0);
  return (
    <Badge variant="warning">
      <Cloud />
      <span className="font-mono tabular-nums">{pct}%</span>
    </Badge>
  );
}
