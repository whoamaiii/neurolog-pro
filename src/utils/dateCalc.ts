/**
 * Shared date calculation utilities
 */

/** 30 days expressed in milliseconds */
export const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/** Calculate the total number of days spanned by a set of timestamped logs */
export const calculateTotalDays = (logs: { timestamp: string }[]): number => {
    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    return Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};
