import React from 'react';

export function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-6">
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

export function SkeletonChart({ height = 280 }) {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="skeleton w-32 h-4 rounded mb-6" />
      <div className="skeleton w-full rounded-lg" style={{ height }} />
    </div>
  );
}

export function SkeletonRow({ width = '100%' }) {
  return <div className="skeleton h-4 rounded" style={{ width }} />;
}

export function SkeletonClientCard() {
  return (
    <div className="glass-panel rounded-2xl p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="skeleton w-11 h-11 rounded-xl" />
          <div className="space-y-2">
            <div className="skeleton w-32 h-4 rounded" />
            <div className="skeleton w-16 h-3 rounded" />
          </div>
        </div>
        <div className="skeleton w-20 h-6 rounded-full" />
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <div className="skeleton w-24 h-3 rounded" />
          <div className="skeleton w-12 h-5 rounded" />
        </div>
        <div className="skeleton w-full h-1.5 rounded-full" />
      </div>
      <div className="pt-3 border-t border-white/[0.06] flex justify-between">
        <div className="skeleton w-20 h-3 rounded" />
        <div className="skeleton w-16 h-3 rounded" />
      </div>
    </div>
  );
}
