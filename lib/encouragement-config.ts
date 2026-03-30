import type { EncouragementTriggerType } from '@/lib/gmat-types';

export const encouragementConfig: {
  encouragementMessages: Record<EncouragementTriggerType, string[]>;
} = {
  encouragementMessages: {
    correct: [
      'Nice. That was clean.',
      'You saw that well.',
      'That was a solid read.',
      'You’re sharper than you think.',
      'I like how you approached that.'
    ],
    fast_correct: [
      'That was quick. Almost unfair.',
      'You barely hesitated.',
      'That looked instinctive.',
      'Okay, that was impressive.',
      'You saw the structure fast.'
    ],
    slow_correct: [
      'You got it. Now let’s make it faster.',
      'Right answer. There’s a shorter path here.',
      'You were right. Now we refine.',
      'Good. Next step is speed.',
      'You got there. I’ll show you the cleaner route.'
    ],
    incorrect_close: [
      'Close. You’re looking in the right direction.',
      'Good attempt. This one has a trick.',
      'This catches a lot of people. Let’s unpack it.',
      'You’re not far off here.',
      'There’s a cleaner way into this one.'
    ],
    strategy_improvement: [
      'That’s a smarter way to do it.',
      'You’re starting to see patterns.',
      'That shift right there matters.',
      'This is how top scorers save time.',
      'You didn’t brute-force it this time.'
    ],
    improvement: [
      'You’re getting faster.',
      'That used to take longer.',
      'You didn’t overthink this one.',
      'You’re learning.',
      'You’re starting to trust your instincts.'
    ],
    rare_signature: [
      'You’re better than you think. I can see it.',
      'There’s something very sharp about the way you think.',
      'You’re settling into this nicely.',
      'You’re becoming dangerous in a good way.'
    ]
  }
};
