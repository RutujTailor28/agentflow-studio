import type { Scenario, ToolName } from './types';

// All data below is hand-authored mock content. No external APIs are called;
// "tool results" are canned strings that simulate what a real agent runtime
// would return.

export const TOOL_META: Record<
  ToolName,
  { label: string; icon: string; blurb: string }
> = {
  web_search: {
    label: 'web_search',
    icon: '🔎',
    blurb: 'Query the public web for fresh information.',
  },
  read_doc: {
    label: 'read_doc',
    icon: '📄',
    blurb: 'Read an internal document or knowledge-base page.',
  },
  calculator: {
    label: 'calculator',
    icon: '🧮',
    blurb: 'Evaluate a numeric expression deterministically.',
  },
  crm_lookup: {
    label: 'crm_lookup',
    icon: '🗂️',
    blurb: 'Look up an account or contact in the CRM.',
  },
};

export const scenarios: Scenario[] = [
  {
    id: 'competitor-research',
    title: 'Competitor research & summary',
    description:
      'Scan the market for competing products, read a positioning doc, and draft an executive summary.',
    prompt:
      'Research the top competitors in the AI note-taking space and draft a one-page summary with positioning gaps.',
    tags: ['research', 'web_search', 'read_doc'],
    plan: [
      'Search the web for leading AI note-taking competitors.',
      'Read our internal positioning document for context.',
      'Cross-reference features and pricing to find gaps.',
      'Draft a concise executive summary with recommendations.',
    ],
    steps: [
      {
        id: 'cr-1',
        title: 'Search for leading competitors',
        tool: 'web_search',
        input: 'top AI note-taking apps 2026 market leaders',
        reasoning:
          'I need a current view of the market. I will search for the leading AI note-taking products and note their headline features and pricing tiers so I can compare them against our offering.',
        result:
          'Top results: NoteSprint (AI summaries, $12/mo), Cortex Notes (meeting transcription, $18/mo), Lumen (knowledge graph, $10/mo), Jotflow (free tier + $8/mo pro). Common themes: real-time transcription, AI summaries, limited offline support.',
        latencyMs: 1400,
        tokens: 820,
      },
      {
        id: 'cr-2',
        title: 'Read internal positioning doc',
        tool: 'read_doc',
        input: 'docs/strategy/positioning-2026.md',
        reasoning:
          'Before comparing, I should ground myself in how we currently position the product so the summary highlights genuinely differentiating angles rather than table-stakes features.',
        result:
          'Our positioning: "privacy-first, offline-capable, team knowledge base." Differentiators: local-first sync, end-to-end encryption, and a Notion-style wiki. Weak spots flagged internally: no live transcription, thin mobile app.',
        latencyMs: 900,
        tokens: 540,
      },
      {
        id: 'cr-3',
        title: 'Compute feature-gap coverage',
        tool: 'calculator',
        input: 'covered_features / total_tracked_features * 100 = 7 / 10 * 100',
        reasoning:
          'To make the summary concrete I will quantify our feature coverage against the ten most-requested capabilities tracked across competitors.',
        result: '70% feature coverage (7 of 10 tracked capabilities).',
        latencyMs: 300,
        tokens: 120,
      },
      {
        id: 'cr-4',
        title: 'Publish summary to shared workspace',
        tool: 'read_doc',
        input: 'workspace://research/competitor-summary (write)',
        reasoning:
          'The draft is ready. Publishing it to the shared research workspace will make it visible to the whole go-to-market team, so I will pause for a human to approve before writing externally.',
        result:
          'Published "Competitor Landscape — AI Note-taking (Q4 2026)" to the shared research workspace. 3 collaborators notified.',
        requiresApproval: true,
        sensitiveLabel: 'Writes to a shared, team-visible workspace',
        latencyMs: 700,
        tokens: 260,
      },
    ],
    finalOutput: [
      '# Competitor Landscape — AI Note-taking (Q4 2026)',
      '',
      '**TL;DR:** The market clusters around live transcription + AI summaries. Our moat is *privacy-first, local-first* knowledge management — but we trail on transcription and mobile.',
      '',
      '## Key competitors',
      '- **Cortex Notes** — best-in-class meeting transcription ($18/mo)',
      '- **NoteSprint** — fast AI summaries, mainstream pricing ($12/mo)',
      '- **Lumen** — knowledge-graph angle, closest to our wiki story ($10/mo)',
      '',
      '## Positioning gaps',
      '1. **No live transcription** — the single most common competitor feature.',
      '2. **Thin mobile app** — risks churn for on-the-go users.',
      '',
      '## Recommendation',
      'Lead with privacy + local-first as the wedge; fast-follow on transcription via an on-device model to stay on-brand. Current coverage: **70%** of tracked capabilities.',
    ].join('\n'),
  },

  {
    id: 'sales-lead-enrichment',
    title: 'Sales lead enrichment (CRM)',
    description:
      'Pull an inbound lead from the CRM, enrich it with public signals, and score it for routing.',
    prompt:
      'Enrich the inbound lead "Acme Robotics" from the CRM and tell me whether sales should prioritize it.',
    tags: ['sales', 'crm_lookup', 'web_search'],
    plan: [
      'Look up the Acme Robotics account in the CRM.',
      'Search the web for recent company signals (funding, hiring).',
      'Score the lead using our fit + intent rubric.',
      'Update the CRM lead score and routing owner.',
    ],
    steps: [
      {
        id: 'sl-1',
        title: 'Fetch lead from CRM',
        tool: 'crm_lookup',
        input: 'account:"Acme Robotics" fields=stage,size,owner,last_touch',
        reasoning:
          'I will start by pulling the existing CRM record so I know the current stage, company size, and who (if anyone) already owns the relationship.',
        result:
          'Acme Robotics — Stage: Inbound/New, Employees: 240, Region: NA, Owner: unassigned, Last touch: form fill 2 days ago (requested demo).',
        latencyMs: 600,
        tokens: 210,
      },
      {
        id: 'sl-2',
        title: 'Gather public buying signals',
        tool: 'web_search',
        input: 'Acme Robotics funding hiring news 2026',
        reasoning:
          'A demo request is strong intent. I will check for corroborating signals — recent funding or aggressive hiring would raise both the fit and urgency of this lead.',
        result:
          'Signals: raised a $40M Series B (6 weeks ago); 12 open ops/automation roles; CTO quoted about "scaling internal tooling." Strong growth + tooling intent.',
        latencyMs: 1200,
        tokens: 660,
      },
      {
        id: 'sl-3',
        title: 'Score fit + intent',
        tool: 'calculator',
        input: 'score = 0.6*fit(85) + 0.4*intent(92)',
        reasoning:
          'I will combine a fit score (company size, region, segment) with an intent score (demo request + funding + hiring) using our 60/40 weighting to produce a single routable number.',
        result: 'Lead score = 0.6×85 + 0.4×92 = 87.8 / 100 → "Hot" tier.',
        latencyMs: 300,
        tokens: 110,
      },
      {
        id: 'sl-4',
        title: 'Write score & assign owner in CRM',
        tool: 'crm_lookup',
        input: 'update account:"Acme Robotics" score=88 tier=Hot owner=AE:priority-queue',
        reasoning:
          'The lead is clearly hot. Writing the score back and assigning an account executive changes shared CRM state and triggers notifications, so I will request human approval first.',
        result:
          'CRM updated: score=88, tier=Hot, routed to priority AE queue. Slack alert sent to #sales-pod-west.',
        requiresApproval: true,
        sensitiveLabel: 'Writes to the CRM and assigns a sales owner',
        latencyMs: 500,
        tokens: 180,
      },
    ],
    finalOutput: [
      '# Lead Brief — Acme Robotics',
      '',
      '**Verdict: Prioritize (Hot, 88/100).**',
      '',
      '## Why',
      '- **Intent:** Requested a demo 2 days ago.',
      '- **Momentum:** $40M Series B six weeks ago; 12 open automation roles.',
      '- **Fit:** 240 employees, NA region — squarely in our ICP.',
      '',
      '## Recommended next step',
      'Route to the **priority AE queue** and reach out within 24h referencing their Series B and internal-tooling initiative.',
    ].join('\n'),
  },

  {
    id: 'budget-pricing',
    title: 'Budget & pricing calculation',
    description:
      'Read a rate card, compute a quote for a prospect, and prepare an approval-gated proposal.',
    prompt:
      'Calculate an annual quote for a 150-seat Enterprise deal with 2 add-ons and a 15% multi-year discount.',
    tags: ['finance', 'calculator', 'read_doc'],
    plan: [
      'Read the current Enterprise rate card.',
      'Compute seat + add-on subtotal.',
      'Apply the multi-year discount and taxes.',
      'Draft the quote and send for finance approval.',
    ],
    steps: [
      {
        id: 'bp-1',
        title: 'Read the rate card',
        tool: 'read_doc',
        input: 'docs/finance/rate-card-enterprise-2026.md',
        reasoning:
          'I need authoritative numbers. I will read the current Enterprise rate card to get the per-seat price and the price of each add-on module.',
        result:
          'Enterprise: $180/seat/yr. Add-ons: Advanced Analytics $9,000/yr, Priority Support $6,000/yr. Standard tax rate 8%.',
        latencyMs: 850,
        tokens: 300,
      },
      {
        id: 'bp-2',
        title: 'Compute seats + add-ons subtotal',
        tool: 'calculator',
        input: '150 * 180 + 9000 + 6000',
        reasoning:
          'First I will compute the pre-discount subtotal: 150 seats at the per-seat rate, plus the two selected add-on modules.',
        result: '150×180 = 27,000; + 9,000 + 6,000 = $42,000 subtotal (pre-discount).',
        latencyMs: 300,
        tokens: 90,
      },
      {
        id: 'bp-3',
        title: 'Apply discount and tax',
        tool: 'calculator',
        input: '42000 * (1 - 0.15) * (1 + 0.08)',
        reasoning:
          'Now I apply the 15% multi-year discount, then the 8% tax on the discounted amount, to arrive at the final annual total.',
        result:
          'Discounted: 42,000×0.85 = 35,700. With 8% tax: 35,700×1.08 = $38,556.00 / yr.',
        latencyMs: 300,
        tokens: 95,
      },
      {
        id: 'bp-4',
        title: 'Issue the quote',
        tool: 'read_doc',
        input: 'quote://enterprise/150-seat-multiyear (create & send)',
        reasoning:
          'The numbers are final. Issuing the quote sends a binding proposal to the prospect and to finance, so this step requires human approval before it goes out.',
        result:
          'Quote Q-20614 created ($38,556.00/yr, net-30, multi-year) and queued to send to the prospect + finance for sign-off.',
        requiresApproval: true,
        sensitiveLabel: 'Issues a binding quote to a prospect and finance',
        latencyMs: 600,
        tokens: 200,
      },
    ],
    finalOutput: [
      '# Quote — 150-seat Enterprise (Multi-year)',
      '',
      '| Line item | Amount |',
      '| --- | --- |',
      '| 150 seats × $180 | $27,000.00 |',
      '| Advanced Analytics | $9,000.00 |',
      '| Priority Support | $6,000.00 |',
      '| **Subtotal** | **$42,000.00** |',
      '| Multi-year discount (15%) | −$6,300.00 |',
      '| Tax (8%) | +$2,856.00 |',
      '| **Annual total** | **$38,556.00** |',
      '',
      '_Terms: net-30, multi-year commitment. Quote ID Q-20614._',
    ].join('\n'),
  },

  {
    id: 'support-triage',
    title: 'Support ticket triage',
    description:
      'Read an incoming ticket, check the account tier, and route with the right priority — escalating if needed.',
    prompt:
      'Triage ticket #4821 ("app crashes on export") and route it to the correct team with a priority.',
    tags: ['support', 'read_doc', 'crm_lookup'],
    plan: [
      'Read the ticket contents and reproduction notes.',
      'Look up the customer tier in the CRM.',
      'Score severity × tier to set a priority.',
      'Assign the ticket and, if P1, page on-call.',
    ],
    steps: [
      {
        id: 'st-1',
        title: 'Read the ticket',
        tool: 'read_doc',
        input: 'tickets://4821',
        reasoning:
          'I will read the full ticket to understand the symptom, how reproducible it is, and whether there is a workaround — these drive the severity rating.',
        result:
          'Ticket #4821: "App crashes every time I export to PDF." Repro: 5/5 attempts. No workaround. Affects a core workflow. Attached crash log points to the export worker.',
        latencyMs: 700,
        tokens: 280,
      },
      {
        id: 'st-2',
        title: 'Look up account tier',
        tool: 'crm_lookup',
        input: 'contact-email → account.tier, account.mrr',
        reasoning:
          'Priority depends on who is affected. I will check the CRM for the reporter’s account tier and monthly revenue to weight the business impact.',
        result:
          'Account: Northwind Co. — Tier: Enterprise, MRR: $14k, renewal in 38 days. Flagged as an at-risk renewal by the CSM.',
        latencyMs: 600,
        tokens: 190,
      },
      {
        id: 'st-3',
        title: 'Score priority',
        tool: 'calculator',
        input: 'priority = severity(High=3) × tier_weight(Enterprise=1.5)',
        reasoning:
          'A fully-reproducible crash with no workaround is High severity; multiplied by the Enterprise tier weight this crosses our P1 threshold.',
        result: 'severity 3 × tier 1.5 = 4.5 → P1 (threshold ≥ 4.0).',
        latencyMs: 250,
        tokens: 80,
      },
      {
        id: 'st-4',
        title: 'Escalate to on-call',
        tool: 'crm_lookup',
        input: 'page oncall team=export-platform ticket=4821 priority=P1',
        reasoning:
          'This is a P1 for an at-risk Enterprise renewal. Paging the on-call engineer interrupts a human after hours, so I will pause for approval before escalating.',
        result:
          'On-call engineer for export-platform paged (P1). Ticket #4821 assigned, CSM notified, status set to "Escalated".',
        requiresApproval: true,
        sensitiveLabel: 'Pages an on-call engineer (potential after-hours alert)',
        latencyMs: 400,
        tokens: 150,
      },
    ],
    finalOutput: [
      '# Triage — Ticket #4821',
      '',
      '**Priority: P1** · **Team: export-platform** · **Account: Northwind Co. (Enterprise)**',
      '',
      '## Summary',
      'Fully reproducible (5/5) crash on PDF export with no workaround, affecting a core workflow for an Enterprise account with a renewal in 38 days.',
      '',
      '## Action taken',
      '- Scored **P1** (High severity × Enterprise weight).',
      '- Routed to **export-platform** and paged on-call.',
      '- Notified the CSM given the at-risk renewal.',
      '',
      '_Next: confirm fix ETA and share a workaround if one emerges._',
    ].join('\n'),
  },
];

