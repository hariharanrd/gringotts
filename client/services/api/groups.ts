import { BASE_URL, fetchWithCredentials, handleResponse } from './common';
import { TransactionGroup, Transaction, GroupMember, GroupInvitation } from '../../types';

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
  }
};
