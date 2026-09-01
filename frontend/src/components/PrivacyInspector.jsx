import React, { useState, useEffect } from 'react';
import { Lock, Database, ShieldCheck, Network, Cpu, ArrowRight } from 'lucide-react';

const datasetInfo = {
  imaging: {
    params: '42,154',
    size: '~675 KB',
    dataPreview: 'Pixel Array: [255, 128, 64, ...]',
    dataTypeName: 'Blood Microscopy Images',
  },
  ehr: {
    params: '4,322',
    size: '~214 KB',
    dataPreview: 'age:45, sex:1, cp:3, trestbps:130...',
    dataTypeName: 'Heart Disease Records',
  },
  lab: {
    params: '6,432',
    size: '~310 KB',
    dataPreview: 'radius_mean:17.99, texture_mean:10.38...',
    dataTypeName: 'Breast Cancer Labs',
  },
  genomic: {
    params: '124,500',
    size: '~1.2 MB',
    dataPreview: 'Sequence: ATGCGTACGTAGCTAGCTA...',
    dataTypeName: 'Genomic Sequences',
  },
  wearable: {
    params: '25,600',
    size: '~450 KB',
    dataPreview: 'Time Series: HR:72, SpO2:98, Temp:36.5...',
    dataTypeName: 'Sensor Time Series',
  },
};

function generateTensor() {
  return `[${(Math.random() * 2 - 1).toFixed(4)}, ${(Math.random() * 2 - 1).toFixed(4)}, ${(Math.random() * 2 - 1).toFixed(4)}, ...]`;
}

export default function PrivacyInspector({ isRunning, currentRound, dataType }) {
  const [logs, setLogs] = useState([]);
  const info = datasetInfo[dataType] || datasetInfo.imaging;

  useEffect(() => {
    if (isRunning) {
      if (currentRound === 0) {
        setLogs(['[SYSTEM] Initializing secure channel...']);
      } else {
        const tensor = generateTensor();
        const newLog = `[R${currentRound}] TX: Weights.pt | ${info.size} | ${tensor}`;
        setLogs(prev => [...prev, newLog].slice(-5));
      }
    } else {
      setLogs(['[SYSTEM] Network idle. Secure connection closed.']);
    }
  }, [isRunning, currentRound, dataType]);

  return (
    <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-white/10">
          <ShieldCheck size={18} className="text-gray-900 dark:text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Privacy & Network Inspector</h3>
          <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">End-to-end encrypted · No raw data transmitted</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-stretch">

        {/* Left: Local Hospital Data */}
        <div className="glass-panel-subtle p-5 relative overflow-hidden border-t-2 border-t-gray-400 dark:border-t-zinc-500">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white">
              <Database size={18} className="text-gray-500 dark:text-zinc-300" />
              <span className="text-sm font-bold">Local Data Store</span>
            </div>
            <span className="bg-white dark:bg-zinc-800 text-gray-500 dark:text-zinc-300 border border-gray-200 dark:border-white/5 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
              <Lock size={10} /> LOCKED
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-3 font-mono text-xs border border-gray-200 dark:border-white/[0.04] mb-3">
            <p className="text-gray-400 dark:text-zinc-500 mb-1 text-[10px] uppercase tracking-wider">{info.dataTypeName}</p>
            <p className="text-gray-700 dark:text-zinc-300 break-all leading-relaxed">{info.dataPreview}</p>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-zinc-500 text-center uppercase tracking-widest font-bold">
            → Never Leaves This Node
          </p>
        </div>

        {/* Middle: Network Channel */}
        <div className="flex flex-col items-center justify-center lg:w-48 py-4">
          <p className="text-[10px] text-gray-500 dark:text-zinc-300 font-bold tracking-widest uppercase mb-4">
            TLS 1.3 Encrypted
          </p>

          {/* Connection Line */}
          <div className="w-full relative h-8 flex items-center justify-center mb-4">
            <div className="absolute w-full h-px bg-gray-300 dark:bg-zinc-800" />
            {isRunning && (
              <div className="absolute w-1/2 h-px bg-gray-900 dark:bg-white animate-slide-right shadow-[0_0_8px_rgba(0,0,0,0.4)] dark:shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            )}
            <div className={`relative z-10 bg-white dark:bg-zinc-950 p-2 rounded-full border ${
              isRunning ? 'border-gray-900 text-gray-900 dark:border-white dark:text-white' : 'border-gray-300 text-gray-400 dark:border-zinc-800 dark:text-zinc-600'
            }`}>
              <Network size={16} />
            </div>
          </div>

          {/* Packet Sniffer Terminal */}
          <div className="w-full bg-zinc-950 dark:bg-black rounded-lg p-3 border border-gray-200 dark:border-white/5 h-28 overflow-hidden font-mono relative">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-zinc-950 dark:from-black to-transparent z-10" />
            <div className="text-[10px] text-zinc-400 flex flex-col justify-end h-full">
              {logs.map((log, i) => (
                <div key={i} className="mb-0.5 opacity-70 hover:opacity-100 transition-opacity">
                  <span className="text-zinc-600 mr-1">❯</span>
                  {log}
                </div>
              ))}
              {isRunning && <div className="animate-pulse text-white">_</div>}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <ArrowRight size={10} className="text-gray-400 dark:text-zinc-500" />
            <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium">Weights Only</p>
          </div>
        </div>

        {/* Right: Central Server */}
        <div className="glass-panel-subtle p-5 relative overflow-hidden border-t-2 border-t-gray-700 dark:border-t-zinc-200">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2.5 text-gray-900 dark:text-white">
              <Cpu size={18} className="text-gray-700 dark:text-zinc-200" />
              <span className="text-sm font-bold">Aggregation Server</span>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-lg p-3 font-mono text-xs border border-gray-200 dark:border-white/[0.04] mb-3">
            <p className="text-gray-400 dark:text-zinc-500 mb-1 text-[10px] uppercase tracking-wider">Aggregated Weights</p>
            <p className="text-gray-700 dark:text-zinc-300 break-all leading-relaxed">
              PyTorch StateDict<br />
              Params: {info.params}<br />
              Size: {info.size}
            </p>
          </div>

          <p className="text-[10px] text-gray-500 dark:text-zinc-400 text-center uppercase tracking-widest font-bold">
            FedAvg Aggregation
          </p>
        </div>
      </div>
    </div>
  );
}
