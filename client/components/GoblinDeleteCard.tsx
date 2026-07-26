import React, { useState } from 'react';
import { Trash2, Check, AlertTriangle } from 'lucide-react';
import { Transaction } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface GoblinDeleteCardProps {
  targetTx: Transaction;
  onSuccess: (deletedTxId: number) => void;
  isAlreadyDeleted?: boolean;
}

export const GoblinDeleteCard: React.FC<GoblinDeleteCardProps> = ({
  targetTx,
  onSuccess,
  isAlreadyDeleted = false
}) => {
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);
  const [deleted, setDeleted] = useState(isAlreadyDeleted);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteTransaction(targetTx.id);
      setDeleted(true);
      showToast(`Transaction #${targetTx.id} removed from vault! 🗑️`, 'info');
      onSuccess(targetTx.id);
    } catch (err: any) {
      console.error('Failed to delete transaction via Goblin:', err);
      showToast(err.message || 'Failed to delete transaction from vault', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-b from-slate-900/95 to-slate-950/95 border border-rose-500/40 p-4 shadow-xl shadow-rose-950/40 relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-600 via-amber-500 to-rose-600" />

      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-rose-900/40">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
            Vault Deletion Confirmation
          </span>
        </div>
      </div>

      {deleted ? (
        <div className="py-4 text-center space-y-2 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
            <Check className="w-6 h-6 stroke-[3]" />
          </div>
          <p className="text-sm font-bold text-rose-300">Transaction #{targetTx.id} Removed</p>
          <p className="text-xs text-slate-400">
            {targetTx.type} of ₹{targetTx.value} for "{targetTx.description}" erased from vault.
          </p>
        </div>
      ) : (
        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-900/40 space-y-1 text-slate-300">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-300">Tx ID:</span>
              <span className="font-mono">#{targetTx.id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-300">Amount:</span>
              <span className="font-bold text-amber-300">₹{Number(targetTx.value).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-rose-300">Description:</span>
              <span className="font-medium text-slate-200">{targetTx.description}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Date: {targetTx.transaction_time?.split('T')[0] || targetTx.createdAt?.split('T')[0]}</span>
              {targetTx.category && <span>Category: {targetTx.category.name}</span>}
            </div>
          </div>

          <button
            onClick={handleConfirmDelete}
            disabled={deleting}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-rose-700 via-rose-600 to-red-700 hover:from-rose-600 hover:to-red-600 text-white font-bold text-xs shadow-md shadow-rose-950/60 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 active:scale-95"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                Confirm Deletion of Tx #{targetTx.id}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
