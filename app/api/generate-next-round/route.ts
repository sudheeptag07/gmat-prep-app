import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCandidateById, updateCandidateNextRoundQuestions } from '@/lib/db';
import { generateNextRoundQuestions } from '@/lib/gemini';
import type { InterviewFeedback } from '@/lib/types';

const schema = z.object({
  candidate_id: z.string().uuid()
});

function buildEvaluationSummary(feedback: InterviewFeedback | null) {
  if (!feedback) return '';
  return [
    feedback.overall_feedback || '',
    `Recommendation: ${feedback.recommendation}`,
    ...feedback.strengths.map((item) => `Strength: ${item}`),
    ...feedback.concerns.map((item) => `Concern: ${item}`),
    ...feedback.rubric.map((item) => `${item.criteria}: ${item.score}/100 | ${item.note} | ${item.evidence.join('; ')}`)
  ]
    .filter(Boolean)
    .join('\n');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const candidate = await getCandidateById(parsed.data.candidate_id);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    const interview = candidate.interview;
    const transcript = interview?.transcript?.trim() || '';
    if (!transcript || candidate.score_status !== 'computed' || !interview?.feedback_json) {
      return NextResponse.json({ next_round_questions: [] });
    }

    let feedback: InterviewFeedback | null = null;
    try {
      feedback = JSON.parse(interview.feedback_json) as InterviewFeedback;
    } catch {
      feedback = null;
    }

    const questions = await generateNextRoundQuestions({
      roleApplied: candidate.role_applied,
      cvText: candidate.cv_text || '',
      cvSummary: candidate.cv_summary || '',
      assignmentSummary: candidate.assignment_summary || '',
      transcript,
      evaluationSummary: buildEvaluationSummary(feedback)
    });

    await updateCandidateNextRoundQuestions(candidate.id, questions);

    return NextResponse.json({ next_round_questions: questions });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
