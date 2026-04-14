import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction, Category, SubCategory, Item } from '../types';
import { ArrowDownRight, PlusCircle, Pencil, Trash2, Columns } from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { FilterMenu, FilterCriteria } from '../components/FilterMenu';
import ConfirmationDialog from '../components/ConfirmationDialog';

interface ExpensesProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: () => void;
  refreshTrigger: number;
}

type BulkField = 'category' | 'subcategory' | 'item' | 'notes' | 'payment_mode';

const BULK_FIELDS: { value: BulkField; label: string }[] = [
  { value: 'category',     label: 'Category' },
  { value: 'subcategory',  label: 'Sub Category' },
  { value: 'item',         label: 'Item' },
  { value: 'notes',        label: 'Notes' },
  { value: 'payment_mode', label: 'Payment Mode' },
];

type ColumnKey = 'date' | 'description' | 'category' | 'subcategory' | 'item' | 'amount' | 'payment_mode' | 'notes';

const AVAILABLE_COLUMNS: { key: ColumnKey; label: string; defaultVisible: boolean }[] = [
  { key: 'date', label: 'Date', defaultVisible: true },
  { key: 'description', label: 'Description', defaultVisible: true },
  { key: 'category', label: 'Category', defaultVisible: true },
  { key: 'subcategory', label: 'Sub Category', defaultVisible: false },
  { key: 'item', label: 'Item', defaultVisible: false },
  { key: 'amount', label: 'Amount', defaultVisible: true },
  { key: 'payment_mode', label: 'Payment Mode', defaultVisible: true },
  { key: 'notes', label: 'Notes', defaultVisible: false },
];

const selectClass = "w-full sm:w-auto px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-lg text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40";

