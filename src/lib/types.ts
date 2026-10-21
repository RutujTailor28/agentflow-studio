// Core domain types for the AgentFlow Studio simulation.
// Everything here is frontend-only, mock data — no network calls are made.

export type ToolName = 'web_search' | 'read_doc' | 'calculator' | 'crm_lookup';

/**
 * A single scripted step in a scenario. The reasoning text is streamed
 * character-by-character by the engine to mimic a model "thinking".
 */
export interface StepSpec {
  id: string;
  title: string;
  tool: ToolName;
  /** Human-readable representation of the tool input / arguments. */
  input: string;
  /** Full reasoning text that is streamed token-by-token by the engine. */
  reasoning: string;
  /** Mock tool result, shown after the tool "executes". Markdown-ish. */
  result: string;
  /** When true, execution pauses on this step for human approval. */
  requiresApproval?: boolean;
  /** Short label describing why this step is sensitive. */
  sensitiveLabel?: string;
  /** Approximate latency this step contributes, in milliseconds (mock). */
  latencyMs: number;
  /** Approximate token cost this step contributes (mock). */
  tokens: number;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  /** The natural-language task the "user" asked the agent to perform. */
  prompt: string;
  tags: string[];
  /** High-level plan bullets the agent produces before executing. */
  plan: string[];
  steps: StepSpec[];
  /** Final markdown-ish deliverable rendered when the run completes. */
  finalOutput: string;
}

export type StepStatus =
  | 'pending'
  | 'streaming'
  | 'awaiting-approval'
  | 'running-tool'
  | 'done'
  | 'rejected'
  | 'skipped';

export interface StepRuntime {
  status: StepStatus;
  /** Number of reasoning characters revealed so far. */
  streamedChars: number;
  /** Whether the tool call has produced its result. */
  toolDone: boolean;
}

export type RunPhase =
  | 'planning'
  | 'running'
  | 'awaiting-approval'
  | 'done'
  | 'rejected';

export interface RunState {
  scenarioId: string;
  phase: RunPhase;
  /** Index of the step currently being worked on. */
  currentStep: number;
  steps: StepRuntime[];
  /** Monotonic counter of how many engine ticks have been applied. */
  tickCount: number;
}

// ---- Dashboard / metrics types ------------------------------------------

export type RunOutcome = 'success' | 'failed' | 'rejected';

export interface RunRecord {
  id: string;
  scenarioId: string;
  scenarioTitle: string;
  /** ISO timestamp of when the run started. */
  startedAt: string;
  outcome: RunOutcome;
  latencyMs: number;
  costUsd: number;
  steps: number;
  /** Whether a human-in-the-loop approval was involved. */
  hadApproval: boolean;
}

export interface MetricsSummary {
  total: number;
  successes: number;
  failures: number;
  rejections: number;
  successRate: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  avgCostUsd: number;
  totalCostUsd: number;
  avgSteps: number;
}
