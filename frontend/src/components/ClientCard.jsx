import React from 'react';
import { Hospital, Wifi, WifiOff } from 'lucide-react';
import StatusBadge from './StatusBadge';

const hospitalMeta = [
  { name: 'City General Hospital', location: 'Node A' },
  { name: 'Metro Health Center', location: 'Node B' },
  { name: 'Regional Medical Institute', location: 'Node C' },
];

export default function ClientCard({
  clientIndex = 0,
  status = 'idle',
  accuracy = null,
  dataType = 'imaging',
  animationDelay = 0,
}) {
  const meta = hospitalMeta[clientIndex] || hospitalMeta[0];
  const isConnected = status === 'training';
  const accuracyPct = accuracy !== null ? (accuracy * 100).toFixed(1) : null;

  return (
    <div 
      className={`card-interactive p-6 opacity-0 animate-fade-in`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-zinc-200 border border-gray-200 dark:border-white/10`}>
            <Hospital size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-zinc-100">{meta.name}</h3>
            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">{meta.location}</p>
          </div>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Accuracy */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold uppercase tracking-wider">Local Accuracy</p>
          <p className="text-lg font-bold text-gray-900 dark:text-zinc-50">
            {accuracyPct !== null ? `${accuracyPct}%` : '—'}
          </p>
        </div>
        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-zinc-800 border border-gray-300 dark:border-white/5">
          <div 
            className="h-full rounded-full bg-blue-600 dark:bg-white transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.4)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"
            style={{ width: accuracyPct !== null ? `${accuracyPct}%` : '0%' }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-white/[0.06]">
        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium capitalize">
          {dataType} Data
        </p>
        <div className="flex items-center gap-1.5">
          {isConnected ? (
            <>
              <Wifi size={12} className="text-green-600 dark:text-white" />
              <span className="text-xs text-green-700 dark:text-white font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff size={12} className="text-gray-400 dark:text-zinc-500" />
              <span className="text-xs text-gray-400 dark:text-zinc-500 font-medium">Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
