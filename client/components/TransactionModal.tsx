
import React, { useState, useEffect, useRef } from 'react';
import { X, Save } from 'lucide-react';
import { api } from '../services/api';
import { Category, SubCategory, Item, TransactionType, Expense, Income, Saving, Transaction} from '../types';
import { useToast } from '../components/ToastContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
  defaultType?: TransactionType;
}

type TransactionFormState = Omit<Partial<Transaction>, 'value' > & {
  value: string | number;
  payment_mode?: string;
  source?: string;
  active?: boolean;
  withdrawn_amount?: string | number;
  category?: Category;
  subcategory?: SubCategory;
  item?: Item;
};

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSuccess, transaction, defaultType }) => {
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const subCategoryCache = useRef<Record<number, SubCategory[]>>({});
  const itemCache = useRef<Record<number, Item[]>>({});

  const [formData, setFormData] = useState<TransactionFormState>({
    value: 0,
    description: '',
    category: undefined,
    subcategory: undefined,
    item: undefined,
    transaction_time: new Date().toISOString().slice(0, 16),
    payment_mode: 'CASH',
    source: '',
    active: true,
    withdrawn_amount: 0,
    notes: ''
  });

  const [loading, setLoading] = useState(false);

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
        const typeToUse = transaction ? transaction.type : (defaultType || type);
        const cats = await api.getCategories(typeToUse);
        setCategories(cats);

        if (transaction) {
          setType(transaction.type);
          
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
            transaction_time: new Date(transaction.transaction_time).toISOString().slice(0, 16),
            category: transaction.category,
            subcategory: transaction.subcategory,
            item: transaction.item,
          });
        } else if (defaultType) {
          setType(defaultType);
        }

      }
    };

    fetchDropdownData();
  }, [isOpen, transaction, defaultType]);

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
  
  const isEditing = !!transaction;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        ? (type === TransactionType.EXPENSE ? api.updateExpense : type === TransactionType.INCOME ? api.updateIncome : api.updateSaving)
        : (type === TransactionType.EXPENSE ? api.createExpense : type === TransactionType.INCOME ? api.createIncome : api.createSaving);


      if (type === TransactionType.EXPENSE) {
        await apiCall({ ...commonPayload, payment_mode: formData.payment_mode, type: TransactionType.EXPENSE } as any);
      } else if (type === TransactionType.INCOME) {
        await apiCall({ ...commonPayload, source: formData.source, type: TransactionType.INCOME } as any);
      } else if (type === TransactionType.SAVING) {
        await apiCall({ ...commonPayload, active: formData.active, withdrawn_amount: Number(formData.withdrawn_amount), type: TransactionType.SAVING } as any);
      }
      
      showToast('Transaction saved successfully', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Failed to save transaction', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const typeColors: Record<TransactionType, string> = {
    [TransactionType.EXPENSE]: 'from-rose-500 to-pink-600',
    [TransactionType.INCOME]: 'from-emerald-500 to-teal-600',
    [TransactionType.SAVING]: 'from-violet-500 to-purple-600',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl shadow-black/40 overflow-hidden border border-slate-700/50">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between bg-gradient-to-r ${typeColors[type]} bg-opacity-10`}>
          <h3 className="text-lg font-bold text-white">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800/60 rounded-xl border border-slate-700/50">
            {Object.values(TransactionType).map((t) => (
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
                    setFormData(prev => ({ ...prev, category: undefined, subcategory: undefined, item: undefined }));
                  });
                }}
                className={`py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  type === t ? `bg-gradient-to-r ${typeColors[t]} text-white shadow-lg` : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-white"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-white [color-scheme:dark]"
                  value={formData.transaction_time?.slice(0, 16)}
                  onChange={(e) => setFormData(prev => ({ ...prev, transaction_time: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Description</label>
              <input
                type="text"
                required
                placeholder="What was this for?"
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-white placeholder:text-slate-600"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Category</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-white"
                  value={formData.category?.id || ''}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Sub-Category</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none disabled:opacity-40 text-white"
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
              <label className="text-sm font-medium text-slate-300">Item</label>
              <select
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none disabled:opacity-40 text-white"
                disabled={!formData.subcategory || !formData.category}
                value={formData.item?.id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, item: items.find(i => i.id === Number(e.target.value)) }))}
              >
                <option value="">Select Item</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>

            {type === TransactionType.EXPENSE && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Payment Mode</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-white"
                  value={formData.payment_mode}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_mode: e.target.value }))}
                >
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                  <option value="UPI">UPI / Online</option>
                </select>
              </div>
            )}

            {type === TransactionType.INCOME && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-300">Income Source</label>
                <input
                  type="text"
                  placeholder="e.g. Salary, Freelance"
                  className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all text-white placeholder:text-slate-600"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
            )}

            {type === TransactionType.SAVING && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700/60 rounded-xl">
                  <label className="text-sm font-medium text-slate-300">Active</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      formData.active ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                      formData.active ? 'translate-x-5' : 'translate-x-0'
                    }`} />
                  </button>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300">Withdrawn Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">₹</span>
                    <input
                      type="number"
                      className="w-full pl-7 pr-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 outline-none transition-all text-white"
                      value={formData.withdrawn_amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, withdrawn_amount: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-300">Notes (Optional)</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 bg-slate-800/60 border border-slate-700/60 rounded-xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-white placeholder:text-slate-600"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-colors border border-slate-700/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
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
      </div>
    </div>
  );
};

export default TransactionModal;
