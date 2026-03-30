import { NextResponse } from 'next/server';
import { z } from 'zod';
import { generateAndStoreGmatQuestions } from '@/lib/db';

const payloadSchema = z.object({
  topic: z.enum(['Quant', 'Verbal', 'Data Insights']),
  subtopic: z.string().min(1),
  count: z.number().int().min(1).max(10).optional()
});

export async function POST(request: Request) {
  const json = await request.json();
  const payload = payloadSchema.parse(json);

  const inserted = await generateAndStoreGmatQuestions({
    topic: payload.topic,
    subtopic: payload.subtopic,
    count: payload.count ?? 5
  });

  return NextResponse.json({ ok: true, inserted, topic: payload.topic, subtopic: payload.subtopic });
}
