import { GoogleGenAI } from "@google/genai";
import type { LogEntry, AnalysisResult, CrisisEvent, ChildProfile } from '../types';
import {
    createAnalysisCache,
    generateLogsHash,
    prepareLogsForAnalysis,
    prepareCrisisEventsForAnalysis,
    buildSystemPrompt,
    buildUserPrompt,
    parseAnalysisResponse
} from './analysisUtils';

// =============================================================================
// GEMINI CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

const MODEL_ID = 'gemini-2.0-flash';
const PREMIUM_MODEL_ID = 'gemini-2.5-pro-preview-06-05';

// =============================================================================
// TYPES
// =============================================================================

interface StreamCallbacks {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
}

// =============================================================================
// CACHING (own instance for Gemini service)
// =============================================================================

const cache = createAnalysisCache();

// =============================================================================
// GEMINI API CALLS
// =============================================================================

export const analyzeLogsWithGemini = async (
    logs: LogEntry[],
    crisisEvents: CrisisEvent[] = [],
    options: { forceRefresh?: boolean; childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult> => {
    if (!logs || logs.length === 0) {
        throw new Error('No logs provided for analysis');
    }

    const logsHash = generateLogsHash(logs, crisisEvents);
    if (!options.forceRefresh) {
        const cached = cache.get(logsHash);
        if (cached) {
            if (import.meta.env.DEV) {
                console.log('[Gemini] Returning cached analysis');
            }
            return cached;
        }
    }

    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);

    const systemPrompt = buildSystemPrompt(options.childProfile);
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) {
            console.log(`[Gemini] Analyzing ${logs.length} logs with ${MODEL_ID}...`);
        }

        const response = await genAI.models.generateContent({
            model: MODEL_ID,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }
            ],
            config: {
                temperature: 0.3,
                maxOutputTokens: 4000,
                responseMimeType: 'application/json'
            }
        });

        const content = response.text;
        if (!content) {
            throw new Error('Empty response from Gemini');
        }

        if (import.meta.env.DEV) {
            console.log('[Gemini] Response received, parsing...');
        }

        const result = parseAnalysisResponse(content);

        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = false;
        result.modelUsed = MODEL_ID;

        cache.set(result, logsHash);

        return result;

    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('[Gemini] Error in analysis:', error);
        }
        throw new Error(`Failed to analyze logs with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const analyzeLogsDeepWithGemini = async (
    logs: LogEntry[],
    crisisEvents: CrisisEvent[] = [],
    options: { childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult & { modelUsed?: string }> => {
    if (!logs || logs.length === 0) {
        throw new Error('No logs provided for analysis');
    }

    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);

    const systemPrompt = buildSystemPrompt(options.childProfile) + `

VIKTIG: Dette er en DYP ANALYSE. Bruk mer tid på å tenke gjennom sammenhenger.
- Identifiser subtile mønstre som ikke er åpenbare
- Gi svært spesifikke og handlingsorienterte anbefalinger
- Analyser interaksjoner mellom ulike faktorer
- Vurder langsiktige trender og deres implikasjoner`;

    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) {
            console.log(`[Gemini] Deep analysis with ${PREMIUM_MODEL_ID}...`);
        }

        const response = await genAI.models.generateContent({
            model: PREMIUM_MODEL_ID,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }
            ],
            config: {
                temperature: 0.2,
                maxOutputTokens: 8000,
                responseMimeType: 'application/json'
            }
        });

        const content = response.text;
        if (!content) {
            throw new Error('Empty response from Gemini');
        }

        const result = parseAnalysisResponse(content);

        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = true;
        result.modelUsed = PREMIUM_MODEL_ID;

        const logsHash = generateLogsHash(logs, crisisEvents);
        cache.set(result, logsHash);

        return { ...result, modelUsed: PREMIUM_MODEL_ID };

    } catch (error) {
        if (import.meta.env.DEV) {
            console.error('[Gemini] Error in deep analysis:', error);
        }
        throw new Error(`Deep analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

export const analyzeLogsStreamingWithGemini = async (
    logs: LogEntry[],
    crisisEvents: CrisisEvent[] = [],
    callbacks: StreamCallbacks,
    options: { childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult> => {
    if (!logs || logs.length === 0) {
        throw new Error('No logs provided for analysis');
    }

    if (!GEMINI_API_KEY) {
        throw new Error('Gemini API key not configured');
    }

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);

    const systemPrompt = buildSystemPrompt(options.childProfile);
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) {
            console.log(`[Gemini] Streaming analysis with ${MODEL_ID}...`);
        }

        const response = await genAI.models.generateContentStream({
            model: MODEL_ID,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
                }
            ],
            config: {
                temperature: 0.3,
                maxOutputTokens: 4000,
                responseMimeType: 'application/json'
            }
        });

        let fullText = '';

        for await (const chunk of response) {
            const chunkText = chunk.text || '';
            fullText += chunkText;

            if (callbacks.onChunk) {
                callbacks.onChunk(chunkText);
            }
        }

        if (callbacks.onComplete) {
            callbacks.onComplete(fullText);
        }

        const result = parseAnalysisResponse(fullText);

        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = false;
        result.modelUsed = MODEL_ID;

        const logsHash = generateLogsHash(logs, crisisEvents);
        cache.set(result, logsHash);

        return result;

    } catch (error) {
        if (callbacks.onError) {
            callbacks.onError(error as Error);
        }
        throw error;
    }
};

export const clearGeminiCache = (): void => {
    cache.clear();
};

export const isGeminiConfigured = (): boolean => {
    return Boolean(GEMINI_API_KEY);
};

export const getGeminiStatus = (): {
    configured: boolean;
    model: string;
    premiumModel: string;
} => {
    return {
        configured: Boolean(GEMINI_API_KEY),
        model: MODEL_ID,
        premiumModel: PREMIUM_MODEL_ID
    };
};
