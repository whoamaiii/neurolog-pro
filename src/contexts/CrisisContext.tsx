import { createContext, useContext } from 'react';
import type { CrisisEvent } from '../types';

export interface CrisisContextType {
    crisisEvents: CrisisEvent[];
    addCrisisEvent: (event: Omit<CrisisEvent, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'>) => void;
    updateCrisisEvent: (id: string, updates: Partial<CrisisEvent>) => void;
    deleteCrisisEvent: (id: string) => void;
    getCrisisByDateRange: (startDate: Date, endDate: Date) => CrisisEvent[];
    getAverageCrisisDuration: () => number;
    getCrisisCountByType: () => Record<string, number>;
}

export const CrisisContext = createContext<CrisisContextType | undefined>(undefined);

export const useCrisis = () => {
    const context = useContext(CrisisContext);
    if (context === undefined) {
        throw new Error('useCrisis must be used within a DataProvider');
    }
    return context;
};
