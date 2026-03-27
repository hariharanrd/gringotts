
export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  SAVING = 'SAVING',
  REVOLVING = 'REVOLVING'
}

export interface Category {
  id: number;
  name: string;
  description: string;
  type?: string;
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
  is_in: boolean
  type: TransactionType.SAVING
}

export interface Revolving extends Transaction {
  is_give: boolean
  closed: boolean
  type: TransactionType.REVOLVING
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  monthlyTrend: { date: string; income: number; expense: number }[];
  categoryDistribution: { name: string; value: number }[];
}
