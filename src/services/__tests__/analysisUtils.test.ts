import { describe, it, expect } from 'vitest';
import {
    generateLogsHash,
    sanitizeText,
    makeTimestampRelative,
    prepareLogsForAnalysis,
    prepareCrisisEventsForAnalysis,
    parseAnalysisResponse,
    buildUserPrompt,
    buildSystemPrompt,
    createAnalysisCache,
    logsToSummaryStrings,
    generateStatsSummary,
} from '../analysisUtils';
import type { LogEntry, CrisisEvent } from '../../types';

const makeLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
    id: 'log-1',
    timestamp: '2025-01-15T10:00:00Z',
    context: 'home',
    arousal: 5,
    valence: 6,
    energy: 4,
    sensoryTriggers: ['Lyd'],
    contextTriggers: ['Overgang'],
    strategies: ['Skjerming'],
    strategyEffectiveness: 'helped',
    duration: 30,
    note: 'Test note',
    dayOfWeek: 'monday',
    timeOfDay: 'midday',
    ...overrides,
});

const makeCrisis = (overrides: Partial<CrisisEvent> = {}): CrisisEvent => ({
    id: 'crisis-1',
    timestamp: '2025-01-15T14:00:00Z',
    context: 'school',
    type: 'meltdown',
    durationSeconds: 300,
    peakIntensity: 8,
    warningSignsObserved: ['Økt uro'],
    sensoryTriggers: ['Lyd'],
    contextTriggers: ['Krav'],
    strategiesUsed: ['Skjerming'],
    resolution: 'co_regulated',
    notes: 'Test crisis note',
    hasAudioRecording: false,
    ...overrides,
});

describe('generateLogsHash', () => {
    it('returns deterministic hash for same input', () => {
        const logs = [makeLog({ id: 'a' }), makeLog({ id: 'b' })];
        const hash1 = generateLogsHash(logs);
        const hash2 = generateLogsHash(logs);
        expect(hash1).toBe(hash2);
    });

    it('returns different hash for different logs', () => {
        const logs1 = [makeLog({ id: 'a' })];
        const logs2 = [makeLog({ id: 'b' })];
        expect(generateLogsHash(logs1)).not.toBe(generateLogsHash(logs2));
    });

    it('includes crisis events in hash', () => {
        const logs = [makeLog({ id: 'a' })];
        const crisis = [makeCrisis({ id: 'c1' })];
        const hashWithout = generateLogsHash(logs);
        const hashWith = generateLogsHash(logs, crisis);
        expect(hashWithout).not.toBe(hashWith);
    });

    it('is order-independent (sorts IDs)', () => {
        const logs1 = [makeLog({ id: 'a' }), makeLog({ id: 'b' })];
        const logs2 = [makeLog({ id: 'b' }), makeLog({ id: 'a' })];
        expect(generateLogsHash(logs1)).toBe(generateLogsHash(logs2));
    });
});

describe('sanitizeText', () => {
    it('returns empty string for falsy input', () => {
        expect(sanitizeText('')).toBe('');
    });

    it('redacts phone numbers (8+ digits)', () => {
        expect(sanitizeText('Ring 12345678 for info')).toBe('Ring [PHONE] for info');
    });

    it('redacts email addresses', () => {
        expect(sanitizeText('Send to user@example.com')).toBe('Send to [EMAIL]');
    });

    it('preserves non-PII text', () => {
        expect(sanitizeText('Barnet var urolig i dag')).toBe('Barnet var urolig i dag');
    });
});

describe('makeTimestampRelative', () => {
    const ref = new Date('2025-01-15T12:00:00Z');

    it('labels same day as "I dag"', () => {
        const result = makeTimestampRelative('2025-01-15T12:00:00Z', ref);
        expect(result).toContain('I dag');
    });

    it('labels previous day as "I går"', () => {
        const result = makeTimestampRelative('2025-01-14T12:00:00Z', ref);
        expect(result).toContain('I går');
    });

    it('includes time-of-day label', () => {
        const morning = makeTimestampRelative('2025-01-15T06:00:00Z', ref);
        expect(morning).toContain('morgen');
    });
});

describe('prepareLogsForAnalysis', () => {
    it('transforms LogEntry to PreparedLog', () => {
        const logs = [makeLog()];
        const ref = new Date('2025-01-15T12:00:00Z');
        const prepared = prepareLogsForAnalysis(logs, ref);

        expect(prepared).toHaveLength(1);
        expect(prepared[0].context).toBe('Hjemme');
        expect(prepared[0].arousal).toBe(5);
        expect(prepared[0].triggers).toEqual(['Lyd', 'Overgang']);
    });

    it('translates school context', () => {
        const logs = [makeLog({ context: 'school' })];
        const ref = new Date('2025-01-15T12:00:00Z');
        const prepared = prepareLogsForAnalysis(logs, ref);
        expect(prepared[0].context).toBe('Skole');
    });
});

describe('prepareCrisisEventsForAnalysis', () => {
    it('transforms CrisisEvent to PreparedCrisis', () => {
        const events = [makeCrisis()];
        const ref = new Date('2025-01-15T16:00:00Z');
        const prepared = prepareCrisisEventsForAnalysis(events, ref);

        expect(prepared).toHaveLength(1);
        expect(prepared[0].durationMinutes).toBe(5);
        expect(prepared[0].peakIntensity).toBe(8);
        expect(prepared[0].type).toBe('meltdown');
    });
});

