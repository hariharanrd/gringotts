import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction, Category, SubCategory, Item } from '../types';
import { TrendingUp, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { FilterMenu, FilterCriteria } from '../components/FilterMenu';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface SavingsProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

type BulkField = 'category' | 'subcategory' | 'item' | 'notes' | 'is_in';

const BULK_FIELDS: { value: BulkField; label: string }[] = [
  { value: 'category',    label: 'Category' },
  { value: 'subcategory', label: 'Sub Category' },
  { value: 'item',        label: 'Item' },
  { value: 'notes',       label: 'Notes' },
  { value: 'is_in',       label: 'Direction (IN/OUT)' },
];

const selectClass = "w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40";

const Savings: React.FC<SavingsProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const navigate = useNavigate();
  const [savings, setSavings] = useState<Transaction[]>([]);
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
  const [bulkIsIn, setBulkIsIn] = useState<boolean | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchSavings = async (page: number, currentFilters: FilterCriteria[] = []) => {
    setIsLoading(true);
    try {
      const response = await api.getSavings(page, currentFilters);
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
    fetchSavings(currentPage, filters);
    setSelectedIds(new Set());
  }, [currentPage, filters, refreshTrigger]);

  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories('SAVING').then(setCategories).catch(() => {});
    }
  }, []);

  useEffect(() => {
    setSubCategories([]);
    setBulkSubCategoryId('');
    setItems([]);
    setBulkItemId('');
    if (bulkCategoryId !== '') {
      api.getSubCategories(bulkCategoryId as number).then(setSubCategories).catch(() => {});
    }
  }, [bulkCategoryId]);

  useEffect(() => {
    setItems([]);
    setBulkItemId('');
    if (bulkSubCategoryId !== '') {
      api.getItems(bulkSubCategoryId as number).then(setItems).catch(() => {});
    }
  }, [bulkSubCategoryId]);

  const resetBulkValues = () => {
    setBulkCategoryId(''); setBulkSubCategoryId(''); setBulkItemId('');
    setBulkNotes(''); setBulkIsIn(null);
    setSubCategories([]); setItems([]);
  };

  const handleBulkFieldChange = (f: BulkField | '') => {
    setBulkField(f);
    resetBulkValues();
  };

  const isBulkApplyDisabled = () => {
    if (selectedIds.size === 0 || bulkField === '') return true;
    if (bulkField === 'category'    && bulkCategoryId === '') return true;
    if (bulkField === 'subcategory' && bulkSubCategoryId === '') return true;
    if (bulkField === 'item'        && bulkItemId === '') return true;
    if (bulkField === 'notes'       && bulkNotes.trim() === '') return true;
    if (bulkField === 'is_in'       && bulkIsIn === null) return true;
    return false;
  };

  const handleBulkUpdate = async () => {
    if (isBulkApplyDisabled()) return;
    setBulkLoading(true);
    try {
      const fields: Record<string, unknown> = {};
      if (bulkField === 'category')    fields['category_id']    = bulkCategoryId;
      if (bulkField === 'subcategory') fields['subcategory_id'] = bulkSubCategoryId;
      if (bulkField === 'item')        fields['item_id']        = bulkItemId;
      if (bulkField === 'notes')       fields['notes']          = bulkNotes;
      if (bulkField === 'is_in')       fields['is_in']          = bulkIsIn;

      await api.bulkUpdate(Array.from(selectedIds), fields);
      showToast(`Updated ${bulkField} for ${selectedIds.size} saving(s)`, 'success');
      setSelectedIds(new Set());
      setBulkField('');
      resetBulkValues();
      fetchSavings(currentPage, filters);
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
      showToast('Saving deleted successfully!', 'success');
      fetchSavings(currentPage);
    } catch (error) {
      console.error('Failed to delete saving:', error);
      showToast('Failed to delete saving.', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === savings.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(savings.map(e => e.id)));
  };

  const handleRowClick = (e: React.MouseEvent, id: number) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    navigate(`/transaction/${id}?type=SAVING`);
  };

  if (isLoading) return <div className="space-y-6"><TableSkeleton rows={5} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-2 rounded-xl shadow-lg shadow-violet-500/20">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          Savings
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

            {bulkField === 'is_in' && (
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg p-1">
                <button
                  onClick={() => setBulkIsIn(true)}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${bulkIsIn === true ? 'bg-emerald-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600'}`}
                >
                  IN
                </button>
                <button
                  onClick={() => setBulkIsIn(false)}
                  className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${bulkIsIn === false ? 'bg-rose-500 text-white shadow' : 'text-slate-500 dark:text-slate-400 hover:text-rose-600'}`}
                >
                  OUT
                </button>
              </div>
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
            className="flex items-center gap-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2.5 px-5 rounded-xl shadow-lg shadow-violet-500/20 hover:from-violet-400 hover:to-purple-500 transition-all font-medium text-sm whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Saving</span>
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
                    checked={savings.length > 0 && selectedIds.size === savings.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {savings.map((saving) => (
                <tr key={saving.id} onClick={(e) => handleRowClick(e, saving.id)} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150 group cursor-pointer ${selectedIds.has(saving.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
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
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider ${
                      (saving as any).is_in !== false ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {(saving as any).is_in !== false ? 'IN' : 'OUT'}
                    </span>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No savings found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {savings.map(saving => (
            <div key={saving.id} onClick={(e) => handleRowClick(e, saving.id)} className={`p-4 cursor-pointer ${selectedIds.has(saving.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(saving.id)}
                  onChange={() => toggleSelect(saving.id)}
                  className="mt-1.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{saving.description}</span>
                    <span className="text-sm font-semibold text-violet-500 dark:text-violet-400 whitespace-nowrap">₹{saving.value.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date(saving.transaction_time).toLocaleDateString()}</div>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {saving.category?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{saving.category.name}</span>
                    )}
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold tracking-wider ${
                      (saving as any).is_in !== false ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                    }`}>
                      {(saving as any).is_in !== false ? 'IN' : 'OUT'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <button onClick={() => onEdit(saving)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(saving.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {savings.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No savings found</div>
          )}
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} hasMore={hasMore} onPageChange={setCurrentPage} />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Saving"
        message="Are you sure you want to delete this saving? This action cannot be undone."
      />
    </div>
  );
};

export default Savings;