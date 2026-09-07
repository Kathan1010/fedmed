import React, { useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Hospital, 
  Microscope, 
  Activity, 
  ShieldCheck,
  Stethoscope,
  Moon,
  Sun
} from 'lucide-react';
import { ThemeContext } from '../App';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/clients', icon: Hospital, label: 'Hospitals' },
  { to: '/results', icon: Microscope, label: 'Results' },
];

export default function Sidebar({ trainingStatus }) {
  const location = useLocation();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const isTraining = trainingStatus === 'training';
  const isCompleted = trainingStatus === 'completed';

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-zinc-950 z-40 flex flex-col border-r border-zinc-800">
      
      {/* Brand */}
      <div className="px-6 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.15)]">
            <Stethoscope size={22} className="text-zinc-950" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">FedMed</h1>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Healthcare FL</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-4 mb-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Navigation</p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span>{label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Theme Toggle & Status */}
      <div className="px-4 py-4 border-t border-zinc-800 flex flex-col gap-3">
        
        {/* Theme Toggle Button */}
        <button 
          onClick={toggleTheme}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-200 text-sm font-medium w-full"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Training Status Widget */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              isTraining 
                ? 'bg-white/10 text-white' 
                : isCompleted 
                  ? 'bg-zinc-800 text-zinc-200' 
                  : 'bg-zinc-800 text-zinc-500'
            }`}>
              <Activity size={16} className={isTraining ? 'animate-pulse' : ''} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-zinc-500 font-medium">System Status</p>
              <p className={`text-sm font-semibold truncate ${
                isTraining 
                  ? 'text-white' 
                  : isCompleted 
                    ? 'text-zinc-200' 
                    : 'text-zinc-400'
              }`}>
                {isTraining ? 'Training Active' : isCompleted ? 'Completed' : 'Standby'}
              </p>
            </div>
          </div>
        </div>

        {/* Privacy Badge */}
        <div className="flex items-center gap-2 px-1">
          <ShieldCheck size={12} className="text-zinc-500" />
          <p className="text-[10px] text-zinc-500 font-medium">End-to-End Encrypted</p>
        </div>
      </div>
    </aside>
  );
}
