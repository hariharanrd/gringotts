import { BASE_URL, fetchWithCredentials, handleResponse } from './common';
import { TransactionGroup, Transaction, GroupMember, GroupInvitation, GroupCategory, GroupBudget, GroupBudgetUtilization } from '../../types';

export const groupsApi = {
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

  getGroupMembers: async (groupId: number): Promise<{ data: GroupMember[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/members`);
    return handleResponse(response);
  },

  getTransactionGroupTransactionsPaginated: async (groupId: number, page: number, size: number): Promise<{ data: Transaction[], total_count: number, has_more: boolean }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/transactions?page=${page}&size=${size}`);
    return handleResponse(response);
  },

  inviteGroupMember: async (groupId: number, identifier: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/invite`, {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
    await handleResponse(response);
  },

  removeGroupMember: async (groupId: number, userId: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  leaveGroup: async (groupId: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/leave`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  getPendingGroupInvitations: async (): Promise<{ data: GroupInvitation[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/invitations`);
    return handleResponse(response);
  },

  acceptGroupInvitation: async (memberId: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/invitations/${memberId}/accept`, {
      method: 'POST',
    });
    await handleResponse(response);
  },

  declineGroupInvitation: async (memberId: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/invitations/${memberId}/decline`, {
      method: 'POST',
    });
    await handleResponse(response);
  },

  getGroupCategories: async (groupId: number): Promise<{ data: GroupCategory[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/categories`);
    return handleResponse(response);
  },

  createGroupCategory: async (groupId: number, data: Partial<GroupCategory>): Promise<GroupCategory> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  updateGroupCategory: async (groupId: number, catId: number, data: Partial<GroupCategory>): Promise<GroupCategory> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/categories/${catId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  deleteGroupCategory: async (groupId: number, catId: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/categories/${catId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  getGroupBudget: async (groupId: number, month?: number, year?: number): Promise<GroupBudget | null> => {
    const query = month && year ? `?month=${month}&year=${year}` : '';
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/budget${query}`);
    const result = await handleResponse(response);
    return result.data && Object.keys(result.data).length > 0 ? result.data : null;
  },

  saveGroupBudget: async (groupId: number, data: Partial<GroupBudget>): Promise<GroupBudget> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/budget`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await handleResponse(response);
    return result.data;
  },

  deleteGroupBudget: async (groupId: number, budgetId: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/budget/${budgetId}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  },

  getGroupBudgetUtilization: async (groupId: number, month?: number, year?: number): Promise<GroupBudgetUtilization> => {
    const query = month && year ? `?month=${month}&year=${year}` : '';
    const response = await fetchWithCredentials(`${BASE_URL}/transaction-groups/${groupId}/budget/utilization${query}`);
    const result = await handleResponse(response);
    return result.data;
  }
};

