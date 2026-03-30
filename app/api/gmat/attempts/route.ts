import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { createGmatAttempt, ensureGmatLearner } from '@/lib/db';
import { GMAT_USER_COOKIE } from '@/lib/gmat-session';

const payloadSchema = z.object({
  questionId: z.string().min(1),
  selectedAnswer: z.string().min(1),
  timeTakenSeconds: z.number().int().min(1),
  strategyUsed: z
    .enum(['algebra', 'backsolving', 'plugging_numbers', 'logical_elimination', 'estimation', 'assumption_lens', 'guess', 'other'])
    .nullable(),
  confidence: z.enum(['low', 'medium', 'high']).nullable()
});

export async function POST(request: Request) {
  const existingUserId = cookies().get(GMAT_USER_COOKIE)?.value;
  const userId = existingUserId ?? `gmat_${randomUUID()}`;

  const json = await request.json();
  const payload = payloadSchema.parse(json);
  await ensureGmatLearner(userId);
  const attempt = await createGmatAttempt({
    userId,
    questionId: payload.questionId,
    selectedAnswer: payload.selectedAnswer,
    timeTakenSeconds: payload.timeTakenSeconds,
    strategyUsed: payload.strategyUsed,
    confidence: payload.confidence
  });

  const response = NextResponse.json({ attempt });
  if (!existingUserId) {
    response.cookies.set(GMAT_USER_COOKIE, userId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30
    });
  }
  return response;
}
