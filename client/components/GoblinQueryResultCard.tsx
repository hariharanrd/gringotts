import React from 'react';
import { Search, Edit3, Trash2, Tag, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { Transaction } from '../types';

interface GoblinQueryResultCardProps {
  transactions: Transaction[];
  filterSummary?: string;
  onOpenModal?: (tx: Transaction) => void;
  onSelectForUpdate?: (tx: Transaction) => void;
  onSelectForDelete?: (tx: Transaction) => void;
}

export const GoblinQueryResultCard: React.FC<GoblinQueryResultCardProps> = ({
  transactions,
  filterSummary,
  onOpenModal,
  onSelectForUpdate,
  onSelectForDelete
}) => {
  const totalVal = transactions.reduce((sum, t) => sum + Number(t.value || 0), 0);

  return (
    <div className="mt-3 rounded-2xl bg-gradient-to-b from-white/95 via-emerald-50/50 to-teal-50/30 dark:from-slate-900/95 dark:to-slate-950/95 border border-emerald-500/30 p-4 shadow-xl shadow-emerald-900/10 dark:shadow-emerald-950/40 space-y-3 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2 pb-2 border-b border-emerald-500/20 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
            Vault Query Results
          </span>
        </div>
        <span className="text-[10px] font-extrabold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full self-start sm:self-auto">
          {transactions.length} Found • Total ₹{totalVal.toLocaleString()}
        </span>
      </div>

      {filterSummary && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
          🔍 {filterSummary}
        </p>
      )}

      {transactions.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-2 text-center">
          No transactions found matching your criteria in the vault ledger.
        </p>
      ) : (
        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
          {transactions.map(tx => (
            <div
              key={tx.id}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/90 flex flex-col gap-1.5 hover:border-emerald-500/40 transition-colors shadow-sm"
            >
              {/* Top Row: Type Badge + Description + Amount */}
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded border shrink-0 ${
                    tx.type === 'INCOME'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : tx.type === 'SAVING'
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {tx.type}
                  </span>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate min-w-0">
                    {tx.description || 'Untitled Transaction'}
                  </span>
                </div>
                <span className="text-xs font-black text-amber-600 dark:text-amber-300 shrink-0">
                  ₹{Number(tx.value).toLocaleString()}
                </span>
              </div>

              {/* Bottom Row: Date & Category on Left, Action Buttons on Right */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-900/60 text-[10px] text-slate-400">
                <div className="flex items-center gap-2 min-w-0 overflow-hidden text-ellipsis whitespace-nowrap">
                  <span>📅 {tx.transaction_time?.split('T')[0] || tx.createdAt?.split('T')[0]}</span>
                  {tx.category && (
                    <span className="truncate">🏷️ {tx.category.name}</span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {onOpenModal && (
                    <button
                      onClick={() => onOpenModal(tx)}
                      className="p-1 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition-colors"
                      title="Edit directly via Transaction Modal"
                    >
                      <Edit3 className="w-3 h-3" />
                    </button>
                  )}

                  {onSelectForUpdate && (
                    <button
                      onClick={() => onSelectForUpdate(tx)}
                      className="p-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition-colors"
                      title="Prefill update prompt into chat input"
                    >
                      <Sparkles className="w-3 h-3" />
                    </button>
                  )}

                  {onSelectForDelete && (
                    <button
                      onClick={() => onSelectForDelete(tx)}
                      className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition-colors"
                      title="Prefill delete prompt into chat input"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
