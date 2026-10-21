'use client';

import type { StepRuntime, StepSpec } from '@/lib/types';
import { TOOL_META } from '@/lib/scenarios';

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: 'Pending', cls: 'border-white/10 bg-white/5 text-slate-400' },
  streaming: { label: 'Thinking…', cls: 'border-amber-500/30 bg-amber-500/10 text-amber-300' },
  'awaiting-approval': { label: 'Awaiting approval', cls: 'border-amber-500/40 bg-amber-500/15 text-amber-200' },
  'running-tool': { label: 'Running tool…', cls: 'border-teal-500/30 bg-teal-500/10 text-teal-300' },
  done: { label: 'Done', cls: 'border-teal-500/30 bg-teal-500/10 text-teal-300' },
  rejected: { label: 'Rejected', cls: 'border-rose-500/30 bg-rose-500/10 text-rose-300' },
  skipped: { label: 'Skipped', cls: 'border-white/10 bg-white/5 text-slate-500' },
};

export function StepCard({
  index,
  step,
  runtime,
}: {
  index: number;
  step: StepSpec;
  runtime: StepRuntime;
}) {
  const tool = TOOL_META[step.tool];
  const badge = STATUS_BADGE[runtime.status];
  const revealed = step.reasoning.slice(0, runtime.streamedChars);
  const isStreaming = runtime.status === 'streaming';
  const isActive =
    runtime.status === 'streaming' ||
    runtime.status === 'running-tool' ||
    runtime.status === 'awaiting-approval';
  const showResult = runtime.status === 'done' && runtime.toolDone;
  const dimmed = runtime.status === 'pending' || runtime.status === 'skipped';

  return (
    <div
      className={`card animate-fade-in p-4 transition-colors ${
        isActive ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.08)]' : ''
      } ${dimmed ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-navy-900/60 font-mono text-xs text-slate-400">
            {index + 1}
          </span>
          <div>
            <div className="font-medium text-white">{step.title}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-teal-300">
                {tool.icon} {step.tool}
              </span>
              {step.requiresApproval && (
                <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                  sensitive
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`chip shrink-0 ${badge.cls}`}>{badge.label}</span>
      </div>

      {/* Reasoning stream */}
      {runtime.streamedChars > 0 && (
        <div className="mt-3 rounded-lg border border-white/5 bg-navy-900/50 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-500">
            reasoning
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
            {revealed}
            {isStreaming && (
              <span className="ml-0.5 inline-block h-4 w-1.5 translate-y-0.5 animate-blink bg-amber-400" />
            )}
          </p>
        </div>
      )}

      {/* Tool invocation */}
      {(isActive || showResult || runtime.status === 'rejected') && (
        <div className="mt-2 font-mono text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <span className="text-teal-400">▸</span>
            <span className="truncate">
              {step.tool}(<span className="text-slate-300">{step.input}</span>)
            </span>
          </div>
        </div>
      )}

      {/* Tool result */}
      {showResult && (
        <div className="mt-2 rounded-lg border border-teal-500/20 bg-teal-500/5 p-3">
          <div className="mb-1 text-[10px] uppercase tracking-wider text-teal-400/70">
            tool result
          </div>
          <p className="text-sm leading-relaxed text-slate-200">{step.result}</p>
        </div>
      )}

      {runtime.status === 'rejected' && (
        <div className="mt-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200">
          Step rejected by the human reviewer — the tool was not executed.
        </div>
      )}
    </div>
  );
}
