import React, { useState, useEffect } from 'react';
import { Lock, Database, ShieldCheck, Network, Cpu } from 'lucide-react';

export default function PrivacyInspector({ isRunning, currentRound, dataType }) {
  const [logs, setLogs] = useState([]);
  
  // Dynamic dataset info
  const getDatasetInfo = () => {
    switch(dataType) {
      case 'imaging':
        return {
          params: '42,154',
          size: '~675 KB',
          dataPreview: 'Pixel Array: [255, 128, 64, ...]',
          dataTypeName: 'Blood Microscopy Images'
        };
      case 'ehr':
        return {
          params: '4,322',
          size: '~214 KB',
          dataPreview: 'age:45, sex:1, cp:3, trestbps:130...',
          dataTypeName: 'Heart Disease Records'
        };
      case 'lab':
        return {
          params: '6,432',
          size: '~310 KB',
          dataPreview: 'radius_mean:17.99, texture_mean:10.38...',
          dataTypeName: 'Breast Cancer Labs'
        };
      case 'genomic':
        return {
          params: '124,500',
          size: '~1.2 MB',
          dataPreview: 'Sequence: ATGCGTACGTAGCTAGCTA...',
          dataTypeName: 'Genomic Sequences'
        };
      case 'wearable':
        return {
          params: '25,600',
          size: '~450 KB',
          dataPreview: 'Time Series: HR:72, SpO2:98, Temp:36.5...',
          dataTypeName: 'Sensor Time Series'
        };
      default:
        return {
          params: '4,322',
          size: '~214 KB',
          dataPreview: 'age:45, sex:1, cp:3, trestbps:130...',
          dataTypeName: 'Patient Data'
        };
    }
  };

  const info = getDatasetInfo();

  // Generate random looking math tensors for the sniffer
  const generateTensor = () => {
    return `[${(Math.random() * 2 - 1).toFixed(4)}, ${(Math.random() * 2 - 1).toFixed(4)}, ${(Math.random() * 2 - 1).toFixed(4)}, ...]`;
  };

  useEffect(() => {
    if (isRunning) {
      if (currentRound === 0) {
        setLogs([`[SYSTEM] Waiting for Round 1 to complete...`]);
      } else {
        const tensorStr = generateTensor();
        const newLog = `[Round ${currentRound}] TX: ModelWeights.pt | Size: ${info.size} | Payload: ${tensorStr}`;
        setLogs(prev => {
          const updated = [...prev, newLog];
          return updated.slice(-4); // Keep last 4 logs
        });
      }
    } else {
      setLogs([`[SYSTEM] Network idle. Connection securely closed.`]);
    }
  }, [isRunning, currentRound, dataType]);

  return (
    <div className="glass-panel rounded-2xl p-6 mt-6 border border-brand-500/50 shadow-[0_0_20px_rgba(20,184,166,0.1)]">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-brand-400" size={28} />
        <h3 className="text-xl font-semibold text-gray-100">Live Privacy & Network Inspector</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Left: Local Hospital */}
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Database size={24} className="text-red-400" />
              <span className="font-semibold">Local Hard Drive</span>
            </div>
            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-1 rounded font-bold flex items-center gap-1">
              <Lock size={12} /> LOCKED
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="bg-dark-900 rounded p-3 font-mono text-sm border border-gray-700/50">
              <p className="text-gray-400 mb-1">{info.dataTypeName}</p>
              <p className="text-red-400 text-xs break-all opacity-75">
                {info.dataPreview}
              </p>
            </div>
            <p className="text-xs text-gray-500 text-center uppercase tracking-wider font-bold">
              Never Transmitted
            </p>
          </div>
        </div>

        {/* Middle: Network Interceptor */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-brand-400 font-bold tracking-widest uppercase text-sm">
            TLS Encrypted Network
          </div>
          
          <div className="w-full relative h-12 flex items-center justify-center">
            {/* Animated network line */}
            <div className="absolute w-full h-[2px] bg-gray-700"></div>
            {isRunning && (
              <div className="absolute w-1/2 h-[2px] bg-brand-500 animate-[slide-right_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(20,184,166,1)]"></div>
            )}
            
            <div className={`relative z-10 bg-dark-900 p-2 rounded-full border ${isRunning ? 'border-brand-500 text-brand-400 animate-pulse' : 'border-gray-600 text-gray-600'}`}>
              <Network size={24} />
            </div>
          </div>
          
          {/* Packet Sniffer Terminal */}
          <div className="w-full bg-[#0a0a0a] rounded-lg p-3 border border-gray-800 h-32 overflow-hidden shadow-inner relative">
            <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10"></div>
            <div className="text-[10px] sm:text-xs font-mono text-brand-500 flex flex-col justify-end h-full">
              {logs.map((log, i) => (
                <div key={i} className="mb-1 opacity-80 hover:opacity-100 transition-opacity">
                  <span className="text-gray-500 mr-2">{'>'}</span>
                  {log}
                </div>
              ))}
              {isRunning && (
                <div className="animate-pulse text-brand-500">_</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Central Server */}
        <div className="bg-dark-800 rounded-xl p-5 border border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3 text-gray-300">
              <Cpu size={24} className="text-blue-400" />
              <span className="font-semibold">Central Server</span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="bg-dark-900 rounded p-3 font-mono text-sm border border-gray-700/50">
              <p className="text-gray-400 mb-1">Aggregated Weights</p>
              <p className="text-blue-400 text-xs break-all opacity-75">
                PyTorch StateDict<br/>
                Param Count: {info.params}<br/>
                Size: {info.size}
              </p>
            </div>
            <p className="text-xs text-blue-500 text-center uppercase tracking-wider font-bold">
              Mathematical Averaging
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
