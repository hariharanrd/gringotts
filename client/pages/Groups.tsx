import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderClosed, Sparkles, Edit2, Trash2, ChevronRight, HelpCircle, X, Users } from 'lucide-react';
import { api } from '../services/api';
import { TransactionGroup } from '../types';
import { useToast } from '../components/ToastContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { ICONS, ICON_NAMES } from '../components/icons';
import LazyGroupThumbnail from '../components/LazyGroupThumbnail';

const GROUP_TYPES = ['TRIP', 'EVENT', 'PROJECT', 'PERSONAL', 'CUSTOM'] as const;

export const GROUP_COLORS = [
  { name: 'Cyan', hex: '#06b6d4', textClass: 'text-cyan-500', bgClass: 'bg-cyan-500/10', borderClass: 'border-cyan-500/20' },
  { name: 'Indigo', hex: '#6366f1', textClass: 'text-indigo-500', bgClass: 'bg-indigo-500/10', borderClass: 'border-indigo-500/20' },
  { name: 'Emerald', hex: '#10b981', textClass: 'text-emerald-500', bgClass: 'bg-emerald-500/10', borderClass: 'border-emerald-500/20' },
  { name: 'Violet', hex: '#8b5cf6', textClass: 'text-violet-500', bgClass: 'bg-violet-500/10', borderClass: 'border-violet-500/20' },
  { name: 'Amber', hex: '#f59e0b', textClass: 'text-amber-500', bgClass: 'bg-amber-500/10', borderClass: 'border-amber-500/20' },
  { name: 'Rose', hex: '#f43f5e', textClass: 'text-rose-500', bgClass: 'bg-rose-500/10', borderClass: 'border-rose-500/20' },
  { name: 'Orange', hex: '#f97316', textClass: 'text-orange-500', bgClass: 'bg-orange-500/10', borderClass: 'border-orange-500/20' },
  { name: 'Slate', hex: '#64748b', textClass: 'text-slate-500', bgClass: 'bg-slate-500/10', borderClass: 'border-slate-500/20' }
];

