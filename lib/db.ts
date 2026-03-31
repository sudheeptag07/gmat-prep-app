import { createClient } from '@libsql/client';
import { v4 as uuidv4 } from 'uuid';
import { decryptValue, encryptValue } from '@/lib/crypto';
import { GMAT_SEED_QUESTIONS } from '@/lib/gmat-content';
import type {
  EncouragementPayload,
  GmatAttempt,
  GmatAttemptWithQuestion,
  GmatConfidence,
  GmatLearner,
  GmatQuestion,
  GmatStrategyInput,
  GmatSubtopic,
  GmatTopic
} from '@/lib/gmat-types';
import { selectEncouragement } from '@/lib/select-encouragement';
import type { EncouragementDerivedFlags } from '@/lib/select-encouragement';
import { generateGmatQuestions } from '@/lib/gemini';
import { getTopicCatalog } from '@/lib/gmat-taxonomy';
import { buildAssessmentRecord } from '@/lib/expense-health';
import type { AssessmentRecord, AssessmentSubmission } from '@/lib/expense-types';
import type {
  Candidate,
  CandidateWithInterview,
  CandidateStatus,
  Interview,
  InterviewFeedback,
  NextRoundQuestion,
  Recommendation,
  ScoreStatus,
  TranscriptQualityStatus
} from '@/lib/types';

const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

export const db = createClient({ url, authToken });

let initialized = false;

export async function ensureSchema() {
  if (initialized) return;

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role_applied TEXT NOT NULL DEFAULT 'GIS Analyst / GIS Engineer',
        metadata_json TEXT,
        cv_text TEXT,
        cv_summary TEXT,
        cv_pdf_base64 TEXT,
        cv_file_name TEXT,
        assignment_text TEXT,
        assignment_summary TEXT,
        assignment_pdf_base64 TEXT,
        assignment_file_name TEXT,
        assignment_links_json TEXT,
        next_round_questions TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        ai_score INTEGER,
        recommendation TEXT,
        score_status TEXT NOT NULL DEFAULT 'missing',
        transcript_quality_status TEXT NOT NULL DEFAULT 'missing',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS interviews (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        transcript TEXT,
        duration INTEGER,
        transcript_quality_score INTEGER,
        transcript_quality_status TEXT NOT NULL DEFAULT 'missing',
        agent_summary TEXT,
        feedback_json TEXT,
        rubric_json TEXT,
        audio_url TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
      )`,
      `CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        candidate_id TEXT,
        conversation_id TEXT,
        payload_json TEXT NOT NULL,
        event_type TEXT,
        processing_status TEXT NOT NULL DEFAULT 'received',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        company TEXT NOT NULL,
        email_encrypted TEXT NOT NULL,
        role TEXT NOT NULL,
        company_size TEXT NOT NULL,
        coworking_space TEXT NOT NULL,
        city TEXT NOT NULL,
        payment_methods TEXT NOT NULL,
        reimbursement_volume TEXT NOT NULL,
        claim_method TEXT NOT NULL,
        reimbursement_time TEXT NOT NULL,
        petty_cash TEXT NOT NULL,
        petty_cash_manager TEXT NOT NULL,
        pain_points TEXT NOT NULL,
        audit_difficulty TEXT NOT NULL,
        upi_wallet_interest TEXT NOT NULL,
        demo_interest TEXT NOT NULL,
        expense_score INTEGER NOT NULL,
        lead_score INTEGER NOT NULL,
        lead_classification TEXT NOT NULL,
        result_summary TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS gmat_users (
        id TEXT PRIMARY KEY,
        target_score INTEGER NOT NULL,
        strengths_json TEXT NOT NULL,
        weekly_hours INTEGER NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      `CREATE TABLE IF NOT EXISTS gmat_questions (
        id TEXT PRIMARY KEY,
        topic TEXT NOT NULL,
        subtopic TEXT NOT NULL,
        difficulty TEXT NOT NULL,
        prompt TEXT NOT NULL,
        stem TEXT NOT NULL,
        choices_json TEXT NOT NULL,
        correct_answer TEXT NOT NULL,
        recommended_time_seconds INTEGER NOT NULL,
        concepts_json TEXT NOT NULL,
        strategy_tags_json TEXT NOT NULL,
        trap_type TEXT NOT NULL,
        pattern_type TEXT NOT NULL,
        standard_solution_json TEXT NOT NULL,
        alternative_methods_json TEXT NOT NULL,
        top_scorer_notice TEXT NOT NULL,
        common_trap TEXT NOT NULL,
        time_saving_insight TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS gmat_attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        selected_answer TEXT NOT NULL,
        is_correct INTEGER NOT NULL,
        time_taken_seconds INTEGER NOT NULL,
        strategy_used TEXT,
        confidence TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES gmat_users(id),
        FOREIGN KEY (question_id) REFERENCES gmat_questions(id)
      )`,
      `CREATE TABLE IF NOT EXISTS attempts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        question_id TEXT NOT NULL,
        topic TEXT,
        subtopic TEXT,
        correct INTEGER NOT NULL,
        time_taken_seconds INTEGER NOT NULL,
        ideal_time_seconds INTEGER,
        confidence_level TEXT,
        selected_strategy TEXT,
        inferred_strategy TEXT,
        chosen_answer TEXT,
        correct_answer TEXT,
        is_common_trap INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS encouragement_history (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        attempt_id TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        message_text TEXT NOT NULL,
        shown_at TEXT NOT NULL
      )`,
      `CREATE INDEX IF NOT EXISTS idx_gmat_questions_topic_subtopic_difficulty
       ON gmat_questions (topic, subtopic, difficulty)`,
      `CREATE INDEX IF NOT EXISTS idx_gmat_attempts_user_question
       ON gmat_attempts (user_id, question_id)`,
      `CREATE INDEX IF NOT EXISTS idx_attempts_user_created_at
       ON attempts (user_id, created_at DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_encouragement_history_user_shown_at
       ON encouragement_history (user_id, shown_at DESC)`
    ],
    'write'
  );

  await ensureColumns();
  await repairInterviewForeignKey();
  await seedGmatQuestions();

  initialized = true;
}

async function repairInterviewForeignKey() {
  const fk = await db.execute('PRAGMA foreign_key_list(interviews)');
  const fkRow = fk.rows[0] as Record<string, unknown> | undefined;
  const referencedTable = fkRow ? String(fkRow.table) : 'candidates';

  if (referencedTable === 'candidates') {
    return;
  }

  await db.batch(
    [
      `CREATE TABLE IF NOT EXISTS interviews_new (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        transcript TEXT,
        duration INTEGER,
        transcript_quality_score INTEGER,
        transcript_quality_status TEXT NOT NULL DEFAULT 'missing',
        agent_summary TEXT,
        feedback_json TEXT,
        rubric_json TEXT,
        audio_url TEXT,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id)
      )`,
      `INSERT INTO interviews_new (
        id, candidate_id, transcript, duration, transcript_quality_score, transcript_quality_status,
        agent_summary, feedback_json, rubric_json, audio_url, created_at
      )
       SELECT
        i.id,
        i.candidate_id,
        i.transcript,
        NULL,
        NULL,
        'missing',
        i.agent_summary,
        i.feedback_json,
        NULL,
        i.audio_url,
        i.created_at
       FROM interviews i
       JOIN candidates c ON c.id = i.candidate_id`,
      `DROP TABLE interviews`,
      `ALTER TABLE interviews_new RENAME TO interviews`
    ],
    'write'
  );
}

