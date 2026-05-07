import { api } from './api';
import { Personalization } from '../types';

export const personalizationService = {
  getAll: () => api.getPersonalizations(),
  getByCategory: (category: string) => api.getPersonalizationsByCategory(category),
  save: (personalization: Partial<Personalization>) => api.savePersonalization(personalization),
  delete: (category: string, key: string) => api.deletePersonalization(category, key)
};
