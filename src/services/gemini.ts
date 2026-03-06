import { GoogleGenAI } from "@google/genai";
import type { LogEntry, AnalysisResult, CrisisEvent, AnalysisCorrelation, ChildProfile } from '../types';
import {
    generateLogsHash,
    getCachedAnalysis,
    setCachedAnalysis,
    clearCache,
    prepareLogsForAnalysis,
    prepareCrisisEventsForAnalysis,
    buildSystemPrompt,
    buildUserPrompt,
} from './shared';

// =============================================================================
// GEMINI CONFIGURATION
// =============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_ID = 'gemini-2.0-flash';
const PREMIUM_MODEL_ID = 'gemini-2.5-pro-preview-06-05';

interface StreamCallbacks {
    onChunk?: (chunk: string) => void;
    onComplete?: (fullText: string) => void;
    onError?: (error: Error) => void;
}

// =============================================================================
// RESPONSE PARSING
// =============================================================================

const parseAnalysisResponse = (content: string): AnalysisResult => {
    try {
        let jsonContent = content;
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) jsonContent = jsonMatch[1].trim();
        const parsed = JSON.parse(jsonContent);
        return {
            id: crypto.randomUUID(),
            generatedAt: new Date().toISOString(),
            triggerAnalysis: parsed.triggerAnalysis || 'Analyse ikke tilgjengelig',
            strategyEvaluation: parsed.strategyEvaluation || 'Evaluering ikke tilgjengelig',
            interoceptionPatterns: parsed.interoceptionPatterns || 'Mønstre ikke identifisert',
            summary: parsed.summary || 'Oppsummering ikke tilgjengelig',
            correlations: Array.isArray(parsed.correlations)
                ? parsed.correlations.map((c: Partial<AnalysisCorrelation>) => ({
                    factor1: c.factor1 || '', factor2: c.factor2 || '',
                    relationship: c.relationship || '',
                    strength: (['weak', 'moderate', 'strong'].includes(c.strength || '') ? c.strength : 'moderate') as 'weak' | 'moderate' | 'strong',
                    description: c.description || ''
                }))
                : undefined,
            recommendations: Array.isArray(parsed.recommendations)
                ? parsed.recommendations.filter((r: unknown) => typeof r === 'string')
                : undefined
        };
    } catch (parseError) {
        if (import.meta.env.DEV) console.error('Failed to parse analysis response:', parseError, content);
        throw new Error('Invalid response format from Gemini');
    }
};

// =============================================================================
// GEMINI API CALLS
// =============================================================================

/** Analyze logs using Gemini */
export const analyzeLogsWithGemini = async (
    logs: LogEntry[], crisisEvents: CrisisEvent[] = [],
    options: { forceRefresh?: boolean; childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult> => {
    if (!logs || logs.length === 0) throw new Error('No logs provided for analysis');

    const logsHash = generateLogsHash(logs, crisisEvents);
    if (!options.forceRefresh) {
        const cached = getCachedAnalysis(logsHash);
        if (cached) {
            if (import.meta.env.DEV) console.log('[Gemini] Returning cached analysis');
            return cached;
        }
    }
    if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);
    const systemPrompt = buildSystemPrompt(options.childProfile);
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) console.log(`[Gemini] Analyzing ${logs.length} logs with ${MODEL_ID}...`);
        const response = await genAI.models.generateContent({
            model: MODEL_ID,
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            config: { temperature: 0.3, maxOutputTokens: 4000, responseMimeType: 'application/json' }
        });
        const content = response.text;
        if (!content) throw new Error('Empty response from Gemini');
        if (import.meta.env.DEV) console.log('[Gemini] Response received, parsing...');
        const result = parseAnalysisResponse(content);
        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = false;
        result.modelUsed = MODEL_ID;
        setCachedAnalysis(result, logsHash);
        return result;
    } catch (error) {
        if (import.meta.env.DEV) console.error('[Gemini] Error in analysis:', error);
        throw new Error(`Failed to analyze logs with Gemini: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/** Deep analysis using Gemini 2.5 Pro (premium model) */
export const analyzeLogsDeepWithGemini = async (
    logs: LogEntry[], crisisEvents: CrisisEvent[] = [],
    options: { childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult & { modelUsed?: string }> => {
    if (!logs || logs.length === 0) throw new Error('No logs provided for analysis');
    if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);
    const systemPrompt = buildSystemPrompt(options.childProfile) + '\n\nVIKTIG: Dette er en DYP ANALYSE. Bruk mer tid på å tenke gjennom sammenhenger.\n- Identifiser subtile mønstre som ikke er åpenbare\n- Gi svært spesifikke og handlingsorienterte anbefalinger\n- Analyser interaksjoner mellom ulike faktorer\n- Vurder langsiktige trender og deres implikasjoner';
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) console.log(`[Gemini] Deep analysis with ${PREMIUM_MODEL_ID}...`);
        const response = await genAI.models.generateContent({
            model: PREMIUM_MODEL_ID,
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            config: { temperature: 0.2, maxOutputTokens: 8000, responseMimeType: 'application/json' }
        });
        const content = response.text;
        if (!content) throw new Error('Empty response from Gemini');
        const result = parseAnalysisResponse(content);
        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = true;
        result.modelUsed = PREMIUM_MODEL_ID;
        const logsHash = generateLogsHash(logs, crisisEvents);
        setCachedAnalysis(result, logsHash);
        return { ...result, modelUsed: PREMIUM_MODEL_ID };
    } catch (error) {
        if (import.meta.env.DEV) console.error('[Gemini] Error in deep analysis:', error);
        throw new Error(`Deep analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/** Streaming analysis - Shows AI "thinking" in real-time */
export const analyzeLogsStreamingWithGemini = async (
    logs: LogEntry[], crisisEvents: CrisisEvent[] = [],
    callbacks: StreamCallbacks,
    options: { childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult> => {
    if (!logs || logs.length === 0) throw new Error('No logs provided for analysis');
    if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);
    const systemPrompt = buildSystemPrompt(options.childProfile);
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) console.log(`[Gemini] Streaming analysis with ${MODEL_ID}...`);
        const response = await genAI.models.generateContentStream({
            model: MODEL_ID,
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            config: { temperature: 0.3, maxOutputTokens: 4000, responseMimeType: 'application/json' }
        });
        let fullText = '';
        for await (const chunk of response) {
            const chunkText = chunk.text || '';
            fullText += chunkText;
            if (callbacks.onChunk) callbacks.onChunk(chunkText);
        }
        if (callbacks.onComplete) callbacks.onComplete(fullText);
        const result = parseAnalysisResponse(fullText);
        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = false;
        result.modelUsed = MODEL_ID;
        const logsHash = generateLogsHash(logs, crisisEvents);
        setCachedAnalysis(result, logsHash);
        return result;
    } catch (error) {
        if (callbacks.onError) callbacks.onError(error as Error);
        throw error;
    }
};

/** Clear the analysis cache */
export const clearGeminiCache = (): void => { clearCache(); };

/** Check if Gemini API is configured */
export const isGeminiConfigured = (): boolean => Boolean(GEMINI_API_KEY);

/** Get Gemini API status */
export const getGeminiStatus = (): { configured: boolean; model: string; premiumModel: string } => ({
    configured: Boolean(GEMINI_API_KEY), model: MODEL_ID, premiumModel: PREMIUM_MODEL_ID
});
