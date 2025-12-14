"use client";

import * as React from "react";
import {
  Area,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { LOSPoint, LOSStatus } from "@/lib/line-of-sight";

interface ElevationProfileProps {
  points: LOSPoint[];
  status: LOSStatus;
}

interface ChartDataPoint {
  distance: number;
  terrain: number;
  los: number;
  fresnelUpper: number;
  fresnelLower: number;
  clearance: number;
}

export default function ElevationProfile({
  points,
  status,
}: ElevationProfileProps) {
  // Transform data for chart
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    return points.map((point) => ({
      distance: point.distance,
      terrain: point.elevation,
      los: point.losElevation,
      fresnelUpper: point.losElevation + point.fresnelRadius,
      fresnelLower: point.losElevation - point.fresnelRadius,
      clearance: point.clearance,
    }));
  }, [points]);

  // Calculate Y-axis domain with padding
  const [minElev, maxElev] = React.useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    let min = Infinity;
    let max = -Infinity;

    chartData.forEach((point) => {
      min = Math.min(min, point.terrain, point.fresnelLower);
      max = Math.max(max, point.terrain, point.fresnelUpper, point.los);
    });

    const padding = (max - min) * 0.1;
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [chartData]);

  // Status colors
  const statusColors = {
    clear: {
      los: "#22c55e",
      fresnel: "rgba(34, 197, 94, 0.2)",
      terrain: "#64748b",
    },
    marginal: {
      los: "#eab308",
      fresnel: "rgba(234, 179, 8, 0.2)",
      terrain: "#64748b",
    },
    blocked: {
      los: "#ef4444",
      fresnel: "rgba(239, 68, 68, 0.2)",
      terrain: "#64748b",
    },
  };

  const colors = statusColors[status];

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey="distance"
            tickFormatter={(value) => `${value.toFixed(1)}`}
            tick={{ fontSize: 12 }}
            label={{
              value: "km",
              position: "insideBottomRight",
              offset: -5,
              fontSize: 12,
            }}
          />
          <YAxis
            domain={[minElev, maxElev]}
            tickFormatter={(value) => `${value}`}
            tick={{ fontSize: 12 }}
            label={{
              value: "m",
              angle: -90,
              position: "insideLeft",
              fontSize: 12,
            }}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload as ChartDataPoint;
              return (
                <div className="bg-background border rounded-lg shadow-lg p-3 text-sm">
                  <div className="font-medium mb-1">
                    {data.distance.toFixed(2)} km
                  </div>
                  <div className="space-y-1 text-muted-foreground">
                    <div>Terreno: {data.terrain.toFixed(0)} m</div>
                    <div>LOS: {data.los.toFixed(0)} m</div>
                    <div
                      className={
                        data.clearance >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      Folga: {data.clearance.toFixed(0)} m
                    </div>
                  </div>
                </div>
              );
            }}
          />

          {/* Fresnel zone area */}
          <Area
            type="monotone"
            dataKey="fresnelUpper"
            stroke="none"
            fill={colors.fresnel}
            fillOpacity={1}
          />
          <Area
            type="monotone"
            dataKey="fresnelLower"
            stroke="none"
            fill="var(--background)"
            fillOpacity={1}
          />

          {/* Terrain fill */}
          <Area
            type="monotone"
            dataKey="terrain"
            stroke={colors.terrain}
            strokeWidth={2}
            fill="url(#terrainGradient)"
            fillOpacity={0.6}
          />

          {/* LOS line */}
          <Line
            type="monotone"
            dataKey="los"
            stroke={colors.los}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />

          {/* Start and end markers */}
          <ReferenceLine
            x={chartData[0]?.distance}
            stroke="#3b82f6"
            strokeWidth={2}
          />
          <ReferenceLine
            x={chartData[chartData.length - 1]?.distance}
            stroke="#3b82f6"
            strokeWidth={2}
          />

          {/* Gradient definitions */}
          <defs>
            <linearGradient id="terrainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#64748b" stopOpacity={0.1} />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
