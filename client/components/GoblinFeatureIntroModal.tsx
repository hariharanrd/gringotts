import React from 'react';
import { Sparkles, X, ArrowRight, MessageSquareCode, ShieldCheck } from 'lucide-react';
import { GoblinAvatar } from './GoblinAvatar';

interface GoblinFeatureIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: () => void;
}

export const GoblinFeatureIntroModal: React.FC<GoblinFeatureIntroModalProps> = ({
  isOpen,
  onClose,
  onOpenChat
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-slate-900 border border-emerald-500/30 shadow-2xl shadow-emerald-950/60 p-6 sm:p-7 text-white">
        
        {/* Glow Effects */}
        <div className="absolute -top-20 -right-20 w-44 h-44 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-xl transition-all"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="p-1 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 shadow-lg shadow-emerald-950/80 shrink-0">
            <GoblinAvatar size="md" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 mb-1">
              <Sparkles className="w-3 h-3 text-emerald-400" /> New Feature Release
            </div>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Meet Goblin AI
            </h3>
          </div>
        </div>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
          Say hello to your new Gringotts Vault Keeper! You can now log transactions, search ledger records, or update entries using natural language.
        </p>

        {/* Quick Capabilities Box */}
        <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2.5 mb-6 text-xs text-slate-300">
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-emerald-950 text-emerald-400 font-mono text-[10px]">📝</span>
            <span><strong className="text-slate-200">Log Expenses:</strong> "Spent 350 on Coffee via UPI"</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-emerald-950 text-emerald-400 font-mono text-[10px]">🔍</span>
            <span><strong className="text-slate-200">Search Ledger:</strong> "Show my Dividends", "Groceries expenses"</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="p-1 rounded-md bg-emerald-950 text-emerald-400 font-mono text-[10px]">✏️</span>
            <span><strong className="text-slate-200">Update Entries:</strong> "Update last Uber ride to 420"</span>
          </div>
        </div>

        {/* Security Assurance */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-6 px-1">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>User data stays isolated & rate-limited for your security.</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all border border-slate-700/60"
          >
            Maybe Later
          </button>
          <button
            onClick={onOpenChat}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-extrabold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 group"
          >
            <span>Try Goblin AI</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

      </div>
    </div>
  );
};
