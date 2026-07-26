
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, TrendingDown, TrendingUp, PiggyBank, RefreshCw, AlertTriangle, CreditCard as CardIcon, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { Category, SubCategory, Item, TransactionType, Expense, Income, Saving, Revolving, Transaction, CreditCard, InvestmentGoal, Loan, TransactionGroup, GroupCategory } from '../types';
import { useToast } from '../components/ToastContext';
import { PAYMENT_MODES } from '../constants';
import { toLocalISOString } from '../services/dateUtils';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedType: TransactionType, savedId: number) => void;
  transaction?: Transaction | null;
  defaultType?: TransactionType;
  defaultDate?: Date;
  defaultGroupId?: number;
  disableGroupSelection?: boolean;
  allowedTypes?: TransactionType[];
}

type TransactionFormState = Omit<Partial<Transaction>, 'value' | 'credit_card'> & {
  value: string | number;
  payment_mode?: string;
  is_in?: boolean;
  is_give?: boolean;
  closed?: boolean;
  category?: Category;
  subcategory?: SubCategory;
  item?: Item;
  credit_card?: number;
  include_in_budget?: boolean;
  funding_goal_id?: number;
  loan_id?: number;
  group_id?: number;
  group_category?: GroupCategory;
};

const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  transaction,
  defaultType,
  defaultDate,
  defaultGroupId,
  disableGroupSelection,
  allowedTypes
}) => {
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const subCategoryCache = useRef<Record<number, SubCategory[]>>({});
  const itemCache = useRef<Record<number, Item[]>>({});
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [groupCategories, setGroupCategories] = useState<GroupCategory[]>([]);

  const [formData, setFormData] = useState<TransactionFormState>({
    value: 0,
    description: '',
    category: undefined,
    subcategory: undefined,
    item: undefined,
    transaction_time: toLocalISOString(new Date()),
    payment_mode: 'UPI',
    is_in: true,
    is_give: true,
    closed: false,
    notes: '',
    credit_card: undefined,
    include_in_budget: true,
    funding_goal_id: undefined,
    loan_id: undefined,
    group_id: undefined,
    group_category: undefined
  });

  const [loading, setLoading] = useState(false);
  const [showOptional, setShowOptional] = useState(false);

  const getAvailableBalance = (g: InvestmentGoal, currentTx?: Transaction | null) => {
    let baseAvailable = g.current_amount;
    if (g.goal_type === 'ONE_TIME') {
      baseAvailable = g.current_amount - (g.total_funded ?? 0);
    }
    if (currentTx && currentTx.funding_goal?.id === g.id) {
      baseAvailable += Number(currentTx.value);
    }
    return Math.max(baseAvailable, 0);
  };
  const [showTypeChangeConfirm, setShowTypeChangeConfirm] = useState(false);

  const selectedGoalForValidation = formData.funding_goal_id ? goals.find(g => g.id === formData.funding_goal_id) : undefined;
  const isGoalFundingInvalid = selectedGoalForValidation ? (() => {
    const available = getAvailableBalance(selectedGoalForValidation, transaction);
    const txVal = Number(formData.value) || 0;
    return available === 0 || txVal > available;
  })() : false;

  const resetForm = () => {
    setShowOptional(!!defaultGroupId);
    const initialDate = defaultDate ? (() => {
      const dateToUse = new Date(defaultDate);
      const now = new Date();
      dateToUse.setHours(now.getHours(), now.getMinutes(), 0, 0);
      return dateToUse;
    })() : new Date();

    setFormData({
      value: 0,
      description: '',
      category: undefined,
      subcategory: undefined,
      item: undefined,
      transaction_time: toLocalISOString(initialDate),
      payment_mode: 'UPI',
      is_in: true,
      is_give: true,
      closed: false,
      notes: '',
      credit_card: undefined,
      include_in_budget: true,
      funding_goal_id: undefined,
      loan_id: undefined,
      group_id: defaultGroupId || undefined,
      group_category: undefined
    });
    setSubCategories([]);
    setItems([]);
    setShowTypeChangeConfirm(false);
  };

  const getSubCategories = async (categoryId: number) => {
    if (subCategoryCache.current[categoryId]) {
      return subCategoryCache.current[categoryId];
    }
    const subs = await api.getSubCategories(categoryId);
    subCategoryCache.current[categoryId] = subs;
    return subs;
  };

  const getItems = async (subCategoryId: number) => {
    if (itemCache.current[subCategoryId]) {
      return itemCache.current[subCategoryId];
    }
    const its = await api.getItems(subCategoryId);
    itemCache.current[subCategoryId] = its;
    return its;
  };

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (isOpen) {
        setShowTypeChangeConfirm(false);
        const hasOpt = !!(
          (transaction && (
            transaction.notes ||
            transaction.group?.id ||
            transaction.funding_goal?.id ||
            transaction.loan_id ||
            transaction.include_in_budget === false
          )) ||
          defaultGroupId
        );
        setShowOptional(hasOpt);
        let typeToUse = transaction ? transaction.type : (defaultType || type);
        if (allowedTypes && allowedTypes.length > 0 && !allowedTypes.includes(typeToUse)) {
          typeToUse = allowedTypes[0];
        }
        setType(typeToUse);

        const cats = await api.getCategories(typeToUse);
        setCategories(cats);

        if (transaction) {
          if (transaction.category) {
            const subs = await getSubCategories(transaction.category.id);
            setSubCategories(subs);
          }

          if (transaction.subcategory) {
            const its = await getItems(transaction.subcategory.id);
            setItems(its);
          }

          setFormData({
            ...transaction,
            value: transaction.value.toString(),
            transaction_time: transaction.transaction_time.slice(0, 16),
            category: transaction.category,
            subcategory: transaction.subcategory,
            item: transaction.item,
            credit_card: (transaction as any).credit_card?.id,
            include_in_budget: transaction.include_in_budget ?? true,
            funding_goal_id: transaction.funding_goal?.id,
            loan_id: transaction.loan_id,
            group_id: transaction.group?.id,
            group_category: transaction.group_category
          });
        } else {
          const initialDate = defaultDate ? (() => {
            const dateToUse = new Date(defaultDate);
            const now = new Date();
            dateToUse.setHours(now.getHours(), now.getMinutes(), 0, 0);
            return dateToUse;
          })() : new Date();

          setFormData({
            value: 0,
            description: '',
            category: undefined,
            subcategory: undefined,
            item: undefined,
            transaction_time: toLocalISOString(initialDate),
            payment_mode: 'UPI',
            is_in: true,
            is_give: true,
            closed: false,
            notes: '',
            credit_card: undefined,
            include_in_budget: true,
            funding_goal_id: undefined,
            loan_id: undefined,
            group_id: defaultGroupId || undefined,
            group_category: undefined
          });
        }

        // Fetch credit cards
        api.getCreditCards().then(res => setCreditCards(res.data));

        // Fetch goals
        api.getGoals().then(res => {
          const activeGoals = res.data.filter(g => !g.is_closed);
          setGoals(activeGoals);
        });

        // Fetch active loans
        api.getLoans().then(res => {
          setLoans(res.data.filter(l => !l.is_closed));
        });

        // Fetch active groups
        api.getTransactionGroups().then(res => {
          let filtered = res.data.filter(g => g.status === 'ACTIVE');
          if (defaultGroupId && !filtered.some(g => g.id === defaultGroupId)) {
            const defaultGroup = res.data.find(g => g.id === defaultGroupId);
            if (defaultGroup) {
              filtered.push(defaultGroup);
            }
          }
          setGroups(filtered);
        });
      }
    };

    fetchDropdownData();
  }, [isOpen, transaction, defaultType, defaultDate, defaultGroupId, allowedTypes?.join(',')]);

  const selectedGroup = groups.find(g => g.id === formData.group_id);
  const isGroupCategoryEnabled = selectedGroup ? (selectedGroup.shared || Boolean(selectedGroup.use_group_categories)) : false;

  useEffect(() => {
    if (formData.group_id && isGroupCategoryEnabled) {
      api.getGroupCategories(formData.group_id)
        .then(res => setGroupCategories(res.data || []))
        .catch(err => console.error('Failed to fetch group categories:', err));
    } else {
      setGroupCategories([]);
      setFormData(prev => (prev.group_category ? { ...prev, group_category: undefined } : prev));
    }
  }, [formData.group_id, isGroupCategoryEnabled]);


  const handleCategoryChange = async (catId: number) => {
    const category = categories.find(c => c.id === catId);
    setFormData(prev => ({ ...prev, category, subcategory: undefined, item: undefined }));
    if (catId) {
      const subs = await getSubCategories(catId);
      setSubCategories(subs);
    } else {
      setSubCategories([]);
    }
    setItems([]);
  };

  const handleSubCategoryChange = async (subId: number) => {
    const subcategory = subCategories.find(s => s.id === subId);
    setFormData(prev => ({ ...prev, subcategory, item: undefined }));
    if (subId) {
      const its = await getItems(subId);
      setItems(its);
    } else {
      setItems([]);
    }
  };

  const isEditing = !!(transaction && transaction.id);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isEditing && transaction && type !== transaction.type && !showTypeChangeConfirm) {
      setShowTypeChangeConfirm(true);
      return;
    }

    if (formData.payment_mode === 'CREDIT_CARD' && !formData.credit_card) {
      showToast('Please select a Credit Card', 'error');
      return;
    }

    setLoading(true);
    try {
      const commonPayload = {
        id: isEditing ? transaction.id : undefined,
        value: Number(formData.value),
        description: formData.description,
        category: formData.category ? { id: formData.category.id } : undefined,
        subcategory: formData.subcategory ? { id: formData.subcategory.id } : undefined,
        item: formData.item ? { id: formData.item.id } : undefined,
        transaction_time: formData.transaction_time,
        notes: formData.notes,
        type
      };

      const apiCall = isEditing
        ? (type === TransactionType.EXPENSE ? api.updateExpense : type === TransactionType.INCOME ? api.updateIncome : type === TransactionType.SAVING ? api.updateSaving : api.updateRevolving)
        : (type === TransactionType.EXPENSE ? api.createExpense : type === TransactionType.INCOME ? api.createIncome : type === TransactionType.SAVING ? api.createSaving : api.createRevolving);


      const finalPayload = {
        ...commonPayload,
        payment_mode: formData.payment_mode,
        credit_card: formData.payment_mode === 'CREDIT_CARD' && formData.credit_card ? { id: formData.credit_card } : undefined,
        include_in_budget: formData.funding_goal_id ? false : formData.include_in_budget,
        funding_goal: formData.funding_goal_id ? { id: formData.funding_goal_id } : undefined,
        loan: formData.loan_id ? { id: formData.loan_id } : undefined,
        group: formData.group_id ? { id: formData.group_id } : null,
        group_category: formData.group_id && formData.group_category ? { id: formData.group_category.id } : null
      };

      let savedResponse: any;
      if (type === TransactionType.SAVING) {
        savedResponse = await apiCall({ ...finalPayload, is_in: formData.is_in } as any);
      } else if (type === TransactionType.REVOLVING) {
        savedResponse = await apiCall({ ...finalPayload, is_give: formData.is_give, closed: formData.closed } as any);
      } else {
        savedResponse = await apiCall(finalPayload as any);
      }

      const savedId: number = savedResponse?.id ?? commonPayload.id;

      showToast('Transaction saved successfully', 'success');
      resetForm();
      onSuccess(type, savedId);
      onClose();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to save transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeColors: Record<TransactionType, string> = {
    [TransactionType.EXPENSE]: 'from-rose-500 to-pink-600',
    [TransactionType.INCOME]: 'from-emerald-500 to-teal-600',
    [TransactionType.SAVING]: 'from-violet-500 to-purple-600',
    [TransactionType.REVOLVING]: 'from-blue-500 to-cyan-600',
  };

  const typeName = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/40 dark:bg-black/60 backdrop-blur-sm flex flex-col items-center p-4">
      <div className="my-auto bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/40 overflow-hidden border border-slate-200 dark:border-slate-700/50 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r ${typeColors[type]} bg-opacity-10 shrink-0`}>
          <h3 className="text-lg font-bold text-white">{isEditing ? `Edit ${typeName}` : `Add ${typeName}`}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Type Selector */}
          {(!allowedTypes || allowedTypes.length > 1) && (
            <div
              className="grid gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50"
              style={{
                gridTemplateColumns: `repeat(${(allowedTypes || Object.values(TransactionType)).length}, minmax(0, 1fr))`
              }}
            >
              {(allowedTypes || Object.values(TransactionType)).map((t) => {
                const Icon = {
                  [TransactionType.EXPENSE]: TrendingDown,
                  [TransactionType.INCOME]: TrendingUp,
                  [TransactionType.SAVING]: PiggyBank,
                  [TransactionType.REVOLVING]: RefreshCw,
                }[t];

                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      // Re-fetch categories for new type and clear selections
                      api.getCategories(t).then(cats => {
                        setCategories(cats);
                        setSubCategories([]);
                        setItems([]);
                        setFormData(prev => ({
                          ...prev,
                          category: undefined,
                          subcategory: undefined,
                          item: undefined,
                          funding_goal_id: t === TransactionType.INCOME ? undefined : prev.funding_goal_id,
                          include_in_budget: t === TransactionType.INCOME ? true : prev.include_in_budget
                        }));
                      });
                      api.getCreditCards().then(res => setCreditCards(res.data));
                    }}
                    className={`py-2.5 flex items-center justify-center text-sm font-semibold rounded-lg transition-all ${type === t ? `bg-gradient-to-r ${typeColors[t]} text-white shadow-lg` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'
                      }`}
                  >
                    <Icon className="w-5 h-5 md:hidden" />
                    <span className="hidden md:inline">{t}</span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-slate-900 dark:text-white"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-slate-900 dark:text-white [color-scheme:light] dark:[color-scheme:dark]"
                  value={formData.transaction_time?.slice(0, 16)}
                  max={toLocalISOString(new Date())}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Description</label>
              <input
                type="text"
                required
                placeholder="What was this for?"
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Category</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white"
                  value={formData.category?.id || ''}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Sub-Category</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none disabled:opacity-40 text-slate-900 dark:text-white"
                  disabled={!formData.category}
                  value={formData.subcategory?.id || ''}
                  onChange={(e) => handleSubCategoryChange(Number(e.target.value))}
                >
                  <option value="">Select Sub-Category</option>
                  {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Item</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none disabled:opacity-40 text-slate-900 dark:text-white"
                disabled={!formData.subcategory || !formData.category}
                value={formData.item?.id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, item: items.find(i => i.id === Number(e.target.value)) }))}
              >
                <option value="">Select Item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Payment Mode</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value, credit_card: e.target.value === 'CREDIT_CARD' ? prev.credit_card : undefined }))}
                >
                  <option value="">Select Payment Mode</option>
                  {PAYMENT_MODES.map(pm => <option key={pm.value} value={pm.value}>{pm.label}</option>)}
                </select>
              </div>

              {formData.payment_mode === 'CREDIT_CARD' && (
                <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Select Credit Card</label>
                    <div className="relative">
                      <select
                        className="w-full pl-11 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white appearance-none"
                        value={formData.credit_card || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, credit_card: Number(e.target.value) }))}
                      >
                        <option value="">Choose a card</option>
                        {creditCards.map(cc => (
                          <option key={cc.id} value={cc.id}>{cc.nickname} ({cc.issuer})</option>
                        ))}
                      </select>
                      <CardIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {formData.credit_card && creditCards.find(c => c.id === formData.credit_card)?.threshold_exceeded && (
                    <div className="flex gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-pulse">
                      <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0" />
                      <div className="text-xs">
                        <p className="font-bold text-rose-600 dark:text-rose-400">Usage Threshold Alert</p>
                        <p className="text-rose-500/80">This card has exceeded its utilization threshold ({creditCards.find(c => c.id === formData.credit_card)?.threshold_percentage}%).</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>            {type === TransactionType.SAVING && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_in: true }))}
                      className={`py-2 text-sm font-semibold rounded-lg transition-all ${formData.is_in ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      IN (Deposit)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_in: false }))}
                      className={`py-2 text-sm font-semibold rounded-lg transition-all ${!formData.is_in ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      OUT (Withdrawal)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {type === TransactionType.REVOLVING && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Transaction Type</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_give: true }))}
                      className={`py-2 text-sm font-semibold rounded-lg transition-all ${formData.is_give !== false ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      GIVE
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, is_give: false }))}
                      className={`py-2 text-sm font-semibold rounded-lg transition-all ${formData.is_give === false ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                        }`}
                    >
                      RECEIVE
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <input
                    type="checkbox"
                    id="closed-checkbox"
                    className="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500"
                    checked={formData.closed || false}
                    onChange={(e) => setFormData(prev => ({ ...prev, closed: e.target.checked }))}
                  />
                  <label htmlFor="closed-checkbox" className="text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
                    Mark as Closed (Settled)
                  </label>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="flex items-center gap-1.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-all uppercase tracking-wider mt-4 outline-none"
            >
              <span>Additional Options</span>
              <ChevronDown className={`w-4 h-4 transition-transform duration-350 ${showOptional ? 'rotate-180' : ''}`} />
            </button>

            {showOptional && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-300">
                {type !== TransactionType.INCOME && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Fund from Goal (Optional)</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white"
                      value={formData.funding_goal_id || ''}
                      onChange={(e) => {
                        const goalIdVal = e.target.value ? Number(e.target.value) : undefined;
                        setFormData(prev => ({
                          ...prev,
                          funding_goal_id: goalIdVal,
                          include_in_budget: goalIdVal ? false : prev.include_in_budget
                        }));
                      }}
                    >
                      <option value="">Do not fund from a Goal</option>
                      {goals.map(g => {
                        const available = getAvailableBalance(g, transaction);
                        return (
                          <option key={g.id} value={g.id}>
                            {g.icon || '🎯'} {g.name} — Available: ₹{available.toLocaleString('en-IN')} ({g.goal_type === 'ONE_TIME' ? 'One-Time' : 'Persistent'})
                          </option>
                        );
                      })}
                    </select>
                    {formData.funding_goal_id && (() => {
                      const selectedGoal = goals.find(g => g.id === formData.funding_goal_id);
                      if (!selectedGoal) return null;
                      const available = getAvailableBalance(selectedGoal, transaction);
                      const txVal = Number(formData.value) || 0;

                      return (
                        <div className="space-y-1.5 mt-2">
                          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                            Note: Funding from a goal automatically excludes this transaction from the budget.
                          </p>

                          {available === 0 ? (
                            <div className="flex gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                              <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <p className="font-bold text-amber-600 dark:text-amber-400">Zero Balance Warning</p>
                                <p className="text-amber-500/90 leading-tight">
                                  This goal has an available balance of ₹0. Please contribute savings first.
                                </p>
                              </div>
                            </div>
                          ) : txVal > available ? (
                            <div className="flex gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                              <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                              <div className="text-xs">
                                <p className="font-bold text-rose-600 dark:text-rose-400">Overdraft Warning</p>
                                <p className="text-rose-500/90 leading-tight">
                                  Transaction amount (₹{txVal.toLocaleString('en-IN')}) exceeds the goal's available balance (₹{available.toLocaleString('en-IN')}). Saving this will throw an error.
                                </p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {type === TransactionType.EXPENSE && !formData.funding_goal_id && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Link to Loan (Optional)</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white"
                      value={formData.loan_id || ''}
                      onChange={(e) => {
                        const loanIdVal = e.target.value ? Number(e.target.value) : undefined;
                        setFormData(prev => ({ ...prev, loan_id: loanIdVal }));
                      }}
                    >
                      <option value="">Do not link to a Loan</option>
                      {loans.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} (EMI: ₹{l.emi_amount.toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                    {formData.loan_id && (() => {
                      const selectedLoan = loans.find(l => l.id === formData.loan_id);
                      if (!selectedLoan) return null;
                      const txVal = Number(formData.value) || 0;
                      const emiAmount = selectedLoan.emi_amount;
                      const matchesEmi = Math.abs(txVal - emiAmount) < 0.01;

                      return (
                        <div className="mt-2 text-xs font-medium">
                          {matchesEmi ? (
                            <p className="text-emerald-600 dark:text-emerald-400">
                              ✓ Amount matches EMI (₹{emiAmount.toLocaleString('en-IN')}) — will be logged as the EMI payment for this month if not already done.
                            </p>
                          ) : (
                            <p className="text-indigo-600 dark:text-indigo-400">
                              ℹ Amount differs from EMI (₹{emiAmount.toLocaleString('en-IN')}) — will be logged as a Part Payment.
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {(type === TransactionType.EXPENSE ||
                  (type === TransactionType.SAVING && formData.is_in) ||
                  (type === TransactionType.REVOLVING && formData.is_give !== false)) && (
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="exclude-budget-checkbox"
                        className="w-5 h-5 rounded border-slate-300 dark:border-slate-650 bg-white dark:bg-slate-800 text-cyan-500 focus:ring-cyan-500/40 cursor-pointer accent-cyan-500 disabled:opacity-50"
                        checked={formData.include_in_budget === false || !!formData.funding_goal_id}
                        disabled={!!formData.funding_goal_id}
                        onChange={(e) => !formData.funding_goal_id && setFormData(prev => ({ ...prev, include_in_budget: !e.target.checked }))}
                      />
                      <label htmlFor="exclude-budget-checkbox" className={`text-sm font-medium cursor-pointer ${formData.funding_goal_id ? 'text-slate-400 dark:text-slate-500' : 'text-slate-600 dark:text-slate-300'}`}>
                        Exclude from budget utilization {formData.funding_goal_id && '(Locked by goal funding)'}
                      </label>
                    </div>
                  )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Assign to Group (Optional)</label>
                  <select
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={disableGroupSelection}
                    value={formData.group_id || ''}
                    onChange={(e) => {
                      const groupIdVal = e.target.value ? Number(e.target.value) : undefined;
                      setFormData(prev => ({ ...prev, group_id: groupIdVal }));
                    }}
                  >
                    <option value="">Do not assign to a Group</option>
                    {groups
                      .filter(g => {
                        if (formData.group_id === g.id) return true;
                        if (type === TransactionType.EXPENSE) return g.allows_expense !== false;
                        if (type === TransactionType.INCOME) return g.allows_income !== false;
                        if (type === TransactionType.SAVING) return g.allows_saving !== false;
                        if (type === TransactionType.REVOLVING) return g.allows_revolving !== false;
                        return true;
                      })
                      .map(g => (
                        <option key={g.id} value={g.id}>
                          {g.name} ({g.type}){g.shared ? ' (Shared)' : ''}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {formData.group_id && isGroupCategoryEnabled && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Group Category (Optional)</label>
                    <select
                      className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white"
                      value={formData.group_category?.id || ''}
                      onChange={(e) => {
                        const catId = e.target.value ? Number(e.target.value) : undefined;
                        const selectedCat = groupCategories.find(c => c.id === catId);
                        setFormData(prev => ({ ...prev, group_category: selectedCat }));
                      }}
                    >
                      <option value="">Uncategorized</option>
                      {groupCategories.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

          <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            <button
              type="button"
              onClick={() => { resetForm(); onClose(); }}
              className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-xl transition-colors border border-slate-200 dark:border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isGoalFundingInvalid}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r ${typeColors[type]} text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save
                </>
              )}
            </button>
          </div>
        </form>

        {showTypeChangeConfirm && (
          <div className="absolute inset-0 z-[70] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 rounded-2xl">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-[320px] w-full text-center space-y-4">
              <div className="w-14 h-14 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-7 h-7 text-rose-600 dark:text-rose-500" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Change Type?</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Changing from <span className="font-bold text-rose-500">{transaction?.type}</span> to <span className="font-bold text-cyan-500">{type}</span> will recreate this record. Are you sure?
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTypeChangeConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  No, Keep
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="flex-1 px-4 py-2.5 text-xs font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                >
                  Yes, Change
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
