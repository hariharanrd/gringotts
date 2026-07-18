import { BASE_URL, fetchWithCredentials, handleResponse, handleResponseAndGetData } from './common';
import { InvestmentGoal, Transaction } from '../../types';

export const goalsApi = {
  getGoals: async (): Promise<{ data: InvestmentGoal[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals`);
    return handleResponse(response);
  },

  getGoalById: async (id: number): Promise<InvestmentGoal> => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals/${id}`);
    return handleResponseAndGetData(response);
  },

  createGoal: async (data: Partial<InvestmentGoal>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateGoal: async (id: number, data: Partial<InvestmentGoal>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deleteGoal: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  getGoalTransactions: async (goalId: number, page: number = 1): Promise<{ data: Transaction[], total_count: number, has_more: boolean }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals/${goalId}/transactions?page=${page}`);
    return handleResponse(response);
  }
};
