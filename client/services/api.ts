import { authApi } from './api/auth';
import { transactionsApi } from './api/transactions';
import { categoriesApi } from './api/categories';
import { schedulesApi } from './api/schedules';
import { budgetsApi } from './api/budgets';
import { goalsApi } from './api/goals';
import { accountsApi } from './api/accounts';
import { creditCardsApi } from './api/creditCards';
import { personalizationApi } from './api/personalization';
import { sessionsApi } from './api/sessions';
import { loansApi } from './api/loans';
import { groupsApi } from './api/groups';

export const api = {
  ...authApi,
  ...transactionsApi,
  ...categoriesApi,
  ...schedulesApi,
  ...budgetsApi,
  ...goalsApi,
  ...accountsApi,
  ...creditCardsApi,
  ...personalizationApi,
  ...sessionsApi,
  ...loansApi,
  ...groupsApi
};
