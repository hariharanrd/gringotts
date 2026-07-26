import React, { useState, useEffect } from 'react';
import {
  Check,
  Edit3,
  X,
  TrendingDown,
  TrendingUp,
  PiggyBank,
  RefreshCw,
  Sparkles,
  ChevronDown,
  CreditCard as CardIcon,
  Tag,
  Calendar,
  DollarSign
} from 'lucide-react';
import {
  Category,
  SubCategory,
  Item,
  TransactionType,
  ParsedTransaction,
  CreditCard
} from '../types';
import { PAYMENT_MODES } from '../constants';
import { api } from '../services/api';
import { useToast } from './ToastContext';
import { getSubCategoryCategoryId, getItemSubCategoryId } from '../services/geminiChatService';

interface GoblinConfirmationCardProps {
  msgId?: string;
  parsedTx: ParsedTransaction;
  categories: Category[];
  subCategories: SubCategory[];
  items: Item[];
  creditCards: CreditCard[];
  onSuccess: (savedId: number) => void;
  onOpenFullModal: (tx: ParsedTransaction, msgId?: string) => void;
  onCancel?: () => void;
  isAlreadySaved?: boolean;
  savedTransactionId?: number;
}

export const GoblinConfirmationCard: React.FC<GoblinConfirmationCardProps> = ({
  msgId,
  parsedTx,
  categories,
  subCategories,
  items,
  creditCards,
  onSuccess,
  onOpenFullModal,
  onCancel,
  isAlreadySaved = false,
  savedTransactionId
}) => {
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>(parsedTx.transaction_type || TransactionType.EXPENSE);
  const [value, setValue] = useState<string | number>(parsedTx.value || 0);
  const [description, setDescription] = useState<string>(parsedTx.description || '');
  const [date, setDate] = useState<string>(parsedTx.transaction_date || new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<string>(parsedTx.payment_mode || 'UPI');
  const [notes, setNotes] = useState<string>(parsedTx.notes || '');
  const [creditCardId, setCreditCardId] = useState<number | undefined>(parsedTx.credit_card_id);

  // CSI state
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(parsedTx.category_id);
  const [selectedSubCatId, setSelectedSubCatId] = useState<number | undefined>(parsedTx.subcategory_id);
  const [selectedItemId, setSelectedItemId] = useState<number | undefined>(parsedTx.item_id);

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(isAlreadySaved);

  // Filtered subcategories & items based on selections using helper functions
  const availableSubCategories = subCategories.filter(s => getSubCategoryCategoryId(s) === selectedCatId);
  const availableItems = items.filter(i => getItemSubCategoryId(i) === selectedSubCatId);

  // Reset child selections when parent category changes
  const handleCategoryChange = (catId: number | undefined) => {
    setSelectedCatId(catId);
    setSelectedSubCatId(undefined);
    setSelectedItemId(undefined);
  };

  const handleSubCategoryChange = (subCatId: number | undefined) => {
    setSelectedSubCatId(subCatId);
    setSelectedItemId(undefined);
  };

  const handleConfirmSave = async () => {
    const numericVal = Number(value);
    if (isNaN(numericVal) || numericVal <= 0) {
      showToast('Please enter a valid positive amount', 'error');
      return;
    }

    if (!description.trim()) {
      showToast('Description is required', 'error');
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = categories.find(c => c.id === selectedCatId);
      const selectedSubCategory = subCategories.find(s => s.id === selectedSubCatId);
      const selectedItem = items.find(i => i.id === selectedItemId);
      const selectedCard = creditCards.find(c => c.id === creditCardId);

      const payload: any = {
        value: numericVal,
        description: description.trim(),
        transaction_time: `${date}T${new Date().toTimeString().split(' ')[0]}`,
        payment_mode: paymentMode,
        category: selectedCategory ? { id: selectedCategory.id } : undefined,
        subcategory: selectedSubCategory ? { id: selectedSubCategory.id } : undefined,
        item: selectedItem ? { id: selectedItem.id } : undefined,
        credit_card: selectedCard ? { id: selectedCard.id } : undefined,
        notes: notes.trim() || undefined,
        include_in_budget: true
      };

      let result: any;
      if (type === TransactionType.EXPENSE) {
        result = await api.createExpense(payload);
      } else if (type === TransactionType.INCOME) {
        result = await api.createIncome(payload);
      } else if (type === TransactionType.SAVING) {
        result = await api.createSaving({ ...payload, is_in: true });
      } else if (type === TransactionType.REVOLVING) {
        result = await api.createRevolving({ ...payload, is_give: true, closed: false });
      }

      const savedId = result?.id || 0;
      setSaved(true);
      showToast('Logged into Gringotts Vault! 🪙', 'success');
      onSuccess(savedId);
    } catch (err: any) {
      console.error('Failed to log transaction from Goblin:', err);
      showToast(err.message || 'Failed to save transaction to vault', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getConfidenceColor = (conf: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (conf) {
      case 'HIGH':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'LOW':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
  };

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-b from-white/95 via-emerald-50/50 to-amber-50/30 dark:from-slate-900/90 dark:to-slate-950/95 border border-emerald-500/30 p-4 shadow-xl shadow-emerald-900/10 dark:shadow-emerald-950/40 relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Decorative Shimmer Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-amber-400 to-teal-400" />

      {/* Header & Confidence Badge */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-emerald-500/20 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Vault Entry Confirmation
          </span>
        </div>
        <span
          className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${getConfidenceColor(
            parsedTx.confidence
          )}`}
          title={parsedTx.reasoning || 'Confidence level of AI match'}
        >
          {parsedTx.confidence} Confidence
        </span>
      </div>

      {saved ? (
        <div className="py-4 text-center space-y-2 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Logged in Vault!</p>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {type} of <span className="font-semibold text-amber-600 dark:text-amber-300">₹{value}</span> for "{description}" recorded cleanly.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Type & Amount Row */}
          <div className="grid grid-cols-12 gap-2">
            {/* Type selector */}
            <div className="col-span-5">
              <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">TYPE</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as TransactionType)}
                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value={TransactionType.EXPENSE}>Expense</option>
                <option value={TransactionType.INCOME}>Income</option>
                <option value={TransactionType.SAVING}>Saving</option>
                <option value={TransactionType.REVOLVING}>Revolving</option>
              </select>
            </div>

            {/* Amount input */}
            <div className="col-span-7">
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">AMOUNT (₹)</label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-bold text-amber-300 focus:outline-none focus:border-emerald-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Description Row */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 mb-1">DESCRIPTION</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              placeholder="What was this for?"
            />
          </div>

          {/* Category -> Subcategory -> Item Grid */}
          <div className="space-y-2 pt-1 border-t border-slate-800/60">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">CATEGORY</label>
                <select
                  value={selectedCatId || ''}
                  onChange={e => handleCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SubCategory */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">SUBCATEGORY</label>
                <select
                  value={selectedSubCatId || ''}
                  onChange={e => handleSubCategoryChange(e.target.value ? Number(e.target.value) : undefined)}
                  disabled={!selectedCatId}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 disabled:opacity-50 transition-colors"
                >
                  <option value="">-- Select Subcategory --</option>
                  {availableSubCategories.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Item (Optional) */}
            {availableItems.length > 0 && (
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 mb-1">ITEM (OPTIONAL)</label>
                <select
                  value={selectedItemId || ''}
                  onChange={e => setSelectedItemId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
                >
                  <option value="">-- Select Item --</option>
                  {availableItems.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Date & Payment Mode Row */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/60">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">DATE</label>
              <input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">PAYMENT MODE</label>
              <select
                value={paymentMode}
                onChange={e => setPaymentMode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                {PAYMENT_MODES.map(pm => (
                  <option key={pm.value} value={pm.value}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Credit Card Selector if paymentMode === 'CREDIT_CARD' */}
          {paymentMode === 'CREDIT_CARD' && creditCards.length > 0 && (
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">CREDIT CARD</label>
              <select
                value={creditCardId || ''}
                onChange={e => setCreditCardId(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="">-- Select Credit Card --</option>
                {creditCards.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nickname} ({c.issuer})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reasoning / AI note */}
          {parsedTx.reasoning && (
            <p className="text-[10px] italic text-emerald-400/80 bg-emerald-950/30 p-1.5 rounded-lg border border-emerald-900/40">
              💡 {parsedTx.reasoning}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleConfirmSave}
              disabled={saving}
              className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/40 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  Add to Vault
                </>
              )}
            </button>

            <button
              onClick={() => onOpenFullModal({
                ...parsedTx,
                transaction_type: type,
                value: Number(value),
                description,
                transaction_date: date,
                payment_mode: paymentMode,
                category_id: selectedCatId,
                subcategory_id: selectedSubCatId,
                item_id: selectedItemId,
                credit_card_id: creditCardId,
                notes
              }, msgId)}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center justify-center gap-1 transition-colors"
              title="Open full transaction modal for detailed options"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit More
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
