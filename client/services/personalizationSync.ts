import { api } from './api';

export const personalizationSync = {
  /**
   * Fetches all personalizations from backend and updates localStorage.
   */
  async syncFromBackend() {
    try {
      const personalizations = await api.getPersonalizations();
      personalizations.forEach(p => {
        const storageKey = this.getStorageKey(p.category, p.configKey);
        if (storageKey) {
          localStorage.setItem(storageKey, p.configValue);
        }
      });
      window.dispatchEvent(new CustomEvent('personalization-sync-done', { detail: personalizations }));
    } catch (error) {
      console.error('Failed to sync personalizations from backend:', error);
    }
  },

  /**
   * Saves a personalization to both localStorage and backend.
   */
  async save(category: string, key: string, value: string) {
    const storageKey = this.getStorageKey(category, key);
    if (storageKey) {
      localStorage.setItem(storageKey, value);
    }
    
    try {
      await api.savePersonalization({ category, configKey: key, configValue: value });
    } catch (error) {
      console.error(`Failed to save personalization (${category}:${key}) to backend:`, error);
    }
  },

  /**
   * Maps backend category/key to localStorage keys.
   */
  getStorageKey(category: string, key: string): string | null {
    if (category === 'UI' && key === 'THEME') return 'gringotts-theme';
    if (category === 'FILTERS' && key === 'TRANSACTION') return 'gringotts_transaction_filters';
    if (category === 'FILTERS' && key === 'DASHBOARD_RANGE') return 'dashboard_range';
    if (category === 'UI' && key === 'TIMEZONE') return 'gringotts-timezone';
    if (category === 'COLUMNS') return `gringotts_columns_${key.toLowerCase()}`;
    return null;
  },

  /**
   * Maps localStorage keys to backend category/key.
   */
  getBackendKey(storageKey: string): { category: string, key: string } | null {
    if (storageKey === 'gringotts-theme') return { category: 'UI', key: 'THEME' };
    if (storageKey === 'gringotts_transaction_filters') return { category: 'FILTERS', key: 'TRANSACTION' };
    if (storageKey === 'dashboard_range') return { category: 'FILTERS', key: 'DASHBOARD_RANGE' };
    if (storageKey === 'gringotts-timezone') return { category: 'UI', key: 'TIMEZONE' };
    if (storageKey.startsWith('gringotts_columns_')) {
      return { category: 'COLUMNS', key: storageKey.replace('gringotts_columns_', '').toUpperCase() };
    }
    return null;
  }
};
