import type { LogEntry, AnalysisResult, CrisisEvent, AnalysisCorrelation, ChildProfile } from '../types';
import {
    analyzeLogsWithGemini,
    analyzeLogsDeepWithGemini,
    analyzeLogsStreamingWithGemini,
    isGeminiConfigured,
    getGeminiStatus,
    clearGeminiCache
} from './gemini';
import {
    generateLogsHash,
    getCachedAnalysis,
    setCachedAnalysis,
    prepareLogsForAnalysis,
    prepareCrisisEventsForAnalysis,
    buildSystemPrompt,
    buildUserPrompt,
} from './shared';

// =============================================================================
// CONFIGURATION
// =============================================================================

const USE_GEMINI_PRIMARY = true;
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || '';
const SITE_URL = import.meta.env.VITE_SITE_URL || 'http://localhost:5173';
const SITE_NAME = 'NeuroLogg Pro';

const FREE_MODEL_ID = 'google/gemini-2.0-flash-001';
const PREMIUM_MODELS = [
    'x-ai/grok-4',
    'openai/gpt-5.1',
    'google/gemini-2.5-pro',
] as const;
const PREMIUM_MODEL_ID = PREMIUM_MODELS[0];
const FALLBACK_MODEL_ID = 'google/gemini-2.5-flash-preview-05-20';

const API_CONFIG = {
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    maxRetries: 3,
    retryDelayMs: 1000,
    timeoutMs: 120000,
    maxTokensFree: 4000,
    maxTokensPremium: 8000,
};

// =============================================================================
// TYPES
// =============================================================================

interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

interface OpenRouterResponse {
    id: string;
    choices: Array<{
        message: { content: string; reasoning_details?: Array<{ type: string; content: string }> };
        finish_reason: string;
    }>;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// =============================================================================
// API COMMUNICATION
// =============================================================================

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const callOpenRouter = async (
    messages: OpenRouterMessage[], modelId: string, isPremium: boolean = false
): Promise<OpenRouterResponse> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);
    try {
        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': SITE_URL,
                'X-Title': SITE_NAME,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modelId, messages,
                max_tokens: isPremium ? API_CONFIG.maxTokensPremium : API_CONFIG.maxTokensFree,
                response_format: { type: 'json_object' },
                temperature: isPremium ? 0.2 : 0.4,
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errorText = await response.text();
            if (import.meta.env.DEV) console.error(`OpenRouter API Error (${modelId}):`, response.status, errorText);
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }
        const data = await response.json() as OpenRouterResponse;
        if (import.meta.env.DEV) console.log(`OpenRouter response from ${modelId}:`, data.choices?.[0]?.finish_reason);
        return data;
    } finally {
        clearTimeout(timeoutId);
    }
};

const callWithRetry = async (
    messages: OpenRouterMessage[], modelId: string, isPremium: boolean = false
): Promise<OpenRouterResponse> => {
    let lastError: Error | null = null;
    let currentModelId = modelId;
    for (let attempt = 0; attempt < API_CONFIG.maxRetries; attempt++) {
        try {
            return await callOpenRouter(messages, currentModelId, isPremium);
        } catch (error) {
            lastError = error as Error;
            if (import.meta.env.DEV) console.warn(`API attempt ${attempt + 1} failed:`, error);
            if (attempt === API_CONFIG.maxRetries - 2 && currentModelId === FREE_MODEL_ID) {
                if (import.meta.env.DEV) console.log('Switching to fallback model...');
                currentModelId = FALLBACK_MODEL_ID;
            }
            if (attempt < API_CONFIG.maxRetries - 1) {
                await sleep(API_CONFIG.retryDelayMs * Math.pow(2, attempt));
            }
        }
    }
    throw lastError || new Error('Max retries exceeded');
};

// =============================================================================
// RESPONSE PARSING
// =============================================================================

const parseAnalysisResponse = (content: string): AnalysisResult => {
    try {
        const parsed = JSON.parse(content);
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
        if (import.meta.env.DEV) console.error('Failed to parse analysis response:', parseError);
        throw new Error('Invalid response format from AI service');
    }
};

// =============================================================================
// MOCK DATA
// =============================================================================

