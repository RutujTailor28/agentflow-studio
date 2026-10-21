import { scenarios } from './scenarios';
import type { RunOutcome, RunRecord } from './types';

/**
 * Deterministic mock run history for the dashboard. Generated with a small
 * seeded PRNG so the numbers are stable across reloads and across test runs
 * (no Date.now / Math.random — everything is reproducible).
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Baseline latency/cost characteristics per scenario (mock).
const PROFILE: Record<string, { baseMs: number; baseCost: number }> = {
  'competitor-research': { baseMs: 3300, baseCost: 0.041 },
  'sales-lead-enrichment': { baseMs: 2600, baseCost: 0.032 },
  'budget-pricing': { baseMs: 2050, baseCost: 0.024 },
  'support-triage': { baseMs: 1950, baseCost: 0.021 },
};

const TOTAL_RUNS = 48;
const DAYS = 14;
// Anchor date kept constant so output is deterministic (no system clock).
const ANCHOR_ISO = '2026-10-21T00:00:00.000Z';

function iso(dayOffset: number, rand: () => number): string {
  const anchor = new Date(ANCHOR_ISO).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const hour = Math.floor(rand() * 10) + 8; // business-ish hours 08–18
  const minute = Math.floor(rand() * 60);
  const t = anchor - dayOffset * dayMs + (hour * 60 + minute) * 60 * 1000;
  return new Date(t).toISOString();
}

function buildRuns(): RunRecord[] {
  const rand = mulberry32(20261021);
  const runs: RunRecord[] = [];

  for (let i = 0; i < TOTAL_RUNS; i++) {
    const scenario = scenarios[Math.floor(rand() * scenarios.length)];
    const profile = PROFILE[scenario.id] ?? { baseMs: 2500, baseCost: 0.03 };

    // Outcome distribution: mostly success, a few rejections, rare failures.
    const roll = rand();
    let outcome: RunOutcome;
    if (roll < 0.83) outcome = 'success';
    else if (roll < 0.95) outcome = 'rejected';
    else outcome = 'failed';

    // Latency: base + lognormal-ish jitter so p95 sits well above p50.
    const jitter = Math.pow(rand(), 2); // skews toward small values
    const latencyMs = Math.round(
      profile.baseMs * (0.8 + jitter * 1.8) + (outcome === 'failed' ? 1200 : 0),
    );

    // Cost scales loosely with latency plus noise.
    const costUsd = Number(
      (profile.baseCost * (0.85 + jitter * 1.1) + rand() * 0.004).toFixed(4),
    );

    const dayOffset = Math.floor((i / TOTAL_RUNS) * DAYS);

    runs.push({
      id: `run_${(TOTAL_RUNS - i).toString().padStart(4, '0')}`,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      startedAt: iso(dayOffset, rand),
      outcome,
      latencyMs,
      costUsd,
      steps: scenario.steps.length,
      hadApproval: scenario.steps.some((s) => s.requiresApproval),
    });
  }

  // Newest first for the table.
  return runs.sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}

export const mockRuns: RunRecord[] = buildRuns();
