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
    <div className="space-y-8">
      {/* Period badge */}
      <Skeleton className="h-5 w-48" />

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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <Skeleton className="h-5 w-40 mb-6" />
          <div className="h-[280px] w-full flex flex-col justify-between">
             {Array.from({ length: 6 }).map((_, i) => (
               <Skeleton key={i} className="h-8 w-full" />
             ))}
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="h-[170px] flex items-center justify-center mb-6">
            <Skeleton className="h-40 w-40 rounded-full" />
          </div>
          <div className="space-y-3">
             {Array.from({ length: 4 }).map((_, i) => (
               <div key={i} className="flex justify-between items-center">
                 <Skeleton className="h-4 w-20" />
                 <Skeleton className="h-4 w-12" />
               </div>
             ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card rounded-2xl p-6">
        <Skeleton className="h-5 w-48 mb-5" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex gap-3">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <div className="flex gap-2">
                     <Skeleton className="h-3 w-16" />
                     <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          ))}
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
