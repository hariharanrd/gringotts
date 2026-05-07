import React from 'react';
import { useTheme } from './ThemeContext';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700/50 ${className}`} />
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50 pb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <div className="glass-card rounded-2xl overflow-hidden p-4">
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700/50 pb-4 mb-4">
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex gap-4 items-center">
              <Skeleton className="h-4 w-6" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-24 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* ── SECTION: Status Overview ── */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <Skeleton className="w-1.5 h-6 rounded-full" />
          <Skeleton className="h-6 w-40" />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 glass-card rounded-3xl p-6">
            <div className="flex justify-between mb-8">
              <div className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-full rounded-full" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mt-8">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-8 w-8 rounded-xl" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
            ))}
            <div className="space-y-4">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION: Financial Activity ── */}
      <div className="space-y-6 pt-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-1.5 h-6 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <Skeleton className="h-10 w-40 rounded-xl" />
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-4 w-12" />
              </div>
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-28" />
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <Skeleton className="h-5 w-40 mb-6" />
              <div className="h-[240px] flex flex-col justify-between">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-6 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="glass-card rounded-2xl p-6">
          <Skeleton className="h-5 w-48 mb-5" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex gap-3 items-center">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const FormSkeleton: React.FC = () => {
  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-4 w-64 mx-auto" />
      </div>
      <div className="glass-card rounded-2xl p-8 space-y-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
        <Skeleton className="h-12 w-full rounded-xl mt-6" />
      </div>
    </div>
  );
};