const Expenses: React.FC<ExpensesProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(
    new Set(AVAILABLE_COLUMNS.filter(c => c.defaultVisible).map(c => c.key))
  );
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);
  const columnDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnChooserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Bulk update state
  const [bulkField, setBulkField] = useState<BulkField | ''>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [bulkCategoryId, setBulkCategoryId] = useState<number | ''>('');
  const [bulkSubCategoryId, setBulkSubCategoryId] = useState<number | ''>('');
  const [bulkItemId, setBulkItemId] = useState<number | ''>('');
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkPaymentMode, setBulkPaymentMode] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchExpenses = async (page: number, currentFilters: FilterCriteria[] = []) => {
    setIsLoading(true);
    try {
      const response = await api.getExpenses(page, currentFilters);
      setExpenses(response.data);
      setTotalPages(Math.ceil(response.total_count / 10));
      setHasMore(response.has_more);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      showToast("Failed to fetch expenses.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(currentPage, filters);
    setSelectedIds(new Set());
  }, [currentPage, filters, refreshTrigger]);

  useEffect(() => {
    if (categories.length === 0) {
      api.getCategories('EXPENSE').then(setCategories).catch(() => {});
    }
  }, []);

  // Load subcategories when a category is chosen for bulk
  useEffect(() => {
    setSubCategories([]);
    setBulkSubCategoryId('');
    setItems([]);
    setBulkItemId('');
    if (bulkCategoryId !== '') {
      api.getSubCategories(bulkCategoryId as number).then(setSubCategories).catch(() => {});
    }
  }, [bulkCategoryId]);

  // Load items when a subcategory is chosen for bulk
  useEffect(() => {
    setItems([]);
    setBulkItemId('');
    if (bulkSubCategoryId !== '') {
      api.getItems(bulkSubCategoryId as number).then(setItems).catch(() => {});
    }
  }, [bulkSubCategoryId]);

  const resetBulkValues = () => {
    setBulkCategoryId(''); setBulkSubCategoryId(''); setBulkItemId('');
    setBulkNotes(''); setBulkPaymentMode('');
    setSubCategories([]); setItems([]);
  };

  const handleBulkFieldChange = (f: BulkField | '') => {
    setBulkField(f);
    resetBulkValues();
  };

  const isBulkApplyDisabled = () => {
    if (selectedIds.size === 0 || bulkField === '') return true;
    if (bulkField === 'category'     && bulkCategoryId === '') return true;
    if (bulkField === 'subcategory'  && bulkSubCategoryId === '') return true;
    if (bulkField === 'item'         && bulkItemId === '') return true;
    if (bulkField === 'notes'        && bulkNotes.trim() === '') return true;
    if (bulkField === 'payment_mode' && bulkPaymentMode === '') return true;
    return false;
  };

  const handleBulkUpdate = async () => {
    if (isBulkApplyDisabled()) return;
    setBulkLoading(true);
    try {
      const fields: Record<string, unknown> = {};
      if (bulkField === 'category')     fields['category_id']    = bulkCategoryId;
      if (bulkField === 'subcategory')  fields['subcategory_id'] = bulkSubCategoryId;
      if (bulkField === 'item')         fields['item_id']        = bulkItemId;
      if (bulkField === 'notes')        fields['notes']          = bulkNotes;
      if (bulkField === 'payment_mode') fields['payment_mode']   = bulkPaymentMode;

      await api.bulkUpdate(Array.from(selectedIds), fields);
      showToast(`Updated ${bulkField.replace('_', ' ')} for ${selectedIds.size} expense(s)`, 'success');
      setSelectedIds(new Set());
      setBulkField('');
      resetBulkValues();
      fetchExpenses(currentPage, filters);
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
      showToast('Expense deleted successfully!', 'success');
      fetchExpenses(currentPage);
    } catch (error) {
      console.error('Failed to delete expense:', error);
      showToast('Failed to delete expense.', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === expenses.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(expenses.map(e => e.id)));
  };

  const handleRowClick = (e: React.MouseEvent, id: number) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    navigate(`/transaction/${id}?type=EXPENSE`);
  };

  if (isLoading) return <div className="space-y-6"><TableSkeleton rows={5} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3 shrink-0">
          <div className="bg-gradient-to-br from-rose-500 to-pink-600 p-2 rounded-xl shadow-lg shadow-rose-500/20">
            <ArrowDownRight className="w-5 h-5 text-white" />
          </div>
          Expenses
        </h1>

        {/* Inline bulk controls — visible only when rows are selected */}
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

            {bulkField === 'payment_mode' && (
              <select className={selectClass} value={bulkPaymentMode} onChange={e => setBulkPaymentMode(e.target.value)}>
                <option value="">Select payment mode…</option>
                <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="UPI">UPI</option>
                  <option value="EMANDATE">E-Mandate</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="WALLET">Wallet</option>
              </select>
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
          {/* Column Chooser */}
          <div className="relative" ref={columnDropdownRef}>
            <button
              onClick={() => setIsColumnChooserOpen(!isColumnChooserOpen)}
              className="flex items-center gap-2 px-3 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-slate-700 dark:text-slate-300"
              title="Choose Columns"
            >
              <Columns className="w-5 h-5" />
            </button>

            {isColumnChooserOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700/60 z-20 py-2">
                <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Visible Columns
                </div>
                <div className="flex flex-col max-h-64 overflow-y-auto">
                  {AVAILABLE_COLUMNS.map(col => (
                    <label key={col.key} className="flex items-center gap-3 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

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
            className="flex items-center gap-2 bg-gradient-to-r from-rose-500 to-pink-600 text-white py-2.5 px-5 rounded-xl shadow-lg shadow-rose-500/20 hover:from-rose-400 hover:to-pink-500 transition-all font-medium text-sm whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add Expense</span>
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
                    checked={expenses.length > 0 && selectedIds.size === expenses.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                  />
                </th>
                {visibleColumns.has('date') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>}
                {visibleColumns.has('description') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>}
                {visibleColumns.has('category') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>}
                {visibleColumns.has('subcategory') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sub Category</th>}
                {visibleColumns.has('item') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</th>}
                {visibleColumns.has('payment_mode') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Mode</th>}
                {visibleColumns.has('notes') && <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Notes</th>}
                {visibleColumns.has('amount') && <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>}
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {expenses.map((expense) => (
                <tr key={expense.id} onClick={(e) => handleRowClick(e, expense.id)} className={`hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors duration-150 group cursor-pointer ${selectedIds.has(expense.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(expense.id)}
                      onChange={() => toggleSelect(expense.id)}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                    />
                  </td>
                  {visibleColumns.has('date') && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">{new Date(expense.transaction_time).toLocaleDateString()}</td>}
                  {visibleColumns.has('description') && <td className="px-6 py-4 space-y-1">
                    <div className="text-sm font-medium text-slate-800 dark:text-slate-200">{expense.description}</div>
                  </td>}
                  {visibleColumns.has('category') && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {expense.category?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{expense.category.name}</span>
                    )}
                  </td>}
                  {visibleColumns.has('subcategory') && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {expense.subcategory?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{expense.subcategory.name}</span>
                    )}
                  </td>}
                  {visibleColumns.has('item') && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {expense.item?.name && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{expense.item.name}</span>
                    )}
                  </td>}
                  {visibleColumns.has('payment_mode') && <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                    {(expense as any).payment_mode && (
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{(expense as any).payment_mode.replace('_', ' ')}</span>
                    )}
                  </td>}
                  {visibleColumns.has('notes') && <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={expense.notes}>
                    {expense.notes}
                  </td>}
                  {visibleColumns.has('amount') && <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-rose-500 dark:text-rose-400">-₹{expense.value.toLocaleString()}</td>}
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => onEdit(expense)}
                        className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense.id)}
                        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No expenses found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
          {expenses.map(expense => (
            <div key={expense.id} onClick={(e) => handleRowClick(e, expense.id)} className={`p-4 cursor-pointer ${selectedIds.has(expense.id) ? 'bg-cyan-50 dark:bg-cyan-500/5' : ''}`}>
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={selectedIds.has(expense.id)}
                  onChange={() => toggleSelect(expense.id)}
                  className="mt-1.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    {visibleColumns.has('description') && <span className="text-sm font-medium text-slate-800 dark:text-slate-200 mr-2">{expense.description}</span>}
                    {visibleColumns.has('amount') && <span className="text-sm font-semibold text-rose-500 dark:text-rose-400 whitespace-nowrap">-₹{expense.value.toLocaleString()}</span>}
                  </div>
                  {visibleColumns.has('date') && <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">{new Date(expense.transaction_time).toLocaleDateString()}</div>}
                  {visibleColumns.has('category') && expense.category?.name && (
                    <div className="mt-2">
                      <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700/50 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300">{expense.category.name}</span>
                    </div>
                  )}
                  {visibleColumns.has('subcategory') && expense.subcategory?.name && (
                    <div className="mt-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded text-xs text-slate-500 dark:text-slate-400">Sub: {expense.subcategory.name}</span>
                    </div>
                  )}
                  {visibleColumns.has('item') && expense.item?.name && (
                    <div className="mt-1.5">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded text-xs text-slate-500 dark:text-slate-400">Item: {expense.item.name}</span>
                    </div>
                  )}
                  {visibleColumns.has('payment_mode') && (expense as any).payment_mode && (
                    <div className="mt-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-400">Mode: {(expense as any).payment_mode.replace('_', ' ')}</span>
                    </div>
                  )}
                  {visibleColumns.has('notes') && expense.notes && (
                    <div className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 break-words line-clamp-2">
                      {expense.notes}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-end gap-1 mt-2">
                <button onClick={() => onEdit(expense)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 text-slate-400 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors" title="Edit">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(expense.id)} className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500">No expenses found</div>
          )}
        </div>
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} hasMore={hasMore} onPageChange={setCurrentPage} />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
      />
    </div>
  );
};

export default Expenses;