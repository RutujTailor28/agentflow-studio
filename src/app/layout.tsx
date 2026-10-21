import type { Metadata } from 'next';
import './globals.css';
import { SiteNav } from '@/components/SiteNav';

export const metadata: Metadata = {
  title: 'AgentFlow Studio',
  description:
    'A polished, frontend-only simulation of an AI agent: plan, streamed tool calls, a live step graph, human-in-the-loop approval, and a metrics dashboard. All data is mock.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans">
        <SiteNav />
        <main className="mx-auto w-full max-w-6xl px-4 pb-16 pt-6 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
          AgentFlow Studio — frontend-only demo with mock data · built by Rutuj
          Tailor
        </footer>
      </body>
    </html>
  );
}
