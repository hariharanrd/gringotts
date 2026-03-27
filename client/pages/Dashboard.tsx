import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Wallet,
  Calendar,
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

const PIE_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899', '#14b8a6', '#a855f7'];

interface SummaryData {
  days: number;
  total_expenses: number;
  total_incomes: number;
  total_savings: number;
  net_balance: number;
  expense_count: number;
  income_count: number;
  saving_count: number;
  category_breakdown: Record<string, number>;
  recent_transactions: Array<{
    id: number;
    description: string;
    value: number;
    transaction_time: string;
    category?: { id: number; name: string };
    subcategory?: { id: number; name: string };
    item?: { id: number; name: string };
  }>;
}

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.getSummary(30);
        setSummary(data);
      } catch (err) {
        console.error('Failed to fetch summary:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

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
  const pieData = Object.entries(summary.category_breakdown)
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

  return (
    <div className="space-y-8">
      {/* Period badge */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
        <Calendar className="w-4 h-4" />
        <span className="text-sm font-medium">Last {summary.days} days summary</span>
        <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
        <span className="text-xs text-slate-400 dark:text-slate-500">{totalCount} transactions</span>
      </div>

      {/* ── Stat Cards ── */}
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
          icon={TrendingUp}
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
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Expense Category Bar Chart */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-6">Expense by Category</h3>
          <div className="h-[280px] w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} layout="vertical" barCategoryGap={8}>
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
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500 text-sm">No expenses in this period</div>
            )}
          </div>
        </div>

        {/* Expense Category Pie */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-4">Spending Split</h3>
          {pieData.length > 0 ? (
            <>
              <div className="h-[170px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={72}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value: number) => fmt(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-slate-600 dark:text-slate-300 truncate">{entry.name}</span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-medium ml-3 flex-shrink-0">{fmt(entry.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[170px] text-slate-400 dark:text-slate-500 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* ── Recent Transactions ── */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-5">Recent Transactions</h3>
        <div className="space-y-2">
          {summary.recent_transactions.map(t => (
            <div key={t.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/25 transition-colors">
              <div className="flex items-center gap-3 min-w-0">
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
            <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No transactions in the last {summary.days} days</p>
          )}
        </div>
      </div>
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
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, accentFrom, accentTo, glow, count, highlight }) => (
  <div className={`glass-card rounded-2xl p-5 group hover:border-slate-300 dark:hover:border-slate-600/30 transition-all duration-300 ${glow}`}>
    <div className="flex items-center justify-between mb-3">
      <div className={`bg-gradient-to-br ${accentFrom} ${accentTo} p-2 rounded-xl shadow-lg ${glow} transition-transform group-hover:scale-110 duration-300`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      {count !== undefined && (
        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">{count} txn{count !== 1 ? 's' : ''}</span>
      )}
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">{label}</p>
    <p className={`text-xl font-bold mt-1 ${highlight || 'text-slate-900 dark:text-white'}`}>{value}</p>
  </div>
);

export default Dashboard;
