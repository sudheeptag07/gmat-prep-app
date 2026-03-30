'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { GmatLearner, GmatSubtopic, GmatTopic } from '@/lib/gmat-types';

type TopicEntry = {
  topic: GmatTopic;
  subtopics: GmatSubtopic[];
};

function buildTopicSignal(entry: TopicEntry, learner: GmatLearner) {
  const strengths = new Set(learner.strengths);
  const isStrength = entry.subtopics.some((subtopic) => strengths.has(subtopic));
  const accuracy = isStrength ? 78 : entry.topic === 'Quant' ? 61 : 68;
  const pace = isStrength ? 'Fast solving' : entry.topic === 'Quant' ? 'Slower pace' : 'Medium pace';
  const status = isStrength ? 'Strong area' : accuracy < 65 ? 'Weak area' : 'Growth area';
  const focus =
    entry.topic === 'Quant'
      ? 'Pattern shortcuts and decision speed'
      : 'Argument structure and elimination discipline';

  return { accuracy, pace, status, focus };
}

export function LearnDashboard({
  learner,
  topics
}: {
  learner: GmatLearner;
  topics: TopicEntry[];
}) {
  const [selectedTopic, setSelectedTopic] = useState<GmatTopic>(topics[0]?.topic ?? 'Quant');

  const selected = useMemo(() => topics.find((topic) => topic.topic === selectedTopic) ?? topics[0], [selectedTopic, topics]);
  const selectedSignal = selected ? buildTopicSignal(selected, learner) : null;

  return (
    <main className="space-y-8 pb-16">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="glass-panel p-8 md:p-10 lg:sticky lg:top-28 lg:h-fit">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f3a45b]">Your Setup</p>
          <h1 className="spectra-heading mt-4 text-4xl leading-tight md:text-5xl">Choose a topic with intent.</h1>
          <p className="muted mt-4 text-sm leading-7">
            This screen should answer one question: what should you practice next, and why?
          </p>

          <div className="mt-8 grid gap-4">
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Target Score</p>
              <p className="mt-2 text-3xl font-semibold text-white">{learner.targetScore}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Weekly Hours</p>
              <p className="mt-2 text-3xl font-semibold text-white">{learner.weeklyHours}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Declared Strengths</p>
              <p className="mt-3 text-sm leading-7 text-slate-200">{learner.strengths.join(', ')}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-[#84a8ff]/20 bg-[#84a8ff]/10 p-6">
            <p className="text-sm font-semibold text-white">Progress Path</p>
            <div className="mt-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              <span className="rounded-full border border-[#84a8ff]/40 bg-[#84a8ff]/20 px-3 py-2 text-white">1. Choose Topic</span>
              <span className="text-slate-500">→</span>
              <span className="rounded-full border border-white/10 px-3 py-2">2. Solve</span>
              <span className="text-slate-500">→</span>
              <span className="rounded-full border border-white/10 px-3 py-2">3. Learn</span>
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="glass-panel p-8 md:p-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">Topic Selection</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white md:text-3xl">Pick the lane that deserves the next rep.</h2>
              </div>
              <p className="muted max-w-sm text-sm leading-6">
                Topic cards should feel like decisions, not links. Choose the area that matches your current weakness or training goal.
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {topics.map((entry) => {
                const signal = buildTopicSignal(entry, learner);
                const isSelected = selectedTopic === entry.topic;

                return (
                  <button
                    key={entry.topic}
                    type="button"
                    onClick={() => setSelectedTopic(entry.topic)}
                    className={`group rounded-[30px] border p-6 text-left transition duration-200 ${
                      isSelected
                        ? 'border-[#f07e25]/60 bg-[linear-gradient(180deg,rgba(240,126,37,0.12),rgba(255,255,255,0.035))] shadow-[0_18px_50px_rgba(240,126,37,0.12)]'
                        : 'border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.02))] hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-2xl font-semibold tracking-tight text-white">{entry.topic}</p>
                        <p className="mt-2 text-sm text-slate-300">{signal.status}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isSelected ? 'bg-[#f07e25]/20 text-[#ffc89c]' : 'border border-white/10 text-slate-400'}`}>
                        {signal.accuracy}% accuracy
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{signal.pace}</span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-200">{entry.subtopics.length} subtopics</span>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-slate-300">{signal.focus}</p>
                    <p className="mt-4 text-xs uppercase tracking-[0.18em] text-slate-500">{entry.subtopics.slice(0, 3).join(' • ')}</p>
                  </button>
                );
              })}
            </div>
          </section>

          {selected && selectedSignal ? (
            <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="glass-panel p-8 md:p-10">
                <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">Primary Action</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Start practice in {selected.topic}.</h2>
                <p className="mt-4 text-sm leading-7 text-slate-300">
                  One clean question screen, immediate explanation, and a method comparison that tells you what to do faster next time.
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Topic</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selected.topic}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Difficulty</p>
                    <p className="mt-2 text-lg font-semibold text-white">{selectedSignal.status === 'Weak area' ? 'Medium' : 'Mixed'}</p>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Session Time</p>
                    <p className="mt-2 text-lg font-semibold text-white">10 min</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/learn/question?topic=${encodeURIComponent(selected.topic)}`}
                    className="inline-flex items-center justify-center rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-6 py-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#f07e25]/22"
                  >
                    Start Practice
                  </Link>
                  <Link
                    href="/review"
                    className="inline-flex items-center justify-center rounded-full border border-white/10 px-6 py-4 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:text-white"
                  >
                    Review My Mistakes
                  </Link>
                </div>
              </div>

              <div className="space-y-6">
                <div className="glass-panel p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">Suggested Topics</p>
                  <div className="mt-6 space-y-3">
                    {topics.slice(0, 3).map((entry, index) => {
                      const signal = buildTopicSignal(entry, learner);
                      return (
                        <div key={entry.topic} className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommendation {index + 1}</p>
                          <div className="mt-2 flex items-center justify-between gap-4">
                            <p className="text-sm font-semibold text-white">{entry.topic}</p>
                            <p className={`text-xs font-semibold ${signal.status === 'Weak area' ? 'text-rose-300' : 'text-emerald-300'}`}>
                              {signal.status}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="glass-panel p-8">
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#84a8ff]">Learning Insights</p>
                  <div className="mt-6 space-y-3">
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold text-white">You are likely solving correctly but slowly.</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Focus on method selection and trigger recognition before doing more volume.</p>
                    </div>
                    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-sm font-semibold text-white">Pattern-based shortcuts should be trained directly.</p>
                      <p className="mt-2 text-sm leading-6 text-slate-300">Practice sessions should compare the baseline solve with one faster alternative every time.</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>
    </main>
  );
}
