import { Suspense } from 'react';
import { RunView } from '@/components/RunView';

export default function RunPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-slate-400">Loading run…</div>
      }
    >
      <RunView />
    </Suspense>
  );
}
