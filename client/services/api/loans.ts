import { BASE_URL, fetchWithCredentials, handleResponse } from './common';
import { Loan, LoanAmortizationRow, LoanSimulation } from '../../types';

export const loansApi = {
  getLoans: async (): Promise<{ data: Loan[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans`);
    return handleResponse(response);
  },

  getLoanById: async (id: number): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}`);
    const data = await handleResponse(response);
    return data.data;
  },

  createLoan: async (data: Partial<Loan>): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  updateLoan: async (id: number, data: Partial<Loan>): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  deleteLoan: async (id: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  closeLoan: async (id: number): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}/close`, {
      method: 'POST',
    });
    const result = await handleResponse(response);
    return result.data;
  },

  markEmiPaid: async (id: number, count: number): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}/mark-emi-paid`, {
      method: 'POST',
      body: JSON.stringify({ count }),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  getLoanAmortization: async (id: number): Promise<{ data: LoanAmortizationRow[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}/amortization`);
    return handleResponse(response);
  },

  simulateEarlyClosure: async (id: number, targetMonths: number): Promise<LoanSimulation> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}/simulate?target_months=${targetMonths}`);
    const result = await handleResponse(response);
    return result.data;
  },

  addLoanPartPayment: async (loanId: number, data: Partial<any>): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${loanId}/part-payments`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  deleteLoanPartPayment: async (paymentId: number): Promise<Loan> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/part-payments/${paymentId}`, {
      method: 'DELETE',
    });
    const result = await handleResponse(response);
    return result.data;
  },

  getLoanTransactions: async (id: number, page: number = 1, size: number = 10): Promise<{ data: Transaction[], total_count: number, has_more: boolean }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/loans/${id}/transactions?page=${page}&size=${size}`);
    return handleResponse(response);
  }
};
