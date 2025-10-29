'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ISSPass, LookAngles } from '@/lib/iss/types';
import { Badge } from '@/components/ui/badge';

interface SkyChartProps {
  passes: ISSPass[];
  currentPosition?: LookAngles | null;
  width?: number;
  height?: number;
}

export function SkyChart({ passes, currentPosition, width = 600, height = 600 }: SkyChartProps) {
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) / 2 - 40;

  // Convert elevation/azimuth to polar coordinates (SVG)
  const polarToCartesian = (elevation: number, azimuth: number): { x: number; y: number } => {
    // Elevation: 90° (zenith) = center, 0° (horizon) = outer edge
    const r = radius * (1 - elevation / 90);

    // Azimuth: 0° = North (top), 90° = East (right), clockwise
    // SVG rotation: 0° = right, 90° = down, so we need to adjust
    const angle = (azimuth - 90) * (Math.PI / 180);

    return {
      x: centerX + r * Math.cos(angle),
      y: centerY + r * Math.sin(angle),
    };
  };

  // Generate pass paths
  const passPaths = useMemo(() => {
    return passes.slice(0, 10).map((pass, index) => {
      const pathPoints = pass.trajectory.map(moment => {
        const point = polarToCartesian(moment.lookAngles.elevation, moment.lookAngles.azimuth);
        return `${point.x},${point.y}`;
      });

      const startPoint = polarToCartesian(
        pass.trajectory[0].lookAngles.elevation,
        pass.trajectory[0].lookAngles.azimuth
      );

      const maxElevationPoint = polarToCartesian(
        pass.maxElevation,
        pass.maxAzimuth
      );

      const pathData = `M ${pathPoints.join(' L ')}`;

      // Color based on visibility
      const color = pass.isVisible
        ? `hsl(${140 - index * 15}, 70%, 50%)`
        : `hsl(${220 - index * 15}, 50%, 60%)`;

      return {
        path: pathData,
        color,
        startPoint,
        maxElevationPoint,
        pass,
        index,
      };
    });
  }, [passes, centerX, centerY, radius]);

  // Elevation circles (horizon rings)
  const elevationCircles = [0, 30, 60, 90];

  // Compass directions
  const directions = [
    { label: 'N', angle: 0 },
    { label: 'NE', angle: 45 },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135 },
    { label: 'S', angle: 180 },
    { label: 'SW', angle: 225 },
    { label: 'W', angle: 270 },
    { label: 'NW', angle: 315 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Carta Celeste</CardTitle>
        <CardDescription>
          Trajetória da ISS no céu (visão do observador)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="max-w-full h-auto"
          >
            {/* Background */}
            <rect width={width} height={height} fill="transparent" />

            {/* Elevation circles */}
            {elevationCircles.map(elev => {
              const r = radius * (1 - elev / 90);
              return (
                <g key={elev}>
                  <circle
                    cx={centerX}
                    cy={centerY}
                    r={r}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={elev === 0 ? 2 : 1}
                    strokeDasharray={elev === 0 ? 'none' : '4 2'}
                    className="text-slate-300 dark:text-slate-700"
                  />
                  {elev > 0 && (
                    <text
                      x={centerX + 5}
                      y={centerY - r + 5}
                      fontSize="10"
                      className="fill-slate-500 dark:fill-slate-500"
                    >
                      {elev}°
                    </text>
                  )}
                </g>
              );
            })}

            {/* Azimuth lines (compass directions) */}
            {directions.map(dir => {
              const point = polarToCartesian(0, dir.angle);
              const labelPoint = polarToCartesian(-10, dir.angle);

              return (
                <g key={dir.label}>
                  <line
                    x1={centerX}
                    y1={centerY}
                    x2={point.x}
                    y2={point.y}
                    stroke="currentColor"
                    strokeWidth={dir.angle % 90 === 0 ? 1.5 : 0.5}
                    strokeDasharray="2 2"
                    className="text-slate-300 dark:text-slate-700"
                  />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    fontSize={dir.angle % 90 === 0 ? '14' : '12'}
                    fontWeight={dir.angle % 90 === 0 ? 'bold' : 'normal'}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-slate-700 dark:fill-slate-300"
                  >
                    {dir.label}
                  </text>
                </g>
              );
            })}

            {/* Zenith marker */}
            <circle
              cx={centerX}
              cy={centerY}
              r={3}
              fill="currentColor"
              className="text-slate-400 dark:text-slate-600"
            />
            <text
              x={centerX}
              y={centerY - 10}
              fontSize="10"
              textAnchor="middle"
              className="fill-slate-500 dark:fill-slate-500"
            >
              Zénite
            </text>

            {/* Pass trajectories */}
            {passPaths.map(({ path, color, startPoint, maxElevationPoint, index }) => (
              <g key={index}>
                {/* Path line */}
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.7}
                />

                {/* Start marker */}
                <circle
                  cx={startPoint.x}
                  cy={startPoint.y}
                  r={4}
                  fill={color}
                  stroke="white"
                  strokeWidth={1.5}
                />

                {/* Max elevation marker */}
                <circle
                  cx={maxElevationPoint.x}
                  cy={maxElevationPoint.y}
                  r={5}
                  fill={color}
                  stroke="white"
                  strokeWidth={2}
                  opacity={0.9}
                />
              </g>
            ))}

            {/* Current position marker (if satellite is overhead) */}
            {currentPosition && currentPosition.elevation > 0 && (
              <g>
                {(() => {
                  const pos = polarToCartesian(currentPosition.elevation, currentPosition.azimuth);
                  return (
                    <>
                      <circle
                        cx={pos.x}
                        cy={pos.y}
                        r={8}
                        fill="red"
                        stroke="white"
                        strokeWidth={2}
                        opacity={0.9}
                      >
                        <animate
                          attributeName="r"
                          values="8;12;8"
                          dur="1.5s"
                          repeatCount="indefinite"
                        />
                      </circle>
                      <text
                        x={pos.x}
                        y={pos.y - 15}
                        fontSize="12"
                        fontWeight="bold"
                        textAnchor="middle"
                        className="fill-red-600 dark:fill-red-400"
                      >
                        AGORA
                      </text>
                    </>
                  );
                })()}
              </g>
            )}
          </svg>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge variant="outline" className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full bg-green-500 mr-1"></span>
              Visível
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-500 mr-1"></span>
              Não Visível
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full border-2 border-current mr-1"></span>
              Início da Passagem
            </Badge>
            <Badge variant="outline" className="text-xs">
              <span className="inline-block w-3 h-3 rounded-full bg-current mr-1"></span>
              Elevação Máxima
            </Badge>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 text-center max-w-md">
            Mostra até 10 próximas passagens. O centro representa o zénite (diretamente acima),
            e o círculo externo representa o horizonte.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
