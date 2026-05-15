import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Target, TrendingUp, Edit2, Trash2, Tag, X, Check, Goal,
  Search, Sparkles, Folder, Layers, Archive, CheckCircle2
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
const ArcProgress: React.FC<{ percent: number; color: string; size?: number }> = ({
  percent, color, size = 120
}) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const capped = Math.min(percent, 100);
  const dash = (capped / 100) * circ;
  const cx = size / 2;
  const cy = size / 2;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="currentColor"
        strokeWidth={8} className="text-slate-200 dark:text-slate-700/60" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color}
        strokeWidth={8} strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }} />
    </svg>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

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

// ── Goal Card ─────────────────────────────────────────────────────────────────
interface GoalCardProps {
  goal: InvestmentGoal;
  onEdit: (g: InvestmentGoal) => void;
  onDelete: (g: InvestmentGoal) => void;
  onArchive?: (g: InvestmentGoal) => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onEdit, onDelete, onArchive }) => {
  const pct = goal.percent_achieved ?? 0;
  const color = goal.is_closed ? '#94a3b8' : (goal.color ?? '#6366f1');
  const remaining = Math.max(goal.target_amount - goal.current_amount, 0);

  return (
    <div className={`group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border ${goal.is_closed ? 'border-slate-300 dark:border-slate-700 opacity-80' : 'border-slate-200 dark:border-slate-700/50'} overflow-hidden hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 transition-all duration-300 hover:-translate-y-1`}>
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
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">{goal.name}</h3>
                {goal.is_closed && <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Closed</span>}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{goal.annual_rate}% p.a.</p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {!goal.is_closed && pct >= 100 && onArchive && (
              <button onClick={() => onArchive(goal)}
                title="Mark as Closed"
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-500/10 transition-all">
                <Archive className="w-4 h-4" />
              </button>
            )}
            {!goal.is_closed && (
              <button onClick={() => onEdit(goal)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all">
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => onDelete(goal)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Arc + percent */}
        <div className="flex items-center justify-between mt-4">
          <div className="relative flex items-center justify-center">
            <ArcProgress percent={pct} color={color} size={100} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold tabular-nums" style={{ color }}>
                {pct.toFixed(0)}%
              </span>
            </div>
          </div>
          <div className="flex-1 ml-4 space-y-2">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500">Achieved</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{fmt(goal.current_amount)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 dark:text-slate-500">Remaining</p>
              <p className="font-semibold text-slate-600 dark:text-slate-300 tabular-nums">{fmt(remaining)}</p>
            </div>
          </div>
        </div>

        {/* Target */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-slate-400 dark:text-slate-500 text-xs">Target</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(goal.target_amount)}</span>
        </div>

        {/* Monthly Contribution */}
        <div className="mt-1 flex items-center justify-between text-sm">
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
  target_amount: 0, current_amount: 0, annual_rate: 8, notes: '',
};

const GoalModal: React.FC<GoalModalProps> = ({ isOpen, onClose, onSaved, editGoal }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<Partial<InvestmentGoal>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef<HTMLDivElement>(null);

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
      } else {
        setForm(EMPTY_FORM);
        setLocalTags([]);
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
      const payload = {
        ...form,
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
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
                  ? 'Add current amount to see projection'
                  : projectYearLabel(projYears)}
              </p>
              {projYears != null && projYears > 0 && (
                <div className="mt-1">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {form.annual_rate}% annual growth
                  </p>
                  <p className="text-[10px] leading-tight text-slate-400 dark:text-slate-500/70 mt-1.5 italic">
                    * Projections assume steady growth. Manual updates to "Already Achieved" are required for actual gains.
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

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Target Amount (₹)</label>
              <input
                type="number" min={0} value={form.target_amount || ''}
                onChange={e => setForm(f => ({ ...f, target_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="500000"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Already Achieved (₹)</label>
              <input
                type="number" min={0} value={form.current_amount || ''}
                onChange={e => setForm(f => ({ ...f, current_amount: parseFloat(e.target.value) || 0 }))}
                placeholder="0"
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/50 dark:focus:ring-violet-500/50 transition-all"
              />
            </div>
          </div>

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

// ── Main page ─────────────────────────────────────────────────────────────────
const InvestmentPlanner: React.FC = () => {
  const { showToast } = useToast();
  const [goals, setGoals] = useState<InvestmentGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<InvestmentGoal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InvestmentGoal | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

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
  const totalSaved = activeGoals.reduce((s, g) => s + g.current_amount, 0);
  const totalMonthly = activeGoals.reduce((s, g) => s + g.monthly_contribution, 0);
  const overallPct = totalTarget > 0 ? Math.min(Math.round(totalSaved / totalTarget * 100), 100) : 0;
  const achievedCount = activeGoals.filter(g => g.current_amount >= g.target_amount).length;

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
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: 'Total Target', value: fmt(totalTarget), icon: '🎯', color: 'violet' },
              { label: 'Total Achieved', value: fmt(totalSaved), icon: '💰', color: 'cyan' },
              { label: 'Monthly Contribution', value: fmt(totalMonthly), icon: '📆', color: 'emerald' },
              { label: 'Overall Progress', value: `${overallPct}%`, icon: '📈', color: 'emerald' },
              { label: 'Goals Achieved', value: `${achievedCount} / ${activeGoals.length}`, icon: '🏆', color: 'amber' },
            ].map(stat => (
              <div key={stat.label}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700/50 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{stat.icon}</span>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">{stat.label}</p>
                </div>
                <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{stat.value}</p>
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
            />
          ))}
        </div>
      )}

      {goals.length > 0 && (
        <div className="mt-12 pb-8 border-t border-slate-200 dark:border-slate-800 pt-6">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 italic text-center max-w-2xl mx-auto leading-relaxed">
            * Projected values are estimates based on your provided annual growth rate and monthly contributions.
            The system tracks your manual contributions and balance updates; it does not automatically increment your balance for market gains.
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
