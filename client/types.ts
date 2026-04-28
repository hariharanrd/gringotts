
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
  schedule_id?: number;
  created_by?: string;
  payment_mode?: string;
  credit_card?: CreditCard;
  include_in_budget?: boolean;
}


export interface Income extends Transaction {
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

export interface InvestmentGoalTag {
  id: number;
  type: 'CATEGORY' | 'SUBCATEGORY' | 'ITEM';
  category?: Category;
  subcategory?: SubCategory;
  item?: Item;
}

export interface InvestmentGoal {
  id?: number;
  name: string;
  icon?: string;
  color?: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  annual_rate: number;
  notes?: string;
  created_at?: string;
  tags?: InvestmentGoalTag[];
  years_to_goal?: number | null;
  percent_achieved?: number;
}

export enum ScheduleFrequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export interface ScheduledTransaction {
  id: number;
  name: string;
  transaction_type: TransactionType;
  amount: number;
  description?: string;
  category?: Category;
  subcategory?: SubCategory;
  item?: Item;
  payment_mode?: string;
  is_in?: boolean;
  frequency: ScheduleFrequency;
  start_date: string; // ISO date
  end_date?: string;
  next_run_date?: string;
  last_run_date?: string;
  is_active: boolean;
  created_at?: string;
  credit_card?: CreditCard;
}

export interface CreditCard {
  id?: number;
  nickname: string;
  issuer: string;
  billing_date: number;
  due_date: number;
  credit_limit: number;
  threshold_percentage: number;
  created_at?: string;
  current_bill?: CreditCardBill;
  total_outstanding?: number;
  utilization_percent?: number;
  threshold_exceeded?: boolean;
  bills?: CreditCardBill[];
  smart_status?: {
    type: 'overdue' | 'pending' | 'paid' | 'next';
    label: string;
    amount?: number;
    date?: number;
  };
}

export interface CreditCardBill {
  id?: number;
  credit_card: CreditCard;
  billing_month: number;
  billing_year: number;
  amount_due: number;
  amount_paid: number;
  payment_status: 'PAID' | 'UNPAID' | 'PARTIALLY_PAID';
  created_at?: string;
}

export interface Expense extends Transaction {
  type: TransactionType.EXPENSE;
}