export function getScenario(id: string): Scenario | undefined {
  return scenarios.find((s) => s.id === id);
}

export const DEFAULT_SCENARIO_ID = scenarios[0].id;

/**
 * Pick the scenario whose domain best matches a free-text task. Purely a
 * keyword heuristic so the "type your own task" box routes to a sensible
 * scripted plan (this is a mock — we don't actually plan arbitrary tasks).
 */
export function matchScenario(task: string): Scenario {
  const t = task.toLowerCase();
  const rules: { id: string; words: string[] }[] = [
    { id: 'sales-lead-enrichment', words: ['lead', 'crm', 'sales', 'prospect', 'enrich', 'account'] },
    { id: 'budget-pricing', words: ['price', 'pricing', 'quote', 'budget', 'cost', 'discount', 'invoice', 'seat'] },
    { id: 'support-triage', words: ['ticket', 'support', 'triage', 'bug', 'crash', 'incident', 'escalate'] },
    { id: 'competitor-research', words: ['research', 'competitor', 'market', 'summary', 'summarize', 'analyze'] },
  ];
  let best = scenarios[0];
  let bestScore = 0;
  for (const rule of rules) {
    const score = rule.words.reduce((n, w) => (t.includes(w) ? n + 1 : n), 0);
    if (score > bestScore) {
      bestScore = score;
      best = getScenario(rule.id) ?? best;
    }
  }
  return best;
}
