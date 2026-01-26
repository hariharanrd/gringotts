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

  const bgColor = type === 'success' ? 'bg-emerald-100' : 'bg-rose-100';
  const borderColor = type === 'success' ? 'border-emerald-200' : 'border-rose-200';
  const textColor = type === 'success' ? 'text-emerald-900' : 'text-rose-900';
  const iconColor = type === 'success' ? 'text-emerald-700' : 'text-rose-700';
  const Icon = type === 'success' ? CheckCircle : AlertCircle;

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl border-2 shadow-xl shadow-stone-900/20 animate-in slide-in-from-top-5 fade-in duration-300 font-serif ${bgColor} ${borderColor}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
      <p className={`font-semibold text-lg ${textColor}`}>{message}</p>
      <button onClick={onClose} className={`p-1.5 hover:bg-black/5 rounded-lg transition-colors ${textColor}`}>
        <X className={`w-5 h-5`} />
      </button>
    </div>
  );
};

export default Toast;
