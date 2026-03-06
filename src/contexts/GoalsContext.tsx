import { createContext, useContext } from 'react';
import type { Goal, GoalProgress } from '../types';

export interface GoalsContextType {
    goals: Goal[];
    addGoal: (goal: Goal) => void;
    updateGoal: (id: string, updates: Partial<Goal>) => void;
    deleteGoal: (id: string) => void;
    addGoalProgress: (goalId: string, progress: Omit<GoalProgress, 'id' | 'goalId'>) => void;
    getGoalProgress: (goalId: string) => GoalProgress[];
    getOverallProgress: () => number;
}

export const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export const useGoals = () => {
    const context = useContext(GoalsContext);
    if (context === undefined) {
        throw new Error('useGoals must be used within a DataProvider');
    }
    return context;
};
