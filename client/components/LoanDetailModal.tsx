import React, { useState, useEffect } from 'react';
import { X, Landmark, Calendar, Sparkles, TrendingUp, HelpCircle, ArrowRight, CheckCircle2, ChevronRight, Trash2, PlusCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import { Loan, LoanAmortizationRow, LoanSimulation, Category, SubCategory, Item } from '../types';
import { useToast } from './ToastContext';
import ConfirmationDialog from './ConfirmationDialog';

interface LoanDetailModalProps {
  loan: Loan | null;
  onClose: () => void;
  onSuccess: () => void;
}

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

export const LoanDetailModal: React.FC<LoanDetailModalProps> = ({ loan, onClose, onSuccess }) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'amortization' | 'simulator' | 'partPayments'>('overview');
  const [amortization, setAmortization] = useState<LoanAmortizationRow[]>([]);
  const [loadingAmortization, setLoadingAmortization] = useState(false);
  const [simulatedTenure, setSimulatedTenure] = useState<number>(1);
  const [markingEmi, setMarkingEmi] = useState(false);
  const [showEmiConfirm, setShowEmiConfirm] = useState(false);

  // Prepayment Form State
  const [prepayAmount, setPrepayAmount] = useState<number>(10000);
  const [prepayDate, setPrepayDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [prepayNotes, setPrepayNotes] = useState<string>('');
  const [addingPrepay, setAddingPrepay] = useState(false);

  // Default Categorization State
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(loan?.expense_category?.id);
  const [selectedSubCategory, setSelectedSubCategory] = useState<number | undefined>(loan?.expense_subcategory?.id);
  const [selectedItem, setSelectedItem] = useState<number | undefined>(loan?.expense_item?.id);
  const [savingCategorySettings, setSavingCategorySettings] = useState(false);

  // Sync category state when loan details change
  useEffect(() => {
    if (loan?.id) {
      api.getCategories('EXPENSE').then(cats => setCategories(cats));

      if (loan.expense_category?.id) {
        api.getSubCategories(loan.expense_category.id).then(subs => setSubCategories(subs));
      } else {
        setSubCategories([]);
      }

      if (loan.expense_subcategory?.id) {
        api.getItems(loan.expense_subcategory.id).then(its => setItems(its));
      } else {
        setItems([]);
      }

      setSelectedCategory(loan.expense_category?.id);
      setSelectedSubCategory(loan.expense_subcategory?.id);
      setSelectedItem(loan.expense_item?.id);
    }
  }, [loan]);

  const handleCategoryChange = async (catId: number) => {
    setSelectedCategory(catId || undefined);
    setSelectedSubCategory(undefined);
    setSelectedItem(undefined);
    if (catId) {
      const subs = await api.getSubCategories(catId);
      setSubCategories(subs);
    } else {
      setSubCategories([]);
    }
    setItems([]);
  };

  const handleSubCategoryChange = async (subId: number) => {
    setSelectedSubCategory(subId || undefined);
    setSelectedItem(undefined);
    if (subId) {
      const its = await api.getItems(subId);
      setItems(its);
    } else {
      setItems([]);
    }
  };

  const handleSaveCategorySettings = async () => {
    if (!loan?.id) return;
    setSavingCategorySettings(true);
    try {
      await api.updateLoan(loan.id, {
        ...loan,
        expense_category: selectedCategory ? { id: selectedCategory } as any : null,
        expense_subcategory: selectedSubCategory ? { id: selectedSubCategory } as any : null,
        expense_item: selectedItem ? { id: selectedItem } as any : null,
      });
      showToast('Default categorization settings saved successfully', 'success');
      onSuccess(); // Refresh loan data
    } catch (e: any) {
      showToast(e.message || 'Failed to save default categorization', 'error');
    } finally {
      setSavingCategorySettings(false);
    }
  };

  // Load amortization schedule
  useEffect(() => {
    if (loan?.id && activeTab === 'amortization') {
      (async () => {
        setLoadingAmortization(true);
        try {
          const res = await api.getLoanAmortization(loan.id!);
          setAmortization(res.data ?? []);
        } catch (e: any) {
          showToast(e.message || 'Failed to load amortization schedule', 'error');
        } finally {
          setLoadingAmortization(false);
        }
      })();
    }
  }, [loan, activeTab]);

  // Set default simulated tenure when simulator tab is opened
  useEffect(() => {
    if (loan?.summary) {
      const remaining = loan.summary.emis_remaining;
      setSimulatedTenure(Math.max(1, Math.round(remaining / 2)));
    }
  }, [loan, activeTab]);

  if (!loan) return null;

  const summary = loan.summary!;
  const pct = summary.completion_percent;
  const isSettled = loan.is_closed;

  // Real-time clientside simulation calculation for instant responsiveness
  const outstandingPrincipal = summary.outstanding_principal;
  const emisRemaining = summary.emis_remaining;
  const annualRate = loan.annual_rate;

  let simEmi = 0;
  if (simulatedTenure > 0 && outstandingPrincipal > 0) {
    if (annualRate <= 0) {
      simEmi = outstandingPrincipal / simulatedTenure;
    } else {
      const r = (annualRate / 12) / 100;
      simEmi = (outstandingPrincipal * r * Math.pow(1 + r, simulatedTenure)) / (Math.pow(1 + r, simulatedTenure) - 1);
    }
  }

  const simTotalPayable = simEmi * simulatedTenure;
  const simTotalInterest = Math.max(0, simTotalPayable - outstandingPrincipal);

  const origRemainingPayable = loan.emi_amount * emisRemaining;
  const origRemainingInterest = Math.max(0, origRemainingPayable - outstandingPrincipal);

  const interestSaved = Math.max(0, origRemainingInterest - simTotalInterest);
  const monthsSaved = Math.max(0, emisRemaining - simulatedTenure);

  // Prepare chart data for simulated comparison
  const chartData = [
    {
      name: 'Original Remaining',
      'Total Repayment': origRemainingPayable,
      'Interest Component': origRemainingInterest,
      'Principal Component': outstandingPrincipal,
    },
    {
      name: 'Simulated Faster Closure',
      'Total Repayment': simTotalPayable,
      'Interest Component': simTotalInterest,
      'Principal Component': outstandingPrincipal,
    }
  ];

  const handleMarkEmiPaid = async () => {
    if (!loan.id) return;
    setMarkingEmi(true);
    try {
      await api.markEmiPaid(loan.id, 1);
      showToast('Marked next EMI as paid', 'success');
      setShowEmiConfirm(false);
      onSuccess();
    } catch (e: any) {
      showToast(e.message || 'Failed to mark EMI as paid', 'error');
    } finally {
      setMarkingEmi(false);
    }
  };

  const handleCloseLoan = async () => {
    if (!loan.id) return;
    try {
      await api.closeLoan(loan.id);
      showToast('Loan marked as settled/closed', 'success');
      onSuccess();
    } catch (e: any) {
      showToast(e.message || 'Failed to settle loan', 'error');
    }
  };

  const handleAddPrepayment = async () => {
    if (!loan.id || prepayAmount <= 0) return;
    setAddingPrepay(true);
    try {
      await api.addLoanPartPayment(loan.id, {
        amount: prepayAmount,
        payment_date: prepayDate,
        notes: prepayNotes
      });
      showToast('Prepayment applied successfully', 'success');
      setPrepayAmount(10000);
      setPrepayNotes('');
      onSuccess();
    } catch (e: any) {
      showToast(e.message || 'Failed to apply prepayment', 'error');
    } finally {
      setAddingPrepay(false);
    }
  };

  const handleDeletePrepayment = async (id: number) => {
    try {
      await api.deleteLoanPartPayment(id);
      showToast('Prepayment deleted successfully', 'success');
      onSuccess();
    } catch (e: any) {
      showToast(e.message || 'Failed to delete prepayment', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full sm:max-w-3xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                {loan.name}
                {isSettled ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400">Closed/Settled</span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] uppercase font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">Active</span>
                )}
              </h2>
              {loan.lender && <p className="text-xs text-slate-400 dark:text-slate-500">{loan.lender}</p>}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="px-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/50 flex gap-4 text-sm font-semibold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'overview' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-700'}`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('amortization')}
            className={`py-3 border-b-2 transition-all ${activeTab === 'amortization' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-700'}`}
          >
            Amortization Table
          </button>
          {!isSettled && (
            <button
              onClick={() => setActiveTab('partPayments')}
              className={`py-3 border-b-2 transition-all ${activeTab === 'partPayments' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-700'}`}
            >
              Part Payments
            </button>
          )}
          {!isSettled && emisRemaining > 1 && (
            <button
              onClick={() => setActiveTab('simulator')}
              className={`py-3 border-b-2 transition-all flex items-center gap-1 ${activeTab === 'simulator' ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400' : 'border-transparent text-slate-450 dark:text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              Early Closure Simulator
            </button>
          )}
        </div>

        {/* Scrollable Tab Panel Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[40vh]">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850">
                  <div className="text-slate-450 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Monthly EMI</div>
                  <div className="text-xl font-black text-cyan-500 tabular-nums">{fmt(loan.emi_amount)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">at {loan.annual_rate}% Interest</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850">
                  <div className="text-slate-450 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Outstanding Balance</div>
                  <div className="text-xl font-black text-slate-800 dark:text-slate-100 tabular-nums">{fmt(summary.outstanding_principal)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">out of {fmtCompact(loan.principal_amount)}</div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850">
                  <div className="text-slate-450 dark:text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Repayment Progress</div>
                  <div className="text-xl font-black text-emerald-500 tabular-nums">{pct}%</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">{loan.emis_paid} / {summary.adjusted_tenure_months} EMIs Paid</div>
                </div>
              </div>

              {/* Progress Slider Track (Visual) */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-450 dark:text-slate-500">
                  <span>Loan Term Completion</span>
                  <span>{Math.max(0, summary.emis_remaining)} EMIs Remaining {summary.adjusted_tenure_months !== loan.tenure_months && <span className="text-emerald-500 text-[10px] font-bold">(Shortened by Part Payments)</span>}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-850">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-500 shadow-sm"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Detail list */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-850">
                <div className="flex justify-between p-3.5 text-sm">
                  <span className="text-slate-400 dark:text-slate-500">Start Date</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{new Date(loan.start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
                <div className="flex justify-between p-3.5 text-sm">
                  <span className="text-slate-400 dark:text-slate-500">Effective Tenure (Adjusted)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {summary.adjusted_tenure_months} Months
                    {summary.adjusted_tenure_months !== loan.tenure_months && (
                      <span className="text-xs text-emerald-500 font-semibold ml-2">(Saved {loan.tenure_months - summary.adjusted_tenure_months} months!)</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between p-3.5 text-sm">
                  <span className="text-slate-400 dark:text-slate-500">Total Interest Payable</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(summary.total_interest)}</span>
                </div>
                <div className="flex justify-between p-3.5 text-sm">
                  <span className="text-slate-400 dark:text-slate-500">Total Amount Repayable</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(summary.total_payable)}</span>
                </div>
                <div className="flex justify-between p-3.5 text-sm">
                  <span className="text-slate-400 dark:text-slate-500">Amount Paid So Far</span>
                  <span className="font-semibold text-emerald-500 tabular-nums">{fmt(summary.amount_paid_so_far)}</span>
                </div>
                {loan.notes && (
                  <div className="p-3.5 text-sm space-y-1">
                    <span className="text-slate-400 dark:text-slate-500 block">Notes & Details</span>
                    <p className="text-slate-650 dark:text-slate-350 italic font-medium">“{loan.notes}”</p>
                  </div>
                )}
              </div>

              {/* Default Categorization Settings */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 space-y-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                    Auto-Expense Categorization Settings
                  </h4>
                  <p className="text-[11px] text-slate-450 dark:text-slate-500 leading-normal">
                    When you log an EMI or part prepayment from the Loan module, Gringotts will automatically create a linked Expense transaction using these default categories:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      value={selectedCategory || ''}
                      onChange={(e) => handleCategoryChange(Number(e.target.value))}
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sub-Category</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                      disabled={!selectedCategory}
                      value={selectedSubCategory || ''}
                      onChange={(e) => handleSubCategoryChange(Number(e.target.value))}
                    >
                      <option value="">Select Sub-Category</option>
                      {subCategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Item</label>
                    <select
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50"
                      disabled={!selectedSubCategory}
                      value={selectedItem || ''}
                      onChange={(e) => setSelectedItem(Number(e.target.value) || undefined)}
                    >
                      <option value="">Select Item</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleSaveCategorySettings}
                    disabled={savingCategorySettings}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                    style={{ background: 'var(--theme-gradient-from)' }}
                  >
                    {savingCategorySettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </div>

              {/* Quick Actions (Unsettled Only) */}
              {!isSettled && (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={handleCloseLoan}
                    className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-950 transition-all"
                  >
                    Mark as Settled
                  </button>
                  <button
                    onClick={() => setShowEmiConfirm(true)}
                    disabled={markingEmi}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                    style={{ background: 'var(--theme-gradient-from)' }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {markingEmi ? 'Updating...' : 'Mark Next EMI Paid'}
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: AMORTIZATION SCHEDULE */}
          {activeTab === 'amortization' && (
            <div className="space-y-4">
              {loadingAmortization ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-4 border-slate-300 dark:border-slate-700 border-t-cyan-500 rounded-full animate-spin"></div>
                  <p className="text-xs text-slate-500 font-semibold">Generating schedule...</p>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-950 text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-850">
                      <tr>
                        <th className="p-3">Month</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-right">EMI</th>
                        <th className="p-3 text-right">Prepayment</th>
                        <th className="p-3 text-right">Principal</th>
                        <th className="p-3 text-right">Interest</th>
                        <th className="p-3 text-right">Outstanding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150 dark:divide-slate-850 text-slate-700 dark:text-slate-300">
                      {amortization.map((row, idx) => {
                        const isPaid = idx < loan.emis_paid;
                        return (
                          <tr
                            key={row.month}
                            className={`transition-colors ${isPaid ? 'bg-emerald-500/5 dark:bg-emerald-500/[0.03] text-slate-500 dark:text-slate-500' : 'hover:bg-slate-50 dark:hover:bg-slate-850/50'}`}
                          >
                            <td className="p-3 font-semibold flex items-center gap-1.5 tabular-nums">
                              {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                              Month {row.month}
                            </td>
                            <td className="p-3">{new Date(row.date).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })}</td>
                            <td className="p-3 text-right font-semibold tabular-nums">{fmt(row.emi)}</td>
                            <td className="p-3 text-right font-bold text-emerald-500 tabular-nums">
                              {row.part_payment_amount > 0 ? `+${fmt(row.part_payment_amount)}` : '—'}
                            </td>
                            <td className="p-3 text-right tabular-nums">{fmt(row.principal_component)}</td>
                            <td className="p-3 text-right tabular-nums">{fmt(row.interest_component)}</td>
                            <td className="p-3 text-right font-semibold tabular-nums">
                              {row.outstanding_balance <= 0 ? 'Settled' : fmt(row.outstanding_balance)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PART PAYMENTS */}
          {activeTab === 'partPayments' && (
            <div className="space-y-6">
              
              {/* Log prepayment Form */}
              <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-850 space-y-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
                  Log Principal Prepayment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Prepayment Amount (₹)</label>
                    <input
                      type="number"
                      min={100}
                      value={prepayAmount || ''}
                      onChange={e => setPrepayAmount(parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 50000"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Date</label>
                    <input
                      type="date"
                      value={prepayDate}
                      onChange={e => setPrepayDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Notes (Optional)</label>
                    <input
                      type="text"
                      value={prepayNotes}
                      onChange={e => setPrepayNotes(e.target.value)}
                      placeholder="e.g. Year-end bonus"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddPrepayment}
                    disabled={addingPrepay || prepayAmount <= 0}
                    className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md hover:brightness-105 transition-all disabled:opacity-50"
                    style={{ background: 'var(--theme-gradient-from)' }}
                  >
                    {addingPrepay ? 'Submitting...' : 'Apply Prepayment'}
                  </button>
                </div>
              </div>

              {/* Prepayments History */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logged Part Payments History</h4>
                {!loan.part_payments || loan.part_payments.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic text-center py-6">No custom prepayments logged for this loan record yet.</p>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-850 overflow-hidden divide-y divide-slate-200/60 dark:divide-slate-850">
                    {loan.part_payments.map(pp => (
                      <div key={pp.id} className="flex justify-between items-center p-3.5 text-xs hover:bg-slate-100/30 dark:hover:bg-slate-950/30 transition-colors">
                        <div className="space-y-0.5">
                          <p className="font-extrabold text-emerald-500 tabular-nums">{fmt(pp.amount)}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
                            Paid on {new Date(pp.payment_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {pp.notes && ` • “${pp.notes}”`}
                            {pp.linked_expense_id && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-cyan-100 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800/40">
                                🔗 Linked Expense
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeletePrepayment(pp.id!)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-all"
                          title="Delete Prepayment"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: EARLY CLOSURE SIMULATOR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6">
              
              <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/10 text-slate-500 dark:text-slate-400 text-xs leading-relaxed space-y-1.5">
                <div className="flex gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Interactive Simulation:</span> Drag the slider to target a faster repayment tenure. Gringotts will calculate the higher EMI required to close your remaining <span className="font-bold tabular-nums text-slate-750 dark:text-slate-200">{fmt(outstandingPrincipal)}</span> balance earlier. **This is pure simulation and will not change your actual saved loan terms.**
                  </div>
                </div>
              </div>

              {/* Slider Controller */}
              <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-850">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Simulated Remaining Tenure</span>
                  <span className="text-sm font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {simulatedTenure} Month{simulatedTenure > 1 ? 's' : ''}
                    {simulatedTenure >= 12 && ` (${(simulatedTenure / 12).toFixed(1)} Yrs)`}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400">1 Mo</span>
                  <input
                    type="range"
                    min={1}
                    max={Math.max(1, emisRemaining)}
                    step={1}
                    value={simulatedTenure}
                    onChange={e => setSimulatedTenure(parseInt(e.target.value) || 1)}
                    className="flex-1 accent-cyan-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums">{emisRemaining} Mos</span>
                </div>
              </div>

              {/* Simulation Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-cyan-500/[0.03] rounded-2xl border border-cyan-500/10">
                  <div className="text-slate-450 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">New Required EMI</div>
                  <div className="text-lg font-black text-cyan-500 tabular-nums">{fmt(simEmi)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    Increase of {fmt(Math.max(0, simEmi - loan.emi_amount))}/mo
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/[0.03] rounded-2xl border border-emerald-500/10">
                  <div className="text-slate-450 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Total Saved Interest</div>
                  <div className="text-lg font-black text-emerald-500 tabular-nums">{fmt(interestSaved)}</div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    Paying only {fmt(simTotalInterest)} interest
                  </div>
                </div>
                <div className="p-4 bg-indigo-500/[0.03] rounded-2xl border border-indigo-500/10">
                  <div className="text-slate-450 dark:text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Tenure Saved Faster</div>
                  <div className="text-lg font-black text-indigo-500 tabular-nums">
                    {monthsSaved} Month{monthsSaved > 1 ? 's' : ''}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold mt-1">
                    {monthsSaved >= 12 ? `${(monthsSaved / 12).toFixed(1)} years sooner` : 'Less debt duration'}
                  </div>
                </div>
              </div>

              {/* Recharts Area Comparison */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-850">
                <h4 className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 text-center">Interest Repayment Cost Comparison</h4>
                <div className="h-44 w-full text-xs font-semibold">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                      <XAxis dataKey="name" stroke="#94a3b8" strokeWidth={1} />
                      <YAxis
                        tickFormatter={(value) => fmtCompact(value)}
                        stroke="#94a3b8"
                        strokeWidth={1}
                      />
                      <Tooltip
                        formatter={(value: any) => fmt(value)}
                        contentStyle={{
                          background: 'var(--theme-surface)',
                          borderColor: 'var(--theme-border)',
                          borderRadius: '12px',
                          color: 'var(--theme-text)'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="Interest Component"
                        stackId="1"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.15}
                      />
                      <Area
                        type="monotone"
                        dataKey="Principal Component"
                        stackId="1"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-[10px] text-slate-400 font-semibold mt-2">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    Interest Portion
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Principal Portion
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex gap-3 z-10">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-center text-white text-sm font-semibold shadow-lg transition-all"
            style={{
              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)`
            }}
          >
            Close Vault Details
          </button>
        </div>

      </div>

      {/* Log EMI Paid Confirmation */}
      <ConfirmationDialog
        isOpen={showEmiConfirm}
        onClose={() => setShowEmiConfirm(false)}
        onConfirm={handleMarkEmiPaid}
        title="Log EMI Payment?"
        message={`Are you sure you want to log the next monthly EMI payment of ${fmt(loan.emi_amount)} for "${loan.name}"? This will advance the repayment progress and auto-create an expense record of ${fmt(loan.emi_amount)}.`}
        confirmLabel="Log Payment"
        type="info"
      />
    </div>
  );
};
