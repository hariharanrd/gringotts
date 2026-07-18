import { BASE_URL, fetchWithCredentials, handleResponse } from './common';
import { UserSession } from '../../types';

export const sessionsApi = {
  getSessions: async (): Promise<{ data: UserSession[], total_count: number }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/sessions`);
    return handleResponse(response);
  },
  
  revokeSession: async (id: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/sessions/${id}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  }
};
