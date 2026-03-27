

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction, Category } from '../types';
import { TrendingUp, PlusCircle, Pencil, Trash2, Tags } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Pagination from '../components/Pagination';

interface SavingsProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

const Savings: React.FC<SavingsProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const [savings, setSavings] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const { showToast } = useToast();

  const fetchSavings = async (page: number) => {
    setIsLoading(true);
    try {
      const response = await api.getSavings(page);
      setSavings(response.data);
      setTotalPages(Math.ceil(response.total_count / 10));
      setHasMore(response.has_more);
    } catch (error) {
      console.error("Failed to fetch savings:", error);
      showToast("Failed to fetch savings.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings(currentPage);
    setSelectedIds(new Set());
  }, [currentPage, refreshTrigger]);

  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories('SAVING').then(setCategories).catch(() => {});
    }
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this saving?')) {
      try {
        await api.deleteTransaction(id);
        showToast('Saving deleted successfully!', 'success');
        fetchSavings(currentPage);
      } catch (error) {
        console.error('Failed to delete saving:', error);
        showToast('Failed to delete saving.', 'error');
      }
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === savings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(savings.map(e => e.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (bulkCategoryId === '' || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await api.bulkUpdateCategory(Array.from(selectedIds), bulkCategoryId as number);
      showToast(`Category updated for ${selectedIds.size} saving(s)`, 'success');
      setSelectedIds(new Set());
      setBulkCategoryId('');
      fetchSavings(currentPage);
    } catch (error) {
      console.error('Bulk update failed:', error);
      showToast('Failed to bulk update category.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-300 dark:border-slate-700 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          Savings
        </h1>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 px-5 rounded-xl shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-purple-500 transition-all font-medium text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          Add Saving
        </button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-4 p-4 glass-card rounded-xl border border-cyan-500/30 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">
            {selectedIds.size} selected
          </span>
          <div className="flex items-center gap-2 flex-1">
            <Tags className="w-4 h-4 text-slate-400" />
            <select
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40"
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Select Category</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button
              onClick={handleBulkUpdate}
              disabled={bulkCategoryId === '' || bulkLoading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg shadow-lg disabled:opacity-40 transition-all hover:from-cyan-400 hover:to-blue-500"
            >
              {bulkLoading ? 'Applying...' : 'Apply'}
            </button>
          </div>
          <button
            onClick={() => { setSelectedIds(new Set()); setBulkCategoryId(''); }}
            className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50">
                <th scope="col" className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={savings.length > 0 && selectedIds.size === savings.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {savings.map((saving) => (
                <tr key={saving.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150 group ${selectedIds.has(saving.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(saving.id)}
                      onChange={() => toggleSelect(saving.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(saving.transaction_time).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{saving.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {saving.category?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{saving.category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-violet-500 dark:text-violet-400">₹{saving.value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEdit(saving)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(saving.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {savings.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No savings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} hasMore={hasMore} onPageChange={setCurrentPage} />
    </div>
  );
};

export default Savings;
