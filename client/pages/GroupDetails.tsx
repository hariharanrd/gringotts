import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FolderClosed, Trash2, Edit2, ChevronRight, BarChart3, Receipt, HeartHandshake, CircleDollarSign, Calendar, Sparkles, X, Plus } from 'lucide-react';
import { api } from '../services/api';
import { Transaction, TransactionGroup, TransactionType, Expense, Income, Saving, Revolving } from '../types';
import { useToast } from '../components/ToastContext';
import CategoryIcon from '../components/CategoryIcon';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { ICONS, ICON_NAMES } from '../components/icons';
import { GROUP_COLORS } from './Groups';
import TransactionModal from '../components/TransactionModal';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from 'recharts';

const PIE_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899', '#14b8a6', '#a855f7'];

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const groupId = Number(id);

  const [group, setGroup] = useState<TransactionGroup | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit / Delete states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TransactionGroup | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);

  // Edit Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'TRIP' | 'EVENT' | 'PROJECT' | 'PERSONAL' | 'CUSTOM'>('CUSTOM');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#06b6d4');
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [allowsExpense, setAllowsExpense] = useState(true);
  const [allowsIncome, setAllowsIncome] = useState(true);
  const [allowsSaving, setAllowsSaving] = useState(true);
  const [allowsRevolving, setAllowsRevolving] = useState(true);
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const [groupRes, txRes, statsRes] = await Promise.all([
        api.getTransactionGroupById(groupId),
        api.getTransactionGroupTransactions(groupId),
        api.getTransactionGroupStatistics(groupId)
      ]);
      setGroup(groupRes);
      setTransactions(txRes.data ?? []);
      setStats(statsRes);
    } catch (e: any) {
      showToast(e.message || 'Failed to load group details', 'error');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (groupId) {
      fetchDetails();
    }
  }, [groupId]);

  const openEditModal = () => {
    if (!group) return;
    setName(group.name);
    setDescription(group.description || '');
    setType(group.type);
    setIcon(group.icon || 'Tag');
    setColor(group.color || '#06b6d4');
    setStatus(group.status);
    setAllowsExpense(group.allows_expense ?? true);
    setAllowsIncome(group.allows_income ?? true);
    setAllowsSaving(group.allows_saving ?? true);
    setAllowsRevolving(group.allows_revolving ?? true);
    setThumbnail(group.thumbnail || null);
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Please enter a group name', 'warning');
      return;
    }
    if (!allowsExpense && !allowsIncome && !allowsSaving && !allowsRevolving) {
      showToast('Please select at least one allowed transaction type', 'warning');
      return;
    }
    setSaving(true);
    try {
      const payload: Partial<TransactionGroup> = {
        name: name.trim(),
        description: description.trim() || undefined,
        type,
        icon,
        color,
        status,
        allows_expense: allowsExpense,
        allows_income: allowsIncome,
        allows_saving: allowsSaving,
        allows_revolving: allowsRevolving,
        thumbnail: thumbnail || undefined
      };
      const updated = await api.updateTransactionGroup(groupId, payload);
      setGroup(updated);
      setIsEditModalOpen(false);
      showToast('Group updated successfully', 'success');
      fetchDetails();
    } catch (e: any) {
      showToast(e.message || 'Failed to update group', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await api.deleteTransactionGroup(groupId);
      showToast('Group deleted successfully', 'success');
      navigate('/groups');
    } catch (e: any) {
      showToast(e.message || 'Failed to delete group', 'error');
    }
  };

  const handleRemoveTransaction = async (t: Transaction) => {
    try {
      // Set group property to null
      const updatedData = { ...t, group: null };
      
      if (t.type === TransactionType.EXPENSE) {
        await api.updateExpense(updatedData as any);
      } else if (t.type === TransactionType.INCOME) {
        await api.updateIncome(updatedData as any);
      } else if (t.type === TransactionType.SAVING) {
        await api.updateSaving(updatedData as any);
      } else if (t.type === TransactionType.REVOLVING) {
        await api.updateRevolving(updatedData as any);
      }
      
      showToast('Transaction removed from group', 'success');
      fetchDetails();
    } catch (e: any) {
      showToast(e.message || 'Failed to remove transaction', 'error');
    }
  };

  if (loading || !group) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-semibold">Accessing Gringotts Group Vaults...</p>
      </div>
    );
  }

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

  const categoryChartData = stats?.category_breakdown
    ? Object.entries(stats.category_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const getAmountColor = (t: Transaction) => {
    if (t.type === 'INCOME') return 'text-emerald-500 dark:text-emerald-400';
    if (t.type === 'EXPENSE') return 'text-rose-500 dark:text-rose-400';
    if (t.type === 'SAVING') {
      return (t as any).is_in ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
    }
    if (t.type === 'REVOLVING') {
      return (t as any).is_give ? 'text-rose-500 dark:text-rose-400' : 'text-emerald-500 dark:text-emerald-400';
    }
    return 'text-slate-700 dark:text-slate-300';
  };

  const getAmountSign = (t: Transaction) => {
    if (t.type === 'INCOME') return '+';
    if (t.type === 'EXPENSE') return '-';
    if (t.type === 'SAVING') return (t as any).is_in ? '+' : '-';
    if (t.type === 'REVOLVING') return (t as any).is_give ? '-' : '+';
    return '';
  };

  const presetColor = GROUP_COLORS.find(c => c.hex === group.color) || GROUP_COLORS[0];
  const IconComponent = (ICONS as any)[group.icon || 'Tag'] || FolderClosed;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Group Thumbnail Cover Banner */}
      {group.thumbnail && (
        <div className="relative h-48 sm:h-64 w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800/80 shadow-md">
          <img
            src={group.thumbnail}
            alt={group.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
        </div>
      )}

      {/* Back & Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <Link to="/groups" className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
              style={{ backgroundColor: `${group.color}15`, color: group.color }}
            >
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-850 dark:text-white leading-none">{group.name}</h1>
                <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-150 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                  {group.type}
                </span>
                <span className={`w-2 h-2 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'}`} title={group.status}></span>
              </div>
              {group.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {group.status !== 'CLOSED' && (
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-md hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200"
            >
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          )}
          <button
            onClick={openEditModal}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
          >
            <Edit2 className="w-4 h-4" /> Edit Group
          </button>
          <button
            onClick={() => setDeleteTarget(group)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
          >
            <Trash2 className="w-4 h-4" /> Delete Group
          </button>
        </div>
      </div>      {/* Statistics Cards */}
      {(() => {
        const visibleCards = [
          (group.allows_expense ?? true) && {
            title: 'Total Expenses',
            value: fmt(stats?.total_expenses ?? 0),
            colorClass: 'text-rose-500',
            description: 'Sum of all expenses in group'
          },
          (group.allows_income ?? true) && {
            title: 'Total Incomes',
            value: fmt(stats?.total_incomes ?? 0),
            colorClass: 'text-emerald-500',
            description: 'Sum of all inflows/reimbursements'
          },
          (group.allows_saving ?? true) && {
            title: 'Group Savings Contribution',
            value: fmt(stats?.total_savings ?? 0),
            colorClass: 'text-violet-500',
            description: 'Savings allocations linked here'
          }
        ].filter(Boolean) as { title: string; value: string; colorClass: string; description: string }[];

        if (visibleCards.length === 0) return null;

        return (
          <div className={`grid grid-cols-1 ${
            visibleCards.length === 1 ? 'sm:grid-cols-1 max-w-sm' :
            visibleCards.length === 2 ? 'sm:grid-cols-2 max-w-2xl' :
            'sm:grid-cols-3'
          } gap-5`}>
            {visibleCards.map((card, idx) => (
              <div key={idx} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{card.title}</div>
                <div className={`text-2xl font-black tabular-nums ${card.colorClass}`}>{card.value}</div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{card.description}</p>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Main Grid: Charts & Transactions List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Breakdown */}
        {(group.allows_expense ?? true) && (
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Category Breakdown</h3>
              </div>
              
              <div className="h-[240px] w-full">
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={4}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid rgba(148,163,184,0.15)',
                          backgroundColor: 'var(--theme-surface)',
                          color: 'var(--theme-text)',
                          fontSize: 11
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-555 text-xs">
                    <p>No expense data in this group</p>
                  </div>
                )}
              </div>

              {/* Category breakdown Legend list */}
              {categoryChartData.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-1">
                  {categoryChartData.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Transactions list */}
        <div className={(group.allows_expense ?? true) ? "lg:col-span-2 space-y-6" : "lg:col-span-3 space-y-6"}>
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Linked Transactions</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400">
                  {transactions.length} total
                </span>
                {group.status !== 'CLOSED' && (
                  <button
                    onClick={() => setIsAddTransactionOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-600 dark:text-cyan-400 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {transactions.map(t => (
                <div
                  key={t.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-all group/item"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CategoryIcon category={t.category} className="w-4 h-4" />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">{t.description}</p>
                      <div className="flex items-center gap-2.5 mt-0.5 text-[10px] text-slate-450 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        <span>{new Date(t.transaction_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        <span>•</span>
                        <span>{t.type}</span>
                        {t.payment_mode && (
                          <>
                            <span>•</span>
                            <span>{t.payment_mode}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span className={`text-sm font-black ${getAmountColor(t)}`}>
                      {getAmountSign(t)}{fmt(t.value)}
                    </span>

                    <button
                      onClick={() => handleRemoveTransaction(t)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-all"
                      title="Remove from group"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {transactions.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-550 space-y-3">
                  <div className="text-center">
                    <p className="text-xs italic">No transactions mapped to this group yet.</p>
                    <p className="text-[10px] mt-1 text-slate-400/80">Assign this group to transactions in the transaction forms.</p>
                  </div>
                  {group.status !== 'CLOSED' && (
                    <button
                      onClick={() => setIsAddTransactionOpen(true)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 transition-all border border-slate-200 dark:border-slate-700/50"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Transaction
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Group Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl relative border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-850 dark:text-white">Edit Group Settings</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classification</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  >
                    <option value="TRIP">TRIP</option>
                    <option value="EVENT">EVENT</option>
                    <option value="PROJECT">PROJECT</option>
                    <option value="PERSONAL">PERSONAL</option>
                    <option value="CUSTOM">CUSTOM</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CLOSED">CLOSED (Settled)</option>
                  </select>
                </div>
              </div>

              {/* Allowed Transaction Types */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Allowed Transaction Types</label>
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="allowExpense"
                        checked={allowsExpense}
                        onChange={(e) => setAllowsExpense(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/40 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer appearance-none checked:bg-cyan-500 border"
                      />
                      {allowsExpense && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <label htmlFor="allowExpense" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Expenses
                    </label>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="allowIncome"
                        checked={allowsIncome}
                        onChange={(e) => setAllowsIncome(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/40 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer appearance-none checked:bg-cyan-500 border"
                      />
                      {allowsIncome && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <label htmlFor="allowIncome" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Incomes
                    </label>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="allowSaving"
                        checked={allowsSaving}
                        onChange={(e) => setAllowsSaving(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/40 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer appearance-none checked:bg-cyan-500 border"
                      />
                      {allowsSaving && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <label htmlFor="allowSaving" className="text-xs font-bold text-slate-650 dark:text-slate-400 cursor-pointer select-none">
                      Savings
                    </label>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        id="allowRevolving"
                        checked={allowsRevolving}
                        onChange={(e) => setAllowsRevolving(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/40 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer appearance-none checked:bg-cyan-500 border"
                      />
                      {allowsRevolving && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <label htmlFor="allowRevolving" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                      Revolving
                    </label>
                  </div>
                </div>
              </div>

              {/* Thumbnail Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Group Cover / Thumbnail</label>
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {thumbnail ? (
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800 shadow-inner">
                      <img src={thumbnail} alt="Thumbnail preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setThumbnail(null)}
                        className="absolute inset-0 bg-black/40 hover:bg-black/60 flex items-center justify-center text-white opacity-0 hover:opacity-100 transition-opacity text-[10px] font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 shrink-0">
                      <FolderClosed className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="detail-thumbnail-upload"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        if (file.size > 2 * 1024 * 1024) {
                          showToast('Image size exceeds 2MB limit.', 'error');
                          e.target.value = '';
                          return;
                        }
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setThumbnail(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="detail-thumbnail-upload"
                      className="inline-block px-4 py-2 bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-750 transition-colors"
                    >
                      Choose Image…
                    </label>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Maximum size 2MB. JPG, PNG or WebP.</p>
                  </div>
                </div>
              </div>

              {/* Color Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Color Accent</label>
                <div className="flex flex-wrap gap-2">
                  {GROUP_COLORS.map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setColor(c.hex)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform duration-200 hover:scale-110 flex items-center justify-center`}
                      style={{
                        backgroundColor: c.hex,
                        borderColor: color === c.hex ? 'var(--theme-text)' : 'transparent'
                      }}
                      title={c.name}
                    >
                      {color === c.hex && (
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Icon Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Select Icon Symbol</label>
                <div className="grid grid-cols-8 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  {ICON_NAMES.map(name => {
                    const IconComp = ICONS[name as keyof typeof ICONS];
                    const isSelected = icon === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setIcon(name)}
                        className={`p-2 rounded-xl transition-all flex items-center justify-center hover:scale-105 ${
                          isSelected ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 dark:text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-900'
                        }`}
                        title={name}
                      >
                        <IconComp className="w-4 h-4 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Form Actions */}
              <div className="pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-sm font-extrabold hover:bg-slate-50 dark:hover:bg-slate-950 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-3 rounded-2xl text-white text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                    boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction Group?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All transactions currently linked to this group will be unlinked (set to None). This action cannot be undone.`}
      />

      {/* Add Transaction Modal */}
      {group && (
        <TransactionModal
          isOpen={isAddTransactionOpen}
          onClose={() => setIsAddTransactionOpen(false)}
          onSuccess={() => {
            fetchDetails();
          }}
          defaultGroupId={group.id}
          disableGroupSelection={true}
          allowedTypes={(() => {
            const types = [];
            if (group.allows_expense ?? true) types.push(TransactionType.EXPENSE);
            if (group.allows_income ?? true) types.push(TransactionType.INCOME);
            if (group.allows_saving ?? true) types.push(TransactionType.SAVING);
            if (group.allows_revolving ?? true) types.push(TransactionType.REVOLVING);
            return types;
          })()}
        />
      )}
    </div>
  );
};

export default GroupDetails;
