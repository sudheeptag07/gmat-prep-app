'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { GmatAttemptWithQuestion, GmatConfidence, GmatQuestion, GmatStrategyInput } from '@/lib/gmat-types';
import { EncouragementLine } from '@/components/encouragement-line';

const confidenceOptions: Array<{ value: Exclude<GmatConfidence, null>; label: string }> = [
  { value: 'low', label: 'Low confidence' },
  { value: 'medium', label: 'Medium confidence' },
  { value: 'high', label: 'High confidence' }
];

const strategyOptions: Array<{ value: Exclude<GmatStrategyInput, null>; label: string }> = [
  { value: 'algebra', label: 'Algebra' },
  { value: 'backsolving', label: 'Backsolving' },
  { value: 'plugging_numbers', label: 'Plugging numbers' },
  { value: 'logical_elimination', label: 'Logical elimination' },
  { value: 'estimation', label: 'Estimation' },
  { value: 'assumption_lens', label: 'Assumption lens' },
  { value: 'guess', label: 'Guess' },
  { value: 'other', label: 'Other' }
];

export function GmatAttemptCard({
  question,
  warmupConfig
}: {
  question: GmatQuestion;
  warmupConfig?: {
    topic: GmatQuestion['topic'];
    subtopic?: string;
    groupSubtopics?: string[];
  };
}) {
  const [startedAt] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [confidence, setConfidence] = useState<GmatConfidence>(null);
  const [strategyUsed, setStrategyUsed] = useState<GmatStrategyInput>(null);
  const [attempt, setAttempt] = useState<GmatAttemptWithQuestion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [movingNext, setMovingNext] = useState(false);
  const [hasWarmupRun, setHasWarmupRun] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentSearch = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return window.location.search ?? '';
  }, []);

  useEffect(() => {
    if (attempt) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.max(1, Math.round((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [attempt, startedAt]);

  useEffect(() => {
    if (!attempt || hasWarmupRun || !warmupConfig) return;

    const targets =
      warmupConfig.subtopic && warmupConfig.subtopic.trim()
        ? [warmupConfig.subtopic.trim()]
        : (warmupConfig.groupSubtopics ?? []).slice(0, 3);
    const uniqueTargets = Array.from(new Set(targets.filter(Boolean)));

    if (uniqueTargets.length === 0) {
      setHasWarmupRun(true);
      return;
    }

    setHasWarmupRun(true);
    void Promise.allSettled(
      uniqueTargets.map((target, index) =>
        fetch('/api/gmat/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: warmupConfig.topic,
            subtopic: target,
            count: index === 0 ? 3 : 2
          })
        })
      )
    );
  }, [attempt, hasWarmupRun, warmupConfig]);

  const timingLabel = useMemo(() => {
    const delta = elapsed - question.recommendedTimeSeconds;
    if (delta > 0) return `${delta}s slower than target`;
    if (delta < 0) return `${Math.abs(delta)}s faster than target`;
    return 'On target pace';
  }, [elapsed, question.recommendedTimeSeconds]);

  async function submitAttempt() {
    if (!selectedAnswer || submitting) {
      if (!selectedAnswer) setError('Select an answer choice before submitting.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/gmat/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: question.id,
          selectedAnswer,
          timeTakenSeconds: elapsed || 1,
          confidence,
          strategyUsed
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save attempt');
      }

      const data = (await response.json()) as { attempt: GmatAttemptWithQuestion };
      setAttempt(data.attempt);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Failed to save attempt');
    } finally {
      setSubmitting(false);
    }
  }

  if (attempt) {
    const alt = attempt.question.alternativeMethods[0];
    const fallbackHref = `/learn/question?topic=${encodeURIComponent(attempt.question.topic)}&subtopic=${encodeURIComponent(
      attempt.question.subtopic
    )}`;
    const nextHref = currentSearch
      ? `/learn/question${currentSearch}${currentSearch.includes('?') ? '&' : '?'}fromAttempt=${attempt.id}`
      : `${fallbackHref}&fromAttempt=${attempt.id}`;
    const confidenceMismatch =
      attempt.confidence === 'high' && !attempt.isCorrect
        ? 'High confidence, incorrect result.'
        : attempt.confidence === 'low' && attempt.isCorrect
          ? 'Low confidence, but you were correct.'
          : null;

    return (
      <div className="space-y-6">
        <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.03))] p-6 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className={`text-2xl font-semibold ${attempt.isCorrect ? 'text-emerald-300' : 'text-rose-300'}`}>
              {attempt.isCorrect ? 'Correct' : 'Incorrect'}
            </p>
            <p className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300">
              {attempt.timeTakenSeconds}s taken, target {attempt.question.recommendedTimeSeconds}s
            </p>
          </div>
          {attempt.encouragement ? (
            <EncouragementLine message={attempt.encouragement.message} triggerType={attempt.encouragement.triggerType} />
          ) : null}
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Result</p>
              <p className="mt-2 text-sm font-semibold text-white">{attempt.isCorrect ? 'Answer matched' : 'Answer missed'}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Pace</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {attempt.timeTakenSeconds > attempt.question.recommendedTimeSeconds ? 'Slower than target' : 'On or ahead of target'}
              </p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Confidence</p>
              <p className="mt-2 text-sm font-semibold text-white">{attempt.confidence ?? 'Not captured'}</p>
            </div>
          </div>
          {confidenceMismatch ? <p className="mt-4 text-sm text-[#f7b27a]">{confidenceMismatch}</p> : null}
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 md:p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#84a8ff]">Baseline Method</p>
            <div className="mt-5 space-y-3">
              {attempt.question.standardSolution.map((step, index) => (
                <div key={step} className="flex gap-3 rounded-[18px] border border-white/10 bg-white/[0.025] p-4">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 text-xs font-semibold text-slate-200">
                    {index + 1}
                  </div>
                  <p className="text-sm leading-6 text-slate-200">{step}</p>
                </div>
              ))}
            </div>
          </div>

          {alt ? (
            <div className="rounded-[28px] border border-[#f07e25]/20 bg-[#f07e25]/10 p-6 md:p-7">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#f7b27a]">Better Alternative</p>
              <h3 className="mt-3 text-xl font-semibold text-white">{alt.name}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-[18px] border border-emerald-400/20 bg-black/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Speed</p>
                  <p className="mt-1 text-sm font-semibold text-emerald-300">{alt.speed}</p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Reliability</p>
                  <p className="mt-1 text-sm font-semibold text-white">{alt.reliability}</p>
                </div>
                <div className="rounded-[18px] border border-white/10 bg-black/10 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Load</p>
                  <p className="mt-1 text-sm font-semibold text-white">{alt.cognitiveLoad}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {alt.steps.map((step) => (
                  <p key={step} className="rounded-[18px] border border-white/10 bg-black/10 p-4 text-sm leading-6 text-slate-100">
                    {step}
                  </p>
                ))}
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-100">{alt.whyItWorks}</p>
              <p className="mt-3 text-sm leading-6 text-slate-200">When to use: {alt.whenToUse}</p>
            </div>
          ) : null}
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-semibold text-white">What top scorers notice</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{attempt.question.topScorerNotice}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-semibold text-white">Common trap</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{attempt.question.commonTrap}</p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm font-semibold text-white">Time-saving insight</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">{attempt.question.timeSavingInsight}</p>
          </div>
        </section>

        <div className="flex flex-wrap gap-3">
          <Link
            href={nextHref}
            onClick={() => setMovingNext(true)}
            className="inline-flex items-center rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#f07e25]/22"
          >
            {movingNext ? 'Loading next question...' : 'Next question'}
          </Link>
          <Link
            href="/review"
            className="inline-flex items-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
          >
            Review attempts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#84a8ff]">
              {question.topic} / {question.subtopic} / {question.difficulty}
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">{question.prompt}</h2>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-200">
            {elapsed}s elapsed
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-400">Recommended pace: {question.recommendedTimeSeconds}s • {timingLabel}</p>
        <p className="mt-8 text-lg leading-8 text-slate-100">{question.stem}</p>
      </div>

      <div className="space-y-3">
        {question.choices.map((choice) => (
          <label
            key={choice}
            className={`flex cursor-pointer items-start gap-4 rounded-[24px] border px-5 py-4 transition ${
              selectedAnswer === choice
                ? 'border-[#f07e25]/60 bg-[#f07e25]/10 shadow-[0_12px_30px_rgba(240,126,37,0.12)]'
                : 'border-white/10 bg-white/[0.035] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]'
            }`}
          >
            <input
              type="radio"
              name="answer"
              value={choice}
              checked={selectedAnswer === choice}
              onChange={() => setSelectedAnswer(choice)}
              className="mt-1 h-4 w-4"
            />
            <span className="text-sm leading-6 text-slate-100">{choice}</span>
          </label>
        ))}
      </div>

      <p className="text-sm text-slate-300">
        {selectedAnswer ? `Selected answer: ${selectedAnswer}` : 'Select one answer to continue.'}
      </p>

      <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm font-semibold text-white">Confidence</p>
          <div className="mt-4 space-y-2">
            {confidenceOptions.map((option) => (
              <label key={option.value} className="flex items-center gap-3 text-sm text-slate-200">
                <input
                  type="radio"
                  name="confidence"
                  checked={confidence === option.value}
                  onChange={() => setConfidence(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
          <p className="text-sm font-semibold text-white">What approach did you use?</p>
          <select
            value={strategyUsed ?? ''}
            onChange={(event) => setStrategyUsed((event.target.value || null) as GmatStrategyInput)}
            className="spectra-input mt-4 w-full px-4 py-3 text-sm"
          >
            <option value="">Select one</option>
            {strategyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="button"
        onClick={submitAttempt}
        aria-disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-5 py-4 text-sm font-semibold text-white transition hover:bg-[#f07e25]/22 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
      >
        {submitting ? 'Saving attempt...' : 'Submit answer'}
      </button>
    </div>
  );
}