async function ensureColumns() {
  const candidateColumns = await db.execute('PRAGMA table_info(candidates)');
  const interviewColumns = await db.execute('PRAGMA table_info(interviews)');
  const responseColumns = await db.execute('PRAGMA table_info(responses)');
  const webhookColumns = await db.execute('PRAGMA table_info(webhook_events)');
  const gmatAttemptColumns = await db.execute('PRAGMA table_info(gmat_attempts)');

  async function addColumnIfMissing(
    table: string,
    columns: typeof candidateColumns.rows,
    name: string,
    sql: string
  ) {
    const exists = columns.some((row) => String((row as Record<string, unknown>).name) === name);
    if (!exists) {
      await db.execute(sql);
    }
  }

  await addColumnIfMissing(
    'candidates',
    candidateColumns.rows,
    'role_applied',
    `ALTER TABLE candidates ADD COLUMN role_applied TEXT NOT NULL DEFAULT 'GIS Analyst / GIS Engineer'`
  );
  await addColumnIfMissing('candidates', candidateColumns.rows, 'metadata_json', `ALTER TABLE candidates ADD COLUMN metadata_json TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'score_status', `ALTER TABLE candidates ADD COLUMN score_status TEXT NOT NULL DEFAULT 'missing'`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'cv_pdf_base64', `ALTER TABLE candidates ADD COLUMN cv_pdf_base64 TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'cv_file_name', `ALTER TABLE candidates ADD COLUMN cv_file_name TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'assignment_text', `ALTER TABLE candidates ADD COLUMN assignment_text TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'assignment_summary', `ALTER TABLE candidates ADD COLUMN assignment_summary TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'assignment_pdf_base64', `ALTER TABLE candidates ADD COLUMN assignment_pdf_base64 TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'assignment_file_name', `ALTER TABLE candidates ADD COLUMN assignment_file_name TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'assignment_links_json', `ALTER TABLE candidates ADD COLUMN assignment_links_json TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'next_round_questions', `ALTER TABLE candidates ADD COLUMN next_round_questions TEXT`);
  await addColumnIfMissing('candidates', candidateColumns.rows, 'recommendation', `ALTER TABLE candidates ADD COLUMN recommendation TEXT`);
  await addColumnIfMissing(
    'candidates',
    candidateColumns.rows,
    'transcript_quality_status',
    `ALTER TABLE candidates ADD COLUMN transcript_quality_status TEXT NOT NULL DEFAULT 'missing'`
  );
  await addColumnIfMissing(
    'candidates',
    candidateColumns.rows,
    'updated_at',
    `ALTER TABLE candidates ADD COLUMN updated_at DATETIME`
  );

  await addColumnIfMissing('interviews', interviewColumns.rows, 'feedback_json', `ALTER TABLE interviews ADD COLUMN feedback_json TEXT`);
  await addColumnIfMissing('interviews', interviewColumns.rows, 'duration', `ALTER TABLE interviews ADD COLUMN duration INTEGER`);
  await addColumnIfMissing('interviews', interviewColumns.rows, 'transcript_quality_score', `ALTER TABLE interviews ADD COLUMN transcript_quality_score INTEGER`);
  await addColumnIfMissing(
    'interviews',
    interviewColumns.rows,
    'transcript_quality_status',
    `ALTER TABLE interviews ADD COLUMN transcript_quality_status TEXT NOT NULL DEFAULT 'missing'`
  );
  await addColumnIfMissing('interviews', interviewColumns.rows, 'rubric_json', `ALTER TABLE interviews ADD COLUMN rubric_json TEXT`);

  if (webhookColumns.rows.length === 0) {
    await db.execute(
      `CREATE TABLE IF NOT EXISTS webhook_events (
        id TEXT PRIMARY KEY,
        candidate_id TEXT,
        conversation_id TEXT,
        payload_json TEXT NOT NULL,
        event_type TEXT,
        processing_status TEXT NOT NULL DEFAULT 'received',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`
    );
  }

  const hasCompany = responseColumns.rows.some((row) => String((row as Record<string, unknown>).name) === 'company');
  if (responseColumns.rows.length > 0 && !hasCompany) {
    await db.execute(`ALTER TABLE responses ADD COLUMN company TEXT NOT NULL DEFAULT ''`);
  }

  await addColumnIfMissing(
    'gmat_attempts',
    gmatAttemptColumns.rows,
    'strategy_used',
    `ALTER TABLE gmat_attempts ADD COLUMN strategy_used TEXT`
  );
  await addColumnIfMissing(
    'gmat_attempts',
    gmatAttemptColumns.rows,
    'confidence',
    `ALTER TABLE gmat_attempts ADD COLUMN confidence TEXT`
  );

  await db.execute(
    `UPDATE candidates
     SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
     WHERE updated_at IS NULL`
  );

  await db.execute(
    `UPDATE candidates
     SET score_status = 'computed',
         recommendation = COALESCE(recommendation, 'manual_review')
     WHERE ai_score IS NOT NULL
       AND (score_status IS NULL OR score_status = 'missing')`
  );
}

async function seedGmatQuestions() {
  await db.batch(
    GMAT_SEED_QUESTIONS.map((question) => ({
      sql: `INSERT INTO gmat_questions (
        id, topic, subtopic, difficulty, prompt, stem, choices_json, correct_answer,
        recommended_time_seconds, concepts_json, strategy_tags_json, trap_type, pattern_type,
        standard_solution_json, alternative_methods_json, top_scorer_notice, common_trap, time_saving_insight
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        topic = excluded.topic,
        subtopic = excluded.subtopic,
        difficulty = excluded.difficulty,
        prompt = excluded.prompt,
        stem = excluded.stem,
        choices_json = excluded.choices_json,
        correct_answer = excluded.correct_answer,
        recommended_time_seconds = excluded.recommended_time_seconds,
        concepts_json = excluded.concepts_json,
        strategy_tags_json = excluded.strategy_tags_json,
        trap_type = excluded.trap_type,
        pattern_type = excluded.pattern_type,
        standard_solution_json = excluded.standard_solution_json,
        alternative_methods_json = excluded.alternative_methods_json,
        top_scorer_notice = excluded.top_scorer_notice,
        common_trap = excluded.common_trap,
        time_saving_insight = excluded.time_saving_insight`,
      args: [
        question.id,
        question.topic,
        question.subtopic,
        question.difficulty,
        question.prompt,
        question.stem,
        JSON.stringify(question.choices),
        question.correctAnswer,
        question.recommendedTimeSeconds,
        JSON.stringify(question.concepts),
        JSON.stringify(question.strategyTags),
        question.trapType,
        question.patternType,
        JSON.stringify(question.standardSolution),
        JSON.stringify(question.alternativeMethods),
        question.topScorerNotice,
        question.commonTrap,
        question.timeSavingInsight
      ]
    })),
    'write'
  );
}

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseNextRoundQuestions(value: string | null | undefined): NextRoundQuestion[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        question: String((item as Record<string, unknown>).question ?? '').trim(),
        why_skylark: String((item as Record<string, unknown>).why_skylark ?? '').trim(),
        expected_outcome: String((item as Record<string, unknown>).expected_outcome ?? '').trim(),
        evidence_gap: String(
          (item as Record<string, unknown>).evidence_gap ??
            (item as Record<string, unknown>).evidence ??
            ''
        ).trim()
      }))
      .filter((item) => item.question && item.why_skylark && item.expected_outcome && item.evidence_gap)
      .slice(0, 7);
  } catch {
    return [];
  }
}

function parseJsonArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function mapGmatQuestion(row: Record<string, unknown>): GmatQuestion {
  return {
    id: String(row.id),
    topic: String(row.topic) as GmatTopic,
    subtopic: String(row.subtopic) as GmatSubtopic,
    difficulty: String(row.difficulty) as GmatQuestion['difficulty'],
    prompt: String(row.prompt),
    stem: String(row.stem),
    choices: parseJsonArray<string>((row.choices_json as string | null) ?? null),
    correctAnswer: String(row.correct_answer),
    recommendedTimeSeconds: Number(row.recommended_time_seconds ?? 0),
    concepts: parseJsonArray<string>((row.concepts_json as string | null) ?? null),
    strategyTags: parseJsonArray<string>((row.strategy_tags_json as string | null) ?? null),
    trapType: String(row.trap_type),
    patternType: String(row.pattern_type),
    standardSolution: parseJsonArray<string>((row.standard_solution_json as string | null) ?? null),
    alternativeMethods: parseJsonArray<GmatQuestion['alternativeMethods'][number]>(
      (row.alternative_methods_json as string | null) ?? null
    ),
    topScorerNotice: String(row.top_scorer_notice),
    commonTrap: String(row.common_trap),
    timeSavingInsight: String(row.time_saving_insight)
  };
}

type GmatAttemptQuestionContext = {
  id: string;
  topic: GmatTopic;
  subtopic: GmatSubtopic;
  correctAnswer: string;
  recommendedTimeSeconds: number;
  strategyTags: string[];
};

function mapGmatAttemptQuestionContext(row: Record<string, unknown>): GmatAttemptQuestionContext {
  return {
    id: String(row.id),
    topic: String(row.topic) as GmatTopic,
    subtopic: String(row.subtopic) as GmatSubtopic,
    correctAnswer: String(row.correct_answer),
    recommendedTimeSeconds: Number(row.recommended_time_seconds ?? 0),
    strategyTags: parseJsonArray<string>((row.strategy_tags_json as string | null) ?? null)
  };
}

function mapGmatLearner(row: Record<string, unknown>): GmatLearner {
  return {
    id: String(row.id),
    targetScore: Number(row.target_score),
    strengths: parseJsonArray<string>((row.strengths_json as string | null) ?? null),
    weeklyHours: Number(row.weekly_hours),
    createdAt: String(row.created_at)
  };
}

function mapGmatAttempt(row: Record<string, unknown>): GmatAttempt {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    questionId: String(row.question_id),
    selectedAnswer: String(row.selected_answer),
    isCorrect: Number(row.is_correct) === 1,
    timeTakenSeconds: Number(row.time_taken_seconds),
    strategyUsed: ((row.strategy_used as GmatStrategyInput | null) ?? null),
    confidence: ((row.confidence as GmatConfidence | null) ?? null),
    createdAt: String(row.created_at)
  };
}

type AttemptHistoryRow = {
  correct: boolean;
  timeTakenSeconds: number;
  idealTimeSeconds: number;
  topic: string;
  selectedStrategy: GmatStrategyInput;
};

type EncouragementHistoryRow = {
  triggerType: string;
  messageText: string;
};

function mapAttemptHistoryRows(rows: Array<Record<string, unknown>>): AttemptHistoryRow[] {
  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      correct: Number(record.correct ?? 0) === 1,
      timeTakenSeconds: Number(record.time_taken_seconds ?? 0),
      idealTimeSeconds: Number(record.ideal_time_seconds ?? 0),
      topic: String(record.topic ?? ''),
      selectedStrategy: ((record.selected_strategy as GmatStrategyInput | null) ?? null)
    } satisfies AttemptHistoryRow;
  });
}

function mapEncouragementHistoryRows(rows: Array<Record<string, unknown>>): EncouragementHistoryRow[] {
  return rows.map((row) => {
    const record = row as Record<string, unknown>;
    return {
      triggerType: String(record.trigger_type ?? ''),
      messageText: String(record.message_text ?? '')
    } satisfies EncouragementHistoryRow;
  });
}

function deriveEncouragementFlags(input: {
  isCorrect: boolean;
  timeTakenSeconds: number;
  idealTimeSeconds: number;
  confidence: GmatConfidence;
  strategyUsed: GmatStrategyInput;
  topic: string;
  attemptHistory: AttemptHistoryRow[];
  attemptsSinceRareSignature: number;
}): EncouragementDerivedFlags {
  const ideal = Math.max(1, input.idealTimeSeconds);
  const currentPaceRatio = input.timeTakenSeconds / ideal;
  const isFastCorrect = input.isCorrect && currentPaceRatio <= 0.8;
  const isSlowCorrect = input.isCorrect && currentPaceRatio > 1.2;

  const recentSameTopic = input.attemptHistory.filter((row) => row.topic === input.topic).slice(0, 5);
  const lastSameTopic = recentSameTopic[0];
  const lastUsedWeakStrategy = lastSameTopic?.selectedStrategy === 'guess' || lastSameTopic?.selectedStrategy === 'other';
  const currentUsesIntentionalStrategy = !!input.strategyUsed && input.strategyUsed !== 'guess' && input.strategyUsed !== 'other';
  const isStrategyImprovement =
    currentUsesIntentionalStrategy &&
    !!lastSameTopic &&
    (lastUsedWeakStrategy || lastSameTopic.timeTakenSeconds > Math.max(1, lastSameTopic.idealTimeSeconds) * 1.25);

  const baselineTopicHistory = recentSameTopic.slice(0, 3);
  const hadRecentMiss = baselineTopicHistory.some((row) => !row.correct);
  const previousPaceAverage =
    baselineTopicHistory.reduce((total, row) => total + row.timeTakenSeconds / Math.max(1, row.idealTimeSeconds), 0) /
    Math.max(1, baselineTopicHistory.length);
  const hasPaceLift = baselineTopicHistory.length > 0 && currentPaceRatio <= previousPaceAverage * 0.9;
  const isTopicImproving = baselineTopicHistory.length > 0 && ((input.isCorrect && hadRecentMiss) || hasPaceLift);

  const isIncorrectClose =
    !input.isCorrect &&
    (Math.abs(input.timeTakenSeconds - ideal) <= Math.round(ideal * 0.35) ||
      input.confidence === 'high' ||
      input.confidence === 'medium');

  return {
    isFastCorrect,
    isSlowCorrect,
    isStrategyImprovement,
    isTopicImproving,
    isIncorrectClose,
    attemptsSinceRareSignature: input.attemptsSinceRareSignature
  };
}

function mapCandidate(row: Record<string, unknown>): Candidate {
  const rawStatus = (row.score_status as string | null) ?? null;
  const hasScore = row.ai_score !== null && row.ai_score !== undefined;
  const derivedScoreStatus: ScoreStatus =
    rawStatus === 'error'
      ? 'error'
      : hasScore
        ? 'computed'
        : rawStatus === 'missing' || rawStatus === 'computed'
          ? rawStatus
          : 'missing';
  const transcriptQualityStatus = (() => {
    const raw = String(row.transcript_quality_status ?? 'missing');
    if (raw === 'partial' || raw === 'usable' || raw === 'final') return raw;
    return 'missing';
  })() as TranscriptQualityStatus;

  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    role_applied: String(row.role_applied ?? 'GIS Analyst / GIS Engineer'),
    cv_text: (row.cv_text as string | null) ?? null,
    cv_summary: (row.cv_summary as string | null) ?? null,
    cv_file_name: (row.cv_file_name as string | null) ?? null,
    assignment_text: (row.assignment_text as string | null) ?? null,
    assignment_summary: (row.assignment_summary as string | null) ?? null,
    assignment_file_name: (row.assignment_file_name as string | null) ?? null,
    assignment_links: parseStringArray((row.assignment_links_json as string | null) ?? null),
    next_round_questions: parseNextRoundQuestions((row.next_round_questions as string | null) ?? null),
    status: String(row.status) as CandidateStatus,
    ai_score: row.ai_score === null ? null : Number(row.ai_score),
    score_status: derivedScoreStatus,
    recommendation: (row.recommendation as Recommendation | null) ?? null,
    transcript_quality_status: transcriptQualityStatus,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at ?? row.created_at)
  };
}

