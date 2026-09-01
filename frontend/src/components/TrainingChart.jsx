import React, { useContext } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { ThemeContext } from '../App';

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0]?.value;
  const displayValue = formatter ? formatter(value) : value?.toFixed(4);

  return (
    <div className="custom-tooltip">
      <p className="text-gray-500 dark:text-zinc-400 text-xs font-medium mb-1">Round {label}</p>
      <p className="text-gray-900 dark:text-white text-sm font-bold">{displayValue}</p>
    </div>
  );
}

export default function TrainingChart({
  data = [],
  dataKey = 'accuracy',
  title = '',
  yDomain = [0, 1],
  formatter,
  height = 280,
}) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const gradientId = `gradient-${dataKey}-${isDark ? 'dark' : 'light'}`;

  const strokeColor = isDark ? '#ffffff' : '#3b82f6'; // Blue in light mode
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const axisColor = isDark ? '#525252' : '#d1d5db';
  const tickColor = isDark ? '#a3a3a3' : '#6b7280';

  return (
    <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
      {title && (
        <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-200 mb-5 uppercase tracking-wider">{title}</h3>
      )}

      {data.length === 0 ? (
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="text-center">
            <div className="flex justify-center gap-1 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-dot-pulse" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-dot-pulse" style={{ animationDelay: '200ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-zinc-500 animate-dot-pulse" style={{ animationDelay: '400ms' }} />
            </div>
            <p className="text-sm text-gray-500 dark:text-zinc-400 font-medium">Awaiting network data…</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'} />
                <stop offset="100%" stopColor={isDark ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)'} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={gridColor}
              vertical={false}
            />
            <XAxis
              dataKey="round"
              stroke={axisColor}
              tick={{ fontSize: 11, fill: tickColor }}
              tickLine={false}
              axisLine={{ stroke: gridColor }}
            />
            <YAxis
              domain={yDomain}
              stroke={axisColor}
              tick={{ fontSize: 11, fill: tickColor }}
              tickLine={false}
              axisLine={false}
              width={45}
            />
            <Tooltip content={<CustomTooltip formatter={formatter} />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: strokeColor, strokeWidth: 2, stroke: isDark ? '#000000' : '#ffffff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
