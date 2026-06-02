import React, { useState, useEffect, useRef } from 'react';
import { personalizationSync } from '../services/personalizationSync';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction, TransactionType, Category, SubCategory, Item, CreditCard, Saving, Revolving, InvestmentGoal } from '../types';
import { PAYMENT_MODES, SAVING_DIRECTIONS, REVOLVING_DIRECTIONS, REVOLVING_STATUSES } from '../constants';
import {
  Landmark,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  RefreshCw,
  PlusCircle,
  Pencil,
  Trash2,
  Columns,
  ChevronDown,
  ListChecks,
  ArrowUp,
  ArrowDown,
  Download
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import Pagination from '../components/Pagination';
import { TableSkeleton } from '../components/Skeleton';
import { FilterMenu, FilterCriteria, FilterChips } from '../components/FilterMenu';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CategoryIcon from '../components/CategoryIcon';
import ExportModal from '../components/ExportModal';

interface TransactionsProps {
  onEdit: (transaction: Transaction) => void;
  onAdd: (defaultType?: TransactionType) => void;
  refreshTrigger: number;
}

type TabType = 'all' | 'expense' | 'income' | 'saving' | 'revolving';

const TABS: { id: TabType; label: string; icon: any; color: string }[] = [
  { id: 'all', label: 'All Transactions', icon: Landmark, color: 'from-slate-500 to-slate-600' },
  { id: 'expense', label: 'Expenses', icon: TrendingDown, color: 'from-rose-500 to-pink-600' },
  { id: 'income', label: 'Incomes', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
  { id: 'saving', label: 'Savings', icon: PiggyBank, color: 'from-violet-500 to-purple-600' },
  { id: 'revolving', label: 'Revolving', icon: RefreshCw, color: 'from-blue-500 to-cyan-600' },
];

type BulkField = 'category' | 'subcategory' | 'item' | 'notes' | 'payment_mode' | 'is_in' | 'is_give' | 'closed' | 'credit_card' | 'funding_goal';

type ColumnKey = 'date' | 'description' | 'category' | 'subcategory' | 'item' | 'amount' | 'type' | 'payment_mode' | 'is_in' | 'is_give' | 'closed' | 'notes';

const ALL_COLUMNS: { key: ColumnKey; label: string }[] = [
  { key: 'date', label: 'Date' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'subcategory', label: 'Sub Category' },
  { key: 'item', label: 'Item' },
  { key: 'payment_mode', label: 'Payment Mode' },
  { key: 'is_in', label: 'In/Out' },
  { key: 'is_give', label: 'Give/Receive' },
  { key: 'closed', label: 'Status' },
  { key: 'notes', label: 'Notes' },
  { key: 'amount', label: 'Amount' },
];

const selectClass = "px-3 py-2 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 rounded-xl text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all";

const Transactions: React.FC<TransactionsProps> = ({ onEdit, onAdd, refreshTrigger }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const currentTab = (searchParams.get('type') as TabType) || 'all';
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria[]>(() => {
    const fromUrl = searchParams.get('filters');
    if (fromUrl) {
      try {
        return JSON.parse(decodeURIComponent(fromUrl));
      } catch (e) {
        console.error("Failed to parse filters from URL", e);
      }
    }
    const saved = localStorage.getItem('gringotts_transaction_filters');
    return saved ? JSON.parse(saved) : [];
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<ColumnKey>>(() => {
    const saved = localStorage.getItem(`gringotts_columns_${currentTab}`);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch (e) {
        return new Set(['date', 'description', 'amount']);
      }
    }
    return new Set(['date', 'description', 'amount']);
  });
  const [isColumnChooserOpen, setIsColumnChooserOpen] = useState(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const tabMenuRef = useRef<HTMLDivElement>(null);
  const [isTabMenuOpen, setIsTabMenuOpen] = useState(false);

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
  const [bulkIsIn, setBulkIsIn] = useState(true);
  const [bulkIsGive, setBulkIsGive] = useState(true);
  const [bulkClosed, setBulkClosed] = useState(false);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [bulkCreditCardId, setBulkCreditCardId] = useState<number | ''>('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [isBulkEditDialogOpen, setIsBulkEditDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkFundingGoalId, setBulkFundingGoalId] = useState<number | ''>('');
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);

  const getAvailableBalance = (g: InvestmentGoal) => {
    if (g.goal_type === 'ONE_TIME') {
      return g.current_amount - (g.total_funded ?? 0);
    }
    return g.current_amount;
  };



  // Set default columns based on tab or load from memory
  useEffect(() => {
    const saved = localStorage.getItem(`gringotts_columns_${currentTab}`);
    if (saved) {
      try {
        setVisibleColumns(new Set(JSON.parse(saved)));
      } catch (e) {
        // Fallback to defaults
        setDefaultColumns();
      }
    } else {
      setDefaultColumns();
    }
    setCurrentPage(1);
  }, [currentTab]);

  const setDefaultColumns = () => {
    const cols = new Set<ColumnKey>(['date', 'description', 'category', 'amount']);
    if (currentTab === 'all') cols.add('type');
    if (currentTab === 'expense') cols.add('payment_mode');
    if (currentTab === 'saving') cols.add('is_in');
    if (currentTab === 'revolving') {
      cols.add('is_give');
      cols.add('closed');
    }
    setVisibleColumns(cols);
  };

  const fetchTransactions = async (page: number, currentFilters: FilterCriteria[] = []) => {
    setIsLoading(true);
    // Strip label field as it's only for client-side display
    const cleanedFilters = currentFilters.map(({ field, condition, value }) => ({ field, condition, value }));

    try {
      let response;
      switch (currentTab) {
        case 'expense': response = await api.getExpenses(page, cleanedFilters, sortDirection); break;
        case 'income': response = await api.getIncomes(page, cleanedFilters, sortDirection); break;
        case 'saving': response = await api.getSavings(page, cleanedFilters, sortDirection); break;
        case 'revolving': response = await api.getRevolvings(page, cleanedFilters, sortDirection); break;
        default: response = await api.getTransactions(page, cleanedFilters, sortDirection); break;
      }
      setTransactions(response.data);
      setTotalPages(Math.ceil(response.total_count / 10));
      setHasMore(response.has_more);
    } catch (error: any) {
      console.error("Failed to fetch transactions:", error);
      showToast(error.message || "Failed to fetch transactions.", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(currentPage, filters);
    setSelectedIds(new Set());
  }, [currentPage, filters, refreshTrigger, currentTab, sortDirection]);

  // Persist filters to localStorage
  useEffect(() => {
    const value = JSON.stringify(filters);
    localStorage.setItem('gringotts_transaction_filters', value);
    personalizationSync.save('FILTERS', 'TRANSACTION', value);
  }, [filters]);

  // Persist columns to localStorage
  useEffect(() => {
    if (visibleColumns.size > 0) {
      const value = JSON.stringify(Array.from(visibleColumns));
      localStorage.setItem(`gringotts_columns_${currentTab}`, value);
      personalizationSync.save('COLUMNS', currentTab.toUpperCase(), value);
    }
  }, [visibleColumns, currentTab]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tabMenuRef.current && !tabMenuRef.current.contains(event.target as Node)) {
        setIsTabMenuOpen(false);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target as Node)) {
        setIsColumnChooserOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load categories for bulk
  useEffect(() => {
    if (bulkField === 'category' || bulkField === 'subcategory' || bulkField === 'item') {
      const typeMap: Record<TabType, TransactionType | undefined> = {
        all: undefined,
        expense: TransactionType.EXPENSE,
        income: TransactionType.INCOME,
        saving: TransactionType.SAVING,
        revolving: TransactionType.REVOLVING
      };
      api.getCategories(typeMap[currentTab]).then(setCategories).catch(() => { });
    }
  }, [bulkField, currentTab]);

  useEffect(() => {
    if (isBulkEditDialogOpen && bulkField === 'funding_goal' && goals.length === 0) {
      api.getGoals().then(res => setGoals(res.data)).catch(() => { });
    }
  }, [isBulkEditDialogOpen, bulkField, goals.length]);

  useEffect(() => {
    if (bulkCategoryId !== '') {
      api.getSubCategories(bulkCategoryId as number).then(setSubCategories).catch(() => { });
    } else {
      setSubCategories([]);
    }
  }, [bulkCategoryId]);

  useEffect(() => {
    if (bulkSubCategoryId !== '') {
      api.getItems(bulkSubCategoryId as number).then(setItems).catch(() => { });
    } else {
      setItems([]);
    }
  }, [bulkSubCategoryId]);

  const handleTabChange = (tab: TabType) => {
    setSearchParams({ type: tab });
    setIsTabMenuOpen(false);
    setIsSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleColumn = (key: ColumnKey) => {
    setVisibleColumns(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleBulkUpdate = async () => {
    if (selectedIds.size === 0 || !bulkField) return;
    setBulkLoading(true);
    try {
      const fields: Record<string, unknown> = {};
      if (bulkField === 'category') fields['category_id'] = bulkCategoryId;
      if (bulkField === 'subcategory') fields['subcategory_id'] = bulkSubCategoryId;
      if (bulkField === 'item') fields['item_id'] = bulkItemId;
      if (bulkField === 'notes') fields['notes'] = bulkNotes;
      if (bulkField === 'payment_mode') fields['payment_mode'] = bulkPaymentMode;
      if (bulkField === 'is_in') fields['is_in'] = bulkIsIn;
      if (bulkField === 'is_give') fields['is_give'] = bulkIsGive;
      if (bulkField === 'closed') fields['closed'] = bulkClosed;
      if (bulkField === 'credit_card') fields['credit_card'] = { id: bulkCreditCardId };
      if (bulkField === 'funding_goal') fields['funding_goal_id'] = bulkFundingGoalId === '' ? null : bulkFundingGoalId;

      await api.bulkUpdate(Array.from(selectedIds), fields);
      showToast(`Updated ${bulkField.replace('_', ' ')} for ${selectedIds.size} transaction(s)`, 'success');
      setSelectedIds(new Set());
      setBulkField('');
      setBulkFundingGoalId('');
      setIsBulkEditDialogOpen(false);
      fetchTransactions(currentPage, filters);
    } catch (error: any) {
      showToast(error.message || 'Failed to bulk update.', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (deletingId === null) return;
    try {
      await api.deleteTransaction(deletingId);
      showToast('Transaction deleted successfully!', 'success');
      fetchTransactions(currentPage, filters);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete transaction.', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const confirmBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      await api.bulkDelete(Array.from(selectedIds));
      showToast(`Deleted ${selectedIds.size} transaction(s) successfully!`, 'success');
      setSelectedIds(new Set());
      fetchTransactions(currentPage, filters);
    } catch (error: any) {
      showToast(error.message || 'Failed to delete transactions.', 'error');
    } finally {
      setBulkLoading(false);
      setIsBulkDeleteDialogOpen(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(transactions.map(t => t.id)));
  };

  const activeTabInfo = TABS.find(t => t.id === currentTab) || TABS[0];

  const pageTotal = transactions.reduce((acc, t) => {
    const val = t.value;
    if (t.type === TransactionType.INCOME) return acc + val;
    if (t.type === TransactionType.EXPENSE) return acc - val;
    if (t.type === TransactionType.SAVING) return (t as Saving).is_in ? acc + val : acc - val;
    if (t.type === TransactionType.REVOLVING) return (t as Revolving).is_give ? acc - val : acc + val;
    return acc;
  }, 0);

  const getAmountColor = (t: Transaction) => {
    if (t.type === 'INCOME') return 'text-emerald-500 dark:text-emerald-400';
    if (t.type === 'EXPENSE') return 'text-rose-500 dark:text-rose-400';
    if (t.type === 'SAVING') {
      return (t as any).is_in ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
    }
    if (t.type === 'REVOLVING') {
      return (t as any).is_give ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400';
    }
    return 'text-slate-700 dark:text-slate-300';
  };

  const getAmountSign = (t: Transaction) => {
    if (t.type === 'INCOME') return '+';
    if (t.type === 'EXPENSE') return '-';
    if (t.type === 'SAVING') return (t as any).is_in ? '+' : '-';
    if (t.type === 'REVOLVING') return (t as any).is_give ? '-' : '+';
    return '';
  };

  const getAvailableFields = () => {
    const baseFields: { label: string; value: string; type: 'string' | 'number' | 'date' | 'boolean'; options?: { label: string, value: string }[]; fetchOptions?: (page: number) => Promise<{ data: { label: string; value: string }[], hasMore: boolean }> }[] = [
      { label: 'Date', value: 'transaction_time', type: 'date' },
      { label: 'Description', value: 'description', type: 'string' },
      { label: 'Amount', value: 'value', type: 'number' },
      {
        label: 'Category', value: 'category.id', type: 'number',
        fetchOptions: async (page) => {
          const type = currentTab !== 'all' ? currentTab.toUpperCase() : undefined;
          const res = await api.getCategoriesPaginated(page, type);
          return { data: res.data.map(c => ({ label: c.name, value: c.id.toString() })), hasMore: res.has_more };
        }
      },
      {
        label: 'Sub-Category', value: 'subcategory.id', type: 'number',
        fetchOptions: async (page) => {
          const type = currentTab !== 'all' ? currentTab.toUpperCase() : undefined;
          const res = await api.getAllSubCategoriesPaginated(page, type);
          return { data: res.data.map(sc => ({ label: sc.name, value: sc.id.toString() })), hasMore: res.has_more };
        }
      },
      {
        label: 'Item', value: 'item.id', type: 'number',
        fetchOptions: async (page) => {
          const type = currentTab !== 'all' ? currentTab.toUpperCase() : undefined;
          const res = await api.getAllItemsPaginated(page, type);
          return { data: res.data.map(i => ({ label: i.name, value: i.id.toString() })), hasMore: res.has_more };
        }
      },
      { label: 'Notes', value: 'notes', type: 'string' },
    ];

    baseFields.push({
      label: 'Payment Mode', value: 'payment_mode', type: 'string',
      options: PAYMENT_MODES
    });
    baseFields.push({
      label: 'Credit Card', value: 'credit_card.id', type: 'number',
      fetchOptions: async (page) => {
        const res = await api.getCreditCards();
        return { data: res.data.map(c => ({ label: c.nickname, value: c.id!.toString() })), hasMore: false };
      }
    });

    if (currentTab === 'saving') {
      baseFields.push({ label: 'Direction', value: 'is_in', type: 'boolean', options: SAVING_DIRECTIONS });
    } else if (currentTab === 'revolving') {
      baseFields.push({ label: 'Direction', value: 'is_give', type: 'boolean', options: REVOLVING_DIRECTIONS });
      baseFields.push({ label: 'Status', value: 'closed', type: 'boolean', options: REVOLVING_STATUSES });
    }
    return baseFields;
  };

  const handleRowClick = (e: React.MouseEvent, transaction: Transaction) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;

    if (isSelectionMode || selectedIds.size > 0) {
      const next = new Set(selectedIds);
      if (next.has(transaction.id)) next.delete(transaction.id);
      else next.add(transaction.id);
      setSelectedIds(next);
      return;
    }

    navigate(`/transaction/${transaction.id}?type=${transaction.type}`);
  };

  if (isLoading && transactions.length === 0) return <div className="space-y-6"><TableSkeleton rows={8} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full justify-between">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Dropdown Tab Selector */}
          <div className={`relative grow sm:grow-0 sm:min-w-[240px] ${selectedIds.size > 0 ? 'hidden sm:block' : ''}`} ref={tabMenuRef}>
            <button
              onClick={() => setIsTabMenuOpen(!isTabMenuOpen)}
              className={`w-full flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 shadow-sm hover:shadow-md transition-all ${isTabMenuOpen ? 'ring-2 ring-cyan-500/20 border-cyan-500/50' : ''}`}
            >
              <div className={`p-2 rounded-xl bg-gradient-to-br ${activeTabInfo.color} shadow-lg shadow-slate-500/10`}>
                <activeTabInfo.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-left pr-8">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-bold">Viewing</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">{activeTabInfo.label}</p>
              </div>
              <ChevronDown className={`absolute right-4 w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform ${isTabMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isTabMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-2xl z-50 py-2 p-1 overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-slate-900/90 animate-in fade-in slide-in-from-top-2">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${currentTab === tab.id ? 'bg-slate-100 dark:bg-slate-800 text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}`}
                  >
                    <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? 'text-cyan-500' : 'text-slate-400'}`} />
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onAdd(currentTab === 'all' ? undefined : (currentTab.toUpperCase() as any))}
            className={`flex items-center justify-center gap-2 text-white py-3 px-5 rounded-2xl transition-all font-bold text-sm shrink-0 shadow-lg ${selectedIds.size > 0 ? 'hidden sm:flex' : ''}`}
            style={{
              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.filter = 'brightness(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.filter = 'none';
            }}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>

          {/* Bulk Actions */}
          {selectedIds.size > 0 && (
            <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-cyan-500/5 dark:bg-cyan-500/10 border border-cyan-500/20 rounded-2xl animate-in fade-in slide-in-from-left-4 w-full sm:w-auto">
              <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 px-2 sm:px-3 uppercase tracking-tight shrink-0">
                {selectedIds.size} Selected
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2 grow sm:grow-0 justify-end sm:justify-start">
                <button
                  onClick={() => setIsBulkEditDialogOpen(true)}
                  className="px-3 sm:px-4 py-2 bg-cyan-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all uppercase tracking-widest text-center"
                >
                  Edit
                </button>
                <button
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  className="px-3 sm:px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/20 hover:bg-rose-400 transition-all uppercase tracking-widest text-center"
                >
                  Delete
                </button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-[10px] text-slate-400 hover:text-slate-600 px-1 sm:px-2 uppercase font-bold tracking-tighter shrink-0"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
        {/* Right Section Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative hidden lg:block" ref={columnDropdownRef}>
            <button
              onClick={() => setIsColumnChooserOpen(!isColumnChooserOpen)}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500"
            >
              <Columns className="w-5 h-5" />
            </button>
            {isColumnChooserOpen && (
              <div className="absolute right-0 mt-2 w-56 glass rounded-2xl shadow-2xl py-3 z-50 border border-slate-200 dark:border-slate-800">
                <p className="px-4 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle Columns</p>
                <div className="max-h-64 overflow-y-auto px-1">
                  {ALL_COLUMNS.map(col => (
                    <label key={col.key} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        className="w-4 h-4 rounded accent-cyan-500"
                      />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{col.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          

          <FilterMenu
            activeFilters={filters}
            availableFields={getAvailableFields()}
            onApplyFilters={(f) => { setFilters(f); setCurrentPage(1); }}
          />

          <button
            onClick={() => {
              setSortDirection(prev => prev === 'ASC' ? 'DESC' : 'ASC');
              setCurrentPage(1);
            }}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 flex items-center gap-2 group"
            title={`Sort by Date: ${sortDirection === 'DESC' ? 'Newest First' : 'Oldest First'}`}
          >
            {sortDirection === 'DESC' ? (
              <ArrowDown className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            ) : (
              <ArrowUp className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
            )}
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500 flex items-center gap-2 group"
            title="Export Transactions"
          >
            <Download className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
          </button>



          {currentTab !== 'all' && (
            <button
              onClick={() => {
                const newMode = !isSelectionMode;
                setIsSelectionMode(newMode);
                if (!newMode) setSelectedIds(new Set());
              }}
              className={`lg:hidden flex items-center justify-center p-3 rounded-2xl border transition-all ${isSelectionMode ? 'bg-cyan-500 text-white border-cyan-500 shadow-lg shadow-cyan-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'}`}
              title="Select Mode"
            >
              <ListChecks className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 px-3 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/50 animate-in fade-in slide-in-from-top-1">
          <FilterChips
            activeFilters={filters}
            availableFields={getAvailableFields()}
            onRemoveFilter={(idx) => {
              const newFilters = filters.filter((_, i) => i !== idx);
              setFilters(newFilters);
              setCurrentPage(1);
            }}
          />
          <button
            onClick={() => { setFilters([]); setCurrentPage(1); }}
            className="ml-auto text-[10px] font-black text-rose-500 uppercase tracking-widest px-3 py-1.5 hover:bg-rose-500/10 rounded-lg transition-colors whitespace-nowrap"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="glass overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/50">
        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="group border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50">
                <th className={`transition-all duration-300 overflow-hidden ${currentTab !== 'all' && (isSelectionMode || selectedIds.size > 0) ? 'w-14 opacity-100' : 'w-0 opacity-0'}`}>
                  {currentTab !== 'all' && (
                    <div className="flex justify-center items-center w-14 p-4">
                      <input type="checkbox" checked={selectedIds.size === transactions.length && transactions.length > 0} onChange={toggleSelectAll} className="w-4 h-4 rounded accent-cyan-500 cursor-pointer" />
                    </div>
                  )}
                </th>
                {visibleColumns.has('date') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Date</th>}
                {visibleColumns.has('description') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Description</th>}
                {visibleColumns.has('type') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Type</th>}
                {visibleColumns.has('category') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category</th>}
                {visibleColumns.has('subcategory') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Sub-Cat</th>}
                {visibleColumns.has('item') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Item</th>}
                {visibleColumns.has('payment_mode') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Payment</th>}
                {visibleColumns.has('is_in') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">In/Out</th>}
                {visibleColumns.has('is_give') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Give/Recv</th>}
                {visibleColumns.has('closed') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Status</th>}
                {visibleColumns.has('notes') && <th className="p-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Notes</th>}
                {visibleColumns.has('amount') && <th className="p-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>}
                <th className="p-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/20">
              {transactions.map(t => (
                <tr
                  key={t.id}
                  onClick={(e) => handleRowClick(e, t)}
                  className={`group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${selectedIds.has(t.id) ? 'bg-cyan-500/5' : ''}`}
                >
                  <td className={`transition-all duration-300 overflow-hidden ${currentTab !== 'all' && (isSelectionMode || selectedIds.size > 0) ? 'w-14' : (currentTab !== 'all' ? 'w-0 group-hover:w-14' : 'w-0')}`}>
                    {currentTab !== 'all' && (
                      <div className={`flex justify-center items-center w-14 p-4 transition-opacity duration-300 ${isSelectionMode || selectedIds.size > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <input type="checkbox" checked={selectedIds.has(t.id)} onChange={() => {
                          const next = new Set(selectedIds);
                          if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                          setSelectedIds(next);
                        }} className="w-4 h-4 rounded accent-cyan-500 cursor-pointer" />
                      </div>
                    )}
                  </td>
                  {visibleColumns.has('date') && (
                    <td className="p-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{new Date(t.transaction_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</p>
                      <p className="text-[10px] text-slate-400 font-medium">#{t.id}</p>
                    </td>
                  )}
                  {visibleColumns.has('description') && (
                    <td className="p-4 min-w-[200px]">
                      <div className="flex items-center gap-3">
                        <CategoryIcon category={t.category} />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">{t.description}</span>
                          {t.funding_goal && (
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="px-2 py-0.5 bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400 text-[9px] font-black rounded-md flex items-center gap-1 border border-violet-500/20">
                                <span>{t.funding_goal.icon || '🎯'}</span>
                                <span>{t.funding_goal.name}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {visibleColumns.has('type') && (
                    <td className="p-4">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${t.type === 'EXPENSE' ? 'bg-rose-500/10 text-rose-500' :
                        t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' :
                          t.type === 'SAVING' ? 'bg-violet-500/10 text-violet-500' :
                            'bg-blue-500/10 text-blue-500'
                        }`}>
                        {t.type}
                      </span>
                    </td>
                  )}
                  {visibleColumns.has('category') && (
                    <td className="p-4 whitespace-nowrap">
                      {t.category && <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{t.category.name}</span>}
                    </td>
                  )}
                  {visibleColumns.has('subcategory') && (
                    <td className="p-4 whitespace-nowrap">
                      {t.subcategory && <span className="text-[10px] font-medium text-slate-400">{t.subcategory.name}</span>}
                    </td>
                  )}
                  {visibleColumns.has('item') && (
                    <td className="p-4 whitespace-nowrap">
                      {(t as any).item && <span className="text-[10px] font-medium text-slate-400">{(t as any).item.name}</span>}
                    </td>
                  )}
                  {visibleColumns.has('payment_mode') && (
                    <td className="p-4 whitespace-nowrap">
                      {(t as any).payment_mode && <span className="text-[10px] font-bold text-slate-400 uppercase">{(t as any).payment_mode.replace('_', ' ')}</span>}
                    </td>
                  )}
                  {visibleColumns.has('is_in') && (
                    <td className="p-4 whitespace-nowrap">
                      {typeof (t as any).is_in !== 'undefined' && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${(t as any).is_in ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
                          {(t as any).is_in ? 'In' : 'Out'}
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has('is_give') && (
                    <td className="p-4 whitespace-nowrap">
                      {typeof (t as any).is_give !== 'undefined' && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${(t as any).is_give ? 'text-blue-500 bg-blue-500/10' : 'text-violet-500 bg-violet-500/10'}`}>
                          {(t as any).is_give ? 'Given' : 'Received'}
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has('closed') && (
                    <td className="p-4 whitespace-nowrap">
                      {typeof (t as any).closed !== 'undefined' && (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${(t as any).closed ? 'text-slate-500 bg-slate-500/10' : 'text-amber-500 bg-amber-500/10'}`}>
                          {(t as any).closed ? 'Closed' : 'Active'}
                        </span>
                      )}
                    </td>
                  )}
                  {visibleColumns.has('notes') && (
                    <td className="p-4 min-w-[150px]">
                      {t.notes && <span className="text-[10px] text-slate-400 line-clamp-1" title={t.notes}>{t.notes}</span>}
                    </td>
                  )}
                  {visibleColumns.has('amount') && (
                    <td className={`p-4 text-right font-bold tabular-nums whitespace-nowrap ${getAmountColor(t)}`}>
                      {getAmountSign(t)}₹{t.value.toLocaleString('en-IN')}
                    </td>
                  )}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 rounded-lg transition-all"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => { setDeletingId(t.id); setIsDeleteDialogOpen(true); }} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View: Card List */}
        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/20">
          {transactions.length === 0 ? (
            <div className="p-10 text-center text-slate-500 font-medium">No transactions found.</div>
          ) : (
            transactions.map(t => (
              <div
                key={t.id}
                onClick={(e) => handleRowClick(e, t)}
                className={`group p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer ${selectedIds.has(t.id) ? 'bg-cyan-500/5' : ''}`}
              >
                <div className="flex items-start">
                  {currentTab !== 'all' && (
                    <div className={`transition-all duration-300 overflow-hidden ${isSelectionMode || selectedIds.size > 0 ? 'w-10 opacity-100' : 'w-0 opacity-0'}`}>
                      <div className="pt-1 pr-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(t.id)}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            e.stopPropagation();
                            const next = new Set(selectedIds);
                            if (next.has(t.id)) next.delete(t.id); else next.add(t.id);
                            setSelectedIds(next);
                          }}
                          className="w-5 h-5 rounded-lg accent-cyan-500 border-2 border-slate-300 dark:border-slate-600 focus:ring-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <CategoryIcon category={t.category} size="sm" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.description}</span>
                      </div>
                      <div className={`text-sm font-black tabular-nums whitespace-nowrap ${getAmountColor(t)}`}>
                        {getAmountSign(t)}₹{t.value.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{new Date(t.transaction_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                        <span>•</span>
                        <span className="text-slate-500">{t.category?.name || 'Uncategorized'}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md ${t.type === 'EXPENSE' ? 'bg-rose-500/10 text-rose-500' :
                        t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' :
                          t.type === 'SAVING' ? 'bg-violet-500/10 text-violet-500' :
                            'bg-blue-500/10 text-blue-500'
                        }`}>
                        {t.type}
                      </span>
                    </div>

                    {((t as any).payment_mode || t.notes || t.funding_goal) && (
                      <div className="pt-0.5 flex gap-2 flex-wrap animate-in fade-in duration-200">
                        {t.funding_goal && (
                          <span className="px-1.5 py-0.5 bg-violet-500/10 text-violet-500 dark:bg-violet-500/20 dark:text-violet-400 text-[9px] font-black rounded border border-violet-500/20 flex items-center gap-1">
                            <span>{t.funding_goal.icon || '🎯'}</span>
                            <span>{t.funding_goal.name}</span>
                          </span>
                        )}
                        {(t as any).payment_mode && (
                          <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] text-slate-500 rounded border border-slate-200 dark:border-slate-700">
                            {(t as any).payment_mode.replace('_', ' ')}
                          </span>
                        )}
                        {t.notes && (
                          <div className="w-full text-xs text-slate-400 italic line-clamp-1 mt-1 font-medium bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl">
                            {t.notes.substring(0, 25) + (t.notes.length > 25 ? '...' : '')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {currentTab !== 'all' && transactions.length > 0 && (
          <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between lg:justify-end items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Page Total</span>
            <span className={`text-lg font-black tabular-nums ${pageTotal >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {pageTotal >= 0 ? '+' : '-'}₹{Math.abs(pageTotal).toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>

      <Pagination currentPage={currentPage} totalPages={totalPages} hasMore={hasMore} onPageChange={setCurrentPage} />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this record? This cannot be undone."
      />

      {/* Bulk Edit Dialog */}
      {isBulkEditDialogOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-800 scale-in-center">
            <div className="mb-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">Bulk Edit</h3>
              <p className="text-sm font-medium text-slate-500">Updating {selectedIds.size} transaction(s)</p>
            </div>

            <div className="space-y-4 mb-8">
              <select
                className={`${selectClass} w-full`}
                value={bulkField}
                onChange={e => {
                  setBulkField(e.target.value as BulkField | '');
                  setBulkFundingGoalId('');
                }}
              >
                <option value="">Choose Field…</option>
                <option value="category">Category</option>
                <option value="subcategory">Sub-Category</option>
                <option value="item">Item</option>
                <option value="notes">Notes</option>
                <option value="payment_mode">Payment Mode</option>
                <option value="credit_card">Credit Card</option>
                {currentTab !== 'income' && currentTab !== 'all' && (
                  <option value="funding_goal">Fund from Goal</option>
                )}
                {currentTab === 'saving' && <option value="is_in">In/Out</option>}
                {currentTab === 'revolving' && (
                  <>
                    <option value="is_give">Give/Receive</option>
                    <option value="closed">Status</option>
                  </>
                )}
              </select>

              {bulkField === 'category' && (
                <select className={`${selectClass} w-full`} value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select Category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}

              {bulkField === 'subcategory' && (
                <>
                  <select className={`${selectClass} w-full`} value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className={`${selectClass} w-full`} value={bulkSubCategoryId} onChange={e => setBulkSubCategoryId(e.target.value ? Number(e.target.value) : '')} disabled={!bulkCategoryId}>
                    <option value="">Sub-Category…</option>
                    {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </>
              )}

              {bulkField === 'item' && (
                <>
                  <select className={`${selectClass} w-full`} value={bulkCategoryId} onChange={e => setBulkCategoryId(e.target.value ? Number(e.target.value) : '')}>
                    <option value="">Category…</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <select className={`${selectClass} w-full`} value={bulkSubCategoryId} onChange={e => setBulkSubCategoryId(e.target.value ? Number(e.target.value) : '')} disabled={!bulkCategoryId}>
                    <option value="">Sub-Category…</option>
                    {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <select className={`${selectClass} w-full`} value={bulkItemId} onChange={e => setBulkItemId(e.target.value ? Number(e.target.value) : '')} disabled={!bulkSubCategoryId}>
                    <option value="">Item…</option>
                    {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                </>
              )}

              {bulkField === 'payment_mode' && (
                <select className={`${selectClass} w-full`} value={bulkPaymentMode} onChange={e => setBulkPaymentMode(e.target.value)}>
                  <option value="">Select Payment Mode…</option>
                  {PAYMENT_MODES.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                </select>
              )}

              {bulkField === 'is_in' && (
                <select className={`${selectClass} w-full`} value={bulkIsIn ? 'true' : 'false'} onChange={e => setBulkIsIn(e.target.value === 'true')}>
                  <option value="">Select Direction…</option>
                  {SAVING_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              )}

              {bulkField === 'is_give' && (
                <select className={`${selectClass} w-full`} value={bulkIsGive ? 'true' : 'false'} onChange={e => setBulkIsGive(e.target.value === 'true')}>
                  <option value="">Select Direction…</option>
                  {REVOLVING_DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              )}

              {bulkField === 'closed' && (
                <select className={`${selectClass} w-full`} value={bulkClosed ? 'true' : 'false'} onChange={e => setBulkClosed(e.target.value === 'true')}>
                  <option value="">Select Status…</option>
                  {REVOLVING_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}

              {bulkField === 'credit_card' && (
                <select
                  className={`${selectClass} w-full`}
                  value={bulkCreditCardId}
                  onChange={e => setBulkCreditCardId(e.target.value ? Number(e.target.value) : '')}
                  onFocus={() => {
                    if (creditCards.length === 0) {
                      api.getCreditCards().then(res => setCreditCards(res.data));
                    }
                  }}
                >
                  <option value="">Select Credit Card…</option>
                  {creditCards.map(cc => <option key={cc.id} value={cc.id}>{cc.nickname} ({cc.issuer})</option>)}
                </select>
              )}

              {bulkField === 'funding_goal' && (
                <select
                  value={bulkFundingGoalId}
                  onChange={(e) => setBulkFundingGoalId(e.target.value ? Number(e.target.value) : '')}
                  className={`${selectClass} w-full`}
                >
                  <option value="">Do not fund from a Goal (Clear funding)</option>
                  {goals
                    .filter(g => !g.is_closed && getAvailableBalance(g) > 0)
                    .map(g => {
                      const available = getAvailableBalance(g);
                      return (
                        <option key={g.id} value={g.id}>
                          {g.icon || '🎯'} {g.name} — Available: ₹{available.toLocaleString('en-IN')} ({g.goal_type === 'ONE_TIME' ? 'One-Time' : 'Persistent'})
                        </option>
                      );
                    })}
                </select>
              )}

              {bulkField === 'notes' && (
                <input
                  type="text"
                  className={`${selectClass} w-full`}
                  placeholder="Enter Notes…"
                  value={bulkNotes}
                  onChange={e => setBulkNotes(e.target.value)}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setIsBulkEditDialogOpen(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors uppercase tracking-widest"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkUpdate}
                disabled={bulkLoading || !bulkField}
                className="px-6 py-2.5 rounded-xl text-sm font-bold bg-cyan-600 text-white shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-colors disabled:opacity-50 uppercase tracking-widest"
              >
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={isBulkDeleteDialogOpen}
        onClose={() => setIsBulkDeleteDialogOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete Transactions"
        message={`Are you sure you want to delete the ${selectedIds.size} selected transaction(s)? This action cannot be undone.`}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        currentTab={currentTab}
        activeFilters={filters}
      />
    </div>
  );
};

export default Transactions;
