import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function ThankYouPage() {
  return (
    <main className="mx-auto mt-16 max-w-4xl pb-16">
      <section className="glass-panel mx-auto max-w-2xl p-8 text-center md:p-10">
        <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
        <p className="mt-5 text-sm font-semibold uppercase tracking-[0.28em] text-[#f3a45b]">Interview Complete</p>
        <h1 className="spectra-heading mt-4 text-4xl md:text-5xl">Your response has been captured.</h1>
        <p className="muted mx-auto mt-5 max-w-xl text-base leading-7">
          Thank you for completing the Skylark GIS interview. The transcript, audio, and structured evaluation will now be processed for the hiring team.
        </p>
        <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left">
          <p className="text-sm font-semibold text-white">What happens next</p>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li>Transcript and audio are linked to your candidate profile.</li>
            <li>The evaluation engine scores grounded evidence only.</li>
            <li>The Skylark team reviews recommendation and next-round questions.</li>
          </ul>
        </div>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f07e25]/22"
        >
          Return Home
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </main>
  );
}
