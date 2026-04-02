import type { GmatTopic } from '@/lib/gmat-types';

export type GmatGenerationProfile =
  | 'quant'
  | 'verbal_cr'
  | 'verbal_rc'
  | 'di_table_analysis'
  | 'di_graphic_interpretation'
  | 'di_multi_source_reasoning'
  | 'di_two_part_analysis'
  | 'di_data_sufficiency';

type PromptContext = {
  topic: GmatTopic;
  subtopic: string;
  count: number;
};

type ProfileDefinition = {
  label: string;
  sectionRules: string[];
  subtypeRules: string[];
  requireVisual: boolean;
};

const COMMON_OUTPUT_RULES = [
  'Return valid JSON only.',
  'Do not use markdown fences.',
  'Do not include commentary before or after the JSON.',
  'Each question must be self-contained and solvable as written.',
  'Use exactly five answer choices.',
  'There must be exactly one best answer.',
  'Avoid placeholder phrases such as "imagine a chart" or "the following could be shown".'
].join('\n- ');

const JSON_SHAPE = `{
  "questions": [
    {
      "topic": "Quant|Verbal|Data Insights",
      "subtopic": "string",
      "difficulty": "Easy|Medium|Hard",
      "prompt": "short title",
      "stem": "full question stem",
      "choices": ["choice 1", "choice 2", "choice 3", "choice 4", "choice 5"],
      "correctAnswer": "must exactly match one choice",
      "recommendedTimeSeconds": 75-180,
      "concepts": ["concept 1"],
      "strategyTags": ["strategy 1"],
      "trapType": "string",
      "patternType": "string",
      "standardSolution": ["step 1", "step 2", "step 3"],
      "alternativeMethods": [
        {
          "name": "method name",
          "steps": ["step 1", "step 2"],
          "whyItWorks": "string",
          "speed": "Fast|Medium|Slow",
          "reliability": "High|Medium",
          "cognitiveLoad": "Low|Medium|High",
          "whenToUse": "string"
        }
      ],
      "topScorerNotice": "single sentence",
      "commonTrap": "single sentence",
      "timeSavingInsight": "single sentence",
      "visual": null | {
        "type": "bar_chart|line_chart|pie_chart|table",
        "title": "optional title",
        "labels": ["label 1", "label 2"],
        "datasets": [{ "label": "series name", "data": [10, 20] }],
        "columns": ["column 1", "column 2"],
        "rows": [["value 1", "value 2"]]
      }
    }
  ]
}`;

const PROFILE_DEFINITIONS: Record<GmatGenerationProfile, ProfileDefinition> = {
  quant: {
    label: 'Quant',
    requireVisual: false,
    sectionRules: [
      'Use concise GMAT Focus quant wording.',
      'Prefer arithmetic, algebraic, numerical, or logical reasoning over bulky setup.',
      'Avoid trick phrasing that creates ambiguity.',
      'Make distractors numerically plausible, not silly.'
    ],
    subtypeRules: [
      'The prompt should test one dominant quant idea tied to the requested subtopic.',
      'The stem should usually end with one clean target quantity.',
      'Do not use charts or tables unless the subtopic genuinely requires data interpretation.'
    ]
  },
  verbal_cr: {
    label: 'Verbal / Critical Reasoning',
    requireVisual: false,
    sectionRules: [
      'Write like GMAT Critical Reasoning, not casual debate prose.',
      'Use one short argument stimulus with a clear conclusion and support.',
      'Make all answer choices plausible and logically close.',
      'Keep wording clean, precise, and exam-like.'
    ],
    subtypeRules: [
      'The question must match the requested Critical Reasoning subtype.',
      'One choice must be the single best answer under standard GMAT logic.',
      'Avoid awkward filler such as "which of the following, if true, might perhaps".',
      'Do not write passage-style Reading Comprehension questions.'
    ]
  },
  verbal_rc: {
    label: 'Verbal / Reading Comprehension',
    requireVisual: false,
    sectionRules: [
      'Write a compact GMAT-style passage followed by a single question.',
      'Passage wording should feel natural, editorial, and precise.',
      'Answer choices must be plausible interpretations of the passage.',
      'Avoid vague summaries or choices that are obviously extreme.'
    ],
    subtypeRules: [
      'The question must match the requested Reading Comprehension subtype.',
      'Include enough passage detail to support one best answer.',
      'Do not collapse into Critical Reasoning argument format.',
      'Do not make the passage longer than needed.'
    ]
  },
  di_table_analysis: {
    label: 'Data Insights / Table Analysis',
    requireVisual: true,
    sectionRules: [
      'This is GMAT Data Insights.',
      'The question must use structured visual data.',
      'The visual must be the primary source of truth.'
    ],
    subtypeRules: [
      'Use visual.type = "table".',
      'Provide clean column headers and rows.',
      'The question should require extraction or comparison from the table, not prose guessing.'
    ]
  },
  di_graphic_interpretation: {
    label: 'Data Insights / Graphic Interpretation',
    requireVisual: true,
    sectionRules: [
      'This is GMAT Data Insights.',
      'The question must use structured visual data.',
      'The visual must carry the numbers needed to solve.'
    ],
    subtypeRules: [
      'Use visual.type = "bar_chart", "line_chart", or "pie_chart".',
      'The prompt should require interpreting trends, differences, percentages, or comparisons.',
      'Do not describe a missing chart in prose.'
    ]
  },
  di_multi_source_reasoning: {
    label: 'Data Insights / Multi-Source Reasoning',
    requireVisual: true,
    sectionRules: [
      'This is GMAT Data Insights.',
      'The question must use structured visual data.',
      'The visual must combine multiple data sources in a compact, readable form.'
    ],
    subtypeRules: [
      'Prefer visual.type = "table" unless a chart is clearly better.',
      'Represent multiple sources explicitly, such as source columns or source groupings.',
      'Require synthesis across at least two pieces of information.'
    ]
  },
  di_two_part_analysis: {
    label: 'Data Insights / Two-Part Analysis',
    requireVisual: true,
    sectionRules: [
      'This is GMAT Data Insights.',
      'The question must use structured visual data.',
      'The data should support evaluating two linked quantities or decisions.'
    ],
    subtypeRules: [
      'Prefer visual.type = "table" unless a chart makes the paired reasoning clearer.',
      'The answer should still resolve to one best option among the five choices used by this app.',
      'Do not write a free-form choose-two interface prompt.'
    ]
  },
  di_data_sufficiency: {
    label: 'Data Insights / Data Sufficiency',
    requireVisual: true,
    sectionRules: [
      'This is GMAT Data Insights.',
      'The question must use structured visual data.',
      'The logic must focus on sufficiency, not full solution.'
    ],
    subtypeRules: [
      'Prefer visual.type = "table" to hold the givens and statements cleanly.',
      'The stem must clearly separate the question prompt from Statement (1) and Statement (2).',
      'Only one answer choice may represent the correct sufficiency judgment.'
    ]
  }
};

