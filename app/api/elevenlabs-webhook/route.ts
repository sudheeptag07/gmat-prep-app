import { NextResponse } from 'next/server';
import {
  createWebhookEvent,
  getCandidateByEmail,
  getCandidateById,
  getInterviewById,
  updateCandidateEvaluation,
  updateCandidateNextRoundQuestions,
  updateCandidateScoreStatus,
  updateCandidateTranscriptQuality,
  updateWebhookEventStatus,
  upsertInterview
} from '@/lib/db';
import { generateNextRoundQuestions, scoreInterview } from '@/lib/gemini';
import type { InterviewFeedback, TranscriptQualityStatus } from '@/lib/types';

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const value of values) {
    const found = asString(value);
    if (found) return found;
  }
  return null;
}

function transcriptToText(transcript: Array<{ role: string; text: string }> = []) {
  return transcript.map((row) => `${row.role}: ${row.text}`).join('\n');
}

function pickDynamicVariables(body: Record<string, unknown>) {
  const data = asRecord(body.data);
  const conversation = asRecord(body.conversation);
  const metadata = asRecord(body.metadata);
  const convoInit = asRecord(body.conversation_initiation_client_data);
  const dataConvoInit = asRecord(data.conversation_initiation_client_data);

  return [
    asRecord(body.dynamic_variables),
    asRecord(data.dynamic_variables),
    asRecord(conversation.dynamic_variables),
    asRecord(metadata.dynamic_variables),
    asRecord(convoInit.dynamic_variables),
    asRecord(dataConvoInit.dynamic_variables)
  ];
}

function pickCandidateId(body: Record<string, unknown>) {
  const dynamicSets = pickDynamicVariables(body);
  return pickFirstString(
    ...dynamicSets.flatMap((row) => [row.candidate_id, row.candidateId]),
    asRecord(body.data).user_id,
    body.candidate_id,
    body.candidateId
  );
}

function pickCandidateEmail(body: Record<string, unknown>) {
  const dynamicSets = pickDynamicVariables(body);
  return pickFirstString(
    ...dynamicSets.flatMap((row) => [row.candidate_email, row.email]),
    body.email,
    asRecord(body.data).email
  );
}

function pickCallId(body: Record<string, unknown>, candidateId: string | null) {
  const data = asRecord(body.data);
  return (
    pickFirstString(
      body.call_id,
      body.conversation_id,
      body.id,
      body.event_id,
      body.session_id,
      data.call_id,
      data.conversation_id,
      data.id
    ) || `fallback-${candidateId ?? 'unknown'}-${Date.now()}`
  );
}

function pickEventType(body: Record<string, unknown>) {
  return pickFirstString(body.type, body.event_type, asRecord(body.data).type) || 'unknown';
}

function extractTranscriptEntries(raw: unknown): Array<{ role: string; text: string }> {
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    return trimmed ? [{ role: 'conversation', text: trimmed }] : [];
  }

  if (!Array.isArray(raw)) {
    const row = asRecord(raw);
    const nested = row.turns ?? row.messages ?? row.transcript;
    return nested ? extractTranscriptEntries(nested) : [];
  }

  const entries: Array<{ role: string; text: string }> = [];
  for (const item of raw) {
    const row = asRecord(item);
    const role = pickFirstString(row.role, row.speaker, row.source, row.type) || 'speaker';
    const text = pickFirstString(
      row.text,
      row.message,
      row.content,
      asRecord(row.user_transcription_event).user_transcript,
      asRecord(row.agent_response_event).agent_response
    );
    if (text) entries.push({ role, text });
  }
  return entries;
}

function pickTranscript(body: Record<string, unknown>): string {
  const data = asRecord(body.data);
  const candidates = [
    body.transcript,
    data.transcript,
    asRecord(body.conversation).transcript,
    asRecord(data.conversation).transcript,
    asRecord(body.analysis).transcript,
    asRecord(data.analysis).transcript
  ];

  for (const candidate of candidates) {
    const entries = extractTranscriptEntries(candidate);
    if (entries.length > 0) return transcriptToText(entries);
  }

  return (
    pickFirstString(
      body.transcript_text,
      data.transcript_text,
      asRecord(body.analysis).transcript_text,
      asRecord(data.analysis).transcript_text
    ) || ''
  );
}

