import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Target, TrendingUp, TrendingDown, Edit2, Trash2, Tag, X, Check, Goal,
  Search, Sparkles, Folder, Layers, Archive, CheckCircle2, RefreshCw,
  PencilLine, ArrowUpRight, ArrowDownRight, Minus, Clock
} from 'lucide-react';
import { api } from '../services/api';
import { InvestmentGoal, Item, Category } from '../types';
import { useToast } from '../components/ToastContext';
import ConfirmationDialog from '../components/ConfirmationDialog';

// ── Preset icons & colors ──────────────────────────────────────────────────────
const ICON_PRESETS = ['🎯', '🏠', '🚗', '✈️', '🎓', '💍', '🏥', '🌴', '💼', '📱', '🛡️', '🌱', '⚡', '🎮', '🛒'];
const COLOR_PRESETS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981',
  '#f59e0b', '#ef4444', '#3b82f6', '#84cc16', '#f97316',
];

// ── Arc progress component ─────────────────────────────────────────────────────
const ArcProgress: React.FC<{ percent: number; investedPercent?: number; color: string; size?: number }> = ({
  percent, investedPercent, color, size = 120
}) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(percent, 100);
  const dash = (capped / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  // Invested inner ring (if separate)
  const investedCapped = Math.min(investedPercent ?? capped, 100);
  const investedDash = (investedCapped / 100) * circ;
  const hasReturns = investedPercent !== undefined && investedPercent !== capped;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
        strokeWidth={8} className="text-slate-200 dark:text-slate-700/60" />
      {/* Invested segment (muted) */}
      {hasReturns && (
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
          strokeWidth={8} strokeLinecap="butt" strokeOpacity={0.35}
          strokeDasharray={`${investedDash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
      )}
      {/* Current value segment (full brightness) */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
        strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  );
};

// ── Dual-segment progress bar ─────────────────────────────────────────────────
const DualProgressBar: React.FC<{
  percent: number;
  investedPercent: number;
  color: string;
  returnsAmount: number | null | undefined;
}> = ({ percent, investedPercent, color, returnsAmount }) => {
  const hasReturns = returnsAmount != null;
  const isGain = hasReturns && returnsAmount! > 0;
  const isLoss = hasReturns && returnsAmount! < 0;

  const valuePct = Math.min(percent, 100);
  const invPct = Math.min(investedPercent, 100);

  // If no separate current_value, single solid bar
  if (!hasReturns || Math.abs(valuePct - invPct) < 0.1) {
    return (
      <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/20 dark:border-slate-700/10">
        <div
          className="h-2 rounded-full transition-all duration-500 shadow-sm"
          style={{
            width: `${Math.min(invPct, 100)}%`,
            background: `linear-gradient(90deg, ${color}, ${color}cc)`
          }}
        />
      </div>
    );
  }

  // Dual segment
  const gainColor = '#10b981';
  const lossColor = '#ef4444';

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-800/80 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/20 dark:border-slate-700/10 relative">
      {/* Invested layer (muted) */}
      <div
        className="absolute top-0.5 left-0.5 h-2 rounded-full transition-all duration-500"
        style={{
          width: `${invPct}%`,
          background: `${color}55`
        }}
      />
      {/* Current value layer */}
      {isGain && (
        <div
          className="absolute top-0.5 left-0.5 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${valuePct}%`,
            background: `linear-gradient(90deg, ${color}cc, ${gainColor})`
          }}
        />
      )}
      {isLoss && (
        <div
          className="absolute top-0.5 left-0.5 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${valuePct}%`,
            background: `linear-gradient(90deg, ${lossColor}99, ${lossColor}cc)`
          }}
        />
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number) => {
  if (n < 1000) return '₹' + n;
  if (n >= 10000000) {
    const cr = n / 10000000;
    const formatted = cr % 1 === 0 ? cr.toString() : cr.toFixed(2).replace(/\.?0+$/, '');
    return '₹' + formatted + 'C';
  }
  if (n >= 100000) {
    const lakh = n / 100000;
    const formatted = lakh % 1 === 0 ? lakh.toString() : lakh.toFixed(2).replace(/\.?0+$/, '');
    return '₹' + formatted + 'L';
  }
  if (n >= 1000) {
    const k = n / 1000;
    const formatted = k % 1 === 0 ? k.toString() : k.toFixed(1).replace(/\.?0+$/, '');
    return '₹' + formatted + 'K';
  }
  return '₹' + n.toLocaleString('en-IN');
};

function projectYearLabel(yearsToGoal: number | null | undefined): string {
  if (yearsToGoal == null) return '—';
  if (yearsToGoal === 0) return 'Achieved! 🎉';
  const now = new Date();
  const totalMonths = Math.round(yearsToGoal * 12);
  const targetDate = new Date(now.getFullYear(), now.getMonth() + totalMonths, 1);
  const monthLabel = targetDate.toLocaleString('default', { month: 'short' });
  const yearLabel = targetDate.getFullYear();
  const label = yearsToGoal < 1
    ? `${totalMonths} months`
    : yearsToGoal % 1 === 0
      ? `${yearsToGoal} yrs`
      : `~${yearsToGoal.toFixed(1)} yrs`;
  return `${label} (est. ${monthLabel} ${yearLabel})`;
}

const getTagIcon = (type: string) => {
  if (type === 'CATEGORY') return <Folder className="w-3 h-3" />;
  if (type === 'SUBCATEGORY') return <Layers className="w-3 h-3" />;
  return <Tag className="w-3 h-3" />;
};

const getTagName = (t: any) => t.item?.name || t.subcategory?.name || t.category?.name;

