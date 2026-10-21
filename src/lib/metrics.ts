import type { MetricsSummary, RunRecord } from './types';

/**
 * Nearest-rank percentile over an unsorted numeric array.
 * `p` is a fraction in [0, 1] (e.g. 0.95 for p95). Returns 0 for empty input.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const clamped = Math.min(1, Math.max(0, p));
  const sorted = [...values].sort((a, b) => a - b);
  if (clamped === 0) return sorted[0];
  // Nearest-rank method: rank = ceil(p * N), 1-indexed.
  const rank = Math.ceil(clamped * sorted.length);
  const idx = Math.min(sorted.length - 1, Math.max(0, rank - 1));
  return sorted[idx];
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Fraction of runs whose outcome is "success", in [0, 1]. */
export function successRate(runs: RunRecord[]): number {
  if (runs.length === 0) return 0;
  const ok = runs.filter((r) => r.outcome === 'success').length;
  return ok / runs.length;
}

export function summarize(runs: RunRecord[]): MetricsSummary {
  const latencies = runs.map((r) => r.latencyMs);
  const costs = runs.map((r) => r.costUsd);
  const steps = runs.map((r) => r.steps);

  return {
    total: runs.length,
    successes: runs.filter((r) => r.outcome === 'success').length,
    failures: runs.filter((r) => r.outcome === 'failed').length,
    rejections: runs.filter((r) => r.outcome === 'rejected').length,
    successRate: successRate(runs),
    p50LatencyMs: percentile(latencies, 0.5),
    p95LatencyMs: percentile(latencies, 0.95),
    avgCostUsd: mean(costs),
    totalCostUsd: costs.reduce((a, b) => a + b, 0),
    avgSteps: mean(steps),
  };
}

/** Group runs into daily buckets for a trend chart (oldest → newest). */
export function dailyCounts(
  runs: RunRecord[],
): { date: string; total: number; successes: number }[] {
  const byDay = new Map<string, { total: number; successes: number }>();
  for (const r of runs) {
    const day = r.startedAt.slice(0, 10);
    const bucket = byDay.get(day) ?? { total: 0, successes: 0 };
    bucket.total += 1;
    if (r.outcome === 'success') bucket.successes += 1;
    byDay.set(day, bucket);
  }
  return [...byDay.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** Aggregate per-scenario stats for a breakdown table/chart. */
export function byScenario(
  runs: RunRecord[],
): { scenarioId: string; title: string; count: number; successRate: number; avgCost: number }[] {
  const map = new Map<string, RunRecord[]>();
  for (const r of runs) {
    const arr = map.get(r.scenarioId) ?? [];
    arr.push(r);
    map.set(r.scenarioId, arr);
  }
  return [...map.entries()]
    .map(([scenarioId, rs]) => ({
      scenarioId,
      title: rs[0].scenarioTitle,
      count: rs.length,
      successRate: successRate(rs),
      avgCost: mean(rs.map((r) => r.costUsd)),
    }))
    .sort((a, b) => b.count - a.count);
}

export function formatUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

export function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${Math.round(ms)}ms`;
}
