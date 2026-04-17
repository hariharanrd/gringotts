
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
  icon?: string;
  color?: string;
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

export interface BudgetCategoryAllocation {
  id?: number;
  category: Category;
  allocated_amount: number;
}

export interface Budget {
  id?: number;
  name: string;
  month?: number;
  year?: number;
  is_master: boolean;
  total_amount: number;
  estimated_savings: number;
  notes?: string;
  created_at?: string;
  allocations: BudgetCategoryAllocation[];
}

export interface CategoryUtilization {
  category: Category;
  allocated: number;
  spent: number;
  remaining: number;
  percent_used: number;
}

export interface BudgetUtilization {
  budget: Budget;
  overall: { allocated: number; spent: number; remaining: number; percent_used: number };
  categories: CategoryUtilization[];
  period_month: number;
  period_year: number;
}
