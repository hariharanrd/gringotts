

import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Transaction } from '../types';
import { TrendingUp, PlusCircle, Pencil, Trash2 } from 'lucide-react';
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
  }, [currentPage, refreshTrigger]);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-slate-700 border-t-violet-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
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

      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {savings.map((saving) => (
                <tr key={saving.id} className="hover:bg-slate-700/20 transition-colors duration-150 group">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">{new Date(saving.transaction_time).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-200">{saving.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {saving.category?.name && (
                      <span className="px-2.5 py-1 bg-slate-700/50 rounded-lg text-xs font-medium text-slate-300">{saving.category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-violet-400">₹{saving.value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEdit(saving)}
                        className="p-2 rounded-lg hover:bg-slate-600/50 text-slate-400 hover:text-cyan-400 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(saving.id)}
                        className="p-2 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors"
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
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">No savings found</td>
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
