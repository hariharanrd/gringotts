import React, { useState, useEffect } from 'react';
import { Plus, Landmark, TrendingUp, Edit2, Trash2, CheckCircle2, ChevronRight, Sparkles, HelpCircle, Receipt } from 'lucide-react';
import { api } from '../services/api';
import { Loan } from '../types';
import { useToast } from '../components/ToastContext';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { LoanModal } from '../components/LoanModal';
import { LoanDetailModal } from '../components/LoanDetailModal';

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtCompact = (n: number) => {
  if (n < 1000) return '₹' + n;
  if (n >= 10000000) {
    const cr = n / 10000000;
    return '₹' + (cr % 1 === 0 ? cr.toString() : cr.toFixed(2)) + 'Cr';
  }
  if (n >= 100000) {
    const lakh = n / 100000;
    return '₹' + (lakh % 1 === 0 ? lakh.toString() : lakh.toFixed(2)) + 'L';
  }
  if (n >= 1000) {
    const k = n / 1000;
    return '₹' + (k % 1 === 0 ? k.toString() : k.toFixed(1)) + 'K';
  }
  return '₹' + n.toLocaleString('en-IN');
};

const EmptyLoans: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-6">
    <div className="relative">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
        <Landmark className="w-10 h-10 text-cyan-500" />
      </div>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-xl flex items-center justify-center">
        <Sparkles className="w-4 h-4 text-white animate-pulse" />
      </div>
    </div>
    <div className="text-center max-w-sm">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">No active loans found</h3>
      <p className="text-slate-500 dark:text-slate-400 mt-1.5 text-xs leading-relaxed">
        Securely track your personal, home, or auto loans. Auto-calculate EMIs, view amortization timelines, and simulate early repayments.
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
      <Plus className="w-4 h-4" /> Add Your First Loan
    </button>
  </div>
);

