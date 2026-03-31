import type { GmatAttemptWithQuestion } from '@/lib/gmat-types';

export function GmatReviewTable({
  attempts,
  activeFilter
}: {
  attempts: GmatAttemptWithQuestion[];
  activeFilter: string;
}) {
  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Incorrect', value: 'incorrect' },
    { label: 'Slow', value: 'slow' },
    { label: 'Slow Correct', value: 'slow_correct' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <a
            key={filter.value}
            href={filter.value === 'all' ? '/review' : `/review?filter=${filter.value}`}
            className={`rounded-full border px-4 py-2 text-sm transition ${
              activeFilter === filter.value
                ? 'border-[#f07e25]/60 bg-[#f07e25]/14 text-white'
                : 'border-white/10 text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {filter.label}
          </a>
        ))}
      </div>

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Insight</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((attempt) => (
              <tr key={attempt.id} className="border-b border-white/10 last:border-b-0">
                <td className="px-4 py-4">
                  <p className="font-medium text-white">{attempt.question.prompt}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                    {attempt.question.topic} / {attempt.question.subtopic}
                  </p>
                </td>
                <td className={`px-4 py-4 font-medium ${attempt.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {attempt.isCorrect ? 'Correct' : 'Incorrect'}
                </td>
                <td className="px-4 py-4 text-slate-200">
                  {attempt.timeTakenSeconds}s / target {attempt.question.recommendedTimeSeconds}s
                </td>
                <td className="px-4 py-4 text-slate-300">{attempt.question.timeSavingInsight}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
