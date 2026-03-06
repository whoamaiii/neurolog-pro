import { createContext, useContext } from 'react';
import type { ContextType } from '../types';

export interface AppContextType {
    currentContext: ContextType;
    setCurrentContext: (context: ContextType) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within a DataProvider');
    }
    return context;
};
