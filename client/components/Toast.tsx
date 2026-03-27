import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export type ToastType = 'success' | 'error';

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
    : 'border-rose-500/30 bg-white/95 dark:bg-slate-900/95 shadow-rose-500/10';
  
  const iconColor = type === 'success' ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400';
  const textColor = type === 'success' ? 'text-emerald-800 dark:text-emerald-100' : 'text-rose-800 dark:text-rose-100';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

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
