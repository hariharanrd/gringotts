import { BASE_URL, fetchWithCredentials, handleResponseAndGetData, handleResponse } from './common';
import { Personalization } from '../../types';

export const personalizationApi = {
  getPersonalizations: async (): Promise<Personalization[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations`);
    return handleResponseAndGetData(response);
  },

  getPersonalizationsByCategory: async (category: string): Promise<Personalization[]> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations/${category}`);
    return handleResponseAndGetData(response);
  },

  savePersonalization: async (data: Partial<Personalization>): Promise<Personalization> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponseAndGetData(response);
  },

  deletePersonalization: async (category: string, key: string): Promise<void> => {
    const response = await fetchWithCredentials(`${BASE_URL}/personalizations/${category}/${key}`, {
      method: 'DELETE',
    });
    await handleResponse(response);
  }
};