function mapInterview(row: Record<string, unknown>): Interview {
  return {
    id: String(row.id),
    candidate_id: String(row.candidate_id),
    transcript: (row.transcript as string | null) ?? null,
    duration: row.duration === null || row.duration === undefined ? null : Number(row.duration),
    transcript_quality_score:
      row.transcript_quality_score === null || row.transcript_quality_score === undefined
        ? null
        : Number(row.transcript_quality_score),
    transcript_quality_status: (() => {
      const raw = String(row.transcript_quality_status ?? 'missing');
      if (raw === 'partial' || raw === 'usable' || raw === 'final') return raw;
      return 'missing';
    })(),
    agent_summary: (row.agent_summary as string | null) ?? null,
    feedback_json: (row.feedback_json as string | null) ?? null,
    rubric_json: (row.rubric_json as string | null) ?? null,
    audio_url: (row.audio_url as string | null) ?? null,
    created_at: String(row.created_at)
  };
}

function parseStringJsonArray(value: unknown) {
  try {
    const parsed = JSON.parse(String(value ?? '[]')) as unknown;
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function mapAssessment(row: Record<string, unknown>): AssessmentRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    company: String(row.company ?? ''),
    email: decryptValue(String(row.email_encrypted ?? '')),
    role: String(row.role),
    company_size: String(row.company_size),
    coworking_space: String(row.coworking_space ?? ''),
    city: String(row.city ?? ''),
    payment_methods: parseStringJsonArray(row.payment_methods),
    reimbursement_volume: String(row.reimbursement_volume),
    claim_method: String(row.claim_method),
    reimbursement_time: String(row.reimbursement_time),
    petty_cash: String(row.petty_cash),
    petty_cash_manager: String(row.petty_cash_manager ?? ''),
    pain_points: parseStringJsonArray(row.pain_points),
    audit_difficulty: String(row.audit_difficulty),
    upi_wallet_interest: String(row.upi_wallet_interest),
    demo_interest: String(row.demo_interest),
    expense_score: Number(row.expense_score),
    lead_score: Number(row.lead_score),
    lead_classification: String(row.lead_classification) as AssessmentRecord['lead_classification'],
    result_summary: String(row.result_summary),
    created_at: String(row.created_at)
  };
}

export async function createCandidate(input: {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  metadataJson?: string | null;
}) {
  await ensureSchema();
  await db.execute({
    sql: `INSERT INTO candidates (id, name, email, role_applied, metadata_json, status, score_status, transcript_quality_status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [input.id, input.name, input.email, input.roleApplied, input.metadataJson ?? null, 'pending', 'missing', 'missing']
  });
}

export async function updateCandidateCV(
  candidateId: string,
  cvText: string,
  cvSummary: string,
  cvPdfBase64?: string,
  cvFileName?: string
) {
  await ensureSchema();
  await db.execute({
    sql: `UPDATE candidates
          SET cv_text = ?,
              cv_summary = ?,
              cv_pdf_base64 = COALESCE(?, cv_pdf_base64),
              cv_file_name = COALESCE(?, cv_file_name),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [cvText, cvSummary, cvPdfBase64 ?? null, cvFileName ?? null, candidateId]
  });
}

export async function updateCandidateAssignment(input: {
  candidateId: string;
  assignmentText: string | null;
  assignmentSummary: string;
  assignmentPdfBase64?: string | null;
  assignmentFileName?: string | null;
  assignmentLinks?: string[];
}) {
  await ensureSchema();
  await db.execute({
    sql: `UPDATE candidates
          SET assignment_text = ?,
              assignment_summary = ?,
              assignment_pdf_base64 = COALESCE(?, assignment_pdf_base64),
              assignment_file_name = COALESCE(?, assignment_file_name),
              assignment_links_json = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [
      input.assignmentText,
      input.assignmentSummary,
      input.assignmentPdfBase64 ?? null,
      input.assignmentFileName ?? null,
      JSON.stringify((input.assignmentLinks ?? []).filter(Boolean)),
      input.candidateId
    ]
  });
}

export async function updateCandidateNextRoundQuestions(candidateId: string, questions: NextRoundQuestion[]) {
  await ensureSchema();
  await db.execute({
    sql: `UPDATE candidates
          SET next_round_questions = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [JSON.stringify(questions.slice(0, 7)), candidateId]
  });
}

export async function updateCandidateStatus(candidateId: string, status: CandidateStatus) {
  await ensureSchema();
  await db.execute({
    sql: 'UPDATE candidates SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    args: [status, candidateId]
  });
}

export async function updateCandidateEvaluation(candidateId: string, feedback: InterviewFeedback) {
  await ensureSchema();
  await db.execute({
    sql: `UPDATE candidates
          SET ai_score = ?,
              recommendation = ?,
              score_status = ?,
              status = 'completed',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [feedback.overall_score, feedback.recommendation, feedback.score_status, candidateId]
  });
}

export async function updateCandidateScoreStatus(
  candidateId: string,
  scoreStatus: ScoreStatus,
  transcriptQualityStatus: TranscriptQualityStatus = 'missing'
) {
  await ensureSchema();
  await db.execute({
    sql: `UPDATE candidates
          SET ai_score = NULL,
              recommendation = CASE
                WHEN recommendation IS NULL AND ? != 'computed' THEN 'manual_review'
                ELSE recommendation
              END,
              score_status = ?,
              transcript_quality_status = ?,
              status = 'completed',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [scoreStatus, scoreStatus, transcriptQualityStatus, candidateId]
  });
}

