import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateRiskForecast } from '../../utils/predictions';
import type { LogEntry } from '../../types';

const mockLog = (overrides: Partial<LogEntry> = {}): LogEntry => ({
  id: 'test-id',
  timestamp: new Date().toISOString(),
  arousal: 5,
  valence: 5,
  energy: 5,
  sensoryTriggers: [],
  contextTriggers: [],
  strategies: [],
  context: 'home' as const,
  note: '',
  duration: 10,
  ...overrides,
});

describe('calculateRiskForecast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Fix time to Wednesday 2026-03-04 at 14:00
    vi.setSystemTime(new Date(2026, 2, 4, 14, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns low risk with score 0 for empty logs array', () => {
    const result = calculateRiskForecast([]);
    expect(result.level).toBe('low');
    expect(result.score).toBe(0);
    expect(result.contributingFactors).toEqual([]);
  });

  it('returns low with notEnoughData factor when less than 5 same-day logs', () => {
    // Current day is Wednesday (day 3). Create 3 logs on previous Wednesdays.
    const logs = [
      mockLog({ timestamp: new Date(2026, 1, 25, 10, 0).toISOString() }), // Wed Feb 25
      mockLog({ timestamp: new Date(2026, 1, 18, 12, 0).toISOString() }), // Wed Feb 18
      mockLog({ timestamp: new Date(2026, 1, 11, 9, 0).toISOString() }),  // Wed Feb 11
    ];

    const result = calculateRiskForecast(logs);
    expect(result.level).toBe('low');
    expect(result.score).toBe(0);
    expect(result.contributingFactors).toEqual([{ key: 'risk.factors.notEnoughData' }]);
  });

  it('increases score when logs have high arousal (>=7) on matching day-of-week', () => {
    // Create 6 Wednesday logs within last 30 days, all with high arousal
    const logs = [
      mockLog({ timestamp: new Date(2026, 1, 25, 10, 0).toISOString(), arousal: 8 }),
      mockLog({ timestamp: new Date(2026, 1, 25, 11, 0).toISOString(), arousal: 7 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 9, 0).toISOString(), arousal: 9 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 12, 0).toISOString(), arousal: 7 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 8, 0).toISOString(), arousal: 3 }), // low arousal
      mockLog({ timestamp: new Date(2026, 1, 11, 15, 0).toISOString(), arousal: 2 }), // low arousal
    ];

    const result = calculateRiskForecast(logs);
    // 4 out of 6 are high arousal => rate ~0.67 => score ~67
    expect(result.score).toBeGreaterThan(0);
  });

  it('returns high when score >= 60', () => {
    // All 6 logs high arousal => rate 100% => score 100
    const logs = [
      mockLog({ timestamp: new Date(2026, 1, 25, 10, 0).toISOString(), arousal: 8 }),
      mockLog({ timestamp: new Date(2026, 1, 25, 11, 0).toISOString(), arousal: 9 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 9, 0).toISOString(), arousal: 7 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 12, 0).toISOString(), arousal: 8 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 8, 0).toISOString(), arousal: 7 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 15, 0).toISOString(), arousal: 10 }),
    ];

    const result = calculateRiskForecast(logs);
    expect(result.level).toBe('high');
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it('returns moderate when score is 30-59', () => {
    // 2 out of 6 high arousal => rate ~0.33 => score ~33
    const logs = [
      mockLog({ timestamp: new Date(2026, 1, 25, 10, 0).toISOString(), arousal: 8 }),
      mockLog({ timestamp: new Date(2026, 1, 25, 11, 0).toISOString(), arousal: 7 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 9, 0).toISOString(), arousal: 3 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 12, 0).toISOString(), arousal: 2 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 8, 0).toISOString(), arousal: 4 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 15, 0).toISOString(), arousal: 1 }),
    ];

    const result = calculateRiskForecast(logs);
    expect(result.level).toBe('moderate');
    expect(result.score).toBeGreaterThanOrEqual(30);
    expect(result.score).toBeLessThan(60);
  });

  it('returns low when score < 30', () => {
    // 1 out of 6 high arousal => rate ~0.17 => score ~17
    const logs = [
      mockLog({ timestamp: new Date(2026, 1, 25, 10, 0).toISOString(), arousal: 8 }),
      mockLog({ timestamp: new Date(2026, 1, 25, 11, 0).toISOString(), arousal: 3 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 9, 0).toISOString(), arousal: 2 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 12, 0).toISOString(), arousal: 4 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 8, 0).toISOString(), arousal: 1 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 15, 0).toISOString(), arousal: 3 }),
    ];

    const result = calculateRiskForecast(logs);
    expect(result.level).toBe('low');
    expect(result.score).toBeLessThan(30);
  });

  it('boosts score by 30 when upcoming risk hours are within 4 hours of current time', () => {
    // Current time is 14:00 Wednesday. Create logs with high arousal at hour 15
    // (within 4 hours). Need at least 2 incidents at same hour to trigger the boost.
    const logs = [
      mockLog({ timestamp: new Date(2026, 1, 25, 15, 0).toISOString(), arousal: 8 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 15, 0).toISOString(), arousal: 9 }),
      mockLog({ timestamp: new Date(2026, 1, 25, 10, 0).toISOString(), arousal: 3 }),
      mockLog({ timestamp: new Date(2026, 1, 18, 10, 0).toISOString(), arousal: 2 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 10, 0).toISOString(), arousal: 1 }),
      mockLog({ timestamp: new Date(2026, 1, 11, 15, 0).toISOString(), arousal: 8 }),
    ];

    const result = calculateRiskForecast(logs);
    // 3 high arousal out of 6 => base rate 0.5 => base score 50
    // + 30 for upcoming risk hours = 80
    expect(result.score).toBeGreaterThanOrEqual(60);
    expect(result.level).toBe('high');
    expect(result.contributingFactors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'risk.factors.highStressTime' }),
      ])
    );
  });
});
