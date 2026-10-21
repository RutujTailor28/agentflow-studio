'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  getScenario,
  DEFAULT_SCENARIO_ID,
  scenarios,
} from '@/lib/scenarios';
import {
  initRun,
  demoRunState,
  tick,
  approve,
  reject,
  isTerminal,
  isBlocked,
} from '@/lib/engine';
import { formatMs, formatUsd } from '@/lib/metrics';
import type { RunState, Scenario } from '@/lib/types';
import { Timeline } from './Timeline';
import { StepCard } from './StepCard';
import { ApprovalGate } from './ApprovalGate';
import { FinalOutput } from './FinalOutput';

const TICK_INTERVAL_MS = 55;
// Mock pricing used to turn tokens into a running cost estimate.
const USD_PER_1K_TOKENS = 0.015;

function costOf(scenario: Scenario, state: RunState): number {
  let tokens = 0;
  state.steps.forEach((rt, i) => {
    if (rt.status === 'done') tokens += scenario.steps[i].tokens;
    else if (rt.status === 'streaming' || rt.status === 'awaiting-approval') {
      const frac =
        rt.streamedChars / Math.max(1, scenario.steps[i].reasoning.length);
      tokens += scenario.steps[i].tokens * frac;
    }
  });
  return (tokens / 1000) * USD_PER_1K_TOKENS;
}

function latencyOf(scenario: Scenario, state: RunState): number {
  let ms = 0;
  state.steps.forEach((rt, i) => {
    if (rt.status === 'done') ms += scenario.steps[i].latencyMs;
  });
  return ms;
}

