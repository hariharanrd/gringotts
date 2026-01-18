
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  SAVING = 'SAVING'
}

export interface Category {
  id: number;
  name: string;
  description: string;
}

export interface SubCategory {
  id: number;
  categoryId: number;
  name: string;
  description: string;
}

export interface Item {
  id: number;
  subCategoryId: number;
  name: string;
  description: string;
}

export interface Transaction {
  id: number;
  category?: Category;
  subcategory?: SubCategory;
  item?: Item;
  createdAt: string;
  transaction_time: string;
  value: number;
  description: string;
  notes?: string;
  type: TransactionType;
}

export interface Expense extends Transaction {
  payment_mode? : string
  type: TransactionType.EXPENSE
}

export interface Income extends Transaction {
  source? : string
  type: TransactionType.INCOME
}

export interface Saving extends Transaction {
  active? : boolean
  withdrawn_amount: number
  type: TransactionType.SAVING
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  monthlyTrend: { date: string; income: number; expense: number }[];
  categoryDistribution: { name: string; value: number }[];
}
