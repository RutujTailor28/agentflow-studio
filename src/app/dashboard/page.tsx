import Link from 'next/link';
import { mockRuns } from '@/lib/runs';
import { summarize, formatMs, formatUsd } from '@/lib/metrics';
import {
  StatCard,
  VolumeChart,
  OutcomeDonut,
  LatencyChart,
  ScenarioBreakdown,
} from '@/components/Charts';
import type { RunOutcome } from '@/lib/types';

const OUTCOME_STYLE: Record<RunOutcome, string> = {
  success: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  rejected: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  failed: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

function fmtDate(iso: string): string {
  // Deterministic formatting (no locale/timezone surprises at build time).
  return iso.slice(0, 10) + ' ' + iso.slice(11, 16) + 'Z';
}

export default function DashboardPage() {
  const runs = mockRuns;
  const m = summarize(runs);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">Runs dashboard</h1>
          <p className="text-sm text-slate-400">
            {m.total} simulated runs over the last two weeks · mock data
          </p>
        </div>
        <Link href="/run" className="btn-primary">
          + New run
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total runs" value={`${m.total}`} tone="slate" />
        <StatCard
          label="Success rate"
          value={`${Math.round(m.successRate * 100)}%`}
          sub={`${m.successes} ok · ${m.rejections} rejected · ${m.failures} failed`}
          tone="teal"
        />
        <StatCard label="p50 latency" value={formatMs(m.p50LatencyMs)} tone="teal" />
        <StatCard label="p95 latency" value={formatMs(m.p95LatencyMs)} tone="amber" />
        <StatCard label="Avg cost / run" value={formatUsd(m.avgCostUsd)} tone="amber" />
        <StatCard label="Total spend" value={formatUsd(m.totalCostUsd)} tone="slate" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <VolumeChart runs={runs} />
        <OutcomeDonut runs={runs} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <LatencyChart runs={runs} />
        <ScenarioBreakdown runs={runs} />
      </div>

      {/* Runs table */}
      <div className="card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-3 text-sm font-semibold text-white">
          Recent runs
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-5 py-2.5 font-medium">Run</th>
                <th className="px-5 py-2.5 font-medium">Scenario</th>
                <th className="px-5 py-2.5 font-medium">Started</th>
                <th className="px-5 py-2.5 font-medium">Outcome</th>
                <th className="px-5 py-2.5 text-right font-medium">Latency</th>
                <th className="px-5 py-2.5 text-right font-medium">Cost</th>
                <th className="px-5 py-2.5 text-center font-medium">Approval</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                >
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-400">
                    {r.id}
                  </td>
                  <td className="px-5 py-2.5 text-slate-200">
                    <Link
                      href={`/run?scenario=${r.scenarioId}`}
                      className="hover:text-teal-300"
                    >
                      {r.scenarioTitle}
                    </Link>
                  </td>
                  <td className="px-5 py-2.5 font-mono text-xs text-slate-400">
                    {fmtDate(r.startedAt)}
                  </td>
                  <td className="px-5 py-2.5">
                    <span className={`chip capitalize ${OUTCOME_STYLE[r.outcome]}`}>
                      {r.outcome}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatMs(r.latencyMs)}
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-xs text-slate-300">
                    {formatUsd(r.costUsd)}
                  </td>
                  <td className="px-5 py-2.5 text-center text-xs text-slate-400">
                    {r.hadApproval ? '🔒 yes' : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
