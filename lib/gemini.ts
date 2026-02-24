import type { FeedbackCriterion, InterviewFeedback, NextRoundQuestion } from '@/lib/types';
import { GoogleGenerativeAI } from '@google/generative-ai';

type CVAnalysis = {
  summary: string;
  keySkills: string[];
};

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

  const client = new GoogleGenerativeAI(apiKey);
  return client;
}

async function generateWithFallback(prompt: string) {
  const client = getModel();
  const configured = process.env.GEMINI_MODEL;
  const models = [configured, 'gemini-2.5-flash', 'gemini-flash-latest'].filter(
    (name): name is string => Boolean(name && name.trim())
  );

  let lastError: Error | null = null;

  for (const modelName of models) {
    try {
      const model = client.getGenerativeModel({ model: modelName });
      return await model.generateContent(prompt);
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error('Unable to generate content with configured Gemini models.');
}

function parseJsonLoose(raw: string): Record<string, unknown> {
  const cleaned = raw.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const maybe = cleaned.slice(start, end + 1);
      return JSON.parse(maybe) as Record<string, unknown>;
    }
    throw new Error('Unable to parse Gemini JSON output.');
  }
}

export async function analyzeCV(cvText: string): Promise<CVAnalysis> {
  const prompt = `You are an expert recruiter. Analyze this CV text and return strict JSON with keys: summary (exactly 3 sentences), keySkills (array of max 12 concise skills).\n\nCV:\n${cvText.slice(0, 12000)}`;
  const result = await generateWithFallback(prompt);
  const raw = result.response.text();

  const sanitized = raw.replace(/```json|```/g, '').trim();
  const parsed = JSON.parse(sanitized) as Partial<CVAnalysis>;

  return {
    summary: parsed.summary?.trim() || 'Summary unavailable.',
    keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills.map((s) => String(s)) : []
  };
}

export async function scoreInterview(input: { cvSummary: string; transcript: string }): Promise<InterviewFeedback> {
  const prompt = `You are scoring a GTM/Sales interview. Use the CV summary and transcript to generate strict JSON with keys:
overall_score (integer 0-100), score_status ("computed"), overall_feedback (1-3 concise sentences),
criteria (array of exactly 5 objects with keys: name, rating, note).
Allowed criterion names: Ownership, Accountability, Collaboration, Customer Empathy, Adaptability & Ambiguity.
Allowed ratings: good, neutral, bad.
Each note must be one short line.

CV Summary:
${input.cvSummary.slice(0, 2500)}

Transcript:
${input.transcript.slice(0, 18000)}`;

  const result = await generateWithFallback(prompt);
  const raw = result.response.text();
  let parsed = parseJsonLoose(raw) as Partial<InterviewFeedback>;

  // One retry with stricter format if first parse does not include core keys.
  if (typeof parsed !== 'object' || parsed === null || (!('overall_score' in parsed) && !Array.isArray(parsed.criteria))) {
    const retryResult = await generateWithFallback(`${prompt}\n\nReturn JSON only. No markdown, no explanations.`);
    parsed = parseJsonLoose(retryResult.response.text()) as Partial<InterviewFeedback>;
  }
  const boundedScore = Math.max(0, Math.min(100, Math.round(Number(parsed.overall_score ?? 0))));

  const criteria: FeedbackCriterion[] = Array.isArray(parsed.criteria)
    ? parsed.criteria
        .map((row) => ({
          name: String((row as { name?: string }).name ?? '').trim(),
          rating: String((row as { rating?: string | number }).rating ?? '').trim().toLowerCase(),
          note: String((row as { note?: string }).note ?? '').trim()
        }))
        .filter((row) => row.name && row.note)
        .map((row) => ({
          name: row.name,
          rating: (() => {
            if (row.rating === 'good' || row.rating === 'bad' || row.rating === 'neutral') return row.rating as FeedbackCriterion['rating'];
            const numeric = Number(row.rating);
            if (!Number.isNaN(numeric)) {
              if (numeric >= 70) return 'good';
              if (numeric <= 39) return 'bad';
            }
            return 'neutral';
          })(),
          note: row.note
        }))
    : [];

  return {
    overall_score: boundedScore,
    score_status: 'computed',
    overall_feedback: (parsed.overall_feedback as string | undefined)?.trim() || 'Overall fit is under review.',
    criteria
  };
}

