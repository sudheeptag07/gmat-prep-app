import { cookies } from 'next/headers';
import Link from 'next/link';
import { GmatAttemptCard } from '@/components/gmat-attempt-card';
import { ensureGmatQuestionPoolForUser, getNextGmatQuestionForUser, getNextGmatQuestionForUserInSubtopics } from '@/lib/db';
import { GMAT_USER_COOKIE } from '@/lib/gmat-session';
import type { GmatTopic } from '@/lib/gmat-types';
import { getGroupItems } from '@/lib/gmat-taxonomy';

export default async function LearnQuestionPage({
  searchParams
}: {
  searchParams?: { topic?: string; group?: string; subtopic?: string; count?: string };
}) {
  const topic = searchParams?.topic;
  const group = searchParams?.group;
  const subtopic = searchParams?.subtopic;
  const requestedCount = Math.max(1, Math.min(50, Number(searchParams?.count ?? 10) || 10));
  const userId = cookies().get(GMAT_USER_COOKIE)?.value ?? 'preview-user';
  const selectedTopic = topic === 'Quant' || topic === 'Verbal' || topic === 'Data Insights' ? (topic as GmatTopic) : null;
  const groupSubtopics = selectedTopic && group ? getGroupItems(selectedTopic, group) : [];
  let question =
    selectedTopic && !subtopic && groupSubtopics.length > 0
      ? await getNextGmatQuestionForUserInSubtopics({
          userId,
          topic: selectedTopic,
          subtopics: groupSubtopics,
          allowGeneration: false
        })
      : await getNextGmatQuestionForUser(userId, topic, subtopic, { allowGeneration: false });

  if (!question && selectedTopic) {
    try {
      if (subtopic) {
        await ensureGmatQuestionPoolForUser({
          userId,
          topic: selectedTopic,
          subtopic,
          desiredCount: Math.min(3, requestedCount)
        });
      } else if (groupSubtopics.length > 0) {
        await ensureGmatQuestionPoolForUser({
          userId,
          topic: selectedTopic,
          subtopic: groupSubtopics[0],
          desiredCount: 3
        });
      } else {
        await ensureGmatQuestionPoolForUser({
          userId,
          topic: selectedTopic,
          desiredCount: 3
        });
      }
    } catch {
      // Keep the page responsive even when generation is unavailable.
    }

    question =
      selectedTopic && !subtopic && groupSubtopics.length > 0
        ? await getNextGmatQuestionForUserInSubtopics({
            userId,
            topic: selectedTopic,
            subtopics: groupSubtopics,
            allowGeneration: false
          })
        : await getNextGmatQuestionForUser(userId, topic, subtopic, { allowGeneration: false });
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 pb-16">
      <section className="glass-panel p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <span className="rounded-full border border-[#84a8ff]/40 bg-[#84a8ff]/20 px-3 py-2 text-white">1. Choose Topic</span>
              <span>→</span>
              <span className="rounded-full border border-[#f07e25]/40 bg-[#f07e25]/18 px-3 py-2 text-[#ffc89c]">2. Solve</span>
              <span>→</span>
              <span className="rounded-full border border-white/10 px-3 py-2">3. Learn</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/learn" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white">
              Change topic
            </Link>
            <Link href="/review" className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:text-white">
              Review
            </Link>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">
            {topic ? `${topic} Practice` : 'Practice'}
          </p>
          {subtopic ? <p className="mt-2 text-sm text-slate-300">{subtopic}</p> : null}
          {!subtopic && group ? <p className="mt-2 text-sm text-slate-300">Group: {group.replaceAll('_', ' ')}</p> : null}
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">One question. Full focus.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
              Solve first. Then review the baseline method, the faster alternative, and the exact trigger you missed or recognized.
            </p>
          </div>
        </div>
      </section>

      {question ? (
        <section className="glass-panel p-6 md:p-8">
          <GmatAttemptCard
            question={question}
            warmupConfig={
              selectedTopic
                ? {
                    topic: selectedTopic,
                    subtopic: subtopic ?? undefined,
                    groupSubtopics: !subtopic && groupSubtopics.length > 0 ? groupSubtopics : []
                  }
                : undefined
            }
          />
        </section>
      ) : (
        <section className="glass-panel p-8 md:p-10">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">Topic Complete</p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">No untouched questions left in this lane.</h2>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Choose a new topic or use review to inspect your incorrect and slow-correct attempts.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/learn" className="rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-5 py-3 text-sm font-semibold text-white">
              Back to topics
            </Link>
            <Link href="/review" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200">
              Open review
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
