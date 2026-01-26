
import { Expense, Income, Saving, Category, SubCategory, Item, TransactionType } from '../types';

const BASE_URL = "/api/v1";

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  options.credentials = 'include'; // This is crucial for sending cookies
  options.headers = {
    ...getHeaders(),
    ...options.headers,
  };
  return fetch(url, options);
};

async function handleResponse(response: Response) {
  if (response.status === 403) {
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Network response was not ok' }));
    throw new Error(error.message || `Error ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  return data.data;
}

export const api = {

  checkAuth: async () => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/me`);
    if (response.status === 403) {
      throw new Error('Not authenticated');
    }
    return true;
  },

  // Transaction API Start

  getExpenses: async (): Promise<Expense[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/expenses`);
    const data = await handleResponse(response);
    return data.map((expense: any) => ({ ...expense, type: TransactionType.EXPENSE }));
  },

  getIncomes: async (): Promise<Income[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/incomes`);
    const data = await handleResponse(response);
    return data.map((income: any) => ({ ...income, type: TransactionType.INCOME }));
  },

  getSavings: async (): Promise<Saving[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/savings`);
    const data = await handleResponse(response);
    return data.map((saving: any) => ({ ...saving, type: TransactionType.SAVING }));
  },

  createExpense: async (data: Partial<Expense>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/expenses`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.EXPENSE }),
    });
    return handleResponse(response);
  },

  createIncome: async (data: Partial<Income>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/incomes`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.INCOME }),
    });
    return handleResponse(response);
  },

  createSaving: async (data: Partial<Saving>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/savings`, {
      method: 'POST',
      body: JSON.stringify({ ...data, type: TransactionType.SAVING }),
    });
    return handleResponse(response);
  },

  deleteTransaction: async (id: number)     => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
  },

  updateExpense: async (data: Partial<Expense>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/expenses/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, type: TransactionType.EXPENSE }),
    });
    return handleResponse(response);
  },

  updateIncome: async (data: Partial<Income>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/incomes/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, type: TransactionType.INCOME }),
    });
    return handleResponse(response);
  },

  updateSaving: async (data: Partial<Saving>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/savings/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...data, type: TransactionType.SAVING }),
    });
    return handleResponse(response);
  },

  //Transaction API end

  // Configuration API start

  getCategories: async (): Promise<Category[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories`);
    return handleResponse(response);
  },

  getSubCategories: async (categoryId: number): Promise<SubCategory[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${categoryId}/subcategories`);
    return handleResponse(response);
  },

  getItems: async (subCategoryId: number): Promise<Item[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${subCategoryId}/items`);
    return handleResponse(response);
  },

  addCategory: async (data: Partial<Category>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  addSubCategory: async (data: Partial<SubCategory>) => {
    const input = {
      ...data,
      category: {
        id: data.categoryId
      }
    }
    delete input.categoryId
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return handleResponse(response);
  },

  addItem: async (data: Partial<Item>) => {
    const input = {
      ...data,
      subcategory: {
        id: data.subCategoryId
      }
    }
    delete input.subCategoryId
    const response = await fetchWithCredentials(`${BASE_URL}/items`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return handleResponse(response);
  },

  updateCategory: async (data: Partial<Category>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateSubCategory: async (data: Partial<SubCategory>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateItem: async (data: Partial<Item>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  deleteCategory: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
  },

  deleteSubCategory: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${id}`, {
      method : 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete subcategory');
  },

  deleteItem: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/${id}`, {
      method : 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
  }
  //Configuration API End
};
