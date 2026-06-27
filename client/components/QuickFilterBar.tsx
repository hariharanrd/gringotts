import React, { useState, useEffect } from 'react';
import { Plus, X, Sparkles, FolderHeart } from 'lucide-react';
import { QuickFilter } from '../types';
import { FilterCriteria } from './FilterMenu';
import { getSystemQuickFilters, loadUserQuickFilters, saveUserQuickFilters } from '../services/quickFilters';

interface QuickFilterBarProps {
  tab: string;
  activeFilters: FilterCriteria[];
  onApply: (filters: FilterCriteria[]) => void;
}

export const QuickFilterBar: React.FC<QuickFilterBarProps> = ({
  tab,
  activeFilters,
  onApply,
}) => {
  const [userFilters, setUserFilters] = useState<QuickFilter[]>([]);
  const [isNamingOpen, setIsNamingOpen] = useState(false);
  const [newFilterName, setNewFilterName] = useState('');

  // Load user filters
  const reloadFilters = () => {
    setUserFilters(loadUserQuickFilters(tab));
  };

  useEffect(() => {
    reloadFilters();
  }, [tab]);

  useEffect(() => {
    const handleSync = () => reloadFilters();
    window.addEventListener('personalization-sync-done', handleSync);
    window.addEventListener('quick-filters-changed', handleSync);
    return () => {
      window.removeEventListener('personalization-sync-done', handleSync);
      window.removeEventListener('quick-filters-changed', handleSync);
    };
  }, [tab]);

  const systemFilters = getSystemQuickFilters(tab);

  // Helper to check if a quick filter is active
  const isQfActive = (qf: QuickFilter) => {
    if (qf.filters.length === 0) return false;
    // For date ranges (length > 1), check if all match
    // For single conditions, check if present
    return qf.filters.every(qfCond => 
      activeFilters.some(actCond => 
        actCond.field === qfCond.field &&
        actCond.condition === qfCond.condition &&
        actCond.value === qfCond.value
      )
    ) && (activeFilters.length >= qf.filters.length);
  };

  const handleApplyFilter = (qf: QuickFilter) => {
    if (isQfActive(qf)) {
      // Toggle off: clear these specific filters or clear all
      // Standard behavior: replace all with empty array, or clear only the matching subset
      // Replacing all is cleaner for predefined quick filters
      onApply([]);
    } else {
      // Replace active filters with the quick filter's filters
      onApply(qf.filters);
    }
  };

  const handleDeleteUserFilter = async (e: React.MouseEvent, qfToDelete: QuickFilter) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the quick filter "${qfToDelete.label}"?`)) {
      return;
    }
    const updated = userFilters.filter(f => f.id !== qfToDelete.id);
    setUserFilters(updated);
    await saveUserQuickFilters(tab, updated);
    window.dispatchEvent(new CustomEvent('quick-filters-changed'));
  };

  const handleSaveCurrentFilter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilterName.trim() || activeFilters.length === 0) return;

    const newQf: QuickFilter = {
      id: `user-${Date.now()}`,
      label: newFilterName.trim(),
      tab,
      isSystem: false,
      filters: activeFilters.map(f => ({ ...f }))
    };

    const updated = [...userFilters, newQf];
    setUserFilters(updated);
    await saveUserQuickFilters(tab, updated);
    setIsNamingOpen(false);
    setNewFilterName('');
    window.dispatchEvent(new CustomEvent('quick-filters-changed'));
  };

  // Determine if we show the "+" button to save the current filter criteria
  const showSaveButton = activeFilters.length > 0 && !systemFilters.some(isQfActive) && !userFilters.some(isQfActive);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none w-full animate-in fade-in slide-in-from-top-1">
        {/* System Filters */}
        <div className="flex items-center gap-1.5 shrink-0">
          {systemFilters.map(qf => {
            const active = isQfActive(qf);
            return (
              <button
                key={qf.id}
                onClick={() => handleApplyFilter(qf)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active
                    ? 'bg-cyan-500 text-white shadow-sm border border-cyan-500'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <Sparkles className={`w-3 h-3 ${active ? 'text-white' : 'text-cyan-500'}`} />
                <span>{qf.label}</span>
              </button>
            );
          })}
        </div>

        {/* Divider */}
        {userFilters.length > 0 && (
          <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 shrink-0 mx-1" />
        )}

        {/* User Custom Filters */}
        <div className="flex items-center gap-1.5 shrink-0">
          {userFilters.map(qf => {
            const active = isQfActive(qf);
            return (
              <button
                key={qf.id}
                onClick={() => handleApplyFilter(qf)}
                className={`flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-bold transition-all group ${
                  active
                    ? 'bg-cyan-500 text-white shadow-sm border border-cyan-500'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <FolderHeart className={`w-3 h-3 ${active ? 'text-white' : 'text-rose-500'}`} />
                <span>{qf.label}</span>
                <span
                  onClick={(e) => handleDeleteUserFilter(e, qf)}
                  className={`p-0.5 rounded-full transition-colors ${
                    active 
                      ? 'hover:bg-cyan-600 text-cyan-200 hover:text-white' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500'
                  }`}
                  title="Delete Quick Filter"
                >
                  <X className="w-3 h-3" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Save Current Filters Button */}
        {showSaveButton && (
          <button
            onClick={() => setIsNamingOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-dashed border-cyan-500/30 transition-all shrink-0 uppercase tracking-wider"
            title="Save current filters as quick filter"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Save Quick Filter</span>
          </button>
        )}
      </div>

      {/* Save Modal/Popover */}
      {isNamingOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight mb-2">Save Quick Filter</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a name for this custom filter combination. It will appear on this tab.
            </p>
            <form onSubmit={handleSaveCurrentFilter} className="space-y-4">
              <input
                type="text"
                className="w-full text-sm px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/60 focus:ring-2 focus:ring-cyan-500 outline-none dark:text-slate-200"
                placeholder="e.g. High Expenses, Given loans..."
                value={newFilterName}
                onChange={e => setNewFilterName(e.target.value)}
                autoFocus
                maxLength={25}
              />
              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => { setIsNamingOpen(false); setNewFilterName(''); }}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFilterName.trim()}
                  className="px-5 py-2 text-xs font-bold bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 disabled:opacity-50 transition-all uppercase tracking-widest"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
