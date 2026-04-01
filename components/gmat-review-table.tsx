'use client';

import { useMemo, useState } from 'react';
import type { GmatAttemptWithQuestion, GmatReviewStats } from '@/lib/gmat-types';

function computeStats(attempts: GmatAttemptWithQuestion[]): GmatReviewStats {
  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((attempt) => attempt.isCorrect).length;
  const avgTimeSeconds =
    totalAttempts > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.timeTakenSeconds, 0) / totalAttempts)
      : 0;
  const avgTargetSeconds =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((sum, attempt) => sum + attempt.question.recommendedTimeSeconds, 0) / totalAttempts
        )
      : 0;
  const slowAttempts = attempts.filter(
    (attempt) => attempt.timeTakenSeconds > attempt.question.recommendedTimeSeconds
  ).length;

  const topicCounts = attempts.reduce<Record<string, number>>((acc, attempt) => {
    acc[attempt.question.topic] = (acc[attempt.question.topic] ?? 0) + 1;
    return acc;
  }, {});

  const topTopic =
    Object.entries(topicCounts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ?? null;

  return {
    totalAttempts,
    accuracyPercent: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
    avgTimeSeconds,
    avgTargetSeconds,
    slowAttempts,
    topTopic
  };
}

export function GmatReviewTable({
  attempts,
  activeFilter,
  initialStats
}: {
  attempts: GmatAttemptWithQuestion[];
  activeFilter: string;
  initialStats: GmatReviewStats;
}) {
  const [rows, setRows] = useState(attempts);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => computeStats(rows), [rows]);
  const summaryStats = rows.length === attempts.length ? initialStats : stats;

  const filters = [
    { label: 'All', value: 'all' },
    { label: 'Incorrect', value: 'incorrect' },
    { label: 'Slow', value: 'slow' },
    { label: 'Slow Correct', value: 'slow_correct' }
  ];

  async function handleDelete(attemptId: string) {
    if (deletingId) return;
    setDeletingId(attemptId);
    setError(null);

    try {
      const response = await fetch('/api/gmat/attempts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId })
      });

      if (!response.ok) {
        throw new Error('Could not delete attempt.');
      }

      setRows((current) => current.filter((attempt) => attempt.id !== attemptId));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete attempt.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Attempts</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summaryStats.totalAttempts}</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Accuracy</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summaryStats.accuracyPercent}%</p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Average Pace</p>
          <p className="mt-2 text-2xl font-semibold text-white">
            {summaryStats.avgTimeSeconds}s
            <span className="ml-2 text-sm font-medium text-slate-400">vs {summaryStats.avgTargetSeconds}s target</span>
          </p>
        </div>
        <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Slow Attempts</p>
          <p className="mt-2 text-2xl font-semibold text-white">{summaryStats.slowAttempts}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
            Top Topic: {summaryStats.topTopic ?? 'N/A'}
          </p>
        </div>
      </div>

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

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.03]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-white/[0.03] text-slate-300">
            <tr>
              <th className="px-4 py-3 font-medium">Question</th>
              <th className="px-4 py-3 font-medium">Outcome</th>
              <th className="px-4 py-3 font-medium">Time</th>
              <th className="px-4 py-3 font-medium">Insight</th>
              <th className="px-4 py-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((attempt) => (
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
                <td className="px-4 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => handleDelete(attempt.id)}
                    disabled={deletingId === attempt.id}
                    className="rounded-full border border-rose-400/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-rose-200 transition hover:border-rose-300/50 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === attempt.id ? 'Deleting...' : 'Delete'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
