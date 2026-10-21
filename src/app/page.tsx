'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { scenarios, matchScenario, TOOL_META } from '@/lib/scenarios';
import type { ToolName } from '@/lib/types';

const SAMPLE_TASKS = [
  'Research competitors in the AI note-taking space and draft a summary',
  'Enrich the inbound lead "Acme Robotics" and tell me if we should prioritize it',
  'Quote a 150-seat Enterprise deal with 2 add-ons and a multi-year discount',
  'Triage ticket #4821 about the app crashing on export',
];

export default function HomePage() {
  const router = useRouter();
  const [task, setTask] = useState('');

  function runTask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const scenario = matchScenario(trimmed);
    const params = new URLSearchParams({
      scenario: scenario.id,
      task: trimmed,
    });
    router.push(`/run?${params.toString()}`);
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-navy-800/60 p-6 sm:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="chip border-teal-500/30 bg-teal-500/10 text-teal-300">
            ● Frontend-only · mock data
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Watch an AI agent <span className="text-teal-400">think</span>,{' '}
            <span className="text-amber-400">act</span>, and ask for approval.
          </h1>
          <p className="mt-3 text-slate-300">
            AgentFlow Studio simulates an autonomous agent: it drafts a plan,
            streams its reasoning, calls tools, draws a live step graph, and
            pauses for a human before anything sensitive. Give it a task or pick
            a scenario.
          </p>

          <div className="mt-6">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runTask(task)}
                placeholder="e.g. research competitors and draft a summary"
                className="w-full rounded-lg border border-white/15 bg-navy-900/70 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              />
              <button
                onClick={() => runTask(task)}
                disabled={!task.trim()}
                className="btn-primary whitespace-nowrap"
              >
                Run agent →
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLE_TASKS.map((s) => (
                <button
                  key={s}
                  onClick={() => runTask(s)}
                  className="chip hover:border-teal-500/40 hover:text-teal-200"
                  title="Run this task"
                >
                  {s.length > 52 ? `${s.slice(0, 52)}…` : s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Scenarios */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Scripted scenarios</h2>
            <p className="text-sm text-slate-400">
              Four end-to-end runs, each with a human-in-the-loop approval gate.
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-teal-400 hover:text-teal-300">
            View dashboard →
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {scenarios.map((s) => (
            <Link
              key={s.id}
              href={`/run?scenario=${s.id}`}
              className="card group flex flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5 hover:border-teal-500/40"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-white group-hover:text-teal-300">
                  {s.title}
                </h3>
                <span className="text-slate-500 transition-colors group-hover:text-teal-400">
                  →
                </span>
              </div>
              <p className="text-sm text-slate-400">{s.description}</p>
              <div className="mt-auto flex flex-wrap items-center gap-1.5">
                {[...new Set(s.steps.map((st) => st.tool))].map((tool) => (
                  <span key={tool} className="chip font-mono text-[11px]">
                    {TOOL_META[tool as ToolName].icon} {tool}
                  </span>
                ))}
                <span className="chip border-amber-500/30 bg-amber-500/10 text-amber-300">
                  approval gate
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="grid gap-4 sm:grid-cols-3">
        {[
          {
            t: '1 · Plan & stream',
            d: 'The agent emits a plan, then streams token-by-token reasoning for each step.',
          },
          {
            t: '2 · Call tools',
            d: 'web_search, read_doc, calculator and crm_lookup return mock results into a live graph.',
          },
          {
            t: '3 · Approve & deliver',
            d: 'A human approves the sensitive step; the agent produces a final deliverable.',
          },
        ].map((c) => (
          <div key={c.t} className="card p-5">
            <div className="text-sm font-semibold text-teal-300">{c.t}</div>
            <p className="mt-1 text-sm text-slate-400">{c.d}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
