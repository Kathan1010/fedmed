import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  Trophy,
  TrendingDown,
  Cpu,
  HardDrive,
  Layers,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import MetricCard from '../components/MetricCard';
import { SkeletonCard } from '../components/LoadingSkeleton';
import { getMetrics, getStatus, getModelInfo } from '../api/client';
import { ThemeContext } from '../App';

function CustomBarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="custom-tooltip">
      <p className="text-gray-500 dark:text-zinc-400 text-xs font-medium mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-bold text-gray-900 dark:text-white">
          {(entry.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  );
}

export default function Results() {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(null);
  const [modelInfo, setModelInfo] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, statusRes] = await Promise.all([
        getMetrics(),
        getStatus(),
      ]);
      setMetrics(metricsRes.data);
      setStatus(statusRes.data);
      setError(null);

      try {
        const modelRes = await getModelInfo();
        setModelInfo(modelRes.data);
      } catch {
        // Model info not available yet
      }
      setLoading(false);
    } catch (err) {
      setError('Cannot connect to API backend.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const rounds = metrics?.rounds || [];
  const totalCompleted = metrics?.total_rounds_completed || 0;
  const totalRounds = status?.total_rounds || 10;
  const isCompleted = totalCompleted >= totalRounds && status?.status !== 'training';
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;

  const comparisonData = lastRound ? [
    { name: 'City General', accuracy: lastRound.client_accuracies?.[0] || 0 },
    { name: 'Metro Health', accuracy: lastRound.client_accuracies?.[1] || 0 },
    { name: 'Regional Med', accuracy: lastRound.client_accuracies?.[2] || 0 },
    { name: 'Global Avg', accuracy: lastRound.accuracy || 0 },
  ] : [];

  const barColorsDark = ['#525252', '#737373', '#a3a3a3', '#ffffff'];
  const barColorsLight = ['#3b82f6', '#14b8a6', '#8b5cf6', '#111827']; // Blue, Teal, Purple, Black for Global Avg
  const barColors = isDark ? barColorsDark : barColorsLight;

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Results</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Final model performance · Hospital comparison
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-white/10 px-5 py-3.5 rounded-xl flex items-center gap-3 text-sm shadow-sm">
          <AlertCircle size={16} className="text-gray-500 dark:text-zinc-400 shrink-0" />
          <p className="flex-1 font-medium text-gray-700 dark:text-zinc-300">{error}</p>
          <button onClick={fetchData} className="text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Not Completed State */}
      {!loading && !isCompleted && (
        <div className="glass-panel p-10 text-center opacity-0 animate-fade-in">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10">
              <Clock size={32} className="text-gray-900 dark:text-white" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Training Not Completed</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mb-6 max-w-md mx-auto">
            Results will be available once all {totalRounds} training rounds are completed. 
            Currently at round {totalCompleted}.
          </p>

          <div className="max-w-sm mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Progress</span>
              <span className="text-xs text-gray-500 dark:text-zinc-400 font-mono">
                {totalCompleted} / {totalRounds}
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden border border-gray-300 dark:border-white/5">
              <div
                className="h-full bg-gray-900 dark:bg-white rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                style={{ width: `${(totalCompleted / totalRounds) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Completed Results */}
      {!loading && isCompleted && (
        <>
          <div className="glass-panel p-5 border-gray-200 dark:border-white/20 opacity-0 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
                <CheckCircle2 size={18} className="text-gray-900 dark:text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-white">Training Complete</p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                  All {totalRounds} rounds finished · Global model ready
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard icon={Trophy} title="Final Accuracy" value={lastRound ? `${(lastRound.accuracy * 100).toFixed(1)}%` : '—'} subtitle="Global model" animationDelay={0} />
            <MetricCard icon={TrendingDown} title="Final Loss" value={lastRound ? lastRound.loss.toFixed(4) : '—'} subtitle="Converged value" animationDelay={80} />
            <MetricCard icon={Layers} title="Architecture" value={modelInfo?.architecture || '—'} subtitle={modelInfo ? `${modelInfo.total_parameters.toLocaleString()} params` : ''} animationDelay={160} />
            <MetricCard icon={HardDrive} title="Model Size" value={modelInfo?.model_size_kb ? `${modelInfo.model_size_kb} KB` : '—'} subtitle={modelInfo?.save_path || ''} animationDelay={240} />
          </div>

          {/* Hospital Comparison Bar Chart */}
          <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-200 mb-5 uppercase tracking-wider">
              Hospital vs. Global Performance
            </h3>
            {comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0,0,0,0.05)"} vertical={false} />
                  <XAxis dataKey="name" stroke={isDark ? "#525252" : "#d1d5db"} tick={{ fontSize: 11, fill: isDark ? '#a3a3a3' : '#6b7280' }} tickLine={false} axisLine={{ stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.1)' }} />
                  <YAxis domain={[0, 1]} stroke={isDark ? "#525252" : "#d1d5db"} tick={{ fontSize: 11, fill: isDark ? '#a3a3a3' : '#6b7280' }} tickLine={false} axisLine={false} width={45} />
                  <Tooltip content={<CustomBarTooltip />} />
                  <Bar dataKey="accuracy" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {comparisonData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={barColors[index]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-sm text-gray-500 dark:text-zinc-400">No data available</p>
              </div>
            )}
          </div>

          {/* Per-Round Accuracy Table */}
          {rounds.length > 0 && (
            <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-200 mb-5 uppercase tracking-wider">
                Training History
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/[0.1]">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Round</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Accuracy</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Loss</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Hosp 1</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Hosp 2</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 dark:text-zinc-500 uppercase tracking-wider">Hosp 3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rounds.map((round) => (
                      <tr key={round.round} className="border-b border-gray-100 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-400">{round.round}</td>
                        <td className="py-3 px-4 font-mono text-gray-900 dark:text-white font-medium">{(round.accuracy * 100).toFixed(1)}%</td>
                        <td className="py-3 px-4 font-mono text-gray-700 dark:text-zinc-300">{round.loss.toFixed(4)}</td>
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-400">{(round.client_accuracies?.[0] * 100)?.toFixed(1) ?? '—'}%</td>
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-400">{(round.client_accuracies?.[1] * 100)?.toFixed(1) ?? '—'}%</td>
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-zinc-400">{(round.client_accuracies?.[2] * 100)?.toFixed(1) ?? '—'}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Model Details */}
          {modelInfo && (
            <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
                  <Cpu size={18} className="text-gray-900 dark:text-white" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">Model Architecture</h3>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel-subtle p-4">
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">Architecture</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{modelInfo.architecture}</p>
                </div>
                <div className="glass-panel-subtle p-4">
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">Parameters</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{modelInfo.total_parameters.toLocaleString()}</p>
                </div>
                <div className="glass-panel-subtle p-4">
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">Model Size</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">{modelInfo.model_size_kb} KB</p>
                </div>
                <div className="glass-panel-subtle p-4">
                  <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-wider font-semibold mb-1">Save Path</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white font-mono truncate" title={modelInfo.save_path}>{modelInfo.save_path}</p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}
    </div>
  );
}
