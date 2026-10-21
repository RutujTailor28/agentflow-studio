'use client';

import type { StepSpec } from '@/lib/types';

export function ApprovalGate({
  step,
  onApprove,
  onReject,
}: {
  step: StepSpec;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="card animate-fade-in border-amber-500/40 bg-amber-500/[0.06] p-5 shadow-[0_0_40px_rgba(245,158,11,0.1)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-500/20 text-lg">
          🔒
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-amber-100">
              Human approval required
            </h3>
            <span className="chip border-amber-500/40 bg-amber-500/10 text-amber-200">
              paused
            </span>
          </div>
          <p className="mt-1 text-sm text-amber-100/80">
            The agent wants to run{' '}
            <span className="font-mono text-amber-200">{step.tool}</span> for
            step <span className="font-medium">“{step.title}”</span>.
          </p>
          {step.sensitiveLabel && (
            <p className="mt-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-sm text-amber-100/90">
              ⚠ {step.sensitiveLabel}
            </p>
          )}
          <div className="mt-3 font-mono text-xs text-amber-100/70">
            {step.tool}({step.input})
          </div>

          <div className="mt-4 flex gap-2">
            <button onClick={onApprove} className="btn-primary">
              ✓ Approve &amp; continue
            </button>
            <button onClick={onReject} className="btn-danger">
              ✕ Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
