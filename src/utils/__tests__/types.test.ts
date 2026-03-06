import { describe, it, expect } from 'vitest';
import {
  getDayOfWeek,
  getTimeOfDay,
  enrichLogEntry,
  enrichCrisisEvent,
} from '../../types';
import type { LogEntry, CrisisEvent } from '../../types';

describe('getDayOfWeek', () => {
  it('returns sunday for a Sunday date', () => {
    // 2026-03-01 is a Sunday
    expect(getDayOfWeek(new Date(2026, 2, 1))).toBe('sunday');
  });

  it('returns monday for a Monday date', () => {
    expect(getDayOfWeek(new Date(2026, 2, 2))).toBe('monday');
  });

  it('returns wednesday for a Wednesday date', () => {
    expect(getDayOfWeek(new Date(2026, 2, 4))).toBe('wednesday');
  });

  it('returns saturday for a Saturday date', () => {
    expect(getDayOfWeek(new Date(2026, 2, 7))).toBe('saturday');
  });
});

describe('getTimeOfDay', () => {
  it('returns morning for hours 5-9', () => {
    expect(getTimeOfDay(new Date(2026, 0, 1, 5, 0))).toBe('morning');
    expect(getTimeOfDay(new Date(2026, 0, 1, 9, 59))).toBe('morning');
  });

  it('returns midday for hours 10-13', () => {
    expect(getTimeOfDay(new Date(2026, 0, 1, 10, 0))).toBe('midday');
    expect(getTimeOfDay(new Date(2026, 0, 1, 13, 59))).toBe('midday');
  });

  it('returns afternoon for hours 14-17', () => {
    expect(getTimeOfDay(new Date(2026, 0, 1, 14, 0))).toBe('afternoon');
    expect(getTimeOfDay(new Date(2026, 0, 1, 17, 59))).toBe('afternoon');
  });

  it('returns evening for hours 18-21', () => {
    expect(getTimeOfDay(new Date(2026, 0, 1, 18, 0))).toBe('evening');
    expect(getTimeOfDay(new Date(2026, 0, 1, 21, 59))).toBe('evening');
  });

  it('returns night for hours 22-4', () => {
    expect(getTimeOfDay(new Date(2026, 0, 1, 22, 0))).toBe('night');
    expect(getTimeOfDay(new Date(2026, 0, 1, 0, 0))).toBe('night');
    expect(getTimeOfDay(new Date(2026, 0, 1, 4, 59))).toBe('night');
  });
});

describe('enrichLogEntry', () => {
  it('adds dayOfWeek, timeOfDay, and hourOfDay to a log entry', () => {
    const baseLog: Omit<LogEntry, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'> = {
      id: 'log-1',
      timestamp: new Date(2026, 2, 4, 14, 30).toISOString(), // Wed afternoon
      arousal: 5,
      valence: 5,
      energy: 5,
      sensoryTriggers: [],
      contextTriggers: [],
      strategies: [],
      context: 'home',
      note: '',
      duration: 10,
    };

    const enriched = enrichLogEntry(baseLog);
    expect(enriched.dayOfWeek).toBe('wednesday');
    expect(enriched.timeOfDay).toBe('afternoon');
    expect(enriched.hourOfDay).toBe(14);
  });

  it('preserves all original fields', () => {
    const baseLog: Omit<LogEntry, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'> = {
      id: 'log-2',
      timestamp: new Date(2026, 2, 2, 8, 0).toISOString(), // Mon morning
      arousal: 7,
      valence: 3,
      energy: 4,
      sensoryTriggers: ['Auditiv'],
      contextTriggers: ['Krav'],
      strategies: ['Pusting'],
      context: 'school',
      note: 'Test note',
      duration: 20,
    };

    const enriched = enrichLogEntry(baseLog);
    expect(enriched.id).toBe('log-2');
    expect(enriched.arousal).toBe(7);
    expect(enriched.sensoryTriggers).toEqual(['Auditiv']);
    expect(enriched.note).toBe('Test note');
    expect(enriched.dayOfWeek).toBe('monday');
    expect(enriched.timeOfDay).toBe('morning');
    expect(enriched.hourOfDay).toBe(8);
  });
});

describe('enrichCrisisEvent', () => {
  it('adds dayOfWeek, timeOfDay, and hourOfDay to a crisis event', () => {
    const baseEvent: Omit<CrisisEvent, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'> = {
      id: 'crisis-1',
      timestamp: new Date(2026, 2, 6, 20, 0).toISOString(), // Fri evening
      context: 'home',
      type: 'meltdown',
      durationSeconds: 600,
      peakIntensity: 8,
      warningSignsObserved: [],
      sensoryTriggers: [],
      contextTriggers: [],
      strategiesUsed: [],
      resolution: 'self_regulated',
      hasAudioRecording: false,
      notes: '',
    };

    const enriched = enrichCrisisEvent(baseEvent);
    expect(enriched.dayOfWeek).toBe('friday');
    expect(enriched.timeOfDay).toBe('evening');
    expect(enriched.hourOfDay).toBe(20);
  });

  it('preserves all original fields', () => {
    const baseEvent: Omit<CrisisEvent, 'dayOfWeek' | 'timeOfDay' | 'hourOfDay'> = {
      id: 'crisis-2',
      timestamp: new Date(2026, 2, 1, 2, 0).toISOString(), // Sun night
      context: 'school',
      type: 'shutdown',
      durationSeconds: 300,
      peakIntensity: 6,
      warningSignsObserved: ['Tilbaketrekning'],
      sensoryTriggers: ['Auditiv'],
      contextTriggers: ['Krav'],
      strategiesUsed: ['Skjerming'],
      resolution: 'co_regulated',
      hasAudioRecording: true,
      notes: 'Crisis note',
    };

    const enriched = enrichCrisisEvent(baseEvent);
    expect(enriched.id).toBe('crisis-2');
    expect(enriched.type).toBe('shutdown');
    expect(enriched.peakIntensity).toBe(6);
    expect(enriched.notes).toBe('Crisis note');
    expect(enriched.dayOfWeek).toBe('sunday');
    expect(enriched.timeOfDay).toBe('night');
    expect(enriched.hourOfDay).toBe(2);
  });
});
