import { createContext, useContext } from 'react';
import type { ScheduleEntry, DailyScheduleTemplate } from '../types';

export interface ScheduleContextType {
    scheduleEntries: ScheduleEntry[];
    scheduleTemplates: DailyScheduleTemplate[];
    addScheduleEntry: (entry: ScheduleEntry) => void;
    updateScheduleEntry: (id: string, updates: Partial<ScheduleEntry>) => void;
    deleteScheduleEntry: (id: string) => void;
    getEntriesByDate: (date: string) => ScheduleEntry[];
    addTemplate: (template: DailyScheduleTemplate) => void;
    updateTemplate: (id: string, updates: Partial<DailyScheduleTemplate>) => void;
    deleteTemplate: (id: string) => void;
    getCompletionRate: (dateRange?: { start: Date; end: Date }) => number;
}

export const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

export const useSchedule = () => {
    const context = useContext(ScheduleContext);
    if (context === undefined) {
        throw new Error('useSchedule must be used within a DataProvider');
    }
    return context;
};
