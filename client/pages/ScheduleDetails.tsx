import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ScheduledTransaction, TransactionType } from '../types';
import { useToast } from '../components/ToastContext';
import { 
  ArrowLeft, Clock, Calendar, Play, Tag, 
  Hash, Activity, List, ChevronRight, CreditCard 
} from 'lucide-react';

const TYPE_CONFIG: Record<TransactionType, { gradient: string; amountClass: string }> = {
  [TransactionType.EXPENSE]: { gradient: 'from-rose-500 to-pink-600', amountClass: 'text-rose-500 dark:text-rose-400' },
  [TransactionType.INCOME]: { gradient: 'from-emerald-500 to-teal-600', amountClass: 'text-emerald-500 dark:text-emerald-400' },
  [TransactionType.SAVING]: { gradient: 'from-violet-500 to-purple-600', amountClass: 'text-violet-500 dark:text-violet-400' },
  [TransactionType.REVOLVING]: { gradient: 'from-blue-500 to-cyan-600', amountClass: 'text-blue-500 dark:text-blue-400' },
};

const DetailItem: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode }> = ({ icon: Icon, label, value }) => (
  <div className="flex flex-col gap-1">
    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </p>
    <div className="text-sm font-semibold text-slate-800 dark:text-white">{value}</div>
  </div>
);

const ScheduleDetails: React.FC = () => {
  const { id } = useParams();
  const [schedule, setSchedule] = useState<ScheduledTransaction | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetch = async () => {
    if (!id) return;
    try {
      setError(null);
      const s = await api.getScheduledTransactionById(Number(id));
      setSchedule(s);
      const h = await api.getScheduledTransactionHistory(Number(id));
      setHistory(h.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
      showToast(err.message || 'Failed to load schedule', 'error');
    }
  };

  useEffect(() => { fetch(); }, [id]);

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center">
        <Activity className="w-8 h-8 text-rose-500" />
      </div>
      <p className="text-slate-500 font-medium">{error}</p>
      <button onClick={() => navigate('/schedules')} className="flex items-center gap-2 px-6 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all font-semibold">
        <ArrowLeft className="w-4 h-4" />
        Back to Schedules
      </button>
    </div>
  );

  if (!schedule) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-10 h-10 border-4 border-slate-200 border-t-cyan-600 rounded-full animate-spin"></div>
    </div>
  );

  const config = TYPE_CONFIG[schedule.transaction_type] ?? TYPE_CONFIG[TransactionType.EXPENSE];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/schedules')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Schedule Details</h2>
        </div>
        <button 
          onClick={async () => { 
            try {
              await api.triggerScheduledTransaction(schedule.id); 
              showToast('Executed successfully', 'success'); 
              fetch(); 
            } catch (e: any) {
              showToast(e.message || 'Execution failed', 'error');
            }
          }} 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
        >
          <Play className="w-4 h-4" />
          Run Now
        </button>
      </div>

      {/* Hero Card */}
      <div className={`rounded-3xl bg-gradient-to-br ${config.gradient} p-8 text-white shadow-xl relative overflow-hidden`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Clock className="w-32 h-32" />
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest">
              {schedule.transaction_type}
            </span>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${schedule.is_active ? 'bg-emerald-400 text-emerald-950' : 'bg-slate-400 text-slate-950'}`}>
              {schedule.is_active ? 'Active' : 'Paused'}
            </span>
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight mb-1">{schedule.name}</h3>
            <p className="text-white/80 font-medium">{schedule.description || 'No description provided'}</p>
          </div>
          <div className="text-4xl font-black tabular-nums">
            ₹{schedule.amount.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/50 shadow-sm space-y-6">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500" />
              Settings
            </h4>
            <div className="grid grid-cols-1 gap-6">
              <DetailItem icon={Hash} label="ID" value={schedule.id} />
              <DetailItem icon={Calendar} label="Frequency" value={<span className="capitalize">{schedule.frequency.toLowerCase().replace('_', ' ')}</span>} />
              <DetailItem icon={Clock} label="Next Run" value={schedule.next_run_date || '—'} />
              <DetailItem icon={Tag} label="Category" value={schedule.category?.name || '—'} />
              {schedule.payment_mode && <DetailItem icon={CreditCard} label="Payment Mode" value={schedule.payment_mode} />}
            </div>
          </div>
        </div>

        {/* History Column */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700/50 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <List className="w-4 h-4 text-cyan-500" />
                Execution History
              </h4>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg">
                {history.length} Runs
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                  <Activity className="w-12 h-12 opacity-20 mb-3" />
                  <p className="text-sm font-medium">No history available yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="text-left p-4">Date</th>
                      <th className="text-left p-4">Description</th>
                      <th className="text-right p-4">Amount</th>
                      <th className="p-4 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {history.map((h: any) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="p-4">
                          <div className="font-semibold text-slate-700 dark:text-slate-300">
                            {new Date(h.transaction_time || h.transactionTime).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                          </div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">
                            {new Date(h.transaction_time || h.transactionTime).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                          </div>
                        </td>
                        <td className="p-4 font-medium text-slate-600 dark:text-slate-400">{h.description}</td>
                        <td className="p-4 text-right">
                          <span className={`font-mono font-bold ${config.amountClass}`}>
                            ₹{h.value?.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="p-4">
                          <button 
                            onClick={() => navigate(`/transaction/${h.id}?type=${schedule.transaction_type}`)}
                            className="p-1.5 rounded-lg text-slate-300 group-hover:text-cyan-500 group-hover:bg-cyan-50 dark:group-hover:bg-cyan-500/10 transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleDetails;
