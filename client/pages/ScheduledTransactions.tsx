import React, { useEffect, useState } from 'react';
import { Edit2, Eye, Trash2, Plus, Calendar, Clock, Activity, ChevronRight, SquareArrowOutUpRight, PauseCircle, PlayCircle } from 'lucide-react';
import { api } from '../services/api';
import { ScheduledTransaction, TransactionType } from '../types';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastContext';
import ScheduleModal from '../components/ScheduleModal';
import ConfirmationDialog from '../components/ConfirmationDialog';

const TYPE_CONFIG: Record<Exclude<TransactionType, TransactionType.REVOLVING>, { color: string; bg: string }> = {
  [TransactionType.EXPENSE]: { color: 'text-rose-500', bg: 'bg-rose-500/10' },
  [TransactionType.INCOME]: { color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  [TransactionType.SAVING]: { color: 'text-violet-500', bg: 'bg-violet-500/10' },
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

const ScheduledTransactions: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduledTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<ScheduledTransaction | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetch = async () => {
    setIsLoading(true);
    try {
      const res = await api.getScheduledTransactions();
      const sortedData = (res.data || []).sort((a, b) => {
        const dateA = a.next_run_date ? new Date(a.next_run_date).getTime() : Infinity;
        const dateB = b.next_run_date ? new Date(b.next_run_date).getTime() : Infinity;
        return dateA - dateB;
      });
      setSchedules(sortedData);
    } catch (err: any) {
      showToast(err.message || 'Failed to load schedules', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const handleAddSchedule = () => {
    setSelectedSchedule(null);
    setIsModalOpen(true);
  };

  const handleEditSchedule = (s: ScheduledTransaction) => {
    setSelectedSchedule(s);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedSchedule(null);
    fetch();
  };

  const handleRowClick = (e: React.MouseEvent, s: ScheduledTransaction) => {
    if ((e.target as HTMLElement).closest('button')) return;
    navigate(`/schedules/${s.id}`);
  };

  const handleToggleStatus = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    try {
      await api.toggleScheduledTransactionStatus(id);
      showToast('Status updated successfully', 'success');
      fetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await api.deleteScheduledTransaction(deletingId);
      showToast('Schedule deleted successfully', 'success');
      fetch();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete schedule', 'error');
    } finally {
      setIsDeleteDialogOpen(false);
      setDeletingId(null);
    }
  };

  const activeSchedules = schedules.filter(s => s.is_active);
  const pausedSchedules = schedules.filter(s => !s.is_active);

  const renderSchedulesTable = (list: ScheduledTransaction[]) => {
    return (
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Name</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Type</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Frequency</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Next Run</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {list.map(s => {
              const config = TYPE_CONFIG[s.transaction_type] || TYPE_CONFIG[TransactionType.EXPENSE];
              return (
                <tr
                  key={s.id}
                  onClick={(e) => handleRowClick(e, s)}
                  className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                >
                  <td className="p-4">
                    <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      {s.name}
                      {s.loan && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/50">
                          💼 {s.loan.name}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[200px]">{s.description || 'No description'}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.color}`}>
                      {s.transaction_type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      ₹{s.amount.toLocaleString('en-IN')}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 capitalize">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {s.frequency.toLowerCase().replace('_', ' ')}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-slate-500 tabular-nums">
                      {s.is_active ? formatDate(s.next_run_date) : '—'}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${s.is_active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10' : 'bg-slate-100 text-slate-600 dark:bg-slate-800'}`}>
                      {s.is_active ? 'Active' : 'Paused'}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => handleToggleStatus(e, s.id)} title={s.is_active ? "Pause Schedule" : "Resume Schedule"} className={`p-2 rounded-xl transition-all ${s.is_active ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10' : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10'}`}>
                      {s.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                    </button>
                    <button onClick={() => navigate(`/schedules/${s.id}`)} title="View History" className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 rounded-xl transition-all">
                      <SquareArrowOutUpRight className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleEditSchedule(s)} title="Edit Schedule" className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => handleDeleteClick(e, s.id)} title="Delete Schedule" className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSchedulesMobile = (list: ScheduledTransaction[]) => {
    return (
      <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800/50">
        {list.map(s => {
          const config = TYPE_CONFIG[s.transaction_type] || TYPE_CONFIG[TransactionType.EXPENSE];
          return (
            <div
              key={s.id}
              onClick={(e) => handleRowClick(e, s)}
              className="p-5 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors cursor-pointer space-y-4"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-black text-slate-900 dark:text-white truncate text-base leading-tight flex items-center gap-1.5">
                    {s.name}
                    {s.loan && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/50">
                        💼 {s.loan.name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${config.bg} ${config.color}`}>
                      {s.transaction_type}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 capitalize tracking-tight flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {s.frequency.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 dark:text-white tabular-nums">
                    ₹{s.amount.toLocaleString('en-IN')}
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-widest ${s.is_active ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {s.is_active ? 'Active' : 'Paused'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800/50">
                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 uppercase tracking-wider">
                  <Activity className="w-3 h-3" />
                  Next: {s.is_active ? formatDate(s.next_run_date) : '—'}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={(e) => handleToggleStatus(e, s.id)} className={`p-2 rounded-lg ${s.is_active ? 'text-slate-400' : 'text-emerald-500'}`}>
                    {s.is_active ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                  </button>
                  <button onClick={() => navigate(`/schedules/${s.id}`)} className="p-2 text-slate-400 hover:text-cyan-600 rounded-lg"><SquareArrowOutUpRight className="w-4 h-4" /></button>
                  <button onClick={() => handleEditSchedule(s)} className="p-2 text-slate-400 hover:text-amber-600 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={(e) => handleDeleteClick(e, s.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Schedules</h2>
          <p className="text-sm font-medium text-slate-500">Manage your recurring transactions</p>
        </div>
        <button
          onClick={handleAddSchedule}
          className="flex items-center gap-2 px-5 py-2.5 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm"
          style={{
            background: `linear-gradient(to right, var(--theme-gradient-from), var(--theme-gradient-to))`,
            boxShadow: `0 10px 15px -3px rgba(var(--theme-accent-rgb), 0.2), 0 4px 6px -4px rgba(var(--theme-accent-rgb), 0.2)`
          }}
          onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
        >
          <Plus className="w-4 h-4" />
          New Schedule
        </button>
      </div>

      {isLoading && schedules.length === 0 ? (
        <div className="glass overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
          <div className="p-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-cyan-500 rounded-full animate-spin" />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading schedules...</p>
          </div>
        </div>
      ) : schedules.length === 0 ? (
        <div className="glass overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">No schedules found</p>
            <p className="text-slate-400 text-xs mt-1">Start by creating your first recurring transaction</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Schedules Section */}
          {activeSchedules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">
                  Active Schedules ({activeSchedules.length})
                </h3>
              </div>
              <div className="glass overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                {renderSchedulesTable(activeSchedules)}
                {renderSchedulesMobile(activeSchedules)}
              </div>
            </div>
          )}

          {/* Paused Schedules Section (Isolated) */}
          {pausedSchedules.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-2">
                <span className="inline-flex rounded-full h-2 w-2 bg-slate-400"></span>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Paused Schedules ({pausedSchedules.length})
                </h3>
              </div>
              <div className="glass overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800/50 shadow-sm opacity-85 hover:opacity-100 transition-opacity">
                {renderSchedulesTable(pausedSchedules)}
                {renderSchedulesMobile(pausedSchedules)}
              </div>
            </div>
          )}
        </div>
      )}

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        schedule={selectedSchedule}
      />

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Schedule"
        message="Are you sure you want to permanently delete this automated schedule?"
        confirmLabel="Delete"
        type="danger"
      />
    </div>
  );
};

export default ScheduledTransactions;

