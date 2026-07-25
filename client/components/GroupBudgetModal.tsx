import React, { useState, useEffect } from 'react';
import { X, DollarSign, Wallet, Calendar, AlertCircle, Sparkles, Tag } from 'lucide-react';
import { GroupBudget, GroupBudgetType, GroupCategory, GroupBudgetCategoryAllocation } from '../types';
import { ICONS } from './icons';

interface GroupBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budgetData: Partial<GroupBudget>) => Promise<void>;
  existingBudget?: GroupBudget | null;
  groupCategories: GroupCategory[];
  groupType?: string;
}

const GroupBudgetModal: React.FC<GroupBudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  existingBudget,
  groupCategories,
  groupType
}) => {
  const isTripOrEvent = groupType === 'TRIP' || groupType === 'EVENT' || groupType === 'PROJECT';
  const defaultType: GroupBudgetType = isTripOrEvent ? 'OVERALL' : 'RECURRING_MONTHLY';

  const [budgetType, setBudgetType] = useState<GroupBudgetType>(defaultType);
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [allocations, setAllocations] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (existingBudget) {
      setBudgetType(existingBudget.budget_type || defaultType);
      setTotalAmount(existingBudget.total_amount ? existingBudget.total_amount.toString() : '');
      setNotes(existingBudget.notes || '');

      const initialAllocMap: Record<number, string> = {};
      if (existingBudget.allocations) {
        existingBudget.allocations.forEach(alloc => {
          if (alloc.group_category?.id) {
            initialAllocMap[alloc.group_category.id] = alloc.allocated_amount.toString();
          }
        });
      }
      setAllocations(initialAllocMap);
    } else {
      setBudgetType(defaultType);
      setTotalAmount('');
      setNotes('');
      setAllocations({});
    }
    setError(null);
  }, [existingBudget, isOpen, groupType]);

  if (!isOpen) return null;

  const numTotalAmount = parseFloat(totalAmount) || 0;
  const totalAllocated = Object.values(allocations).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
  const isExceeded = totalAllocated > numTotalAmount && numTotalAmount > 0;

  const handleAllocationChange = (catId: number, val: string) => {
    setAllocations(prev => ({
      ...prev,
      [catId]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numTotalAmount <= 0) {
      setError('Please enter a valid total budget amount.');
      return;
    }
    if (isExceeded) {
      setError(`Total allocations (₹${totalAllocated.toLocaleString()}) exceed total budget cap (₹${numTotalAmount.toLocaleString()}).`);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const allocationList: GroupBudgetCategoryAllocation[] = Object.entries(allocations)
        .map(([catId, val]) => {
          const amt = parseFloat(val);
          if (isNaN(amt) || amt <= 0) return null;
          return {
            group_category: { id: Number(catId) } as GroupCategory,
            allocated_amount: amt
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      await onSave({
        id: existingBudget?.id,
        name: existingBudget?.name || 'Group Budget',
        budget_type: budgetType,
        total_amount: numTotalAmount,
        notes: notes.trim() || undefined,
        allocations: allocationList
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save group budget');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-850 dark:text-white">
                {existingBudget ? 'Edit Group Budget' : 'Configure Group Budget'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">Set total cap & category spending allocations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Budget Type Selector */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2.5">
              Budget Type & Reset Behavior
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBudgetType('OVERALL')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  budgetType === 'OVERALL'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm mb-1">
                  <Sparkles className="w-4 h-4" /> Overall Spend
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                  Cumulative cap across the group's lifetime (e.g., Trips, Events)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setBudgetType('RECURRING_MONTHLY')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  budgetType === 'RECURRING_MONTHLY'
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 ring-2 ring-cyan-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-sm mb-1">
                  <Calendar className="w-4 h-4" /> Monthly Reset
                </div>
                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                  Resets every calendar month (e.g., Family spend, Flatmates)
                </p>
              </button>
            </div>
          </div>

          {/* Total Budget Amount */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Total Group Budget (₹)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                step="any"
                min="0"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="50000"
                required
                className="w-full pl-8 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-850 dark:text-white font-extrabold focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
          </div>

          {/* Category Allocations */}
          {groupCategories.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Category Allocations (Optional)
                </label>
                <span className={`text-xs font-bold ${isExceeded ? 'text-rose-500' : 'text-slate-400'}`}>
                  Allocated: ₹{totalAllocated.toLocaleString()} / ₹{numTotalAmount.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {groupCategories.map(cat => {
                  const IconComp = (ICONS as any)[cat.icon || 'Tag'] || Tag;
                  return (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 rounded-lg bg-slate-200/50 dark:bg-slate-700/50">
                          <IconComp className="w-4 h-4" style={{ color: cat.color || '#06b6d4' }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                          {cat.name}
                        </span>
                      </div>
                      <div className="relative w-32">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">₹</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={allocations[cat.id] || ''}
                          onChange={(e) => handleAllocationChange(cat.id, e.target.value)}
                          placeholder="0"
                          className="w-full pl-6 pr-2.5 py-1.5 text-xs font-extrabold rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Budget breakdown agreed upon for Goa trip..."
              rows={2}
              className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 text-slate-850 dark:text-white font-medium text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-extrabold rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || isExceeded}
              className="px-6 py-2.5 text-xs font-extrabold rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all"
            >
              {saving ? 'Saving...' : 'Save Group Budget'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default GroupBudgetModal;
