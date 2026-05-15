
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  History,
  Wallet,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  PieChart as PieChartIcon,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid
} from 'recharts';
import { api } from '../services/api';
import { CreditCard, CreditCardBill } from '../types';
import { useToast } from '../components/ToastContext';


const CARD_THEMES = [
  {
    bg: 'bg-slate-900',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")]',
    overlay: 'bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,0.15),transparent_50%)]',
    accent: 'text-cyan-400',
    border: 'border-slate-800'
  },
  {
    bg: 'bg-indigo-950',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.03\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")]',
    overlay: 'bg-[radial-gradient(circle_at_0%_0%,rgba(129,140,248,0.2),transparent_40%)]',
    accent: 'text-indigo-400',
    border: 'border-indigo-900/50'
  },
  {
    bg: 'bg-emerald-950',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 40 L40 0 L41 1 L1 41 Z\' fill=\'%23ffffff\' fill-opacity=\'0.02\'/%3E%3C/svg%3E")]',
    overlay: 'bg-[linear-gradient(135deg,rgba(16,185,129,0.1)_0%,transparent_100%)]',
    accent: 'text-emerald-400',
    border: 'border-emerald-900/50'
  },
  {
    bg: 'bg-rose-950',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 86c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm76-26c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1zM8 16c.552 0 1-.448 1-1s-.448-1-1-1-1 .448-1 1 .448 1 1 1z\' fill=\'%23ffffff\' fill-opacity=\'0.04\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]',
    overlay: 'bg-[radial-gradient(ellipse_at_bottom_right,rgba(244,63,94,0.15),transparent_50%)]',
    accent: 'text-rose-400',
    border: 'border-rose-900/50'
  },
  {
    bg: 'bg-blue-950',
    pattern: 'bg-[url("data:image/svg+xml,%3Csvg width=\'100\' height=\'20\' viewBox=\'0 0 100 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M21.184 20c.35.13.72.2 1.095.2 1.24 0 2.25-1.01 2.25-2.25 0-1.24-1.01-2.25-2.25-2.25-.375 0-.745.07-1.095.2L15.007 20h6.177zM0 15h3.007l5.082-5.082h6.918L20.007 15H23v5h-3.007l-5.082-5.082H7.993L2.91 20H0v-5z\' fill=\'%23ffffff\' fill-opacity=\'0.02\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")]',
    overlay: 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.1),transparent_40%)]',
    accent: 'text-blue-400',
    border: 'border-blue-900/50'
  }
];

const PIE_COLORS = ['#06b6d4', '#10b981', '#8b5cf6', '#f43f5e', '#f59e0b', '#ec4899', '#14b8a6', '#a855f7'];

