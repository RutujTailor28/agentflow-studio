import type { RunRecord } from '@/lib/types';
import { dailyCounts, byScenario, formatUsd, formatMs, percentile } from '@/lib/metrics';

export function StatCard({
  label,
  value,
  sub,
  tone = 'teal',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'teal' | 'amber' | 'slate';
}) {
  const bar =
    tone === 'teal'
      ? 'from-teal-500 to-teal-400'
      : tone === 'amber'
      ? 'from-amber-500 to-amber-400'
      : 'from-slate-500 to-slate-400';
  return (
    <div className="card p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
      <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${bar} opacity-70`} />
    </div>
  );
}

/** Daily run-volume bar chart with the successful portion highlighted. */
export function VolumeChart({ runs }: { runs: RunRecord[] }) {
  const data = dailyCounts(runs);
  const w = 520;
  const h = 180;
  const padL = 28;
  const padB = 28;
  const padT = 10;
  const max = Math.max(1, ...data.map((d) => d.total));
  const bw = (w - padL) / Math.max(1, data.length);
  const barW = Math.max(6, bw * 0.6);

  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-semibold text-white">Runs per day</div>
      <div className="scroll-thin overflow-x-auto">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Runs per day">
          {/* gridlines */}
          {[0, 0.5, 1].map((g) => {
            const y = padT + (h - padT - padB) * (1 - g);
            return (
              <g key={g}>
                <line x1={padL} y1={y} x2={w} y2={y} stroke="#1e2a52" strokeWidth={1} />
                <text x={0} y={y + 3} fontSize="9" fill="#64748b">
                  {Math.round(max * g)}
                </text>
              </g>
            );
          })}
          {data.map((d, i) => {
            const x = padL + i * bw + (bw - barW) / 2;
            const fullH = (h - padT - padB) * (d.total / max);
            const okH = (h - padT - padB) * (d.successes / max);
            const yFull = h - padB - fullH;
            const yOk = h - padB - okH;
            return (
              <g key={d.date}>
                <rect x={x} y={yFull} width={barW} height={fullH} rx={2} fill="#1e2a52" />
                <rect x={x} y={yOk} width={barW} height={okH} rx={2} fill="#14b8a6" />
                {i % 2 === 0 && (
                  <text
                    x={x + barW / 2}
                    y={h - padB + 12}
                    fontSize="8"
                    fill="#64748b"
                    textAnchor="middle"
                  >
                    {d.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-1 flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-teal-500" /> success
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm bg-navy-600" /> total
        </span>
      </div>
    </div>
  );
}

/** Outcome donut chart (success / rejected / failed). */
export function OutcomeDonut({ runs }: { runs: RunRecord[] }) {
  const counts = {
    success: runs.filter((r) => r.outcome === 'success').length,
    rejected: runs.filter((r) => r.outcome === 'rejected').length,
    failed: runs.filter((r) => r.outcome === 'failed').length,
  };
  const total = Math.max(1, runs.length);
  const segments = [
    { key: 'success', value: counts.success, color: '#14b8a6' },
    { key: 'rejected', value: counts.rejected, color: '#f59e0b' },
    { key: 'failed', value: counts.failed, color: '#f43f5e' },
  ];

  const r = 54;
  const c = 2 * Math.PI * r;
  const cx = 70;
  const cy = 70;
  let offset = 0;

  return (
    <div className="card p-4">
      <div className="mb-2 text-sm font-semibold text-white">Outcomes</div>
      <div className="flex items-center gap-4">
        <svg viewBox="0 0 140 140" width={140} height={140} role="img" aria-label="Outcome breakdown">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e2a52" strokeWidth={16} />
          {segments.map((s) => {
            const frac = s.value / total;
            const dash = frac * c;
            const el = (
              <circle
                key={s.key}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={16}
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return el;
          })}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">
            {Math.round((counts.success / total) * 100)}%
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">
            success
          </text>
        </svg>
        <ul className="space-y-1.5 text-sm">
          {segments.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              <span className="capitalize text-slate-300">{s.key}</span>
              <span className="ml-auto font-mono text-slate-400">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Latency distribution with p50 / p95 markers. */
export function LatencyChart({ runs }: { runs: RunRecord[] }) {
  const values = runs.map((r) => r.latencyMs);
  const p50 = percentile(values, 0.5);
  const p95 = percentile(values, 0.95);
  const max = Math.max(1, ...values);

  // Bucket into 8 bins.
  const bins = 8;
  const counts = new Array(bins).fill(0);
  for (const v of values) {
    const idx = Math.min(bins - 1, Math.floor((v / max) * bins));
    counts[idx] += 1;
  }
  const maxCount = Math.max(1, ...counts);

  const w = 520;
  const h = 170;
  const padB = 26;
  const padT = 10;
  const bw = w / bins;

  const xFor = (ms: number) => Math.min(w - 1, (ms / max) * w);

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-white">Latency distribution</span>
        <span className="text-xs text-slate-400">
          <span className="text-teal-300">p50 {formatMs(p50)}</span> ·{' '}
          <span className="text-amber-300">p95 {formatMs(p95)}</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Latency distribution">
        {counts.map((n, i) => {
          const barH = (h - padT - padB) * (n / maxCount);
          return (
            <rect
              key={i}
              x={i * bw + bw * 0.12}
              y={h - padB - barH}
              width={bw * 0.76}
              height={barH}
              rx={2}
              fill="#2a3b66"
            />
          );
        })}
        {/* p50 / p95 markers */}
        {[
          { v: p50, color: '#14b8a6', label: 'p50' },
          { v: p95, color: '#f59e0b', label: 'p95' },
        ].map((m) => (
          <g key={m.label}>
            <line
              x1={xFor(m.v)}
              y1={padT}
              x2={xFor(m.v)}
              y2={h - padB}
              stroke={m.color}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
            <text x={xFor(m.v)} y={padT + 8} fontSize="9" fill={m.color} textAnchor="middle">
              {m.label}
            </text>
          </g>
        ))}
        <line x1={0} y1={h - padB} x2={w} y2={h - padB} stroke="#1e2a52" />
        <text x={2} y={h - padB + 14} fontSize="8" fill="#64748b">
          0ms
        </text>
        <text x={w - 2} y={h - padB + 14} fontSize="8" fill="#64748b" textAnchor="end">
          {formatMs(max)}
        </text>
      </svg>
    </div>
  );
}

/** Per-scenario breakdown as horizontal bars. */
export function ScenarioBreakdown({ runs }: { runs: RunRecord[] }) {
  const rows = byScenario(runs);
  const maxCount = Math.max(1, ...rows.map((r) => r.count));
  return (
    <div className="card p-4">
      <div className="mb-3 text-sm font-semibold text-white">By scenario</div>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.scenarioId}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-300">{r.title}</span>
              <span className="font-mono text-slate-400">
                {r.count} runs · {Math.round(r.successRate * 100)}% ok ·{' '}
                {formatUsd(r.avgCost)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400"
                style={{ width: `${(r.count / maxCount) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
