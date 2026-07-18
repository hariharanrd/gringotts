import { BASE_URL, fetchWithCredentials, handleResponse, handleResponseAndGetData } from './common';

export const schedulesApi = {
  getScheduledTransactions: async (): Promise<{ data: any[] }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions`);
    return handleResponse(response);
  },

  getScheduledTransactionById: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}`);
    return handleResponseAndGetData(response);
  },

  createScheduledTransaction: async (data: Partial<any>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateScheduledTransaction: async (id: number, data: Partial<any>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deleteScheduledTransaction: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  toggleScheduledTransactionStatus: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}/toggle-active`, {
      method: 'POST',
    });
    return handleResponseAndGetData(response);
  },

  getScheduledTransactionHistory: async (id: number, page: number = 1) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}/history?page=${page}`);
    return handleResponse(response);
  },

  triggerScheduledTransaction: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}/execute`, {
      method: 'POST',
    });
    return handleResponseAndGetData(response);
  }
};