export async function generateNextRoundQuestions(input: {
  cvText: string;
  cvSummary: string;
  transcript: string;
  aiFeedback: string;
  roleApplied: string;
}): Promise<NextRoundQuestion[]> {
  const prompt = `Generate 3-5 tailored next-round interview questions for a GTM/Sales hiring manager.

Role applied for: ${input.roleApplied}

You MUST use:
- Candidate CV text
- Current round transcript
- AI analysis summary
- Missing signals/gaps (examples: no enterprise selling, weak metrics ownership, weak ops exposure, vague outcomes)

Return strict JSON with key:
- next_round_questions: array of objects with exactly:
  - question (1-2 lines)
  - reason (1 line, why it matters for Skylark + this role)
  - evidence (short tag referencing specific source, e.g. "CV: ex-Gartner channel", "Transcript: struggled with pricing")

Hard rules:
- Every question must be anchored to specific evidence from CV or transcript.
- If no evidence exists for a question, do not generate that question.
- Avoid generic/templated questions.
- At least 2 questions must probe the candidate's biggest inferred risk area.
- Do not repeat questions already asked in round one.
- Keep output concise and practical.

CV Summary:
${input.cvSummary.slice(0, 2500)}

CV Text:
${input.cvText.slice(0, 12000)}

Interview Transcript (Round 1):
${input.transcript.slice(0, 22000)}

AI Analysis Summary:
${input.aiFeedback.slice(0, 4000)}`;

  const result = await generateWithFallback(prompt);
  let parsed = parseJsonLoose(result.response.text()) as { next_round_questions?: Array<Partial<NextRoundQuestion>> };

  if (!Array.isArray(parsed?.next_round_questions)) {
    const retry = await generateWithFallback(`${prompt}\n\nReturn JSON only. No markdown, no prose.`);
    parsed = parseJsonLoose(retry.response.text()) as { next_round_questions?: Array<Partial<NextRoundQuestion>> };
  }

  const questions = Array.isArray(parsed.next_round_questions)
    ? parsed.next_round_questions
        .map((row) => ({
          question: String(row.question ?? '').trim(),
          reason: String(row.reason ?? '').trim(),
          evidence: String(row.evidence ?? '').trim()
        }))
        .filter((row) => row.question && row.reason && row.evidence)
        .slice(0, 5)
    : [];

  const fallbackQuestions: NextRoundQuestion[] = [
    {
      question: 'Pick one major revenue-impact claim from your CV and break down baseline, target, actual, and your direct ownership decisions.',
      reason: 'Skylark needs operators who can prove commercial impact with clear metric ownership in complex sales cycles.',
      evidence: 'CV: high-impact outcomes claimed without complete metric breakdown'
    },
    {
      question: 'Walk through a deal where procurement or technical validation slowed progress. What exact intervention did you make and what changed?',
      reason: 'This role requires unblocking long-cycle enterprise deals with multiple stakeholders.',
      evidence: 'Transcript: limited detail on enterprise stage-friction handling'
    },
    {
      question: 'Describe a failed initiative and the decision you now believe was wrong. What signal did you ignore and how did you correct your operating model?',
      reason: 'Skylark prioritizes ownership under ambiguity, including transparent failure analysis and corrective action.',
      evidence: 'Transcript: success examples strong, failure diagnostics underdeveloped'
    }
  ];

  const normalizedQuestions: NextRoundQuestion[] =
    questions.length >= 3
      ? questions
      : [
          ...questions,
          ...fallbackQuestions
        ].slice(0, 5);

  return normalizedQuestions.map((row) => ({
    question: row.question.slice(0, 320),
    reason: row.reason.slice(0, 220),
    evidence: row.evidence.slice(0, 140)
  }));
}
