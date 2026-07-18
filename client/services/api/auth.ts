import { BASE_URL, fetchWithCredentials, handleResponse } from './common';

export const authApi = {
  checkAuth: async () => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/me`);
    if (response.status === 403) {
      throw new Error('Not authenticated');
    }
    return true;
  },
  
  checkUsernameAvailabilityPublic: async (username: string): Promise<{ available: boolean }> => {
    const response = await fetch(`${BASE_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
    return handleResponse(response);
  },

  initiateForgotPasswordPublic: async (username: string): Promise<{ status: string; maskedEmail: string }> => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    return handleResponse(response);
  },

  confirmForgotPasswordPublic: async (username: string, recoveryEmail: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${BASE_URL}/auth/forgot-password/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, recoveryEmail }),
    });
    return handleResponse(response);
  },

  resetPasswordPublic: async (token: string, newPassword: string): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleResponse(response);
  },

  initiateRecoveryEmailVerification: async (recoveryEmail: string): Promise<{ status: string; message: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/recovery-email/initiate-verification`, {
      method: 'POST',
      body: JSON.stringify({ recoveryEmail }),
    });
    return handleResponse(response);
  },

  confirmRecoveryEmailVerification: async (otp: string): Promise<{ status: string; message: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/recovery-email/confirm`, {
      method: 'POST',
      body: JSON.stringify({ otp }),
    });
    return handleResponse(response);
  },

  clearRecoveryEmail: async (): Promise<{ status: string; message: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/auth/recovery-email`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  }
};
