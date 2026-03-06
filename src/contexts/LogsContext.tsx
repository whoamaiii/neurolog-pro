import { createContext, useContext } from 'react';
import type { LogEntry, ContextType } from '../types';

export interface LogsContextType {
    logs: LogEntry[];
    addLog: (log: Omit<LogEntry, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'>) => void;
    updateLog: (id: string, updates: Partial<LogEntry>) => void;
    deleteLog: (id: string) => void;
    getLogsByDateRange: (startDate: Date, endDate: Date) => LogEntry[];
    getLogsByContext: (context: ContextType) => LogEntry[];
}

export const LogsContext = createContext<LogsContextType | undefined>(undefined);

export const useLogs = () => {
    const context = useContext(LogsContext);
    if (context === undefined) {
        throw new Error('useLogs must be used within a DataProvider');
    }
    return context;
};
