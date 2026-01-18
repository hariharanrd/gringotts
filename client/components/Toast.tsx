// /Users/hariharand/IdeaProjects/Gringotts/client/components/Toast.tsx
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

  const bgColor = type === 'success' ? 'bg-emerald-50' : 'bg-rose-50';
  const borderColor = type === 'success' ? 'border-emerald-100' : 'border-rose-100';
  const textColor = type === 'success' ? 'text-emerald-800' : 'text-rose-800';
  const iconColor = type === 'success' ? 'text-emerald-500' : 'text-rose-500';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl border shadow-xl shadow-slate-200/50 animate-in slide-in-from-top-5 fade-in duration-300 ${bgColor} ${borderColor}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
      <p className={`font-semibold text-lg ${textColor}`}>{message}</p>
      <button onClick={onClose} className={`p-1.5 hover:bg-black/5 rounded-lg transition-colors ${textColor}`}>
        <X className={`w-5 h-5`} />
      </button>
    </div>
  );
};

export default Toast;
