
import { Transaction, Expense, Income, Saving, Revolving, Category, SubCategory, Item, TransactionType, Budget, BudgetUtilization, InvestmentGoal, CreditCard, CreditCardBill, TimeRange, Profile, Personalization, UserSession, Loan, LoanSimulation, LoanAmortizationRow, TransactionGroup, ImportJob, ImportStrategy, ImportColumnMapping, ImportPreviewResult } from '../types';

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
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>
  };
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }
  options.headers = headers;
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
  
  checkUsernameAvailabilityPublic: async (username: string): Promise<{ available: boolean }> => {
    const response = await fetch(`${BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
    return handleResponse(response);
  },

  initiateForgotPasswordPublic: async (username: string): Promise<{ status: string; maskedEmail: string }> => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return handleResponse(response);
  },

  confirmForgotPasswordPublic: async (username: string, recoveryEmail: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, recoveryEmail }),
    });
    return handleResponse(response);
  },

  resetPasswordPublic: async (token: string, newPassword: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse(response);
  },

  initiateRecoveryEmailVerification: async (recoveryEmail: string): Promise<{ status: string; message: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/recovery-email/initiate-verification`, {
      method: 'POST',
      body: JSON.stringify({ recoveryEmail }),
    });
    return handleResponse(response);
  },

  confirmRecoveryEmailVerification: async (otp: string): Promise<{ status: string; message: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/recovery-email/confirm`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    return handleResponse(response);
  },

  clearRecoveryEmail: async (): Promise<{ status: string; message: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/recovery-email`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  // Transaction API Start

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
    // Polymorphic JSON will already have @type if we configured backend correctly, 
    // but we can map it to our internal TransactionType enum if needed.
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

  //Transaction API end

  // Configuration API start

  getCategories: async (type?: string): Promise<Category[]> => {
    const url = type ? `${BASE_URL}/categories?type=${type}` : `${BASE_URL}/categories`;
    const response = await fetchWithCredentials(url);
    return handleResponseAndGetData(response);
  },

  getCategoriesPaginated: async (page: number = 0, type?: string, search?: string): Promise<{data: Category[], has_more: boolean}> => {
    let url = `${BASE_URL}/categories?page=${page}&size=50`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithCredentials(url);
    return handleResponse(response);
  },

  getSubCategories: async (categoryId: number): Promise<SubCategory[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/categories/${categoryId}/subcategories`);
    const data = await handleResponse(response);
    return data.data;
  },

  getAllSubCategoriesPaginated: async (page: number = 0, type?: string, search?: string): Promise<{data: SubCategory[], has_more: boolean}> => {
    let url = `${BASE_URL}/subcategories/all?page=${page}&size=50`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithCredentials(url);
    return handleResponse(response);
  },

  getItems: async (subCategoryId: number): Promise<Item[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/subcategories/${subCategoryId}/items`);
    const data = await handleResponse(response);
    return data.data;
  },

  getAllItemsPaginated: async (page: number = 0, type?: string, search?: string): Promise<{data: Item[], has_more: boolean}> => {
    let url = `${BASE_URL}/items/all?page=${page}&size=50`;
    if (type) url += `&type=${type}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await fetchWithCredentials(url);
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

  getGoalTransactions: async (goalId: number, page: number = 1): Promise<{ data: Transaction[], total_count: number, has_more: boolean }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/investment-goals/${goalId}/transactions?page=${page}`);
    return handleResponse(response);
  },
  // Investment Goals API End

  // Account API Start
  getProfile: async (): Promise<Profile> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/profile`);
    return handleResponse(response);
  },

  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/check-username?username=${encodeURIComponent(username)}`);
    return handleResponse(response);
  },

  updateProfile: async (displayName: string, profilePicture: string, username?: string): Promise<Profile> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/profile`, {
      method: 'PUT',
      body: JSON.stringify({ displayName, profilePicture, username }),
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

  initiateResetMfa: async (currentPassword: string): Promise<{ secret: string; otpAuthTotpURL: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/reset-mfa/initiate`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    });
    return handleResponse(response);
  },

  confirmResetMfa: async (code: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/reset-mfa/confirm`, {
      method: 'POST',
      body: JSON.stringify({ code }),
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
  resyncCreditCardBills: async (id: number) => {
    const response = await fetchWithCredentials(`${BASE_URL}/credit-cards/${id}/resync`, {
      method: 'POST',
    });
    await handleResponse(response);
  },
  // Credit Card API End

  // Personalization API Start
  getPersonalizations: async (): Promise<Personalization[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations`);
    return handleResponseAndGetData(response);
  },

  getPersonalizationsByCategory: async (category: string): Promise<Personalization[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations/${category}`);
    return handleResponseAndGetData(response);
  },

  savePersonalization: async (data: Partial<Personalization>): Promise<Personalization> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deletePersonalization: async (category: string, key: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations/${category}/${key}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
  // Personalization API End

  // Sessions API Start
  getSessions: async (): Promise<{ data: UserSession[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/sessions`);
    return handleResponse(response);
  },
  
  revokeSession: async (id: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/sessions/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },
  // Sessions API End

  // Loans API Start
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
  // Loans API End

  // Transaction Groups API Start
  getTransactionGroups: async (): Promise<{ data: TransactionGroup[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups`);
    return handleResponse(response);
  },

  getTransactionGroupById: async (id: number): Promise<TransactionGroup> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${id}`);
    const result = await handleResponse(response);
    return result.data;
  },

  createTransactionGroup: async (data: Partial<TransactionGroup>): Promise<TransactionGroup> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  updateTransactionGroup: async (id: number, data: Partial<TransactionGroup>): Promise<TransactionGroup> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  deleteTransactionGroup: async (id: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  getTransactionGroupTransactions: async (id: number): Promise<{ data: Transaction[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${id}/transactions`);
    return handleResponse(response);
  },

  getTransactionGroupStatistics: async (id: number): Promise<any> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${id}/statistics`);
    const result = await handleResponse(response);
    return result.data;
  },

  getTransactionGroupThumbnail: async (id: number): Promise<string> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${id}/thumbnail`);
    const result = await handleResponse(response);
    return result.data;
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
  // Transaction Groups API End
};
