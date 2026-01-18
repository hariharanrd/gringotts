
import { Expense, Income, Saving, Category, SubCategory, Item, TransactionType } from '../types';

/**
 * Replace with your production Spring Boot URL in environment variables.
 * For local development, this usually points to http://localhost:8080
 */
const BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8787/api/v1' 
  : ((import.meta as any).env?.VITE_API_BASE_URL || '/api');

const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': 'http://localhost:3000',
};

async function handleResponse(response: Response) {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
}

export const api = {

  getExpenses: async (): Promise<Expense[]> => {
    const response = await fetch(`${BASE_URL}/expenses`, { headers });
    const data = await handleResponse(response);
    return data.map((expense: any) => ({ ...expense, type: TransactionType.EXPENSE }));
  },

  getIncomes: async (): Promise<Income[]> => {
    const response = await fetch(`${BASE_URL}/incomes`, { headers });
    const data = await handleResponse(response);
    return data.map((income: any) => ({ ...income, type: TransactionType.INCOME }));
  },

  getSavings: async (): Promise<Saving[]> => {
    const response = await fetch(`${BASE_URL}/savings`, { headers });
    const data = await handleResponse(response);
    return data.map((saving: any) => ({ ...saving, type: TransactionType.SAVING }));
  },


  getCategories: async (): Promise<Category[]> => {
    const response = await fetch(`${BASE_URL}/categories`, { headers });
    return handleResponse(response);
  },

  getSubCategories: async (categoryId: number): Promise<SubCategory[]> => {
    const response = await fetch(`${BASE_URL}/categories/${categoryId}/subcategories`, { headers });
    return handleResponse(response);
  },

  getItems: async (subCategoryId: number): Promise<Item[]> => {
    const response = await fetch(`${BASE_URL}/subcategories/${subCategoryId}/items`, { headers });
    return handleResponse(response);
  },

  createExpense: async (data: Partial<Expense>) => {
    const response = await fetch(`${BASE_URL}/expenses`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, type: TransactionType.EXPENSE }),
    });
    return handleResponse(response);
  },

  createIncome: async (data: Partial<Income>) => {
    const response = await fetch(`${BASE_URL}/incomes`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, type: TransactionType.INCOME }),
    });
    return handleResponse(response);
  },

  createSaving: async (data: Partial<Saving>) => {
    const response = await fetch(`${BASE_URL}/savings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...data, type: TransactionType.SAVING }),
    });
    return handleResponse(response);
  },

  deleteTransaction: async (id: number) => {
    const response = await fetch(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
  },

  updateExpense: async (data: Partial<Expense>) => {
    const response = await fetch(`${BASE_URL}/expenses/${data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...data, type: TransactionType.EXPENSE }),
    });
    return handleResponse(response);
  },

  updateIncome: async (data: Partial<Income>) => {
    const response = await fetch(`${BASE_URL}/incomes/${data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...data, type: TransactionType.INCOME }),
    });
    return handleResponse(response);
  },

  updateSaving: async (data: Partial<Saving>) => {
    const response = await fetch(`${BASE_URL}/savings/${data.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...data, type: TransactionType.SAVING }),
    });
    return handleResponse(response);
  }
};
