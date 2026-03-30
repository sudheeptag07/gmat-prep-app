import { NextResponse } from 'next/server';
import { getAssessmentResponseById } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const response = await getAssessmentResponseById(params.id);
    if (!response) {
      return NextResponse.json({ error: 'Response not found.' }, { status: 404 });
    }

    return NextResponse.json({ response });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
