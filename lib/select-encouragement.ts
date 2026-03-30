import { encouragementConfig } from '@/lib/encouragement-config';
import type { EncouragementPayload, EncouragementTriggerType } from '@/lib/gmat-types';

export type EncouragementDerivedFlags = {
  isFastCorrect: boolean;
  isSlowCorrect: boolean;
  isStrategyImprovement: boolean;
  isTopicImproving: boolean;
  isIncorrectClose: boolean;
  attemptsSinceRareSignature: number;
};

export type EncouragementSelectionInput = {
  isCorrect: boolean;
  flags: EncouragementDerivedFlags;
  recentMessages: string[];
  totalAttempts: number;
  random?: () => number;
};

const BASE_TRIGGER_PRIORITY: Array<Exclude<EncouragementTriggerType, 'rare_signature'>> = [
  'strategy_improvement',
  'fast_correct',
  'slow_correct',
  'improvement',
  'incorrect_close',
  'correct'
];

const RARE_SIGNATURE_PROBABILITY = 0.12;
const RECENT_MESSAGE_BLOCK_WINDOW = 8;

function pickMessage(triggerType: EncouragementTriggerType, recentMessages: string[], random: () => number): string {
  const pool = encouragementConfig.encouragementMessages[triggerType];
  const blockedMessages = new Set(recentMessages.slice(0, RECENT_MESSAGE_BLOCK_WINDOW));
  const eligible = pool.filter((line) => !blockedMessages.has(line));
  const finalPool = eligible.length > 0 ? eligible : pool;
  const idx = Math.floor(random() * finalPool.length);
  return finalPool[Math.max(0, Math.min(idx, finalPool.length - 1))];
}

function selectBaseTrigger(input: EncouragementSelectionInput): EncouragementTriggerType {
  const triggerChecks: Record<Exclude<EncouragementTriggerType, 'rare_signature'>, boolean> = {
    strategy_improvement: input.flags.isStrategyImprovement,
    fast_correct: input.flags.isFastCorrect,
    slow_correct: input.flags.isSlowCorrect,
    improvement: input.flags.isTopicImproving,
    incorrect_close: !input.isCorrect ? input.flags.isIncorrectClose : false,
    correct: input.isCorrect
  };

  for (const trigger of BASE_TRIGGER_PRIORITY) {
    if (triggerChecks[trigger]) {
      return trigger;
    }
  }

  return input.isCorrect ? 'correct' : 'incorrect_close';
}

function shouldShowRareSignature(input: EncouragementSelectionInput, random: () => number): boolean {
  const hasAttempts = input.totalAttempts >= 15;
  const noRecentRare = input.flags.attemptsSinceRareSignature >= 20;
  const isEligiblePerformance = input.isCorrect || input.flags.isTopicImproving || input.flags.isStrategyImprovement;
  const probabilityGate = random() < RARE_SIGNATURE_PROBABILITY;

  return hasAttempts && noRecentRare && isEligiblePerformance && probabilityGate;
}

export function selectEncouragement(input: EncouragementSelectionInput): EncouragementPayload {
  const random = input.random ?? Math.random;
  const triggerType = shouldShowRareSignature(input, random) ? 'rare_signature' : selectBaseTrigger(input);

  return {
    triggerType,
    message: pickMessage(triggerType, input.recentMessages, random)
  };
}