const EmptyGroups: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6">
    <div className="relative">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
        <FolderClosed className="w-10 h-10 text-cyan-500" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
      </div>
    </div>
    <div className="text-center max-w-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No active groups found</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs leading-relaxed">
        Group your transactions for trips, events, projects, or custom categories. Track collective spending and manage budgets together.
      </p>
    </div>
    <button
      onClick={onAdd}
      className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-sm shadow-lg transition-all"
      style={{
        background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
        boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)`
      }}
      onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
    >
      <Plus className="w-4 h-4" /> Create Your First Group
    </button>
  </div>
);

const Groups: React.FC = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<TransactionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClosed, setShowClosed] = useState(false);

  // Modal & Dialog state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<TransactionGroup | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TransactionGroup | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<typeof GROUP_TYPES[number]>('CUSTOM');
  const [icon, setIcon] = useState('Tag');
  const [color, setColor] = useState('#06b6d4');
  const [status, setStatus] = useState<'ACTIVE' | 'CLOSED'>('ACTIVE');
  const [saving, setSaving] = useState(false);
  const [allowsExpense, setAllowsExpense] = useState(true);
  const [allowsIncome, setAllowsIncome] = useState(true);
  const [allowsSaving, setAllowsSaving] = useState(true);
  const [allowsRevolving, setAllowsRevolving] = useState(true);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactionGroups();
      setGroups(res.data ?? []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load groups', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const openAddModal = () => {
    setEditingGroup(null);
    setName('');
    setDescription('');
    setType('CUSTOM');
    setIcon('Tag');
    setColor('#06b6d4');
    setStatus('ACTIVE');
    setAllowsExpense(true);
    setAllowsIncome(true);
    setAllowsSaving(true);
    setAllowsRevolving(true);
    setThumbnail(null);
    setShared(false);
    setIsModalOpen(true);
  };

  const openEditModal = (group: TransactionGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
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
    setShared(group.shared || false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (group: TransactionGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(group);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await api.deleteTransactionGroup(deleteTarget.id);
      showToast('Group deleted successfully', 'success');
      setGroups(prev => prev.filter(g => g.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete group', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
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
        thumbnail: thumbnail || undefined,
        shared
      };

      if (editingGroup) {
        await api.updateTransactionGroup(editingGroup.id, payload);
        showToast('Group updated successfully', 'success');
      } else {
        await api.createTransactionGroup(payload);
        showToast('Group created successfully', 'success');
      }
      setIsModalOpen(false);
      fetchGroups();
    } catch (e: any) {
      showToast(e.message || 'Failed to save group', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCardClick = (group: TransactionGroup) => {
    navigate(`/groups/${group.id}`);
  };

  const activeGroups = groups.filter(g => g.status === 'ACTIVE');

  return (
    <div className="space-y-6">
      {/* Title & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-855 pb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none">Transaction Groups</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Group and track transactions for projects, trips, or events.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-white text-sm font-extrabold shadow-lg transition-all hover:scale-105 active:scale-95 shrink-0 self-start sm:self-center"
          style={{
            background: 'var(--theme-gradient-from)',
            boxShadow: '0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)'
          }}
        >
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Groups</div>
          <div className="text-2xl font-black text-slate-850 dark:text-white tabular-nums">{groups.length}</div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Total created transaction groups</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Active Groups</div>
          <div className="text-2xl font-black text-cyan-500 tabular-nums">{activeGroups.length}</div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Currently open categories/projects</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Status Summary</div>
          <div className="text-2xl font-black text-slate-850 dark:text-white tabular-nums">
            {groups.filter(g => g.status === 'CLOSED').length} <span className="text-sm font-semibold text-slate-400">Closed</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Settled / archived groups</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-semibold">Accessing Gringotts Group Vaults...</p>
        </div>
      ) : groups.length === 0 ? (
        <EmptyGroups onAdd={openAddModal} />
      ) : (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Active Groups */}
          <div className="space-y-4">
            {groups.filter(g => g.status === 'ACTIVE').length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.filter(g => g.status === 'ACTIVE').map(group => {
                  const presetColor = GROUP_COLORS.find(c => c.hex === group.color) || GROUP_COLORS[0];
                  const IconComponent = (ICONS as any)[group.icon || 'Tag'] || FolderClosed;
                  const isActive = group.status === 'ACTIVE';

                  return (
                    <div
                      key={group.id}
                      onClick={() => handleCardClick(group)}
                      className={`group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer overflow-hidden ${
                        group.shared 
                          ? 'border-cyan-500/30 dark:border-cyan-500/20 shadow-[0_0_15px_-3px_rgba(6,182,212,0.1)] dark:shadow-[0_0_15px_-3px_rgba(6,182,212,0.05)] border-l-4 border-l-cyan-500/80' 
                          : 'border-slate-200 dark:border-slate-800/80'
                      }`}
                    >
                      {/* Lazy loaded Cover Banner */}
                      <LazyGroupThumbnail groupId={group.id} groupName={group.name} isBanner={false} />

                      <div className="p-5 space-y-4">
                        {/* Title & Actions Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${presetColor.bgClass} ${presetColor.textClass}`}
                              style={{ backgroundColor: `${group.color}15`, color: group.color }}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="flex items-center gap-1.5 font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-tight line-clamp-1">
                                {group.name}
                                {group.shared && (
                                  <span className="flex items-center gap-0.5 text-[9px] font-extrabold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                    <Users className="w-2.5 h-2.5" /> Shared
                                  </span>
                                )}
                              </h3>
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-450 uppercase tracking-wider">
                                  {group.type}
                                </span>
                                {(group.allows_expense ?? true) && (
                                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-rose-500/10 text-rose-500 dark:text-rose-450 uppercase tracking-wider">
                                    Exp
                                  </span>
                                )}
                                {(group.allows_income ?? true) && (
                                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-emerald-500/10 text-emerald-500 dark:text-emerald-450 uppercase tracking-wider">
                                    Inc
                                  </span>
                                )}
                                {(group.allows_saving ?? true) && (
                                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-violet-500/10 text-violet-500 dark:text-violet-450 uppercase tracking-wider">
                                    Sav
                                  </span>
                                )}
                                {(group.allows_revolving ?? true) && (
                                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-cyan-500/10 text-cyan-500 dark:text-cyan-450 uppercase tracking-wider">
                                    Rev
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => openEditModal(group, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                              title="Edit Group"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteClick(group, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                              title="Delete Group"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        {group.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {group.description}
                          </p>
                        )}

                        {/* Status Indicator */}
                        <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-450 dark:text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Active</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400 dark:text-slate-500">
                <p className="text-xs italic font-medium">No active groups found.</p>
                <p className="text-[10px] mt-1 text-slate-400/80">Open the archived section below or create a new group.</p>
              </div>
            )}
          </div>

          {/* Archived & Closed Groups Accordion */}
          {groups.filter(g => g.status === 'CLOSED').length > 0 && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowClosed(!showClosed)}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-black uppercase tracking-wider mb-4 transition-colors"
              >
                <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${showClosed ? 'rotate-90' : ''}`} />
                Archived & Settled Groups ({groups.filter(g => g.status === 'CLOSED').length})
              </button>

              {showClosed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-top-2 duration-300">
                  {groups.filter(g => g.status === 'CLOSED').map(group => {
                    const presetColor = GROUP_COLORS.find(c => c.hex === group.color) || GROUP_COLORS[0];
                    const IconComponent = (ICONS as any)[group.icon || 'Tag'] || FolderClosed;

                    return (
                      <div
                        key={group.id}
                        onClick={() => handleCardClick(group)}
                        className={`group relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-3xl border opacity-70 hover:opacity-100 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden ${
                          group.shared 
                            ? 'border-cyan-500/30 dark:border-cyan-500/20 border-l-4 border-l-cyan-500/60' 
                            : 'border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Lazy loaded Cover Banner */}
                        <LazyGroupThumbnail groupId={group.id} groupName={group.name} isBanner={false} />

                        <div className="p-5 space-y-4">
                          {/* Title & Actions Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm"
                                style={{ backgroundColor: `${group.color}15`, color: group.color || '#64748b' }}
                              >
                                <IconComponent className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                              </div>
                              <div>
                                <h3 className="flex items-center gap-1.5 font-extrabold text-slate-850 dark:text-slate-100 text-sm leading-tight line-clamp-1">
                                  {group.name}
                                  {group.shared && (
                                    <span className="flex items-center gap-0.5 text-[9px] font-extrabold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                                      <Users className="w-2.5 h-2.5" /> Shared
                                    </span>
                                  )}
                                </h3>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold rounded bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-450 uppercase tracking-wider">
                                    {group.type}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => openEditModal(group, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                                title="Edit Group"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteClick(group, e)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                                title="Delete Group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Description */}
                          {group.description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {group.description}
                            </p>
                          )}

                          {/* Status Indicator */}
                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-semibold text-slate-450 dark:text-slate-550">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                              <span>Closed</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-black text-slate-850 dark:text-white">
                {editingGroup ? 'Edit Group Settings' : 'Create Custom Group'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. Europe Trip 2026, Wedding Event, Office Relocation"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                <textarea
                  placeholder="Add notes or goals for this group..."
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
                    {GROUP_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
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

              {/* Shared Group Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Group Collaboration</label>
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      id="sharedGroup"
                      checked={shared}
                      onChange={(e) => setShared(e.target.checked)}
                      disabled={!!editingGroup}
                      className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-cyan-500 focus:ring-cyan-500/40 bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer appearance-none checked:bg-cyan-500 border disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {shared && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <label htmlFor="sharedGroup" className="text-xs font-bold text-slate-705 dark:text-slate-300 cursor-pointer select-none block">
                      Shared Group
                    </label>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block leading-tight">
                      {editingGroup 
                        ? "Shared status cannot be changed after creation." 
                        : "Allow other users to join this group, see transactions, and tag their own transactions."}
                    </span>
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
                    <div className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-655 shrink-0">
                      <FolderClosed className="w-6 h-6" />
                    </div>
                  )}
                  <div className="flex-1 space-y-1">
                    <input
                      type="file"
                      id="thumbnail-upload"
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
                      htmlFor="thumbnail-upload"
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

              </div>

              {/* Form Actions */}
              <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                  ) : editingGroup ? (
                    'Save Changes'
                  ) : (
                    'Create Group'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Transaction Group?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Transactions linked to this group will be unlinked (their group will be set to None). The transactions themselves will NOT be deleted.`}
      />
    </div>
  );
};

export default Groups;