export function inferGenerationProfile(topic: GmatTopic, subtopic: string): GmatGenerationProfile {
  const normalized = subtopic.toLowerCase();

  if (topic === 'Quant') return 'quant';

  if (topic === 'Verbal') {
    const rcKeywords = [
      'main idea',
      'primary purpose',
      'specific detail',
      'function of paragraph',
      'author tone',
      'author attitude',
      'logical structure',
      'vocabulary in context',
      'reading comprehension',
      'rc based',
      'application questions'
    ];
    return rcKeywords.some((keyword) => normalized.includes(keyword)) ? 'verbal_rc' : 'verbal_cr';
  }

  if (normalized.includes('table analysis') || normalized.includes('table reading') || normalized === 'tables') {
    return 'di_table_analysis';
  }
  if (
    normalized.includes('graphic interpretation') ||
    normalized.includes('chart and graph analysis') ||
    normalized.includes('bar charts') ||
    normalized.includes('line graphs') ||
    normalized.includes('pie charts') ||
    normalized.includes('scatter plots')
  ) {
    return 'di_graphic_interpretation';
  }
  if (normalized.includes('multi-source reasoning') || normalized.includes('multi-source data synthesis')) {
    return 'di_multi_source_reasoning';
  }
  if (normalized.includes('two-part analysis')) {
    return 'di_two_part_analysis';
  }
  if (
    normalized.includes('data sufficiency') ||
    normalized.includes('statement evaluation') ||
    normalized.includes('sufficiency vs solvability') ||
    normalized.includes('combining statements')
  ) {
    return 'di_data_sufficiency';
  }

  return 'di_graphic_interpretation';
}

export function buildGmatGenerationPrompt(context: PromptContext): string {
  const profile = inferGenerationProfile(context.topic, context.subtopic);
  const definition = PROFILE_DEFINITIONS[profile];

  return `You generate production-quality GMAT Focus practice questions.

Profile: ${definition.label}
Requested topic: ${context.topic}
Requested subtopic: ${context.subtopic}
Requested question count: ${context.count}

Output contract:
- ${COMMON_OUTPUT_RULES}

Return this exact JSON shape:
${JSON_SHAPE}

Section rules:
- ${definition.sectionRules.join('\n- ')}

Subtype rules:
- ${definition.subtypeRules.join('\n- ')}

Additional requirements:
- Generate exactly ${context.count} unique questions.
- Topic must be "${context.topic}" for every question.
- Subtopic must be "${context.subtopic}" for every question.
- ${definition.requireVisual ? 'Every question must include a non-null "visual" object.' : 'Use "visual": null unless a structured visual is truly necessary.'}
- Do not rely on missing information.
- Do not use placeholder visual descriptions.
- Keep wording concise, natural, and GMAT-like.`;
}

export function buildGmatRepairPrompt(context: PromptContext & { failureReasons: string[] }): string {
  const base = buildGmatGenerationPrompt(context);
  return `${base}

The previous output failed validation for these reasons:
- ${context.failureReasons.join('\n- ')}

Repair instructions:
- Correct every listed issue.
- Regenerate the full JSON payload from scratch.
- Do not explain the fixes.
- Return JSON only.`;
}

export function profileRequiresVisual(profile: GmatGenerationProfile): boolean {
  return PROFILE_DEFINITIONS[profile].requireVisual;
}
