'use client';

import type { RunState, Scenario, StepStatus } from '@/lib/types';
import { TOOL_META } from '@/lib/scenarios';

/**
 * A lightweight SVG "flow graph" of the run. No chart library — just computed
 * node positions, a connecting path, and status-driven colors. Scales to the
 * container via a viewBox.
 */

const COLORS: Record<string, { fill: string; stroke: string }> = {
  done: { fill: '#14b8a6', stroke: '#2dd4bf' },
  active: { fill: '#f59e0b', stroke: '#fbbf24' },
  approval: { fill: '#0f1830', stroke: '#f59e0b' },
  rejected: { fill: '#f43f5e', stroke: '#fb7185' },
  pending: { fill: '#1e2a52', stroke: '#334169' },
  skipped: { fill: '#141c33', stroke: '#242f4d' },
};

function bucket(status: StepStatus): keyof typeof COLORS {
  switch (status) {
    case 'done':
      return 'done';
    case 'streaming':
    case 'running-tool':
      return 'active';
    case 'awaiting-approval':
      return 'approval';
    case 'rejected':
      return 'rejected';
    case 'skipped':
      return 'skipped';
    default:
      return 'pending';
  }
}

export function Timeline({
  scenario,
  state,
}: {
  scenario: Scenario;
  state: RunState;
}) {
  const n = scenario.steps.length;
  const gap = 150;
  const padX = 42;
  const cy = 54;
  const width = padX * 2 + (n - 1) * gap;
  const height = 132;

  const xs = scenario.steps.map((_, i) => padX + i * gap);

  return (
    <div className="scroll-thin overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Run step graph"
        className="min-w-full"
      >
        {/* edges */}
        {scenario.steps.slice(0, -1).map((_, i) => {
          const b = bucket(state.steps[i].status);
          const nextActive =
            state.steps[i].status === 'done' &&
            state.steps[i + 1].status !== 'pending';
          return (
            <line
              key={`e${i}`}
              x1={xs[i] + 18}
              y1={cy}
              x2={xs[i + 1] - 18}
              y2={cy}
              stroke={b === 'done' ? '#14b8a6' : '#2a3659'}
              strokeWidth={2.5}
              strokeDasharray={nextActive ? '0' : b === 'done' ? '0' : '5 5'}
              opacity={b === 'skipped' ? 0.3 : 1}
            />
          );
        })}

        {/* nodes */}
        {scenario.steps.map((step, i) => {
          const rt = state.steps[i];
          const key = bucket(rt.status);
          const c = COLORS[key];
          const active = key === 'active';
          const awaiting = key === 'approval';
          const faded = key === 'skipped';
          return (
            <g key={step.id} opacity={faded ? 0.45 : 1}>
              {(active || awaiting) && (
                <circle
                  cx={xs[i]}
                  cy={cy}
                  r={26}
                  fill="none"
                  stroke={c.stroke}
                  strokeWidth={2}
                  className="animate-pulse-ring"
                />
              )}
              <circle
                cx={xs[i]}
                cy={cy}
                r={18}
                fill={c.fill}
                stroke={c.stroke}
                strokeWidth={2}
              />
              <text
                x={xs[i]}
                y={cy + 1}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="15"
              >
                {awaiting ? '🔒' : TOOL_META[step.tool].icon}
              </text>
              {/* step index badge */}
              <text
                x={xs[i]}
                y={cy - 30}
                textAnchor="middle"
                fontSize="10"
                fill="#64748b"
                fontFamily="ui-monospace, monospace"
              >
                step {i + 1}
              </text>
              {/* label */}
              <text
                x={xs[i]}
                y={cy + 38}
                textAnchor="middle"
                fontSize="11"
                fill="#94a3b8"
              >
                {step.tool}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