export async function updateCandidateTranscriptQuality(candidateId: string, transcriptQualityStatus: TranscriptQualityStatus) {
  await ensureSchema();
  await db.execute({
    sql: `UPDATE candidates
          SET transcript_quality_status = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [transcriptQualityStatus, candidateId]
  });
}

export async function upsertInterview(input: {
  id: string;
  candidateId: string;
  transcript: string;
  duration: number | null;
  transcriptQualityScore: number | null;
  transcriptQualityStatus: TranscriptQualityStatus;
  agentSummary: string;
  feedbackJson: InterviewFeedback | null;
  audioUrl: string | null;
}) {
  await ensureSchema();
  await db.execute({
    sql: `INSERT INTO interviews (
        id, candidate_id, transcript, duration, transcript_quality_score, transcript_quality_status,
        agent_summary, feedback_json, rubric_json, audio_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
      transcript = CASE
        WHEN LENGTH(TRIM(COALESCE(excluded.transcript, ''))) > LENGTH(TRIM(COALESCE(interviews.transcript, '')))
        THEN excluded.transcript
        ELSE interviews.transcript
      END,
      duration = COALESCE(excluded.duration, interviews.duration),
      transcript_quality_score = CASE
        WHEN COALESCE(excluded.transcript_quality_score, 0) >= COALESCE(interviews.transcript_quality_score, 0)
        THEN excluded.transcript_quality_score
        ELSE interviews.transcript_quality_score
      END,
      transcript_quality_status = CASE
        WHEN LENGTH(TRIM(COALESCE(excluded.transcript, ''))) > LENGTH(TRIM(COALESCE(interviews.transcript, '')))
        THEN excluded.transcript_quality_status
        ELSE interviews.transcript_quality_status
      END,
      agent_summary = CASE
        WHEN LENGTH(TRIM(COALESCE(excluded.transcript, ''))) > LENGTH(TRIM(COALESCE(interviews.transcript, '')))
        THEN excluded.agent_summary
        ELSE COALESCE(interviews.agent_summary, excluded.agent_summary)
      END,
      feedback_json = CASE
        WHEN excluded.feedback_json IS NOT NULL
         AND LENGTH(TRIM(COALESCE(excluded.transcript, ''))) >= LENGTH(TRIM(COALESCE(interviews.transcript, '')))
        THEN excluded.feedback_json
        ELSE interviews.feedback_json
      END,
      rubric_json = CASE
        WHEN excluded.rubric_json IS NOT NULL
         AND LENGTH(TRIM(COALESCE(excluded.transcript, ''))) >= LENGTH(TRIM(COALESCE(interviews.transcript, '')))
        THEN excluded.rubric_json
        ELSE interviews.rubric_json
      END,
      audio_url = COALESCE(NULLIF(TRIM(excluded.audio_url), ''), interviews.audio_url)`,
    args: [
      input.id,
      input.candidateId,
      input.transcript,
      input.duration,
      input.transcriptQualityScore,
      input.transcriptQualityStatus,
      input.agentSummary,
      input.feedbackJson ? JSON.stringify(input.feedbackJson) : null,
      input.feedbackJson ? JSON.stringify(input.feedbackJson.rubric) : null,
      input.audioUrl
    ]
  });
}

export async function createWebhookEvent(input: {
  id: string;
  candidateId: string | null;
  conversationId: string | null;
  payloadJson: string;
  eventType: string | null;
  processingStatus?: string;
}) {
  await ensureSchema();
  await db.execute({
    sql: `INSERT OR IGNORE INTO webhook_events
          (id, candidate_id, conversation_id, payload_json, event_type, processing_status)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [
      input.id,
      input.candidateId,
      input.conversationId,
      input.payloadJson,
      input.eventType,
      input.processingStatus ?? 'received'
    ]
  });
}

export async function updateWebhookEventStatus(id: string, processingStatus: string) {
  await ensureSchema();
  await db.execute({
    sql: 'UPDATE webhook_events SET processing_status = ? WHERE id = ?',
    args: [processingStatus, id]
  });
}

export async function getInterviewById(id: string): Promise<Interview | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM interviews WHERE id = ? LIMIT 1',
    args: [id]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapInterview(row) : null;
}

export async function updateInterviewAudioUrl(interviewId: string, audioUrl: string): Promise<void> {
  await ensureSchema();
  await db.execute({
    sql: 'UPDATE interviews SET audio_url = ? WHERE id = ?',
    args: [audioUrl, interviewId]
  });
}

export async function listInterviewsMissingAudio(): Promise<Array<{ id: string; candidate_id: string }>> {
  await ensureSchema();
  const result = await db.execute(
    `SELECT id, candidate_id
     FROM interviews
     WHERE (audio_url IS NULL OR TRIM(audio_url) = '')
     ORDER BY created_at DESC`
  );
  return result.rows.map((row) => ({
    id: String((row as Record<string, unknown>).id),
    candidate_id: String((row as Record<string, unknown>).candidate_id)
  }));
}

export async function listAllInterviews(): Promise<Array<{ id: string; candidate_id: string; transcript: string | null }>> {
  await ensureSchema();
  const result = await db.execute(
    `SELECT id, candidate_id, transcript
     FROM interviews
     ORDER BY created_at DESC`
  );
  return result.rows.map((row) => ({
    id: String((row as Record<string, unknown>).id),
    candidate_id: String((row as Record<string, unknown>).candidate_id),
    transcript: ((row as Record<string, unknown>).transcript as string | null) ?? null
  }));
}

export async function updateInterviewTranscriptIfLonger(interviewId: string, transcript: string): Promise<boolean> {
  await ensureSchema();
  const next = transcript.trim();
  if (!next) return false;
  const updated = await db.execute({
    sql: `UPDATE interviews
          SET transcript = ?
          WHERE id = ?
            AND LENGTH(TRIM(COALESCE(?, ''))) > LENGTH(TRIM(COALESCE(transcript, '')))`,
    args: [next, interviewId, next]
  });
  return Number(updated.rowsAffected ?? 0) > 0;
}

export async function getCandidateById(id: string): Promise<CandidateWithInterview | null> {
  await ensureSchema();
  const candidateResult = await db.execute({
    sql: 'SELECT * FROM candidates WHERE id = ? LIMIT 1',
    args: [id]
  });
  const candidateRow = candidateResult.rows[0] as Record<string, unknown> | undefined;
  if (!candidateRow) return null;

  const interviewResult = await db.execute({
    sql: `SELECT *
          FROM interviews
          WHERE candidate_id = ?
          ORDER BY
            CASE
              WHEN id LIKE 'conv_%' THEN 0
              WHEN id LIKE 'call_%' THEN 0
              ELSE 1
            END,
            created_at DESC
          LIMIT 1`,
    args: [id]
  });
  const interviewRow = interviewResult.rows[0] as Record<string, unknown> | undefined;

  return {
    ...mapCandidate(candidateRow),
    interview: interviewRow ? mapInterview(interviewRow) : null
  };
}

export async function getCandidateByEmail(email: string): Promise<CandidateWithInterview | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT id FROM candidates WHERE LOWER(email) = LOWER(?) ORDER BY created_at DESC LIMIT 1',
    args: [email]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  return getCandidateById(String(row.id));
}

export async function getCandidateCVFile(id: string): Promise<{ fileName: string; base64: string } | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT cv_file_name, cv_pdf_base64 FROM candidates WHERE id = ? LIMIT 1',
    args: [id]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const base64 = (row.cv_pdf_base64 as string | null) ?? null;
  if (!base64) return null;
  return {
    fileName: ((row.cv_file_name as string | null) ?? 'candidate-cv.pdf').trim() || 'candidate-cv.pdf',
    base64
  };
}

export async function getCandidateAssignmentFile(id: string): Promise<{ fileName: string; base64: string } | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT assignment_file_name, assignment_pdf_base64 FROM candidates WHERE id = ? LIMIT 1',
    args: [id]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;
  const base64 = (row.assignment_pdf_base64 as string | null) ?? null;
  if (!base64) return null;
  return {
    fileName: ((row.assignment_file_name as string | null) ?? 'candidate-assignment.pdf').trim() || 'candidate-assignment.pdf',
    base64
  };
}

export async function listCandidates(): Promise<Candidate[]> {
  await ensureSchema();
  const result = await db.execute('SELECT * FROM candidates ORDER BY created_at DESC');
  return result.rows.map((row) => mapCandidate(row as Record<string, unknown>));
}

export async function deleteCandidateCascade(id: string): Promise<void> {
  await ensureSchema();
  await db.batch(
    [
      { sql: 'DELETE FROM webhook_events WHERE candidate_id = ?', args: [id] },
      { sql: 'DELETE FROM interviews WHERE candidate_id = ?', args: [id] },
      { sql: 'DELETE FROM candidates WHERE id = ?', args: [id] }
    ],
    'write'
  );
}

