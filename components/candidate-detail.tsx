'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { ScoreBadge } from '@/components/score-badge';
import type { CandidateWithInterview, InterviewFeedback } from '@/lib/types';

type Props = {
  id: string;
};

function extractConversationId(interviewId: string | null | undefined): string | null {
  if (!interviewId) return null;
  if (interviewId.startsWith('conv_') || interviewId.startsWith('call_')) return interviewId;
  const convMatch = interviewId.match(/(conv_[a-zA-Z0-9]+)/);
  if (convMatch?.[1]) return convMatch[1];
  const callMatch = interviewId.match(/(call_[a-zA-Z0-9]+)/);
  return callMatch?.[1] ?? null;
}

function elevenLabsAnalysisUrl(): string {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  if (!agentId) return 'https://elevenlabs.io/app/agents';
  return `https://elevenlabs.io/app/agents/agents/${encodeURIComponent(agentId)}?tab=analysis`;
}

function fallbackFeedback(record: CandidateWithInterview): InterviewFeedback {
  return {
    overall_score: record.ai_score,
    score_status: record.score_status,
    recommendation: record.recommendation || 'manual_review',
    confidence: 0,
    strengths: [],
    concerns: [],
    rubric: [],
    overall_feedback: record.interview?.agent_summary || 'AI feedback pending.'
  };
}

function parseFeedback(record: CandidateWithInterview): InterviewFeedback {
  const raw = record.interview?.feedback_json;
  if (!raw) return fallbackFeedback(record);
  try {
    return JSON.parse(raw) as InterviewFeedback;
  } catch {
    return fallbackFeedback(record);
  }
}

export function CandidateDetail({ id }: Props) {
  const [record, setRecord] = useState<CandidateWithInterview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const response = await fetch(`/api/candidates/${id}`, { cache: 'no-store' });
      if (response.ok) {
        const data = (await response.json()) as CandidateWithInterview;
        if (active) setRecord(data);
      }
      if (active) setLoading(false);
    }

    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [id]);

  const feedback = useMemo(() => (record ? parseFeedback(record) : null), [record]);

  if (loading) return <div className="glass-panel p-6 text-sm text-slate-300">Loading candidate...</div>;
  if (!record || !feedback) return <div className="glass-panel p-6 text-sm text-rose-300">Candidate not found.</div>;

  const conversationId = extractConversationId(record.interview?.id);
  const audioSource = record.interview ? record.interview.audio_url || `/api/interviews/${record.interview.id}/audio` : null;

  return (
    <div className="space-y-5">
      <section className="glass-panel flex flex-wrap items-start justify-between gap-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold">{record.name}</h1>
          <p className="muted mt-1 text-sm">{record.email}</p>
          <p className="muted mt-1 text-sm">{record.role_applied}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusBadge status={record.status} />
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
              Transcript: {record.transcript_quality_status}
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">
              Recommendation: {(record.recommendation || 'pending').replace(/_/g, ' ')}
            </span>
          </div>
        </div>
        <div className="min-w-[180px] text-right">
          <p className="text-xs uppercase tracking-wide text-slate-400">Overall Score</p>
          <div className="mt-2">
            <ScoreBadge score={record.ai_score} scoreStatus={record.score_status} size="lg" />
          </div>
          <p className="mt-3 text-xs text-slate-400">Confidence {Math.round(feedback.confidence * 100)}%</p>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Candidate Summary</h2>
          <p className="mt-3 text-sm text-slate-300">{record.cv_summary || 'CV summary not available yet.'}</p>
          <div className="mt-5 space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Assignment Summary</p>
              <p className="mt-2 text-sm text-slate-300">{record.assignment_summary || 'No assignment summary available.'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/candidates/${id}/cv`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#F14724]/60 hover:text-[#F14724]"
              >
                Open CV
              </a>
              {record.assignment_file_name ? (
                <a
                  href={`/api/candidates/${id}/assignment`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#F14724]/60 hover:text-[#F14724]"
                >
                  Open Assignment
                </a>
              ) : null}
              {record.assignment_links.map((link) => (
                <a
                  key={link}
                  href={link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#F14724]/60 hover:text-[#F14724]"
                >
                  Assignment Link
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Evaluation Summary</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{feedback.overall_feedback || 'AI feedback pending.'}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Strengths</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {feedback.strengths.length > 0 ? feedback.strengths.map((item) => <li key={item}>• {item}</li>) : <li>• None captured yet.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Concerns</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                {feedback.concerns.length > 0 ? feedback.concerns.map((item) => <li key={item}>• {item}</li>) : <li>• None captured yet.</li>}
              </ul>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Transcript</h2>
          {audioSource ? <audio className="mt-3 w-full" controls src={audioSource} /> : null}
          <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/20 p-4 text-xs text-slate-200">
            {record.interview?.transcript || 'Transcript not available yet.'}
          </pre>
        </section>

        <section className="glass-panel p-6">
          <h2 className="text-lg font-semibold">Rubric Breakdown</h2>
          <div className="mt-4 space-y-3">
            {feedback.rubric.length > 0 ? (
              feedback.rubric.map((row) => (
                <div key={`${row.criteria}-${row.evidence.join('-')}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-100">{row.criteria}</p>
                    <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300">{row.score}/100</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{row.note}</p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-400">
                    {row.evidence.map((item) => <li key={item}>• {item}</li>)}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-300">Structured rubric not available yet.</p>
            )}
          </div>
        </section>
      </div>

      <section className="glass-panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Next-Round Questions</h2>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(record.next_round_questions.map((row, index) => `${index + 1}. ${row.question}`).join('\n'))}
            className="inline-flex rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#F14724]/60 hover:text-[#F14724]"
          >
            Copy Questions
          </button>
        </div>
        {record.next_round_questions.length > 0 ? (
          <ol className="mt-4 space-y-3">
            {record.next_round_questions.map((row, index) => (
              <li key={`${index}-${row.question}`} className="rounded-2xl border border-white/10 bg-black/15 p-4">
                <p className="text-sm font-semibold text-slate-100">{index + 1}. {row.question}</p>
                <p className="mt-2 text-xs text-slate-400">{row.why_skylark}</p>
                <p className="mt-1 text-xs text-slate-400">{row.expected_outcome}</p>
                <p className="mt-2 text-xs text-[#F7B267]">Gap: {row.evidence_gap}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-slate-300">No grounded next-round questions have been generated yet.</p>
        )}
      </section>

      <section className="glass-panel p-6">
        <h2 className="text-lg font-semibold">ElevenLabs Trace</h2>
        <div className="mt-3 space-y-3">
          <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-slate-200">
            Candidate ID: {record.id}
          </p>
          <p className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 font-mono text-xs text-slate-200">
            Conversation ID: {conversationId || 'Not available'}
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={elevenLabsAnalysisUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-white/20 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-[#F14724]/60 hover:text-[#F14724]"
            >
              Open ElevenLabs Analysis
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
