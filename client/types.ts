
export enum TimeRange {
  LAST_WEEK = 'LAST_WEEK',
  LAST_30_DAYS = 'LAST_30_DAYS',
  LAST_90_DAYS = 'LAST_90_DAYS',
  THIS_MONTH = 'THIS_MONTH',
  PREVIOUS_MONTH = 'PREVIOUS_MONTH',
  THIS_YEAR = 'THIS_YEAR',
  LAST_YEAR = 'LAST_YEAR'
}

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

export interface TransactionGroup {
  id: number;
  name: string;
  description?: string;
  type: 'TRIP' | 'EVENT' | 'PROJECT' | 'PERSONAL' | 'CUSTOM';
  icon?: string;
  color?: string;
  status: 'ACTIVE' | 'CLOSED';
  created_at: string;
  allows_expense: boolean;
  allows_income: boolean;
  allows_saving: boolean;
  allows_revolving: boolean;
  thumbnail?: string;
  shared?: boolean;
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
  funding_goal?: InvestmentGoal;
  loan_id?: number;
  loan_payment_type?: 'EMI' | 'PART_PAYMENT';
  loan_name?: string;
  group?: TransactionGroup;
  user?: {
    id: number;
    username: string;
    display_name: string;
    profile_picture?: string;
  };
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
  is_closed?: boolean;
  closed_at?: string;
  goal_type?: 'PERSISTENT' | 'ONE_TIME';
  total_funded?: number;
}

export enum ScheduleFrequency {
  ONE_TIME = 'ONE_TIME',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
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
  funding_goal?: InvestmentGoal;
  loan?: Loan;
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
    due_date?: string;
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
  category_spending?: { name: string; value: number }[];
}

export interface Expense extends Transaction {
  type: TransactionType.EXPENSE;
}

export interface Profile {
  username: string;
  displayName: string;
  profilePicture: string;
  recoveryEmail?: string;
  hasRecoveryEmail?: boolean;
}

export interface Personalization {
  id?: number;
  category: string;
  configKey: string;
  configValue: string;
}

export interface UserSession {
  id: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  last_active_at: string;
}

export interface LoanPartPayment {
  id?: number;
  amount: number;
  payment_date: string;
  notes?: string;
  created_at?: string;
  linked_expense_id?: number;
}

export interface LoanSummary {
  total_payable: number;
  total_interest: number;
  amount_paid_so_far: number;
  outstanding_principal: number;
  emis_remaining: number;
  completion_percent: number;
  adjusted_tenure_months: number;
}

export interface LoanAmortizationRow {
  month: number;
  date: string;
  emi: number;
  principal_component: number;
  interest_component: number;
  part_payment_amount: number;
  outstanding_balance: number;
}

export interface LoanSimulation {
  target_months: number;
  new_emi: number;
  total_payable: number;
  total_interest: number;
  interest_saved: number;
  months_saved: number;
}

export interface Loan {
  id?: number;
  name: string;
  lender?: string;
  principal_amount: number;
  annual_rate: number;
  tenure_months: number;
  start_date: string;
  emi_amount: number;
  emis_paid: number;
  is_closed?: boolean;
  closed_at?: string;
  notes?: string;
  created_at?: string;
  summary?: LoanSummary;
  part_payments?: LoanPartPayment[];
  expense_category?: Category;
  expense_subcategory?: SubCategory;
  expense_item?: Item;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon?: string;
  tab: string;
  isSystem: boolean;
  filters: {
    field: string;
    condition: string;
    value: string;
    label?: string;
  }[];
}

export type ImportStrategy = 'CREATE_IF_MISSING' | 'STRICT';
export type ImportJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface ImportColumnMapping {
  date?: number;
  type?: number;
  description?: number;
  amount?: number;
  category?: number;
  sub_category?: number;
  item?: number;
  payment_mode?: number;
  notes?: number;
  direction?: number;
  status?: number;
  reference_no?: number;
  include_in_budget?: number;
}

export interface ImportPreviewResult {
  detected_headers: string[];
  suggested_mapping: ImportColumnMapping;
}

export interface ImportFailedRow {
  row: number;
  reason: string;
}

export interface ImportJob {
  id: number;
  file_name: string;
  format: string;
  strategy: ImportStrategy;
  column_mapping: string;
  status: ImportJobStatus;
  imported_count: number;
  failed_count: number;
  failed_rows?: string; // JSON string representing ImportFailedRow[]
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface GroupMember {
  id: number;
  group_id: number;
  group_name: string;
  user_id: number;
  username: string;
  display_name?: string;
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REMOVED' | 'LEFT';
  invited_at: string;
  expires_at: string;
  accepted_at?: string;
  invited_by_username?: string;
}

export type GroupInvitation = GroupMember;


