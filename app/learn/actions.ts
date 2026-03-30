'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createGmatLearner } from '@/lib/db';
import { GMAT_USER_COOKIE } from '@/lib/gmat-session';

const onboardingSchema = z.object({
  targetScore: z.coerce.number().min(400).max(805),
  weeklyHours: z.coerce.number().min(1).max(40),
  strengths: z.array(z.string()).min(1)
});

export async function createLearnerAction(formData: FormData) {
  const parsed = onboardingSchema.parse({
    targetScore: formData.get('targetScore'),
    weeklyHours: formData.get('weeklyHours'),
    strengths: formData.getAll('strengths')
  });

  const learner = await createGmatLearner({
    targetScore: parsed.targetScore,
    weeklyHours: parsed.weeklyHours,
    strengths: parsed.strengths
  });

  cookies().set(GMAT_USER_COOKIE, learner.id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  });

  redirect('/learn');
}
