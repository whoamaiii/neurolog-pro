import { createContext, useContext } from 'react';

export interface SettingsContextType {
    hasCompletedOnboarding: boolean;
    completeOnboarding: () => void;
    refreshData: () => void;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a DataProvider');
    }
    return context;
};
