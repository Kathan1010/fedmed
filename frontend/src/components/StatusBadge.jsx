import React from 'react';

const statusStyles = {
  idle: {
    bg: 'bg-gray-100 dark:bg-zinc-800',
    text: 'text-gray-500 dark:text-zinc-400',
    dot: 'bg-gray-400 dark:bg-zinc-500',
    border: 'border-transparent',
    label: 'Standby',
  },
  training: {
    bg: 'bg-blue-100 dark:bg-white/10',
    text: 'text-blue-700 dark:text-white',
    dot: 'bg-blue-600 dark:bg-white animate-pulse',
    border: 'border-blue-200 dark:border-white/5',
    label: 'Training',
  },
  completed: {
    bg: 'bg-green-100 dark:bg-zinc-700',
    text: 'text-green-700 dark:text-zinc-200',
    dot: 'bg-green-600 dark:bg-zinc-300',
    border: 'border-green-200 dark:border-transparent',
    label: 'Completed',
  },
};

export default function StatusBadge({ status = 'idle' }) {
  const style = statusStyles[status] || statusStyles.idle;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
}
