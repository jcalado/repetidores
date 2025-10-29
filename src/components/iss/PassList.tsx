'use client';

import { useMemo } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ISSPass } from '@/lib/iss/types';
import { azimuthToCardinal } from '@/lib/iss/satellite-calculations';
import { formatPassDuration, getPassQuality } from '@/lib/iss/pass-predictor';
import { Eye, EyeOff, Clock, Compass, TrendingUp } from 'lucide-react';

interface PassListProps {
  passes: ISSPass[];
  currentTime: Date;
}

export function PassList({ passes, currentTime }: PassListProps) {
  const nextPass = useMemo(() => {
    return passes.find(pass => pass.startTime > currentTime);
  }, [passes, currentTime]);

  if (passes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nenhuma Passagem Encontrada</CardTitle>
          <CardDescription>
            Não foram encontradas passagens da ISS para os próximos 7 dias com os filtros atuais.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {nextPass && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Próxima Passagem
            </CardTitle>
            <CardDescription className="text-lg font-medium text-blue-900 dark:text-blue-100">
              {formatDistanceToNow(nextPass.startTime, { locale: pt, addSuffix: true })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div>
                <div className="text-slate-600 dark:text-slate-400">Início</div>
                <div className="font-medium">{format(nextPass.startTime, 'HH:mm:ss', { locale: pt })}</div>
              </div>
              <div>
                <div className="text-slate-600 dark:text-slate-400">Duração</div>
                <div className="font-medium">{formatPassDuration(nextPass.duration)}</div>
              </div>
              <div>
                <div className="text-slate-600 dark:text-slate-400">Elevação Máx.</div>
                <div className="font-medium">{nextPass.maxElevation.toFixed(1)}°</div>
              </div>
              <div>
                <div className="text-slate-600 dark:text-slate-400">Direção</div>
                <div className="font-medium">{azimuthToCardinal(nextPass.maxAzimuth)}</div>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {nextPass.isVisible ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <Eye className="h-3 w-3 mr-1" />
                  Visível
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <EyeOff className="h-3 w-3 mr-1" />
                  Não Visível
                </Badge>
              )}
              <Badge variant="outline">
                {getPassQualityLabel(getPassQuality(nextPass.maxElevation))}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todas as Passagens ({passes.length})</CardTitle>
          <CardDescription>
            Próximos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Duração</TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Elev. Máx.
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Compass className="h-4 w-4" />
                      Direção
                    </div>
                  </TableHead>
                  <TableHead>Qualidade</TableHead>
                  <TableHead>Visibilidade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {passes.map((pass, index) => {
                  const isNext = pass === nextPass;
                  return (
                    <TableRow
                      key={index}
                      className={isNext ? 'bg-blue-50 dark:bg-blue-950' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{format(pass.startTime, 'dd/MM/yyyy', { locale: pt })}</span>
                          <span className="text-sm text-slate-600 dark:text-slate-400">
                            {format(pass.startTime, 'HH:mm:ss', { locale: pt })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {formatPassDuration(pass.duration)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {pass.maxElevation.toFixed(1)}°
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-medium">{azimuthToCardinal(pass.maxAzimuth)}</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                            {pass.maxAzimuth.toFixed(0)}°
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPassQualityVariant(getPassQuality(pass.maxElevation))}>
                          {getPassQualityLabel(getPassQuality(pass.maxElevation))}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {pass.isVisible ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            <Eye className="h-3 w-3 mr-1" />
                            Sim
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Não
                          </Badge>
                        )}
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

function getPassQualityLabel(quality: 'excellent' | 'good' | 'fair' | 'poor'): string {
  const labels = {
    excellent: 'Excelente',
    good: 'Boa',
    fair: 'Razoável',
    poor: 'Fraca',
  };
  return labels[quality];
}

function getPassQualityVariant(quality: 'excellent' | 'good' | 'fair' | 'poor'): 'default' | 'secondary' | 'outline' {
  const variants = {
    excellent: 'default' as const,
    good: 'default' as const,
    fair: 'secondary' as const,
    poor: 'outline' as const,
  };
  return variants[quality];
}
