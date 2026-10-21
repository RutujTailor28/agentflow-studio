import { describe, it, expect } from 'vitest';
import {
  percentile,
  mean,
  successRate,
  summarize,
  dailyCounts,
  byScenario,
  formatUsd,
  formatMs,
} from './metrics';
import { mockRuns } from './runs';
import type { RunRecord } from './types';

function rec(partial: Partial<RunRecord>): RunRecord {
  return {
    id: 'r',
    scenarioId: 'competitor-research',
    scenarioTitle: 'Competitor research & summary',
    startedAt: '2026-10-20T10:00:00.000Z',
    outcome: 'success',
    latencyMs: 1000,
    costUsd: 0.03,
    steps: 4,
    hadApproval: true,
    ...partial,
  };
}

describe('percentile', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 0.5)).toBe(0);
  });

  it('computes p50 and p95 with the nearest-rank method', () => {
    const v = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(percentile(v, 0.5)).toBe(5); // ceil(0.5*10)=5 → index 4 → value 5
    expect(percentile(v, 0.95)).toBe(10); // ceil(0.95*10)=10 → value 10
  });

  it('handles single-element input and clamps p', () => {
    expect(percentile([42], 0.5)).toBe(42);
    expect(percentile([1, 2, 3], 0)).toBe(1);
    expect(percentile([1, 2, 3], 2)).toBe(3); // clamped to 1.0
  });

  it('is order-independent', () => {
    expect(percentile([9, 1, 7, 3, 5], 0.5)).toBe(5);
  });
});

describe('mean', () => {
  it('averages values and returns 0 for empty', () => {
    expect(mean([2, 4, 6])).toBe(4);
    expect(mean([])).toBe(0);
  });
});

describe('successRate', () => {
  it('is the fraction of successful runs', () => {
    const runs = [
      rec({ outcome: 'success' }),
      rec({ outcome: 'success' }),
      rec({ outcome: 'failed' }),
      rec({ outcome: 'rejected' }),
    ];
    expect(successRate(runs)).toBe(0.5);
    expect(successRate([])).toBe(0);
  });
});

describe('summarize', () => {
  it('aggregates counts, latency percentiles and cost', () => {
    const runs = [
      rec({ outcome: 'success', latencyMs: 1000, costUsd: 0.02, steps: 4 }),
      rec({ outcome: 'success', latencyMs: 2000, costUsd: 0.04, steps: 4 }),
      rec({ outcome: 'failed', latencyMs: 3000, costUsd: 0.06, steps: 2 }),
      rec({ outcome: 'rejected', latencyMs: 4000, costUsd: 0.08, steps: 3 }),
    ];
    const s = summarize(runs);
    expect(s.total).toBe(4);
    expect(s.successes).toBe(2);
    expect(s.failures).toBe(1);
    expect(s.rejections).toBe(1);
    expect(s.successRate).toBe(0.5);
    expect(s.p50LatencyMs).toBe(2000);
    expect(s.p95LatencyMs).toBe(4000);
    expect(s.totalCostUsd).toBeCloseTo(0.2, 6);
    expect(s.avgCostUsd).toBeCloseTo(0.05, 6);
    expect(s.avgSteps).toBeCloseTo(3.25, 6);
  });

  it('is safe on empty input', () => {
    const s = summarize([]);
    expect(s.total).toBe(0);
    expect(s.successRate).toBe(0);
    expect(s.p50LatencyMs).toBe(0);
    expect(s.p95LatencyMs).toBe(0);
  });
});

describe('dailyCounts', () => {
  it('buckets runs by day in chronological order', () => {
    const runs = [
      rec({ startedAt: '2026-10-20T10:00:00.000Z', outcome: 'success' }),
      rec({ startedAt: '2026-10-20T14:00:00.000Z', outcome: 'failed' }),
      rec({ startedAt: '2026-10-19T09:00:00.000Z', outcome: 'success' }),
    ];
    const days = dailyCounts(runs);
    expect(days).toHaveLength(2);
    expect(days[0].date).toBe('2026-10-19');
    expect(days[1]).toEqual({ date: '2026-10-20', total: 2, successes: 1 });
  });
});

describe('byScenario', () => {
  it('aggregates per scenario and sorts by count desc', () => {
    const runs = [
      rec({ scenarioId: 'a', scenarioTitle: 'A', outcome: 'success', costUsd: 0.1 }),
      rec({ scenarioId: 'a', scenarioTitle: 'A', outcome: 'failed', costUsd: 0.3 }),
      rec({ scenarioId: 'b', scenarioTitle: 'B', outcome: 'success', costUsd: 0.2 }),
    ];
    const rows = byScenario(runs);
    expect(rows[0].scenarioId).toBe('a');
    expect(rows[0].count).toBe(2);
    expect(rows[0].successRate).toBe(0.5);
    expect(rows[0].avgCost).toBeCloseTo(0.2, 6);
    expect(rows[1].scenarioId).toBe('b');
  });
});

describe('formatters', () => {
  it('formats USD and ms', () => {
    expect(formatUsd(0.5)).toBe('$0.50');
    expect(formatUsd(12.3)).toBe('$12.30');
    expect(formatMs(450)).toBe('450ms');
    expect(formatMs(2500)).toBe('2.50s');
  });
});

describe('mock run data', () => {
  it('is non-empty, deterministic in shape, and internally consistent', () => {
    expect(mockRuns.length).toBeGreaterThan(0);
    for (const r of mockRuns) {
      expect(r.latencyMs).toBeGreaterThan(0);
      expect(r.costUsd).toBeGreaterThan(0);
      expect(['success', 'failed', 'rejected']).toContain(r.outcome);
    }
    // Newest-first ordering.
    for (let i = 1; i < mockRuns.length; i++) {
      expect(mockRuns[i - 1].startedAt >= mockRuns[i].startedAt).toBe(true);
    }
  });
});
