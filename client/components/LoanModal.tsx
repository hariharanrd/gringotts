import React, { useState, useEffect } from 'react';
import { X, Landmark, Percent, Calendar, FileText, Check, Sparkles, Receipt } from 'lucide-react';
import { api } from '../services/api';
import { Loan } from '../types';
import { useToast } from './ToastContext';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (loan: Loan) => void;
  editLoan?: Loan | null;
}

const EMPTY_FORM: Partial<Loan> = {
  name: '',
  lender: '',
  principal_amount: 100000,
  annual_rate: 8.5,
  tenure_months: 12,
  start_date: new Date().toISOString().split('T')[0],
  emis_paid: 0,
  is_closed: false,
  notes: ''
};

const fmt = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const LoanModal: React.FC<LoanModalProps> = ({ isOpen, onClose, onSaved, editLoan }) => {
  const { showToast } = useToast();
  const [form, setForm] = useState<Partial<Loan>>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [tenureUnit, setTenureUnit] = useState<'months' | 'years'>('years');
  const [tenureValue, setTenureValue] = useState<number>(1);

  useEffect(() => {
    if (isOpen) {
      if (editLoan) {
        setForm({ ...editLoan });
        if (editLoan.tenure_months % 12 === 0) {
          setTenureUnit('years');
          setTenureValue(editLoan.tenure_months / 12);
        } else {
          setTenureUnit('months');
          setTenureValue(editLoan.tenure_months);
        }
      } else {
        setForm({ ...EMPTY_FORM });
        setTenureUnit('years');
        setTenureValue(3);
      }
    }
  }, [isOpen, editLoan]);

  // Sync tenure_months when tenureValue or tenureUnit changes
  useEffect(() => {
    const months = tenureUnit === 'years' ? tenureValue * 12 : tenureValue;
    setForm(f => ({ ...f, tenure_months: months }));
  }, [tenureValue, tenureUnit]);

  // Calculate live EMI
  const principal = form.principal_amount ?? 0;
  const annualRate = form.annual_rate ?? 0;
  const tenureMonths = form.tenure_months ?? 0;

  let liveEmi = 0;
  if (tenureMonths > 0) {
    if (annualRate <= 0) {
      liveEmi = principal / tenureMonths;
    } else {
      const r = (annualRate / 12) / 100;
      liveEmi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
    }
  }

  const liveTotalPayable = liveEmi * tenureMonths;
  const liveTotalInterest = Math.max(0, liveTotalPayable - principal);
  const interestPercentage = liveTotalPayable > 0 ? (liveTotalInterest / liveTotalPayable) * 100 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      showToast('Loan name is required', 'error');
      return;
    }
    if (!form.principal_amount || form.principal_amount <= 0) {
      showToast('Principal amount must be greater than 0', 'error');
      return;
    }
    if (form.annual_rate === undefined || form.annual_rate < 0 || form.annual_rate > 50) {
      showToast('Rate of Interest must be between 0% and 50%', 'error');
      return;
    }
    if (!form.tenure_months || form.tenure_months <= 0) {
      showToast('Tenure must be greater than 0', 'error');
      return;
    }
    if (!form.start_date) {
      showToast('Start Date is required', 'error');
      return;
    }

    setSaving(true);
    try {
      let saved: Loan;
      const payload = {
        ...form,
        emi_amount: Math.round(liveEmi * 100) / 100
      };

      if (editLoan?.id) {
        saved = await api.updateLoan(editLoan.id, payload);
        showToast('Loan updated successfully', 'success');
      } else {
        saved = await api.createLoan(payload);
        showToast('Loan created successfully', 'success');
      }
      onSaved(saved);
      onClose();
    } catch (error: any) {
      showToast(error.message || 'Failed to save loan', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex flex-col items-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative my-auto w-full sm:max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Landmark className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {editLoan ? 'Edit Loan Record' : 'Add New Loan Vault'}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Form Fields (Left Side) */}
          <div className="space-y-4 md:col-span-7">
            
            {/* Loan Name & Lender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Loan Name</label>
                <input
                  type="text"
                  required
                  value={form.name ?? ''}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. HDFC Home Loan"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Lender / Bank</label>
                <input
                  type="text"
                  value={form.lender ?? ''}
                  onChange={e => setForm(f => ({ ...f, lender: e.target.value }))}
                  placeholder="e.g. HDFC Bank"
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>

            {/* Principal Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Principal Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={form.principal_amount || ''}
                  onChange={e => setForm(f => ({ ...f, principal_amount: parseFloat(e.target.value) || 0 }))}
                  placeholder="500000"
                  className="w-full pl-8 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>

            {/* Rate of Interest */}
            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Annual Interest Rate (%)</label>
                <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">{annualRate}% p.a.</span>
              </div>
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                <input
                  type="range"
                  min={0}
                  max={50}
                  step={0.05}
                  value={annualRate}
                  onChange={e => setForm(f => ({ ...f, annual_rate: parseFloat(e.target.value) || 0 }))}
                  className="flex-1 accent-cyan-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.01}
                  value={annualRate}
                  onChange={e => setForm(f => ({ ...f, annual_rate: Math.min(50, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                  className="w-20 text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-xl text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Tenure & Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Tenure Unit</label>
                <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setTenureUnit('years');
                      setTenureValue(Math.max(1, Math.round(tenureMonths / 12)));
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${tenureUnit === 'years' ? 'bg-white dark:bg-slate-850 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Years
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTenureUnit('months');
                      setTenureValue(tenureMonths);
                    }}
                    className={`py-2 text-xs font-bold rounded-xl transition-all ${tenureUnit === 'months' ? 'bg-white dark:bg-slate-850 shadow-sm text-cyan-600 dark:text-cyan-400' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    Months
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                  Tenure {tenureUnit === 'years' ? '(Years)' : '(Months)'}
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={tenureValue}
                  onChange={e => setTenureValue(parseInt(e.target.value) || 0)}
                  placeholder={tenureUnit === 'years' ? '3' : '36'}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>

            {/* Start Date & EMIs Paid (Edit only) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Start Date</label>
                <input
                  type="date"
                  required
                  value={form.start_date ? form.start_date.split('T')[0] : ''}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">EMIs Paid So Far</label>
                <input
                  type="number"
                  min={0}
                  max={tenureMonths}
                  value={form.emis_paid ?? 0}
                  onChange={e => setForm(f => ({ ...f, emis_paid: Math.min(tenureMonths, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">Notes (optional)</label>
              <textarea
                value={form.notes ?? ''}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Write any details about lender, processing fees, collateral..."
                rows={2}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition-all resize-none"
              />
            </div>

          </div>

          {/* Live Preview Panel (Right Side) */}
          <div className="md:col-span-5 flex flex-col justify-start">
            <div className="sticky top-0 bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-950 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 dark:border-slate-850">
                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                  Live Vault Projection
                </div>
                {tenureMonths > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold uppercase">
                    {tenureUnit === 'years' ? `${tenureValue} Year${tenureValue > 1 ? 's' : ''}` : `${tenureValue} Month${tenureValue > 1 ? 's' : ''}`}
                  </span>
                )}
              </div>

              {/* Calculated EMI Display */}
              <div className="text-center py-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-cyan-500/5 rounded-full blur-xl"></div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-slate-400 dark:text-slate-500 mb-1">Estimated Monthly EMI</div>
                <div className="text-2xl font-black text-cyan-500 tabular-nums">
                  {fmt(liveEmi)}
                </div>
              </div>

              {/* Totals Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
                  <div className="text-slate-450 dark:text-slate-500 font-bold mb-1">Principal Amount</div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(principal)}</div>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-150 dark:border-slate-800">
                  <div className="text-slate-450 dark:text-slate-500 font-bold mb-1">Total Interest</div>
                  <div className="font-extrabold text-slate-800 dark:text-slate-100 tabular-nums">{fmt(liveTotalInterest)}</div>
                </div>
              </div>

              {/* Interest / Principal Breakdown ratio */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-455 dark:text-slate-500">
                  <span>Breakdown Ratio</span>
                  <span className="text-cyan-500 tabular-nums">{interestPercentage.toFixed(1)}% Interest</span>
                </div>
                <div className="w-full h-3.5 bg-emerald-500 rounded-full overflow-hidden p-0.5 flex">
                  {interestPercentage > 0 && (
                    <div
                      className="h-2.5 rounded-l-full bg-cyan-500 transition-all duration-300"
                      style={{ width: `${interestPercentage}%` }}
                    />
                  )}
                  <div
                    className={`h-2.5 bg-emerald-550 transition-all duration-300 ${interestPercentage > 0 ? 'rounded-r-full' : 'rounded-full w-full'}`}
                    style={{ width: `${100 - interestPercentage}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold px-1">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                    Interest ({fmt(liveTotalInterest)})
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Principal ({fmt(principal)})
                  </span>
                </div>
              </div>

              {/* Repayment Statement */}
              <div className="p-3 rounded-2xl bg-cyan-500/5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 border border-cyan-500/10">
                <div className="flex gap-2">
                  <Receipt className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                  <div>
                    You will repay a total of <span className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">{fmt(liveTotalPayable)}</span> over the tenure. Each EMI includes monthly reducing interest.
                  </div>
                </div>
              </div>

            </div>
          </div>

        </form>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 border-t border-slate-200 dark:border-slate-700/50 flex gap-3 z-10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-850 transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold shadow-lg transition-all disabled:opacity-60"
            style={{
              background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
              boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2)`
            }}
          >
            {saving ? 'Saving...' : editLoan ? 'Save Vault Changes' : 'Create Loan Vault'}
          </button>
        </div>

      </div>
    </div>
  );
};
