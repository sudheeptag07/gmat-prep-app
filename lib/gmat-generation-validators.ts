import { z } from 'zod';
import type { GmatChartData, GmatQuestion, GmatTableData, GmatVisualData } from '@/lib/gmat-types';
import { GmatGenerationProfile, inferGenerationProfile, profileRequiresVisual } from '@/lib/gmat-generation-prompts';

const chartDatasetSchema = z
  .object({
    label: z.string().min(1),
    data: z.array(z.number().finite()).min(1)
  })
  .strict();

const chartSchema = z
  .object({
    type: z.enum(['bar_chart', 'line_chart', 'pie_chart']),
    title: z.string().min(1).optional(),
    labels: z.array(z.string().min(1)).min(1),
    datasets: z.array(chartDatasetSchema).min(1)
  })
  .strict()
  .refine((value) => value.datasets.every((dataset) => dataset.data.length === value.labels.length), {
    message: 'Every chart dataset must align with labels.'
  });

const tableSchema = z
  .object({
    type: z.literal('table'),
    title: z.string().min(1).optional(),
    columns: z.array(z.string().min(1)).min(2),
    rows: z.array(z.array(z.string().min(1)).min(2)).min(1)
  })
  .strict()
  .refine((value) => value.rows.every((row) => row.length === value.columns.length), {
    message: 'Every table row must align with columns.'
  });

export const visualSchema = z.union([chartSchema, tableSchema]);

const methodSchema = z
  .object({
    name: z.string().min(1),
    steps: z.array(z.string().min(1)).min(1),
    whyItWorks: z.string().min(1),
    speed: z.enum(['Fast', 'Medium', 'Slow']),
    reliability: z.enum(['High', 'Medium']),
    cognitiveLoad: z.enum(['Low', 'Medium', 'High']),
    whenToUse: z.string().min(1)
  })
  .strict();

export const generatedQuestionSchema = z
  .object({
    topic: z.enum(['Quant', 'Verbal', 'Data Insights']),
    subtopic: z.string().min(1),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    prompt: z.string().min(1),
    stem: z.string().min(1),
    choices: z.array(z.string().min(1)).length(5),
    correctAnswer: z.string().min(1),
    recommendedTimeSeconds: z.number().int().min(75).max(180),
    concepts: z.array(z.string().min(1)).min(1).max(6),
    strategyTags: z.array(z.string().min(1)).min(1).max(6),
    trapType: z.string().min(1),
    patternType: z.string().min(1),
    standardSolution: z.array(z.string().min(1)).min(3).max(8),
    alternativeMethods: z.array(methodSchema).min(1).max(2),
    topScorerNotice: z.string().min(1),
    commonTrap: z.string().min(1),
    timeSavingInsight: z.string().min(1),
    visual: z.union([visualSchema, z.null()])
  })
  .strict();

export const generatedQuestionResponseSchema = z
  .object({
    questions: z.array(generatedQuestionSchema).min(1)
  })
  .strict();

type GeneratedQuestionLike = Omit<GmatQuestion, 'id'>;

