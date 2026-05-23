import React, { useEffect, useState, useRef } from 'react';
import { X, Save, Clock, TrendingDown, TrendingUp, PiggyBank, RefreshCw, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { ScheduledTransaction, ScheduleFrequency, TransactionType, Category, SubCategory, Item, CreditCard, InvestmentGoal } from '../types';
import { useToast } from './ToastContext';
import { PAYMENT_MODES } from '../constants';
import { toLocalDateString } from '../services/dateUtils';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schedule?: ScheduledTransaction | null;
}

const typeColors: Record<Exclude<TransactionType, TransactionType.REVOLVING>, string> = {
  [TransactionType.EXPENSE]: 'from-rose-500 to-pink-600',
  [TransactionType.INCOME]: 'from-emerald-500 to-teal-600',
  [TransactionType.SAVING]: 'from-violet-500 to-purple-600',
};

const inputClass = "w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600";

const ScheduleModal: React.FC<Props> = ({ isOpen, onClose, schedule }) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const subCategoryCache = useRef<Record<number, SubCategory[]>>({});
  const itemCache = useRef<Record<number, Item[]>>({});

  const [form, setForm] = useState<Partial<ScheduledTransaction>>({
    name: '',
    transaction_type: TransactionType.EXPENSE,
    amount: 0,
    frequency: ScheduleFrequency.MONTHLY,
    start_date: toLocalDateString(new Date()),
    is_active: true,
    description: '',
    payment_mode: 'UPI',
    credit_card: undefined,
    funding_goal: undefined,
  });

  const getSubCategories = async (categoryId: number) => {
    if (subCategoryCache.current[categoryId]) return subCategoryCache.current[categoryId];
    const subs = await api.getSubCategories(categoryId);
    subCategoryCache.current[categoryId] = subs;
    return subs;
  };

  const getItems = async (subCategoryId: number) => {
    if (itemCache.current[subCategoryId]) return itemCache.current[subCategoryId];
    const its = await api.getItems(subCategoryId);
    itemCache.current[subCategoryId] = its;
    return its;
  };

  const getAvailableBalance = (g: InvestmentGoal) => {
    let baseAvailable = g.current_amount;
    if (g.goal_type === 'ONE_TIME') {
      baseAvailable = g.current_amount - (g.total_funded ?? 0);
    }
    return Math.max(baseAvailable, 0);
  };

  const selectedGoalForValidation = form.funding_goal?.id ? goals.find(g => g.id === form.funding_goal?.id) : undefined;
  const isGoalFundingInvalid = selectedGoalForValidation ? (() => {
    const available = getAvailableBalance(selectedGoalForValidation);
    const txVal = Number(form.amount) || 0;
    return available === 0 || txVal > available;
  })() : false;

  useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        const typeToUse = schedule ? schedule.transaction_type : (form.transaction_type || TransactionType.EXPENSE);
        const cats = await api.getCategories(typeToUse);
        setCategories(cats);

        api.getCreditCards().then(res => setCreditCards(res.data));

        api.getGoals().then(res => {
          const activeGoals = res.data.filter(g => !g.is_closed);
          setGoals(activeGoals);
        });

        if (schedule) {
          setForm({
            ...schedule,
            funding_goal: schedule.funding_goal
          });
          if (schedule.category) {
            const subs = await getSubCategories(schedule.category.id);
            setSubCategories(subs);
          }
          if (schedule.subcategory) {
            const its = await getItems(schedule.subcategory.id);
            setItems(its);
          }
        } else {
          setForm({
            name: '',
            transaction_type: TransactionType.EXPENSE,
            amount: 0,
            frequency: ScheduleFrequency.MONTHLY,
            start_date: toLocalDateString(new Date()),
            is_active: true,
            description: '',
            payment_mode: 'UPI',
            is_in: true,
            funding_goal: undefined,
          });
          setSubCategories([]);
          setItems([]);
        }
      }
    };
    fetchData();
  }, [isOpen, schedule]);

  const handleTypeChange = async (type: TransactionType) => {
    setForm(f => ({ ...f, transaction_type: type, category: undefined, subcategory: undefined, item: undefined }));
    const cats = await api.getCategories(type);
    setCategories(cats);
    setSubCategories([]);
    setItems([]);
    api.getCreditCards().then(res => setCreditCards(res.data));
  };

  const handleCategoryChange = async (catId: number) => {
    const category = categories.find(c => c.id === catId);
    setForm(prev => ({ ...prev, category, subcategory: undefined, item: undefined }));
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
    setForm(prev => ({ ...prev, subcategory, item: undefined }));
    if (subId) {
      const its = await getItems(subId);
      setItems(its);
    } else {
      setItems([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (schedule) {
        // Partial Update: Only include fields that changed
        const changes: any = {};
        
        if (form.name !== schedule.name) changes.name = form.name;
        if (form.transaction_type !== schedule.transaction_type) changes.transaction_type = form.transaction_type;
        if (form.amount !== schedule.amount) changes.amount = form.amount;
        if (form.frequency !== schedule.frequency) changes.frequency = form.frequency;
        if (form.start_date !== schedule.start_date) changes.start_date = form.start_date;
        if (form.end_date !== (schedule.end_date || '')) changes.end_date = form.end_date || null;
        if (form.is_active !== schedule.is_active) changes.is_active = form.is_active;
        if (form.description !== schedule.description) changes.description = form.description;
        if (form.payment_mode !== schedule.payment_mode) changes.payment_mode = form.payment_mode;
        if (form.is_in !== schedule.is_in) changes.is_in = form.is_in;

        // Relation changes
        const getRelId = (val: any) => typeof val === 'object' ? val?.id : val;

        if (getRelId(form.category) !== schedule.category?.id) {
          const id = getRelId(form.category);
          changes.category = id ? { id } : null;
        }
        if (getRelId(form.subcategory) !== schedule.subcategory?.id) {
          const id = getRelId(form.subcategory);
          changes.subcategory = id ? { id } : null;
        }
        if (getRelId(form.item) !== schedule.item?.id) {
          const id = getRelId(form.item);
          changes.item = id ? { id } : null;
        }
        
        const currentCardId = (schedule.credit_card as any)?.id;
        if (getRelId(form.credit_card) !== currentCardId) {
          const id = getRelId(form.credit_card);
          changes.credit_card = (form.payment_mode === 'CREDIT_CARD' && id) ? { id } : null;
        }

        if (getRelId(form.funding_goal) !== schedule.funding_goal?.id) {
          const id = getRelId(form.funding_goal);
          changes.funding_goal = id ? { id } : null;
        }

        // If nothing changed, just close
        if (Object.keys(changes).length === 0) {
          onClose();
          return;
        }

        await api.updateScheduledTransaction(schedule.id, changes);
        showToast('Schedule updated successfully', 'success');
      } else {
        // Full Create
        const getRelId = (val: any) => typeof val === 'object' ? val?.id : val;
        const payload = {
          ...form,
          category: form.category ? { id: getRelId(form.category) } : undefined,
          subcategory: form.subcategory ? { id: getRelId(form.subcategory) } : undefined,
          item: form.item ? { id: getRelId(form.item) } : undefined,
          credit_card: (form.payment_mode === 'CREDIT_CARD' && form.credit_card) ? { id: getRelId(form.credit_card) } : undefined,
          funding_goal: form.funding_goal ? { id: getRelId(form.funding_goal) } : undefined,
        };
        await api.createScheduledTransaction(payload as any);
        showToast('Schedule created successfully', 'success');
      }
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to save schedule', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentType = form.transaction_type || TransactionType.EXPENSE;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700/50 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r ${typeColors[currentType as keyof typeof typeColors]} text-white`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold">{schedule ? 'Edit Schedule' : 'New Schedule'}</h3>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[85vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Schedule Name</label>
                <input
                  required
                  placeholder="e.g., Monthly Rent"
                  value={form.name || ''}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Transaction Type</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50">
                  {Object.values(TransactionType).filter(t => t !== TransactionType.REVOLVING).map((t) => {
                    const Icon = {
                      [TransactionType.EXPENSE]: TrendingDown,
                      [TransactionType.INCOME]: TrendingUp,
                      [TransactionType.SAVING]: PiggyBank,
                    }[t as Exclude<TransactionType, TransactionType.REVOLVING>];
                    const isActive = form.transaction_type === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => handleTypeChange(t)}
                        className={`py-2.5 flex items-center justify-center rounded-lg transition-all ${isActive ? `bg-gradient-to-r ${typeColors[t as keyof typeof typeColors]} text-white shadow-lg` : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
                        title={t}
                      >
                        <Icon className="w-4 h-4 md:hidden" />
                        <span className="hidden text-sm md:inline">{t}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">₹</span>
                    <input
                      required
                      type="number"
                      value={form.amount || ''}
                      onChange={(e) => setForm(f => ({ ...f, amount: Number(e.target.value) }))}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Frequency</label>
                  <select
                    value={form.frequency}
                    onChange={(e) => {
                      const newFreq = e.target.value as ScheduleFrequency;
                      setForm(f => ({
                        ...f,
                        frequency: newFreq,
                        end_date: newFreq === ScheduleFrequency.ONE_TIME ? '' : f.end_date
                      }));
                    }}
                    className={inputClass}
                  >
                    {Object.values(ScheduleFrequency).map(f => {
                      const label = f.split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                        .join(' ');
                      return (
                        <option key={f} value={f} className="dark:bg-slate-900">{label}</option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Start Date</label>
                  <input
                    required={!schedule}
                    type="date"
                    min={schedule ? undefined : toLocalDateString(new Date())}
                    value={form.start_date || ''}
                    onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
                    className={`${inputClass} text-sm [color-scheme:light] dark:[color-scheme:dark]`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">End Date</label>
                  <input
                    type="date"
                    disabled={form.frequency === ScheduleFrequency.ONE_TIME}
                    value={form.end_date || ''}
                    onChange={(e) => setForm(f => ({ ...f, end_date: e.target.value }))}
                    className={`${inputClass} text-sm [color-scheme:light] dark:[color-scheme:dark] disabled:opacity-40 disabled:cursor-not-allowed`}
                  />
                </div>
              </div>

              <div
                className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer group"
                onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300 select-none">
                    Enable Schedule
                  </span>
                  <span className="text-[8px] font-medium text-slate-500 dark:text-slate-500 select-none">
                    Automated transactions will be created when enabled
                  </span>
                </div>
                <button
                  type="button"
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 ${form.is_active ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-all duration-300 shadow-lg ${form.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Category</label>
                <select
                  value={form.category?.id || ''}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                  className={inputClass}
                >
                  <option value="" className="dark:bg-slate-900">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Sub-Category</label>
                <select
                  disabled={!form.category}
                  value={form.subcategory?.id || ''}
                  onChange={(e) => handleSubCategoryChange(Number(e.target.value))}
                  className={`${inputClass} disabled:opacity-40`}
                >
                  <option value="" className="dark:bg-slate-900">Select Sub-Category</option>
                  {subCategories.map(s => <option key={s.id} value={s.id} className="dark:bg-slate-900">{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Item</label>
                <select
                  disabled={!form.subcategory}
                  value={form.item?.id || ''}
                  onChange={(e) => setForm(f => ({ ...f, item: items.find(i => i.id === Number(e.target.value)) }))}
                  className={`${inputClass} disabled:opacity-40`}
                >
                  <option value="" className="dark:bg-slate-900">Select Item</option>
                  {items.map(i => <option key={i.id} value={i.id} className="dark:bg-slate-900">{i.name}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Payment Mode</label>
                <select
                  value={form.payment_mode}
                  onChange={(e) => setForm(f => ({ ...f, payment_mode: e.target.value }))}
                  className={inputClass}
                >
                  {PAYMENT_MODES.map(pm => <option key={pm.value} value={pm.value} className="dark:bg-slate-900">{pm.label}</option>)}
                </select>
              </div>

              {form.transaction_type !== TransactionType.INCOME && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Fund from Goal (Optional)</label>
                  <select
                    value={form.funding_goal?.id || ''}
                    onChange={(e) => {
                      const goalId = e.target.value ? Number(e.target.value) : undefined;
                      const selectedGoal = goals.find(g => g.id === goalId);
                      setForm(f => ({
                        ...f,
                        funding_goal: selectedGoal
                      }));
                    }}
                    className={inputClass}
                  >
                    <option value="" className="dark:bg-slate-900">Do not fund from a Goal</option>
                    {goals.map(g => {
                      const available = getAvailableBalance(g);
                      return (
                        <option key={g.id} value={g.id} className="dark:bg-slate-900">
                          {g.icon || '🎯'} {g.name} — Available: ₹{available.toLocaleString('en-IN')} ({g.goal_type === 'ONE_TIME' ? 'One-Time' : 'Persistent'})
                        </option>
                      );
                    })}
                  </select>
                  {form.funding_goal?.id && (() => {
                    const selectedGoal = goals.find(g => g.id === form.funding_goal?.id);
                    if (!selectedGoal) return null;
                    const available = getAvailableBalance(selectedGoal);
                    const txVal = Number(form.amount) || 0;

                    return (
                      <div className="space-y-1.5 mt-2">
                        <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium ml-1">
                          Note: Funding from a goal automatically excludes created transactions from the budget.
                        </p>
                        {available === 0 ? (
                          <div className="flex gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                            <AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <p className="font-bold text-amber-600 dark:text-amber-400">Zero Balance Warning</p>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                This goal has an available balance of ₹0. Please contribute savings first.
                              </p>
                            </div>
                          </div>
                        ) : txVal > available ? (
                          <div className="flex gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 shrink-0 mt-0.5" />
                            <div className="text-xs">
                              <p className="font-bold text-rose-600 dark:text-rose-400">Overdraft Warning</p>
                              <p className="text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                Schedule amount (₹{txVal.toLocaleString('en-IN')}) exceeds available balance (₹{available.toLocaleString('en-IN')}). Creating transactions from this schedule will fail.
                              </p>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              )}

              {form.payment_mode === 'CREDIT_CARD' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Select Credit Card</label>
                  <select
                    required
                    value={form.credit_card?.id || ''}
                    onChange={(e) => setForm(f => ({ ...f, credit_card: creditCards.find(cc => cc.id === Number(e.target.value)) }))}
                    className={inputClass}
                  >
                    <option value="" className="dark:bg-slate-900">Choose a Card</option>
                    {creditCards.map(cc => (
                      <option key={cc.id} value={cc.id} className="dark:bg-slate-900">
                        {cc.nickname} ({cc.issuer})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.transaction_type === TransactionType.SAVING && (
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Saving Type</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_in: true }))}
                      className={`py-2.5 text-sm font-bold rounded-lg transition-all ${form.is_in ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      IN
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, is_in: false }))}
                      className={`py-2.5 text-sm font-bold rounded-lg transition-all ${!form.is_in ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                      OUT
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400 ml-1">Description</label>
                <textarea
                  required
                  rows={2}
                  value={form.description || ''}
                  onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                  className={`${inputClass} resize-none`}
                  placeholder="What is this schedule for?"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isGoalFundingInvalid}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r ${typeColors[currentType as keyof typeof typeColors]} text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50 active:scale-[0.98]`}
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (
                <>
                  <Save className="w-5 h-5" />
                  {schedule ? 'Update Schedule' : 'Create Schedule'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ScheduleModal;