export async function createAssessmentResponse(input: AssessmentSubmission & { id: string }): Promise<AssessmentRecord> {
  await ensureSchema();
  const created_at = new Date().toISOString();
  const record = buildAssessmentRecord({ ...input, id: input.id, created_at });

  await db.execute({
    sql: `INSERT INTO responses (
      id, name, company, email_encrypted, role, company_size, coworking_space, city, payment_methods,
      reimbursement_volume, claim_method, reimbursement_time, petty_cash, petty_cash_manager, pain_points,
      audit_difficulty, upi_wallet_interest, demo_interest, expense_score, lead_score, lead_classification,
      result_summary, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      record.id,
      record.name,
      record.company,
      encryptValue(record.email),
      record.role,
      record.company_size,
      record.coworking_space,
      record.city,
      JSON.stringify(record.payment_methods),
      record.reimbursement_volume,
      record.claim_method,
      record.reimbursement_time,
      record.petty_cash,
      record.petty_cash_manager,
      JSON.stringify(record.pain_points),
      record.audit_difficulty,
      record.upi_wallet_interest,
      record.demo_interest,
      record.expense_score,
      record.lead_score,
      record.lead_classification,
      record.result_summary,
      record.created_at
    ]
  });

  return record;
}

export async function getAssessmentResponseById(id: string): Promise<AssessmentRecord | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM responses WHERE id = ? LIMIT 1',
    args: [id]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapAssessment(row) : null;
}

export async function listAssessmentResponses(): Promise<AssessmentRecord[]> {
  await ensureSchema();
  const result = await db.execute('SELECT * FROM responses ORDER BY created_at DESC');
  return result.rows.map((row) => mapAssessment(row as Record<string, unknown>));
}

export async function createGmatLearner(input: {
  targetScore: number;
  strengths: string[];
  weeklyHours: number;
}): Promise<GmatLearner> {
  await ensureSchema();
  const id = uuidv4();
  await db.execute({
    sql: `INSERT INTO gmat_users (id, target_score, strengths_json, weekly_hours)
          VALUES (?, ?, ?, ?)`,
    args: [id, input.targetScore, JSON.stringify(input.strengths), input.weeklyHours]
  });

  const learner = await getGmatLearnerById(id);
  if (!learner) {
    throw new Error('Failed to create GMAT learner');
  }
  return learner;
}

export async function getGmatLearnerById(id: string): Promise<GmatLearner | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM gmat_users WHERE id = ? LIMIT 1',
    args: [id]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapGmatLearner(row) : null;
}

export async function ensureGmatLearner(userId: string): Promise<void> {
  await ensureSchema();
  await db.execute({
    sql: `INSERT OR IGNORE INTO gmat_users (id, target_score, strengths_json, weekly_hours)
          VALUES (?, ?, ?, ?)`,
    args: [userId, 675, JSON.stringify(['Critical Reasoning']), 6]
  });
}

export async function listGmatTopics(): Promise<Array<{ topic: GmatTopic; subtopics: GmatSubtopic[] }>> {
  await ensureSchema();
  const result = await db.execute('SELECT topic, subtopic FROM gmat_questions ORDER BY topic, subtopic');
  const byTopic = new Map<GmatTopic, Set<GmatSubtopic>>();

  result.rows.forEach((row) => {
    const record = row as Record<string, unknown>;
    const topic = String(record.topic) as GmatTopic;
    const subtopic = String(record.subtopic) as GmatSubtopic;
    const current = byTopic.get(topic) ?? new Set<GmatSubtopic>();
    current.add(subtopic);
    byTopic.set(topic, current);
  });

  return Array.from(byTopic.entries()).map(([topic, subtopics]) => ({
    topic,
    subtopics: Array.from(subtopics)
  }));
}

export async function listGmatQuestionsByTopic(topic?: string): Promise<GmatQuestion[]> {
  await ensureSchema();
  const result = topic
    ? await db.execute({
        sql: 'SELECT * FROM gmat_questions WHERE topic = ? ORDER BY subtopic, difficulty',
        args: [topic]
      })
    : await db.execute('SELECT * FROM gmat_questions ORDER BY topic, subtopic, difficulty');
  return result.rows.map((row) => mapGmatQuestion(row as Record<string, unknown>));
}

export async function getGmatQuestionCountByTopic(topic: GmatTopic): Promise<number> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT COUNT(*) AS count FROM gmat_questions WHERE topic = ?',
    args: [topic]
  });
  return Number((result.rows[0] as Record<string, unknown> | undefined)?.count ?? 0);
}

export async function getGmatQuestionCountBySubtopic(topic: GmatTopic, subtopic: string): Promise<number> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT COUNT(*) AS count FROM gmat_questions WHERE topic = ? AND subtopic = ?',
    args: [topic, subtopic]
  });
  return Number((result.rows[0] as Record<string, unknown> | undefined)?.count ?? 0);
}

export async function getGmatQuestionById(id: string): Promise<GmatQuestion | null> {
  await ensureSchema();
  const result = await db.execute({
    sql: 'SELECT * FROM gmat_questions WHERE id = ? LIMIT 1',
    args: [id]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapGmatQuestion(row) : null;
}

function slugifyTopicPart(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function normalizeQuestionStem(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isValidGmatTopic(value: string): value is GmatTopic {
  return value === 'Quant' || value === 'Verbal' || value === 'Data Insights';
}

export async function generateAndStoreGmatQuestions(input: {
  topic: GmatTopic;
  subtopic: string;
  count?: number;
}): Promise<number> {
  await ensureSchema();
  const count = Math.max(1, Math.min(10, Math.round(input.count ?? 5)));
  const existingResult = await db.execute({
    sql: `SELECT stem
          FROM gmat_questions
          WHERE topic = ?
            AND subtopic = ?
          ORDER BY rowid DESC
          LIMIT 500`,
    args: [input.topic, input.subtopic]
  });
  const seenStemKeys = new Set(
    existingResult.rows
      .map((row) => String((row as Record<string, unknown>).stem ?? ''))
      .map((stem) => normalizeQuestionStem(stem))
      .filter(Boolean)
  );

  let generated: Awaited<ReturnType<typeof generateGmatQuestions>> = [];
  let remaining = count;
  let attempts = 0;

  while (remaining > 0 && attempts < 3) {
    attempts += 1;
    let batch: Awaited<ReturnType<typeof generateGmatQuestions>> = [];
    try {
      batch = await generateGmatQuestions({
        topic: input.topic,
        subtopic: input.subtopic,
        count: remaining
      });
    } catch {
      break;
    }
    if (batch.length === 0) break;

    for (const question of batch) {
      const key = normalizeQuestionStem(question.stem);
      if (!key || seenStemKeys.has(key)) continue;
      seenStemKeys.add(key);
      generated.push(question);
      remaining -= 1;
      if (remaining <= 0) break;
    }
  }

  if (generated.length === 0) return 0;

  const topicPart = slugifyTopicPart(input.topic);
  const subtopicPart = slugifyTopicPart(input.subtopic);
  const createdBase = Date.now();

  await db.batch(
    generated.map((question, index) => ({
      sql: `INSERT OR IGNORE INTO gmat_questions (
          id, topic, subtopic, difficulty, prompt, stem, choices_json, correct_answer,
          recommended_time_seconds, concepts_json, strategy_tags_json, trap_type, pattern_type,
          standard_solution_json, alternative_methods_json, top_scorer_notice, common_trap, time_saving_insight
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        `llm-${topicPart}-${subtopicPart}-${createdBase}-${index}-${uuidv4().slice(0, 8)}`,
        question.topic,
        question.subtopic,
        question.difficulty,
        question.prompt,
        question.stem,
        JSON.stringify(question.choices),
        question.correctAnswer,
        question.recommendedTimeSeconds,
        JSON.stringify(question.concepts),
        JSON.stringify(question.strategyTags),
        question.trapType,
        question.patternType,
        JSON.stringify(question.standardSolution),
        JSON.stringify(question.alternativeMethods),
        question.topScorerNotice,
        question.commonTrap,
        question.timeSavingInsight
      ]
    })),
    'write'
  );

  return generated.length;
}

