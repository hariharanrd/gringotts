import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = type === 'success'
    ? 'border-emerald-500/30 bg-white/95 dark:bg-slate-900/95 shadow-emerald-500/10'
    : type === 'error'
      ? 'border-rose-500/30 bg-white/95 dark:bg-slate-900/95 shadow-rose-500/10'
      : type === 'warning'
        ? 'border-amber-500/30 bg-white/95 dark:bg-slate-900/95 shadow-amber-500/10'
        : 'border-cyan-500/30 bg-white/95 dark:bg-slate-900/95 shadow-cyan-500/10';

  const iconColor = type === 'success' ? 'text-emerald-500 dark:text-emerald-400' : type === 'error' ? 'text-rose-500 dark:text-rose-400' : type === 'warning' ? 'text-amber-500 dark:text-amber-400' : 'text-cyan-500 dark:text-cyan-400';
  const textColor = type === 'success' ? 'text-emerald-800 dark:text-emerald-100' : type === 'error' ? 'text-rose-800 dark:text-rose-100' : type === 'warning' ? 'text-amber-800 dark:text-amber-100' : 'text-cyan-800 dark:text-cyan-100';
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? AlertCircle : type === 'warning' ? AlertCircle : CheckCircle; // Using CheckCircle for info too for now, or could use Info icon


  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl ${styles}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <p className={`font-medium text-sm ${textColor}`}>{message}</p>
      <button onClick={onClose} className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ml-2">
        <X className={`w-4 h-4 ${iconColor}`} />
      </button>
    </div>
  );
};

export default Toast;