describe('parseAnalysisResponse', () => {
    const validJson = JSON.stringify({
        triggerAnalysis: 'test trigger analysis',
        strategyEvaluation: 'test strategy eval',
        interoceptionPatterns: 'test patterns',
        summary: 'test summary',
        correlations: [
            { factor1: 'A', factor2: 'B', relationship: 'causal', strength: 'strong', description: 'desc' }
        ],
        recommendations: ['rec1', 'rec2'],
    });

    it('parses valid JSON response', () => {
        const result = parseAnalysisResponse(validJson);
        expect(result.triggerAnalysis).toBe('test trigger analysis');
        expect(result.summary).toBe('test summary');
        expect(result.correlations).toHaveLength(1);
        expect(result.recommendations).toEqual(['rec1', 'rec2']);
    });

    it('parses JSON wrapped in markdown code fences', () => {
        const wrapped = '```json\n' + validJson + '\n```';
        const result = parseAnalysisResponse(wrapped);
        expect(result.triggerAnalysis).toBe('test trigger analysis');
    });

    it('parses JSON wrapped in plain code fences', () => {
        const wrapped = '```\n' + validJson + '\n```';
        const result = parseAnalysisResponse(wrapped);
        expect(result.triggerAnalysis).toBe('test trigger analysis');
    });

    it('provides defaults for missing fields', () => {
        const result = parseAnalysisResponse('{}');
        expect(result.triggerAnalysis).toBe('Analyse ikke tilgjengelig');
        expect(result.summary).toBe('Oppsummering ikke tilgjengelig');
    });

    it('throws on invalid JSON', () => {
        expect(() => parseAnalysisResponse('not json')).toThrow('Invalid response format');
    });

    it('normalizes invalid correlation strength to moderate', () => {
        const json = JSON.stringify({
            correlations: [
                { factor1: 'A', factor2: 'B', relationship: 'x', strength: 'invalid', description: 'd' }
            ]
        });
        const result = parseAnalysisResponse(json);
        expect(result.correlations![0].strength).toBe('moderate');
    });

    it('filters non-string recommendations', () => {
        const json = JSON.stringify({
            recommendations: ['valid', 123, null, 'also valid']
        });
        const result = parseAnalysisResponse(json);
        expect(result.recommendations).toEqual(['valid', 'also valid']);
    });

    it('generates unique ID and timestamp', () => {
        const result = parseAnalysisResponse('{}');
        expect(result.id).toBeTruthy();
        expect(result.generatedAt).toBeTruthy();
    });
});

describe('createAnalysisCache', () => {
    it('returns null for unknown hash', () => {
        const cache = createAnalysisCache();
        expect(cache.get('unknown')).toBeNull();
    });

    it('stores and retrieves result by hash', () => {
        const cache = createAnalysisCache();
        const result = parseAnalysisResponse('{}');
        cache.set(result, 'hash1');
        expect(cache.get('hash1')).toBe(result);
    });

    it('returns null for mismatched hash', () => {
        const cache = createAnalysisCache();
        const result = parseAnalysisResponse('{}');
        cache.set(result, 'hash1');
        expect(cache.get('hash2')).toBeNull();
    });

    it('clears cache', () => {
        const cache = createAnalysisCache();
        const result = parseAnalysisResponse('{}');
        cache.set(result, 'hash1');
        cache.clear();
        expect(cache.get('hash1')).toBeNull();
    });
});

describe('logsToSummaryStrings', () => {
    it('returns placeholder for empty logs', () => {
        expect(logsToSummaryStrings([])).toBe('Ingen logger tilgjengelig.');
    });

    it('includes arousal level labels', () => {
        const ref = new Date('2025-01-15T12:00:00Z');
        const prepared = prepareLogsForAnalysis([makeLog({ arousal: 8 })], ref);
        const result = logsToSummaryStrings(prepared);
        expect(result).toContain('Høy');
    });
});

describe('generateStatsSummary', () => {
    it('returns empty for no logs', () => {
        expect(generateStatsSummary([], [])).toBe('');
    });

    it('includes averages for populated logs', () => {
        const ref = new Date('2025-01-15T12:00:00Z');
        const prepared = prepareLogsForAnalysis([makeLog()], ref);
        const result = generateStatsSummary(prepared, []);
        expect(result).toContain('Arousal:');
        expect(result).toContain('Valens:');
        expect(result).toContain('Energi:');
    });
});

describe('buildSystemPrompt', () => {
    it('returns non-empty prompt without profile', () => {
        const prompt = buildSystemPrompt();
        expect(prompt.length).toBeGreaterThan(100);
        expect(prompt).toContain('nevrodivergens');
    });

    it('includes child profile when provided', () => {
        const prompt = buildSystemPrompt({
            id: 'test-id',
            name: 'Test',
            age: 8,
            diagnoses: ['ADHD'],
            communicationStyle: 'verbal',
            sensorySensitivities: [],
            seekingSensory: [],
            effectiveStrategies: ['Skjerming'],
            additionalContext: '',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-01-01T00:00:00Z',
        });
        expect(prompt).toContain('ADHD');
        expect(prompt).toContain('Skjerming');
    });
});

describe('buildUserPrompt', () => {
    it('builds prompt with logs', () => {
        const ref = new Date('2025-01-15T12:00:00Z');
        const prepared = prepareLogsForAnalysis([makeLog()], ref);
        const prompt = buildUserPrompt(prepared, [], 7);
        expect(prompt).toContain('7 dager');
        expect(prompt).toContain('TRIGGER-ANALYSE');
    });

    it('includes crisis questions when crisis data provided', () => {
        const ref = new Date('2025-01-15T16:00:00Z');
        const preparedLogs = prepareLogsForAnalysis([makeLog()], ref);
        const preparedCrisis = prepareCrisisEventsForAnalysis([makeCrisis()], ref);
        const prompt = buildUserPrompt(preparedLogs, preparedCrisis, 7);
        expect(prompt).toContain('KRISE-PREDIKSJON');
    });
});
