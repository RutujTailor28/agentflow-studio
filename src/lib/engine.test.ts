import { describe, it, expect } from 'vitest';
import {
  initRun,
  tick,
  approve,
  reject,
  runToCompletion,
  isTerminal,
  isBlocked,
  approvalStepIndex,
  demoRunState,
  CHARS_PER_TICK,
} from './engine';
import { getScenario, scenarios, DEFAULT_SCENARIO_ID } from './scenarios';
import type { Scenario } from './types';

const scenario = getScenario(DEFAULT_SCENARIO_ID) as Scenario;

describe('initRun', () => {
  it('starts in the planning phase with all steps pending', () => {
    const s = initRun(scenario);
    expect(s.phase).toBe('planning');
    expect(s.currentStep).toBe(0);
    expect(s.steps).toHaveLength(scenario.steps.length);
    expect(s.steps.every((st) => st.status === 'pending')).toBe(true);
    expect(s.tickCount).toBe(0);
  });
});

describe('tick', () => {
  it('leaves planning and begins streaming the first step in one tick', () => {
    const s = tick(scenario, initRun(scenario));
    expect(s.phase).toBe('running');
    expect(s.steps[0].status).toBe('streaming');
    expect(s.tickCount).toBe(1);
  });

  it('does not mutate the input state', () => {
    const start = initRun(scenario);
    const next = tick(scenario, start);
    expect(start.phase).toBe('planning');
    expect(start.steps[0].status).toBe('pending');
    expect(next).not.toBe(start);
  });

  it('reveals reasoning characters incrementally', () => {
    let s = tick(scenario, initRun(scenario)); // now streaming step 0
    const before = s.steps[0].streamedChars;
    s = tick(scenario, s);
    expect(s.steps[0].streamedChars).toBe(before + CHARS_PER_TICK);
  });

  it('pauses for approval when a sensitive step finishes streaming', () => {
    let s = initRun(scenario);
    let guard = 0;
    while (!isBlocked(s) && !isTerminal(s) && guard < 10000) {
      s = tick(scenario, s);
      guard++;
    }
    expect(s.phase).toBe('awaiting-approval');
    expect(s.currentStep).toBe(approvalStepIndex(scenario));
    expect(s.steps[s.currentStep].status).toBe('awaiting-approval');
  });

  it('is a no-op when awaiting approval', () => {
    let s = initRun(scenario);
    while (!isBlocked(s)) s = tick(scenario, s);
    const frozen = tick(scenario, s);
    expect(frozen).toBe(s);
  });
});

describe('approve / reject', () => {
  it('resumes execution after approval and reaches done', () => {
    let s = initRun(scenario);
    while (!isBlocked(s)) s = tick(scenario, s);
    s = approve(scenario, s);
    expect(s.phase).toBe('running');
    let guard = 0;
    while (!isTerminal(s) && !isBlocked(s) && guard < 10000) {
      s = tick(scenario, s);
      guard++;
    }
    expect(s.phase).toBe('done');
    expect(s.steps.every((st) => st.status === 'done')).toBe(true);
  });

  it('halts the run and skips remaining steps on reject', () => {
    let s = initRun(scenario);
    while (!isBlocked(s)) s = tick(scenario, s);
    const idx = s.currentStep;
    s = reject(scenario, s);
    expect(s.phase).toBe('rejected');
    expect(s.steps[idx].status).toBe('rejected');
    for (let j = idx + 1; j < s.steps.length; j++) {
      expect(s.steps[j].status).toBe('skipped');
    }
  });

  it('ignores approve/reject unless awaiting approval', () => {
    const s = initRun(scenario);
    expect(approve(scenario, s)).toBe(s);
    expect(reject(scenario, s)).toBe(s);
  });
});

describe('runToCompletion', () => {
  it('auto-approves and completes every scenario', () => {
    for (const sc of scenarios) {
      const s = runToCompletion(sc, { autoApprove: true });
      expect(s.phase).toBe('done');
      expect(s.steps).toHaveLength(sc.steps.length);
      expect(s.steps.every((st) => st.status === 'done')).toBe(true);
    }
  });

  it('ends in rejected when auto-approve is off (scenarios with a gate)', () => {
    for (const sc of scenarios) {
      const s = runToCompletion(sc, { autoApprove: false });
      if (approvalStepIndex(sc) >= 0) {
        expect(s.phase).toBe('rejected');
      } else {
        expect(s.phase).toBe('done');
      }
    }
  });
});

describe('demoRunState', () => {
  it('shows several done steps, one streaming, and an open approval gate', () => {
    const s = demoRunState(scenario);
    const idx = approvalStepIndex(scenario);
    expect(s.phase).toBe('awaiting-approval');
    expect(s.currentStep).toBe(idx);
    expect(s.steps[idx].status).toBe('awaiting-approval');

    const doneCount = s.steps.filter((st) => st.status === 'done').length;
    const streamingCount = s.steps.filter((st) => st.status === 'streaming').length;
    expect(doneCount).toBeGreaterThanOrEqual(1);
    expect(streamingCount).toBe(1);
  });

  it('partially streams the step immediately before the gate', () => {
    const s = demoRunState(scenario);
    const idx = approvalStepIndex(scenario);
    const streaming = s.steps[idx - 1];
    expect(streaming.status).toBe('streaming');
    expect(streaming.streamedChars).toBeGreaterThan(0);
    expect(streaming.streamedChars).toBeLessThan(scenario.steps[idx - 1].reasoning.length);
  });
});
