import type { RunState, Scenario, StepRuntime } from './types';

/**
 * The scenario engine is a pure, deterministic state machine. The UI drives it
 * by calling `tick` on an interval; tests drive it synchronously in a loop.
 *
 * Lifecycle of a run:
 *   planning → running → (awaiting-approval → running)* → done | rejected
 *
 * Within `running`, each step moves through:
 *   pending → streaming → (awaiting-approval →) running-tool → done
 */

/** Reasoning characters revealed per tick. */
export const CHARS_PER_TICK = 6;

function cloneState(s: RunState): RunState {
  return {
    ...s,
    steps: s.steps.map((st) => ({ ...st })),
  };
}

function emptyRuntime(): StepRuntime {
  return { status: 'pending', streamedChars: 0, toolDone: false };
}

export function initRun(scenario: Scenario): RunState {
  return {
    scenarioId: scenario.id,
    phase: 'planning',
    currentStep: 0,
    steps: scenario.steps.map(emptyRuntime),
    tickCount: 0,
  };
}

export function isTerminal(s: RunState): boolean {
  return s.phase === 'done' || s.phase === 'rejected';
}

/** Does the engine need a human to act before it can progress? */
export function isBlocked(s: RunState): boolean {
  return s.phase === 'awaiting-approval';
}

function advanceToNext(scenario: Scenario, state: RunState): RunState {
  const next = state.currentStep + 1;
  if (next >= scenario.steps.length) {
    state.phase = 'done';
    return state;
  }
  state.currentStep = next;
  state.steps[next].status = 'streaming';
  state.phase = 'running';
  return state;
}

/**
 * Apply a single unit of simulated work. Returns a new state (never mutates the
 * input). When the run is terminal or blocked on approval, the state is
 * returned unchanged.
 */
export function tick(scenario: Scenario, prev: RunState): RunState {
  if (isTerminal(prev) || isBlocked(prev)) return prev;

  const state = cloneState(prev);
  state.tickCount += 1;

  // Planning phase lasts a single tick, then the first step starts streaming.
  if (state.phase === 'planning') {
    state.phase = 'running';
    if (state.steps.length > 0) {
      state.steps[0].status = 'streaming';
    } else {
      state.phase = 'done';
    }
    return state;
  }

  const i = state.currentStep;
  const step = scenario.steps[i];
  const rt = state.steps[i];

  if (rt.status === 'streaming') {
    rt.streamedChars = Math.min(
      step.reasoning.length,
      rt.streamedChars + CHARS_PER_TICK,
    );
    if (rt.streamedChars >= step.reasoning.length) {
      if (step.requiresApproval) {
        rt.status = 'awaiting-approval';
        state.phase = 'awaiting-approval';
      } else {
        rt.status = 'running-tool';
      }
    }
    return state;
  }

  if (rt.status === 'running-tool') {
    rt.toolDone = true;
    rt.status = 'done';
    return advanceToNext(scenario, state);
  }

  return state;
}

/** Human approves the pending sensitive step; execution resumes. */
export function approve(scenario: Scenario, prev: RunState): RunState {
  if (prev.phase !== 'awaiting-approval') return prev;
  const state = cloneState(prev);
  state.steps[state.currentStep].status = 'running-tool';
  state.phase = 'running';
  return state;
}

/** Human rejects the pending sensitive step; the run halts. */
export function reject(scenario: Scenario, prev: RunState): RunState {
  if (prev.phase !== 'awaiting-approval') return prev;
  const state = cloneState(prev);
  state.steps[state.currentStep].status = 'rejected';
  for (let j = state.currentStep + 1; j < state.steps.length; j++) {
    state.steps[j].status = 'skipped';
  }
  state.phase = 'rejected';
  return state;
}

/**
 * Run the engine to completion synchronously, auto-approving any approval
 * gates. Bounded to avoid infinite loops in tests. Used by tests and to
 * pre-compute mock run metrics.
 */
export function runToCompletion(
  scenario: Scenario,
  opts: { autoApprove?: boolean; maxTicks?: number } = {},
): RunState {
  const { autoApprove = true, maxTicks = 100_000 } = opts;
  let state = initRun(scenario);
  let guard = 0;
  while (!isTerminal(state) && guard < maxTicks) {
    guard += 1;
    if (isBlocked(state)) {
      state = autoApprove ? approve(scenario, state) : reject(scenario, state);
      continue;
    }
    state = tick(scenario, state);
  }
  return state;
}

/** Index of the first step that requires human approval, or -1. */
export function approvalStepIndex(scenario: Scenario): number {
  return scenario.steps.findIndex((s) => s.requiresApproval);
}

/**
 * Build a hand-crafted "mid-run" snapshot for `?demo=1`: several steps done,
 * one still streaming, and an approval gate visible. This is a presentational
 * snapshot for screenshots; it is constructed directly rather than by ticking.
 */
export function demoRunState(scenario: Scenario): RunState {
  const state = initRun(scenario);
  state.phase = 'awaiting-approval';

  const approvalIdx =
    approvalStepIndex(scenario) >= 0
      ? approvalStepIndex(scenario)
      : Math.max(0, scenario.steps.length - 1);

  // Everything before the approval step is finished...
  for (let j = 0; j < approvalIdx; j++) {
    state.steps[j] = {
      status: 'done',
      streamedChars: scenario.steps[j].reasoning.length,
      toolDone: true,
    };
  }

  // ...except the step immediately before the gate, which we leave mid-stream
  // so the screenshot shows live token streaming next to the gate.
  const streamingIdx = approvalIdx - 1;
  if (streamingIdx >= 0) {
    const full = scenario.steps[streamingIdx].reasoning.length;
    state.steps[streamingIdx] = {
      status: 'streaming',
      streamedChars: Math.max(1, Math.floor(full * 0.55)),
      toolDone: false,
    };
  }

  // The approval step shows its full reasoning with the gate open.
  state.steps[approvalIdx] = {
    status: 'awaiting-approval',
    streamedChars: scenario.steps[approvalIdx].reasoning.length,
    toolDone: false,
  };
  state.currentStep = approvalIdx;

  return state;
}