function formatLastUpdated(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Updated today';
  if (diffDays === 1) return 'Updated yesterday';
  if (diffDays < 30) return `Updated ${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `Updated ${diffMonths}mo ago`;
}

// ── Empty state ───────────────────────────────────────────────────────────────
const EmptyGoals: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-6">
    <div className="relative">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/20 to-cyan-500/20 flex items-center justify-center">
        <Sparkles className="w-10 h-10 text-violet-400" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
        <Target className="w-4 h-4 text-white" />
      </div>
    </div>
    <div className="text-center">
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">No goals yet</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm max-w-xs">
        Set your first investment goal — Emergency Fund, Home, Car, or anything you dream of.
      </p>
    </div>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-semibold text-sm shadow-lg transition-all"
      style={{
        background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
        boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
    >
      <Plus className="w-4 h-4" /> Add Your First Goal
    </button>
  </div>
);

// ── Returns Badge ─────────────────────────────────────────────────────────────
const ReturnsBadge: React.FC<{ returnsAmount: number; returnsPct: number; compact?: boolean }> = ({
  returnsAmount, returnsPct, compact
}) => {
  const isGain = returnsAmount >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold tabular-nums rounded-md px-1.5 py-0.5 ${
      isGain
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
    }`}>
      {isGain ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
      {compact
        ? `${returnsPct >= 0 ? '+' : ''}${returnsPct.toFixed(1)}%`
        : `${returnsAmount >= 0 ? '+' : ''}${fmtCompact(Math.abs(returnsAmount))} (${returnsPct >= 0 ? '+' : ''}${returnsPct.toFixed(1)}%)`}
    </span>
  );
};

