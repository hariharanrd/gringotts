
import { Transaction, Expense, Income, Saving, Revolving, Category, SubCategory, Item, TransactionType } from '../types';

const BASE_URL = "/api/v1";

interface ResponseProps {
  data: Transaction[] | Expense[] | Income[] | Saving[] | Revolving[];
  page: number;
  total_count: number;
  has_more: boolean;
}

const getHeaders = () => {
  return {
    'Content-Type': 'application/json'
  };
};

const fetchWithCredentials = async (url: string, options: RequestInit = {}) => {
  options.credentials = 'include';
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
  return data;
}

async function handleResponseAndGetData(response: Response) {
  const data = await handleResponse(response);
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

  getSummary: async (days: number = 30): Promise<any> => {
    const response = await fetchWithCredentials(`${BASE_URL}/summary?days=${days}`);
    return handleResponse(response);
  },

  getExpenses: async (currentPage: number, filters?: {field: string, condition: string, value: string}[]): Promise<ResponseProps> => {
    let url = `${BASE_URL}/expenses?page=${currentPage}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((expense: any) => ({ ...expense, type: TransactionType.EXPENSE }));
    return data;
  },

  getIncomes: async (currentPage: number, filters?: {field: string, condition: string, value: string}[]): Promise<ResponseProps> => {
    let url = `${BASE_URL}/incomes?page=${currentPage}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((income: any) => ({ ...income, type: TransactionType.INCOME }));
    return data;
  },

  getSavings: async (currentPage: number, filters?: {field: string, condition: string, value: string}[]): Promise<ResponseProps> => {
    let url = `${BASE_URL}/savings?page=${currentPage}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((saving: any) => ({ ...saving, type: TransactionType.SAVING }));
    return data;
  },

  getRevolvings: async (currentPage: number, filters?: {field: string, condition: string, value: string}[]): Promise<ResponseProps> => {
    let url = `${BASE_URL}/revolvings?page=${currentPage}`;
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

  deleteTransaction: async (id: number)     => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete transaction');
  },

  bulkUpdateCategory: async (transactionIds: number[], categoryId: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/transactions/bulk-update-category`, {
      method: 'PUT',
      body: JSON.stringify({ transaction_ids: transactionIds, category_id: categoryId }),
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

  //Transaction API end

  // Configuration API start

  getCategories: async (type?: string): Promise<Category[]> => {
    const url = type ? `${BASE_URL}/categories?type=${type}` : `${BASE_URL}/categories`;
    const response = await fetchWithCredentials(url);
    return handleResponseAndGetData(response);
  },

  getSubCategories: async (categoryId: number): Promise<SubCategory[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${categoryId}/subcategories`);
    return handleResponseAndGetData(response);
  },

  getItems: async (subCategoryId: number): Promise<Item[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${subCategoryId}/items`);
    return handleResponseAndGetData(response);
  },

  addCategory: async (data: Partial<Category>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
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
    return handleResponseAndGetData(response);
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
    return handleResponseAndGetData(response);
  },

  updateCategory: async (data: Partial<Category>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateSubCategory: async (data: Partial<SubCategory>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  updateItem: async (data: Partial<Item>) => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/${data.id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
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
