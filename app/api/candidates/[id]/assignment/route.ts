import { NextResponse } from 'next/server';
import { getCandidateAssignmentFile } from '@/lib/db';

function safeFileName(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const file = await getCandidateAssignmentFile(params.id);
    if (!file) {
      return NextResponse.json({ error: 'Assignment file not found.' }, { status: 404 });
    }

    const bytes = Buffer.from(file.base64, 'base64');

    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeFileName(file.fileName || 'candidate-assignment.pdf')}"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
