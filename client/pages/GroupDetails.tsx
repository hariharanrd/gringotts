import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, FolderClosed, Trash2, Edit2, ChevronRight, BarChart3, Receipt, HeartHandshake, CircleDollarSign, Calendar, Sparkles, X, Plus, Users, Shield, Clock, UserMinus, LogOut, Mail, Tag } from 'lucide-react';
import { api } from '../services/api';
import { Transaction, TransactionGroup, TransactionType, Expense, Income, Saving, Revolving, GroupMember, GroupCategory } from '../types';
import { useToast } from '../components/ToastContext';
import CategoryIcon from '../components/CategoryIcon';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { ICONS, ICON_NAMES } from '../components/icons';
import { GROUP_COLORS } from './Groups';
import TransactionModal from '../components/TransactionModal';
import LazyGroupThumbnail from '../components/LazyGroupThumbnail';
import Pagination from '../components/Pagination';
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
  Pie,
  Legend
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

  // User and Tab states
  const [currentUser, setCurrentUser] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'transactions' | 'statistics' | 'members' | 'categories'>('transactions');
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [inviteIdentifier, setInviteIdentifier] = useState('');
  const [inviting, setInviting] = useState(false);

  // Group Category States
  const [groupCategories, setGroupCategories] = useState<GroupCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<GroupCategory | null>(null);
  const [catName, setCatName] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('Tag');
  const [catColor, setCatColor] = useState('#06b6d4');
  const [catSaving, setCatSaving] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [pageSize, setPageSize] = useState(15);

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const renderTransactionsCard = () => {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-cyan-500" />
            <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Linked Transactions</h3>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400">
              {group.shared ? totalCount : transactions.length} total
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
          {transactions.map(t => {
            const canRemoveTx = t.user?.username === currentUser;
            return (
              <div
                key={t.id}
                onClick={(e) => {
                  if (group.shared) return;
                  if ((e.target as HTMLElement).closest('button')) return;
                  navigate(`/transaction/${t.id}?type=${t.type}`);
                }}
                className={`flex items-center justify-between p-3.5 rounded-2xl bg-slate-55/55 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 transition-all group/item ${
                  group.shared 
                    ? 'cursor-default' 
                    : 'hover:bg-slate-100/30 dark:hover:bg-slate-800/20 cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {t.group_category ? (
                    (() => {
                      const IconComponent = (ICONS as any)[t.group_category.icon || 'Tag'] || Tag;
                      return (
                        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <IconComponent
                            className="w-4 h-4 shrink-0"
                            style={{ color: t.group_category.color || '#06b6d4' }}
                          />
                        </div>
                      );
                    })()
                  ) : (
                    <CategoryIcon category={t.category} className="w-4 h-4" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">{t.description}</p>
                    <div className="flex flex-wrap items-center gap-2.5 mt-0.5 text-[10px] text-slate-455 dark:text-slate-500 font-semibold uppercase tracking-wider">
                      <span>{new Date(t.transaction_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span>•</span>
                      <span>{t.type}</span>
                      {group.shared && t.user && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-600 dark:text-cyan-400 font-bold normal-case">
                            @{t.user.username}
                          </span>
                        </>
                      )}
                      {t.group_category && (
                        <>
                          <span>•</span>
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                            style={{ backgroundColor: `${t.group_category.color || '#06b6d4'}15`, color: t.group_category.color || '#06b6d4' }}
                          >
                            {t.group_category.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-sm font-black ${getAmountColor(t)}`}>
                    {getAmountSign(t)}{fmt(t.value)}
                  </span>

                  {canRemoveTx && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => navigate(`/transaction/${t.id}?type=${t.type}`)}
                        className="p-1.5 rounded-lg text-slate-405 hover:text-cyan-500 hover:bg-cyan-500/10 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-all"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveTransaction(t)}
                        className="p-1.5 rounded-lg text-slate-405 hover:text-rose-500 hover:bg-rose-500/10 opacity-100 md:opacity-0 group-hover/item:opacity-100 transition-all"
                        title="Remove from group"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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

        {group.shared && totalPages > 1 && (
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              hasMore={hasMore}
              onPageChange={setPage}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}
      </div>
    );
  };

  const renderSharedAnalytics = () => {
    return (
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-cyan-500" />
          <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Group Category Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div className="h-[260px] w-full">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {categoryChartData.map((entry, index) => {
                      const matchedCat = groupCategories.find(c => c.name === entry.name);
                      return (
                        <Cell key={`cell-${index}`} fill={matchedCat?.color || PIE_COLORS[index % PIE_COLORS.length]} />
                      );
                    })}
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
                    itemStyle={{ color: 'var(--theme-text)' }}
                    labelStyle={{ color: 'var(--theme-text)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-555 text-xs">
                <p>No category data in this group</p>
              </div>
            )}
          </div>

          {/* Category breakdown Legend list */}
          {categoryChartData.length > 0 && (
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {categoryChartData.map((item, idx) => {
                const matchedCat = groupCategories.find(c => c.name === item.name);
                return (
                  <div key={item.name} className="flex justify-between items-center text-sm font-semibold">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: matchedCat?.color || PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      <span className="text-slate-500 dark:text-slate-400">{item.name}</span>
                    </div>
                    <span className="text-slate-800 dark:text-slate-200 font-bold">{fmt(item.value)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderCategoriesCard = () => {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Group Categories</h4>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">Flat category list specific to this group.</p>
          </div>
          {isOwner && group.status !== 'CLOSED' && (
            <button
              onClick={openAddCategoryModal}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-md transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          )}
        </div>

        {loadingCategories ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-3 border-slate-200 dark:border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : groupCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 dark:text-slate-555">
            <p className="text-xs italic">No categories created for this group yet.</p>
            {isOwner && (
              <button
                onClick={openAddCategoryModal}
                className="mt-3 px-4 py-2 text-xs font-bold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-350 transition-all border border-slate-200 dark:border-slate-700/50"
              >
                Create First Category
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupCategories.map(cat => {
              const CatIcon = (ICONS as any)[cat.icon || 'Tag'] || FolderClosed;
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-55/30 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 hover:border-slate-200 dark:hover:border-slate-750 transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: `${cat.color || '#06b6d4'}15`, color: cat.color || '#06b6d4' }}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-850 dark:text-white truncate">{cat.name}</p>
                      {cat.description && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold truncate mt-0.5">{cat.description}</p>
                      )}
                    </div>
                  </div>

                  {isOwner && group.status !== 'CLOSED' && (
                    <div className="flex items-center gap-1.5 shrink-0 ml-3">
                      <button
                        type="button"
                        onClick={() => openEditCategoryModal(cat)}
                        className="p-2 rounded-xl text-slate-450 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                        title="Edit Category"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-2 rounded-xl text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

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

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/v1/auth/me');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.username);
      }
    } catch (err) {
      console.error('Failed to fetch user context:', err);
    }
  };

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const groupRes = await api.getTransactionGroupById(groupId);
      setGroup(groupRes);
      
      const statsRes = await api.getTransactionGroupStatistics(groupId);
      setStats(statsRes);

      if (groupRes.shared) {
        const membersRes = await api.getGroupMembers(groupId);
        setMembers(membersRes.data ?? []);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load group details', 'error');
      navigate('/groups');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!group) return;
    try {
      if (group.shared) {
        const res = await api.getTransactionGroupTransactionsPaginated(groupId, page, pageSize);
        setTransactions(res.data || []);
        setTotalCount(res.total_count || 0);
        setHasMore(res.has_more || false);
        setTotalPages(Math.ceil((res.total_count || 0) / pageSize));
      } else {
        const res = await api.getTransactionGroupTransactions(groupId);
        setTransactions(res.data || []);
      }
    } catch (e: any) {
      showToast(e.message || 'Failed to load transactions', 'error');
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (groupId) {
      fetchDetails();
    }
  }, [groupId]);

  useEffect(() => {
    if (groupId && group) {
      fetchTransactions();
    }
  }, [groupId, group, page, pageSize]);

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
      fetchTransactions();
    } catch (e: any) {
      showToast(e.message || 'Failed to remove transaction', 'error');
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteIdentifier.trim()) {
      showToast('Please enter username or email', 'warning');
      return;
    }
    setInviting(true);
    try {
      await api.inviteGroupMember(groupId, inviteIdentifier.trim());
      showToast('Invitation sent successfully', 'success');
      setInviteIdentifier('');
      const membersRes = await api.getGroupMembers(groupId);
      setMembers(membersRes.data ?? []);
    } catch (err: any) {
      showToast(err.message || 'Failed to send invitation', 'error');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    try {
      await api.removeGroupMember(groupId, userId);
      showToast('Member removed successfully', 'success');
      const membersRes = await api.getGroupMembers(groupId);
      setMembers(membersRes.data ?? []);
      fetchDetails();
      fetchTransactions();
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    try {
      await api.leaveGroup(groupId);
      showToast('You have left the group successfully', 'success');
      navigate('/groups');
    } catch (err: any) {
      showToast(err.message || 'Failed to leave group', 'error');
    }
  };

  const fetchGroupCategories = async () => {
    if (!groupId) return;
    setLoadingCategories(true);
    try {
      const res = await api.getGroupCategories(groupId);
      setGroupCategories(res.data || []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load categories', 'error');
    } finally {
      setLoadingCategories(false);
    }
  };

  const openAddCategoryModal = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDescription('');
    setCatIcon('Tag');
    setCatColor('#06b6d4');
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (cat: GroupCategory) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDescription(cat.description || '');
    setCatIcon(cat.icon || 'Tag');
    setCatColor(cat.color || '#06b6d4');
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      showToast('Category name is required', 'warning');
      return;
    }
    setCatSaving(true);
    try {
      const payload = {
        name: catName.trim(),
        description: catDescription.trim() || undefined,
        icon: catIcon,
        color: catColor
      };

      if (editingCategory) {
        await api.updateGroupCategory(groupId, editingCategory.id, payload);
        showToast('Category updated successfully', 'success');
      } else {
        await api.createGroupCategory(groupId, payload);
        showToast('Category created successfully', 'success');
      }
      setIsCategoryModalOpen(false);
      fetchGroupCategories();
    } catch (err: any) {
      showToast(err.message || 'Failed to save category', 'error');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!window.confirm('Are you sure you want to delete this category? All transactions using this category will be marked as uncategorized.')) {
      return;
    }
    try {
      await api.deleteGroupCategory(groupId, catId);
      showToast('Category deleted successfully', 'success');
      fetchGroupCategories();
      fetchDetails();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete category', 'error');
    }
  };

  useEffect(() => {
    if (groupId && activeTab === 'categories') {
      fetchGroupCategories();
    }
  }, [groupId, activeTab]);

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
    ? Object.entries(stats.category_breakdown)
        .map(([name, value]) => ({ name, value: value as number }))
        .sort((a, b) => b.value - a.value)
    : [];

  const subcategoryChartData: { name: string; value: number }[] = stats?.has_subcategory_data
    ? (Object.entries(stats.subcategory_breakdown) as [string, number][])
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [];

  const itemChartData: { name: string; value: number }[] = stats?.has_item_data
    ? (Object.entries(stats.item_breakdown) as [string, number][])
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
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
  };  const isOwner = members.find(m => m.role === 'ADMIN')?.user?.username === currentUser;
  const presetColor = GROUP_COLORS.find(c => c.hex === group.color) || GROUP_COLORS[0];
  const IconComponent = (ICONS as any)[group.icon || 'Tag'] || FolderClosed;

  const renderMembersCard = () => {
    return (
      <div className="glass-card rounded-2xl p-6 space-y-6">
        {/* Invite Member Section (Owner only) */}
        {isOwner && group.status !== 'CLOSED' && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Invite Member</h4>
            <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-3.5 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter username or recovery email..."
                  value={inviteIdentifier}
                  onChange={e => setInviteIdentifier(e.target.value)}
                  disabled={inviting}
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-slate-55 dark:bg-slate-950 border border-slate-205 dark:border-slate-850 text-slate-805 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={inviting}
                className="px-6 py-3 rounded-2xl text-white font-bold text-sm bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 transition-all shrink-0"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </form>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Group Members ({members.length})</h4>
          <div className="space-y-3">
            {members.map(m => {
              const isCurrentUser = m.user?.username === currentUser;
              const canRemoveMember = isOwner && !isCurrentUser && m.role !== 'ADMIN';
              
              let statusBg = 'bg-slate-100 text-slate-655 dark:bg-slate-800 dark:text-slate-400';
              if (m.status === 'ACCEPTED') statusBg = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
              if (m.status === 'PENDING') statusBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
              if (m.status === 'DECLINED') statusBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-455';
              if (m.status === 'LEFT') statusBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-455';
              if (m.status === 'REMOVED') statusBg = 'bg-rose-500/10 text-rose-600 dark:text-rose-455';

              return (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 group/member-item"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 overflow-hidden shrink-0 border border-slate-200/50 dark:border-slate-800/50">
                      {m.user?.profile_picture ? (
                        <img src={m.user.profile_picture} alt="" className="w-full h-full object-cover" />
                      ) : (
                        (m.user?.display_name || m.user?.username || 'U').substring(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-slate-800 dark:text-slate-200 truncate">
                          {m.user?.display_name || m.user?.username}
                        </p>
                        {m.role === 'ADMIN' && (
                          <span className="flex items-center gap-0.5 text-[8px] font-extrabold uppercase bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded-md">
                            <Shield className="w-2.5 h-2.5" /> Owner
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 dark:text-slate-505 font-semibold mt-0.5">
                        @{m.user?.username}
                        {m.status === 'PENDING' && ` • Invited by @${m.invited_by_username}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {m.role !== 'ADMIN' && (
                      <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-md uppercase tracking-wider ${statusBg}`}>
                        {m.status}
                      </span>
                    )}

                    {canRemoveMember && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.user?.id || 0)}
                        className="p-1.5 rounded-lg text-slate-450 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Remove Member"
                      >
                        <UserMinus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Group Thumbnail Cover Banner */}
      <LazyGroupThumbnail groupId={group.id} groupName={group.name} isBanner={true} />

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
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-black text-slate-850 dark:text-white leading-none break-words max-w-[180px] sm:max-w-none">{group.name}</h1>
                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-slate-150 dark:bg-slate-800 text-slate-550 dark:text-slate-450 uppercase tracking-widest whitespace-nowrap">
                    {group.type}
                  </span>
                  {group.shared && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 uppercase tracking-widest whitespace-nowrap">
                      Shared
                    </span>
                  )}
                  <span className={`w-2 h-2 rounded-full ${group.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'} shrink-0`} title={group.status}></span>
                </div>
              </div>
              {group.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{group.description}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {group.status !== 'CLOSED' && (
            <button
              onClick={() => setIsAddTransactionOpen(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white shadow-md hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" /> Add Transaction
            </button>
          )}
          {(!group.shared || isOwner) && (
            <>
              <button
                onClick={openEditModal}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all whitespace-nowrap"
              >
                <Edit2 className="w-4 h-4" /> Edit Group
              </button>
              <button
                onClick={() => setDeleteTarget(group)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all whitespace-nowrap"
              >
                <Trash2 className="w-4 h-4" /> Delete Group
              </button>
            </>
          )}
          {group.shared && !isOwner && (
            <button
              onClick={handleLeaveGroup}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-900/30 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all whitespace-nowrap"
            >
              <LogOut className="w-4 h-4" /> Leave Group
            </button>
          )}
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

      {group.shared && (
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          {(['transactions', 'statistics', 'categories', 'members'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              type="button"
              className={`pb-3 text-sm font-extrabold uppercase tracking-wider border-b-2 transition-colors shrink-0 ${
                activeTab === tab
                  ? 'border-cyan-500 text-slate-850 dark:text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-605 dark:text-slate-550'
              }`}
            >
              {tab === 'statistics' ? 'Analytics' : tab}
            </button>
          ))}
        </div>
      )}

      {group.shared ? (
        <div className="space-y-6">
          {activeTab === 'transactions' && renderTransactionsCard()}
          {activeTab === 'statistics' && renderSharedAnalytics()}
          {activeTab === 'categories' && renderCategoriesCard()}
          {activeTab === 'members' && (
            <div className="max-w-3xl mx-auto">
              {renderMembersCard()}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Stats & Breakdown (Non-shared) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Breakdown Card */}
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
                        itemStyle={{ color: 'var(--theme-text)' }}
                        labelStyle={{ color: 'var(--theme-text)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-555 text-xs">
                    <p>No category data in this group</p>
                  </div>
                )}
              </div>

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

            {/* Subcategory Breakdown Card */}
            {subcategoryChartData.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-violet-500" />
                  <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Subcategory Breakdown</h3>
                </div>

                <div style={{ height: Math.max(160, subcategoryChartData.length * 36) }} className="w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={subcategoryChartData}
                      margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" horizontal={false} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                        tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={88}
                        tick={{ fontSize: 10, fill: 'var(--theme-text-muted)' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(value: number) => fmt(value)}
                        contentStyle={{
                          borderRadius: '12px',
                          border: '1px solid rgba(148,163,184,0.15)',
                          backgroundColor: 'var(--theme-surface)',
                          color: 'var(--theme-text)',
                          fontSize: 11
                        }}
                        itemStyle={{ color: 'var(--theme-text)' }}
                        labelStyle={{ color: 'var(--theme-text)' }}
                        cursor={{ fill: 'rgba(139,92,246,0.06)' }}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={18}>
                        {subcategoryChartData.map((entry, index) => (
                          <Cell key={`sc-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-4 space-y-2 max-h-40 overflow-y-auto pr-1">
                  {subcategoryChartData.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center text-xs font-semibold">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                        <span className="text-slate-500 dark:text-slate-400 truncate">{item.name}</span>
                      </div>
                      <span className="text-slate-800 dark:text-slate-200 shrink-0 ml-2">{fmt(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Item Breakdown Card */}
            {itemChartData.length > 0 && (
              <div className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-850 dark:text-white uppercase tracking-wider">Item Breakdown</h3>
                </div>

                {itemChartData.length <= 8 && (
                  <div className="h-[160px] w-full mb-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={itemChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={44}
                          outerRadius={62}
                          paddingAngle={3}
                        >
                          {itemChartData.map((entry, index) => (
                            <Cell key={`item-cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
                          itemStyle={{ color: 'var(--theme-text)' }}
                          labelStyle={{ color: 'var(--theme-text)' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {itemChartData.map((item, idx) => {
                    const totalItems = itemChartData.reduce((s, i) => s + i.value, 0);
                    const pct = totalItems > 0 ? Math.round((item.value / totalItems) * 100) : 0;
                    return (
                      <div key={item.name} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                            />
                            <span className="text-slate-600 dark:text-slate-355 truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-slate-400 dark:text-slate-500 text-[10px]">{pct}%</span>
                              <span className="text-slate-800 dark:text-slate-200">{fmt(item.value)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: PIE_COLORS[idx % PIE_COLORS.length]
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Transactions card */}
          <div className="lg:col-span-2 space-y-6">
            {renderTransactionsCard()}
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-black text-slate-850 dark:text-white">Edit Group Settings</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdate} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
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

              </div>

              {/* Form Actions */}
              <div className="p-6 pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
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

      {/* Add/Edit Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4 animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCategoryModalOpen(false)} />
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] relative my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <h3 className="text-lg font-black text-slate-850 dark:text-white">
                {editingCategory ? 'Edit Group Category' : 'Add Group Category'}
              </h3>
              <button type="button" onClick={() => setIsCategoryModalOpen(false)} className="p-1.5 rounded-xl text-slate-405 hover:bg-slate-105 dark:hover:bg-slate-805 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveCategory} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Category Name</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    placeholder="e.g. Flight, Dinner, Accommodation..."
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Description</label>
                  <textarea
                    value={catDescription}
                    onChange={e => setCatDescription(e.target.value)}
                    placeholder="Description of this category..."
                    rows={2}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-850 dark:text-white text-sm focus:outline-none focus:border-cyan-500 transition-all font-semibold"
                  />
                </div>

                {/* Color Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Select Color Accent</label>
                  <div className="flex flex-wrap gap-2">
                    {GROUP_COLORS.map(c => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setCatColor(c.hex)}
                        className={`w-7 h-7 rounded-full border-2 transition-transform duration-200 hover:scale-110 flex items-center justify-center`}
                        style={{
                          backgroundColor: c.hex,
                          borderColor: catColor === c.hex ? 'var(--theme-text)' : 'transparent'
                        }}
                        title={c.name}
                      >
                        {catColor === c.hex && (
                          <span className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Icon Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Select Icon Symbol</label>
                  <div className="grid grid-cols-7 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {ICON_NAMES.map(name => {
                      const IconComp = ICONS[name as keyof typeof ICONS];
                      const isSelected = catIcon === name;
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setCatIcon(name)}
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
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="w-full py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-550 dark:text-slate-405 text-sm font-extrabold hover:bg-slate-55 dark:hover:bg-slate-955 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={catSaving}
                  className="w-full py-3 rounded-2xl text-white text-sm font-extrabold shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{
                    background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                    boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                >
                  {catSaving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Save Category'
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