const CategorySpendingChart: React.FC<{ data: { name: string; value: number }[] }> = ({ data }) => {
  if (!data || data.length === 0) return null;

  return (
    <div className="h-[200px] w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/50">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Spending Breakdown</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: -20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.1)" />
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
            width={100}
          />
          <Tooltip
            cursor={{ fill: 'rgba(148,163,184,0.05)' }}
            contentStyle={{
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'rgba(15,23,42,0.9)',
              boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
              padding: '8px 12px'
            }}
            itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 900 }}
            labelStyle={{ display: 'none' }}
            formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Spent']}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const CreditCardDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [card, setCard] = useState<CreditCard | null>(null);
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isResyncing, setIsResyncing] = useState(false);
  const [settleAmounts, setSettleAmounts] = useState<Record<number, string>>({});

  const fetchCardDetails = async () => {
    setIsLoading(true);
    try {
      if (!id) return;
      const res = await api.getCreditCardById(Number(id));
      setCard(res);
      setBills(res.bills || []);
    } catch (error) {
      console.error("Failed to fetch card details:", error);
      showToast("Failed to load credit card details", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCardDetails();
  }, [id]);

  const handleUpdatePayment = async (billId: number, amountPaid: number) => {
    try {
      await api.updateBillPayment(billId, amountPaid);
      showToast("Payment status updated", "success");
      setSettleAmounts(prev => {
        const next = { ...prev };
        delete next[billId];
        return next;
      });
      fetchCardDetails();
    } catch (error) {
      console.error("Failed to update payment:", error);
      showToast("Failed to update payment", "error");
    }
  };
  
  const handleResync = async () => {
    if (!id) return;
    setIsResyncing(true);
    try {
      await api.resyncCreditCardBills(Number(id));
      showToast("Bills resynced successfully", "success");
      fetchCardDetails();
    } catch (error) {
      console.error("Failed to resync bills:", error);
      showToast("Failed to resync bills", "error");
    } finally {
      setIsResyncing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'PARTIALLY_PAID': return 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'UNPAID': return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
      default: return 'bg-slate-500/10 text-slate-600 dark:text-slate-400';
    }
  };

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1).toLocaleString('default', { month: 'long' });
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getStatusConfig = (type: string) => {
    switch (type) {
      case 'overdue': return { color: 'text-rose-500', icon: AlertTriangle };
      case 'pending': return { color: 'text-amber-500', icon: History };
      case 'paid': return { color: 'text-emerald-400', icon: ShieldCheck };
      case 'next': return { color: 'text-white/40', icon: Calendar };
      default: return { color: 'text-white/40', icon: Calendar };
    }
  };

  const getCycleDates = (bill: CreditCardBill, billingDate: number) => {
    const end = new Date(bill.billing_year, bill.billing_month - 1, billingDate);
    const start = new Date(bill.billing_year, bill.billing_month - 2, billingDate + 1);

    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return { start: formatDate(start), end: formatDate(end) };
  };

  const handleViewTransactions = (bill: CreditCardBill) => {
    const { start, end } = getCycleDates(bill, card!.billing_date);
    const filters = [
      { field: 'transaction_time', condition: 'ge', value: start },
      { field: 'transaction_time', condition: 'le', value: end },
      { field: 'payment_mode', condition: 'eq', value: 'CREDIT_CARD' },
      { field: 'credit_card.id', condition: 'eq', value: card!.id!.toString(), label: card!.nickname }
    ];
    const filtersJson = encodeURIComponent(JSON.stringify(filters));
    navigate(`/transactions?type=all&filters=${filtersJson}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-[2.5rem] animate-pulse" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Card not found</h3>
        <button onClick={() => navigate('/credit-cards')} className="mt-4 text-cyan-500 font-semibold flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Back to Cards
        </button>
      </div>
    );
  }

  const theme = CARD_THEMES[Number(id) % CARD_THEMES.length];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      {/* Actions Row */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/credit-cards')}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-tight uppercase">Back to Cards</span>
        </button>
      </div>

      {/* Premium Hero Card */}
      <div className={`relative overflow-hidden rounded-[2rem] ${theme.bg} border ${card.threshold_exceeded ? 'border-rose-500' : theme.border} shadow-lg`}>
        <div className={`absolute inset-0 ${theme.pattern} opacity-100`} />
        <div className={`absolute inset-0 ${theme.overlay} opacity-100`} />

        <div className="relative z-10 p-8 md:p-10 space-y-8">
          {/* Status Row */}
          <div className="flex items-center justify-end gap-2">
            <span className="px-2.5 py-1 bg-white/10 backdrop-blur-md rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10">
              Bill: {card.billing_date}{getOrdinalSuffix(card.billing_date)}
            </span>
            <div className="flex items-center gap-3">
              <div className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full shadow-sm flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-cyan-500/10 flex items-center justify-center">
                  <Wallet className="w-2 h-2 text-cyan-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</span>
                  <span className="text-xs font-black text-slate-900 dark:text-white tabular-nums">₹{card.total_outstanding?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-8 md:items-center">
            <div className="flex-1 space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] leading-none block">{card.issuer}</span>
                <h2 className="text-4xl font-black text-white tracking-tighter">{card.nickname}</h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Limit</span>
                  <div className="text-lg font-black text-white">₹{card.credit_limit.toLocaleString()}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Available</span>
                  <div className="text-lg font-black text-white">₹{(card.credit_limit - (card.total_outstanding || 0)).toLocaleString()}</div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block">Status</span>
                  {(() => {
                    const status = card.smart_status;
                    if (!status) return null;
                    const config = getStatusConfig(status.type);
                    const StatusIcon = config.icon;
                    return (
                      <div className="flex flex-col items-start gap-1.5">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${status.type === 'overdue' ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' : status.type === 'pending' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : config.color} text-sm font-black transition-all`}>
                          <StatusIcon className={`w-3.5 h-3.5 ${status.type === 'overdue' || status.type === 'pending' ? 'text-white' : ''}`} />
                          {status.label}
                          {status.amount ? `: ₹${status.amount.toLocaleString()}` : status.date ? `: ${status.date}${getOrdinalSuffix(status.date)}` : ''}
                        </div>
                        {status.due_date && (
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">
                            Due: {new Date(status.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            <div className="w-full md:w-72 p-6 rounded-[2rem] bg-black/20 backdrop-blur-3xl border border-white/5 shadow-inner">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Usage</span>
                <span className={`text-base font-black ${card.threshold_exceeded ? 'text-rose-400' : 'text-cyan-400'}`}>{card.utilization_percent}%</span>
              </div>
              <div className="h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/5 mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${card.threshold_exceeded ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-cyan-400 to-blue-500'}`}
                  style={{ width: `${Math.min(100, card.utilization_percent || 0)}%` }}
                />
              </div>
              <p className="text-[9px] text-white/30 font-medium text-center leading-relaxed">
                {card.threshold_exceeded
                  ? "Crossing safety threshold."
                  : `Secure & within limits.`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
              <History className="w-5 h-5 text-slate-500" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Full Billing History</h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleResync}
              disabled={isResyncing}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest transition-all ${isResyncing ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95'}`}
            >
              <RefreshCw className={`w-3 h-3 ${isResyncing ? 'animate-spin' : ''}`} />
              {isResyncing ? 'Resyncing...' : 'Resync History'}
            </button>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {bills.length} Statements Found
            </div>
          </div>
        </div>

        <div>
          {bills.length === 0 ? (
            <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
              <Clock className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
              <h4 className="text-lg font-bold text-slate-900 dark:text-white">No Billing Records</h4>
              <p className="text-slate-500 dark:text-slate-400 mt-1">Transactions will appear here once a billing cycle is completed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {bills.map((bill, index) => {
                const isUnbilled = index === 0 && card.current_bill?.id === bill.id;
                const unpaidAmount = bill.amount_due - bill.amount_paid;

                // Calculate overdue status for this specific bill
                let dueMonth = bill.billing_month;
                let dueYear = bill.billing_year;
                if (card.billing_date > card.due_date) {
                  dueMonth++;
                  if (dueMonth > 12) {
                    dueMonth = 1;
                    dueYear++;
                  }
                }
                const dueDate = new Date(dueYear, dueMonth - 1, card.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isOverdue = today > dueDate && bill.payment_status !== 'PAID' && !isUnbilled;

                return (
                  <div
                    key={bill.id}
                    className={`group relative bg-white dark:bg-slate-900 rounded-[2rem] border transition-all duration-300 ${isOverdue
                      ? 'border-rose-500 ring-2 ring-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)] animate-pulse-subtle'
                      : isUnbilled
                        ? 'border-slate-200 dark:border-slate-800'
                        : 'border-cyan-500/30 ring-1 ring-cyan-500/10 shadow-lg'
                      }`}
                  >
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center gap-8">
                      {/* Month Indicator */}
                      <div className="flex items-center gap-4 min-w-[200px]">
                        <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center ${isUnbilled ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-cyan-500 text-white'}`}>
                          <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">{bill.billing_year}</span>
                          <span className="text-lg font-black leading-none">{getMonthName(bill.billing_month).substring(0, 3)}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{getMonthName(bill.billing_month)}</h4>
                            {isUnbilled ? (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">Unbilled</span>
                            ) : (
                              bill.payment_status !== 'PAID' && (
                                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 text-[9px] font-black uppercase tracking-widest">Active Statement</span>
                              )
                            )}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest inline-block ${getStatusColor(bill.payment_status)}`}>
                              {bill.payment_status.replace('_', ' ')}
                            </span>
                            <button
                              onClick={() => handleViewTransactions(bill)}
                              className="flex items-center gap-1.5 text-[9px] font-black text-cyan-600 hover:text-cyan-700 uppercase tracking-widest transition-colors group/link"
                            >
                              <span>View Transactions</span>
                              <ExternalLink className="w-2.5 h-2.5 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Stats Section */}
                      <div className="flex-1 flex flex-wrap items-center gap-x-10 gap-y-6 md:pl-8 md:border-l border-slate-100 dark:border-slate-800">
                        <div className="min-w-[100px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Bill Amount</span>
                          <span className="text-base font-black text-slate-900 dark:text-white">₹{bill.amount_due.toLocaleString()}</span>
                        </div>
                        <div className="min-w-[80px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Paid</span>
                          <span className="text-base font-black text-emerald-500">₹{bill.amount_paid.toLocaleString()}</span>
                        </div>
                        <div className="min-w-[100px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Outstanding</span>
                          <span className={`text-base font-black ${unpaidAmount > 0 ? 'text-rose-500' : 'text-slate-400'}`}>₹{unpaidAmount.toLocaleString()}</span>
                        </div>
                        <div className="min-w-[100px]">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Status</span>
                          <div className="flex items-center gap-2 mt-1">
                            {bill.payment_status === 'PAID' ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : isOverdue ? (
                              <AlertTriangle className="w-4 h-4 text-rose-500" />
                            ) : (
                              <Clock className="w-4 h-4 text-amber-500" />
                            )}
                            <span className={`text-xs font-bold ${bill.payment_status === 'PAID' ? 'text-emerald-500' : isOverdue ? 'text-rose-500' : 'text-amber-500'}`}>
                              {bill.payment_status === 'PAID' ? 'Settled' : isOverdue ? 'Overdue' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 min-w-[220px]">
                        {bill.payment_status !== 'PAID' && !isUnbilled ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">₹</span>
                                <input
                                  type="number"
                                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-cyan-500/40 outline-none transition-all"
                                  placeholder="Amount"
                                  value={settleAmounts[bill.id!] || ''}
                                  onChange={(e) => setSettleAmounts(prev => ({ ...prev, [bill.id!]: e.target.value }))}
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const val = Number(settleAmounts[bill.id!]);
                                  if (val > 0) handleUpdatePayment(bill.id!, val);
                                  else showToast("Enter a valid amount", 'warning');
                                }}
                                className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black rounded-xl transition-all shadow-lg shadow-cyan-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!settleAmounts[bill.id!]}
                              >
                                Settle
                              </button>
                            </div>
                            <button
                              onClick={() => handleUpdatePayment(bill.id!, bill.amount_due)}
                              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black rounded-xl transition-all hover:opacity-90 active:scale-[0.98] shadow-md border border-slate-200 dark:border-slate-700"
                            >
                              Full Settle (₹{bill.amount_due.toLocaleString()})
                            </button>
                          </div>
                        ) : isUnbilled ? (
                          <div className="px-6 py-5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Next Statement</span>
                            <span className="text-[9px] font-medium text-slate-400 leading-tight">Cycle active. Bill not generated yet.</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 px-6 py-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Fully Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart Section */}
                    {bill.category_spending && bill.category_spending.length > 0 && (
                      <div className="px-6 md:px-8 pb-8">
                        <CategorySpendingChart data={bill.category_spending} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="pt-10 flex justify-center">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-6 py-3 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-3 h-3" />
            Statements are automatically generated based on billing date
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCardDetails;
