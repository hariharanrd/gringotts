
import React, { useState, useEffect } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  History,
  Wallet,
  Calendar,
  IndianRupee,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { CreditCard, CreditCardBill } from '../types';
import { useToast } from '../components/ToastContext';
import { useNavigate } from 'react-router-dom';

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

const CreditCards: React.FC = () => {
  const { showToast } = useToast();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  const [formData, setFormData] = useState({
    nickname: '',
    issuer: '',
    billing_date: 15,
    due_date: 5,
    credit_limit: 100000,
    threshold_percentage: 80
  });

  const fetchCards = async () => {
    setIsLoading(true);
    try {
      const res = await api.getCreditCards();
      setCards(res.data);
    } catch (error) {
      console.error("Failed to fetch credit cards:", error);
      showToast("Failed to load credit cards", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleOpenModal = (card?: CreditCard) => {
    if (card) {
      setEditingCard(card);
      setFormData({
        nickname: card.nickname,
        issuer: card.issuer,
        billing_date: card.billing_date,
        due_date: card.due_date,
        credit_limit: card.credit_limit,
        threshold_percentage: card.threshold_percentage
      });
    } else {
      setEditingCard(null);
      setFormData({
        nickname: '',
        issuer: '',
        billing_date: 15,
        due_date: 5,
        credit_limit: 100000,
        threshold_percentage: 80
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCard(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCard) {
        await api.updateCreditCard(editingCard.id!, formData);
        showToast("Credit card updated successfully", "success");
      } else {
        await api.createCreditCard(formData);
        showToast("Credit card added successfully", "success");
      }
      fetchCards();
      handleCloseModal();
    } catch (error) {
      console.error("Failed to save credit card:", error);
      showToast("Failed to save credit card", "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this credit card? All associated billing history will be permanently removed.")) return;
    try {
      await api.deleteCreditCard(id);
      showToast("Credit card deleted", "success");
      fetchCards();
    } catch (error) {
      console.error("Failed to delete credit card:", error);
      showToast("Failed to delete credit card", "error");
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
    return new Date(2000, month - 1).toLocaleString('default', { month: 'short' });
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

  const getBillStatus = (card: CreditCard) => {
    const allBills = card.bills || [];
    const today = new Date();
    today.setHours(0,0,0,0);

    // Filter for statements that have already been generated (billed)
    const billedStatements = allBills.filter(bill => {
      const statementDate = new Date(bill.billing_year, bill.billing_month - 1, card.billing_date);
      return today >= statementDate;
    });

    // Find the oldest unpaid billed statement
    const unpaidBilled = billedStatements
      .filter(b => b.payment_status !== 'PAID')
      .sort((a, b) => {
        if (a.billing_year !== b.billing_year) return a.billing_year - b.billing_year;
        return a.billing_month - b.billing_month;
      });

    if (unpaidBilled.length > 0) {
      const oldestUnpaid = unpaidBilled[0];
      
      let dueMonth = oldestUnpaid.billing_month;
      let dueYear = oldestUnpaid.billing_year;
      if (card.billing_date > card.due_date) {
        dueMonth++;
        if (dueMonth > 12) {
          dueMonth = 1;
          dueYear++;
        }
      }
      
      const dueDate = new Date(dueYear, dueMonth - 1, card.due_date);
      const isOverdue = today > dueDate;
      const unpaidAmount = oldestUnpaid.amount_due - oldestUnpaid.amount_paid;

      if (isOverdue) {
        return { label: `Overdue: ₹${unpaidAmount.toLocaleString()}`, color: 'text-rose-400', icon: AlertTriangle };
      }
      return { label: `Bill Pending: ₹${unpaidAmount.toLocaleString()}`, color: 'text-amber-400', icon: History };
    }

    if (billedStatements.length > 0 && billedStatements.every(b => b.payment_status === 'PAID')) {
      return { label: 'Last Bill Paid', color: 'text-emerald-400', icon: ShieldCheck };
    }

    return { label: `Next Bill: ${card.billing_date}${getOrdinalSuffix(card.billing_date)}`, color: 'text-white/40', icon: Calendar };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Credit Cards</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage your cards, track limits, and billing cycles.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-5 h-5" />
          Add New Card
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          ))}
        </div>
      ) : cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
            <CardIcon className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No credit cards added yet</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center">Add your first card to start tracking billing cycles and usage.</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-6 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium transition-transform hover:scale-105 active:scale-95"
          >
            Add Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.map((card, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <div
                key={card.id}
                className={`group relative flex flex-col ${theme.bg} rounded-[2.5rem] border transition-all duration-300 overflow-hidden shadow-sm hover:shadow-2xl ${card.threshold_exceeded
                  ? 'border-rose-500 shadow-rose-500/20'
                  : `${theme.border} hover:border-white/20`
                  }`}
              >
                {/* Background Textures */}
                <div className={`absolute inset-0 ${theme.pattern} opacity-100`} />
                <div className={`absolute inset-0 ${theme.overlay} opacity-100`} />

                {/* Card Design Layer */}
                <div className="p-8 pb-4 relative z-10">
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br transition-opacity duration-500 ${card.threshold_exceeded
                    ? 'from-rose-500/20 to-pink-500/10'
                    : 'from-white/10 to-transparent'
                    } rounded-full blur-3xl -mr-20 -mt-20 group-hover:opacity-100 opacity-60`} />

                  <div className="flex justify-between items-start mb-10 relative">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Issued by</span>
                      <h3 className="text-xl font-black text-white tracking-tight">{card.issuer}</h3>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenModal(card)}
                        className="p-2.5 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all backdrop-blur-md"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(card.id!)}
                        className="p-2.5 rounded-2xl bg-white/5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all backdrop-blur-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-end relative">
                    <div>
                      <h4 className="text-2xl font-bold text-white mb-1">{card.nickname}</h4>
                      {(() => {
                        const status = getBillStatus(card);
                        const StatusIcon = status.icon;
                        return (
                          <div className={`flex items-center gap-2 ${status.color} text-[11px] font-bold uppercase tracking-wider`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {status.label}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest block mb-1">Outstanding</span>
                      <span className="text-2xl font-black text-white">
                        ₹{card.total_outstanding?.toLocaleString() || '0'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="px-8 py-6 space-y-3 relative z-10">
                  <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                    <span className="text-white/40">Cycle Usage</span>
                    <span className={card.threshold_exceeded ? 'text-rose-400' : 'text-white/60'}>
                      {card.utilization_percent}% Used
                    </span>
                  </div>
                  <div className="h-2.5 bg-black/20 rounded-full overflow-hidden p-0.5 border border-white/5 backdrop-blur-md">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${card.threshold_exceeded
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                        }`}
                      style={{ width: `${Math.min(100, card.utilization_percent || 0)}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[11px] font-medium">
                    <span className="text-white/30 font-bold">₹{card.current_bill?.amount_due.toLocaleString() || '0'} / ₹{card.credit_limit.toLocaleString()}</span>
                    {card.threshold_exceeded && (
                      <div className="flex items-center gap-1 text-rose-400 font-bold animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Threshold Limit Hit</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-auto relative z-10">
                  <button
                    onClick={() => navigate(`/credit-cards/${card.id}`)}
                    className="w-full py-4 px-8 border-t border-white/5 flex items-center justify-between hover:bg-white/5 transition-colors group/btn backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-white/40">
                      <History className="w-4 h-4 transition-transform group-hover/btn:rotate-[-45deg]" />
                      Full Billing History
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/40 group-hover/btn:text-white transition-colors" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{editingCard ? 'Edit Credit Card' : 'Add New Card'}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Provide your card details for tracking.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Card Nickname</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all text-sm font-semibold text-slate-900 dark:text-white"
                    value={formData.nickname}
                    onChange={e => setFormData(p => ({ ...p, nickname: e.target.value }))}
                    placeholder="e.g. Travel Card"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Issuer / Bank</label>
                  <input
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/40 outline-none transition-all text-sm font-semibold text-slate-900 dark:text-white"
                    value={formData.issuer}
                    onChange={e => setFormData(p => ({ ...p, issuer: e.target.value }))}
                    placeholder="e.g. HDFC"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Billing Date</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-sm font-semibold text-slate-900 dark:text-white"
                    value={formData.billing_date}
                    onChange={e => setFormData(p => ({ ...p, billing_date: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}th of month</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                  <select
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-sm font-semibold text-slate-900 dark:text-white"
                    value={formData.due_date}
                    onChange={e => setFormData(p => ({ ...p, due_date: Number(e.target.value) }))}
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>{d}th of month</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Credit Limit</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">₹</span>
                  <input
                    type="number"
                    required
                    className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-cyan-500/40 outline-none text-sm font-black text-slate-900 dark:text-white"
                    value={formData.credit_limit}
                    onChange={e => setFormData(p => ({ ...p, credit_limit: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Warning Threshold</label>
                  <span className="text-sm font-black text-cyan-500">{formData.threshold_percentage}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-cyan-500"
                  value={formData.threshold_percentage}
                  onChange={e => setFormData(p => ({ ...p, threshold_percentage: Number(e.target.value) }))}
                />
                <p className="text-[10px] text-slate-400 italic text-center">We'll warn you once cycle usage crosses this percentage of your limit.</p>
              </div>

              <div className="pt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-slate-900/10 dark:shadow-white/5"
                >
                  {editingCard ? 'Update Card' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCards;
