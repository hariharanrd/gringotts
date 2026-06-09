import React, { useState, useEffect, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  isAfter,
  startOfDay
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  TrendingDown, 
  TrendingUp, 
  PiggyBank, 
  RefreshCw,
  X,
  CreditCard,
  Plus
} from 'lucide-react';
import { Transaction, TransactionType, Saving, Revolving } from '../types';
import { api } from '../services/api';
import { FilterCriteria } from './FilterMenu';

interface TransactionsCalendarProps {
  onTransactionClick?: (t: Transaction) => void;
  onAddTransaction?: (date: Date) => void;
  filters?: FilterCriteria[];
  currentTab?: string;
}

type ViewType = 'month' | 'week';

interface DaySummary {
  date: Date;
  expense: number;
  income: number;
  saving: number;
  revolving: number;
  transactions: Transaction[];
}

export const TransactionsCalendar: React.FC<TransactionsCalendarProps> = ({ 
  onTransactionClick,
  onAddTransaction,
  filters = [],
  currentTab = 'all'
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  useEffect(() => {
    fetchData();
  }, [currentDate, view, filters, currentTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let start: Date;
      let end: Date;

      if (view === 'month') {
        start = startOfWeek(startOfMonth(currentDate));
        end = endOfWeek(endOfMonth(currentDate));
      } else {
        start = startOfWeek(currentDate);
        end = endOfWeek(currentDate);
      }

      const dateFilters = [
        { field: 'transaction_time', condition: 'ge', value: format(start, "yyyy-MM-dd'T'00:00:00") },
        { field: 'transaction_time', condition: 'le', value: format(end, "yyyy-MM-dd'T'23:59:59") }
      ];

      const requestFilters = [
        ...dateFilters,
        ...filters
      ];

      if (currentTab && currentTab !== 'all') {
        requestFilters.push({
          field: 'type',
          condition: 'eq',
          value: currentTab.toUpperCase()
        });
      }

      const res = await api.getTransactions(1, requestFilters, 'DESC', 3000);
      setTransactions(res.data);
    } catch (e) {
      console.error("Failed to fetch calendar transactions", e);
    } finally {
      setIsLoading(false);
    }
  };

  const isNextDisabled = useMemo(() => {
    const today = new Date();
    if (view === 'month') {
      return isSameMonth(currentDate, today) || isAfter(currentDate, today);
    } else {
      return isSameDay(startOfWeek(currentDate), startOfWeek(today)) || isAfter(startOfWeek(currentDate), startOfWeek(today));
    }
  }, [currentDate, view]);

  const next = () => {
    if (isNextDisabled) return;
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };

  const prev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };

  const summaryByDay = useMemo(() => {
    const map = new Map<string, DaySummary>();
    
    // Initialize interval days
    let start: Date;
    let end: Date;
    if (view === 'month') {
      start = startOfWeek(startOfMonth(currentDate));
      end = endOfWeek(endOfMonth(currentDate));
    } else {
      start = startOfWeek(currentDate);
      end = endOfWeek(currentDate);
    }

    eachDayOfInterval({ start, end }).forEach(day => {
      map.set(format(day, 'yyyy-MM-dd'), {
        date: day,
        expense: 0,
        income: 0,
        saving: 0,
        revolving: 0,
        transactions: []
      });
    });

    transactions.forEach(t => {
      // Localize transaction date ignoring time shifts
      const tDate = new Date(t.transaction_time);
      const key = format(tDate, 'yyyy-MM-dd');
      const day = map.get(key);
      if (day) {
        day.transactions.push(t);
        const val = t.value;
        if (t.type === TransactionType.EXPENSE) day.expense += val;
        else if (t.type === TransactionType.INCOME) day.income += val;
        else if (t.type === TransactionType.SAVING) {
          if ((t as Saving).is_in) day.saving += val;
          else day.saving -= val;
        } else if (t.type === TransactionType.REVOLVING) {
          if ((t as Revolving).is_give) day.revolving -= val;
          else day.revolving += val;
        }
      }
    });

    return Array.from(map.values());
  }, [transactions, currentDate, view]);

  const periodTotals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    let totalSaving = 0;
    let totalRevolving = 0;
    let txCount = 0;

    summaryByDay.forEach(day => {
      if (view === 'month' && !isSameMonth(day.date, currentDate)) {
        return;
      }
      if (isAfter(startOfDay(day.date), startOfDay(new Date()))) {
        return;
      }
      totalIncome += day.income;
      totalExpense += day.expense;
      totalSaving += day.saving;
      totalRevolving += day.revolving;
      txCount += day.transactions.length;
    });

    return { totalIncome, totalExpense, totalSaving, totalRevolving, txCount };
  }, [summaryByDay, view, currentDate]);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const formatShortValue = (val: number) => {
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'k';
    return val.toString();
  };

  const DayCell = ({ day, isCompact }: { day: DaySummary, isCompact?: boolean }) => {
    const isCurrentMonth = isSameMonth(day.date, currentDate);
    const hasActivity = day.expense > 0 || day.income > 0 || day.saving !== 0 || day.revolving !== 0;
    const isFutureDay = isAfter(startOfDay(day.date), startOfDay(new Date()));

    return (
      <div 
        onClick={() => {
          if (!isFutureDay) {
            setSelectedDay(day.date);
          }
        }}
        className={`relative min-h-[100px] border border-slate-100 dark:border-slate-800/50 p-1 sm:p-2 transition-all ${isFutureDay ? 'bg-slate-50/30 dark:bg-slate-950/10 opacity-30 cursor-not-allowed select-none' : `group/cell cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${!isCurrentMonth && view === 'month' ? 'bg-slate-50/50 dark:bg-slate-900/30 opacity-50' : 'bg-white dark:bg-slate-900'}`} ${isToday(day.date) ? 'ring-2 ring-cyan-500/50 ring-inset' : ''}`}
      >
        <div className="flex justify-between items-start mb-1">
          <span className={`text-xs sm:text-sm font-semibold ${isToday(day.date) ? 'text-cyan-500 bg-cyan-500/10 rounded-full px-2 py-0.5' : 'text-slate-500'}`}>
            {format(day.date, 'd')}
          </span>
          {day.transactions.length > 0 && (
            <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 rounded-md hidden sm:block">
              {day.transactions.length}
            </span>
          )}
        </div>

        {/* Desktop View / Expanded View */}
        <div className={`mt-2 space-y-1 ${isCompact ? 'hidden' : 'block'}`}>
          {day.income > 0 && (
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <TrendingUp className="w-3 h-3 text-emerald-500 hidden sm:block" />
              <span className="text-emerald-500 font-medium truncate ml-auto">+{formatShortValue(day.income)}</span>
            </div>
          )}
          {day.expense > 0 && (
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <TrendingDown className="w-3 h-3 text-rose-500 hidden sm:block" />
              <span className="text-rose-500 font-medium truncate ml-auto">-{formatShortValue(day.expense)}</span>
            </div>
          )}
          {day.saving !== 0 && (
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <PiggyBank className="w-3 h-3 text-violet-500 hidden sm:block" />
              <span className={`font-medium truncate ml-auto ${day.saving > 0 ? 'text-violet-500' : 'text-rose-500'}`}>
                {day.saving > 0 ? '+' : ''}{formatShortValue(day.saving)}
              </span>
            </div>
          )}
          {day.revolving !== 0 && (
            <div className="flex justify-between items-center text-[10px] sm:text-xs">
              <RefreshCw className="w-3 h-3 text-blue-500 hidden sm:block" />
              <span className="text-blue-500 font-medium truncate ml-auto">
                {day.revolving > 0 ? '+' : ''}{formatShortValue(day.revolving)}
              </span>
            </div>
          )}
        </div>

        {/* Mobile Compact View (Stacked Shortened Numeric Values) */}
        {isCompact && hasActivity && (
          <div className="text-center mt-1 space-y-0.5 pb-7">
            {day.income > 0 && (
              <span className="text-[8px] sm:text-[9px] font-bold block leading-none truncate text-emerald-500">
                +{formatShortValue(day.income)}
              </span>
            )}
            {day.expense > 0 && (
              <span className="text-[8px] sm:text-[9px] font-bold block leading-none truncate text-rose-500">
                -{formatShortValue(day.expense)}
              </span>
            )}
            {day.saving !== 0 && (
              <span className="text-[8px] sm:text-[9px] font-bold block leading-none truncate text-violet-500">
                {day.saving > 0 ? '+' : ''}{formatShortValue(day.saving)}
              </span>
            )}
            {day.revolving !== 0 && (
              <span className="text-[8px] sm:text-[9px] font-bold block leading-none truncate text-blue-500">
                {day.revolving > 0 ? '+' : ''}{formatShortValue(day.revolving)}
              </span>
            )}
          </div>
        )}

        {!isFutureDay && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTransaction?.(day.date);
            }}
            className="absolute bottom-1.5 sm:bottom-auto sm:top-1/2 left-1/2 -translate-x-1/2 translate-y-0 sm:-translate-y-1/2 p-0.5 sm:p-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 hover:bg-cyan-500 text-cyan-500 hover:text-white border border-cyan-500/30 dark:border-cyan-500/40 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-110 active:scale-95 transition-all duration-200 opacity-100 sm:opacity-0 sm:group-hover/cell:opacity-100 focus:opacity-100 shrink-0 z-10"
            title="Add Transaction"
          >
            <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        )}
      </div>
    );
  };

  const getAmountColor = (t: Transaction) => {
    if (t.type === 'INCOME') return 'text-emerald-500';
    if (t.type === 'EXPENSE') return 'text-rose-500';
    if (t.type === 'SAVING') return (t as any).is_in ? 'text-emerald-500' : 'text-rose-500';
    if (t.type === 'REVOLVING') return (t as any).is_give ? 'text-rose-500' : 'text-emerald-500';
    return 'text-slate-700';
  };

  const getAmountSign = (t: Transaction) => {
    if (t.type === 'INCOME') return '+';
    if (t.type === 'EXPENSE') return '-';
    if (t.type === 'SAVING') return (t as any).is_in ? '+' : '-';
    if (t.type === 'REVOLVING') return (t as any).is_give ? '-' : '+';
    return '';
  };

  const selectedDayData = summaryByDay.find(d => selectedDay && isSameDay(d.date, selectedDay));

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 glass p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-0.5 sm:p-1 rounded-xl">
            <button
              onClick={() => setView('month')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${view === 'month' ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${view === 'week' ? 'bg-white dark:bg-slate-700 text-cyan-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button onClick={prev} className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-[105px] sm:min-w-[145px] text-center">
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-wider">
              {view === 'month' ? format(currentDate, 'MMMM yyyy') : `${format(startOfWeek(currentDate), 'MMM d')} - ${format(endOfWeek(currentDate), 'MMM d, yyyy')}`}
            </h2>
          </div>
          <button 
            onClick={next} 
            disabled={isNextDisabled}
            className={`p-1.5 rounded-lg transition-colors ${isNextDisabled ? 'opacity-30 cursor-not-allowed bg-slate-100/50 dark:bg-slate-800/40 text-slate-400' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="glass rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800/50 shadow-sm relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
          </div>
        )}

        {/* Days Header */}
        {view === 'month' && (
          <div className="hidden sm:grid grid-cols-7 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800/50">
            {daysOfWeek.map(day => (
              <div key={day} className="py-3 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                {day}
              </div>
            ))}
          </div>
        )}

        {/* Calendar Grid - Month View */}
        {view === 'month' && (
          <>
            {/* Desktop Full Grid */}
            <div className="hidden sm:grid grid-cols-7">
              {summaryByDay.map(day => (
                <DayCell key={day.date.toISOString()} day={day} />
              ))}
            </div>
            {/* Mobile Compact Grid */}
            <div className="grid sm:hidden grid-cols-7 pt-2">
              {daysOfWeek.map(day => (
                <div key={day} className="pb-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {day.substring(0, 1)}
                </div>
              ))}
              {summaryByDay.map(day => (
                <DayCell key={day.date.toISOString()} day={day} isCompact={true} />
              ))}
            </div>
          </>
        )}

        {/* Calendar Grid - Week View */}
        {view === 'week' && (
          <>
            {/* Desktop Compact Vertical Layout */}
            <div className="hidden sm:flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50 bg-white dark:bg-slate-900">
              {summaryByDay.map(day => {
                const isDayToday = isToday(day.date);
                const hasTransactions = day.transactions.length > 0;
                const isFutureDay = isAfter(startOfDay(day.date), startOfDay(new Date()));
                
                // Form comma-separated descriptions of transactions
                const txPreview = day.transactions
                  .map(t => `${t.description || 'No Description'} (${getAmountSign(t)}${formatShortValue(t.value)})`)
                  .join(', ');

                return (
                  <div 
                    key={day.date.toISOString()} 
                    onClick={() => {
                      if (!isFutureDay) {
                        setSelectedDay(day.date);
                      }
                    }}
                    className={`px-6 py-2.5 flex items-center justify-between transition-all ${isFutureDay ? 'bg-slate-50/10 dark:bg-slate-950/5 opacity-30 cursor-not-allowed select-none' : `group/week-row hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer ${isDayToday ? 'bg-cyan-50/10 dark:bg-cyan-950/10' : ''}`}`}
                  >
                    {/* Left: Date & Transaction Count */}
                    <div className="flex items-center gap-3 w-48 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-lg flex flex-col items-center justify-center flex-shrink-0 ${isDayToday ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        <span className="text-[9px] uppercase font-bold leading-none">{format(day.date, 'E')}</span>
                        <span className="text-xs font-black leading-none mt-0.5">{format(day.date, 'd')}</span>
                      </div>
                      <div className="min-w-0 flex items-center gap-2">
                        <span className={`text-xs font-bold whitespace-nowrap ${isDayToday ? 'text-cyan-500' : 'text-slate-700 dark:text-slate-300'}`}>
                          {format(day.date, 'MMMM d')}
                        </span>
                        {hasTransactions && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 px-1.5 py-0.5 rounded flex-shrink-0 font-medium">
                            {day.transactions.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Middle: Aggregated totals in horizontal row with grid-aligned columns */}
                    <div className="flex items-center gap-4 w-[340px] flex-shrink-0">
                      {/* Income */}
                      <span className={`text-xs font-bold flex items-center gap-1 min-w-[70px] ${day.income > 0 ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                        <TrendingUp className="w-3.5 h-3.5 flex-shrink-0" />
                        {day.income > 0 ? `+${formatShortValue(day.income)}` : '0'}
                      </span>

                      {/* Expense */}
                      <span className={`text-xs font-bold flex items-center gap-1 min-w-[70px] ${day.expense > 0 ? 'text-rose-500' : 'text-slate-300 dark:text-slate-700'}`}>
                        <TrendingDown className="w-3.5 h-3.5 flex-shrink-0" />
                        {day.expense > 0 ? `-${formatShortValue(day.expense)}` : '0'}
                      </span>

                      {/* Saving */}
                      {day.saving !== 0 ? (
                        <span className={`text-xs font-bold flex items-center gap-1 min-w-[75px] ${day.saving > 0 ? 'text-violet-500' : 'text-rose-500'}`}>
                          <PiggyBank className="w-3.5 h-3.5 flex-shrink-0" />
                          {day.saving > 0 ? `+${formatShortValue(day.saving)}` : formatShortValue(day.saving)}
                        </span>
                      ) : (
                        <span className="w-[75px] flex-shrink-0"></span>
                      )}

                      {/* Revolving */}
                      {day.revolving !== 0 ? (
                        <span className="text-xs font-bold flex items-center gap-1 min-w-[75px] text-blue-500">
                          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                          {day.revolving > 0 ? `+${formatShortValue(day.revolving)}` : formatShortValue(day.revolving)}
                        </span>
                      ) : (
                        <span className="w-[75px] flex-shrink-0"></span>
                      )}
                    </div>

                    {/* Right: Truncated transaction descriptions preview */}
                    <div className="flex-grow min-w-0 text-right pr-2 flex items-center justify-end gap-3">
                      {hasTransactions ? (
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-medium truncate block max-w-xl ml-auto">
                          {txPreview}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-700 italic">No activity</span>
                      )}
                      {!isFutureDay && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTransaction?.(day.date);
                          }}
                          className="p-1 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 hover:bg-cyan-500 text-cyan-500 hover:text-white border border-cyan-500/30 dark:border-cyan-500/40 backdrop-blur-sm shadow-sm hover:shadow-md hover:scale-110 active:scale-95 transition-all duration-200 opacity-0 group-hover/week-row:opacity-100 focus:opacity-100 shrink-0"
                          title="Add Transaction"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Mobile Vertical List */}
            <div className="sm:hidden flex flex-col divide-y divide-slate-100 dark:divide-slate-800/50">
              {summaryByDay.map(day => {
                const isFutureDay = isAfter(startOfDay(day.date), startOfDay(new Date()));
                
                return (
                  <div 
                    key={day.date.toISOString()} 
                    className={`p-3 flex items-center justify-between transition-all ${isFutureDay ? 'opacity-30 cursor-not-allowed select-none' : 'cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`} 
                    onClick={() => {
                      if (!isFutureDay) {
                        setSelectedDay(day.date);
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center ${isToday(day.date) ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        <span className="text-[10px] uppercase font-bold opacity-70">{format(day.date, 'E')}</span>
                        <span className="text-sm font-black">{format(day.date, 'd')}</span>
                      </div>
                      <div>
                        {day.transactions.length > 0 ? (
                          <p className="text-xs font-medium text-slate-500">{day.transactions.length} Transactions</p>
                        ) : (
                          <p className="text-xs text-slate-400">No activity</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col items-end gap-1">
                        {day.income > 0 && <span className="text-xs font-bold text-emerald-500">+{formatShortValue(day.income)} IN</span>}
                        {day.expense > 0 && <span className="text-xs font-bold text-rose-500">-{formatShortValue(day.expense)} EX</span>}
                        {day.saving !== 0 && <span className={`text-xs font-bold ${day.saving > 0 ? 'text-violet-500' : 'text-rose-500'}`}>{day.saving > 0 ? '+' : ''}{formatShortValue(day.saving)} SV</span>}
                        {day.revolving !== 0 && <span className="text-xs font-bold text-blue-500">{day.revolving > 0 ? '+' : ''}{formatShortValue(day.revolving)} RV</span>}
                      </div>
                      {!isFutureDay && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTransaction?.(day.date);
                          }}
                          className="p-1.5 rounded-full bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-500 border border-cyan-500/30 dark:border-cyan-500/40 backdrop-blur-sm shadow-md active:scale-95 transition-all duration-200 shrink-0"
                          title="Add Transaction"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Period Summary Dashboard */}
        {periodTotals && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-900/40 border-t border-slate-100 dark:border-slate-800/50">
            {/* Income Stat */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-emerald-500/10 text-emerald-500 flex-shrink-0">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider block truncate">
                  {view === 'month' ? 'Monthly' : 'Weekly'} Income
                </span>
                <span className="text-sm sm:text-lg font-black text-emerald-500 font-bold block truncate">
                  +{periodTotals.totalIncome.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Expense Stat */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-rose-500/10 text-rose-500 flex-shrink-0">
                <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider block truncate">
                  {view === 'month' ? 'Monthly' : 'Weekly'} Expense
                </span>
                <span className="text-sm sm:text-lg font-black text-rose-500 font-bold block truncate">
                  -{periodTotals.totalExpense.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Savings Stat */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-violet-500/10 text-violet-500 flex-shrink-0">
                <PiggyBank className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider block truncate">
                  {view === 'month' ? 'Net Monthly Savings' : 'Net Weekly Savings'}
                </span>
                <span className={`text-sm sm:text-lg font-black font-bold block truncate ${periodTotals.totalSaving >= 0 ? 'text-violet-500' : 'text-rose-500'}`}>
                  {periodTotals.totalSaving > 0 ? '+' : ''}{periodTotals.totalSaving.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Revolving Stat */}
            <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-wider block truncate">
                  {view === 'month' ? 'Net Monthly Revolving' : 'Net Weekly Revolving'}
                </span>
                <span className={`text-sm sm:text-lg font-black font-bold block truncate ${periodTotals.totalRevolving >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                  {periodTotals.totalRevolving > 0 ? '+' : ''}{periodTotals.totalRevolving.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Overlay for Selected Day */}
      {selectedDay && selectedDayData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-500 rounded-xl">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    {format(selectedDay, 'MMMM d, yyyy')}
                  </h3>
                  <p className="text-xs font-medium text-slate-500">{format(selectedDay, 'EEEE')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setSelectedDay(null);
                    onAddTransaction?.(selectedDay);
                  }}
                  className="px-3 py-1.5 bg-cyan-500/10 dark:bg-cyan-500/20 hover:bg-cyan-500 text-cyan-500 hover:text-white border border-cyan-500/30 dark:border-cyan-500/40 rounded-xl shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1 text-xs font-bold"
                  title="Add Transaction"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto grow">
              {selectedDayData.transactions.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CalendarIcon className="w-8 h-8 text-slate-400" />
                  </div>
                  <h4 className="text-slate-900 dark:text-white font-bold">No Transactions</h4>
                  <p className="text-sm text-slate-500 mt-1">There was no financial activity on this day.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDayData.transactions.map((t, idx) => (
                    <div 
                      key={t.id || idx} 
                      onClick={() => onTransactionClick?.(t)}
                      className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-cyan-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${t.type === 'EXPENSE' ? 'bg-rose-500/10 text-rose-500' : t.type === 'INCOME' ? 'bg-emerald-500/10 text-emerald-500' : t.type === 'SAVING' ? 'bg-violet-500/10 text-violet-500' : 'bg-blue-500/10 text-blue-500'}`}>
                          {t.type === 'EXPENSE' ? <TrendingDown className="w-5 h-5" /> : t.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : t.type === 'SAVING' ? <PiggyBank className="w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                            {t.description || 'No Description'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-0.5">
                            {t.category?.name || 'Uncategorized'} • {t.payment_mode || 'Cash'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black ${getAmountColor(t)}`}>
                          {getAmountSign(t)}{t.value.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