// ── Goal Card ─────────────────────────────────────────────────────────────────
interface GoalCardProps {
  goal: InvestmentGoal;
  onEdit: (g: InvestmentGoal) => void;
  onDelete: (g: InvestmentGoal) => void;
  onArchive?: (g: InvestmentGoal) => void;
  onUpdateValue: (g: InvestmentGoal) => void;
  onClick: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onArchive, onUpdateValue, onClick }) => {
  const isOneTime = goal.goal_type === 'ONE_TIME';
  const pct = goal.percent_achieved ?? 0;
  const investedPct = goal.percent_invested ?? pct;
  const color = goal.is_closed ? '#94a3b8' : (goal.color ?? '#6366f1');
  const remaining = isOneTime
    ? Math.max(goal.target_amount - goal.current_amount, 0)
    : Math.max(goal.target_amount - (goal.current_value ?? goal.current_amount), 0);
  const hasCurrentValue = goal.current_value != null;
  const displayValue = isOneTime ? goal.current_amount : (hasCurrentValue ? goal.current_value! : goal.current_amount);

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border ${goal.is_closed ? 'border-slate-300 dark:border-slate-700 opacity-80' : 'border-slate-200 dark:border-slate-700/50'} overflow-hidden hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1 cursor-pointer`}
    >
      {/* Color accent bar */}
      <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-sm"
              style={{ background: `${color}22` }}>
              {goal.icon ?? '🎯'}
            </div>
            <div>
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight truncate max-w-[120px]">{goal.name}</h3>
                  {goal.is_closed && <span className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Closed</span>}
                  <span className={`px-1.5 py-0.25 rounded text-[8px] uppercase font-black border tracking-wider ${goal.goal_type === 'ONE_TIME'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    : 'bg-violet-500/10 text-violet-500 border-violet-500/20'
                    }`}>
                    {goal.goal_type === 'ONE_TIME' ? 'One-time' : 'Refillable'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{goal.annual_rate}% p.a.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            {!goal.is_closed && (
              <button onClick={(e) => { e.stopPropagation(); onUpdateValue(goal); }}
                title="Update Market Value"
                className="p-1.5 rounded-lg text-slate-400 hover:text-violet-500 hover:bg-violet-500/10 transition-all">
                <PencilLine className="w-4 h-4" />
              </button>
            )}
            {!goal.is_closed && pct >= 100 && onArchive && (
              <button onClick={(e) => { e.stopPropagation(); onArchive(goal); }}
                title="Mark as Closed"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all">
                <Archive className="w-4 h-4" />
              </button>
            )}
            {!goal.is_closed && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(goal); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(goal); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Two-column stat boxes: Invested vs Current Value */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-xl px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/40">
            <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">💰 Invested</p>
            <p className="text-sm font-black tabular-nums text-slate-700 dark:text-slate-200 mt-0.5">{fmtCompact(goal.current_amount)}</p>
            {goal.goal_type === 'ONE_TIME' && goal.total_funded && goal.total_funded > 0 ? (
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5" title={`Active: ${fmt(goal.active_invested ?? (goal.current_amount - goal.total_funded))} · Spent: ${fmt(goal.total_funded)}`}>
                {fmtCompact(goal.active_invested ?? (goal.current_amount - goal.total_funded))} active · {fmtCompact(goal.total_funded)} spent
              </p>
            ) : null}
          </div>
          <div className={`rounded-xl px-3 py-2 border ${hasCurrentValue
            ? 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800/40'
            : 'bg-slate-50/40 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-700/40'
          }`}>
            <div className="flex items-center justify-between gap-1">
              <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">📈 Current Value</p>
              {goal.returns_amount != null && goal.returns_percent != null && (
                <ReturnsBadge returnsAmount={goal.returns_amount} returnsPct={goal.returns_percent} compact />
              )}
            </div>
            {hasCurrentValue ? (
              <>
                <p className="text-sm font-black tabular-nums text-slate-700 dark:text-slate-200 mt-0.5">{fmtCompact(goal.current_value!)}</p>
                {goal.last_value_updated_at && (
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{formatLastUpdated(goal.last_value_updated_at)}</p>
                )}
              </>
            ) : (
              <p className="text-[11px] text-slate-400 italic mt-0.5">Not tracked</p>
            )}
          </div>
        </div>

        {/* Progress Bar + Labels */}
        <div className="mt-3 space-y-2">
          <div className="flex justify-between items-baseline">
            <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              <span className="font-bold text-sm tabular-nums text-slate-900 dark:text-white">{fmtCompact(displayValue)}</span>
              <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>
              <span className="font-medium text-xs tabular-nums text-slate-500 dark:text-slate-400">{fmtCompact(goal.target_amount)}</span>
              <span className="ml-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-bold">({pct.toFixed(0)}%)</span>
            </div>
            {remaining > 0 ? (
              <span className="text-[10px] uppercase tracking-wider font-bold text-rose-500 dark:text-rose-400 tabular-nums">
                {fmtCompact(remaining)} required
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-500 dark:text-emerald-400">
                Goal Achieved!
              </span>
            )}
          </div>

          <DualProgressBar
            percent={pct}
            investedPercent={investedPct}
            color={color}
            returnsAmount={goal.returns_amount}
          />

          {/* Legend when dual mode is active */}
          {hasCurrentValue && goal.returns_amount != null && (
            <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-full inline-block" style={{ background: `${color}55` }} />
                Invested ({investedPct.toFixed(0)}%)
              </span>
              <span className="flex items-center gap-1">
                <span className={`w-2.5 h-1.5 rounded-full inline-block`} style={{ background: color }} />
                Value ({pct.toFixed(0)}%)
              </span>
            </div>
          )}
        </div>

        {/* Monthly Contribution */}
        <div className="mt-2 flex items-center justify-between text-sm">
          <span className="text-slate-400 dark:text-slate-500 text-xs">Monthly Contribution</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(goal.monthly_contribution)}</span>
        </div>

        {/* Projection */}
        <div className="mt-3 px-3 py-2 rounded-xl text-xs font-medium"
          style={{ background: `${color}18`, color }}>
          <TrendingUp className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
          {projectYearLabel(goal.years_to_goal)}
        </div>

        {/* Tags */}
        {goal.tags && goal.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {goal.tags.map(t => (
              <span key={t.id} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium">
                {getTagIcon(t.type)} {getTagName(t)}
              </span>
            ))}
          </div>
        )}

        {/* Spent / Funded from Goal */}
        {goal.total_funded && goal.total_funded > 0 ? (
          <div className="mt-3 pt-3 border-t border-dashed border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-400 dark:text-slate-500 font-medium">Spent from Goal</span>
            <span className="text-rose-500 dark:text-rose-400 tabular-nums">
              -{fmt(goal.total_funded)}
            </span>
          </div>
        ) : null}

        {/* Notes */}
        {goal.notes && (
          <div
            className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 italic bg-slate-50/50 dark:bg-slate-900/30 px-2.5 py-1.5 rounded-xl border border-slate-100/50 dark:border-slate-800/20 truncate font-medium"
            title={goal.notes}
          >
            "{goal.notes}"
          </div>
        )}
      </div>
    </div>
  );
};

// ── Update Market Value Modal ──────────────────────────────────────────────────
interface UpdateValueModalProps {
  goal: InvestmentGoal | null;
  onClose: () => void;
  onSaved: (g: InvestmentGoal) => void;
}

const UpdateValueModal: React.FC<UpdateValueModalProps> = ({ goal, onClose, onSaved }) => {
  const { showToast } = useToast();
  const [value, setValue] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (goal) {
      setValue(goal.current_value != null ? String(goal.current_value) : '');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [goal]);

  if (!goal) return null;

  const numValue = parseFloat(value) || 0;
  const totalInvested = goal.current_amount;
  const activeInvested = goal.active_invested ?? (goal.goal_type === 'ONE_TIME' && goal.total_funded ? Math.max(0, goal.current_amount - goal.total_funded) : goal.current_amount);
  const returnsAmount = value !== '' ? numValue - activeInvested : null;
  const returnsPct = returnsAmount != null && activeInvested > 0 ? (returnsAmount / activeInvested) * 100 : null;
  const color = goal.color ?? '#6366f1';

  const handleSave = async () => {
    setSaving(true);
    try {
      const newValue = value === '' ? null : numValue;
      const updated = await api.updateGoalCurrentValue(goal.id!, newValue);
      onSaved(updated);
      onClose();
      showToast('Market value updated', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to update value', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const updated = await api.updateGoalCurrentValue(goal.id!, null);
      onSaved(updated);
      onClose();
      showToast('Market value tracking cleared', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to clear value', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Color accent */}
        <div className="h-1 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}88)` }} />

        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: `${color}22` }}>
                {goal.icon ?? '🎯'}
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">Update Market Value</h2>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{goal.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Invested context */}
          <div className="space-y-1 py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Total Invested</span>
              <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200">{fmtCompact(totalInvested)}</span>
            </div>
            {goal.goal_type === 'ONE_TIME' && goal.total_funded && goal.total_funded > 0 ? (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-700/40">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Active Capital ({fmtCompact(goal.total_funded)} spent)</span>
                <span className="font-black tabular-nums text-violet-600 dark:text-violet-400">{fmtCompact(activeInvested)}</span>
              </div>
            ) : null}
          </div>

          {/* Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Current Value (₹)
            </label>
            <input
              ref={inputRef}
              type="number"
              min={0}
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder={String(activeInvested)}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${color}66` } as React.CSSProperties}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <p className="text-[10px] text-slate-400 mt-1">Leave blank to stop tracking market value separately.</p>
          </div>

          {/* Live returns preview */}
          {returnsAmount !== null && (
            <div className={`px-4 py-3 rounded-2xl border flex items-center justify-between ${
              returnsAmount >= 0
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <div className="flex items-center gap-2">
                {returnsAmount >= 0
                  ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  : <ArrowDownRight className="w-4 h-4 text-rose-500" />}
                <span className={`text-xs font-bold ${returnsAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  Returns
                </span>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black tabular-nums ${returnsAmount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {returnsAmount >= 0 ? '+' : ''}{fmtCompact(returnsAmount)}
                </p>
                {returnsPct !== null && (
                  <p className={`text-[10px] font-bold tabular-nums ${returnsAmount >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {returnsPct >= 0 ? '+' : ''}{returnsPct.toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {goal.current_value != null && (
              <button
                onClick={handleClear}
                disabled={saving}
                className="flex-none px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Clear
              </button>
            )}
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-2xl text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-60"
              style={{
                background: `linear-gradient(to right, ${color}, ${color}cc)`,
              }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Goal Modal ────────────────────────────────────────────────────────────────
interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (g: InvestmentGoal) => void;
  editGoal?: InvestmentGoal | null;
}

const EMPTY_FORM: Partial<InvestmentGoal> = {
  name: '', icon: '🎯', color: '#6366f1',
  target_amount: 0, current_amount: 0, current_value: undefined, annual_rate: 8, notes: '',
  goal_type: 'PERSISTENT',
};

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSaved, editGoal }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<Partial<InvestmentGoal>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  // currentValueStr keeps empty string vs "0" distinction
  const [currentValueStr, setCurrentValueStr] = useState<string>('');

  // Close picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    };
    if (showIconPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIconPicker]);

  // CSI tagging state
  const [csiOptions, setCsiOptions] = useState<{ id: number, name: string, type: 'CATEGORY' | 'SUBCATEGORY' | 'ITEM', obj: any }[]>([]);
  const [itemSearch, setItemSearch] = useState('');
  const [localTags, setLocalTags] = useState<InvestmentGoal['tags']>([]);

  useEffect(() => {
    if (isOpen) {
      if (editGoal) {
        setForm({ ...editGoal });
        setLocalTags(editGoal.tags ?? []);
        setCurrentValueStr(editGoal.current_value != null ? String(editGoal.current_value) : '');
      } else {
        setForm(EMPTY_FORM);
        setLocalTags([]);
        setCurrentValueStr('');
      }
      setItemSearch('');
    }
  }, [isOpen, editGoal]);

  // Load all SAVING categories, subcategories, and items on open
  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      try {
        const cats: Category[] = await api.getCategories('SAVING');
        const options: any[] = [];
        for (const cat of cats) {
          options.push({ id: cat.id, name: cat.name, type: 'CATEGORY', obj: cat });
          const subs = await api.getSubCategories(cat.id);
          for (const sub of subs) {
            options.push({ id: sub.id, name: sub.name, type: 'SUBCATEGORY', obj: sub });
            const items = await api.getItems(sub.id);
            for (const item of items) {
              options.push({ id: item.id, name: item.name, type: 'ITEM', obj: item });
            }
          }
        }
        setCsiOptions(options);
      } catch { /* ignore */ }
    })();
  }, [isOpen]);

  const proj = useCallback(() => {
    const cur = form.current_amount ?? 0;
    const tgt = form.target_amount ?? 0;
    const r_a = form.annual_rate ?? 8;
    const pmt = form.monthly_contribution ?? 0;

    if (tgt <= 0) return null;
    if (cur >= tgt) return 0;

    const r_m = r_a / 12 / 100;

    if (r_m <= 0) {
      if (pmt <= 0) return null;
      return Math.round((tgt - cur) / pmt / 12 * 10) / 10;
    }

    if (pmt <= 0) {
      if (cur <= 0) return null;
      return Math.round(Math.log(tgt / cur) / Math.log(1 + r_m) / 12 * 10) / 10;
    }

    const A = tgt + pmt / r_m;
    const B = cur + pmt / r_m;
    if (A <= 0 || B <= 0 || A <= B) return null;

    const months = Math.log(A / B) / Math.log(1 + r_m);
    return Math.round(months / 12 * 10) / 10;
  }, [form.current_amount, form.target_amount, form.annual_rate, form.monthly_contribution]);

  const handleSubmit = async () => {
    if (!form.name?.trim()) { showToast('Goal name is required', 'error'); return; }
    if (!form.target_amount || form.target_amount <= 0) { showToast('Target amount must be > 0', 'error'); return; }
    setSaving(true);
    try {
      let saved: InvestmentGoal;
      // Parse current_value: empty string = undefined (not set)
      const parsedCurrentValue = currentValueStr === '' ? undefined : (parseFloat(currentValueStr) || undefined);
      const payload = {
        ...form,
        current_value: parsedCurrentValue,
        tags: localTags?.map(t => ({
          type: t.type,
          id: t.category?.id || t.subcategory?.id || t.item?.id
        }))
      };

      if (editGoal?.id) {
        saved = await api.updateGoal(editGoal.id, payload);
      } else {
        saved = await api.createGoal(payload);
      }
      onSaved(saved);
      onClose();
    } catch (e: any) {
      showToast(e.message ?? 'Failed to save goal', 'error');
    } finally { setSaving(false); }
  };

  const handleAddTag = (opt: any) => {
    const exists = localTags?.some(t => {
      if (opt.type === 'ITEM') return t.item?.id === opt.id;
      if (opt.type === 'SUBCATEGORY') return t.subcategory?.id === opt.id;
      return t.category?.id === opt.id;
    });
    if (exists) return;

    const newTag: any = { id: 0, type: opt.type };
    if (opt.type === 'ITEM') newTag.item = opt.obj;
    else if (opt.type === 'SUBCATEGORY') newTag.subcategory = opt.obj;
    else newTag.category = opt.obj;

    setLocalTags(prev => [...(prev ?? []), newTag]);
  };

  const handleRemoveTag = (tag: any) => {
    setLocalTags(prev => prev?.filter(t => t !== tag) ?? []);
  };

  const filteredOptions = csiOptions.filter(opt => {
    const isTagged = localTags?.some(t => {
      if (opt.type === 'ITEM') return t.item?.id === opt.id;
      if (opt.type === 'SUBCATEGORY') return t.subcategory?.id === opt.id;
      return t.category?.id === opt.id;
    });
    return opt.name.toLowerCase().includes(itemSearch.toLowerCase()) && !isTagged;
  });

  const projYears = proj();
  const pctNow = form.target_amount && form.target_amount > 0
    ? Math.min((form.current_amount ?? 0) / form.target_amount * 100, 100) : 0;

  // Live returns preview in modal
  const cvNum = currentValueStr !== '' ? (parseFloat(currentValueStr) || 0) : null;
  const modalReturns = cvNum != null && (form.current_amount ?? 0) > 0
    ? cvNum - (form.current_amount ?? 0) : null;
  const modalReturnsPct = modalReturns != null && (form.current_amount ?? 0) > 0
    ? (modalReturns / (form.current_amount ?? 1)) * 100 : null;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-auto w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {editGoal ? 'Edit Goal' : 'New Investment Goal'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Live projection preview */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-200/40 dark:border-violet-500/20">
            <div className="relative shrink-0">
              <ArcProgress percent={pctNow} color={form.color ?? '#6366f1'} size={72} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold" style={{ color: form.color ?? '#6366f1' }}>
                  {pctNow.toFixed(0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {projYears === null
                  ? 'Add invested amount to see projection'
                  : projectYearLabel(projYears)}
              </p>
              {projYears != null && projYears > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {form.annual_rate}% annual growth
                  </p>
                  <p className="text-[10px] leading-tight text-slate-400 dark:text-slate-500/70 mt-1.5 italic">
                    * Projections are based on Invested Amount, not market value.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Icon + Name row */}
          <div className="flex gap-3">
            <div className="relative shrink-0" ref={iconPickerRef}>
              <button
                type="button"
                onClick={() => setShowIconPicker(p => !p)}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl border-2 transition-all hover:scale-105 active:scale-95 shadow-sm"
                style={{ borderColor: form.color ?? '#6366f1', background: `${form.color ?? '#6366f1'}18` }}
              >
                {form.icon ?? '🎯'}
              </button>
              {showIconPicker && (
                <div className="absolute left-0 top-full mt-3 z-30 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 grid grid-cols-5 gap-2 border border-slate-200 dark:border-slate-700 w-max animate-in fade-in zoom-in-95 duration-200 origin-top-left">
                  {ICON_PRESETS.map(ic => (
                    <button key={ic}
                      type="button"
                      onClick={() => { setForm(f => ({ ...f, icon: ic })); setShowIconPicker(false); }}
                      className="w-10 h-10 rounded-xl text-2xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition-all hover:scale-110 active:scale-90">
                      {ic}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              value={form.name ?? ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Goal name (e.g. Emergency Fund)"
              className="flex-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLOR_PRESETS.map(c => (
                <button key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-8 h-8 rounded-xl transition-all hover:scale-110 flex items-center justify-center"
                  style={{ background: c, boxShadow: form.color === c ? `0 0 0 3px ${c}55` : 'none' }}>
                  {form.color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Goal Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Goal Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, goal_type: 'PERSISTENT' }))}
                className={`px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all flex flex-col items-center justify-center text-center gap-0.5 ${form.goal_type !== 'ONE_TIME'
                  ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                  }`}
              >
                <span className="text-xs">🔄 Persistent</span>
                <span className="text-[9px] font-normal opacity-70">Emergency Fund, etc.</span>
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, goal_type: 'ONE_TIME' }))}
                className={`px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all flex flex-col items-center justify-center text-center gap-0.5 ${form.goal_type === 'ONE_TIME'
                  ? 'border-violet-500 bg-violet-500/10 text-violet-700 dark:text-violet-300 shadow-sm'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500'
                  }`}
              >
                <span className="text-xs">🎯 One-Time</span>
                <span className="text-[9px] font-normal opacity-70">Buying Car/Home, etc.</span>
              </button>
            </div>
          </div>

          {/* Target Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Target Amount (₹)</label>
            <input
              type="number" min={0} value={form.target_amount || ''}
              onChange={e => setForm(f => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
              placeholder="500000"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Invested Amount + Current Value (two columns) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Invested Amount (₹)
              </label>
              <input
                type="number" min={0} value={form.current_amount || ''}
                onChange={e => setForm(f => ({ ...f, current_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Total principal put in</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Current Value (₹) <span className="normal-case font-normal text-slate-400">optional</span>
              </label>
              <input
                type="number" min={0} value={currentValueStr}
                onChange={e => setCurrentValueStr(e.target.value)}
                placeholder="Market value today"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
              />
              <p className="text-[10px] text-slate-400 mt-1">Leave blank if not tracking</p>
            </div>
          </div>

          {/* Live returns preview (in edit modal) */}
          {modalReturns !== null && (form.current_amount ?? 0) > 0 && (
            <div className={`px-4 py-2.5 rounded-xl border flex items-center justify-between ${
              modalReturns >= 0
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-rose-500/5 border-rose-500/20'
            }`}>
              <span className={`text-xs font-semibold ${modalReturns >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {modalReturns >= 0 ? '📈' : '📉'} Returns
              </span>
              <span className={`text-sm font-black tabular-nums ${modalReturns >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {modalReturns >= 0 ? '+' : ''}{fmtCompact(modalReturns)}
                {modalReturnsPct != null && <span className="text-xs ml-1">({modalReturnsPct >= 0 ? '+' : ''}{modalReturnsPct.toFixed(1)}%)</span>}
              </span>
            </div>
          )}

          {/* Monthly Contribution */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Monthly Contribution (₹)</label>
            <input
              type="number" min={0} value={form.monthly_contribution || ''}
              onChange={e => setForm(f => ({ ...f, monthly_contribution: parseFloat(e.target.value) || 0 }))}
              placeholder="10000"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
            />
          </div>

          {/* Rate */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Annual Growth Rate (%) <span className="text-slate-400 normal-case font-normal">— approx. expected return</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range" min={1} max={30} step={0.5}
                value={form.annual_rate ?? 8}
                onChange={e => setForm(f => ({ ...f, annual_rate: parseFloat(e.target.value) }))}
                className="flex-1 accent-violet-500"
              />
              <span className="w-14 text-right font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                {form.annual_rate ?? 8}%
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes (optional)</label>
            <textarea
              value={form.notes ?? ''}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any notes about this goal..."
              rows={2}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all resize-none"
            />
          </div>

          {/* Item Tags section */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="w-4 h-4 text-violet-400" />
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Auto-credit from Savings
              </label>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">
              Tag a Category, Subcategory, or Item. Any matching saving will be added to this goal.
            </p>

            {/* Existing tags */}
            {localTags && localTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {localTags.map((t, idx) => (
                  <span key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-200/40 dark:border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs font-medium">
                    {getTagIcon(t.type)} {getTagName(t)}
                    <button onClick={() => handleRemoveTag(t)}
                      className="ml-1 text-violet-400 hover:text-rose-400 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Item search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={itemSearch}
                onChange={e => setItemSearch(e.target.value)}
                placeholder="Search categories, subs, or items..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50"
              />
            </div>
            {itemSearch && filteredOptions.length > 0 && (
              <div className="mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-h-36 overflow-y-auto shadow-lg">
                {filteredOptions.slice(0, 15).map(opt => (
                  <button key={`${opt.type}-${opt.id}`}
                    onClick={() => { handleAddTag(opt); setItemSearch(''); }}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-violet-500/10 transition-colors text-left">
                    <div className="flex items-center gap-2">
                      {getTagIcon(opt.type)}
                      {opt.name}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400">{opt.type}</span>
                  </button>
                ))}
              </div>
            )}
            {itemSearch && filteredOptions.length === 0 && (
              <p className="mt-2 text-xs text-slate-400 text-center">No matching savings found</p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-60 disabled:scale-100"
            style={{
              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
            }}
            onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            {saving ? 'Saving...' : editGoal ? 'Update Goal' : 'Create Goal'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Goal Detail Modal ────────────────────────────────────────────────────────
interface GoalDetailModalProps {
  goal: InvestmentGoal | null;
  onClose: () => void;
  onUpdateValue: (g: InvestmentGoal) => void;
}

const GoalDetailModal: React.FC<GoalDetailModalProps> = ({ goal, onClose, onUpdateValue }) => {
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchGoalTransactions = async (page: number) => {
    if (!goal?.id) return;
    setLoading(true);
    try {
      const res = await api.getGoalTransactions(goal.id, page);
      setTransactions(res.data ?? []);
      setTotalPages(Math.ceil((res.total_count || 0) / 10));
      setTotalCount(res.total_count || 0);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to load spending transactions', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (goal) {
      setCurrentPage(1);
      fetchGoalTransactions(1);
    } else {
      setTransactions([]);
    }
  }, [goal]);

  useEffect(() => {
    if (goal && currentPage > 1) {
      fetchGoalTransactions(currentPage);
    }
  }, [currentPage]);

  if (!goal) return null;

  const isOneTime = goal.goal_type === 'ONE_TIME';
  const pct = goal.percent_achieved ?? 0;
  const investedPct = goal.percent_invested ?? pct;
  const color = goal.color ?? '#6366f1';
  const remaining = isOneTime
    ? Math.max(goal.target_amount - goal.current_amount, 0)
    : Math.max(goal.target_amount - (goal.current_value ?? goal.current_amount), 0);
  const totalFunded = goal.total_funded ?? 0;
  const hasCurrentValue = goal.current_value != null;
  const displayValue = isOneTime ? goal.current_amount : (hasCurrentValue ? goal.current_value! : goal.current_amount);

  const achievedAmount = goal.current_amount + totalFunded;
  const refillTarget = Math.min(goal.target_amount, achievedAmount);
  const refillNeeded = Math.max(0, refillTarget - goal.current_amount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-auto w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 shadow-sm"
               style={{ background: `${color}22` }}>
              {goal.icon ?? '🎯'}
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {goal.name}
              </h2>
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black border ${goal.goal_type === 'ONE_TIME'
                ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                : 'bg-violet-500/10 text-violet-500 border-violet-500/20'
                }`}>
                {goal.goal_type === 'ONE_TIME' ? 'One-time' : 'Refillable / Persistent'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!goal.is_closed && (
              <button
                onClick={() => onUpdateValue(goal)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all"
                style={{ borderColor: `${color}40`, color, background: `${color}10` }}
              >
                <PencilLine className="w-3.5 h-3.5" />
                Update Value
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Visual Alert Box */}
          {totalFunded > 0 && (
            goal.goal_type === 'ONE_TIME' ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-700 dark:text-amber-300 space-y-2">
                <p className="text-sm font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Allocated towards spending: {fmtCompact(totalFunded)}
                </p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                  This goal is for one-time spending (e.g. buying a car, home). The spend is part of the achievement itself, and the goal progress remains at <span className="font-bold text-amber-600 dark:text-amber-400">{pct.toFixed(0)}%</span>.
                </p>
                {/* Secondary spent progress bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${Math.min((totalFunded / goal.target_amount) * 100, 100)}%` }} />
                </div>
                <div className="flex justify-between text-[9px] uppercase tracking-wider font-bold text-slate-400">
                  <span>Spent: {fmtCompact(totalFunded)}</span>
                  <span>Target: {fmtCompact(goal.target_amount)}</span>
                </div>
              </div>
            ) : (
              refillNeeded > 0 && (
                <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-slate-700 dark:text-violet-300 space-y-2">
                  <p className="text-sm font-bold flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                    <RefreshCw className="w-4 h-4 text-violet-500 animate-spin-slow" />
                    Refill needed: {fmtCompact(refillNeeded)}
                  </p>
                  <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                    This is a persistent goal (e.g. Emergency Fund). Spending has reduced the available amount. You must contribute an additional <span className="font-bold text-violet-600 dark:text-violet-400">{fmtCompact(refillNeeded)}</span> to restore it to the original target.
                  </p>
                </div>
              )
            )
          )}

          {/* Notes */}
          {goal.notes && (
            <div className="p-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/40 text-sm text-slate-600 dark:text-slate-400 italic">
              <span className="not-italic text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Notes</span>
              "{goal.notes}"
            </div>
          )}

          {/* Quick Metrics — 4 columns when current_value is tracked */}
          {hasCurrentValue ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums mt-1">{fmtCompact(goal.target_amount)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">💰 Invested</p>
                <p className="text-base font-black tabular-nums mt-1" style={{ color }}>{fmtCompact(goal.current_amount)}</p>
                {goal.goal_type === 'ONE_TIME' && goal.total_funded && goal.total_funded > 0 ? (
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                    {fmtCompact(goal.active_invested ?? (goal.current_amount - goal.total_funded))} active
                  </p>
                ) : null}
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">📈 Current Value</p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums mt-1">{fmtCompact(goal.current_value!)}</p>
                {goal.last_value_updated_at && (
                  <p className="text-[9px] text-slate-400 mt-0.5">{formatLastUpdated(goal.last_value_updated_at)}</p>
                )}
              </div>
              <div className={`p-4 rounded-2xl border ${
                (goal.returns_amount ?? 0) >= 0
                  ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/20'
              }`}>
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Returns</p>
                {goal.returns_amount != null ? (
                  <>
                    <p className={`text-base font-black tabular-nums mt-1 ${(goal.returns_amount) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {goal.returns_amount >= 0 ? '+' : ''}{fmtCompact(goal.returns_amount)}
                    </p>
                    {goal.returns_percent != null && (
                      <p className={`text-[10px] font-bold tabular-nums ${goal.returns_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {goal.returns_percent >= 0 ? '+' : ''}{goal.returns_percent.toFixed(1)}%
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-slate-400 mt-1">—</p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target</p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums mt-1">{fmtCompact(goal.target_amount)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  {goal.goal_type === 'ONE_TIME' ? 'Invested Amount' : 'Available Balance'}
                </p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums mt-1" style={{ color }}>{fmtCompact(goal.current_amount)}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/60">
                <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Spent</p>
                <p className="text-base font-black text-slate-800 dark:text-white tabular-nums mt-1">{fmtCompact(totalFunded)}</p>
              </div>
            </div>
          )}

          {/* Dual progress bar in detail view */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                {fmtCompact(displayValue)} / {fmtCompact(goal.target_amount)}
              </span>
              <span className="font-bold text-slate-400">{pct.toFixed(1)}%</span>
            </div>
            <DualProgressBar
              percent={pct}
              investedPercent={investedPct}
              color={color}
              returnsAmount={goal.returns_amount}
            />
            {hasCurrentValue && goal.returns_amount != null && (
              <div className="flex items-center gap-3 text-[9px] font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1.5 rounded-full inline-block" style={{ background: `${color}55` }} />
                  Invested ({investedPct.toFixed(0)}%)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-1.5 rounded-full inline-block" style={{ background: color }} />
                  Current Value ({pct.toFixed(0)}%)
                </span>
              </div>
            )}
          </div>

          {/* Projection Indicator Card */}
          <div className="px-4 py-3 rounded-2xl text-xs font-semibold"
            style={{ background: `${color}18`, color }}>
            <TrendingUp className="w-4 h-4 inline mr-2 -mt-0.5" />
            {projectYearLabel(goal.years_to_goal)}
          </div>

          {/* Spending List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Spending from this Goal</h3>
            {loading && transactions.length === 0 ? (
              <div className="space-y-2 py-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center py-8 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800/50 text-slate-400 text-xs font-medium">
                No spending from this goal recorded.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="divide-y divide-slate-100 dark:divide-slate-800/20 max-h-60 overflow-y-auto">
                  {transactions.map(t => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.description}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {new Date(t.transaction_time).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-rose-500 tabular-nums">
                          -₹{t.value.toLocaleString('en-IN')}
                        </p>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.25 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-md">
                          {t.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      Prev
                    </button>
                    <span className="text-[10px] font-bold text-slate-400">
                      Page {currentPage} of {totalPages} ({totalCount} spent)
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl px-6 py-4 border-t border-slate-200 dark:border-slate-800/50 flex justify-end">
          <button onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-200 dark:hover:bg-slate-750 transition-all">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const InvestmentPlanner: React.FC = () => {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<InvestmentGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestmentGoal | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [selectedGoal, setSelectedGoal] = useState<InvestmentGoal | null>(null);
  const [updateValueGoal, setUpdateValueGoal] = useState<InvestmentGoal | null>(null);

  const fetchGoals = async () => {
    setLoading(true);
    try {
      const res = await api.getGoals();
      setGoals(res.data ?? []);
    } catch (e: any) {
      showToast(e.message ?? 'Failed to load goals', 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchGoals(); }, []);

  const handleSaved = (updated: InvestmentGoal) => {
    setGoals(prev => {
      const idx = prev.findIndex(g => g.id === updated.id);
      if (idx === -1) return [updated, ...prev];
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    if (editGoal?.id === updated.id) {
      setEditGoal(updated);
    }
    if (selectedGoal?.id === updated.id) {
      setSelectedGoal(updated);
    }
    // Re-fetch to get fresh projection data from backend
    fetchGoals();
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await api.deleteGoal(deleteTarget.id);
      setGoals(prev => prev.filter(g => g.id !== deleteTarget.id));
      showToast('Goal deleted', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to delete goal', 'error');
    } finally { setDeleteTarget(null); }
  };

  const handleArchive = async (g: InvestmentGoal) => {
    try {
      const updated = await api.updateGoal(g.id!, {
        ...g,
        is_closed: true,
        closed_at: new Date().toISOString()
      });
      handleSaved(updated);
      showToast('Goal marked as closed', 'success');
    } catch (e: any) {
      showToast(e.message ?? 'Failed to close goal', 'error');
    }
  };

  const activeGoals = goals.filter(g => !g.is_closed);
  const archivedGoals = goals.filter(g => g.is_closed);
  const displayedGoals = activeTab === 'active' ? activeGoals : archivedGoals;

  // Summary stats (based on active goals)
  const totalTarget = activeGoals.reduce((s, g) => s + g.target_amount, 0);
  const totalInvested = activeGoals.reduce((s, g) => s + (g.active_invested ?? g.current_amount), 0);
  const totalPortfolioValue = activeGoals.reduce((s, g) => s + (g.current_value ?? g.active_invested ?? g.current_amount), 0);
  const totalReturns = totalPortfolioValue - totalInvested;
  const totalMonthly = activeGoals.reduce((s, g) => s + g.monthly_contribution, 0);
  const overallPct = totalTarget > 0 ? Math.min(Math.round(totalPortfolioValue / totalTarget * 100), 100) : 0;
  const achievedCount = activeGoals.filter(g => (g.current_value ?? g.active_invested ?? g.current_amount) >= g.target_amount).length;
  const hasAnyReturns = activeGoals.some(g => g.current_value != null);

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-400" /> Investment Planner
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Track your short-term and long-term financial goals with compound growth projections
            </p>
          </div>
          <button
            onClick={() => { setEditGoal(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-white font-semibold text-sm shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            <Plus className="w-4 h-4" /> New Goal
          </button>
        </div>

        {/* Stats bar */}
        {(activeGoals.length > 0 || activeTab === 'active') && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { label: 'Total Target', value: fmtCompact(totalTarget), icon: '🎯', color: 'violet' },
              { label: 'Total Invested', value: fmtCompact(totalInvested), icon: '💰', color: 'cyan' },
              { label: 'Portfolio Value', value: fmtCompact(totalPortfolioValue), icon: '📈', color: hasAnyReturns ? (totalReturns >= 0 ? 'emerald' : 'rose') : 'slate',
                sub: hasAnyReturns ? `${totalReturns >= 0 ? '+' : ''}${fmtCompact(Math.abs(totalReturns))}` : null,
                subColor: hasAnyReturns ? (totalReturns >= 0 ? 'text-emerald-500' : 'text-rose-500') : '' },
              { label: 'Monthly Contribution', value: fmtCompact(totalMonthly), icon: '📆', color: 'emerald' },
              { label: 'Overall Progress', value: `${overallPct}%`, icon: '📊', color: 'emerald' },
              { label: 'Goals Achieved', value: `${achievedCount} / ${activeGoals.length}`, icon: '🏆', color: 'amber' },
            ].map(stat => (
              <div key={stat.label}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{stat.icon}</span>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{stat.value}</p>
                {stat.sub && <p className={`text-[10px] font-bold tabular-nums mt-0.5 ${stat.subColor}`}>{stat.sub}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      {goals.length > 0 && (
        <div className="flex gap-2 mb-6 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-max">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'active' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Active Goals ({activeGoals.length})
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'archived' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
          >
            Archived ({archivedGoals.length})
          </button>
        </div>
      )}

      {/* Goals grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : goals.length === 0 ? (
        <EmptyGoals onAdd={() => { setEditGoal(null); setModalOpen(true); }} />
      ) : displayedGoals.length === 0 ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400">
          <Archive className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No {activeTab} goals found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedGoals.map(g => (
            <GoalCard
              key={g.id}
              goal={g}
              onEdit={(goal) => { setEditGoal(goal); setModalOpen(true); }}
              onDelete={setDeleteTarget}
              onArchive={handleArchive}
              onUpdateValue={setUpdateValueGoal}
              onClick={() => setSelectedGoal(g)}
            />
          ))}
        </div>
      )}

      {goals.length > 0 && (
        <div className="mt-12 pb-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center max-w-2xl mx-auto leading-relaxed">
            * Projected values are estimates based on your provided annual growth rate and monthly contributions. Projections use your Invested Amount as the base.
            Portfolio Value reflects your last manually updated market value. Returns are computed as Current Value − Invested Amount.
          </p>
        </div>
      )}

      {/* Modals */}
      <GoalModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditGoal(null); }}
        onSaved={handleSaved}
        editGoal={editGoal}
      />

      <GoalDetailModal
        goal={selectedGoal}
        onClose={() => setSelectedGoal(null)}
        onUpdateValue={(g) => { setSelectedGoal(null); setUpdateValueGoal(g); }}
      />

      <UpdateValueModal
        goal={updateValueGoal}
        onClose={() => setUpdateValueGoal(null)}
        onSaved={(updated) => { handleSaved(updated); setUpdateValueGoal(null); }}
      />

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        title="Delete Goal"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default InvestmentPlanner;
