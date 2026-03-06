import type { LogEntry, CrisisEvent } from '../../types';
import { sanitizeText, makeTimestampRelative } from './sanitization';

// =============================================================================
// TYPES
// =============================================================================

export interface PreparedLog {
    relativeTime: string;
    context: string;
    arousal: number;
    valence: number;
    energy: number;
    triggers: string[];
    strategies: string[];
    strategyEffectiveness?: string;
    duration: number;
    note: string;
    dayOfWeek?: string;
    timeOfDay?: string;
}

export interface PreparedCrisis {
    relativeTime: string;
    context: string;
    type: string;
    durationMinutes: number;
    peakIntensity: number;
    precedingArousal?: number;
    precedingEnergy?: number;
    warningSignsObserved: string[];
    triggers: string[];
    strategiesUsed: string[];
    resolution: string;
    recoveryTimeMinutes?: number;
    note: string;
}

// =============================================================================
// DATA PREPARATION
// =============================================================================

export const prepareLogsForAnalysis = (logs: LogEntry[], referenceDate: Date): PreparedLog[] => {
    return logs.map(log => ({
        relativeTime: makeTimestampRelative(log.timestamp, referenceDate),
        context: log.context === 'home' ? 'Hjemme' : 'Skole',
        arousal: log.arousal,
        valence: log.valence,
        energy: log.energy,
        triggers: [...log.sensoryTriggers, ...log.contextTriggers],
        strategies: log.strategies,
        strategyEffectiveness: log.strategyEffectiveness,
        duration: log.duration,
        note: sanitizeText(log.note),
        dayOfWeek: log.dayOfWeek,
        timeOfDay: log.timeOfDay
    }));
};

export const prepareCrisisEventsForAnalysis = (events: CrisisEvent[], referenceDate: Date): PreparedCrisis[] => {
    return events.map(event => ({
        relativeTime: makeTimestampRelative(event.timestamp, referenceDate),
        context: event.context === 'home' ? 'Hjemme' : 'Skole',
        type: event.type,
        durationMinutes: Math.round(event.durationSeconds / 60),
        peakIntensity: event.peakIntensity,
        precedingArousal: event.precedingArousal,
        precedingEnergy: event.precedingEnergy,
        warningSignsObserved: event.warningSignsObserved,
        triggers: [...event.sensoryTriggers, ...event.contextTriggers],
        strategiesUsed: event.strategiesUsed,
        resolution: event.resolution,
        recoveryTimeMinutes: event.recoveryTimeMinutes,
        note: sanitizeText(event.notes)
    }));
};
