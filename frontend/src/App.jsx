import React, { useState, useEffect } from 'react';
import { Activity, Play, Square, Server, HardDrive, Shield } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { flApi } from './api/client';
import PrivacyInspector from './PrivacyInspector';

export default function App() {
  const [isRunning, setIsRunning] = useState(false);
  const [dataType, setDataType] = useState('imaging');
  const [metrics, setMetrics] = useState([]);
  const [error, setError] = useState(null);

  // Poll status and metrics
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const status = await flApi.getStatus();
        setIsRunning(status);
        
        const metricsData = await flApi.getMetrics();
        if (metricsData && metricsData.rounds) {
          setMetrics(metricsData.rounds);
        }
        setError(null);
      } catch (err) {
        setError("Cannot connect to API backend. Ensure it is running on port 8000.");
        setIsRunning(false);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, []);

  const handleStart = async () => {
    try {
      await flApi.startTraining(dataType);
      setIsRunning(true);
      setMetrics([]); // clear old metrics
      setError(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to start training");
    }
  };

  const handleStop = async () => {
    try {
      await flApi.stopTraining();
      setIsRunning(false);
    } catch (err) {
      setError("Failed to stop training");
    }
  };

  return (
    <div className="min-h-screen bg-dark-900 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-brand-400 to-blue-500 bg-clip-text text-transparent">
              FedMed Analytics
            </h1>
            <p className="text-gray-400 mt-2">Privacy-Preserving Distributed Healthcare AI</p>
          </div>
          
          <div className="flex gap-4">
            <select 
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              disabled={isRunning}
              className="bg-dark-800 border border-gray-700 rounded-lg px-4 py-2 text-gray-200 outline-none focus:border-brand-500 transition-colors"
            >
              <option value="imaging">Blood Microscopy Images</option>
              <option value="ehr">Heart Disease EHR</option>
              <option value="lab">Breast Cancer Labs</option>
              <option value="genomic">Genomic Sequences</option>
              <option value="wearable">Wearable Sensor Data</option>
            </select>
            
            {!isRunning ? (
              <button 
                onClick={handleStart}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 px-6 py-2 rounded-lg font-semibold transition-all hover:shadow-[0_0_15px_rgba(20,184,166,0.4)]"
              >
                <Play size={20} /> Start Federated Training
              </button>
            ) : (
              <button 
                onClick={handleStop}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-2 rounded-lg font-semibold transition-all shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              >
                <Square size={20} /> Stop Training
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-3">
            <Shield className="text-red-400" />
            {error}
          </div>
        )}

        {/* Top Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isRunning ? 'bg-brand-500/20 text-brand-400' : 'bg-gray-800 text-gray-500'}`}>
                <Activity size={24} className={isRunning ? 'animate-pulse' : ''} />
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">System Status</p>
                <p className="text-2xl font-semibold">{isRunning ? 'Training Active' : 'Idle'}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                <Server size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">Current Round</p>
                <p className="text-2xl font-semibold">
                  {metrics.length > 0 ? `${metrics[metrics.length - 1].round} / 10` : '0 / 10'}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-500/20 text-purple-400">
                <HardDrive size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-400 uppercase tracking-wider">Participating Hospitals</p>
                <p className="text-2xl font-semibold">3 Active</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy & Network Sniffer Widget */}
        <PrivacyInspector 
          isRunning={isRunning} 
          currentRound={metrics.length > 0 ? metrics[metrics.length - 1].round : 0} 
          dataType={dataType}
        />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Global Accuracy Chart */}
          <div className="glass-panel rounded-2xl p-6 h-[400px] min-h-[400px]">
            <h3 className="text-lg font-semibold mb-6">Global Model Accuracy</h3>
            <ResponsiveContainer width="100%" height={300} minWidth={200}>
              <LineChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="round" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  name="Global Accuracy"
                  dataKey="accuracy" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#14b8a6' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Individual Hospital Performance */}
          <div className="glass-panel rounded-2xl p-6 h-[400px] min-h-[400px]">
            <h3 className="text-lg font-semibold mb-6">Hospital Outlier Detection</h3>
            <ResponsiveContainer width="100%" height={300} minWidth={200}>
              <BarChart data={metrics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="round" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 1]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                />
                <Legend />
                <Bar name="Hospital 1" dataKey={(d) => d.client_accuracies?.[0] || 0} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar name="Hospital 2" dataKey={(d) => d.client_accuracies?.[1] || 0} fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar name="Hospital 3" dataKey={(d) => d.client_accuracies?.[2] || 0} fill="#ec4899" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          
        </div>
      </div>
    </div>
  );
}
