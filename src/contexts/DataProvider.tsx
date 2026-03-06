import React, { useState, useCallback, type ReactNode } from 'react';
import type {
    LogEntry,
    CrisisEvent,
    ScheduleEntry,
    Goal,
    GoalProgress,
    GoalStatus,
    ContextType,
    DailyScheduleTemplate,
    ChildProfile
} from '../types';
import { enrichLogEntry, enrichCrisisEvent } from '../types';
import { STORAGE_KEYS } from './storageKeys';
import { LogsContext } from './LogsContext';
import type { LogsContextType } from './LogsContext';
import { CrisisContext } from './CrisisContext';
import type { CrisisContextType } from './CrisisContext';
import { ScheduleContext } from './ScheduleContext';
import type { ScheduleContextType } from './ScheduleContext';
import { GoalsContext } from './GoalsContext';
import type { GoalsContextType } from './GoalsContext';
import { AppContext } from './AppContext';
import type { AppContextType } from './AppContext';
import { ChildProfileContext } from './ChildProfileContext';
import type { ChildProfileContextType } from './ChildProfileContext';
import { SettingsContext } from './SettingsContext';
import type { SettingsContextType } from './SettingsContext';

// ============================================
// MIGRATION: kreativium_* -> neurolog_*
// ============================================
const OLD_STORAGE_KEYS = [
    'kreativium_logs',
    'kreativium_crisis_events',
    'kreativium_schedule_entries',
    'kreativium_schedule_templates',
    'kreativium_goals',
    'kreativium_current_context',
    'kreativium_child_profile',
    'kreativium_onboarding_completed'
] as const;

function migrateStorageKeys(): void {
    try {
        for (const oldKey of OLD_STORAGE_KEYS) {
            const newKey = oldKey.replace('kreativium_', 'neurolog_');
            const oldData = localStorage.getItem(oldKey);
            if (oldData !== null) {
                // Only migrate if the new key doesn't already have data
                if (localStorage.getItem(newKey) === null) {
                    localStorage.setItem(newKey, oldData);
                }
                localStorage.removeItem(oldKey);
            }
        }
    } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to migrate storage key:', e);    }
}

// ============================================
// HELPER: Safe localStorage getter with parsing
// ============================================
function getStorageItem<T>(key: string, fallback: T): T {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to parse stored data:', e);        return fallback;
    }
}

function getStorageString<T extends string>(key: string, fallback: T): T {
    try {
        const item = localStorage.getItem(key);
        return (item as T) ?? fallback;
    } catch (e) {
        if (import.meta.env.DEV) console.warn('Failed to read from localStorage:', e);        return fallback;
    }
}