const Loans: React.FC = () => {
  const { showToast } = useToast();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals state
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingLoan, setViewingLoan] = useState<Loan | null>(null);

  // Dialog state
  const [deleteTarget, setDeleteTarget] = useState<Loan | null>(null);
  const [emiPaidTarget, setEmiPaidTarget] = useState<Loan | null>(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await api.getLoans();
      setLoans(res.data ?? []);
    } catch (e: any) {
      showToast(e.message || 'Failed to load loans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const handleEdit = (loan: Loan, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLoan(loan);
    setIsAddEditOpen(true);
  };

  const handleDeleteClick = (loan: Loan, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteTarget(loan);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    try {
      await api.deleteLoan(deleteTarget.id);
      showToast('Loan record deleted', 'success');
      setLoans(prev => prev.filter(l => l.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to delete loan', 'error');
    }
  };

  const handleConfirmMarkEmiPaid = async () => {
    if (!emiPaidTarget?.id) return;
    try {
      await api.markEmiPaid(emiPaidTarget.id, 1);
      showToast('EMI payment logged successfully', 'success');
      fetchLoans();
      setEmiPaidTarget(null);
    } catch (e: any) {
      showToast(e.message || 'Failed to log EMI payment', 'error');
    }
  };

  const handleCardClick = (loan: Loan) => {
    setViewingLoan(loan);
    setIsDetailOpen(true);
  };

  // Re-sync viewing loan if main loan state refreshes
  useEffect(() => {
    if (viewingLoan && loans.length > 0) {
      const updated = loans.find(l => l.id === viewingLoan.id);
      if (updated) {
        setViewingLoan(updated);
      }
    }
  }, [loans]);

  // Aggregated KPIs
  const activeLoans = loans.filter(l => !l.is_closed);
  const totalOutstanding = activeLoans.reduce((sum, l) => sum + (l.summary?.outstanding_principal ?? 0), 0);
  const monthlyEmiCommitment = activeLoans.reduce((sum, l) => sum + l.emi_amount, 0);

  return (
    <div className="space-y-6">
      
      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Active Outstanding</div>
          <div className="text-2xl font-black text-slate-850 dark:text-white tabular-nums">{fmt(totalOutstanding)}</div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Aggregated principal debt remaining</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly EMI Commitment</div>
          <div className="text-2xl font-black text-cyan-500 tabular-nums">{fmt(monthlyEmiCommitment)}</div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Cash out-flow across {activeLoans.length} active loans</p>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Vault Portfolio</div>
            <div className="text-2xl font-black text-slate-805 dark:text-white tabular-nums">
              {activeLoans.length} <span className="text-sm font-semibold text-slate-400">Active</span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              {loans.filter(l => l.is_closed).length} closed historical loans
            </p>
          </div>
          <button
            onClick={() => { setSelectedLoan(null); setIsAddEditOpen(true); }}
            className="p-3 rounded-2xl text-white shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: 'var(--theme-gradient-from)' }}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-10 h-10 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-semibold">Accessing Gringotts Loan Vaults...</p>
        </div>
      ) : loans.length === 0 ? (
        <EmptyLoans onAdd={() => { setSelectedLoan(null); setIsAddEditOpen(true); }} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loans.map(loan => {
            const sum = loan.summary!;
            const pct = sum.completion_percent;
            const active = !loan.is_closed;

            return (
              <div
                key={loan.id}
                onClick={() => handleCardClick(loan)}
                className={`group relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/5 cursor-pointer overflow-hidden ${
                  active 
                    ? 'border-slate-200 dark:border-slate-800/80' 
                    : 'border-slate-350 dark:border-slate-850 opacity-70'
                }`}
              >
                {/* Visual Top Highlight Accent */}
                <div 
                  className={`h-1.5 w-full ${active ? 'bg-cyan-500' : 'bg-slate-400 dark:bg-slate-700'}`}
                />

                <div className="p-5 space-y-4">
                  
                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm ${
                        active ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                      }`}>
                        <Landmark className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm leading-tight line-clamp-1">
                          {loan.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                          {loan.lender || 'Personal Loan'}
                        </p>
                      </div>
                    </div>

                    {/* Card Actions (Hover trigger) */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleEdit(loan, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-500 hover:bg-cyan-500/10 transition-all"
                        title="Edit Loan"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClick(loan, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Highlights Banner */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-150 dark:border-slate-850">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Monthly EMI</span>
                      <p className="text-sm font-extrabold text-cyan-500 tabular-nums">{fmt(loan.emi_amount)}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Outstanding Balance</span>
                      <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{fmtCompact(sum.outstanding_principal)}</p>
                    </div>
                  </div>

                  {/* Progress Tracker */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-450 dark:text-slate-500">
                      <span>EMI Progress ({pct}%)</span>
                      <span className="tabular-nums">{loan.emis_paid} / {loan.tenure_months} Paid</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-2.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-850">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-550 shadow-sm"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer Terms Pill */}
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-450 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-950/30 px-3 py-2 rounded-xl border border-slate-150/40 dark:border-slate-850/20">
                    <span className="tabular-nums">{fmtCompact(loan.principal_amount)} original</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span>{loan.annual_rate}% p.a.</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                    <span>{loan.tenure_months} Mos</span>
                  </div>

                  {/* Quick Payment Action (Active Only) */}
                  {active && (
                    <div className="pt-1 flex gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setEmiPaidTarget(loan); }}
                        className="w-full flex items-center justify-center gap-1 py-2 text-[10px] font-extrabold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-950 hover:border-cyan-500/50 transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Log EMI Paid
                      </button>
                      <button
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-400 group-hover:text-cyan-500 group-hover:border-cyan-500/30 transition-all"
                      >
                        <ChevronRight className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  )}

                  {/* Dimmed banner if closed */}
                  {!active && (
                    <div className="py-1 text-center bg-slate-100 dark:bg-slate-850 text-slate-500 dark:text-slate-450 font-bold rounded-xl text-[10px] uppercase tracking-wider">
                      Settle Balance Closed
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      <LoanModal
        isOpen={isAddEditOpen}
        onClose={() => { setIsAddEditOpen(false); setSelectedLoan(null); }}
        onSaved={fetchLoans}
        editLoan={selectedLoan}
      />

      {/* Detail & Simulator Modal */}
      <LoanDetailModal
        loan={viewingLoan}
        onClose={() => { setIsDetailOpen(false); setViewingLoan(null); }}
        onSuccess={fetchLoans}
      />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Loan Record?"
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"? All associated historical repayment information will be deleted. This action cannot be undone.`}
      />

      {/* Log EMI Paid Confirmation */}
      <ConfirmationDialog
        isOpen={emiPaidTarget !== null}
        onClose={() => setEmiPaidTarget(null)}
        onConfirm={handleConfirmMarkEmiPaid}
        title="Log EMI Payment?"
        message={emiPaidTarget ? `Are you sure you want to log the next monthly EMI payment of ${fmt(emiPaidTarget.emi_amount)} for "${emiPaidTarget.name}"? This will advance the repayment progress and auto-create an expense record of ${fmt(emiPaidTarget.emi_amount)}.` : ''}
        confirmLabel="Log Payment"
        type="info"
      />

    </div>
  );
};

export default Loans;
