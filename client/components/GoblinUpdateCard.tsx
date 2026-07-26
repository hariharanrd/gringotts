import React, { useState } from 'react';
import { Edit3, Check, X, ArrowRight } from 'lucide-react';
import { Transaction, TransactionType, ParsedTransaction } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface GoblinUpdateCardProps {
  targetTx: Transaction;
  updateFields?: Partial<ParsedTransaction>;
  onSuccess: (updatedTxId: number) => void;
  isAlreadyUpdated?: boolean;
}

export const GoblinUpdateCard: React.FC<GoblinUpdateCardProps> = ({
  targetTx,
  updateFields,
  onSuccess,
  isAlreadyUpdated = false
}) => {
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);
  const [updated, setUpdated] = useState(isAlreadyUpdated);

  // Compute values after update
  const newValue = updateFields?.value !== undefined ? Number(updateFields.value) : targetTx.value;
  const newDesc = updateFields?.description || targetTx.description;
  const newDate = updateFields?.transaction_date || targetTx.transaction_time?.split('T')[0];
  const newPaymentMode = updateFields?.payment_mode || targetTx.payment_mode || 'UPI';

  const handleConfirmUpdate = async () => {
    setSaving(true);
    try {
      const payload: any = {
        id: targetTx.id,
        value: newValue,
        description: newDesc,
        transaction_time: newDate ? `${newDate}T${new Date().toTimeString().split(' ')[0]}` : targetTx.transaction_time,
        payment_mode: newPaymentMode,
        category: updateFields?.category_id ? { id: updateFields.category_id } : targetTx.category ? { id: targetTx.category.id } : undefined,
        subcategory: updateFields?.subcategory_id ? { id: updateFields.subcategory_id } : targetTx.subcategory ? { id: targetTx.subcategory.id } : undefined,
        item: updateFields?.item_id ? { id: updateFields.item_id } : targetTx.item ? { id: targetTx.item.id } : undefined,
        notes: updateFields?.notes !== undefined ? updateFields.notes : targetTx.notes
      };

      const txTypeUpper = String(targetTx.type || 'EXPENSE').toUpperCase();
      if (txTypeUpper === 'EXPENSE') {
        await api.updateExpense(payload);
      } else if (txTypeUpper === 'INCOME') {
        await api.updateIncome(payload);
      } else if (txTypeUpper === 'SAVING') {
        await api.updateSaving({ ...payload, is_in: (targetTx as any).is_in ?? true });
      } else if (txTypeUpper === 'REVOLVING') {
        await api.updateRevolving({ ...payload, is_give: (targetTx as any).is_give ?? true, closed: (targetTx as any).closed ?? false });
      } else {
        await api.updateExpense(payload);
      }

      setUpdated(true);
      showToast('Vault Transaction Updated! ✏️', 'success');
      onSuccess(targetTx.id);
    } catch (err: any) {
      console.error('Failed to update transaction via Goblin:', err);
      showToast(err.message || 'Failed to update transaction in vault', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-amber-500/30 p-4 shadow-xl shadow-amber-950/30 relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-400 to-amber-500" />

      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
            Vault Update Confirmation (Tx #{targetTx.id})
          </span>
        </div>
      </div>

      {updated ? (
        <div className="py-4 text-center space-y-2 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <p className="text-sm font-bold text-amber-300">Transaction #{targetTx.id} Updated!</p>
          <p className="text-xs text-slate-400">
            Updated to <span className="font-semibold text-amber-300">₹{newValue}</span> for "{newDesc}".
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          {/* Before vs After comparison */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            {/* Amount Change */}
            {newValue !== targetTx.value && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Amount:</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-slate-500">₹{targetTx.value}</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-amber-300">₹{newValue}</span>
                </div>
              </div>
            )}

            {/* Description Change */}
            {newDesc !== targetTx.description && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Description:</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-slate-500">{targetTx.description}</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-slate-200">{newDesc}</span>
                </div>
              </div>
            )}

            {/* Date Change */}
            {newDate && newDate !== targetTx.transaction_time?.split('T')[0] && (
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400">Date:</span>
                <div className="flex items-center gap-2">
                  <span className="line-through text-slate-500">{targetTx.transaction_time?.split('T')[0]}</span>
                  <ArrowRight className="w-3 h-3 text-amber-400" />
                  <span className="font-bold text-slate-200">{newDate}</span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmUpdate}
            disabled={saving}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-600 hover:from-amber-500 hover:to-emerald-500 text-white font-bold text-xs shadow-md shadow-amber-900/40 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Confirm Update Tx #{targetTx.id}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
