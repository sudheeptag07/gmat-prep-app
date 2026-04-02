import type { InterviewFeedback, NextRoundQuestion, Recommendation, RubricEntry } from '@/lib/types';
import type { GmatChartData, GmatQuestion, GmatTableData, GmatTopic, GmatVisualData } from '@/lib/gmat-types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { buildGmatGenerationPrompt, buildGmatRepairPrompt } from '@/lib/gmat-generation-prompts';
import { generatedQuestionResponseSchema, validateGeneratedQuestionQuality, visualSchema } from '@/lib/gmat-generation-validators';
import { z } from 'zod';

type CVAnalysis = {
  summary: string;
  keySkills: string[];
};

type AssignmentAnalysis = {
  summary: string;
};

const RUBRIC_CRITERIA = [
  'Geospatial fundamentals',
  'Workflow thinking',
  'Drone data understanding',
  'Problem solving',
  'Assignment depth',
  'AI usage quality',
  'Communication clarity',
  'Delivery mindset',
  'Learning ability',
  'Skylark fit'
] as const;

function getModel() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');

  return new GoogleGenerativeAI(apiKey);
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
      return JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error('Unable to parse Gemini JSON output.');
  }
}

function parseStrictJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) {
    throw new Error('Model returned wrapper prose instead of JSON-only output.');
  }
  return JSON.parse(trimmed) as Record<string, unknown>;
}

