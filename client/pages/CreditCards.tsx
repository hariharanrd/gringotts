
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
import ConfirmationDialog from '../components/ConfirmationDialog';

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
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

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

  const handleDeleteConfirm = async () => {
    if (deleteTarget === null) return;
    try {
      await api.deleteCreditCard(deleteTarget);
      showToast("Credit card deleted", "success");
      fetchCards();
    } catch (error) {
      console.error("Failed to delete credit card:", error);
      showToast("Failed to delete credit card", "error");
    } finally {
      setDeleteTarget(null);
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
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
            boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
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
            className="mt-6 px-6 py-2 text-white font-medium transition-transform hover:scale-105 active:scale-95 rounded-xl shadow-lg"
            style={{
              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
            }}
            onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
          >
            Add Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {cards.map((card, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            const isOverdue = card.smart_status?.type === 'overdue';
            return (
              <div
                key={card.id}
                className={`group relative flex flex-col bg-white dark:bg-slate-900 border ${isOverdue ? 'border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.15)] ring-1 ring-rose-500/20' : 'border-slate-200 dark:border-slate-800/80 shadow-sm hover:shadow-xl'} rounded-3xl p-4 gap-4 transition-all duration-300 hover:-translate-y-1`}
              >
                {/* Physical Credit Card Mockup */}
                <div
                  onClick={() => navigate(`/credit-cards/${card.id}`)}
                  className={`cursor-pointer relative aspect-[1.586] w-full rounded-2xl ${theme.bg} border ${card.threshold_exceeded ? 'border-rose-500' : theme.border} shadow-md p-5 flex flex-col justify-between overflow-hidden text-white group/card`}
                >
                  {/* Background textures */}
                  <div className={`absolute inset-0 ${theme.pattern} opacity-100`} />
                  <div className={`absolute inset-0 ${theme.overlay} opacity-100`} />
                  
                  {/* Card Content */}
                  <div className="relative z-10 flex flex-col h-full justify-between">
                    {/* Top Row: Issuer & Logo */}
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-white/70 uppercase tracking-[0.2em]">{card.issuer}</span>
                      <CardIcon className="w-5 h-5 text-white/70" />
                    </div>

                    {/* Middle Row: Chip & Contactless */}
                    <div className="flex items-center gap-3 my-2">
                      <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-600 border border-amber-600/30 flex flex-col justify-between p-1 shadow-inner">
                        <div className="flex justify-between w-full h-full opacity-60">
                          <div className="w-[30%] h-full border-r border-amber-800/30" />
                          <div className="w-[40%] h-full flex flex-col justify-between">
                            <div className="w-full h-[30%] border-b border-amber-800/30" />
                            <div className="w-full h-[30%] border-t border-amber-800/30" />
                          </div>
                          <div className="w-[30%] h-full border-l border-amber-800/30" />
                        </div>
                      </div>
                      <svg className="w-3.5 h-3.5 text-white/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10" />
                        <path d="M8.5 5a11.5 11.5 0 0 1 3 7 11.5 11.5 0 0 1-3 7" />
                        <path d="M5 8a8.1 8.1 0 0 1 2 4 8.1 8.1 0 0 1-2 4" />
                      </svg>
                    </div>

                    {/* Nickname */}
                    <div className="space-y-0.5">
                      <h3 className="text-lg font-black text-white tracking-tight uppercase leading-tight">{card.nickname}</h3>
                    </div>

                    {/* Bottom Row: Current Balance & Details Link */}
                    <div className="flex justify-between items-end pt-2 border-t border-white/10 mt-1">
                      <div>
                        <span className="text-[7px] font-bold text-white/40 uppercase tracking-widest block">Outstanding</span>
                        <span className="text-xs font-black text-white">₹{card.total_outstanding?.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 text-white hover:bg-white/20 transition-all border border-white/10 shadow-md group-hover/card:scale-105">
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Details</span>
                      </div>
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
                      ring: 'ring-1 ring-rose-400/40',
                      textColor: 'text-white',
                      subColor: 'text-rose-100',
                      icon: AlertTriangle,
                      pulse: true,
                    },
                    pending: {
                      bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
                      ring: 'ring-1 ring-amber-400/30 shadow-sm',
                      textColor: 'text-white',
                      subColor: 'text-amber-100',
                      icon: History,
                      pulse: false,
                    },
                    paid: {
                      bg: 'bg-emerald-500/10 border border-emerald-500/20 dark:bg-emerald-500/5',
                      ring: '',
                      textColor: 'text-emerald-600 dark:text-emerald-400',
                      subColor: 'text-emerald-600/60 dark:text-emerald-400/60',
                      icon: ShieldCheck,
                      pulse: false,
                    },
                    next: {
                      bg: 'bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800',
                      ring: '',
                      textColor: 'text-slate-600 dark:text-slate-400',
                      subColor: 'text-slate-400/70 dark:text-slate-500',
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
                    <div className={`px-4 py-3 rounded-xl ${cfg.bg} ${cfg.ring} relative z-10 ${cfg.pulse ? 'animate-pulse' : ''}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`shrink-0 p-1.5 rounded-lg ${status.type === 'overdue' ? 'bg-white/20' : 'bg-black/5 dark:bg-white/5'}`}>
                            <BannerIcon className={`w-4 h-4 ${cfg.textColor}`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`text-[9px] font-black uppercase tracking-widest ${cfg.subColor}`}>
                              {status.type === 'overdue' ? 'Action Required' : status.type === 'pending' ? 'Bill Due' : status.type === 'paid' ? 'Bill Status' : 'Next Billing'}
                            </p>
                            <p className={`text-xs font-black ${cfg.textColor} leading-tight`}>
                              {status.label}
                              {status.due_date && (
                                <span className="block text-[9px] opacity-80 mt-0.5">
                                  Due by: {new Date(status.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        {amountStr && (
                          <div className="text-right shrink-0">
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${cfg.subColor}`}>
                              {status.amount ? 'Amount Due' : 'On'}
                            </p>
                            <p className={`text-base font-black tabular-nums ${cfg.textColor}`}>
                              {amountStr}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Stats Summary Box */}
                <div className="grid grid-cols-2 gap-3 px-1 py-1">
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3 flex flex-col justify-center gap-0.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Credit Limit</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">₹{card.credit_limit.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/40 rounded-xl p-3 flex flex-col justify-center gap-0.5">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Available Limit</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      ₹{(card.credit_limit - (card.total_outstanding || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* Utilization Progress Bar */}
                <div className="px-1 space-y-1.5">
                  <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                    <span className="text-slate-400">Card Utilization</span>
                    <span className={card.threshold_exceeded ? 'text-rose-500' : 'text-slate-500'}>
                      {card.utilization_percent}%
                      {card.threshold_exceeded && ' · Breached'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/10 dark:border-white/5">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${card.threshold_exceeded
                        ? 'bg-gradient-to-r from-rose-500 to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                        }`}
                      style={{ width: `${Math.min(100, card.utilization_percent || 0)}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800/60 pt-3 mt-1">
                  <button
                    onClick={() => handleOpenModal(card)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all border border-slate-200/50 dark:border-slate-700/50"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(card.id!)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/5 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-black/60 backdrop-blur-sm flex flex-col items-center p-4">
          <div className="my-auto bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]">
            <div className="p-8 pb-4 flex justify-between items-center border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{editingCard ? 'Edit Credit Card' : 'Add New Card'}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Provide your card details for tracking.</p>
              </div>
              <button onClick={handleCloseModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors">
                <Plus className="w-6 h-6 rotate-45 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
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
                <p className="text-[10px] text-slate-400 italic text-center">We'll warn you once total card utilization crosses this percentage of your limit.</p>
              </div>

              </div>

              <div className="p-8 pt-4 flex gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 text-white font-black rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                  style={{
                    background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
                    boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
                >
                  {editingCard ? 'Update Card' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Credit Card?"
        message="Are you sure you want to delete this credit card? All associated billing history will be permanently removed."
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
};

export default CreditCards;
