import { describe, it, expect, beforeEach, vi } from 'vitest';
import { safeParseStorage } from '../safeStorage';

describe('safeParseStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('returns fallback when key does not exist', () => {
        const result = safeParseStorage('nonexistent', []);
        expect(result).toEqual([]);
    });

    it('returns parsed value for valid JSON', () => {
        localStorage.setItem('test-key', JSON.stringify([1, 2, 3]));
        const result = safeParseStorage<number[]>('test-key', []);
        expect(result).toEqual([1, 2, 3]);
    });

    it('returns parsed object for valid JSON object', () => {
        const obj = { name: 'test', value: 42 };
        localStorage.setItem('test-obj', JSON.stringify(obj));
        const result = safeParseStorage('test-obj', {});
        expect(result).toEqual(obj);
    });

    it('returns fallback for corrupted data', () => {
        localStorage.setItem('corrupted', '{invalid json!!!');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const result = safeParseStorage('corrupted', 'fallback');
        expect(result).toBe('fallback');
        consoleSpy.mockRestore();
    });

    it('returns null fallback correctly', () => {
        const result = safeParseStorage<null>('nonexistent', null);
        expect(result).toBeNull();
    });

    it('parses null stored value correctly', () => {
        localStorage.setItem('null-val', 'null');
        const result = safeParseStorage('null-val', 'default');
        expect(result).toBeNull();
    });
});