type ValidationContext = {
  topic: GmatQuestion['topic'];
  subtopic: string;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isSingleSentence(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && (trimmed.match(/[.!?]/g) ?? []).length <= 2;
}

function choiceLengthSpread(choices: string[]): number {
  const lengths = choices.map((choice) => choice.trim().length);
  return Math.max(...lengths) - Math.min(...lengths);
}

function awkwardPhrases(value: string): string[] {
  const normalized = value.toLowerCase();
  const phrases = [
    'imagine a chart',
    'the following could be shown',
    'suppose the following chart',
    'one might conclude',
    'perhaps the best answer',
    'it can be seen that',
    'as shown above',
    'as described below'
  ];
  return phrases.filter((phrase) => normalized.includes(phrase));
}

function looksLikeMissingVisual(stem: string): boolean {
  const normalized = stem.toLowerCase();
  return [
    'graph above',
    'chart above',
    'table above',
    'figure above',
    'see the graph',
    'see the chart',
    'see the table',
    'shown below',
    'displayed below'
  ].some((pattern) => normalized.includes(pattern));
}

function validateVisualQuality(visual: GmatVisualData | null): string[] {
  if (!visual) return [];
  if (visual.type === 'table') {
    if (visual.columns.length < 2) return ['Table visual must include at least two columns.'];
    if (visual.rows.length < 1) return ['Table visual must include at least one row.'];
    return [];
  }

  if (visual.labels.length < 2) return ['Chart visual must include at least two labels.'];
  if (visual.datasets.length < 1) return ['Chart visual must include at least one dataset.'];
  return [];
}

function validateVerbalByProfile(question: GeneratedQuestionLike, profile: GmatGenerationProfile): string[] {
  const reasons: string[] = [];
  const stem = question.stem.trim();
  const normalizedStem = stem.toLowerCase();

  if (profile === 'verbal_cr') {
    if (stem.length > 700) reasons.push('Critical Reasoning stem is too long.');
    if (normalizedStem.includes('passage')) reasons.push('Critical Reasoning question reads like Reading Comprehension.');
    if (
      ![
        'argument',
        'conclusion',
        'claim',
        'evidence',
        'reasoning',
        'paradox',
        'assumption'
      ].some((keyword) => normalizedStem.includes(keyword))
    ) {
      reasons.push('Critical Reasoning stem does not clearly contain argument-style reasoning.');
    }
  }

  if (profile === 'verbal_rc') {
    if (stem.length < 220) reasons.push('Reading Comprehension passage is too short to feel GMAT-like.');
    if (!normalizedStem.includes('passage') && !stem.includes('\n')) {
      reasons.push('Reading Comprehension question is missing a distinct passage block.');
    }
  }

  return reasons;
}

function validateDataInsightsByProfile(question: GeneratedQuestionLike, profile: GmatGenerationProfile): string[] {
  const reasons: string[] = [];
  if (!question.visual) {
    reasons.push('Data Insights question is missing structured visual data.');
    return reasons;
  }

  if (profile === 'di_table_analysis' && question.visual.type !== 'table') {
    reasons.push('Table Analysis must use a table visual.');
  }
  if (profile === 'di_graphic_interpretation' && question.visual.type === 'table') {
    reasons.push('Graphic Interpretation should use a chart visual, not a table.');
  }

  return reasons;
}

export function validateGeneratedQuestionQuality(question: GeneratedQuestionLike, context: ValidationContext): string[] {
  const reasons: string[] = [];
  const profile = inferGenerationProfile(context.topic, context.subtopic);
  const normalizedChoices = question.choices.map((choice) => normalize(choice));
  const uniqueChoices = new Set(normalizedChoices);
  const stem = question.stem.trim();
  const fullText = `${question.prompt} ${question.stem}`;

  if (question.topic !== context.topic) reasons.push('Question topic does not match requested topic.');
  if (question.subtopic !== context.subtopic) reasons.push('Question subtopic does not match requested subtopic.');

  if (stem.length < 45) reasons.push('Stem is too short.');
  if (stem.length > 1400) reasons.push('Stem is too verbose.');
  if (awkwardPhrases(fullText).length > 0) reasons.push('Wording contains awkward or placeholder phrasing.');
  if (looksLikeMissingVisual(stem)) reasons.push('Question depends on missing visual information.');

  if (uniqueChoices.size !== question.choices.length) reasons.push('Answer choices are duplicated or too similar.');
  if (!question.choices.includes(question.correctAnswer)) reasons.push('Correct answer does not match any choice.');
  if (choiceLengthSpread(question.choices) > 220) reasons.push('Answer choices are inconsistent in length or style.');
  if (question.choices.some((choice) => /all of the above|none of the above/i.test(choice))) {
    reasons.push('Answer choices use non-GMAT patterns like "all of the above".');
  }

  if (!isSingleSentence(question.topScorerNotice)) reasons.push('Top scorer notice should be one concise sentence.');
  if (!isSingleSentence(question.commonTrap)) reasons.push('Common trap should be one concise sentence.');
  if (!isSingleSentence(question.timeSavingInsight)) reasons.push('Time-saving insight should be one concise sentence.');

  reasons.push(...validateVisualQuality(question.visual));

  if (profileRequiresVisual(profile) && !question.visual) {
    reasons.push('This question type requires structured visual data.');
  }

  if (question.topic === 'Verbal') {
    reasons.push(...validateVerbalByProfile(question, profile));
  }

  if (question.topic === 'Data Insights') {
    reasons.push(...validateDataInsightsByProfile(question, profile));
  }

  return reasons;
}