export async function ensureGmatQuestionPoolForUser(input: {
  userId: string;
  topic: GmatTopic;
  subtopic?: string;
  desiredCount: number;
}): Promise<number> {
  await ensureSchema();
  const desiredCount = Math.max(1, Math.min(50, Math.round(input.desiredCount)));
  const where: string[] = ['q.topic = ?', 'a.id IS NULL'];
  const queryArgs: Array<string | number> = [input.userId, input.topic];

  if (input.subtopic && input.subtopic.trim()) {
    where.push('q.subtopic = ?');
    queryArgs.push(input.subtopic.trim());
  }

  const availableResult = await db.execute({
    sql: `SELECT COUNT(*) AS count
          FROM gmat_questions q
          LEFT JOIN gmat_attempts a
            ON a.question_id = q.id
           AND a.user_id = ?
          WHERE ${where.join(' AND ')}`,
    args: queryArgs
  });
  const available = Number((availableResult.rows[0] as Record<string, unknown> | undefined)?.count ?? 0);
  let remaining = Math.max(0, desiredCount - available);
  if (remaining === 0) return 0;

  const generationSubtopic = input.subtopic?.trim() || 'General';
  let insertedTotal = 0;
  let safety = 0;

  while (remaining > 0 && safety < 8) {
    const inserted = await generateAndStoreGmatQuestions({
      topic: input.topic,
      subtopic: generationSubtopic,
      count: Math.min(10, remaining)
    });
    if (inserted === 0) break;
    insertedTotal += inserted;
    remaining -= inserted;
    safety += 1;
  }

  return insertedTotal;
}

export async function ensureMinimumQuestionsForAllTopics(minimumPerTopic = 50): Promise<Record<GmatTopic, number>> {
  await ensureSchema();
  const topics: GmatTopic[] = ['Quant', 'Verbal', 'Data Insights'];
  const target = Math.max(1, Math.min(500, Math.round(minimumPerTopic)));
  const counts: Record<GmatTopic, number> = {
    Quant: 0,
    Verbal: 0,
    'Data Insights': 0
  };

  for (const topic of topics) {
    let count = await getGmatQuestionCountByTopic(topic);
    const subtopics = (getTopicCatalog(topic)?.groups ?? []).flatMap((group) => group.items).filter(Boolean);

    if (subtopics.length === 0) {
      counts[topic] = count;
      continue;
    }

    let cursor = 0;
    let noInsertStreak = 0;
    const maxAttempts = Math.max(60, subtopics.length * 8);

    while (count < target && cursor < maxAttempts && noInsertStreak < subtopics.length * 2) {
      const subtopic = subtopics[cursor % subtopics.length];
      const needed = target - count;
      const inserted = await generateAndStoreGmatQuestions({
        topic,
        subtopic,
        count: Math.min(5, needed)
      });

      if (inserted > 0) {
        count += inserted;
        noInsertStreak = 0;
      } else {
        noInsertStreak += 1;
      }

      cursor += 1;
    }

    counts[topic] = count;
  }

  return counts;
}

export async function ensureMinimumQuestionsPerSubtopic(minimumPerSubtopic = 20): Promise<
  Array<{ topic: GmatTopic; subtopic: string; count: number }>
> {
  await ensureSchema();
  const target = Math.max(1, Math.min(200, Math.round(minimumPerSubtopic)));
  const topics: GmatTopic[] = ['Quant', 'Verbal', 'Data Insights'];
  const results: Array<{ topic: GmatTopic; subtopic: string; count: number }> = [];

  for (const topic of topics) {
    const subtopics = (getTopicCatalog(topic)?.groups ?? []).flatMap((group) => group.items).filter(Boolean);
    for (const subtopic of subtopics) {
      let count = await getGmatQuestionCountBySubtopic(topic, subtopic);
      let attempts = 0;
      const maxAttempts = 8;

      while (count < target && attempts < maxAttempts) {
        const need = target - count;
        const inserted = await generateAndStoreGmatQuestions({
          topic,
          subtopic,
          count: Math.min(5, need)
        });
        if (inserted === 0) break;
        count += inserted;
        attempts += 1;
      }

      results.push({ topic, subtopic, count });
    }
  }

  return results;
}

export async function getNextGmatQuestionForUser(
  userId: string,
  topic?: string,
  subtopic?: string,
  options?: { allowGeneration?: boolean }
): Promise<GmatQuestion | null> {
  await ensureSchema();
  const allowGeneration = options?.allowGeneration ?? true;
  if (topic && subtopic) {
    const subtopicResult = await db.execute({
      sql: `SELECT q.*
            FROM gmat_questions q
            LEFT JOIN gmat_attempts a
              ON a.question_id = q.id
             AND a.user_id = ?
            WHERE q.topic = ?
              AND q.subtopic = ?
              AND a.id IS NULL
            ORDER BY
              CASE q.difficulty
                WHEN 'Easy' THEN 1
                WHEN 'Medium' THEN 2
                ELSE 3
              END
            LIMIT 1`,
      args: [userId, topic, subtopic]
    });
    const subtopicRow = subtopicResult.rows[0] as Record<string, unknown> | undefined;
    if (subtopicRow) {
      return mapGmatQuestion(subtopicRow);
    }

    if (allowGeneration && isValidGmatTopic(topic)) {
      try {
        await generateAndStoreGmatQuestions({ topic, subtopic, count: 5 });
      } catch {
        // Fall through to broader topic/global fallback when generation is unavailable.
      }

      const regeneratedResult = await db.execute({
        sql: `SELECT q.*
              FROM gmat_questions q
              LEFT JOIN gmat_attempts a
                ON a.question_id = q.id
               AND a.user_id = ?
              WHERE q.topic = ?
                AND q.subtopic = ?
                AND a.id IS NULL
              ORDER BY
                CASE q.difficulty
                  WHEN 'Easy' THEN 1
                  WHEN 'Medium' THEN 2
                  ELSE 3
                END
              LIMIT 1`,
        args: [userId, topic, subtopic]
      });
      const regeneratedRow = regeneratedResult.rows[0] as Record<string, unknown> | undefined;
      if (regeneratedRow) {
        return mapGmatQuestion(regeneratedRow);
      }
    }
  }

  if (topic) {
    const topicResult = await db.execute({
      sql: `SELECT q.*
            FROM gmat_questions q
            LEFT JOIN gmat_attempts a
              ON a.question_id = q.id
             AND a.user_id = ?
            WHERE q.topic = ?
              AND a.id IS NULL
            ORDER BY
              CASE q.difficulty
                WHEN 'Easy' THEN 1
                WHEN 'Medium' THEN 2
                ELSE 3
              END,
              q.subtopic
            LIMIT 1`,
      args: [userId, topic]
    });
    const topicRow = topicResult.rows[0] as Record<string, unknown> | undefined;
    if (topicRow) {
      return mapGmatQuestion(topicRow);
    }
  }

  const fallbackResult = await db.execute({
    sql: `SELECT q.*
          FROM gmat_questions q
          LEFT JOIN gmat_attempts a
            ON a.question_id = q.id
           AND a.user_id = ?
          WHERE a.id IS NULL
          ORDER BY q.topic, q.subtopic
          LIMIT 1`,
    args: [userId]
  });
  const fallbackRow = fallbackResult.rows[0] as Record<string, unknown> | undefined;
  return fallbackRow ? mapGmatQuestion(fallbackRow) : null;
}

