import React, { useEffect, useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Trash2,
  Edit2,
  Copy,
  AlertCircle,
  Save,
  PlusCircle,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Settings,
  Flame,
  Check,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { Budget, BudgetCategoryAllocation, Category, BudgetUtilization, CategoryUtilization } from '../types';
import { useToast } from '../components/ToastContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import CategoryIcon from '../components/CategoryIcon';

const isPastMonth = (m?: number, y?: number) => {
  if (!m || !y) return false;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  return y < currentYear || (y === currentYear && m < currentMonth);
};

const TimelineCard: React.FC<{
  slot: { month: number; year: number; label: string; fullLabel: string };
  isSelected: boolean;
  onSelect: () => void;
  utilization: BudgetUtilization | null;
  loading: boolean;
}> = ({ slot, isSelected, onSelect, utilization, loading }) => {
  if (loading) {
    return (
      <div className="min-w-[170px] p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white/30 dark:bg-slate-900/30 animate-pulse flex flex-col justify-between h-[110px]">
        <div className="h-3 w-16 bg-slate-200 dark:bg-slate-850 rounded mb-2" />
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-850 rounded mb-2" />
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-850 rounded" />
      </div>
    );
  }

  const overall = utilization?.overall;
  const isMaster = utilization?.budget.is_master;
  const spent = overall?.spent || 0;
  const allocated = overall?.allocated || 0;
  const percentUsed = overall?.percent_used || 0;
  const isOvershot = percentUsed > 100;

  return (
    <div
      onClick={onSelect}
      className={`
        min-w-[170px] p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-[110px] select-none
        ${isSelected
          ? 'bg-white dark:bg-slate-900 border-cyan-500/80 shadow-xl shadow-cyan-500/5 ring-1 ring-cyan-500/20 scale-[1.02]'
          : 'bg-white/40 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800/60 hover:border-slate-350 dark:hover:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60 hover:scale-[1.01]'}
      `}
    >
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {slot.label} {slot.year}
          </span>
          {isMaster ? (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" title="Based on Master Template" />
          ) : isOvershot ? (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" title="Overshot Limit" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="On Track" />
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-[9px] text-slate-450 dark:text-slate-500 uppercase tracking-widest font-semibold">Spent</span>
          <span className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">
            ₹{Math.round(spent).toLocaleString()}{' '}
            <span className="text-[10px] font-medium text-slate-400">/ ₹{Math.round(allocated).toLocaleString()}</span>
          </span>
        </div>
      </div>
      <div className="mt-1">
        <div className="flex justify-between items-center text-[10px] mb-1">
          <span className={`font-bold ${isOvershot ? 'text-rose-500' : 'text-cyan-500'}`}>
            {percentUsed}% used
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${isOvershot ? 'bg-rose-500' : 'bg-gradient-to-r from-emerald-450 to-cyan-500'}`}
            style={{ width: `${Math.min(percentUsed, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const BudgetPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<number | null>(null);

  // Redesign state
  const [timelineSlots, setTimelineSlots] = useState<{ month: number; year: number; label: string; fullLabel: string }[]>([]);
  const [timelineData, setTimelineData] = useState<Record<string, BudgetUtilization | null>>({});
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ month: number; year: number } | null>(null);
  const [showMasterOnly, setShowMasterOnly] = useState(false);
  const [visibleMonthsCount, setVisibleMonthsCount] = useState(6);

  // Form State
  const [formData, setFormData] = useState<Partial<Budget>>({
    name: '',
    total_amount: 0,
    estimated_savings: 0,
    is_master: false,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    allocations: []
  });

  const [activeTab, setActiveTab] = useState<'details' | 'allocations'>('details');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchTimelineData = async (slotsList: { month: number; year: number }[]) => {
    setLoadingTimeline(true);
    try {
      const promises = slotsList.map(s =>
        api.getHistoricalBudgetUtilization(s.month, s.year)
          .catch(err => {
            console.error(`Failed to load utilization for ${s.month}/${s.year}`, err);
            return null;
          })
      );
      const results = await Promise.all(promises);
      const dataMap: Record<string, BudgetUtilization | null> = {};
      slotsList.forEach((s, idx) => {
        dataMap[`${s.year}-${s.month}`] = results[idx];
      });
      setTimelineData(dataMap);
    } catch (error) {
      console.error('Error fetching timeline data', error);
    } finally {
      setLoadingTimeline(false);
    }
  };

  const setupTimeline = async (allBudgets: Budget[], forceSelectSlot?: { month: number; year: number }, count = visibleMonthsCount) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const slotsMap = new Map<string, { month: number; year: number }>();

    // Generate last count months
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      slotsMap.set(key, { month: d.getMonth() + 1, year: d.getFullYear() });
    }

    // Merge in any other explicit monthly budgets from server (excluding future ones)
    allBudgets.forEach(b => {
      if (!b.is_master && b.month && b.year) {
        const isFuture = b.year > currentYear || (b.year === currentYear && b.month > currentMonth);
        if (!isFuture) {
          const key = `${b.year}-${b.month}`;
          slotsMap.set(key, { month: b.month, year: b.year });
        }
      }
    });

    // Sort slots newest-first (descending chronological)
    const sortedSlots = Array.from(slotsMap.values()).sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.month - a.month;
    });

    const slotsWithLabels = sortedSlots.map(s => {
      const date = new Date(s.year, s.month - 1, 1);
      return {
        month: s.month,
        year: s.year,
        label: date.toLocaleString('default', { month: 'short' }),
        fullLabel: date.toLocaleString('default', { month: 'long', year: 'numeric' })
      };
    });

    setTimelineSlots(slotsWithLabels);

    // Initial slot selection
    if (forceSelectSlot) {
      setSelectedSlot(forceSelectSlot);
    } else if (slotsWithLabels.length > 0) {
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const hasCurrent = slotsWithLabels.some(s => s.month === currentMonth && s.year === currentYear);

      if (hasCurrent) {
        setSelectedSlot(slotsWithLabels.find(s => s.month === currentMonth && s.year === currentYear)!);
      } else {
        setSelectedSlot(slotsWithLabels[0]);
      }
    }

    await fetchTimelineData(sortedSlots);
  };

  const handleLoadOlder = () => {
    const newCount = visibleMonthsCount + 6;
    setVisibleMonthsCount(newCount);
    setupTimeline(budgets, selectedSlot || undefined, newCount);
  };

  const fetchData = async (selectId?: number) => {
    setLoading(true);
    try {
      const [budgetsRes, categoriesRes] = await Promise.all([
        api.getBudgets(),
        api.getCategories()
      ]);
      const newBudgets = budgetsRes.data;
      setBudgets(newBudgets);
      setCategories(categoriesRes.filter(c => c.type !== 'INCOME'));

      const master = newBudgets.find(b => b.is_master);
      if (master) {
        let forceSlot: { month: number; year: number } | undefined;
        if (selectId) {
          const targetBudget = newBudgets.find(b => b.id === selectId);
          if (targetBudget && !targetBudget.is_master && targetBudget.month && targetBudget.year) {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth() + 1;
            const isFuture = targetBudget.year > currentYear || (targetBudget.year === currentYear && targetBudget.month > currentMonth);
            if (!isFuture) {
              forceSlot = { month: targetBudget.month, year: targetBudget.year };
              setShowMasterOnly(false);
            } else {
              setShowMasterOnly(false);
            }
          } else if (targetBudget?.is_master) {
            setShowMasterOnly(true);
          }
        }
        await setupTimeline(newBudgets, forceSlot);
      } else {
        setShowMasterOnly(true);
      }
    } catch (error) {
      showToast('Failed to fetch data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget: Budget) => {
    setFormData({ ...budget });
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleEditSelectedSlot = () => {
    if (!selectedSlot) return;
    const key = `${selectedSlot.year}-${selectedSlot.month}`;
    const util = timelineData[key];
    if (util) {
      if (util.budget.is_master) {
        // Create new monthly budget pre-filled with master settings
        setFormData({
          name: `Budget — ${selectedSlot.month}/${selectedSlot.year}`,
          total_amount: util.budget.total_amount,
          estimated_savings: util.budget.estimated_savings,
          is_master: false,
          month: selectedSlot.month,
          year: selectedSlot.year,
          allocations: util.budget.allocations?.map(a => ({
            category: a.category,
            allocated_amount: a.allocated_amount
          })) || []
        });
      } else {
        setFormData({ ...util.budget });
      }
      setIsEditing(true);
      setActiveTab('details');
    }
  };

  const handleAddNew = (isMaster: boolean = false) => {
    const nextMonth = new Date().getMonth() + 1;
    const nextYear = new Date().getFullYear();

    if (isMaster) {
      setFormData({
        name: 'Master Budget',
        total_amount: 0,
        estimated_savings: 0,
        is_master: true,
        allocations: []
      });
    } else {
      const masterBudget = budgets.find(b => b.is_master);
      if (masterBudget) {
        setFormData({
          name: `Budget — ${nextMonth}/${nextYear}`,
          total_amount: masterBudget.total_amount,
          estimated_savings: masterBudget.estimated_savings,
          is_master: false,
          month: nextMonth,
          year: nextYear,
          allocations: masterBudget.allocations?.map(a => ({
            category: a.category,
            allocated_amount: a.allocated_amount
          })) || []
        });
      } else {
        setFormData({
          name: `Budget ${nextMonth}/${nextYear}`,
          total_amount: 0,
          estimated_savings: 0,
          is_master: false,
          month: nextMonth,
          year: nextYear,
          allocations: []
        });
      }
    }
    setIsEditing(true);
    setActiveTab('details');
  };

  const handleClone = async (budget: Budget) => {
    const nextMonth = (budget.month || new Date().getMonth() + 1) % 12 + 1;
    const nextYear = nextMonth === 1 ? (budget.year || new Date().getFullYear()) + 1 : (budget.year || new Date().getFullYear());

    try {
      if (budget.id) {
        const saved = await api.createBudgetVersion(budget.id, nextMonth, nextYear);
        showToast('Budget cloned successfully', 'success');
        fetchData(saved.id);
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to clone budget', 'error');
    }
  };

  const handleDelete = (id: number) => {
    setBudgetToDelete(id);
    setIsConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!budgetToDelete) return;
    try {
      await api.deleteBudget(budgetToDelete);
      showToast('Budget deleted', 'success');
      fetchData();
    } catch (error: any) {
      showToast(error.message || 'Failed to delete', 'error');
    } finally {
      setIsConfirmOpen(false);
      setBudgetToDelete(null);
    }
  };

  const handleDeleteSelectedSlot = () => {
    if (!selectedSlot) return;
    const key = `${selectedSlot.year}-${selectedSlot.month}`;
    const util = timelineData[key];
    if (util && !util.budget.is_master && util.budget.id) {
      handleDelete(util.budget.id);
    }
  };

  const handleSave = async () => {
    if (!formData.is_master && isPastMonth(formData.month, formData.year)) {
      showToast('Cannot create or edit budgets for past months', 'error');
      return;
    }
    try {
      let savedId = formData.id;
      if (formData.id) {
        await api.updateBudget(formData.id, formData);
        showToast('Budget updated', 'success');
      } else {
        const data = await api.createBudget(formData);
        savedId = data.id;
        showToast('Budget created', 'success');
      }
      setIsEditing(false);
      fetchData(savedId);
    } catch (error: any) {
      showToast(error.message || 'Failed to save', 'error');
    }
  };

  const addAllocation = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    if (formData.allocations?.some(a => a.category.id === categoryId)) {
      showToast('Category already allocated', 'info');
      return;
    }

    setFormData({
      ...formData,
      allocations: [
        ...(formData.allocations || []),
        { category, allocated_amount: 0 }
      ]
    });
  };

  const updateAllocation = (index: number, amount: number) => {
    const newAllocations = [...(formData.allocations || [])];
    newAllocations[index].allocated_amount = amount;
    setFormData({ ...formData, allocations: newAllocations });
  };

  const removeAllocation = (index: number) => {
    const newAllocations = [...(formData.allocations || [])];
    newAllocations.splice(index, 1);
    setFormData({ ...formData, allocations: newAllocations });
  };

  const totalAllocated = formData.allocations?.reduce((sum, a) => sum + a.allocated_amount, 0) || 0;
  const isOverAllocated = totalAllocated > (formData.total_amount || 0);

  // Read current active budget utilization
  const activeKey = selectedSlot ? `${selectedSlot.year}-${selectedSlot.month}` : '';
  const selectedUtilization = showMasterOnly
    ? null
    : timelineData[activeKey] || null;

  const masterBudget = useMemo(() => {
    return budgets.find(b => b.is_master) || null;
  }, [budgets]);

  const upcomingBudgets = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    return budgets.filter(b =>
      !b.is_master &&
      b.month &&
      b.year &&
      (b.year > currentYear || (b.year === currentYear && b.month > currentMonth))
    ).sort((a, b) => {
      if (a.year !== b.year) return a.year! - b.year!;
      return a.month! - b.month!;
    });
  }, [budgets]);

  // Automated Insights calculations
  const overshotCategories = useMemo(() => {
    if (!selectedUtilization) return [];
    return selectedUtilization.categories
      .filter(c => c.spent > c.allocated)
      .map(c => ({
        ...c,
        overAmount: c.spent - c.allocated,
      }))
      .sort((a, b) => b.overAmount - a.overAmount);
  }, [selectedUtilization]);

  const actualSavings = useMemo(() => {
    if (!selectedUtilization) return 0;
    return selectedUtilization.categories
      .filter(c => c.category.type === 'SAVING')
      .reduce((sum, c) => sum + c.spent, 0);
  }, [selectedUtilization]);

  const selectedSlotDetails = useMemo(() => {
    if (!selectedSlot) return null;
    const slot = timelineSlots.find(s => s.month === selectedSlot.month && s.year === selectedSlot.year);
    if (slot) return slot;
    const date = new Date(selectedSlot.year, selectedSlot.month - 1, 1);
    return {
      month: selectedSlot.month,
      year: selectedSlot.year,
      label: date.toLocaleString('default', { month: 'short' }),
      fullLabel: date.toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  }, [selectedSlot, timelineSlots]);

  const isSelectedSlotPast = useMemo(() => {
    if (!selectedSlot) return false;
    return isPastMonth(selectedSlot.month, selectedSlot.year);
  }, [selectedSlot]);

  // overall stats helper
  const overallSpent = selectedUtilization?.overall.spent || 0;
  const overallAllocated = selectedUtilization?.overall.allocated || 0;
  const overallRemaining = selectedUtilization?.overall.remaining || 0;
  const overallPercent = selectedUtilization?.overall.percent_used || 0;
  const isOverallOvershot = overallPercent > 100;

  // Custom circular progress SVG values
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(overallPercent, 100) / 100) * circumference;

  if (loading && budgets.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-300 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <HandCoins className="w-7 h-7 text-cyan-500 animate-pulse" />
            Budget Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track utilization, identify leaks, and compare historical metrics</p>
        </div>
        {!isEditing && (
          <div className="flex flex-wrap gap-2.5">
            {/* View Toggle Mode */}
            <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl mr-2.5">
              <button
                onClick={() => setShowMasterOnly(false)}
                disabled={!masterBudget}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${!showMasterOnly ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40'}`}
              >
                Monthly Insights
              </button>
              <button
                onClick={() => {
                  if (masterBudget) {
                    setSelectedSlot(null);
                    setShowMasterOnly(true);
                  }
                }}
                disabled={!masterBudget}
                className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${showMasterOnly ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-40'}`}
              >
                Master Template
              </button>
            </div>

            {!masterBudget && (
              <button
                onClick={() => handleAddNew(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-xs font-bold"
              >
                <Plus className="w-4 h-4" />
                Master Template
              </button>
            )}

            <button
              onClick={() => handleAddNew(false)}
              className="flex items-center justify-center gap-2 px-4 py-2 text-white rounded-xl shadow-lg transition-all font-bold text-xs"
              style={{
                background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)`
              }}
              onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
            >
              <Plus className="w-4 h-4" />
              New Budget
            </button>
          </div>
        )}
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Horizontal Timeline Section */}
        {!isEditing && !showMasterOnly && timelineSlots.length > 0 && (
          <div className="relative group/timeline bg-slate-50/50 dark:bg-slate-900/10 p-4 rounded-3xl border border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                Historical Utilization Timeline
              </h3>
              <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic">Select a month to view details</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex-1 overflow-x-auto py-2.5 px-4 flex gap-3 scrollbar-none scroll-smooth">
                {timelineSlots.map(slot => {
                  const key = `${slot.year}-${slot.month}`;
                  const isSelected = selectedSlot?.month === slot.month && selectedSlot?.year === slot.year;
                  const util = timelineData[key] || null;
                  return (
                    <TimelineCard
                      key={key}
                      slot={slot}
                      isSelected={isSelected}
                      onSelect={() => {
                        setShowMasterOnly(false);
                        setSelectedSlot(slot);
                      }}
                      utilization={util}
                      loading={loadingTimeline && !util}
                    />
                  );
                })}

                {/* Load Older Months Button Card */}
                <button
                  type="button"
                  onClick={handleLoadOlder}
                  className="min-w-[170px] p-4 rounded-2xl border border-dashed border-slate-350 dark:border-slate-805 hover:border-slate-400 dark:hover:border-slate-700 bg-transparent hover:bg-slate-50/20 dark:hover:bg-slate-855/10 flex flex-col items-center justify-center gap-1.5 text-slate-500 dark:text-slate-400 transition-all select-none h-[110px]"
                >
                  <ChevronRight className="w-4 h-4 text-cyan-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Load Older Months</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Detail Card / Editor */}
        <div className="w-full">
          {isEditing ? (
            /* Configure / Edit Budget Form */
            <div className="glass-card rounded-3xl p-4 sm:p-8 border-cyan-500/20 shadow-2xl shadow-cyan-500/5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <Edit2 className="w-5 h-5 text-cyan-500" />
                  {formData.id ? `Edit Budget: ${formData.name}` : formData.is_master ? 'Configure Master Budget Template' : 'Configure New Budget'}
                </h2>
                <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-end sm:self-auto">
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'details' ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500'}`}
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setActiveTab('allocations')}
                    className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${activeTab === 'allocations' ? 'bg-white dark:bg-slate-700 shadow text-cyan-600 dark:text-cyan-400' : 'text-slate-500'}`}
                  >
                    Allocations
                  </button>
                </div>
              </div>

              <div className="space-y-6">
                {activeTab === 'details' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Budget Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-cyan-500/20 transition-all"
                        placeholder="e.g. Baseline Master Budget"
                      />
                    </div>

                    {!formData.is_master && (
                      <>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Month</label>
                          <select
                            value={formData.month}
                            onChange={e => setFormData({ ...formData, month: parseInt(e.target.value) })}
                            className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1)
                              .filter(m => {
                                const currentYear = new Date().getFullYear();
                                const currentMonth = new Date().getMonth() + 1;
                                if ((formData.year || currentYear) <= currentYear) {
                                  return m >= currentMonth;
                                }
                                return true;
                              })
                              .map(m => (
                                <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</option>
                              ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Year</label>
                          <select
                            value={formData.year}
                            onChange={e => setFormData({ ...formData, year: parseInt(e.target.value) })}
                            className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white"
                          >
                            {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map(yr => (
                              <option key={yr} value={yr}>{yr}</option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Monthly Cap (₹)</label>
                      <input
                        type="number"
                        value={formData.total_amount}
                        onChange={e => setFormData({ ...formData, total_amount: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Planned Savings (₹) <span className="lowercase font-normal text-slate-500">(auto-calculated)</span></label>
                      <input
                        type="number"
                        readOnly
                        value={formData.allocations?.filter(a => a.category.type === 'SAVING').reduce((sum, a) => sum + a.allocated_amount, 0) || 0}
                        className="w-full bg-slate-100/20 dark:bg-slate-800/20 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-500 cursor-not-allowed font-bold"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Notes</label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full bg-slate-100/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-slate-900 dark:text-white h-24"
                        placeholder="Strategy for limits..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-5">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Category Allocations</p>
                        <p className="text-xs text-slate-500">Distribute your cap among categories</p>
                      </div>
                      <div className={`px-4 py-2 rounded-2xl text-sm font-bold flex items-center gap-2 self-start sm:self-auto ${isOverAllocated ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isOverAllocated ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                        ₹{totalAllocated.toLocaleString()} / ₹{(formData.total_amount || 0).toLocaleString()}
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {formData.allocations?.map((alloc, idx) => (
                        <div key={alloc.category.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-slate-100/30 dark:bg-slate-850/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-750 group">
                          <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                            <CategoryIcon category={alloc.category} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{alloc.category.name}</p>
                              <p className="text-[10px] text-slate-505 uppercase tracking-wider">{alloc.category.type}</p>
                            </div>
                            <button onClick={() => removeAllocation(idx)} className="sm:hidden p-2 text-slate-400 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="w-full sm:w-40 flex items-center gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-405 text-sm">₹</span>
                              <input
                                type="number"
                                value={alloc.allocated_amount}
                                onChange={e => updateAllocation(idx, parseFloat(e.target.value) || 0)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm font-bold text-slate-900 dark:text-white"
                              />
                            </div>
                            <button onClick={() => removeAllocation(idx)} className="hidden sm:block p-2 text-slate-400 hover:text-rose-500 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {formData.allocations?.length === 0 && (
                        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl text-slate-400">
                          No categories allocated yet
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-405 uppercase tracking-widest mb-3">Add Category Allocation</p>
                      <div className="flex flex-wrap gap-2">
                        {categories
                          .filter(cat => !formData.allocations?.some(a => a.category.id === cat.id))
                          .map(cat => (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => addAllocation(cat.id)}
                              className="px-3 py-1.5 bg-white dark:bg-slate-905 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-650 dark:text-slate-300 hover:bg-cyan-500 hover:border-cyan-500 hover:text-white transition-all flex items-center gap-1.5"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              {cat.name}
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="w-full sm:w-auto px-6 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-350 transition-colors text-center"
                  >
                    Discard Changes
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formData.name || (formData.total_amount || 0) <= 0 || isOverAllocated}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 text-white text-sm font-bold rounded-2xl shadow-xl transition-all disabled:opacity-50 disabled:grayscale"
                    style={{
                      background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                    }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                  >
                    <Save className="w-4 h-4" />
                    {formData.id ? 'Save Updates' : 'Create Budget'}
                  </button>
                </div>
              </div>
            </div>
          ) : showMasterOnly ? (
            /* Master Template Detail Dashboard */
            masterBudget ? (
              <div className="glass-card rounded-3xl p-6 sm:p-8 border-slate-200/50 dark:border-slate-800/50 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="relative flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
                  <div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                      Master Budget Template
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-2">{masterBudget.name}</h2>
                    {masterBudget.notes && <p className="text-slate-500 dark:text-slate-400 max-w-lg mt-2.5 italic">“{masterBudget.notes}”</p>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleClone(masterBudget)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-300 hover:shadow-lg transition-all"
                    >
                      <Copy className="w-4 h-4" />
                      Clone to Month
                    </button>
                    <button
                      onClick={() => handleEdit(masterBudget)}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all font-semibold text-xs"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Template
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5">Template Monthly Capacity</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 dark:text-white">₹{(masterBudget.total_amount || 0).toLocaleString()}</span>
                      <span className="text-sm font-medium text-slate-500">limit</span>
                    </div>
                  </div>
                  <div className="p-6 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-3xl border border-emerald-500/10">
                    <p className="text-xs font-bold text-emerald-600/60 dark:text-emerald-400/60 uppercase tracking-widest mb-1.5">Template Planned Savings</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">₹{(masterBudget.estimated_savings || 0).toLocaleString()}</span>
                      <span className="text-sm font-medium text-emerald-500/60 font-bold">🎯</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex justify-between">
                    Allocations Structure
                    <span>{masterBudget.allocations?.length || 0} categories</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                    {masterBudget.allocations?.map(alloc => (
                      <div key={alloc.category.id} className="group">
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <CategoryIcon category={alloc.category} />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-500 transition-colors">{alloc.category.name}</span>
                          </div>
                          <span className="text-sm font-black text-slate-900 dark:text-white">₹{(alloc.allocated_amount || 0).toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                            style={{ width: `${Math.min((alloc.allocated_amount / masterBudget.total_amount) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {(masterBudget.allocations?.length || 0) === 0 && (
                      <div className="md:col-span-2 py-8 text-center text-slate-400 border border-dashed border-slate-100 dark:border-slate-800 rounded-3xl">
                        No allocations defined in this template. Click "Edit Template" to add splits.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* If no master budget is configured at all */
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-white/30 dark:bg-slate-900/10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/50 mt-4 animate-in fade-in duration-300">
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                  <HandCoins className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Create a Master Budget Template</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-6">Setup your baseline monthly spending limits. Once configured, you can track historical utilization and generate specific monthly budgets.</p>
                <button
                  onClick={() => handleAddNew(true)}
                  className="px-6 py-3 text-white text-sm font-bold rounded-2xl shadow-xl transition-all"
                  style={{
                    background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                  }}
                >
                  Configure Master Template
                </button>
              </div>
            )
          ) : selectedUtilization ? (
            /* Selected Month Utilization Dashboard */
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              
              {/* Top Summary Block */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border-slate-200/50 dark:border-slate-800/50 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                
                <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedUtilization.budget.is_master ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/10' : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'}`}>
                        {selectedUtilization.budget.is_master ? 'Implicit Master Template' : 'Dedicated Monthly Budget'}
                      </span>
                      {selectedSlotDetails && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-slate-100 dark:bg-slate-805 text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-800/50">
                          {selectedSlotDetails.fullLabel}
                        </span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                      {selectedUtilization.budget.is_master 
                        ? `${selectedSlotDetails?.label} Performance Overview`
                        : selectedUtilization.budget.name
                      }
                    </h2>
                    {selectedUtilization.budget.notes && (
                      <p className="text-slate-500 dark:text-slate-400 max-w-lg mt-2 italic">
                        “{selectedUtilization.budget.notes}”
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {!isSelectedSlotPast ? (
                      <>
                        {!selectedUtilization.budget.is_master && (
                          <>
                            <button
                              onClick={() => handleClone(selectedUtilization.budget)}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-650 dark:text-slate-300 hover:shadow-lg transition-all"
                            >
                              <Copy className="w-3.5 h-3.5" />
                              Clone
                            </button>
                            <button
                              onClick={handleDeleteSelectedSlot}
                              className="flex items-center justify-center gap-2 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all font-semibold text-xs"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Budget
                            </button>
                          </>
                        )}
                        <button
                          onClick={handleEditSelectedSlot}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-cyan-500 text-white rounded-xl shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 transition-all font-bold text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          {selectedUtilization.budget.is_master ? 'Setup Dedicated Budget' : 'Edit Limits'}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-xl text-xs font-semibold border border-slate-200/50 dark:border-slate-800/20">
                        <Info className="w-3.5 h-3.5 text-slate-400" />
                        View only
                      </div>
                    )}
                  </div>
                </div>

                {/* Overall Gauge + Stats */}
                <div className="flex flex-col md:flex-row items-center gap-8 border-b border-slate-100 dark:border-slate-800/60 pb-8">
                  {/* Gauge */}
                  <div className="relative flex items-center justify-center w-36 h-36">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle
                        className="text-slate-100 dark:text-slate-800"
                        strokeWidth={strokeWidth}
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="64"
                        cy="64"
                      />
                      <circle
                        className={isOverallOvershot ? 'text-rose-500' : 'text-cyan-500'}
                        strokeWidth={strokeWidth}
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="64"
                        cy="64"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-2xl font-black ${isOverallOvershot ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {overallPercent}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">utilization</span>
                    </div>
                  </div>

                  {/* Core Stats Box */}
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-5 w-full">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Cap Limit</p>
                      <span className="text-xl font-black text-slate-900 dark:text-white">₹{overallAllocated.toLocaleString()}</span>
                    </div>
                    
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Actual Spent</p>
                      <span className={`text-xl font-black ${isOverallOvershot ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        ₹{Math.round(overallSpent).toLocaleString()}
                      </span>
                    </div>

                    <div className={`p-4 rounded-2xl border ${isOverallOvershot ? 'bg-rose-500/5 border-rose-500/10' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isOverallOvershot ? 'text-rose-600/60 dark:text-rose-450' : 'text-emerald-600/60 dark:text-emerald-450'}`}>
                        {overallRemaining >= 0 ? 'Remaining Funds' : 'Overdraft'}
                      </p>
                      <span className={`text-xl font-black ${isOverallOvershot ? 'text-rose-500' : 'text-emerald-500'}`}>
                        ₹{Math.abs(Math.round(overallRemaining)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Second Row: Planned Savings block */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Planned Savings Allocation</p>
                      <p className="text-xs text-slate-500">Budget allocations directed towards Savings</p>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-emerald-500">₹{actualSavings.toLocaleString()}</span>
                    <span className="text-xs text-slate-400">saved / planned ₹{(selectedUtilization.budget.estimated_savings || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Insights Panel ("What went wrong?") */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border-slate-200/50 dark:border-slate-800/50 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-rose-500 animate-bounce" />
                    Budget Insights & Leak Identification
                  </h3>
                  <span className="text-xs font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-500">
                    Auto-analyzed
                  </span>
                </div>

                {overshotCategories.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Leakage warning!</p>
                        <p className="text-xs text-rose-500/80 mt-1">
                          You exceeded category limits in {overshotCategories.length} categories. This account leaks ₹{Math.round(overshotCategories.reduce((sum, c) => sum + c.overAmount, 0)).toLocaleString()} in overspend.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {overshotCategories.map(c => {
                        const isUncategorized = c.category.name.toLowerCase() === 'uncategorized';
                        return (
                          <div key={c.category.id || c.category.name} className="p-4 bg-slate-50 dark:bg-slate-800/20 border border-slate-200/60 dark:border-slate-800/60 rounded-2xl flex items-start justify-between gap-3 group hover:border-rose-500/30 transition-all">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5">
                                <CategoryIcon category={c.category} />
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{c.category.name}</p>
                                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wide mt-0.5">
                                  {isUncategorized ? 'Leakage' : `Overshot limit`}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                  {isUncategorized
                                    ? `₹${Math.round(c.spent).toLocaleString()} spent without category bounds.`
                                    : `Spent ₹${Math.round(c.spent).toLocaleString()} against limit of ₹${Math.round(c.allocated).toLocaleString()}.`
                                  }
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                              +₹{Math.round(c.overAmount).toLocaleString()}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-emerald-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">Splendid! Limit Integrity Maintained</h4>
                    <p className="text-xs text-slate-500 max-w-sm">Every single category was kept under limits for this period. Exceptional discipline!</p>
                  </div>
                )}
              </div>

              {/* Detailed Category Split Table */}
              <div className="glass-card rounded-3xl p-6 sm:p-8 border-slate-200/50 dark:border-slate-800/50 shadow-xl">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 flex justify-between">
                  Category Breakdown Details
                  <span>{selectedUtilization.categories.length} categories tracked</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6">
                  {selectedUtilization.categories.map((c: CategoryUtilization) => {
                    const isOvershot = c.spent > c.allocated;
                    const percent = c.percent_used;
                    
                    return (
                      <div key={c.category.id || c.category.name} className="group p-3 hover:bg-slate-50 dark:hover:bg-slate-800/20 rounded-2xl transition-all border border-transparent hover:border-slate-200/40 dark:hover:border-slate-800/40">
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <CategoryIcon category={c.category} />
                            <div className="flex flex-col truncate">
                              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-cyan-500 transition-colors truncate">
                                {c.category.name}
                              </span>
                              <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
                                {c.category.type}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              ₹{Math.round(c.spent).toLocaleString()}{' '}
                              <span className="text-[10px] font-semibold text-slate-400">/ ₹{Math.round(c.allocated).toLocaleString()}</span>
                            </span>
                            <span className={`text-[10px] font-bold mt-0.5 ${isOvershot ? 'text-rose-500' : 'text-slate-400'}`}>
                              {isOvershot 
                                ? `over by ₹${Math.round(c.spent - c.allocated).toLocaleString()}` 
                                : `₹${Math.round(c.remaining).toLocaleString()} remaining`
                              }
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isOvershot ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                            style={{ width: `${Math.min(percent, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] mt-1 text-slate-405 dark:text-slate-500 font-semibold uppercase tracking-wider">
                          <span>Usage: {percent}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {selectedUtilization.categories.length === 0 && (
                    <div className="md:col-span-2 py-8 text-center text-slate-400 border border-dashed border-slate-150 dark:border-slate-805 rounded-3xl">
                      No categories tracked. Configure allocations to start.
                    </div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-12 bg-white/30 dark:bg-slate-900/10 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800/50 mt-4 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-slate-105 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <HandCoins className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Select a month to begin</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm">Use the horizontal timeline above or toggle the Master Template to review limit allocations and spent metrics.</p>
            </div>
          )}
        </div>

        {/* Upcoming Budgets Section */}
        {!isEditing && upcomingBudgets.length > 0 && (
          <div className="glass-card rounded-3xl p-6 sm:p-8 border-slate-200/50 dark:border-slate-800/50 shadow-xl space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-cyan-500" />
                Upcoming Budgets
              </h3>
              <p className="text-xs text-slate-505 dark:text-slate-400 mt-1">Pre-configured budgets for future periods.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingBudgets.map(b => {
                const date = new Date(b.year!, b.month! - 1, 1);
                const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                return (
                  <div key={b.id} className="p-5 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/40 dark:bg-slate-900/40 hover:bg-white/60 dark:hover:bg-slate-900/60 transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/5">
                            {monthName}
                          </span>
                          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1.5 truncate" title={b.name}>{b.name}</h4>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEdit(b)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/5 dark:hover:bg-cyan-500/10 transition-all"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => b.id && handleDelete(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/5 dark:hover:bg-rose-500/10 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/50 dark:border-slate-800/50 grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Total Cap</p>
                          <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">₹{(b.total_amount || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Savings Plan</p>
                          <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-450">₹{(b.estimated_savings || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {b.allocations && b.allocations.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">{b.allocations.length} Category Allocations</p>
                        <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto scrollbar-none pr-1">
                          {b.allocations.map(alloc => (
                            <span key={alloc.category.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-605 dark:text-slate-350 border border-slate-205 dark:border-slate-705">
                              {alloc.category.name}: ₹{Math.round(alloc.allocated_amount).toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Budget"
        message="Are you sure you want to delete this budget version? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </div>
  );
};

export default BudgetPage;
