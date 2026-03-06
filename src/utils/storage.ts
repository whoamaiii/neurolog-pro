/**
 * Storage resilience layer for localStorage operations.
 * Provides quota monitoring, error handling, and backup utilities.
 */

const STORAGE_PREFIX = 'neurolog_';

export const StorageManager = {
  getItem<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Failed to parse stored data:', e);      return null;
    }
  },

  setItem(key: string, value: unknown): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        console.error('[StorageManager] localStorage quota exceeded. Data was NOT saved.');
      }
      return false;
    }
  },

  getUsageEstimate(): { usedBytes: number; quotaBytes: number; usagePercent: number } {
    let usedBytes = 0;
    const quotaBytes = 5 * 1024 * 1024; // 5MB typical limit

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          // Each char in JS is 2 bytes (UTF-16)
          usedBytes += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2;
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Failed to read from localStorage:', e);    }

    return {
      usedBytes,
      quotaBytes,
      usagePercent: Math.round((usedBytes / quotaBytes) * 100),
    };
  },

  getAppUsageEstimate(): { usedBytes: number; keyCount: number } {
    let usedBytes = 0;
    let keyCount = 0;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith(STORAGE_PREFIX)) {
          keyCount++;
          usedBytes += (key.length + (localStorage.getItem(key)?.length ?? 0)) * 2;
        }
      }
    } catch (e) {
      if (import.meta.env.DEV) console.warn('Failed to read from localStorage:', e);    }

    return { usedBytes, keyCount };
  },

  isQuotaWarning(): boolean {
    const { usagePercent } = this.getUsageEstimate();
    return usagePercent >= 80;
  },
};
