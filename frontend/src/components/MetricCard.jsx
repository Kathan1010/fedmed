import React from 'react';

export default function MetricCard({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  loading = false,
  animationDelay = 0,
  iconColor = 'text-gray-900 dark:text-white'
}) {
  if (loading) {
    return (
      <div className="glass-panel p-6">
        <div className="flex items-start gap-4">
          <div className="skeleton w-11 h-11 rounded-xl" />
          <div className="flex-1 space-y-3">
            <div className="skeleton w-20 h-3 rounded" />
            <div className="skeleton w-28 h-7 rounded" />
            <div className="skeleton w-16 h-3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`card-interactive group p-6 opacity-0 animate-fade-in`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-start gap-4">
        <div className={`p-2.5 rounded-xl bg-gray-100 dark:bg-zinc-800 ${iconColor} transition-colors duration-300`}>
          {Icon && <Icon size={20} strokeWidth={2} />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{title}</p>
          <p className={`text-2xl font-bold text-gray-900 dark:text-white tracking-tight leading-none`}>
            {value ?? '—'}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-zinc-400 mt-1.5 font-medium">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
