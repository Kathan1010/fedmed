import React, { useState, useEffect, useCallback } from 'react';
import { 
  Hospital, 
  Server, 
  Network, 
  ShieldCheck, 
  AlertCircle, 
  RefreshCw,
  ArrowRight 
} from 'lucide-react';
import ClientCard from '../components/ClientCard';
import SystemHealthMonitor from '../components/SystemHealthMonitor';
import { SkeletonClientCard } from '../components/LoadingSkeleton';
import { getMetrics, getStatus } from '../api/client';

export default function Clients() {
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
  const lastRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const totalRounds = status?.total_rounds || 10;
  const totalCompleted = metrics?.total_rounds_completed || 0;

  const getClientStatus = () => {
    if (totalCompleted >= totalRounds && status?.status !== 'training') return 'completed';
    if (status?.status === 'training' || totalCompleted > 0) return 'training';
    return 'idle';
  };

  const clientStatus = getClientStatus();

  return (
    <div className="space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Hospital Nodes</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Federated network topology · 3 participating institutions
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

      {/* Network Topology Visualization */}
      <div className="glass-panel p-6 opacity-0 animate-fade-in">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
            <Network size={18} className="text-gray-900 dark:text-white" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Network Topology</h2>
            <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
              Federated Averaging Protocol · {status?.status === 'training' ? 'Active' : 'Standby'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-6">
          {/* Hospital Nodes */}
          <div className="flex flex-col items-center gap-3">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-300 ${
                  clientStatus === 'training'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-white/30 dark:bg-white/10 dark:text-white'
                    : clientStatus === 'completed'
                      ? 'border-gray-400 bg-gray-50 text-gray-700 dark:border-zinc-400/30 dark:bg-zinc-400/10 dark:text-zinc-200'
                      : 'border-gray-200 bg-white text-gray-500 dark:border-white/[0.06] dark:bg-zinc-900/60 dark:text-zinc-500'
                }`}
              >
                <Hospital size={14} />
                Hospital {i + 1}
              </div>
            ))}
          </div>

          {/* Connection Arrows */}
          <div className="flex flex-col items-center gap-3 px-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <div className={`w-12 h-px ${clientStatus === 'training' ? 'bg-blue-600 dark:bg-white/50' : 'bg-gray-300 dark:bg-zinc-700'}`} />
                <ArrowRight size={12} className={clientStatus === 'training' ? 'text-blue-600 dark:text-white' : 'text-gray-300 dark:text-zinc-700'} />
              </div>
            ))}
          </div>

          {/* Central Server */}
          <div className={`flex flex-col items-center gap-2 px-6 py-4 rounded-xl border transition-all duration-300 ${
            clientStatus === 'training'
              ? 'border-blue-600 bg-blue-50 dark:border-white/30 dark:bg-white/5'
              : clientStatus === 'completed'
                ? 'border-gray-400 bg-gray-50 dark:border-zinc-400/30 dark:bg-zinc-400/5'
                : 'border-gray-200 bg-white dark:border-white/[0.06] dark:bg-zinc-900/60'
          }`}>
            <Server size={24} className={
              clientStatus === 'training' ? 'text-blue-600 dark:text-white' : clientStatus === 'completed' ? 'text-gray-700 dark:text-zinc-200' : 'text-gray-400 dark:text-zinc-500'
            } />
            <span className="text-xs font-bold text-gray-900 dark:text-zinc-100">Aggregator</span>
            <span className="text-[10px] text-gray-500 dark:text-zinc-500">FedAvg</span>
          </div>

          {/* Return Arrows */}
          <div className="flex flex-col items-center gap-3 px-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-1">
                <ArrowRight size={12} className={`rotate-180 ${clientStatus === 'training' ? 'text-blue-600 dark:text-white' : 'text-gray-300 dark:text-zinc-700'}`} />
                <div className={`w-12 h-px ${clientStatus === 'training' ? 'bg-blue-600 dark:bg-white/50' : 'bg-gray-300 dark:bg-zinc-700'}`} />
              </div>
            ))}
          </div>

          {/* Updated Models */}
          <div className="flex flex-col items-center gap-3">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition-all duration-300 ${
                  clientStatus === 'training'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:border-white/30 dark:bg-white/10 dark:text-white'
                    : clientStatus === 'completed'
                      ? 'border-gray-400 bg-gray-50 text-gray-700 dark:border-zinc-400/30 dark:bg-zinc-400/10 dark:text-zinc-200'
                      : 'border-gray-200 bg-white text-gray-500 dark:border-white/[0.06] dark:bg-zinc-900/60 dark:text-zinc-500'
                }`}
              >
                <ShieldCheck size={14} />
                Updated
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-gray-500 dark:text-zinc-500 font-medium uppercase tracking-widest mt-2">
          Weights flow → Aggregation → Updated model returned
        </p>
      </div>

      {/* Hospital Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SkeletonClientCard />
          <SkeletonClientCard />
          <SkeletonClientCard />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <ClientCard
              key={i}
              clientIndex={i}
              status={clientStatus}
              accuracy={lastRound?.client_accuracies?.[i] ?? null}
              dataType={status?.status === 'training' ? 'active' : 'imaging'}
              animationDelay={i * 100}
            />
          ))}
        </div>
      )}

      {/* System Health Monitor */}
      {!loading && (
        <SystemHealthMonitor isTraining={status?.status === 'training'} />
      )}
    </div>
  );
}
