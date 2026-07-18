import { BASE_URL, fetchWithCredentials, handleResponse, handleResponseAndGetData } from './common';
import { CreditCard } from '../../types';

export const creditCardsApi = {
  getCreditCards: async (): Promise<{ data: CreditCard[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards`);
    return handleResponse(response);
  },

  getCreditCardById: async (id: number): Promise<CreditCard> => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards/${id}`);
    return handleResponseAndGetData(response);
  },

  createCreditCard: async (data: Partial<CreditCard>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateCreditCard: async (id: number, data: Partial<CreditCard>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deleteCreditCard: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  updateBillPayment: async (billId: number, amountPaid: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards/bills/${billId}`, {
      method: 'PUT',
      body: JSON.stringify({ amount_paid: amountPaid }),
    });
    await handleResponse(response);
  },

  resyncCreditCardBills: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards/${id}/resync`, {
      method: 'POST',
    });
    await handleResponse(response);
  }
};
