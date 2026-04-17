/**
 * 🛡️ Storage Adapter Utility
 * Decouples the application from direct localStorage access.
 * Includes "Safe Mode" and error suppression to avoid app crashes.
 */

const APP_PREFIX = 'ohada_';

export const storageAdapter = {
  /**
   * Safe set item with fallback
   */
  setItem: (key: string, value: any): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      const stringifiedValue = JSON.stringify(value);
      window.localStorage.setItem(`${APP_PREFIX}${key}`, stringifiedValue);
      return true;
    } catch (error) {
      console.error('Storage Error (setItem):', error);
      // Fallback: If localStorage is full, we could use session storage or just fail gracefully.
      return false;
    }
  },

  /**
   * Safe get item with validation
   */
  getItem: <T>(key: string, defaultValue: T): T => {
    try {
      if (typeof window === 'undefined') return defaultValue;
      const item = window.localStorage.getItem(`${APP_PREFIX}${key}`);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch (error) {
      console.error('Storage Error (getItem):', error);
      return defaultValue;
    }
  },

  /**
   * Remove item
   */
  removeItem: (key: string): void => {
    try {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(`${APP_PREFIX}${key}`);
    } catch (error) {
      console.error('Storage Error (removeItem):', error);
    }
  },

  /**
   * Clear all app-specific keys
   */
  clearAll: (): void => {
    try {
      if (typeof window === 'undefined') return;
      Object.keys(window.localStorage)
        .filter(key => key.startsWith(APP_PREFIX))
        .forEach(key => window.localStorage.removeItem(key));
    } catch (error) {
      console.error('Storage Error (clearAll):', error);
    }
  }
};
