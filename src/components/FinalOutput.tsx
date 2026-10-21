'use client';

import { useState } from 'react';
import { Markdown } from './Markdown';

export function FinalOutput({
  source,
  rejected,
}: {
  source: string;
  rejected: boolean;
}) {
  const [copied, setCopied] = useState(false);

  if (rejected) {
    return (
      <div className="card animate-fade-in border-rose-500/30 bg-rose-500/[0.05] p-5">
        <h3 className="font-semibold text-rose-200">Run halted</h3>
        <p className="mt-1 text-sm text-rose-100/80">
          The sensitive step was rejected, so the agent stopped before producing
          a final deliverable. Nothing was written to any external system.
        </p>
      </div>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="card animate-fade-in overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/10 bg-teal-500/5 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-500/20 text-sm">
            ✓
          </span>
          <h3 className="font-semibold text-white">Final output</h3>
        </div>
        <button onClick={copy} className="btn-ghost px-3 py-1.5 text-xs">
          {copied ? 'Copied!' : 'Copy markdown'}
        </button>
      </div>
      <div className="p-5">
        <Markdown source={source} />
      </div>
    </div>
  );
}