export async function getNextGmatQuestionForUserInSubtopics(input: {
  userId: string;
  topic: GmatTopic;
  subtopics: string[];
  allowGeneration?: boolean;
}): Promise<GmatQuestion | null> {
  await ensureSchema();
  const subtopics = input.subtopics.map((item) => item.trim()).filter(Boolean);
  if (subtopics.length === 0) return null;

  const placeholders = subtopics.map(() => '?').join(', ');
  const result = await db.execute({
    sql: `SELECT q.*
          FROM gmat_questions q
          LEFT JOIN gmat_attempts a
            ON a.question_id = q.id
           AND a.user_id = ?
          WHERE q.topic = ?
            AND q.subtopic IN (${placeholders})
            AND a.id IS NULL
          ORDER BY
            CASE q.difficulty
              WHEN 'Easy' THEN 1
              WHEN 'Medium' THEN 2
              ELSE 3
            END,
            q.subtopic
          LIMIT 1`,
    args: [input.userId, input.topic, ...subtopics]
  });
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return row ? mapGmatQuestion(row) : null;
}

export async function createGmatAttempt(input: {
  userId: string;
  questionId: string;
  selectedAnswer: string;
  timeTakenSeconds: number;
  strategyUsed: GmatStrategyInput;
  confidence: GmatConfidence;
}): Promise<GmatAttempt> {
  await ensureSchema();
  const batched = await db.batch(
    [
      {
        sql: `SELECT
                id,
                topic,
                subtopic,
                correct_answer,
                recommended_time_seconds,
                strategy_tags_json
              FROM gmat_questions
              WHERE id = ?
              LIMIT 1`,
        args: [input.questionId]
      },
      {
        sql: `SELECT
                correct,
                time_taken_seconds,
                ideal_time_seconds,
                topic,
                selected_strategy
              FROM attempts
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT 15`,
        args: [input.userId]
      },
      {
        sql: `SELECT trigger_type, message_text
              FROM encouragement_history
              WHERE user_id = ?
              ORDER BY shown_at DESC
              LIMIT 20`,
        args: [input.userId]
      }
    ],
    'read'
  );

  const questionRow = batched[0]?.rows?.[0] as Record<string, unknown> | undefined;
  const question = questionRow ? mapGmatAttemptQuestionContext(questionRow) : null;
  if (!question) {
    throw new Error('Question not found');
  }

  const id = uuidv4();
  const createdAt = new Date().toISOString();
  const isCorrect = input.selectedAnswer === question.correctAnswer;
  const normalizedTimeTaken = Math.max(1, Math.round(input.timeTakenSeconds));

  const recentAttemptHistory = mapAttemptHistoryRows(
    (batched[1]?.rows ?? []) as Array<Record<string, unknown>>
  );
  const recentEncouragement = mapEncouragementHistoryRows(
    (batched[2]?.rows ?? []) as Array<Record<string, unknown>>
  );

  const recentRareIndex = recentEncouragement.findIndex((entry) => entry.triggerType === 'rare_signature');
  const attemptsSinceRareSignature = recentRareIndex >= 0 ? recentRareIndex : Number.POSITIVE_INFINITY;
  const flags = deriveEncouragementFlags({
    isCorrect,
    timeTakenSeconds: normalizedTimeTaken,
    idealTimeSeconds: question.recommendedTimeSeconds,
    confidence: input.confidence,
    strategyUsed: input.strategyUsed,
    topic: question.topic,
    attemptHistory: recentAttemptHistory,
    attemptsSinceRareSignature
  });

  const encouragement: EncouragementPayload = selectEncouragement({
    isCorrect,
    flags,
    recentMessages: recentEncouragement.map((entry) => entry.messageText),
    totalAttempts: recentAttemptHistory.length + 1
  });

  await db.batch(
    [
      {
        sql: `INSERT INTO gmat_attempts (
                id, user_id, question_id, selected_answer, is_correct, time_taken_seconds, strategy_used, confidence, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          input.userId,
          input.questionId,
          input.selectedAnswer,
          isCorrect ? 1 : 0,
          normalizedTimeTaken,
          input.strategyUsed,
          input.confidence,
          createdAt
        ]
      },
      {
        sql: `INSERT INTO attempts (
                id, user_id, question_id, topic, subtopic, correct, time_taken_seconds, ideal_time_seconds,
                confidence_level, selected_strategy, inferred_strategy, chosen_answer, correct_answer,
                is_common_trap, created_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id,
          input.userId,
          input.questionId,
          question.topic,
          question.subtopic,
          isCorrect ? 1 : 0,
          normalizedTimeTaken,
          question.recommendedTimeSeconds,
          input.confidence,
          input.strategyUsed,
          question.strategyTags[0] ?? null,
          input.selectedAnswer,
          question.correctAnswer,
          0,
          createdAt
        ]
      },
      {
        sql: `INSERT INTO encouragement_history (
                id, user_id, attempt_id, trigger_type, message_text, shown_at
              ) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [uuidv4(), input.userId, id, encouragement.triggerType, encouragement.message, createdAt]
      }
    ],
    'write'
  );

  return {
    id,
    userId: input.userId,
    questionId: input.questionId,
    selectedAnswer: input.selectedAnswer,
    isCorrect,
    timeTakenSeconds: normalizedTimeTaken,
    strategyUsed: input.strategyUsed,
    confidence: input.confidence,
    createdAt,
    encouragement
  };
}

export async function listGmatAttemptsForUser(userId: string, filter?: 'incorrect' | 'slow' | 'slow_correct') {
  await ensureSchema();
  const where = [`a.user_id = ?`];
  const args: Array<string | number> = [userId];

  if (filter === 'incorrect') {
    where.push('a.is_correct = 0');
  } else if (filter === 'slow') {
    where.push('a.time_taken_seconds > q.recommended_time_seconds');
  } else if (filter === 'slow_correct') {
    where.push('a.is_correct = 1');
    where.push('a.time_taken_seconds > q.recommended_time_seconds');
  }

  const result = await db.execute({
    sql: `SELECT
            a.*,
            q.id AS q_id,
            q.topic,
            q.subtopic,
            q.difficulty,
            q.prompt,
            q.stem,
            q.choices_json,
            q.correct_answer,
            q.recommended_time_seconds,
            q.concepts_json,
            q.strategy_tags_json,
            q.trap_type,
            q.pattern_type,
            q.standard_solution_json,
            q.alternative_methods_json,
            q.top_scorer_notice,
            q.common_trap,
            q.time_saving_insight
          FROM gmat_attempts a
          JOIN gmat_questions q ON q.id = a.question_id
          WHERE ${where.join(' AND ')}
          ORDER BY a.created_at DESC`,
    args
  });

  return result.rows.map((row) => {
    const record = row as Record<string, unknown>;
    const question = mapGmatQuestion({
      id: record.q_id,
      topic: record.topic,
      subtopic: record.subtopic,
      difficulty: record.difficulty,
      prompt: record.prompt,
      stem: record.stem,
      choices_json: record.choices_json,
      correct_answer: record.correct_answer,
      recommended_time_seconds: record.recommended_time_seconds,
      concepts_json: record.concepts_json,
      strategy_tags_json: record.strategy_tags_json,
      trap_type: record.trap_type,
      pattern_type: record.pattern_type,
      standard_solution_json: record.standard_solution_json,
      alternative_methods_json: record.alternative_methods_json,
      top_scorer_notice: record.top_scorer_notice,
      common_trap: record.common_trap,
      time_saving_insight: record.time_saving_insight
    });

    return {
      ...mapGmatAttempt(record),
      question
    } satisfies GmatAttemptWithQuestion;
  });
}
