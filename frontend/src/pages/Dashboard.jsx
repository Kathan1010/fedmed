import React, { useState, useEffect, useCallback } from 'react';
import { 
  Target, 
  TrendingDown, 
  RotateCcw, 
  Hospital, 
  Play, 
  Square, 
  AlertCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import TrainingChart from '../components/TrainingChart';
import PrivacyInspector from '../components/PrivacyInspector';
import DataDistributionCharts from '../components/DataDistributionCharts';
import { SkeletonCard, SkeletonChart } from '../components/LoadingSkeleton';
import { getMetrics, getStatus, startTraining, stopTraining } from '../api/client';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(null);
  const [dataType, setDataType] = useState('imaging');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [metricsRes, statusRes] = await Promise.all([
        getMetrics(),
        getStatus(),
      ]);
      setMetrics(metricsRes.data);
      setStatus(statusRes.data);
      setError(null);
      setLoading(false);
    } catch (err) {
      setError('Cannot connect to API backend. Ensure it is running on port 8000.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await startTraining(dataType);
      setError(null);
      await fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to start training');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStop = async () => {
    setActionLoading(true);
    try {
      await stopTraining();
      setError(null);
      await fetchData();
    } catch (err) {
      setError('Failed to stop training');
    } finally {
      setActionLoading(false);
    }
  };

  const isTraining = status?.status === 'training';
  const isCompleted = status?.status === 'completed';
  const rounds = metrics?.rounds || [];
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const currentAccuracy = metrics?.current_accuracy;
  const currentLoss = metrics?.current_loss;
  const totalRoundsCompleted = metrics?.total_rounds_completed || 0;
  const totalRounds = status?.total_rounds || 10;
  const connectedClients = status?.connected_clients || 0;

  const dataTypeLabels = {
    imaging: 'Blood Microscopy Images',
    ehr: 'Heart Disease EHR',
    lab: 'Breast Cancer Labs',
    genomic: 'Genomic Sequences',
    wearable: 'Wearable Sensor Data',
  };

  return (
    <div className="space-y-6">

      {/* Page Header + Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Federated learning training overview · Real-time monitoring
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            disabled={isTraining}
            className="bg-white dark:bg-zinc-900 border border-gray-300 dark:border-white/[0.1] rounded-xl px-4 py-2.5 text-sm text-gray-900 dark:text-zinc-200 outline-none focus:border-gray-400 dark:focus:border-white/30 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {Object.entries(dataTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {!isTraining ? (
            <button
              onClick={handleStart}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play size={16} fill="currentColor" />
              {actionLoading ? 'Starting...' : 'Start Training'}
            </button>
          ) : (
            <button
              onClick={handleStop}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 px-5 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-500 transition-all duration-300 disabled:opacity-50"
            >
              <Square size={14} fill="currentColor" />
              {actionLoading ? 'Stopping...' : 'Stop Training'}
            </button>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 px-5 py-3.5 rounded-xl flex items-center gap-3 text-sm shadow-sm">
          <AlertCircle size={16} className="text-red-500 dark:text-red-400 shrink-0" />
          <p className="flex-1 font-medium text-red-800 dark:text-red-300">{error}</p>
          <button onClick={fetchData} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            icon={Target}
            title="Accuracy"
            value={currentAccuracy !== null && currentAccuracy !== undefined ? `${(currentAccuracy * 100).toFixed(1)}%` : '—'}
            subtitle={isTraining ? 'Improving…' : isCompleted ? 'Final result' : 'Not started'}
            animationDelay={0}
            iconColor="text-blue-600 dark:text-white"
          />
          <MetricCard
            icon={TrendingDown}
            title="Loss"
            value={currentLoss !== null && currentLoss !== undefined ? currentLoss.toFixed(4) : '—'}
            subtitle={isTraining ? 'Converging…' : isCompleted ? 'Final result' : 'Not started'}
            animationDelay={80}
            iconColor="text-teal-600 dark:text-white"
          />
          <MetricCard
            icon={RotateCcw}
            title="Rounds"
            value={`${totalRoundsCompleted} / ${totalRounds}`}
            subtitle={isTraining ? 'In progress' : isCompleted ? 'All completed' : 'Awaiting start'}
            animationDelay={160}
            iconColor="text-purple-600 dark:text-white"
          />
          <MetricCard
            icon={Hospital}
            title="Hospitals"
            value={connectedClients > 0 ? `${connectedClients} Active` : '0'}
            subtitle="Participating nodes"
            animationDelay={240}
            iconColor="text-indigo-600 dark:text-white"
          />
        </div>
      )}

      {/* Training Completion Indicator */}
      {isTraining && totalRoundsCompleted > 0 && (
        <div className="glass-panel p-4 opacity-0 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-blue-600 dark:text-white" />
              <span className="text-xs text-blue-800 dark:text-zinc-300 font-semibold uppercase tracking-wider">Training Progress</span>
            </div>
            <span className="text-xs text-blue-800 dark:text-zinc-300 font-mono">
              {Math.round((totalRoundsCompleted / totalRounds) * 100)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-blue-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-blue-200 dark:border-white/5">
            <div 
              className="h-full bg-blue-600 dark:bg-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.4)] dark:shadow-[0_0_10px_rgba(255,255,255,0.8)]"
              style={{ width: `${(totalRoundsCompleted / totalRounds) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Charts */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart /><SkeletonChart />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrainingChart
            data={rounds}
            dataKey="accuracy"
            title="Global Model Accuracy"
            yDomain={[0, 1]}
            formatter={(v) => `${(v * 100).toFixed(1)}%`}
          />
          <TrainingChart
            data={rounds}
            dataKey="loss"
            title="Training Loss"
            yDomain={['auto', 'auto']}
            formatter={(v) => v?.toFixed(4)}
          />
        </div>
      )}

      {/* Data Distribution Charts */}
      {!loading && (
        <DataDistributionCharts />
      )}

      {/* Privacy Inspector */}
      {!loading && (
        <PrivacyInspector
          isRunning={isTraining}
          currentRound={lastRound?.round || 0}
          dataType={dataType}
        />
      )}
    </div>
  );
}
