/**
 * Safe localStorage parsing utility.
 * Returns a fallback value if the stored data is missing or corrupted,
 * preventing JSON.parse errors from crashing the application.
 */
export function safeParseStorage<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        console.error(`Corrupted localStorage key "${key}", using fallback`);
        return fallback;
    }
}
