
import { Transaction, Expense, Income, Saving, Revolving, Category, SubCategory, Item, TransactionType, Budget, BudgetUtilization, InvestmentGoal, CreditCard, CreditCardBill, TimeRange } from '../types';

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
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || (errorData.details ? `${errorData.message || 'Error'}: ${errorData.details}` : null) || errorMessage;
    } catch (e) {
      // Body not JSON or empty
    }
    throw new Error(errorMessage);
  }
  
  // For successful responses, try to parse JSON but don't fail if it's empty
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch (e) {
    return {};
  }
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

  getSummary: async (range: TimeRange = TimeRange.LAST_30_DAYS): Promise<any> => {
    const response = await fetchWithCredentials(`${BASE_URL}/summary?range=${range}`);
    return handleResponse(response);
  },

  getTransactions: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC'): Promise<ResponseProps> => {
    let url = `${BASE_URL}/transactions?page=${currentPage}&direction=${direction}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    // Polymorphic JSON will already have @type if we configured backend correctly, 
    // but we can map it to our internal TransactionType enum if needed.
    return data;
  },

  getExpenses: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC'): Promise<ResponseProps> => {
    let url = `${BASE_URL}/expenses?page=${currentPage}&direction=${direction}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((expense: any) => ({ ...expense, type: TransactionType.EXPENSE }));
    return data;
  },

  getIncomes: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC'): Promise<ResponseProps> => {
    let url = `${BASE_URL}/incomes?page=${currentPage}&direction=${direction}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((income: any) => ({ ...income, type: TransactionType.INCOME }));
    return data;
  },

  getSavings: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC'): Promise<ResponseProps> => {
    let url = `${BASE_URL}/savings?page=${currentPage}&direction=${direction}`;
    if (filters && filters.length > 0) url += `&filters=${encodeURIComponent(JSON.stringify(filters))}`;
    const response = await fetchWithCredentials(url);
    const data = await handleResponse(response);
    data.data = data.data.map((saving: any) => ({ ...saving, type: TransactionType.SAVING }));
    return data;
  },

  getRevolvings: async (currentPage: number, filters?: { field: string, condition: string, value: string }[], direction: 'ASC' | 'DESC' = 'DESC'): Promise<ResponseProps> => {
    let url = `${BASE_URL}/revolvings?page=${currentPage}&direction=${direction}`;
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

  //Transaction API end

  // Configuration API start

  getCategories: async (type?: string): Promise<Category[]> => {
    const url = type ? `${BASE_URL}/categories?type=${type}` : `${BASE_URL}/categories`;
    const response = await fetchWithCredentials(url);
    return handleResponseAndGetData(response);
  },

  getCategoriesPaginated: async (page: number = 0): Promise<{data: Category[], has_more: boolean}> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories?page=${page}&size=50`);
    return handleResponse(response);
  },

  getSubCategories: async (categoryId: number): Promise<SubCategory[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${categoryId}/subcategories`);
    const data = await handleResponse(response);
    return data.data;
  },

  getAllSubCategoriesPaginated: async (page: number = 0): Promise<{data: SubCategory[], has_more: boolean}> => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/all?page=${page}&size=50`);
    return handleResponse(response);
  },

  getItems: async (subCategoryId: number): Promise<Item[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${subCategoryId}/items`);
    const data = await handleResponse(response);
    return data.data;
  },

  getAllItemsPaginated: async (page: number = 0): Promise<{data: Item[], has_more: boolean}> => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/all?page=${page}&size=50`);
    return handleResponse(response);
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
    await handleResponse(response);
  },

  deleteSubCategory: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },


  deleteItem: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/items/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
  //Configuration API End

  // Scheduled Transactions API
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

  getScheduledTransactionHistory: async (id: number, page: number = 1) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}/history?page=${page}`);
    return handleResponse(response);
  },

  triggerScheduledTransaction: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/scheduled-transactions/${id}/execute`, {
      method: 'POST',
    });
    return handleResponseAndGetData(response);
  },


  // Budget API Start
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
  },
  // Budget API End

  // Investment Goals API Start
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
  // Investment Goals API End

  // Account API Start
  getProfile: async (): Promise<{ username: string; displayName: string; profilePicture: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/profile`);
    return handleResponse(response);
  },

  updateProfile: async (displayName: string, profilePicture: string): Promise<{ username: string; displayName: string; profilePicture: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/profile`, {
      method: 'PUT',
      body: JSON.stringify({ displayName, profilePicture }),
    });
    return handleResponse(response);
  },

  resetPassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    await handleResponse(response);
  },

  deleteAccount: async (currentPassword: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account`, {
      method: 'DELETE',
      body: JSON.stringify({ currentPassword }),
    });
    await handleResponse(response);
  },
  // Account API End

  // Credit Card API Start
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
  // Credit Card API End
};

