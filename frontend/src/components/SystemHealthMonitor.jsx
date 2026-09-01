import React, { useState, useEffect, useContext } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { ThemeContext } from '../App';
import { Activity } from 'lucide-react';

const generateInitialData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    time: i,
    nodeA: Math.floor(Math.random() * 10) + 5, // Idle CPU %
    nodeB: Math.floor(Math.random() * 10) + 5,
    nodeC: Math.floor(Math.random() * 10) + 5,
  }));
};

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="custom-tooltip">
      <p className="text-gray-500 dark:text-zinc-400 text-xs font-medium mb-2">T - {30 - label}s</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-sm font-medium text-gray-700 dark:text-zinc-300 capitalize">{entry.name}</span>
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">{entry.value}%</span>
        </div>
      ))}
    </div>
  );
}

export default function SystemHealthMonitor({ isTraining }) {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';
  const [data, setData] = useState(generateInitialData());

  useEffect(() => {
    let tick = 30;
    const interval = setInterval(() => {
      setData(prevData => {
        const newData = [...prevData.slice(1)];
        
        // If training, spike CPU/GPU utilization to 60-95%, else drop to 5-15%
        const baseMin = isTraining ? 60 : 5;
        const variance = isTraining ? 35 : 10;
        
        newData.push({
          time: tick++,
          nodeA: Math.floor(Math.random() * variance) + baseMin,
          nodeB: Math.floor(Math.random() * (variance * 0.8)) + baseMin + 5,
          nodeC: Math.floor(Math.random() * variance) + (baseMin * 0.9),
        });
        return newData;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTraining]);

  const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
  const axisColor = isDark ? '#525252' : '#d1d5db';
  const tickColor = isDark ? '#a3a3a3' : '#6b7280';

  const colorA = isDark ? '#ffffff' : '#3b82f6'; // White in dark mode, Blue in light
  const colorB = isDark ? '#a3a3a3' : '#14b8a6'; // Gray in dark mode, Teal in light
  const colorC = isDark ? '#525252' : '#8b5cf6'; // Dark gray in dark mode, Purple in light

  return (
    <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
            <Activity size={18} className="text-gray-900 dark:text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Hospital Node Compute Utilization</h3>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
              Real-time CPU/GPU Load Monitoring
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900">
          <span className={`w-2 h-2 rounded-full ${isTraining ? 'bg-gray-900 dark:bg-white animate-pulse' : 'bg-gray-400 dark:bg-zinc-600'}`} />
          <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">
            {isTraining ? 'Training Load Active' : 'System Idle'}
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorA} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorA} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorB} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorB} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradC" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorC} stopOpacity={0.2} />
              <stop offset="95%" stopColor={colorC} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis 
            dataKey="time" 
            stroke={axisColor} 
            tick={false} 
            axisLine={{ stroke: gridColor }} 
          />
          <YAxis 
            domain={[0, 100]} 
            stroke={axisColor} 
            tick={{ fontSize: 11, fill: tickColor }} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `${val}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            formatter={(value) => <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{value}</span>}
          />
          <Area type="monotone" dataKey="nodeA" name="City General" stroke={colorA} fill="url(#gradA)" strokeWidth={2} isAnimationActive={false} />
          <Area type="monotone" dataKey="nodeB" name="Metro Health" stroke={colorB} fill="url(#gradB)" strokeWidth={2} isAnimationActive={false} />
          <Area type="monotone" dataKey="nodeC" name="Regional Med" stroke={colorC} fill="url(#gradC)" strokeWidth={2} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
