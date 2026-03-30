import Link from 'next/link';
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Seeing GMAT | Strategy Engine',
  description: 'GMAT prep that teaches pattern recognition, strategy selection, and speed-aware decision making.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <div className="app-background" aria-hidden>
          <div className="app-noise" />
          <div className="app-orb app-orb-one" />
          <div className="app-orb app-orb-two" />
          <div className="app-grid" />
        </div>
        <div className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-4 py-5 md:px-8">
          <header className="glass-panel sticky top-4 z-40 mb-6 flex flex-wrap items-center justify-between gap-4 px-5 py-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#f3a45b]">GMAT Strategy Engine</p>
              <p className="text-lg font-semibold tracking-tight text-white">Seeing GMAT</p>
            </div>
            <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <Link href="/#product" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#f3a45b]/60 hover:text-white">
                Product
              </Link>
              <Link href="/#loop" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#f3a45b]/60 hover:text-white">
                Core Loop
              </Link>
              <Link href="/#roadmap" className="rounded-full border border-white/10 px-4 py-2 transition hover:border-[#f3a45b]/60 hover:text-white">
                Roadmap
              </Link>
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
