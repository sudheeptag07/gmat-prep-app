export type GmatTopic = 'Quant' | 'Verbal' | 'Data Insights';
export type GmatSubtopic = string;

export type GmatDifficulty = 'Easy' | 'Medium' | 'Hard';
export type GmatConfidence = 'low' | 'medium' | 'high' | null;
export type GmatStrategyInput =
  | 'algebra'
  | 'backsolving'
  | 'plugging_numbers'
  | 'logical_elimination'
  | 'estimation'
  | 'assumption_lens'
  | 'guess'
  | 'other'
  | null;
export type GmatSpeedLabel = 'Fast' | 'Medium' | 'Slow';
export type GmatReliabilityLabel = 'High' | 'Medium';
export type GmatCognitiveLoad = 'Low' | 'Medium' | 'High';
export type EncouragementTriggerType =
  | 'correct'
  | 'fast_correct'
  | 'slow_correct'
  | 'incorrect_close'
  | 'strategy_improvement'
  | 'improvement'
  | 'rare_signature';

export type EncouragementPayload = {
  triggerType: EncouragementTriggerType;
  message: string;
};

export type GmatMethod = {
  name: string;
  steps: string[];
  whyItWorks: string;
  speed: GmatSpeedLabel;
  reliability: GmatReliabilityLabel;
  cognitiveLoad: GmatCognitiveLoad;
  whenToUse: string;
};

export type GmatQuestion = {
  id: string;
  topic: GmatTopic;
  subtopic: GmatSubtopic;
  difficulty: GmatDifficulty;
  prompt: string;
  stem: string;
  choices: string[];
  correctAnswer: string;
  recommendedTimeSeconds: number;
  concepts: string[];
  strategyTags: string[];
  trapType: string;
  patternType: string;
  standardSolution: string[];
  alternativeMethods: GmatMethod[];
  topScorerNotice: string;
  commonTrap: string;
  timeSavingInsight: string;
};

export type GmatLearner = {
  id: string;
  targetScore: number;
  strengths: string[];
  weeklyHours: number;
  createdAt: string;
};

export type GmatAttempt = {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
  strategyUsed: GmatStrategyInput;
  confidence: GmatConfidence;
  createdAt: string;
  encouragement?: EncouragementPayload | null;
};

export type GmatAttemptWithQuestion = GmatAttempt & {
  question: GmatQuestion;
};
