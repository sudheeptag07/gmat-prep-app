import { NextResponse } from 'next/server';
import { getCandidateCVFile } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const file = await getCandidateCVFile(params.id);
    if (!file) {
      return NextResponse.json({ error: 'CV PDF not available.' }, { status: 404 });
    }

    const bytes = Buffer.from(file.base64, 'base64');
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=\"${safeFileName(file.fileName || 'candidate-cv.pdf')}\"`,
        'Cache-Control': 'private, no-store'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
