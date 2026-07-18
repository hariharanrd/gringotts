import { BASE_URL, fetchWithCredentials, handleResponse, handleResponseAndGetData } from './common';
import { Budget, BudgetUtilization } from '../../types';

export const budgetsApi = {
  getBudgets: async (): Promise<{ data: Budget[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets`);
    return handleResponse(response);
  },

  getMasterBudget: async (): Promise<Budget> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/master`);
    return handleResponseAndGetData(response);
  },

  getActiveBudget: async (): Promise<Budget> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/active`);
    return handleResponseAndGetData(response);
  },

  getActiveBudgetUtilization: async (): Promise<BudgetUtilization> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/active/utilization`);
    return handleResponseAndGetData(response);
  },

  getBudgetById: async (id: number): Promise<Budget> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/${id}`);
    return handleResponseAndGetData(response);
  },

  getBudgetUtilization: async (id: number): Promise<BudgetUtilization> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/${id}/utilization`);
    return handleResponseAndGetData(response);
  },

  getHistoricalBudgetUtilization: async (month: number, year: number): Promise<BudgetUtilization> => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/historical-utilization?month=${month}&year=${year}`);
    return handleResponseAndGetData(response);
  },

  createBudget: async (data: Partial<Budget>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  createBudgetVersion: async (id: number, month: number, year: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/${id}/version`, {
      method: 'POST',
      body: JSON.stringify({ month, year }),
    });
    return handleResponseAndGetData(response);
  },

  updateBudget: async (id: number, data: Partial<Budget>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deleteBudget: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
};
