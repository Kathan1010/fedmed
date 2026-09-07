import React, { useContext } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { ThemeContext } from '../App';
import { PieChart as PieChartIcon } from 'lucide-react';

const ageData = [
  { name: 'Pediatrics (<18)', value: 15 },
  { name: 'Adults (18-65)', value: 60 },
  { name: 'Seniors (>65)', value: 25 },
];

const genderData = [
  { name: 'Male', value: 48 },
  { name: 'Female', value: 51 },
  { name: 'Other', value: 1 },
];

function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-gray-900 dark:text-white font-bold">{payload[0].name}</p>
        <p className="text-gray-500 dark:text-zinc-400 text-sm">{payload[0].value}% of dataset</p>
      </div>
    );
  }
  return null;
}

export default function DataDistributionCharts() {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === 'dark';

  // Vibrant colors for light mode, monochrome for dark mode
  const pieColorsLight = ['#3b82f6', '#14b8a6', '#8b5cf6']; // Blue, Teal, Purple
  const pieColorsDark = ['#ffffff', '#a3a3a3', '#525252']; // White, Light Gray, Dark Gray
  
  const colors = isDark ? pieColorsDark : pieColorsLight;
  
  return (
    <div className="glass-panel p-6 opacity-0 animate-fade-in" style={{ animationDelay: '100ms' }}>
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20">
          <PieChartIcon size={18} className="text-gray-900 dark:text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Federated Data Demographics</h3>
          <p className="text-[10px] text-gray-500 dark:text-zinc-400 font-medium uppercase tracking-wider">
            Metadata Summaries (Raw data never accessed)
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Age Demographics */}
        <div className="flex flex-col items-center">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-2">Age Distribution</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={ageData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {ageData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gender Demographics */}
        <div className="flex flex-col items-center">
          <h4 className="text-xs font-semibold text-gray-600 dark:text-zinc-300 uppercase tracking-wider mb-2">Gender Ratio</h4>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={genderData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {genderData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={36} 
                iconType="circle"
                formatter={(value) => <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
}