const generateMockAnalysis = async (): Promise<AnalysisResult> => {
    await sleep(1500);
    return {
        id: crypto.randomUUID(),
        generatedAt: new Date().toISOString(),
        triggerAnalysis: '**Hovedfunn:** Basert på loggene ser vi at **Auditiv** stimuli kombinert med **Overgang**-situasjoner konsekvent fører til arousal-nivåer over 7.\n\nSpesielt kritisk er overgangen fra friminutt til undervisning (3 av 5 høy-arousal episoder). Kombinasjonen av:\n- Støy fra andre elever\n- Krav om å skifte fokus\n- Tidspress\n\nutgjør en "perfekt storm" for overbelastning.',
        strategyEvaluation: '**Mest effektive strategier:**\n1. **Skjerming** - 85% suksessrate når initiert tidlig\n2. **Hodetelefoner** - Reduserer gjennomsnittlig arousal med 2.3 poeng\n3. **Timer/Visuell Støtte** - Særlig effektiv ved overganger\n\n**Underutnyttede strategier:**\n- **Dypt Trykk** brukes sjelden men har høy effektivitet (80%) når det brukes\n- **Bevegelse** er effektivt men krever planlegging\n\n**Ineffektive mønstre:**\n- Pusteøvelser alene har begrenset effekt når arousal allerede er > 7',
        interoceptionPatterns: '**Energi-sammenhenger:**\n- Når energi < 3 (lav spoon-count), er terskelen for sensorisk overbelastning 40% lavere\n- Formiddagen (10-12) viser konsekvent høyere toleranse enn ettermiddag\n\n**Biologiske faktorer:**\n- Logger før lunsj viser høyere irritabilitet\n- Søvnmangel (indikert av lav morgen-energi) korrelerer med 2x økt kriserisiko\n\n**Kroppslige signaler:**\n- Økt motorisk uro er den mest pålitelige tidlige varsleren (observert i 4 av 5 tilfeller)',
        correlations: [
            { factor1: 'Lav energi (< 3)', factor2: 'Auditiv overfølsomhet', relationship: 'forsterkende', strength: 'strong', description: 'Når energinivået er lavt, er toleransen for lyd betydelig redusert' },
            { factor1: 'Overgang + Krav', factor2: 'Høy arousal', relationship: 'utløsende', strength: 'strong', description: 'Kombinasjonen av overgang og nye krav er den hyppigste triggeren' },
            { factor1: 'Tidlig skjerming', factor2: 'Kortere nedregulering', relationship: 'beskyttende', strength: 'moderate', description: 'Proaktiv skjerming før arousal > 6 halverer nedregulerings-tiden' }
        ],
        recommendations: [
            'Implementer "rolig overgang"-protokoll: 5 min med hodetelefoner før hver aktivitetsbytte',
            'Øk bruken av visuell støtte/timere for å gi forutsigbarhet',
            'Vurder stille rom/base for lunsj når morgenenergien er lav (< 4)',
            'Introduser "energi-sjekk" rutine ved skolestart for å tilpasse dagens krav',
            'Tren på å gjenkjenne tidlige varsler: Økt motorisk uro = handle NÅ'
        ],
        summary: '**Hovedbilde:** Barnet har et tydelig mønster hvor kombinasjonen av sensorisk overbelastning (særlig auditiv) og overgangssituasjoner er hovedutfordringen.\n\n**Styrker:** God respons på strukturelle tiltak (skjerming, hodetelefoner, visuell støtte). Når strategier initieres tidlig, er effektiviteten høy.\n\n**Sårbarhet:** Ettermiddager og situasjoner med lav energi + høye krav.\n\n**Anbefalt fokus:** Proaktiv bruk av strategier BEFORE arousal eskalerer, særlig rundt overganger. Energinivå bør monitoreres som "varselsystem" for dagen.'
    };
};

// =============================================================================
// PUBLIC API
// =============================================================================

