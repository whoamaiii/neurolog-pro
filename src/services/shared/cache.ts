import type { LogEntry, AnalysisResult, CrisisEvent } from '../../types';

// =============================================================================
// TYPES
// =============================================================================

export interface AnalysisCache {
    result: AnalysisResult;
    timestamp: number;
    logsHash: string;
}

// =============================================================================
// CACHING
// =============================================================================
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes
let analysisCache: AnalysisCache | null = null;

export const generateLogsHash = (logs: LogEntry[], crisisEvents?: CrisisEvent[]): string => {
    const data = JSON.stringify({
        logs: logs.map(l => l.id).sort(),
        crisis: crisisEvents?.map(c => c.id).sort() || []
    });
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return hash.toString(36);
};

export const getCachedAnalysis = (logsHash: string): AnalysisResult | null => {
    if (!analysisCache) return null;
    if (analysisCache.logsHash !== logsHash) return null;
    if (Date.now() - analysisCache.timestamp > CACHE_TTL_MS) {
        analysisCache = null;
        return null;
    }
    return analysisCache.result;
};

export const setCachedAnalysis = (result: AnalysisResult, logsHash: string): void => {
    analysisCache = {
        result,
        timestamp: Date.now(),
        logsHash
    };
};

export const clearCache = (): void => {
    analysisCache = null;
};
