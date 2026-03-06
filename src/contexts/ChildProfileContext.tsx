import { createContext, useContext } from 'react';
import type { ChildProfile } from '../types';

export interface ChildProfileContextType {
    childProfile: ChildProfile | null;
    setChildProfile: (profile: ChildProfile) => void;
    updateChildProfile: (updates: Partial<ChildProfile>) => void;
    clearChildProfile: () => void;
}

export const ChildProfileContext = createContext<ChildProfileContextType | undefined>(undefined);

export const useChildProfile = () => {
    const context = useContext(ChildProfileContext);
    if (context === undefined) {
        throw new Error('useChildProfile must be used within a DataProvider');
    }
    return context;
};