export function RunView() {
  const params = useSearchParams();
  const scenarioId = params.get('scenario') ?? DEFAULT_SCENARIO_ID;
  const customTask = params.get('task');
  const demo = params.get('demo') === '1';

  const scenario = useMemo(
    () => getScenario(scenarioId) ?? (getScenario(DEFAULT_SCENARIO_ID) as Scenario),
    [scenarioId],
  );

  const [state, setState] = useState<RunState>(() =>
    demo ? demoRunState(scenario) : initRun(scenario),
  );
  // Auto-play immediately for a normal run; demo stays as a paused snapshot.
  const [running, setRunning] = useState(!demo);
  const feedEndRef = useRef<HTMLDivElement>(null);

  // Reset whenever the scenario or demo flag changes (client-side navigation).
  const runKey = `${scenario.id}:${demo ? 'demo' : 'live'}`;
  const lastKey = useRef(runKey);
  useEffect(() => {
    if (lastKey.current === runKey) return;
    lastKey.current = runKey;
    setState(demo ? demoRunState(scenario) : initRun(scenario));
    setRunning(!demo);
  }, [runKey, scenario, demo]);

  // Drive the engine. The interval is torn down and recreated only when the
  // phase changes (not on every streamed character), keeping timing steady.
  useEffect(() => {
    if (!running) return;
    if (isTerminal(state) || isBlocked(state)) return;
    const id = setInterval(() => {
      setState((prev) => tick(scenario, prev));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, scenario, state.phase]);

  const terminal = isTerminal(state);
  const blocked = isBlocked(state);
  const approvalStep =
    blocked && state.currentStep < scenario.steps.length
      ? scenario.steps[state.currentStep]
      : null;

  const doneCount = state.steps.filter((s) => s.status === 'done').length;
  const progressPct = Math.round((doneCount / scenario.steps.length) * 100);

  const statusLabel =
    state.phase === 'planning'
      ? 'Planning'
      : state.phase === 'awaiting-approval'
      ? 'Awaiting approval'
      : state.phase === 'done'
      ? 'Completed'
      : state.phase === 'rejected'
      ? 'Halted'
      : running
      ? 'Running'
      : 'Paused';

  const statusTone =
    state.phase === 'done'
      ? 'text-teal-300'
      : state.phase === 'rejected'
      ? 'text-rose-300'
      : state.phase === 'awaiting-approval'
      ? 'text-amber-300'
      : 'text-slate-300';

  function onApprove() {
    setState((prev) => approve(scenario, prev));
    setRunning(true);
  }
  function onReject() {
    setState((prev) => reject(scenario, prev));
  }
  function onRestart() {
    setState(initRun(scenario));
    setRunning(true);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Link href="/" className="hover:text-teal-300">
            Home
          </Link>
          <span>/</span>
          <span className="text-slate-300">{scenario.title}</span>
          {demo && (
            <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">
              demo snapshot
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-white">Agent run</h1>
        <div className="mt-2 rounded-xl border border-white/10 bg-navy-800/60 p-4">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            task
          </div>
          <p className="mt-0.5 text-slate-200">
            {customTask ? customTask : scenario.prompt}
          </p>
          {customTask && (
            <p className="mt-1 text-xs text-slate-500">
              Routed to the closest scripted scenario:{' '}
              <span className="text-teal-400">{scenario.title}</span>.
            </p>
          )}
        </div>
      </div>

      {/* Scenario switcher */}
      <div className="flex flex-wrap gap-2">
        {scenarios.map((s) => (
          <Link
            key={s.id}
            href={`/run?scenario=${s.id}`}
            className={`chip ${
              s.id === scenario.id
                ? 'border-teal-500/40 bg-teal-500/10 text-teal-200'
                : 'hover:border-white/20'
            }`}
          >
            {s.title}
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: plan + step feed */}
        <div className="order-2 space-y-4 lg:order-1">
          {/* Plan */}
          <div className="card p-5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Plan</span>
              <span className="chip">{scenario.steps.length} steps</span>
            </div>
            <ol className="mt-3 space-y-2">
              {scenario.plan.map((p, i) => {
                const stepDone = state.steps[i]?.status === 'done';
                const stepActive =
                  state.steps[i] &&
                  ['streaming', 'running-tool', 'awaiting-approval'].includes(
                    state.steps[i].status,
                  );
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[10px] ${
                        stepDone
                          ? 'border-teal-500/40 bg-teal-500/20 text-teal-300'
                          : stepActive
                          ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
                          : 'border-white/10 bg-white/5 text-slate-500'
                      }`}
                    >
                      {stepDone ? '✓' : i + 1}
                    </span>
                    <span className={stepDone ? 'text-slate-400' : 'text-slate-200'}>
                      {p}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            {scenario.steps.map((step, i) => {
              const rt = state.steps[i];
              if (rt.status === 'pending') return null;
              return (
                <div key={step.id}>
                  <StepCard index={i} step={step} runtime={rt} />
                  {blocked &&
                    state.currentStep === i &&
                    approvalStep && (
                      <div className="mt-3">
                        <ApprovalGate
                          step={approvalStep}
                          onApprove={onApprove}
                          onReject={onReject}
                        />
                      </div>
                    )}
                </div>
              );
            })}
          </div>

          {/* Final output */}
          {(terminal || state.phase === 'rejected') && (
            <FinalOutput
              source={scenario.finalOutput}
              rejected={state.phase === 'rejected'}
            />
          )}

          <div ref={feedEndRef} />
        </div>

        {/* Right: live graph + metrics + controls */}
        <aside className="order-1 space-y-4 lg:order-2">
          <div className="card p-4 lg:sticky lg:top-20">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Step graph</span>
              <span className={`text-xs font-medium ${statusTone}`}>
                ● {statusLabel}
              </span>
            </div>
            <Timeline scenario={scenario} state={state} />

            {/* progress */}
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* live metrics */}
            <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border border-white/5 bg-navy-900/50 p-2">
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                  Steps
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-white">
                  {doneCount}/{scenario.steps.length}
                </dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-navy-900/50 p-2">
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                  Latency
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-white">
                  {formatMs(latencyOf(scenario, state))}
                </dd>
              </div>
              <div className="rounded-lg border border-white/5 bg-navy-900/50 p-2">
                <dt className="text-[10px] uppercase tracking-wide text-slate-500">
                  Cost
                </dt>
                <dd className="mt-0.5 text-sm font-semibold text-white">
                  {formatUsd(costOf(scenario, state))}
                </dd>
              </div>
            </dl>

            {/* controls */}
            <div className="mt-4 flex flex-wrap gap-2">
              {!terminal && !blocked && (
                <button
                  onClick={() => setRunning((r) => !r)}
                  className="btn-ghost flex-1"
                >
                  {running ? '❚❚ Pause' : '▶ Play'}
                </button>
              )}
              {blocked && (
                <>
                  <button onClick={onApprove} className="btn-primary flex-1">
                    ✓ Approve
                  </button>
                  <button onClick={onReject} className="btn-danger flex-1">
                    ✕ Reject
                  </button>
                </>
              )}
              <button onClick={onRestart} className="btn-ghost flex-1">
                ↻ Restart
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-500">
              Simulated run — all tool results are mock data.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
