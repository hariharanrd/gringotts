import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction, Category, Revolving as RevolvingType } from '../types';
import { RefreshCw, PlusCircle, Pencil, Trash2, Tags } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { FilterMenu, FilterCriteria } from '../components/FilterMenu';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface RevolvingsProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

const Revolvings: React.FC<RevolvingsProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const [revolvings, setRevolvings] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [categories, setCategories] = useState<Category[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [showClosed, setShowClosed] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const fetchRevolvings = async (page: number, baseFilters: FilterCriteria[] = [], includeClosed: boolean) => {
    setIsLoading(true);
    try {
      let combinedFilters = [...baseFilters];
      if (!includeClosed) {
        combinedFilters.push({ field: 'closed', condition: 'eq', value: 'false' });
      }

      const response = await api.getRevolvings(page, combinedFilters);
      setRevolvings(response.data);
      setTotalPages(Math.ceil(response.total_count / 10));
      setHasMore(response.has_more);
    } catch (error) {
      console.error("Failed to fetch revolvings:", error);
      showToast("Failed to fetch revolving transactions.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRevolvings(currentPage, filters, showClosed);
    setSelectedIds(new Set());
  }, [currentPage, filters, refreshTrigger, showClosed]);

  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories('REVOLVING').then(setCategories).catch(() => { });
    }
  }, []);

  const handleDelete = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.deleteTransaction(deletingId);
      showToast('Revolving transaction deleted successfully!', 'success');
      fetchRevolvings(currentPage, filters, showClosed);
    } catch (error) {
      console.error('Failed to delete revolving transaction:', error);
      showToast('Failed to delete revolving transaction.', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
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
    if (selectedIds.size === revolvings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(revolvings.map(e => e.id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (bulkCategoryId === '' || selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await api.bulkUpdateCategory(Array.from(selectedIds), bulkCategoryId as number);
      showToast(`Category updated for ${selectedIds.size} transaction(s)`, 'success');
      setSelectedIds(new Set());
      setBulkCategoryId('');
      fetchRevolvings(currentPage, filters, showClosed);
    } catch (error) {
      console.error('Bulk update failed:', error);
      showToast('Failed to bulk update category.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  if (isLoading) {
    return <div className="space-y-6"><TableSkeleton rows={5} /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          Revolving
        </h1>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-cyan-500 focus:ring-cyan-500/40"
              checked={showClosed}
              onChange={(e) => { setShowClosed(e.target.checked); setCurrentPage(1); }}
            />
            Show Closed
          </label>
          <FilterMenu
            activeFilters={filters}
            availableFields={[
              { label: 'Category', value: 'category.name', type: 'string' },
              { label: 'SubCategory', value: 'subCategory.name', type: 'string' },
              { label: 'Item', value: 'item.name', type: 'string' },
              { label: 'Notes', value: 'notes', type: 'string' },
              { label: 'Description', value: 'description', type: 'string' },
              { label: 'Value', value: 'value', type: 'number' }
            ]}
            onApplyFilters={(f) => { setFilters(f); setCurrentPage(1); }}
          />
          <button
            onClick={onAdd}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-2.5 px-5 rounded-xl shadow-lg shadow-blue-500/20 hover:from-blue-400 hover:to-cyan-500 transition-all font-medium text-sm whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            Add Revolving
          </button>
        </div>
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
                    checked={revolvings.length > 0 && selectedIds.size === revolvings.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {revolvings.map((revolving) => (
                <tr key={revolving.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150 group ${selectedIds.has(revolving.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(revolving.id)}
                      onChange={() => toggleSelect(revolving.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(revolving.transaction_time).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">{revolving.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {revolving.category?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{revolving.category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider ${
                      (revolving as RevolvingType).is_give !== false ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                    }`}>
                      {(revolving as RevolvingType).is_give !== false ? 'GIVE' : 'RECEIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider ${
                      (revolving as RevolvingType).closed ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400' : 'bg-cyan-100 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400'
                    }`}>
                      {(revolving as RevolvingType).closed ? 'CLOSED' : 'OPEN'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-blue-500 dark:text-blue-400">₹{revolving.value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEdit(revolving)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(revolving.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {revolvings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No revolving transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} hasMore={hasMore} onPageChange={setCurrentPage} />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Revolving Transaction"
        message="Are you sure you want to delete this transaction? This action cannot be undone."
      />
    </div>
  );
};

export default Revolvings;
