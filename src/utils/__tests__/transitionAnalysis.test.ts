import { describe, it, expect } from 'vitest';
import { calculateTransitionStats } from '../../utils/transitionAnalysis';
import type { ScheduleEntry, ScheduleActivity } from '../../types';

const mockActivity = (title = 'Math Class'): ScheduleActivity => ({
  id: 'act-1',
  title,
  icon: 'book',
  scheduledStart: '09:00',
  scheduledEnd: '10:00',
  durationMinutes: 60,
});

const mockEntry = (overrides: Partial<ScheduleEntry> = {}): ScheduleEntry => ({
  id: 'entry-1',
  date: '2026-03-01',
  context: 'school',
  activity: mockActivity(),
  status: 'completed',
  transitionDifficulty: 5,
  ...overrides,
});

describe('calculateTransitionStats', () => {
  it('returns empty result for empty entries', () => {
    const result = calculateTransitionStats([]);
    expect(result.overallAvgDifficulty).toBe(0);
    expect(result.totalTransitions).toBe(0);
    expect(result.hardestTransitions).toEqual([]);
    expect(result.easiestTransitions).toEqual([]);
    expect(result.effectiveSupports).toEqual([]);
    expect(result.recentDifficulties).toEqual([]);
  });

  it('returns empty result when no entries are completed with transition data', () => {
    const entries = [
      mockEntry({ status: 'upcoming', transitionDifficulty: undefined }),
      mockEntry({ status: 'skipped', transitionDifficulty: undefined }),
    ];
    const result = calculateTransitionStats(entries);
    expect(result.totalTransitions).toBe(0);
  });

  it('calculates overall average difficulty correctly', () => {
    const entries = [
      mockEntry({ id: 'e1', date: '2026-03-01', transitionDifficulty: 4 }),
      mockEntry({ id: 'e2', date: '2026-03-02', transitionDifficulty: 6 }),
      mockEntry({ id: 'e3', date: '2026-03-03', transitionDifficulty: 8 }),
    ];
    const result = calculateTransitionStats(entries);
    expect(result.overallAvgDifficulty).toBe(6);
    expect(result.totalTransitions).toBe(3);
  });

  it('groups transitions by activity and calculates per-activity stats', () => {
    const entries = [
      mockEntry({ id: 'e1', date: '2026-03-01', activity: mockActivity('Math'), transitionDifficulty: 8 }),
      mockEntry({ id: 'e2', date: '2026-03-02', activity: mockActivity('Math'), transitionDifficulty: 6 }),
      mockEntry({ id: 'e3', date: '2026-03-03', activity: mockActivity('Art'), transitionDifficulty: 2 }),
    ];
    const result = calculateTransitionStats(entries);

    // Hardest first
    expect(result.hardestTransitions[0].activityName).toBe('Math');
    expect(result.hardestTransitions[0].avgDifficulty).toBe(7);
    expect(result.hardestTransitions[0].count).toBe(2);

    // Easiest first
    expect(result.easiestTransitions[0].activityName).toBe('Art');
    expect(result.easiestTransitions[0].avgDifficulty).toBe(2);
  });

  it('detects improving trend when second half has lower difficulty', () => {
    const entries = [
      mockEntry({ id: 'e1', date: '2026-03-01', activity: mockActivity('Math'), transitionDifficulty: 8 }),
      mockEntry({ id: 'e2', date: '2026-03-02', activity: mockActivity('Math'), transitionDifficulty: 9 }),
      mockEntry({ id: 'e3', date: '2026-03-03', activity: mockActivity('Math'), transitionDifficulty: 3 }),
      mockEntry({ id: 'e4', date: '2026-03-04', activity: mockActivity('Math'), transitionDifficulty: 2 }),
    ];
    const result = calculateTransitionStats(entries);
    const mathStat = result.hardestTransitions.find(t => t.activityName === 'Math')
      || result.easiestTransitions.find(t => t.activityName === 'Math');
    expect(mathStat?.trend).toBe('improving');
  });

  it('detects worsening trend when second half has higher difficulty', () => {
    const entries = [
      mockEntry({ id: 'e1', date: '2026-03-01', activity: mockActivity('Math'), transitionDifficulty: 2 }),
      mockEntry({ id: 'e2', date: '2026-03-02', activity: mockActivity('Math'), transitionDifficulty: 3 }),
      mockEntry({ id: 'e3', date: '2026-03-03', activity: mockActivity('Math'), transitionDifficulty: 8 }),
      mockEntry({ id: 'e4', date: '2026-03-04', activity: mockActivity('Math'), transitionDifficulty: 9 }),
    ];
    const result = calculateTransitionStats(entries);
    const allStats = [...result.hardestTransitions, ...result.easiestTransitions];
    const mathStat = allStats.find(t => t.activityName === 'Math');
    expect(mathStat?.trend).toBe('worsening');
  });

  it('detects stable trend when difficulty is consistent', () => {
    const entries = [
      mockEntry({ id: 'e1', date: '2026-03-01', activity: mockActivity('Math'), transitionDifficulty: 5 }),
      mockEntry({ id: 'e2', date: '2026-03-02', activity: mockActivity('Math'), transitionDifficulty: 5 }),
      mockEntry({ id: 'e3', date: '2026-03-03', activity: mockActivity('Math'), transitionDifficulty: 5 }),
      mockEntry({ id: 'e4', date: '2026-03-04', activity: mockActivity('Math'), transitionDifficulty: 5 }),
    ];
    const result = calculateTransitionStats(entries);
    const allStats = [...result.hardestTransitions, ...result.easiestTransitions];
    const mathStat = allStats.find(t => t.activityName === 'Math');
    expect(mathStat?.trend).toBe('stable');
  });

  it('tracks effective supports sorted by lowest avg difficulty', () => {
    const entries = [
      mockEntry({
        id: 'e1', date: '2026-03-01', transitionDifficulty: 3,
        transitionSupport: ['Timer', 'Visual Schedule'],
      }),
      mockEntry({
        id: 'e2', date: '2026-03-02', transitionDifficulty: 7,
        transitionSupport: ['Visual Schedule'],
      }),
      mockEntry({
        id: 'e3', date: '2026-03-03', transitionDifficulty: 2,
        transitionSupport: ['Timer'],
      }),
    ];
    const result = calculateTransitionStats(entries);

    // Timer: used in entries with diff 3 and 2 => avg 2.5
    // Visual Schedule: used in entries with diff 3 and 7 => avg 5
    expect(result.effectiveSupports[0].strategy).toBe('Timer');
    expect(result.effectiveSupports[0].avgDifficultyWhenUsed).toBe(2.5);
    expect(result.effectiveSupports[0].usageCount).toBe(2);

    expect(result.effectiveSupports[1].strategy).toBe('Visual Schedule');
    expect(result.effectiveSupports[1].avgDifficultyWhenUsed).toBe(5);
  });

  it('returns at most 14 recent difficulties', () => {
    const entries = Array.from({ length: 20 }, (_, i) =>
      mockEntry({
        id: `e${i}`,
        date: `2026-03-${String(i + 1).padStart(2, '0')}`,
        transitionDifficulty: i + 1,
      })
    );
    const result = calculateTransitionStats(entries);
    expect(result.recentDifficulties).toHaveLength(14);
    // Should be the last 14
    expect(result.recentDifficulties[0].difficulty).toBe(7);
    expect(result.recentDifficulties[13].difficulty).toBe(20);
  });

  it('limits hardest and easiest transitions to 5 entries each', () => {
    const activities = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    const entries = activities.map((name, i) =>
      mockEntry({
        id: `e${i}`,
        date: `2026-03-${String(i + 1).padStart(2, '0')}`,
        activity: mockActivity(name),
        transitionDifficulty: i + 1,
      })
    );
    const result = calculateTransitionStats(entries);
    expect(result.hardestTransitions.length).toBeLessThanOrEqual(5);
    expect(result.easiestTransitions.length).toBeLessThanOrEqual(5);
  });
});