function pickAudioUrl(body: Record<string, unknown>) {
  const data = asRecord(body.data);
  const conversation = asRecord(body.conversation);
  return pickFirstString(
    body.audio_url,
    data.audio_url,
    body.recording_url,
    data.recording_url,
    conversation.audio_url,
    conversation.recording_url
  );
}

function pickDuration(body: Record<string, unknown>): number | null {
  const data = asRecord(body.data);
  const raw = body.duration ?? body.duration_seconds ?? data.duration ?? data.duration_seconds;
  const duration = Number(raw);
  return Number.isFinite(duration) && duration > 0 ? Math.round(duration) : null;
}

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

function buildEvaluationSummary(feedback: InterviewFeedback) {
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
  const body = asRecord(await request.json());
  const eventType = pickEventType(body);
  const candidateIdHint = pickCandidateId(body);
  const candidateEmail = pickCandidateEmail(body);
  const conversationId = pickCallId(body, candidateIdHint);
  const eventId =
    pickFirstString(body.event_id, body.id, `${conversationId}:${eventType}:${candidateIdHint ?? candidateEmail ?? 'unknown'}`) ||
    `${conversationId}:${Date.now()}`;

  await createWebhookEvent({
    id: eventId,
    candidateId: candidateIdHint,
    conversationId,
    payloadJson: JSON.stringify(body),
    eventType,
    processingStatus: 'received'
  });

  try {
    const candidate =
      (candidateIdHint ? await getCandidateById(candidateIdHint) : null) ||
      (candidateEmail ? await getCandidateByEmail(candidateEmail) : null);

    if (!candidate) {
      await updateWebhookEventStatus(eventId, 'candidate_not_found');
      return NextResponse.json({ error: 'Candidate not found.' }, { status: 404 });
    }

    const existingInterview = await getInterviewById(conversationId);
    const incomingTranscript = pickTranscript(body).trim();
    const currentTranscript = existingInterview?.transcript?.trim() || '';
    const transcript = incomingTranscript.length >= currentTranscript.length ? incomingTranscript : currentTranscript;
    const transcriptQuality = assessTranscriptQuality(transcript);
    const audioUrl = pickAudioUrl(body) || existingInterview?.audio_url || null;
    const duration = pickDuration(body) ?? existingInterview?.duration ?? null;

    let feedback: InterviewFeedback | null = null;
    let summary = 'Interview captured. Evaluation pending.';

    if (transcriptQuality.status === 'usable' || transcriptQuality.status === 'final') {
      feedback = await scoreInterview({
        roleApplied: candidate.role_applied,
        cvSummary: candidate.cv_summary || '',
        assignmentSummary: candidate.assignment_summary || '',
        transcript
      });
      summary = feedback.overall_feedback || 'Evaluation completed.';
      await updateCandidateEvaluation(candidate.id, feedback);
    } else {
      summary =
        transcriptQuality.status === 'partial'
          ? 'Partial transcript captured. Evaluation skipped until a stronger transcript arrives.'
          : 'Transcript missing or too weak to evaluate.';
      await updateCandidateScoreStatus(candidate.id, 'missing', transcriptQuality.status);
    }

    await updateCandidateTranscriptQuality(candidate.id, transcriptQuality.status);
    await upsertInterview({
      id: conversationId,
      candidateId: candidate.id,
      transcript,
      duration,
      transcriptQualityScore: transcriptQuality.score,
      transcriptQualityStatus: transcriptQuality.status,
      agentSummary: summary,
      feedbackJson: feedback,
      audioUrl
    });

    if (feedback) {
      const shouldGenerateQuestions = candidate.next_round_questions.length < 5;
      if (shouldGenerateQuestions) {
        const questions = await generateNextRoundQuestions({
          roleApplied: candidate.role_applied,
          cvText: candidate.cv_text || '',
          cvSummary: candidate.cv_summary || '',
          assignmentSummary: candidate.assignment_summary || '',
          transcript,
          evaluationSummary: buildEvaluationSummary(feedback)
        });
        if (questions.length > 0) {
          await updateCandidateNextRoundQuestions(candidate.id, questions);
        }
      }
    }

    await updateWebhookEventStatus(eventId, 'processed');
    return NextResponse.json({
      ok: true,
      candidate_id: candidate.id,
      conversation_id: conversationId,
      transcript_quality_status: transcriptQuality.status,
      score_status: feedback ? 'computed' : 'missing'
    });
  } catch (error) {
    await updateWebhookEventStatus(eventId, 'error');
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