/** Analyzes log entries and crisis events. Uses Gemini as primary, falls back to OpenRouter. */
export const analyzeLogs = async (
    logs: LogEntry[], crisisEvents: CrisisEvent[] = [],
    options: { forceRefresh?: boolean; childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult> => {
    if (!logs || logs.length === 0) throw new Error('No logs provided for analysis');

    if (USE_GEMINI_PRIMARY && isGeminiConfigured()) {
        try {
            if (import.meta.env.DEV) console.log('[AI] Using Gemini 3 Pro as primary...');
            return await analyzeLogsWithGemini(logs, crisisEvents, options);
        } catch (geminiError) {
            if (import.meta.env.DEV) console.warn('[AI] Gemini failed, falling back to OpenRouter:', geminiError);
        }
    }

    const logsHash = generateLogsHash(logs, crisisEvents);
    if (!options.forceRefresh) {
        const cached = getCachedAnalysis(logsHash);
        if (cached) {
            if (import.meta.env.DEV) console.log('Returning cached analysis');
            return cached;
        }
    }

    if (!OPENROUTER_API_KEY) {
        if (import.meta.env.DEV) console.log('No API key found, returning mock analysis');
        return generateMockAnalysis();
    }

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);
    const systemPrompt = buildSystemPrompt(options.childProfile);
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    try {
        if (import.meta.env.DEV) console.log(`[OpenRouter] Analyzing ${logs.length} logs with ${FREE_MODEL_ID}...`);
        const response = await callWithRetry(
            [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
            FREE_MODEL_ID, false
        );
        const content = response.choices[0]?.message?.content;
        if (!content) throw new Error('Empty response from AI service');
        if (response.usage && import.meta.env.DEV) {
            console.log(`Token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
        }
        const result = parseAnalysisResponse(content);
        result.dateRangeStart = logs[0]?.timestamp;
        result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
        result.isDeepAnalysis = false;
        setCachedAnalysis(result, logsHash);
        return result;
    } catch (error) {
        if (import.meta.env.DEV) console.error('Error in analysis:', error);
        throw new Error(`Failed to analyze logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};

/** Performs DEEP analysis using premium models */
export const analyzeLogsDeep = async (
    logs: LogEntry[], crisisEvents: CrisisEvent[] = [],
    options: { childProfile?: ChildProfile | null } = {}
): Promise<AnalysisResult & { modelUsed?: string }> => {
    if (!logs || logs.length === 0) throw new Error('No logs provided for analysis');

    if (USE_GEMINI_PRIMARY && isGeminiConfigured()) {
        try {
            if (import.meta.env.DEV) console.log('[AI] Using Gemini 2.5 Pro for deep analysis...');
            return await analyzeLogsDeepWithGemini(logs, crisisEvents, options);
        } catch (geminiError) {
            if (import.meta.env.DEV) console.warn('[AI] Gemini deep analysis failed, falling back to OpenRouter:', geminiError);
        }
    }

    if (!OPENROUTER_API_KEY) {
        if (import.meta.env.DEV) console.log('No API key found, returning mock analysis');
        return generateMockAnalysis();
    }

    const referenceDate = new Date(logs[logs.length - 1]?.timestamp || new Date());
    const oldestLog = new Date(logs[0]?.timestamp || new Date());
    const totalDays = Math.ceil((referenceDate.getTime() - oldestLog.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const preparedLogs = prepareLogsForAnalysis(logs, referenceDate);
    const preparedCrisis = prepareCrisisEventsForAnalysis(crisisEvents, referenceDate);
    const systemPrompt = buildSystemPrompt(options.childProfile) + '\n\nVIKTIG: Dette er en DYP ANALYSE. Bruk mer tid på å tenke gjennom sammenhenger.\n- Identifiser subtile mønstre som ikke er åpenbare\n- Gi svært spesifikke og handlingsorienterte anbefalinger\n- Analyser interaksjoner mellom ulike faktorer\n- Vurder langsiktige trender og deres implikasjoner';
    const userPrompt = buildUserPrompt(preparedLogs, preparedCrisis, totalDays);

    const messages: OpenRouterMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];

    let lastError: Error | null = null;
    for (const modelId of PREMIUM_MODELS) {
        try {
            if (import.meta.env.DEV) console.log(`[OpenRouter] Trying deep analysis with ${modelId}...`);
            const response = await callOpenRouter(messages, modelId, true);
            const content = response.choices[0]?.message?.content;
            if (!content) throw new Error('Empty response from AI service');
            if (response.usage && import.meta.env.DEV) {
                console.log(`[OpenRouter] ${modelId} - Token usage: ${response.usage.prompt_tokens} input, ${response.usage.completion_tokens} output`);
            }
            const result = parseAnalysisResponse(content);
            result.dateRangeStart = logs[0]?.timestamp;
            result.dateRangeEnd = logs[logs.length - 1]?.timestamp;
            result.isDeepAnalysis = true;
            const finalResult = { ...result, modelUsed: modelId };
            const logsHash = generateLogsHash(logs, crisisEvents);
            setCachedAnalysis(finalResult, logsHash);
            if (import.meta.env.DEV) console.log(`[OpenRouter] Deep analysis successful with ${modelId}`);
            return finalResult;
        } catch (error) {
            lastError = error as Error;
            if (import.meta.env.DEV) console.warn(`[OpenRouter] ${modelId} failed:`, error);
        }
    }
    if (import.meta.env.DEV) console.error('All premium models failed for deep analysis');
    throw new Error(`Deep analysis failed: ${lastError?.message || 'All premium models unavailable'}`);
};

/** Clears the analysis cache */
export const clearAnalysisCache = (): void => { clearGeminiCache(); };

/** Gets current API configuration status */
export const getApiStatus = (): {
    configured: boolean; freeModel: string; premiumModel: string;
    geminiConfigured: boolean; geminiModel?: string;
} => {
    const geminiStatus = getGeminiStatus();
    return {
        configured: Boolean(OPENROUTER_API_KEY) || geminiStatus.configured,
        freeModel: FREE_MODEL_ID, premiumModel: PREMIUM_MODEL_ID,
        geminiConfigured: geminiStatus.configured, geminiModel: geminiStatus.model,
    };
};

/** Streaming analysis - Uses Gemini's streaming capability */
export const analyzeLogsStreaming = analyzeLogsStreamingWithGemini;