function clampScore(value: unknown): number {
  const score = Number(value);
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function normalizeRecommendation(value: unknown): Recommendation {
  const raw = String(value ?? '').trim();
  if (
    raw === 'strong_shortlist' ||
    raw === 'shortlist' ||
    raw === 'borderline' ||
    raw === 'reject' ||
    raw === 'manual_review'
  ) {
    return raw;
  }
  return 'manual_review';
}

function normalizeEvidence(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function normalizeStringList(value: unknown, limit: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item ?? '').trim())
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeForDedup(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSingleSentenceLike(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  const sentenceMarks = (trimmed.match(/[.!?]/g) ?? []).length;
  return sentenceMarks <= 2 && trimmed.length <= 180;
}

function hasDistinctChoices(choices: string[]): boolean {
  const normalized = choices.map((item) => normalizeForDedup(item));
  return new Set(normalized).size === choices.length;
}

function requiresMissingVisual(stem: string): boolean {
  const normalized = stem.toLowerCase();
  const visualOnlyPatterns = [
    'graph above',
    'chart above',
    'table above',
    'figure above',
    'image above',
    'diagram above',
    'shown above',
    'see the graph',
    'see the chart',
    'see the table',
    'refer to the graph',
    'refer to the chart',
    'refer to the table',
    'displayed below',
    'shown below'
  ];

  return visualOnlyPatterns.some((pattern) => normalized.includes(pattern));
}

function stemNeedsStructuredVisual(stem: string): boolean {
  const normalized = stem.toLowerCase();
  return (
    normalized.includes('chart') ||
    normalized.includes('graph') ||
    normalized.includes('table') ||
    normalized.includes('bar chart') ||
    normalized.includes('line graph') ||
    normalized.includes('pie chart')
  );
}

function questionNeedsStructuredVisual(input: {
  topic: GmatTopic;
  subtopic: string;
  prompt: string;
  stem: string;
}): boolean {
  if (input.topic === 'Data Insights') return true;
  const context = `${input.topic} ${input.subtopic} ${input.prompt} ${input.stem}`.toLowerCase();
  return (
    stemNeedsStructuredVisual(input.stem) ||
    context.includes('graphic interpretation') ||
    context.includes('chart and graph analysis') ||
    context.includes('table analysis') ||
    context.includes('table reading') ||
    context.includes('tables') ||
    context.includes('bar charts') ||
    context.includes('line graphs') ||
    context.includes('pie charts') ||
    context.includes('scatter plots')
  );
}

function sanitizeStemForVisual(stem: string, hasVisual: boolean): string {
  if (!hasVisual) return stem.trim();

  return stem
    .replace(/\[\s*imagine[^\]]*\]/gi, '')
    .replace(/imagine\s+a\s+(?:bar chart|line graph|pie chart|chart|graph)[\s\S]*?(?=\n\n|What|Which|How|If|According|$)/gi, '')
    .replace(/(?:^|\n)\|[^\n]*\|(?:\n\|[^\n]*\|)+/g, '')
    .replace(/(?:^|\n)\|[-:\s|]+\|(?:\n\|[-:\s|]+\|)*/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function normalizeVisualData(value: unknown): GmatVisualData | null {
  if (!value || typeof value !== 'object') return null;

  const record = value as Record<string, unknown>;
  const type = String(record.type ?? '').trim();
  if (type === 'table') {
    const columns = Array.isArray(record.columns)
      ? record.columns.map((item) => String(item ?? '').trim()).filter(Boolean)
      : [];
    const rows = Array.isArray(record.rows)
      ? record.rows
          .map((row) =>
            Array.isArray(row) ? row.map((cell) => String(cell ?? '').trim()) : []
          )
          .filter((row) => row.length === columns.length && row.some(Boolean))
      : [];

    if (columns.length === 0 || rows.length === 0) return null;

    const table: GmatTableData = {
      type: 'table',
      title: String(record.title ?? '').trim() || undefined,
      columns,
      rows
    };
    return table;
  }

  if (type !== 'bar_chart' && type !== 'line_chart' && type !== 'pie_chart') return null;

  const labels = Array.isArray(record.labels)
    ? record.labels.map((item) => String(item ?? '').trim()).filter(Boolean)
    : [];
  const datasets = Array.isArray(record.datasets)
    ? record.datasets
        .map((dataset) => {
          const source = dataset as Record<string, unknown>;
          return {
            label: String(source.label ?? '').trim(),
            data: Array.isArray(source.data)
              ? source.data.map((point) => Number(point)).filter((point) => Number.isFinite(point))
              : []
          };
        })
        .filter((dataset) => dataset.label && dataset.data.length === labels.length)
    : [];

  if (labels.length === 0 || datasets.length === 0) return null;

  const chart: GmatChartData = {
    type,
    title: String(record.title ?? '').trim() || undefined,
    labels,
    datasets
  };
  return chart;
}

function hasRenderableVisualData(visual: GmatVisualData): boolean {
  if (visual.type === 'table') {
    return visual.columns.length > 0 && visual.rows.length > 0;
  }
  return visual.datasets.some((dataset) => dataset.data.some((point) => Number.isFinite(point)));
}

export async function generateGmatVisual(input: {
  topic: GmatTopic;
  subtopic: string;
  prompt: string;
  stem: string;
  choices: string[];
}): Promise<GmatVisualData | null> {
  if (!questionNeedsStructuredVisual(input)) return null;

  const prompt = `You convert GMAT visual-based questions into structured visual JSON.

Return strict JSON only:
{
  "visual": {
    "type": "bar_chart|line_chart|pie_chart|table",
    "title": "short title",
    "labels": ["label 1", "label 2"],
    "datasets": [
      {
        "label": "series name",
        "data": [10, 20]
      }
    ],
    "columns": ["column 1", "column 2"],
    "rows": [["value 1", "value 2"]]
  }
}

Rules:
- Infer the visual only from the question content below.
- Use "line_chart" for trend-over-time or ordered sequences.
- Use "bar_chart" for category comparisons.
- Use "pie_chart" only for proportional slice questions.
- Use "table" for table-analysis prompts or any prompt whose source data is row/column based.
- For pie charts, return exactly one dataset.
- Every dataset length must exactly match labels length.
- For tables, every row length must exactly match columns length.
- Do not return null, prose, markdown, or explanation.

Topic: ${input.topic}
Subtopic: ${input.subtopic}
Prompt: ${input.prompt}
Stem:
${input.stem}

Choices:
${input.choices.join('\n')}`;

  try {
    const result = await generateWithFallback(prompt);
    const parsed = parseStrictJsonObject(result.response.text()) as { visual?: unknown };
    const validated = z
      .object({
        visual: visualSchema
      })
      .strict()
      .safeParse(parsed);
    if (!validated.success) {
      return null;
    }
    const visual = normalizeVisualData(validated.data.visual);
    return visual && hasRenderableVisualData(visual) ? visual : null;
  } catch {
    return null;
  }
}

type GeneratedGmatQuestion = Omit<GmatQuestion, 'id'>;

export async function generateGmatQuestions(input: {
  topic: GmatTopic;
  subtopic: string;
  count: number;
}): Promise<GeneratedGmatQuestion[]> {
  const safeCount = Math.max(1, Math.min(10, Math.round(input.count)));
  const normalized: GeneratedGmatQuestion[] = [];
  let failureReasons: string[] = [];

  for (let attempt = 0; attempt < 3 && normalized.length < safeCount; attempt += 1) {
    const prompt =
      attempt === 0
        ? buildGmatGenerationPrompt({ topic: input.topic, subtopic: input.subtopic, count: safeCount })
        : buildGmatRepairPrompt({
            topic: input.topic,
            subtopic: input.subtopic,
            count: safeCount,
            failureReasons: failureReasons.length > 0 ? failureReasons.slice(0, 12) : ['Previous output did not validate.']
          });

    let parsed: unknown;
    try {
      const result = await generateWithFallback(prompt);
      parsed = parseStrictJsonObject(result.response.text());
    } catch (error) {
      failureReasons = [`Generation request failed: ${(error as Error).message}`];
      console.warn('[GMAT generation] request failed', {
        topic: input.topic,
        subtopic: input.subtopic,
        attempt: attempt + 1,
        reasons: failureReasons
      });
      continue;
    }

    const validated = generatedQuestionResponseSchema.safeParse(parsed);
    if (!validated.success) {
      failureReasons = validated.error.issues.map((issue) => issue.message);
      console.warn('[GMAT generation] schema validation failed', {
        topic: input.topic,
        subtopic: input.subtopic,
        attempt: attempt + 1,
        reasons: failureReasons
      });
      continue;
    }

    const attemptFailures: string[] = [];
    for (const rawQuestion of validated.data.questions) {
      let question: GeneratedGmatQuestion = {
        ...rawQuestion,
        visual: rawQuestion.visual ? normalizeVisualData(rawQuestion.visual) : null,
        stem: sanitizeStemForVisual(rawQuestion.stem, rawQuestion.visual !== null)
      };

      const visualRequired = questionNeedsStructuredVisual({
        topic: input.topic,
        subtopic: input.subtopic,
        prompt: question.prompt,
        stem: question.stem
      });

      if (!question.visual && visualRequired) {
        // eslint-disable-next-line no-await-in-loop
        question = {
          ...question,
          visual: await generateGmatVisual({
            topic: input.topic,
            subtopic: input.subtopic,
            prompt: question.prompt,
            stem: question.stem,
            choices: question.choices
          })
        };
      }

      const qualityReasons = validateGeneratedQuestionQuality(question, {
        topic: input.topic,
        subtopic: input.subtopic
      });

      if (qualityReasons.length > 0) {
        attemptFailures.push(...qualityReasons.map((reason) => `${question.prompt}: ${reason}`));
        continue;
      }

      normalized.push(question);
      if (normalized.length >= safeCount) break;
    }

    if (normalized.length >= safeCount) break;

    failureReasons = attemptFailures.length > 0 ? attemptFailures : ['Generator returned too few valid questions.'];
    console.warn('[GMAT generation] quality validation failed', {
      topic: input.topic,
      subtopic: input.subtopic,
      attempt: attempt + 1,
      reasons: failureReasons.slice(0, 12)
    });
  }

  const deduped: GeneratedGmatQuestion[] = [];
  const seen = new Set<string>();
  for (const question of normalized) {
    const key = normalizeForDedup(`${question.topic}|${question.subtopic}|${question.stem}`);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(question);
    if (deduped.length >= safeCount) break;
  }

  return deduped;
}

export async function analyzeCV(cvText: string): Promise<CVAnalysis> {
  const prompt = `You are summarizing a GIS candidate CV for a hiring manager.
Return strict JSON with keys:
- summary: exactly 3 sentences focused on GIS, spatial data, delivery ownership, and tooling.
- keySkills: array of up to 12 concise skills.

CV:
${cvText.slice(0, 12000)}`;

  const result = await generateWithFallback(prompt);
  const parsed = parseJsonLoose(result.response.text()) as Partial<CVAnalysis>;

  return {
    summary: String(parsed.summary ?? 'Summary unavailable.').trim(),
    keySkills: Array.isArray(parsed.keySkills) ? parsed.keySkills.map((item) => String(item)) : []
  };
}

export async function analyzeAssignment(input: {
  assignmentText: string;
  assignmentLink?: string | null;
  note?: string | null;
}): Promise<AssignmentAnalysis> {
  const prompt = `You are summarizing a GIS candidate assignment for a hiring manager.
Return strict JSON with key:
- summary: 3-4 sentences describing the problem tackled, data handling approach, GIS reasoning, delivery quality, and open risks.

Assignment link:
${input.assignmentLink ?? 'N/A'}

Candidate note:
${input.note ?? 'N/A'}

Assignment content:
${input.assignmentText.slice(0, 14000)}`;

  const result = await generateWithFallback(prompt);
  const parsed = parseJsonLoose(result.response.text()) as Partial<AssignmentAnalysis>;

  return {
    summary: String(parsed.summary ?? 'Assignment uploaded. Summary pending.').trim()
  };
}

export async function scoreInterview(input: {
  roleApplied: string;
  cvSummary: string;
  assignmentSummary: string;
  transcript: string;
}): Promise<InterviewFeedback> {
  const prompt = `You are evaluating a candidate for ${input.roleApplied} at Skylark Drones.

This interview is about how the candidate reasons through messy real-world spatial problems.
Do not reward textbook theory unless it is tied to delivery.
Do not hallucinate evidence.
If evidence is thin, lower confidence and prefer manual_review.

Return strict JSON with keys:
- overall_score: integer 0-100
- recommendation: one of "strong_shortlist" | "shortlist" | "borderline" | "reject" | "manual_review"
- score_status: "computed"
- overall_feedback: 2-4 concise sentences
- confidence: number 0-1
- strengths: array of 3-5 concise points
- concerns: array of 2-5 concise points
- rubric: array of exactly 10 objects with keys:
  - criteria
  - score
  - note
  - evidence (array of 1-3 direct references like "Transcript: user described cleaning GPS drift before orthomosaic generation")

Use these exact rubric criteria in this order:
${RUBRIC_CRITERIA.join('\n')}

Rules:
- Every rubric row must contain evidence from the transcript, CV summary, or assignment summary.
- Evidence must be grounded and traceable. Do not invent line numbers.
- If transcript evidence is weak, reflect that in concerns and confidence.
- Recommendation should reflect evidence quality as well as score.

CV Summary:
${input.cvSummary.slice(0, 2800)}

Assignment Summary:
${input.assignmentSummary.slice(0, 2800)}

Transcript:
${input.transcript.slice(0, 22000)}`;

  const result = await generateWithFallback(prompt);
  let parsed = parseJsonLoose(result.response.text()) as Partial<InterviewFeedback> & {
    rubric?: Array<Partial<RubricEntry>>;
  };

  if (!Array.isArray(parsed.rubric) || typeof parsed.overall_score === 'undefined') {
    const retry = await generateWithFallback(`${prompt}\n\nReturn JSON only. No markdown. No explanation.`);
    parsed = parseJsonLoose(retry.response.text()) as Partial<InterviewFeedback> & {
      rubric?: Array<Partial<RubricEntry>>;
    };
  }

  const rubric = Array.isArray(parsed.rubric)
    ? parsed.rubric
        .map((row, index) => ({
          criteria: String(row.criteria ?? RUBRIC_CRITERIA[index] ?? '').trim(),
          score: clampScore(row.score),
          note: String(row.note ?? '').trim(),
          evidence: normalizeEvidence(row.evidence)
        }))
        .filter((row) => row.criteria && row.note && row.evidence.length > 0)
    : [];

  return {
    overall_score: clampScore(parsed.overall_score),
    recommendation: normalizeRecommendation(parsed.recommendation),
    score_status: 'computed',
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence ?? 0.55))),
    overall_feedback: String(parsed.overall_feedback ?? 'Overall fit is under review.').trim(),
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map((item) => String(item).trim()).filter(Boolean).slice(0, 5) : [],
    concerns: Array.isArray(parsed.concerns) ? parsed.concerns.map((item) => String(item).trim()).filter(Boolean).slice(0, 5) : [],
    rubric: rubric.length > 0
      ? rubric.slice(0, 10)
      : RUBRIC_CRITERIA.map((criteria) => ({
          criteria,
          score: 0,
          note: 'Insufficient grounded evidence.',
          evidence: ['Transcript: insufficient evidence']
        }))
  };
}

