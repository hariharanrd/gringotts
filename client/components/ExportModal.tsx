import React, { useState } from 'react';
import { X, Info, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from './ToastContext';
import { api } from '../services/api';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string; // 'all' | 'expense' | 'income' | 'saving' | 'revolving'
  activeFilters: { field: string; condition: string; value: string }[];
  currentPage: number;
  pageSize: number;
  sortDirection: 'ASC' | 'DESC';
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  currentTab,
  activeFilters,
  currentPage,
  pageSize,
  sortDirection,
}) => {
  const { showToast } = useToast();
  const [format, setFormat] = useState<'csv' | 'xlsx'>('xlsx');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const typeParam = currentTab === 'all' ? undefined : currentTab;
      
      const blob = await api.exportTransactions({
        format,
        type: typeParam,
        filters: activeFilters,
        page: currentPage,
        size: pageSize,
        direction: sortDirection,
      });

      // Trigger file download in browser
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const todayStr = new Date().toISOString().split('T')[0];
      const filename = `${currentTab}_export_${todayStr}.${format}`;
      link.setAttribute('download', filename);
      
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast(`Exported successfully as ${format.toUpperCase()}`, 'success');
      onClose();
    } catch (error: any) {
      console.error(error);
      showToast(error.message || 'Failed to export transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden border border-slate-200 dark:border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex items-center gap-2">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export Current View</h3>
              <p className="text-xs text-slate-400 capitalize">Exporting: {currentTab} transactions</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Format Selection */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">File Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  format === 'xlsx'
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                <span>XLSX</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`flex items-center justify-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all ${
                  format === 'csv'
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80'
                }`}
              >
                <FileText className="w-5 h-5 text-blue-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFilters.length > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10 text-cyan-700 dark:text-cyan-400">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold">Active filters are applied: </span>
                {activeFilters.length} filter{activeFilters.length > 1 ? 's' : ''} currently active on the page will restrict the export.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Export
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExportModal;
