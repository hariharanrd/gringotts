
export type ReportingMode = 'CONSUMPTION' | 'CASH_FLOW';

export interface DashboardSummary {
  mode?: ReportingMode;
  range: string;
  start_date: string;
  end_date: string;
  total_expenses: number;
  consumption_expenses?: number;
  cash_flow_expenses?: number;
  loan_financed_spending?: number;
  credit_card_spending?: number;
  direct_cash_spending?: number;
  loan_repayment_spending?: number;
  total_incomes: number;
  total_savings: number;
  net_balance: number;
  expense_count: number;
  income_count: number;
  saving_count: number;
  total_i_owe: number;
  total_others_owe_me: number;
  category_breakdown: Record<string, number>;
  savings_breakdown: Record<string, number>;
  recent_transactions: Array<{
    id: number;
    description: string;
    value: number;
    transaction_time: string;
    category?: { id: number; name: string; icon?: string; color?: string };
    subcategory?: { id: number; name: string };
    item?: { id: number; name: string };
  }>;
  credit_card_bills: {
    overdue_amount: number;
    pending_amount: number;
    overdue_count: number;
    pending_count: number;
    oldest_overdue_due_date?: string;
    nearest_pending_due_date?: string;
  };
}

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

export interface GroupCategory {
  id: number;
  group_id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  created_at?: string;
}

export type GroupBudgetType = 'OVERALL' | 'RECURRING_MONTHLY';

export interface GroupBudgetCategoryAllocation {
  id?: number;
  group_category?: GroupCategory;
  allocated_amount: number;
}

export interface GroupBudget {
  id?: number;
  group_id?: number;
  name: string;
  budget_type: GroupBudgetType;
  month?: number | null;
  year?: number | null;
  total_amount: number;
  notes?: string;
  created_at?: string;
  allocations?: GroupBudgetCategoryAllocation[];
}

export interface GroupCategoryAllocationUtilization {
  allocation_id?: number;
  group_category?: GroupCategory;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  percentage_used: number;
}

export interface GroupBudgetUtilization {
  has_budget: boolean;
  budget?: GroupBudget;
  budget_type?: GroupBudgetType;
  total_budget?: number;
  total_spent?: number;
  remaining?: number;
  percentage_used?: number;
  uncategorized_spent?: number;
  target_month?: number;
  target_year?: number;
  allocations?: GroupCategoryAllocationUtilization[];
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
  use_group_categories?: boolean;
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
  funding_loan?: Loan;
  funding_loan_id?: number;
  funding_loan_name?: string;
  loan_id?: number;
  loan_payment_type?: 'EMI' | 'PART_PAYMENT';
  loan_name?: string;
  group?: TransactionGroup;
  group_category?: GroupCategory;
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
  current_value?: number | null;
  last_value_updated_at?: string | null;
  monthly_contribution: number;
  annual_rate: number;
  notes?: string;
  created_at?: string;
  tags?: InvestmentGoalTag[];
  years_to_goal?: number | null;
  percent_achieved?: number;
  percent_invested?: number;
  active_invested?: number;
  progress_value?: number;
  returns_amount?: number | null;
  returns_percent?: number | null;
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
  funding_loan?: Loan;
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
  minimum_due: number;
  due_date: string;
  is_paid: boolean;
  paid_at?: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  created_at: string;
  last_active_at: string;
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
  total_funded?: number;
  available_to_fund?: number;
  funded_percent?: number;
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
  total_funded?: number;
  available_to_fund?: number;
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
  user?: {
    id: number;
    username: string;
    display_name: string;
    profile_picture?: string;
  };
  role: 'ADMIN' | 'MEMBER';
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REMOVED' | 'LEFT';
  invited_at: string;
  expires_at: string;
  accepted_at?: string;
  invited_by_username?: string;
}

export type GroupInvitation = GroupMember;

export interface MemberBreakdownItem {
  user_id: number;
  username: string;
  display_name: string;
  total_expenses: number;
  total_incomes: number;
  total_savings: number;
  transaction_count: number;
  percentage: number;
  category_breakdown: Record<string, number>;
}

export interface GroupStatistics {
  total_expenses: number;
  total_incomes: number;
  total_savings: number;
  category_breakdown: Record<string, number>;
  subcategory_breakdown?: Record<string, number>;
  item_breakdown?: Record<string, number>;
  has_subcategory_data?: boolean;
  has_item_data?: boolean;
  member_breakdown?: MemberBreakdownItem[];
}

export interface ParsedTransaction {
  transaction_type: TransactionType;
  value: number;
  description: string;
  transaction_date: string;
  payment_mode?: string;
  category_id?: number;
  category_name?: string;
  subcategory_id?: number;
  subcategory_name?: string;
  item_id?: number;
  item_name?: string;
  credit_card_id?: number;
  credit_card_nickname?: string;
  notes?: string;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning?: string;
}

export type GoblinActionType = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'CONVERSATIONAL';

export interface ApiSearchCriteria {
  field: string;
  condition: string;
  value: string;
}

export interface TransactionSearchFilter {
  target_api?: 'EXPENSE' | 'INCOME' | 'SAVING' | 'REVOLVING' | 'TRANSACTION';
  page?: number;
  size?: number;
  direction?: 'ASC' | 'DESC';
  criteria?: ApiSearchCriteria[];
  query?: string;
  type?: TransactionType;
  category_id?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface GoblinActionPayload {
  action_type: GoblinActionType;
  goblin_response: string;
  parsed_transaction?: ParsedTransaction;
  target_transaction_id?: number;
  target_transaction?: Transaction;
  search_filter?: TransactionSearchFilter;
  update_fields?: Partial<ParsedTransaction>;
}

export interface GoblinParseResult {
  goblinResponse: string;
  actionPayload: GoblinActionPayload;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsedTransaction?: ParsedTransaction;
  goblinAction?: GoblinActionPayload;
  queryResults?: Transaction[];
  transactionSaved?: boolean;
  transactionUpdated?: boolean;
  transactionDeleted?: boolean;
  savedTransactionId?: number;
  timestamp: string;
}




