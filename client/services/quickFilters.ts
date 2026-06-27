import { QuickFilter } from '../types';
import { toLocalDateString } from './dateUtils';
import { personalizationSync } from './personalizationSync';

export const getSystemQuickFilters = (tab: string): QuickFilter[] => {
  const today = new Date();
  
  const getThisMonthRange = () => {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return [toLocalDateString(start), toLocalDateString(end)];
  };

  const getThisYearRange = () => {
    const start = new Date(today.getFullYear(), 0, 1);
    const end = new Date(today.getFullYear(), 11, 31);
    return [toLocalDateString(start), toLocalDateString(end)];
  };

  const getLastMonthRange = () => {
    const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const end = new Date(today.getFullYear(), today.getMonth(), 0);
    return [toLocalDateString(start), toLocalDateString(end)];
  };

  const getLast30DaysRange = () => {
    const start = new Date();
    start.setDate(today.getDate() - 30);
    return [toLocalDateString(start), toLocalDateString(today)];
  };

  const [thisMonthStart, thisMonthEnd] = getThisMonthRange();
  const [thisYearStart, thisYearEnd] = getThisYearRange();
  const [lastMonthStart, lastMonthEnd] = getLastMonthRange();
  const [last30DaysStart, last30DaysEnd] = getLast30DaysRange();

  const timeFilters: QuickFilter[] = [
    {
      id: 'sys-this-month',
      label: 'This Month',
      tab,
      isSystem: true,
      filters: [
        { field: 'transaction_time', condition: 'ge', value: thisMonthStart, label: thisMonthStart },
        { field: 'transaction_time', condition: 'le', value: thisMonthEnd, label: thisMonthEnd }
      ]
    },
    {
      id: 'sys-this-year',
      label: 'This Year',
      tab,
      isSystem: true,
      filters: [
        { field: 'transaction_time', condition: 'ge', value: thisYearStart, label: thisYearStart },
        { field: 'transaction_time', condition: 'le', value: thisYearEnd, label: thisYearEnd }
      ]
    },
    {
      id: 'sys-last-month',
      label: 'Last Month',
      tab,
      isSystem: true,
      filters: [
        { field: 'transaction_time', condition: 'ge', value: lastMonthStart, label: lastMonthStart },
        { field: 'transaction_time', condition: 'le', value: lastMonthEnd, label: lastMonthEnd }
      ]
    },
    {
      id: 'sys-last-30-days',
      label: 'Last 30 Days',
      tab,
      isSystem: true,
      filters: [
        { field: 'transaction_time', condition: 'ge', value: last30DaysStart, label: last30DaysStart },
        { field: 'transaction_time', condition: 'le', value: last30DaysEnd, label: last30DaysEnd }
      ]
    }
  ];

  if (tab === 'saving') {
    return [
      ...timeFilters,
      {
        id: 'sys-saving-in',
        label: 'In',
        tab,
        isSystem: true,
        filters: [{ field: 'is_in', condition: 'eq', value: 'true', label: 'IN (Deposit)' }]
      },
      {
        id: 'sys-saving-out',
        label: 'Out',
        tab,
        isSystem: true,
        filters: [{ field: 'is_in', condition: 'eq', value: 'false', label: 'OUT (Withdrawal)' }]
      }
    ];
  }

  if (tab === 'revolving') {
    return [
      ...timeFilters,
      {
        id: 'sys-revolving-active',
        label: 'Active',
        tab,
        isSystem: true,
        filters: [{ field: 'closed', condition: 'eq', value: 'false', label: 'Open' }]
      },
      {
        id: 'sys-revolving-settled',
        label: 'Settled',
        tab,
        isSystem: true,
        filters: [{ field: 'closed', condition: 'eq', value: 'true', label: 'Settled' }]
      },
      {
        id: 'sys-revolving-given',
        label: 'Given',
        tab,
        isSystem: true,
        filters: [{ field: 'is_give', condition: 'eq', value: 'true', label: 'Given (Lent)' }]
      },
      {
        id: 'sys-revolving-received',
        label: 'Received',
        tab,
        isSystem: true,
        filters: [{ field: 'is_give', condition: 'eq', value: 'false', label: 'Received (Borrowed)' }]
      }
    ];
  }

  return timeFilters;
};

export const loadUserQuickFilters = (tab: string): QuickFilter[] => {
  const key = `gringotts_quick_filters_${tab}`;
  const data = localStorage.getItem(key);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse user quick filters for tab:", tab, e);
    return [];
  }
};

export const saveUserQuickFilters = async (tab: string, quickFilters: QuickFilter[]): Promise<void> => {
  const value = JSON.stringify(quickFilters);
  await personalizationSync.save('QUICK_FILTERS', tab.toUpperCase(), value);
};