// ============================================
// COMBINED PROVIDER
// ============================================
export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Migrate old kreativium_* keys to neurolog_* on first load
    useState(() => { migrateStorageKeys(); });

    // State with lazy initializers - loads from localStorage during initial render
    const [logs, setLogs] = useState<LogEntry[]>(() => getStorageItem(STORAGE_KEYS.LOGS, []));
    const [crisisEvents, setCrisisEvents] = useState<CrisisEvent[]>(() => getStorageItem(STORAGE_KEYS.CRISIS_EVENTS, []));
    const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>(() => getStorageItem(STORAGE_KEYS.SCHEDULE_ENTRIES, []));
    const [scheduleTemplates, setScheduleTemplates] = useState<DailyScheduleTemplate[]>(() => getStorageItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, []));
    const [goals, setGoals] = useState<Goal[]>(() => getStorageItem(STORAGE_KEYS.GOALS, []));
    const [currentContext, setCurrentContextState] = useState<ContextType>(() => getStorageString(STORAGE_KEYS.CURRENT_CONTEXT, 'home'));
    const [childProfile, setChildProfileState] = useState<ChildProfile | null>(() => getStorageItem(STORAGE_KEYS.CHILD_PROFILE, null));
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => getStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETED, false));

    // Refresh function to reload from localStorage (for external sync)
    const loadFromStorage = useCallback(() => {
        try {
            setLogs(getStorageItem(STORAGE_KEYS.LOGS, []));
            setCrisisEvents(getStorageItem(STORAGE_KEYS.CRISIS_EVENTS, []));
            setScheduleEntries(getStorageItem(STORAGE_KEYS.SCHEDULE_ENTRIES, []));
            setScheduleTemplates(getStorageItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, []));
            setGoals(getStorageItem(STORAGE_KEYS.GOALS, []));
            setCurrentContextState(getStorageString(STORAGE_KEYS.CURRENT_CONTEXT, 'home'));
            setChildProfileState(getStorageItem(STORAGE_KEYS.CHILD_PROFILE, null));
            setHasCompletedOnboarding(getStorageItem(STORAGE_KEYS.ONBOARDING_COMPLETED, false));
        } catch (e) {
            if (import.meta.env.DEV) {
                console.error('Failed to load data from localStorage', e);
            }
        }
    }, []);

    // Save functions
    const saveLogs = useCallback((newLogs: LogEntry[]) => {
        setLogs(newLogs);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(newLogs));
    }, []);

    const saveCrisisEvents = useCallback((newEvents: CrisisEvent[]) => {
        setCrisisEvents(newEvents);
        localStorage.setItem(STORAGE_KEYS.CRISIS_EVENTS, JSON.stringify(newEvents));
    }, []);

    const saveScheduleEntries = useCallback((newEntries: ScheduleEntry[]) => {
        setScheduleEntries(newEntries);
        localStorage.setItem(STORAGE_KEYS.SCHEDULE_ENTRIES, JSON.stringify(newEntries));
    }, []);

    const saveScheduleTemplates = useCallback((newTemplates: DailyScheduleTemplate[]) => {
        setScheduleTemplates(newTemplates);
        localStorage.setItem(STORAGE_KEYS.SCHEDULE_TEMPLATES, JSON.stringify(newTemplates));
    }, []);

    const saveGoals = useCallback((newGoals: Goal[]) => {
        setGoals(newGoals);
        localStorage.setItem(STORAGE_KEYS.GOALS, JSON.stringify(newGoals));
    }, []);

    const setCurrentContext = useCallback((context: ContextType) => {
        setCurrentContextState(context);
        localStorage.setItem(STORAGE_KEYS.CURRENT_CONTEXT, context);
    }, []);

    // Child Profile save functions
    const setChildProfile = useCallback((profile: ChildProfile) => {
        setChildProfileState(profile);
        localStorage.setItem(STORAGE_KEYS.CHILD_PROFILE, JSON.stringify(profile));
    }, []);

    const updateChildProfile = useCallback((updates: Partial<ChildProfile>) => {
        setChildProfileState(prev => {
            if (!prev) return prev;
            const updated = { ...prev, ...updates, updatedAt: new Date().toISOString() };
            localStorage.setItem(STORAGE_KEYS.CHILD_PROFILE, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearChildProfile = useCallback(() => {
        setChildProfileState(null);
        localStorage.removeItem(STORAGE_KEYS.CHILD_PROFILE);
    }, []);

    // Settings methods
    const completeOnboarding = useCallback(() => {
        setHasCompletedOnboarding(true);
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, 'true');
    }, []);

    // ============================================
    // LOGS METHODS
    // ============================================
    const addLog = useCallback((log: Omit<LogEntry, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'>) => {
        const enrichedLog = enrichLogEntry(log);
        saveLogs([enrichedLog, ...logs]);
    }, [logs, saveLogs]);

    const updateLog = useCallback((id: string, updates: Partial<LogEntry>) => {
        saveLogs(logs.map(log => log.id === id ? { ...log, ...updates } : log));
    }, [logs, saveLogs]);

    const deleteLog = useCallback((id: string) => {
        saveLogs(logs.filter(log => log.id !== id));
    }, [logs, saveLogs]);

    const getLogsByDateRange = useCallback((startDate: Date, endDate: Date) => {
        return logs.filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }, [logs]);

    const getLogsByContext = useCallback((context: ContextType) => {
        return logs.filter(log => log.context === context);
    }, [logs]);

    // ============================================
    // CRISIS METHODS
    // ============================================
    const addCrisisEvent = useCallback((event: Omit<CrisisEvent, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'>) => {
        const enrichedEvent = enrichCrisisEvent(event);
        saveCrisisEvents([enrichedEvent, ...crisisEvents]);
    }, [crisisEvents, saveCrisisEvents]);

    const updateCrisisEvent = useCallback((id: string, updates: Partial<CrisisEvent>) => {
        saveCrisisEvents(crisisEvents.map(e => e.id === id ? { ...e, ...updates } : e));
    }, [crisisEvents, saveCrisisEvents]);

    const deleteCrisisEvent = useCallback((id: string) => {
        saveCrisisEvents(crisisEvents.filter(e => e.id !== id));
    }, [crisisEvents, saveCrisisEvents]);

    const getCrisisByDateRange = useCallback((startDate: Date, endDate: Date) => {
        return crisisEvents.filter(event => {
            const eventDate = new Date(event.timestamp);
            return eventDate >= startDate && eventDate <= endDate;
        });
    }, [crisisEvents]);

    const getAverageCrisisDuration = useCallback(() => {
        if (crisisEvents.length === 0) return 0;
        const totalSeconds = crisisEvents.reduce((sum, e) => sum + e.durationSeconds, 0);
        return Math.round(totalSeconds / crisisEvents.length);
    }, [crisisEvents]);

    const getCrisisCountByType = useCallback(() => {
        return crisisEvents.reduce((acc, e) => {
            acc[e.type] = (acc[e.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [crisisEvents]);

    // ============================================
    // SCHEDULE METHODS
    // ============================================
    const addScheduleEntry = useCallback((entry: ScheduleEntry) => {
        saveScheduleEntries([...scheduleEntries, entry]);
    }, [scheduleEntries, saveScheduleEntries]);

    const updateScheduleEntry = useCallback((id: string, updates: Partial<ScheduleEntry>) => {
        saveScheduleEntries(scheduleEntries.map(e => e.id === id ? { ...e, ...updates } : e));
    }, [scheduleEntries, saveScheduleEntries]);

    const deleteScheduleEntry = useCallback((id: string) => {
        saveScheduleEntries(scheduleEntries.filter(e => e.id !== id));
    }, [scheduleEntries, saveScheduleEntries]);

    const getEntriesByDate = useCallback((date: string) => {
        return scheduleEntries.filter(e => e.date === date);
    }, [scheduleEntries]);

    const addTemplate = useCallback((template: DailyScheduleTemplate) => {
        saveScheduleTemplates([...scheduleTemplates, template]);
    }, [scheduleTemplates, saveScheduleTemplates]);

    const updateTemplate = useCallback((id: string, updates: Partial<DailyScheduleTemplate>) => {
        saveScheduleTemplates(scheduleTemplates.map(t => t.id === id ? { ...t, ...updates } : t));
    }, [scheduleTemplates, saveScheduleTemplates]);

    const deleteTemplate = useCallback((id: string) => {
        saveScheduleTemplates(scheduleTemplates.filter(t => t.id !== id));
    }, [scheduleTemplates, saveScheduleTemplates]);

    const getCompletionRate = useCallback((dateRange?: { start: Date; end: Date }) => {
        let entries = scheduleEntries;
        if (dateRange) {
            entries = entries.filter(e => {
                const date = new Date(e.date);
                return date >= dateRange.start && date <= dateRange.end;
            });
        }
        if (entries.length === 0) return 0;
        const completed = entries.filter(e => e.status === 'completed').length;
        return Math.round((completed / entries.length) * 100);
    }, [scheduleEntries]);

    // ============================================
    // GOALS METHODS
    // ============================================
    const addGoal = useCallback((goal: Goal) => {
        saveGoals([...goals, goal]);
    }, [goals, saveGoals]);

    const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
        saveGoals(goals.map(g => g.id === id ? { ...g, ...updates } : g));
    }, [goals, saveGoals]);

    const deleteGoal = useCallback((id: string) => {
        saveGoals(goals.filter(g => g.id !== id));
    }, [goals, saveGoals]);

    const addGoalProgress = useCallback((goalId: string, progress: Omit<GoalProgress, 'id' | 'goalId'>) => {
        const newProgress: GoalProgress = {
            ...progress,
            id: crypto.randomUUID(),
            goalId
        };
        saveGoals(goals.map(g => {
            if (g.id === goalId) {
                const updatedHistory = [...g.progressHistory, newProgress];
                const latestValue = newProgress.value;

                // Auto-calculate status based on progress
                const progressPercent = g.targetDirection === 'decrease'
                    ? Math.max(0, (g.targetValue - latestValue) / g.targetValue * 100)
                    : Math.min(100, (latestValue / g.targetValue) * 100);

                const daysUntilDeadline = Math.ceil(
                    (new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );

                let newStatus: GoalStatus = g.status;

                // Auto-update status based on progress and deadline
                if (progressPercent >= 100) {
                    newStatus = 'achieved';
                } else if (progressPercent >= 75) {
                    newStatus = 'on_track';
                } else if (progressPercent >= 25) {
                    // Check if at risk based on deadline
                    if (daysUntilDeadline < 14 && progressPercent < 50) {
                        newStatus = 'at_risk';
                    } else {
                        newStatus = 'in_progress';
                    }
                } else if (daysUntilDeadline < 7 && progressPercent < 25) {
                    newStatus = 'at_risk';
                } else if (g.status === 'not_started') {
                    newStatus = 'in_progress';
                }

                return {
                    ...g,
                    progressHistory: updatedHistory,
                    currentValue: latestValue,
                    status: newStatus
                };
            }
            return g;
        }));
    }, [goals, saveGoals]);

    const getGoalProgress = useCallback((goalId: string) => {
        const goal = goals.find(g => g.id === goalId);
        return goal?.progressHistory || [];
    }, [goals]);

    const getOverallProgress = useCallback(() => {
        if (goals.length === 0) return 0;
        const totalProgress = goals.reduce((sum, g) => {
            const progress = g.targetDirection === 'decrease'
                ? Math.max(0, (g.targetValue - g.currentValue) / g.targetValue * 100)
                : Math.min(100, (g.currentValue / g.targetValue) * 100);
            return sum + progress;
        }, 0);
        return Math.round(totalProgress / goals.length);
    }, [goals]);

    // ============================================
    // CONTEXT VALUES
    // ============================================
    const logsValue: LogsContextType = {
        logs,
        addLog,
        updateLog,
        deleteLog,
        getLogsByDateRange,
        getLogsByContext
    };

    const crisisValue: CrisisContextType = {
        crisisEvents,
        addCrisisEvent,
        updateCrisisEvent,
        deleteCrisisEvent,
        getCrisisByDateRange,
        getAverageCrisisDuration,
        getCrisisCountByType
    };

    const scheduleValue: ScheduleContextType = {
        scheduleEntries,
        scheduleTemplates,
        addScheduleEntry,
        updateScheduleEntry,
        deleteScheduleEntry,
        getEntriesByDate,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        getCompletionRate
    };

    const goalsValue: GoalsContextType = {
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalProgress,
        getGoalProgress,
        getOverallProgress
    };

    const appValue: AppContextType = {
        currentContext,
        setCurrentContext
    };

    const childProfileValue: ChildProfileContextType = {
        childProfile,
        setChildProfile,
        updateChildProfile,
        clearChildProfile
    };

    const settingsValue: SettingsContextType = {
        hasCompletedOnboarding,
        completeOnboarding,
        refreshData: loadFromStorage
    };

    return (
        <AppContext.Provider value={appValue}>
            <ChildProfileContext.Provider value={childProfileValue}>
                <SettingsContext.Provider value={settingsValue}>
                    <LogsContext.Provider value={logsValue}>
                        <CrisisContext.Provider value={crisisValue}>
                            <ScheduleContext.Provider value={scheduleValue}>
                                <GoalsContext.Provider value={goalsValue}>
                                    {children}
                                </GoalsContext.Provider>
                            </ScheduleContext.Provider>
                        </CrisisContext.Provider>
                    </LogsContext.Provider>
                </SettingsContext.Provider>
            </ChildProfileContext.Provider>
        </AppContext.Provider>
    );
};
