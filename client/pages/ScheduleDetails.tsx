import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ScheduledTransaction, TransactionType } from '../types';
import { useToast } from '../components/ToastContext';
import {
  ArrowLeft, Clock, Calendar, Play, Tag,
  Hash, Activity, List, ChevronRight, CreditCard,
  Pencil, Trash2, PauseCircle, PlayCircle
} from 'lucide-react';
import ScheduleModal from '../components/ScheduleModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

const TYPE_CONFIG: Record<TransactionType, { gradient: string; amountClass: string }> = {
  [TransactionType.EXPENSE]: { gradient: 'from-rose-500 to-pink-600', amountClass: 'text-rose-500 dark:text-rose-400' },
  [TransactionType.INCOME]: { gradient: 'from-emerald-500 to-teal-600', amountClass: 'text-emerald-500 dark:text-emerald-400' },
  [TransactionType.SAVING]: { gradient: 'from-violet-500 to-purple-600', amountClass: 'text-violet-500 dark:text-violet-400' },
  [TransactionType.REVOLVING]: { gradient: 'from-blue-500 to-cyan-600', amountClass: 'text-blue-500 dark:text-blue-400' },
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit'
  });
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
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetch = async () => {
    if (!id) return;
    try {
      setError(null);
      const s = await api.getScheduledTransactionById(Number(id));
      setSchedule(s);
      const h = await api.getScheduledTransactionHistory(Number(id), 1);
      setHistory(h.data || []);
      setHasMore(h.has_more || false);
      setTotalCount(h.total_count || 0);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || 'Failed to load schedule');
      showToast(err.message || 'Failed to load schedule', 'error');
    }
  };

  const handleLoadMore = async () => {
    if (!id || isLoadingMore || !hasMore) return;
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const h = await api.getScheduledTransactionHistory(Number(id), nextPage);
      setHistory(prev => [...prev, ...(h.data || [])]);
      setHasMore(h.has_more || false);
      setTotalCount(h.total_count || 0);
      setCurrentPage(nextPage);
    } catch (err: any) {
      showToast(err.message || 'Failed to load more history', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!schedule) return;
    try {
      await api.deleteScheduledTransaction(schedule.id);
      showToast('Schedule deleted successfully', 'success');
      setIsDeleteDialogOpen(false);
      navigate('/schedules');
    } catch (e: any) {
      showToast(e.message || 'Delete failed', 'error');
    }
  };

  const handleToggleStatus = async () => {
    if (!schedule) return;
    try {
      await api.toggleScheduledTransactionStatus(schedule.id);
      showToast('Status updated successfully', 'success');
      fetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
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
      {/* Actions Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-y-3 sm:gap-4">
        <button 
          onClick={() => navigate('/schedules')} 
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors group self-start"
        >
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span className="text-xs font-bold tracking-tight uppercase">Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 sm:gap-3">
          <button
            onClick={handleToggleStatus}
            className={`flex items-center gap-2 px-4 py-2 font-bold rounded-xl transition-all active:scale-95 text-xs ${schedule.is_active ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'}`}
          >
            {schedule.is_active ? (
              <>
                <PauseCircle className="w-3.5 h-3.5" />
                Pause
              </>
            ) : (
              <>
                <PlayCircle className="w-3.5 h-3.5" />
                Resume
              </>
            )}
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-all active:scale-95 text-xs"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>

          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold rounded-xl transition-all active:scale-95 text-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>

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
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/20 transition-all active:scale-95 text-xs"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Run Now
          </button>
        </div>
      </div>

      {/* Hero Card */}
      <div className={`rounded-[2rem] bg-gradient-to-br ${config.gradient} p-6 text-white shadow-lg relative overflow-hidden group`}>
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Clock className="w-32 h-32 -mr-8 -mt-8" />
        </div>
        
        <div className="relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-md rounded-full text-[9px] font-black uppercase tracking-widest border border-white/10">
                {schedule.transaction_type}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${schedule.is_active ? 'bg-emerald-400 text-emerald-950 shadow-lg shadow-emerald-400/20' : 'bg-slate-400 text-slate-950'}`}>
                {schedule.is_active ? 'Active' : 'Paused'}
              </span>
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-1">{schedule.name}</h3>
              <p className="text-white/70 text-xs font-medium max-w-xl line-clamp-1">{schedule.description || 'No description provided'}</p>
            </div>
            <div className="text-3xl font-black tabular-nums flex items-baseline gap-1">
              <span className="text-xl opacity-60">₹</span>
              {schedule.amount.toLocaleString('en-IN')}
            </div>
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
              <DetailItem icon={Clock} label="Next Run" value={schedule.is_active ? formatDate(schedule.next_run_date) : '-'} />
              <DetailItem icon={Tag} label="Category" value={schedule.category?.name || '—'} />
              {schedule.payment_mode && <DetailItem icon={CreditCard} label="Payment Mode" value={schedule.payment_mode} />}
              {schedule.credit_card && <DetailItem icon={CreditCard} label="Credit Card" value={schedule.credit_card.nickname} />}
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
                {totalCount} Runs
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
                            {formatDate(h.transaction_time || h.transactionTime)}
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
            {hasMore && (
              <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all border border-slate-200 dark:border-slate-700/50 disabled:opacity-50 disabled:pointer-events-none active:scale-95 flex items-center gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-slate-350 border-t-cyan-500 rounded-full animate-spin"></div>
                      Loading...
                    </>
                  ) : (
                    'More'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetch();
        }}
        schedule={schedule}
      />
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Schedule"
        message={`Are you sure you want to delete "${schedule.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        type="danger"
      />
    </div>
  );
};

export default ScheduleDetails;
