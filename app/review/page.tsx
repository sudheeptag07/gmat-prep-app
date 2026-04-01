import { cookies } from 'next/headers';
import Link from 'next/link';
import { GmatReviewTable } from '@/components/gmat-review-table';
import { getGmatReviewStats, listGmatAttemptsForUser } from '@/lib/db';
import { GMAT_USER_COOKIE } from '@/lib/gmat-session';

export default async function ReviewPage({
  searchParams
}: {
  searchParams?: { filter?: 'incorrect' | 'slow' | 'slow_correct' };
}) {
  const userId = cookies().get(GMAT_USER_COOKIE)?.value;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl pb-16">
        <section className="glass-panel p-8">
          <h1 className="text-3xl font-semibold text-white">No learner session found.</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">Start from onboarding so the app can tie attempts to your profile.</p>
          <Link href="/learn" className="mt-6 inline-flex rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-5 py-3 text-sm font-semibold text-white">
            Go to learn
          </Link>
        </section>
      </main>
    );
  }

  const filter = searchParams?.filter;
  const [attempts, stats] = await Promise.all([
    listGmatAttemptsForUser(userId, filter),
    getGmatReviewStats(userId)
  ]);

  return (
    <main className="space-y-8 pb-16">
      <section className="glass-panel p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">Review Flow</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Inspect inefficient thinking patterns.</h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
          This MVP review flow focuses on the three highest-signal buckets: incorrect attempts, slow attempts, and slow-correct attempts.
        </p>
      </section>

      <section className="glass-panel p-8">
        {attempts.length > 0 ? (
          <GmatReviewTable attempts={attempts} activeFilter={filter ?? 'all'} initialStats={stats} />
        ) : (
          <div className="space-y-4">
            <p className="text-lg font-semibold text-white">No attempts match this filter yet.</p>
            <p className="text-sm leading-7 text-slate-300">Answer a few questions first, then use this view to find slow-correct and trap-heavy behavior.</p>
            <Link href="/learn" className="inline-flex rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-5 py-3 text-sm font-semibold text-white">
              Return to practice
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
