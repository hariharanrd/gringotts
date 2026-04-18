import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction, Category, SubCategory, Item } from '../types';
import { ArrowUpRight, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { FilterMenu, FilterCriteria } from '../components/FilterMenu';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CategoryIcon from '../components/CategoryIcon';

interface IncomesProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

type BulkField = 'category' | 'subcategory' | 'item' | 'notes' | 'source';

const BULK_FIELDS: { value: BulkField; label: string }[] = [
  { value: 'category', label: 'Category' },
  { value: 'subcategory', label: 'Sub Category' },
  { value: 'item', label: 'Item' },
  { value: 'notes', label: 'Notes' },
  { value: 'source', label: 'Source' },
];

const selectClass = "w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40";

const Incomes: React.FC<IncomesProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const navigate = useNavigate();
  const [incomes, setIncomes] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  // Bulk update state
  const [bulkField, setBulkField] = useState<BulkField | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | ''>('');
  const [bulkSubCategoryId, setBulkSubCategoryId] = useState<number | ''>('');
  const [bulkItemId, setBulkItemId] = useState<number | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkSource, setBulkSource] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchIncomes = async (page: number, currentFilters: FilterCriteria[] = []) => {
    setIsLoading(true);
    try {
      const response = await api.getIncomes(page, currentFilters);
      setIncomes(response.data);
      setTotalPages(Math.ceil(response.total_count / 10));
      setHasMore(response.has_more);
    } catch (error) {
      console.error("Failed to fetch incomes:", error);
      showToast("Failed to fetch incomes.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomes(currentPage, filters);
    setSelectedIds(new Set());
  }, [currentPage, filters, refreshTrigger]);

  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories('INCOME').then(setCategories).catch(() => { });
    }
  }, []);

  useEffect(() => {
    setSubCategories([]);
    setBulkSubCategoryId('');
    setItems([]);
    setBulkItemId('');
    if (bulkCategoryId !== '') {
      api.getSubCategories(bulkCategoryId as number).then(setSubCategories).catch(() => { });
    }
  }, [bulkCategoryId]);

  useEffect(() => {
    setItems([]);
    setBulkItemId('');
    if (bulkSubCategoryId !== '') {
      api.getItems(bulkSubCategoryId as number).then(setItems).catch(() => { });
    }
  }, [bulkSubCategoryId]);

  const resetBulkValues = () => {
    setBulkCategoryId(''); setBulkSubCategoryId(''); setBulkItemId('');
    setBulkNotes(''); setBulkSource('');
    setSubCategories([]); setItems([]);
  };

  const handleBulkFieldChange = (f: BulkField | '') => {
    setBulkField(f);
    resetBulkValues();
  };

  const isBulkApplyDisabled = () => {
    if (selectedIds.size === 0 || bulkField === '') return true;
    if (bulkField === 'category' && bulkCategoryId === '') return true;
    if (bulkField === 'subcategory' && bulkSubCategoryId === '') return true;
    if (bulkField === 'item' && bulkItemId === '') return true;
    if (bulkField === 'notes' && bulkNotes.trim() === '') return true;
    if (bulkField === 'source' && bulkSource === '') return true;
    return false;
  };

  const handleBulkUpdate = async () => {
    if (isBulkApplyDisabled()) return;
    setBulkLoading(true);
    try {
      const fields: Record<string, unknown> = {};
      if (bulkField === 'category') fields['category_id'] = bulkCategoryId;
      if (bulkField === 'subcategory') fields['subcategory_id'] = bulkSubCategoryId;
      if (bulkField === 'item') fields['item_id'] = bulkItemId;
      if (bulkField === 'notes') fields['notes'] = bulkNotes;
      if (bulkField === 'source') fields['source'] = bulkSource;

      await api.bulkUpdate(Array.from(selectedIds), fields);
      showToast(`Updated ${bulkField} for ${selectedIds.size} income(s)`, 'success');
      setSelectedIds(new Set());
      setBulkField('');
      resetBulkValues();
      fetchIncomes(currentPage, filters);
    } catch (error) {
      console.error('Bulk update failed:', error);
      showToast('Failed to bulk update.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleDelete = (id: number) => { setDeletingId(id); setIsDeleteDialogOpen(true); };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.deleteTransaction(deletingId);
      showToast('Income deleted successfully!', 'success');
      fetchIncomes(currentPage);
    } catch (error) {
      console.error('Failed to delete income:', error);
      showToast('Failed to delete income.', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === incomes.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(incomes.map(e => e.id)));
  };

  const handleRowClick = (e: React.MouseEvent, id: number) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    navigate(`/transaction/${id}?type=INCOME`);
  };

  if (isLoading) return <div className="space-y-6"><TableSkeleton rows={5} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
            <ArrowUpRight className="w-5 h-5 text-white" />
          </div>
          Incomes
        </h1>

        {selectedIds.size > 0 && (
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400 whitespace-nowrap">{selectedIds.size} selected</span>

            <select
              className={selectClass}
              value={bulkField}
              onChange={e => handleBulkFieldChange(e.target.value as BulkField | '')}
            >
              <option value="">Select field…</option>
              {BULK_FIELDS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>

            {bulkField === 'category' && (
              <select className={selectClass} value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}>
                <option value="">Select category…</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}

            {bulkField === 'subcategory' && (
              <>
                <select className={selectClass} value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">1. Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className={selectClass} value={bulkSubCategoryId} onChange={e => setBulkSubCategoryId(e.target.value ? Number(e.target.value) : '')} disabled={bulkCategoryId === ''}>
                  <option value="">2. Select sub category…</option>
                  {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </>
            )}

            {bulkField === 'item' && (
              <>
                <select className={selectClass} value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">1. Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className={selectClass} value={bulkSubCategoryId} onChange={e => setBulkSubCategoryId(e.target.value ? Number(e.target.value) : '')} disabled={bulkCategoryId === ''}>
                  <option value="">2. Select sub category…</option>
                  {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select className={selectClass} value={bulkItemId} onChange={e => setBulkItemId(e.target.value ? Number(e.target.value) : '')} disabled={bulkSubCategoryId === ''}>
                  <option value="">3. Select item…</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                </select>
              </>
            )}

            {bulkField === 'notes' && (
              <input
                type="text"
                className={selectClass}
                placeholder="Enter notes…"
                value={bulkNotes}
                onChange={e => setBulkNotes(e.target.value)}
              />
            )}

            {bulkField === 'source' && (
              <input
                type="text"
                className={selectClass}
                placeholder="Enter source…"
                value={bulkSource}
                onChange={e => setBulkSource(e.target.value)}
              />
            )}

            <button
              onClick={handleBulkUpdate}
              disabled={isBulkApplyDisabled() || bulkLoading}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium rounded-lg shadow-lg disabled:opacity-40 transition-all hover:from-cyan-400 hover:to-blue-500"
            >
              {bulkLoading ? 'Applying…' : 'Apply'}
            </button>
            <button
              onClick={() => { setSelectedIds(new Set()); setBulkField(''); resetBulkValues(); }}
              className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 md:ml-auto">
          <FilterMenu
            activeFilters={filters}
            availableFields={[
              { label: 'Date', value: 'transactionTime', type: 'date' },
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
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-2.5 px-5 rounded-xl shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition-all font-medium text-sm whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Income</span>
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto hidden md:block">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700/50">
                <th scope="col" className="px-4 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={incomes.length > 0 && selectedIds.size === incomes.length}
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
              {incomes.map((income) => (
                <tr key={income.id} onClick={(e) => handleRowClick(e, income.id)} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150 group cursor-pointer ${selectedIds.has(income.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(income.id)}
                      onChange={() => toggleSelect(income.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(income.transaction_time).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800 dark:text-slate-200">
                    <div className="flex items-center gap-3">
                      <CategoryIcon category={income.category} />
                      <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{income.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {income.category?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{income.category.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-emerald-500 dark:text-emerald-400">+₹{income.value.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEdit(income)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(income.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {incomes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No incomes found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {incomes.map(income => (
            <div key={income.id} onClick={(e) => handleRowClick(e, income.id)} className={`p-4 cursor-pointer ${selectedIds.has(income.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(income.id)}
                  onChange={() => toggleSelect(income.id)}
                  className="mt-1.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2 mr-2">
                      <CategoryIcon category={income.category} />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{income.description}</span>
                    </div>
                    <span className="text-sm font-semibold text-emerald-500 dark:text-emerald-400 whitespace-nowrap">+₹{income.value.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date(income.transaction_time).toLocaleDateString()}</div>
                  {income.category?.name && (
                    <div className="mt-2">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{income.category.name}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <button onClick={() => onEdit(income)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(income.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {incomes.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No incomes found</div>
          )}
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} hasMore={hasMore} onPageChange={setCurrentPage} />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Income"
        message="Are you sure you want to delete this income? This action cannot be undone."
      />
    </div>
  );
};

export default Incomes;
