import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCandidateById, updateCandidateEvaluation, updateCandidateScoreStatus, updateCandidateTranscriptQuality, upsertInterview } from '@/lib/db';
import { scoreInterview } from '@/lib/gemini';
import type { TranscriptQualityStatus } from '@/lib/types';

const schema = z.object({
  candidate_id: z.string().uuid()
});

function assessTranscriptQuality(transcript: string): { score: number; status: TranscriptQualityStatus } {
  const lines = transcript
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  const chars = transcript.replace(/\s+/g, ' ').trim().length;
  const userTurns = lines.filter((line) => /^user:/i.test(line)).length;
  const agentTurns = lines.filter((line) => /^agent:/i.test(line)).length;
  const score = Math.max(0, Math.min(100, Math.round(chars / 45) + userTurns * 6 + agentTurns * 4));

  if (chars < 80 || userTurns < 1) return { score, status: 'missing' };
  if (chars < 220 || userTurns < 2 || agentTurns < 2) return { score, status: 'partial' };
  if (chars < 450 || userTurns < 4) return { score, status: 'usable' };
  return { score, status: 'final' };
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
    const quality = assessTranscriptQuality(transcript);

    await updateCandidateTranscriptQuality(candidate.id, quality.status);

    if (quality.status === 'missing' || quality.status === 'partial') {
      await updateCandidateScoreStatus(candidate.id, 'missing', quality.status);
      if (interview) {
        await upsertInterview({
          id: interview.id,
          candidateId: candidate.id,
          transcript,
          duration: interview.duration,
          transcriptQualityScore: quality.score,
          transcriptQualityStatus: quality.status,
          agentSummary: 'Transcript was too weak to support a grounded evaluation.',
          feedbackJson: null,
          audioUrl: interview.audio_url
        });
      }

      return NextResponse.json({
        score_status: 'missing',
        transcript_quality_status: quality.status,
        transcript_quality_score: quality.score
      });
    }

    const feedback = await scoreInterview({
      roleApplied: candidate.role_applied,
      cvSummary: candidate.cv_summary || '',
      assignmentSummary: candidate.assignment_summary || '',
      transcript
    });

    await updateCandidateTranscriptQuality(candidate.id, quality.status);
    await updateCandidateEvaluation(candidate.id, feedback);

    if (interview) {
      await upsertInterview({
        id: interview.id,
        candidateId: candidate.id,
        transcript,
        duration: interview.duration,
        transcriptQualityScore: quality.score,
        transcriptQualityStatus: quality.status,
        agentSummary: feedback.overall_feedback || 'Evaluation completed.',
        feedbackJson: feedback,
        audioUrl: interview.audio_url
      });
    }

    return NextResponse.json({
      ...feedback,
      transcript_quality_status: quality.status,
      transcript_quality_score: quality.score
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
