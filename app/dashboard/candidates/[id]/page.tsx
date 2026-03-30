import Link from 'next/link';
import { CandidateDetail } from '@/components/candidate-detail';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="space-y-6 pb-16">
      <div className="glass-panel flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f3a45b]">Candidate Review</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Interview Detail</h1>
        </div>
        <Link href="/dashboard" className="rounded-full border border-white/20 px-4 py-2 text-sm text-slate-200 transition hover:border-[#f07e25]/60 hover:text-white">
          Back to Dashboard
        </Link>
      </div>
      <CandidateDetail id={params.id} />
    </main>
  );
}
