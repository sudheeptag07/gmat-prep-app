import test from 'node:test';
import assert from 'node:assert/strict';
import { encouragementConfig } from '@/lib/encouragement-config';
import { selectEncouragement } from '@/lib/select-encouragement';

test('trigger priority prefers strategy_improvement over fast_correct', () => {
  const result = selectEncouragement({
    isCorrect: true,
    flags: {
      isFastCorrect: true,
      isSlowCorrect: false,
      isStrategyImprovement: true,
      isTopicImproving: false,
      isIncorrectClose: false,
      attemptsSinceRareSignature: 100
    },
    recentMessages: [],
    totalAttempts: 4,
    random: () => 0
  });

  assert.equal(result.triggerType, 'strategy_improvement');
  assert.equal(result.message, encouragementConfig.encouragementMessages.strategy_improvement[0]);
});

test('does not repeat a line from last 8 attempts when alternatives exist', () => {
  const blocked = encouragementConfig.encouragementMessages.correct[0];
  const result = selectEncouragement({
    isCorrect: true,
    flags: {
      isFastCorrect: false,
      isSlowCorrect: false,
      isStrategyImprovement: false,
      isTopicImproving: false,
      isIncorrectClose: false,
      attemptsSinceRareSignature: 100
    },
    recentMessages: [blocked, 'x1', 'x2', 'x3', 'x4', 'x5', 'x6', 'x7'],
    totalAttempts: 5,
    random: () => 0
  });

  assert.equal(result.triggerType, 'correct');
  assert.notEqual(result.message, blocked);
});

test('rare_signature appears when all eligibility rules pass and probability gate opens', () => {
  const result = selectEncouragement({
    isCorrect: true,
    flags: {
      isFastCorrect: false,
      isSlowCorrect: false,
      isStrategyImprovement: false,
      isTopicImproving: false,
      isIncorrectClose: false,
      attemptsSinceRareSignature: 25
    },
    recentMessages: [],
    totalAttempts: 20,
    random: () => 0.01
  });

  assert.equal(result.triggerType, 'rare_signature');
  assert.ok(encouragementConfig.encouragementMessages.rare_signature.includes(result.message));
});

test('rare_signature is blocked if cooldown window is not satisfied', () => {
  const result = selectEncouragement({
    isCorrect: true,
    flags: {
      isFastCorrect: true,
      isSlowCorrect: false,
      isStrategyImprovement: false,
      isTopicImproving: false,
      isIncorrectClose: false,
      attemptsSinceRareSignature: 4
    },
    recentMessages: [],
    totalAttempts: 50,
    random: () => 0.01
  });

  assert.notEqual(result.triggerType, 'rare_signature');
  assert.equal(result.triggerType, 'fast_correct');
});
