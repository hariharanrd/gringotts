import { BASE_URL, fetchWithCredentials, handleResponse, handleResponseAndGetData, ResponseProps } from './common';
import { Transaction, Expense, Income, Saving, Revolving, TransactionType, TimeRange, ImportStrategy, ImportColumnMapping, ImportPreviewResult, ImportJob } from '../../types';

export const transactionsApi = {
  getSummary: async (range: TimeRange = TimeRange.LAST_30_DAYS): Promise<any> => {
    const response = await fetchWithCredentials(`${BASE_URL}/summary?range=${range}`);
    return handleResponse(response);
  },

  exportTransactions: async (params: {
    format: 'csv' | 'xlsx';
    type?: string;
    startDate?: string;
    endDate?: string;
    filters?: { field: string; condition: string; value: string }[];
    page?: number;
    size?: number;
    direction?: 'ASC' | 'DESC';
  }): Promise<Blob> => {
    let url = `${BASE_URL}/transactions/export?format=${params.format}`;
    if (params.type) url += `&type=${encodeURIComponent(params.type)}`;
    if (params.startDate) url += `&startDate=${encodeURIComponent(params.startDate)}`;
    if (params.endDate) url += `&endDate=${encodeURIComponent(params.endDate)}`;
    if (params.page !== undefined) url += `&page=${params.page}`;
    if (params.size !== undefined) url += `&size=${params.size}`;
    if (params.direction) url += `&direction=${params.direction}`;
    if (params.filters && params.filters.length > 0) {
      const cleanedFilters = params.filters.map(({ field, condition, value }) => ({ field, condition, value }));
      url += `&filters=${encodeURIComponent(JSON.stringify(cleanedFilters))}`;
    }
    const response = await fetchWithCredentials(url);
    if (response.status === 403) {
      window.location.href = '/login';
      throw new Error('Session expired');
    }
    if (!response.ok) {
      let errorMessage = `Export failed (Error ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {}
      throw new Error(errorMessage);
    }
    return response.blob();
  },

  getTransactions: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC', size: number = 10): Promise<ResponseProps> => {
    let url = `${BASE_URL}/transactions?page=${currentPage}&direction=${direction}&size=${size}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    return data;
  },

  getExpenses: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC', size: number = 10): Promise<ResponseProps> => {
    let url = `${BASE_URL}/expenses?page=${currentPage}&direction=${direction}&size=${size}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((expense: any) => ({ ...expense, type: TransactionType.EXPENSE }));
    return data;
  },

  getIncomes: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC', size: number = 10): Promise<ResponseProps> => {
    let url = `${BASE_URL}/incomes?page=${currentPage}&direction=${direction}&size=${size}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((income: any) => ({ ...income, type: TransactionType.INCOME }));
    return data;
  },

  getSavings: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC', size: number = 10): Promise<ResponseProps> => {
    let url = `${BASE_URL}/savings?page=${currentPage}&direction=${direction}&size=${size}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((saving: any) => ({ ...saving, type: TransactionType.SAVING }));
    return data;
  },

  getRevolvings: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC', size: number = 10): Promise<ResponseProps> => {
    let url = `${BASE_URL}/revolvings?page=${currentPage}&direction=${direction}&size=${size}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((revolving: any) => ({ ...revolving, type: TransactionType.REVOLVING }));
    return data;
  },

  getExpenseById: async (id: number): Promise<Expense> => {
    const response = await fetchWithCredentials(`${BASE_URL}/expenses/${id}`);
    return handleResponse(response);
  },

  getIncomeById: async (id: number): Promise<Income> => {
    const response = await fetchWithCredentials(`${BASE_URL}/incomes/${id}`);
    return handleResponse(response);
  },

  getSavingById: async (id: number): Promise<Saving> => {
    const response = await fetchWithCredentials(`${BASE_URL}/savings/${id}`);
    return handleResponse(response);
  },

  getRevolvingById: async (id: number): Promise<Revolving> => {
    const response = await fetchWithCredentials(`${BASE_URL}/revolvings/${id}`);
    return handleResponse(response);
  },

  createExpense: async (data: Partial<Expense>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/expenses`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.EXPENSE }),
    });
    return handleResponseAndGetData(response);
  },

  createIncome: async (data: Partial<Income>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/incomes`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.INCOME }),
    });
    return handleResponseAndGetData(response);
  },

  createSaving: async (data: Partial<Saving>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/savings`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.SAVING }),
    });
    return handleResponseAndGetData(response);
  },

  createRevolving: async (data: Partial<Revolving>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/revolvings`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.REVOLVING }),
    });
    return handleResponseAndGetData(response);
  },

  deleteTransaction: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  bulkDelete: async (transactionIds: number[]) => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions?ids=${transactionIds.join(',')}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  bulkUpdate: async (transactionIds: number[], fields: Record<string, unknown>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions?ids=${transactionIds.join(',')}`, {
      method: 'PUT',
      body: JSON.stringify(fields),
    });
    return handleResponse(response);
  },

  updateExpense: async (data: Partial<Expense>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/expenses/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, type: TransactionType.EXPENSE }),
    });
    return handleResponseAndGetData(response);
  },

  updateIncome: async (data: Partial<Income>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/incomes/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, type: TransactionType.INCOME }),
    });
    return handleResponseAndGetData(response);
  },

  updateSaving: async (data: Partial<Saving>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/savings/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, type: TransactionType.SAVING }),
    });
    return handleResponseAndGetData(response);
  },

  updateRevolving: async (data: Partial<Revolving>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/revolvings/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify({ ...data, type: TransactionType.REVOLVING }),
    });
    return handleResponseAndGetData(response);
  },

  previewImportFile: async (file: File): Promise<ImportPreviewResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/import/preview`, {
      method: 'POST',
      body: formData,
    });
    const result = await handleResponse(response);
    return result.data;
  },

  submitImportJob: async (
    file: File,
    strategy: ImportStrategy,
    columnMapping: ImportColumnMapping
  ): Promise<{ job_id: number; status: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('strategy', strategy);
    formData.append('columnMapping', JSON.stringify(columnMapping));
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/import`, {
      method: 'POST',
      body: formData,
    });
    const result = await handleResponse(response);
    return result.data;
  },

  getImportJobStatus: async (jobId: number): Promise<ImportJob> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/import/${jobId}/status`);
    const result = await handleResponse(response);
    return result.data;
  },

  getImportHistory: async (): Promise<{ data: ImportJob[]; total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/import/history`);
    return handleResponse(response);
  }
};
