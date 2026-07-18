import { BASE_URL, fetchWithCredentials, handleResponse } from './common';
import { Profile } from '../../types';

export const accountsApi = {
  getProfile: async (): Promise<Profile> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/profile`);
    return handleResponse(response);
  },

  checkUsernameAvailability: async (username: string): Promise<{ available: boolean }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/check-username?username=${encodeURIComponent(username)}`);
    return handleResponse(response);
  },

  updateProfile: async (displayName: string, profilePicture: string, username?: string): Promise<Profile> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/profile`, {
      method: 'PUT',
      body: JSON.stringify({ displayName, profilePicture, username }),
    });
    return handleResponse(response);
  },

  resetPassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    await handleResponse(response);
  },

  deleteAccount: async (currentPassword: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account`, {
      method: 'DELETE',
      body: JSON.stringify({ currentPassword }),
    });
    await handleResponse(response);
  },

  initiateResetMfa: async (currentPassword: string): Promise<{ secret: string; otpAuthTotpURL: string }> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/reset-mfa/initiate`, {
      method: 'POST',
      body: JSON.stringify({ currentPassword }),
    });
    return handleResponse(response);
  },

  confirmResetMfa: async (code: number): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/account/reset-mfa/confirm`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    await handleResponse(response);
  }
};
