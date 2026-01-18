
import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { Category, SubCategory, Item, TransactionType, Expense, Income, Saving, Transaction} from '../types';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
}

type TransactionFormState = Omit<Partial<Transaction>, 'value' > & {
  value: string | number;
  payment_mode?: string;
  source?: string;
  active?: boolean;
  category?: Category;
  subcategory?: SubCategory;
  item?: Item;
};

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onSuccess, transaction }) => {
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  const [formData, setFormData] = useState<TransactionFormState>({
    value: 0,
    description: '',
    category: transaction? transaction.category : undefined,
    subcategory: transaction ? transaction.subcategory : undefined,
    item: transaction ? transaction.item : undefined,
    transaction_time: new Date().toISOString().slice(0, 16),
    payment_mode: 'CASH',
    source: '',
    active: true,
    notes: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      if (isOpen) {

        if (transaction) {
          setType(transaction.type);
          
          if(!transaction.category){
            const cats = await api.getCategories();
            setCategories(cats);
          }
          if (transaction.category && !transaction.subcategory) {
            const subs = await api.getSubCategories(transaction.category.id);
            setSubCategories(subs);
          }

          if (transaction.subcategory && !transaction.item) {
            const its = await api.getItems(transaction.subcategory.id);
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
        }

      }
    };

    fetchDropdownData();
  }, [isOpen, transaction]);

  const handleCategoryChange = async (catId: number) => {
    const category = categories.find(c => c.id === catId);
    setFormData(prev => ({ ...prev, category, subcategory: undefined, item: undefined }));
    if (catId) {
      const subs = await api.getSubCategories(catId);
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
      const its = await api.getItems(subId);
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
        await apiCall({ ...commonPayload, active: formData.active, type: TransactionType.SAVING } as any);
      }
      
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
            {Object.values(TransactionType).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 text-sm font-semibold rounded-lg transition-all ${
                  type === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Value</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-7 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    value={formData.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, value: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  value={formData.transaction_time?.slice(0, 16)}
                  onChange={(e) => setFormData(prev => ({ ...prev, transactionTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <input
                type="text"
                required
                placeholder="What was this for?"
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Category</label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.category?.id || ''}
                  onChange={(e) => handleCategoryChange(Number(e.target.value))}
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Sub-Category</label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
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
              <label className="text-sm font-medium text-slate-700">Item</label>
              <select
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
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
                <label className="text-sm font-medium text-slate-700">Payment Mode</label>
                <select
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
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
                <label className="text-sm font-medium text-slate-700">Income Source</label>
                <input
                  type="text"
                  placeholder="e.g. Salary, Freelance"
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  value={formData.source}
                  onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Notes (Optional)</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Record
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
