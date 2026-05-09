import React, { useEffect, useState } from 'react';
import { personalizationSync } from '../services/personalizationSync';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  Calendar,
  Target,
  PiggyBank,
  HeartHandshake,
  CircleDollarSign,
  ChevronDown,
  Info
} from 'lucide-react';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { api } from '../services/api';
import { TransactionType } from '../types';
import { useTheme } from '../components/ThemeContext';
import { DashboardSkeleton } from '../components/Skeleton';
import { BudgetUtilization, TimeRange } from '../types';
import { useNavigate } from 'react-router-dom';
import CategoryIcon from '../components/CategoryIcon';


const PIE_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899', '#14b8a6', '#a855f7'];

interface SummaryData {
  range: string;
  start_date: string;
  end_date: string;
  total_expenses: number;
  total_incomes: number;
  total_savings: number;
  net_balance: number;
  expense_count: number;
  income_count: number;
  saving_count: number;
  total_i_owe: number;
  total_others_owe_me: number;
  category_breakdown: Record<string, number>;
  savings_breakdown: Record<string, number>;
  recent_transactions: Array<{
    id: number;
    description: string;
    value: number;
    transaction_time: string;
    category?: { id: number; name: string; icon?: string; color?: string };
    subcategory?: { id: number; name: string };
    item?: { id: number; name: string };
  }>;
  credit_card_bills: {
    overdue_amount: number;
    pending_amount: number;
    overdue_count: number;
    pending_count: number;
  };
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [budgetUtil, setBudgetUtil] = useState<BudgetUtilization | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  // Fetch full categories list for dashboard charts so they have icons
  const [categories, setCategories] = useState<any[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [range, setRange] = useState<TimeRange>(() => {
    const saved = localStorage.getItem('dashboard_range');
    return (saved as TimeRange) || TimeRange.LAST_30_DAYS;
  });

  const fetchSummary = async (selectedRange: TimeRange) => {
    try {
      const summaryData = await api.getSummary(selectedRange);
      setSummary(summaryData);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      setError('Failed to load summary data');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryData, budgetData, categoriesData] = await Promise.all([
          api.getSummary(range),
          api.getActiveBudgetUtilization().catch(() => null),
          api.getCategories()
        ]);
        setSummary(summaryData);
        setBudgetUtil(budgetData);
        setCategories(categoriesData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();

  }, []);

  const handleRangeChange = async (newRange: TimeRange) => {
    setRange(newRange);
    localStorage.setItem('dashboard_range', newRange);
    personalizationSync.save('FILTERS', 'DASHBOARD_RANGE', newRange);
    setSummaryLoading(true);
    await fetchSummary(newRange);
    setSummaryLoading(false);
  };

  const getRangeLabel = (r: TimeRange) => {
    switch (r) {
      case TimeRange.LAST_WEEK: return 'Last Week';
      case TimeRange.LAST_30_DAYS: return 'Last 30 Days';
      case TimeRange.LAST_90_DAYS: return 'Last 90 Days';
      case TimeRange.THIS_MONTH: return 'This Month';
      case TimeRange.PREVIOUS_MONTH: return 'Previous Month';
      case TimeRange.THIS_YEAR: return 'This Year';
      case TimeRange.LAST_YEAR: return 'Last Year';
      default: return r;
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-500 dark:text-slate-400">{error || 'No data available'}</p>
      </div>
    );
  }

  // --- Derived data for charts ---
  const expenseData = Object.entries(summary.category_breakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const savingData = Object.entries(summary.savings_breakdown)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const totalCount = summary.expense_count + summary.income_count + summary.saving_count;

  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString('en-IN')}`;

  const tooltipStyle = {
    borderRadius: '12px',
    border: theme === 'dark' ? '1px solid rgba(148,163,184,0.12)' : '1px solid rgba(148,163,184,0.25)',
    backgroundColor: theme === 'dark' ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.95)',
    color: theme === 'dark' ? '#e2e8f0' : '#1e293b',
    fontSize: 12,
  };

  // Group categories for Budget Utilization Widget
  const getGroupedCategories = () => {
    if (!budgetUtil || !budgetUtil.categories) return { expenses: [], revolvings: [], savings: [] };
    return {
      expenses: budgetUtil.categories.filter(c => c.category.type === 'EXPENSE'),
      revolvings: budgetUtil.categories.filter(c => c.category.type === 'REVOLVING'),
      savings: budgetUtil.categories.filter(c => c.category.type === 'SAVING'),
    };
  };

  const groupedCategories = getGroupedCategories();

  const CategorySection = ({ title, categories }: { title: string, categories: any[] }) => {
    if (categories.length === 0) return null;
    return (
      <div className="space-y-4 mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/50 dark:border-slate-700/50 pb-2">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-6">
          {categories.map(cat => {
            const isOverBudget = cat.percent_used > 100 || (cat.spent > 0 && cat.allocated === 0);
            return (
              <div key={cat.category.id} className="space-y-2 group">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon category={cat.category} className="w-3 h-3" />
                    <span className="text-slate-500 dark:text-slate-400 group-hover:text-cyan-500 transition-colors uppercase tracking-tight">{cat.category.name}</span>
                  </div>
                  <span className={`${isOverBudget ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>₹{cat.spent.toLocaleString()} <span className="text-slate-400 font-medium">/ ₹{cat.allocated.toLocaleString()}</span></span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isOverBudget ? 'bg-rose-500' :
                      cat.percent_used > 80 ? 'bg-amber-500' : 'bg-cyan-500'
                      }`}
                    style={{ width: `${cat.allocated === 0 && cat.spent > 0 ? 100 : Math.min(cat.percent_used, 100)}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10">
      {/* ── SECTION: Overview & Current Status ── */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="w-1.5 h-6 bg-cyan-500 rounded-full" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Status Overview</h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Active Budget Utilization Widget */}
          <div className="xl:col-span-2 glass-card rounded-3xl p-6 border-cyan-500/10 shadow-xl shadow-cyan-500/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />

            <div className="flex items-center justify-between mb-6 relative">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 rounded-xl">
                  <Target className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Active Budget Utilization</h3>
                  <p className="text-xs text-slate-500 font-medium">
                    {budgetUtil ? `${new Date(2000, budgetUtil.period_month - 1).toLocaleString('default', { month: 'long' })} ${budgetUtil.period_year}` : 'No active budget set'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/budget')}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 underline underline-offset-4 decoration-cyan-500/30"
              >
                Manage Budgets
              </button>
            </div>

            {budgetUtil ? (
              <div className="space-y-8 relative">
                {/* Overall Progress */}
                <div className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Spend vs Limit</span>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${budgetUtil.overall?.percent_used > 100 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>₹{budgetUtil.overall?.spent.toLocaleString()}</span>
                        <span className="text-sm font-medium text-slate-400">/ ₹{budgetUtil.overall?.allocated?.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className={`text-sm font-black ${budgetUtil.overall?.percent_used > 100 ? 'text-rose-500' :
                      budgetUtil.overall?.percent_used > 90 ? 'text-rose-500' :
                        budgetUtil.overall?.percent_used > 75 ? 'text-amber-500' : 'text-emerald-500'
                      }`}>
                      {budgetUtil.overall?.percent_used}%
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-200/50 dark:border-slate-700/50">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${budgetUtil.overall?.percent_used > 100 ? 'bg-rose-500' :
                        budgetUtil.overall?.percent_used > 90 ? 'bg-rose-500' :
                          budgetUtil.overall?.percent_used > 75 ? 'bg-amber-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                        }`}
                      style={{ width: `${Math.min(budgetUtil.overall?.percent_used, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Category Breakdown by Groups */}
                <div className="mt-8">
                  <CategorySection title="Expenses" categories={groupedCategories.expenses} />
                  <CategorySection title="Revolvings" categories={groupedCategories.revolvings} />
                  <CategorySection title="Savings" categories={groupedCategories.savings} />

                  {budgetUtil.categories?.length === 0 && (
                    <p className="text-center py-4 text-xs text-slate-400 italic">No category allocations defined for this budget</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400 font-medium mb-4 text-center max-w-xs">You haven't set up a budget for this month yet. Tracking your spend starts here.</p>
                <button
                  onClick={() => navigate('/budget')}
                  className="px-6 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                >
                  Set Monthly Goal
                </button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* ── Outstanding Balances ── */}
            <div className="space-y-4">
              <StatCard
                label="To Pay (I Owe Others)"
                value={fmt(summary.total_i_owe)}
                icon={HeartHandshake}
                accentFrom="from-slate-600"
                accentTo="to-slate-800"
                glow="shadow-slate-500/10"
                highlight="text-rose-500 dark:text-rose-400"
              />
              <StatCard
                label="To Collect (Others Owe Me)"
                value={fmt(summary.total_others_owe_me)}
                icon={CircleDollarSign}
                accentFrom="from-amber-500"
                accentTo="to-orange-600"
                glow="shadow-amber-500/15"
                highlight="text-emerald-500 dark:text-emerald-400"
              />
            </div>

            {/* ── Credit Card Bills Alerts ── */}
            {summary.credit_card_bills && (summary.credit_card_bills.overdue_count > 0 || summary.credit_card_bills.pending_count > 0) && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                {summary.credit_card_bills.overdue_count > 0 && (
                  <div
                    onClick={() => navigate('/credit-cards')}
                    className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-500/10 dark:to-slate-800/50 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-5 flex items-center justify-between group cursor-pointer hover:shadow-xl hover:shadow-rose-500/5 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-rose-500 p-2 rounded-xl shadow-lg shadow-rose-500/30 group-hover:scale-110 transition-transform">
                        <Info className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-0.5">Overdue Bills</h4>
                        <p className="text-lg font-black text-slate-900 dark:text-white">₹{summary.credit_card_bills.overdue_amount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}
                {summary.credit_card_bills.pending_count > 0 && (
                  <div
                    onClick={() => navigate('/credit-cards')}
                    className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-500/10 dark:to-slate-800/50 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 flex items-center justify-between group cursor-pointer hover:shadow-xl hover:shadow-amber-500/5 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-amber-500 p-2 rounded-xl shadow-lg shadow-amber-500/30 group-hover:scale-110 transition-transform">
                        <Calendar className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">Pending Bills</h4>
                        <p className="text-lg font-black text-slate-900 dark:text-white">₹{summary.credit_card_bills.pending_amount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION: Financial Activity (Range Dependent) ── */}
      <section className={`space-y-6 pt-6 transition-all duration-300 ${summaryLoading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-violet-500 rounded-full" />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Financial Activity</h2>
                {summaryLoading && (
                  <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-500 dark:text-slate-400">
                <Calendar className="w-3.5 h-3.5" />
                <span className="text-[11px] font-bold uppercase tracking-wider">{getRangeLabel(range)} • {totalCount} transactions</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <label htmlFor="range-selector" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">View Range:</label>
            <div className="relative">
              <select
                id="range-selector"
                value={range}
                onChange={(e) => handleRangeChange(e.target.value as TimeRange)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-8 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all appearance-none cursor-pointer shadow-sm hover:border-slate-300 dark:hover:border-slate-600"
              >
                {Object.values(TimeRange).map((r) => (
                  <option key={r} value={r}>{getRangeLabel(r)}</option>
                ))}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Incomes"
            value={fmt(summary.total_incomes)}
            icon={ArrowUpRight}
            accentFrom="from-emerald-500"
            accentTo="to-teal-600"
            glow="shadow-emerald-500/15"
            count={summary.income_count}
          />
          <StatCard
            label="Total Expenses"
            value={fmt(summary.total_expenses)}
            icon={ArrowDownRight}
            accentFrom="from-rose-500"
            accentTo="to-pink-600"
            glow="shadow-rose-500/15"
            count={summary.expense_count}
          />
          <StatCard
            label="Total Savings"
            value={fmt(summary.total_savings)}
            icon={PiggyBank}
            accentFrom="from-violet-500"
            accentTo="to-purple-600"
            glow="shadow-violet-500/15"
            count={summary.saving_count}
          />
          <StatCard
            label="Net Balance"
            value={`${summary.net_balance >= 0 ? '+' : '-'}${fmt(summary.net_balance)}`}
            icon={Wallet}
            accentFrom="from-cyan-500"
            accentTo="to-blue-600"
            glow="shadow-cyan-500/15"
            highlight={summary.net_balance >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}
            info="Net balance = Total Incomes - Total Expenses - Total Savings"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expense Category Bar Chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Expense by Category</h3>
            <div className="h-[280px] w-full">
              {expenseData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={expenseData} layout="vertical" barCategoryGap={8}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.15)'} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#475569', fontSize: 12 }}
                      width={120}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => fmt(value)}
                      cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.04)' : 'rgba(148,163,184,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} name="Amount">
                      {expenseData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[240px] text-slate-400 dark:text-slate-500 text-sm">No data</div>
              )}
            </div>
          </div>

          {/* Savings Breakdown Bar Chart */}
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Savings Breakdown</h3>
            {savingData.length > 0 ? (
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme === 'dark' ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.15)'} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#64748b' : '#94a3b8', fontSize: 10 }} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={80}
                      tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => fmt(value)}
                      cursor={{ fill: theme === 'dark' ? 'rgba(148,163,184,0.04)' : 'rgba(148,163,184,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={20} name="Amount">
                      {savingData.map((entry, i) => (
                        <Cell key={i} fill={entry.value >= 0 ? PIE_COLORS[1] : PIE_COLORS[3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[240px] text-slate-400 dark:text-slate-500 text-sm">No data</div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Recent Transactions</h3>
          <div className="space-y-2">
            {summary.recent_transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/25 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <CategoryIcon category={t.category as any} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(t.transaction_time).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                      {t.category && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">{t.category.name}</span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-sm font-semibold flex-shrink-0 ml-4 text-slate-800 dark:text-slate-200">
                  {fmt(t.value)}
                </span>
              </div>
            ))}
            {summary.recent_transactions.length === 0 && (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No transactions for the selected period</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

/* ─── Stat Card ─── */
interface StatCardProps {
  label: string;
  value: string;
  icon: React.FC<{ className?: string }>;
  accentFrom: string;
  accentTo: string;
  glow: string;
  count?: number;
  highlight?: string;
  info?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, accentFrom, accentTo, glow, count, highlight, info }) => (
  <div className={`glass-card rounded-2xl p-5 group hover:border-slate-300 dark:hover:border-slate-600/30 transition-all duration-300 ${glow}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`bg-gradient-to-br ${accentFrom} ${accentTo} p-2 rounded-xl shadow-lg ${glow} transition-transform group-hover:scale-110 duration-300`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      {count !== undefined && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{count} txn{count !== 1 ? 's' : ''}</span>
      )}
    </div>
    <div className="flex items-center gap-1.5">
      <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
      {info && (
        <div className="group/info relative">
          <Info className="w-3 h-3 text-slate-400 dark:text-slate-600 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/info:block w-48 p-2.5 bg-slate-900/90 dark:bg-slate-800 backdrop-blur-md text-[10px] text-slate-200 dark:text-slate-300 rounded-xl shadow-2xl border border-slate-700/50 z-50 animate-in fade-in zoom-in-95 duration-200">
            {info}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900/90 dark:border-t-slate-800"></div>
          </div>
        </div>
      )}
    </div>
    <p className={`text-xl font-bold mt-1 ${highlight || 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);

export default Dashboard;