export async function generateNextRoundQuestions(input: {
  roleApplied: string;
  cvText: string;
  cvSummary: string;
  assignmentSummary: string;
  transcript: string;
  evaluationSummary: string;
}): Promise<NextRoundQuestion[]> {
  const prompt = `Generate 5-7 targeted next-round interview questions for ${input.roleApplied} at Skylark Drones.

Return strict JSON with key:
- next_round_questions: array of objects with exactly:
  - question
  - why_skylark
  - expected_outcome
  - evidence_gap

Rules:
- Every question must be anchored to a specific gap, contradiction, or promising claim from the CV, assignment, or transcript.
- No generic questions.
- At least 2 questions must probe the biggest risk area.
- At least 1 question must test messy data handling.
- At least 1 question must test assignment ownership.
- At least 1 question must test delivery judgment with GIS/drone workflows.
- If the evidence is insufficient, return an empty array.

CV Summary:
${input.cvSummary.slice(0, 2500)}

CV Text:
${input.cvText.slice(0, 12000)}

Assignment Summary:
${input.assignmentSummary.slice(0, 2500)}

Transcript:
${input.transcript.slice(0, 22000)}

Evaluation Summary:
${input.evaluationSummary.slice(0, 4000)}`;

  const result = await generateWithFallback(prompt);
  let parsed = parseJsonLoose(result.response.text()) as { next_round_questions?: Array<Partial<NextRoundQuestion>> };

  if (!Array.isArray(parsed.next_round_questions)) {
    const retry = await generateWithFallback(`${prompt}\n\nReturn JSON only. No markdown. No explanation.`);
    parsed = parseJsonLoose(retry.response.text()) as { next_round_questions?: Array<Partial<NextRoundQuestion>> };
  }

  const questions = Array.isArray(parsed.next_round_questions)
    ? parsed.next_round_questions
        .map((row) => ({
          question: String(row.question ?? '').trim(),
          why_skylark: String(row.why_skylark ?? '').trim(),
          expected_outcome: String(row.expected_outcome ?? '').trim(),
          evidence_gap: String(
            (row as Record<string, unknown>).evidence_gap ??
              (row as Record<string, unknown>).evidence ??
              ''
          ).trim()
        }))
        .filter((row) => row.question && row.why_skylark && row.expected_outcome && row.evidence_gap)
        .slice(0, 7)
    : [];

  return questions.length >= 5 ? questions : [];
}
