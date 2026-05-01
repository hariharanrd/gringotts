
import React, { useState, useEffect } from 'react';
import {
  CreditCard as CardIcon,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  History,
  Calendar,
  ShieldCheck,
  ExternalLink,
  Maximize2,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { CreditCard } from '../types';
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
                className={`group relative flex flex-col ${theme.bg} rounded-[2.5rem] border transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 hover:scale-[1.01] ${card.threshold_exceeded || card.smart_status?.type === 'overdue'
                  ? 'border-rose-500 shadow-rose-500/20'
                  : `${theme.border} hover:border-white/20`
                  }`}
              >
                {/* Background Textures */}
                <div className={`absolute inset-0 ${theme.pattern} opacity-100`} />
                <div className={`absolute inset-0 ${theme.overlay} opacity-100`} />

                {/* Card Header */}
                <div className="p-7 pb-5 relative z-10">
                  <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br transition-opacity duration-500 ${card.threshold_exceeded
                    ? 'from-rose-500/20 to-pink-500/10'
                    : 'from-white/10 to-transparent'
                    } rounded-full blur-3xl -mr-20 -mt-20 group-hover:opacity-100 opacity-60`} />
                  <div className="flex justify-between items-start relative">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-[0.25em] block">{card.issuer}</span>
                      <h3 className="text-2xl font-black text-white tracking-tight">{card.nickname}</h3>
                    </div>
                    <div className="flex items-center">
                      <button
                        onClick={() => navigate(`/credit-cards/${card.id}`)}
                        className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 group/expand shadow-lg shadow-black/20"
                        title="Open detailed view"
                      >
                        <Maximize2 className="w-5 h-5 transition-transform group-hover/expand:scale-110" />
                        <span className="text-xs font-black uppercase tracking-widest opacity-70 group-hover/expand:opacity-100">Details</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Action Banner — the #1 thing users need to see */}
                {(() => {
                  const status = card.smart_status;
                  if (!status) return null;

                  const ordinalSuffix = (day: number) => {
                    if (day > 3 && day < 21) return 'th';
                    switch (day % 10) {
                      case 1: return 'st';
                      case 2: return 'nd';
                      case 3: return 'rd';
                      default: return 'th';
                    }
                  };

                  const bannerConfig = {
                    overdue: {
                      bg: 'bg-rose-500',
                      ring: 'ring-2 ring-rose-400/60',
                      textColor: 'text-white',
                      subColor: 'text-rose-100',
                      icon: AlertTriangle,
                      pulse: true,
                    },
                    pending: {
                      bg: 'bg-amber-500/20 border border-amber-500/40',
                      ring: '',
                      textColor: 'text-amber-300',
                      subColor: 'text-amber-300/70',
                      icon: History,
                      pulse: false,
                    },
                    paid: {
                      bg: 'bg-emerald-500/10 border border-emerald-500/20',
                      ring: '',
                      textColor: 'text-emerald-400',
                      subColor: 'text-emerald-400/60',
                      icon: ShieldCheck,
                      pulse: false,
                    },
                    next: {
                      bg: 'bg-white/5 border border-white/10',
                      ring: '',
                      textColor: 'text-white/50',
                      subColor: 'text-white/30',
                      icon: Calendar,
                      pulse: false,
                    },
                  };

                  const cfg = bannerConfig[status.type] ?? bannerConfig.next;
                  const BannerIcon = cfg.icon;

                  const amountStr = status.amount
                    ? `₹${status.amount.toLocaleString('en-IN')}`
                    : status.date
                      ? `${status.date}${ordinalSuffix(status.date)}`
                      : null;

                  return (
                    <div className={`mx-5 mb-4 px-5 py-4 rounded-2xl ${cfg.bg} ${cfg.ring} relative z-10 ${cfg.pulse ? 'animate-pulse' : ''}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 p-2 rounded-xl ${status.type === 'overdue' ? 'bg-white/20' : 'bg-white/5'}`}>
                            <BannerIcon className={`w-5 h-5 ${cfg.textColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[11px] font-black uppercase tracking-widest ${cfg.subColor}`}>
                              {status.type === 'overdue' ? 'Action Required' : status.type === 'pending' ? 'Bill Due' : status.type === 'paid' ? 'Bill Status' : 'Next Billing'}
                            </p>
                            <p className={`text-sm font-black ${cfg.textColor} leading-tight`}>
                              {status.label}
                            </p>
                          </div>
                        </div>
                        {amountStr && (
                          <div className="text-right shrink-0">
                            <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.subColor}`}>
                              {status.amount ? 'Amount Due' : 'On'}
                            </p>
                            <p className={`text-xl font-black tabular-nums ${cfg.textColor}`}>
                              {amountStr}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Stats Row */}
                <div className="px-8 pb-5 relative z-10">
                  <div className="flex justify-between items-end gap-4">
                    {/* Outstanding */}
                    <div>
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-0.5">Total Outstanding</span>
                      <span className={`text-lg font-black tabular-nums ${(card.total_outstanding ?? 0) > 0 ? 'text-white' : 'text-white/30'}`}>
                        ₹{card.total_outstanding?.toLocaleString('en-IN') || '0'}
                      </span>
                    </div>
                    {/* Limit info */}
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-widest block mb-0.5">Limit</span>
                      <span className="text-lg font-black text-white/60 tabular-nums">₹{card.credit_limit.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="px-8 pb-6 space-y-2 relative z-10">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                    <span className="text-white/30">Cycle Usage</span>
                    <span className={card.threshold_exceeded ? 'text-rose-400' : 'text-white/40'}>
                      {card.utilization_percent}%
                      {card.threshold_exceeded && ' · ⚠ Limit Breached'}
                    </span>
                  </div>
                  <div className="h-2 bg-black/20 rounded-full overflow-hidden border border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${card.threshold_exceeded
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        }`}
                      style={{ width: `${Math.min(100, card.utilization_percent || 0)}%` }}
                    />
                  </div>
                  {/* Card Management Bar - subtle and at the bottom */}
                  <div className="mt-auto relative z-10 border-t border-white/5 bg-black/10 flex justify-end p-3 px-6 gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenModal(card)}
                      className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Edit Card</span>
                    </button>
                    <button
                      onClick={() => handleDelete(card.id!)}
                      className="p-2 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-500/10 transition-all flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Delete</span>
                    </button>
                  </div>
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
                  <div className="flex items-center gap-1.5 ml-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billing Date</label>
                    <div className="relative group/tooltip">
                      <Info className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 cursor-help transition-colors hover:text-cyan-500" />
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-56 p-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] leading-relaxed rounded-2xl opacity-0 group-hover/tooltip:opacity-100 transition-all pointer-events-none z-[70] shadow-2xl border border-white/10 dark:border-slate-200 translate-y-2 group-hover/tooltip:translate-y-0">
                        <p className="font-black mb-1 text-cyan-400 dark:text-cyan-600 uppercase tracking-tighter">How cycles are calculated</p>
                        Cycle starts on the selected billing date and ends on the day before the next billing date.
                      </div>
                    </div>
                  </div>
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
