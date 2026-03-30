export type CandidateStatus = 'pending' | 'interviewing' | 'completed';
export type ScoreStatus = 'computed' | 'missing' | 'error';
export type TranscriptQualityStatus = 'missing' | 'partial' | 'usable' | 'final';
export type Recommendation =
  | 'strong_shortlist'
  | 'shortlist'
  | 'borderline'
  | 'reject'
  | 'manual_review';

export type RubricCriterion =
  | 'Geospatial fundamentals'
  | 'Workflow thinking'
  | 'Drone data understanding'
  | 'Problem solving'
  | 'Assignment depth'
  | 'AI usage quality'
  | 'Communication clarity'
  | 'Delivery mindset'
  | 'Learning ability'
  | 'Skylark fit';

export type RubricEntry = {
  criteria: RubricCriterion | string;
  score: number;
  note: string;
  evidence: string[];
};

export type NextRoundQuestion = {
  question: string;
  why_skylark: string;
  expected_outcome: string;
  evidence_gap: string;
};

export type InterviewFeedback = {
  overall_score: number | null;
  score_status: ScoreStatus;
  recommendation: Recommendation;
  confidence: number;
  rubric: RubricEntry[];
  strengths: string[];
  concerns: string[];
  overall_feedback?: string;
};

export type Candidate = {
  id: string;
  name: string;
  email: string;
  role_applied: string;
  cv_text: string | null;
  cv_summary: string | null;
  cv_file_name: string | null;
  assignment_text: string | null;
  assignment_summary: string | null;
  assignment_file_name: string | null;
  assignment_links: string[];
  next_round_questions: NextRoundQuestion[];
  status: CandidateStatus;
  ai_score: number | null;
  score_status: ScoreStatus;
  recommendation: Recommendation | null;
  transcript_quality_status: TranscriptQualityStatus;
  created_at: string;
  updated_at: string;
};

export type Interview = {
  id: string;
  candidate_id: string;
  transcript: string | null;
  duration: number | null;
  transcript_quality_score: number | null;
  transcript_quality_status: TranscriptQualityStatus;
  agent_summary: string | null;
  feedback_json: string | null;
  rubric_json: string | null;
  audio_url: string | null;
  created_at: string;
};

export type CandidateWithInterview = Candidate & {
  interview: Interview | null;
};
