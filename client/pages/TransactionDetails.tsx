import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Transaction, TransactionType } from '../types';
import {
  ArrowLeft, Pencil, Trash2,
  TrendingDown, TrendingUp, PiggyBank, RefreshCw,
  CalendarDays, Tag, Layers, Package, CreditCard, Banknote,
  ArrowDownCircle, ArrowUpCircle, CheckCircle2, Clock, StickyNote, Hash,
} from 'lucide-react';
import { useToast } from '../components/ToastContext';
import TransactionModal from '../components/TransactionModal';
import CategoryIcon from '../components/CategoryIcon';

/* ─── colour config per type ─── */
const TYPE_CONFIG: Record<TransactionType, {
  gradient: string;
  badge: string;
  icon: React.ElementType;
  amountClass: string;
}> = {
  [TransactionType.EXPENSE]: { gradient: 'from-rose-500 to-pink-600', badge: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400', icon: TrendingDown, amountClass: 'text-rose-500 dark:text-rose-400' },
  [TransactionType.INCOME]: { gradient: 'from-emerald-500 to-teal-600', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', icon: TrendingUp, amountClass: 'text-emerald-500 dark:text-emerald-400' },
  [TransactionType.SAVING]: { gradient: 'from-violet-500 to-purple-600', badge: 'bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400', icon: PiggyBank, amountClass: 'text-violet-500 dark:text-violet-400' },
  [TransactionType.REVOLVING]: { gradient: 'from-blue-500 to-cyan-600', badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400', icon: RefreshCw, amountClass: 'text-blue-500 dark:text-blue-400' },
};

/* ─── small field card helper ─── */
const Field: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; span?: boolean }> = ({
  icon: Icon, label, value, span,
}) => (
  <div className={`flex flex-col gap-1 ${span ? 'md:col-span-2' : ''}`}>
    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </p>
    <div className="text-sm font-medium text-slate-800 dark:text-white">{value}</div>
  </div>
);
/* ─── badge helper ─── */
const Badge: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${className}`}>
    {children}
  </span>
);

import { PAYMENT_MODE_MAP, SAVING_DIRECTION_MAP, REVOLVING_DIRECTION_MAP, REVOLVING_STATUS_MAP } from '../constants';

/* ════════════════════════════════════════════════════════════ */

const TransactionDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const type = new URLSearchParams(location.search).get('type') as TransactionType;
  const config = TYPE_CONFIG[type] ?? TYPE_CONFIG[TransactionType.EXPENSE];
  const TypeIcon = config.icon;

  /* ── fetch ── */
  const fetchTransaction = async () => {
    if (!id || !type) return;
    setIsLoading(true);
    try {
      let response;
      switch (type) {
        case TransactionType.EXPENSE: response = await api.getExpenseById(Number(id)); break;
        case TransactionType.INCOME: response = await api.getIncomeById(Number(id)); break;
        case TransactionType.SAVING: response = await api.getSavingById(Number(id)); break;
        case TransactionType.REVOLVING: response = await api.getRevolvingById(Number(id)); break;
        default: throw new Error('Invalid transaction type');
      }
      setTransaction(response);
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      showToast('Failed to fetch transaction details.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchTransaction(); }, [id, type]);

  /* ── delete ── */
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.deleteTransaction(Number(id));
      showToast('Transaction deleted successfully.', 'success');
      navigate(-1);
    } catch {
      showToast('Failed to delete transaction.', 'error');
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  /* ─── loading ─── */
  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin" />
    </div>
  );

  /* ─── not found ─── */
  if (!transaction) return (
    <div className="text-center py-10">
      <p className="text-slate-500 dark:text-slate-400">Transaction not found.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-cyan-500 hover:text-cyan-600 transition-colors">
        Go Back
      </button>
    </div>
  );

  /* ─── formatted date ─── */
  const dateStr = new Date(
    transaction.transaction_time || transaction.transactionTime || transaction.createdAt
  ).toLocaleString('en-IN', {
    dateStyle: 'medium', timeStyle: 'short',
  });

  /* ════════════════════════ render ════════════════════════ */
  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── top bar ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Transaction Details</h1>
        </div>

        {/* Edit + Delete */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700/50"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 text-sm font-semibold transition-colors border border-rose-200 dark:border-rose-800/50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* ── inline delete confirmation banner ── */}
      {confirmDelete && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 animate-in fade-in duration-200">
          <p className="text-sm font-medium text-rose-700 dark:text-rose-300">
            Are you sure you want to delete this transaction? This action cannot be undone.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-4 py-1.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
            >
              {deleting && <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              Yes, Delete
            </button>
          </div>
        </div>
      )}

      {/* ── hero card ── */}
      <div className={`rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-white shadow-lg`}>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 opacity-80 text-sm font-medium">
              <TypeIcon className="w-4 h-4" />
              {type.charAt(0) + type.slice(1).toLowerCase()}
            </div>
            <p className="text-3xl font-extrabold tracking-tight">
              ₹{transaction.value?.toLocaleString('en-IN') ?? 0}
            </p>
            <p className="text-white/75 text-sm">{transaction.description}</p>
          </div>
          <span className="text-xs font-semibold bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
            #{transaction.id}
          </span>
        </div>
      </div>

      {/* ── details grid ── */}
      <div className="glass-card p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">

          {/* Always-present fields */}
          <Field icon={Hash} label="Transaction ID" value={transaction.id} />
          <Field icon={CalendarDays} label="Date & Time" value={dateStr} />
          <Field icon={Banknote} label="Amount"
            value={
              <span className={`text-lg font-bold ${config.amountClass}`}>
                ₹{transaction.value?.toLocaleString('en-IN') ?? 0}
              </span>
            }
          />

          {/* Description */}
          <Field icon={StickyNote} label="Description" value={transaction.description || '—'} />

          {/* Category chain */}
          {transaction.category && (
            <Field icon={Tag} label="Category" value={
              <div className="flex items-center gap-2 mt-1">
                <CategoryIcon category={transaction.category} />
                <span>{transaction.category.name}</span>
              </div>
            } />
          )}
          {transaction.subcategory && (
            <Field icon={Layers} label="Sub-Category" value={transaction.subcategory.name} />
          )}
          {transaction.item && (
            <Field icon={Package} label="Item" value={transaction.item.name} />
          )}

          {/* ── Type-specific fields ── */}

          {/* EXPENSE: payment mode */}
          {type === TransactionType.EXPENSE && (
            <Field icon={CreditCard} label="Payment Mode"
              value={
                <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {PAYMENT_MODE_MAP[transaction.payment_mode] ?? transaction.payment_mode ?? '—'}
                </Badge>
              }
            />
          )}

          {/* INCOME: source (Removed per request) */}

          {/* SAVING: direction */}
          {type === TransactionType.SAVING && transaction.is_in !== undefined && (
            <Field icon={transaction.is_in ? ArrowDownCircle : ArrowUpCircle} label="Direction"
              value={
                <Badge className={transaction.is_in
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400'}>
                  {SAVING_DIRECTION_MAP[String(transaction.is_in)] ?? (transaction.is_in ? 'IN (Deposit)' : 'OUT (Withdrawal)')}
                </Badge>
              }
            />
          )}

          {/* REVOLVING: give/receive + status */}
          {type === TransactionType.REVOLVING && (
            <>
              <Field icon={transaction.is_give ? ArrowUpCircle : ArrowDownCircle} label="Direction"
                value={
                  <Badge className={transaction.is_give
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                    : 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400'}>
                    {REVOLVING_DIRECTION_MAP[String(transaction.is_give)] ?? (transaction.is_give ? 'Given (Lent)' : 'Received (Borrowed)')}
                  </Badge>
                }
              />
              <Field icon={transaction.closed ? CheckCircle2 : Clock} label="Status"
                value={
                  <Badge className={transaction.closed
                    ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}>
                    {REVOLVING_STATUS_MAP[String(transaction.closed)] ?? (transaction.closed ? 'Settled' : 'Open')}
                  </Badge>
                }
              />
            </>
          )}

          {/* Notes */}
          {transaction.notes && (
            <Field icon={StickyNote} label="Notes" span
              value={
                <p className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50 whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                  {transaction.notes}
                </p>
              }
            />
          )}
        </div>
      </div>

      {/* ── Edit modal ── */}
      <TransactionModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        onSuccess={(savedType, savedId) => {
          setEditOpen(false);
          if (savedType !== type || savedId !== Number(id)) {
            // Type or ID changed (backend deleted + re-created) — navigate to new URL
            navigate(`/transaction/${savedId}?type=${savedType}`, { replace: true });
          } else {
            fetchTransaction();
          }
        }}
        transaction={{ ...transaction, type }}
        defaultType={type}
      />
    </div>
  );
};

export default TransactionDetails;