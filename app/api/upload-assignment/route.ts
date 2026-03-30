import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateCandidateAssignment } from '@/lib/db';
import { analyzeAssignment } from '@/lib/gemini';
import { extractPdfText } from '@/lib/pdf';

const schema = z.object({
  candidateId: z.string().uuid(),
  assignmentLink: z.string().url().optional().or(z.literal('')),
  note: z.string().max(2000).optional().or(z.literal(''))
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const candidateId = formData.get('candidateId');
    const assignmentLink = formData.get('assignmentLink');
    const note = formData.get('note');
    const file = formData.get('assignment');

    const parsed = schema.safeParse({
      candidateId,
      assignmentLink: typeof assignmentLink === 'string' ? assignmentLink : '',
      note: typeof note === 'string' ? note : ''
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const isFile = file instanceof File && file.size > 0;
    const links = parsed.data.assignmentLink ? [parsed.data.assignmentLink] : [];

    if (!isFile && links.length === 0) {
      return NextResponse.json({ error: 'Provide either an assignment link or an assignment PDF.' }, { status: 400 });
    }

    let assignmentText: string | null = null;
    let assignmentPdfBase64: string | null = null;
    let assignmentFileName: string | null = null;

    if (isFile) {
      assignmentFileName = file.name || 'candidate-assignment.pdf';
      assignmentPdfBase64 = Buffer.from(await file.arrayBuffer()).toString('base64');
      try {
        assignmentText = await extractPdfText(Buffer.from(assignmentPdfBase64, 'base64'));
      } catch {
        assignmentText = null;
      }
    }

    const summarySource = [assignmentText, parsed.data.note, parsed.data.assignmentLink].filter(Boolean).join('\n\n');
    let summary = 'Assignment uploaded successfully. AI summary is pending.';

    if (summarySource.trim()) {
      try {
        const analysis = await analyzeAssignment({
          assignmentText: summarySource,
          assignmentLink: parsed.data.assignmentLink || null,
          note: parsed.data.note || null
        });
        summary = analysis.summary;
      } catch (error) {
        const message = (error as Error).message || '';
        if (!message.includes('429')) {
          throw error;
        }
      }
    }

    await updateCandidateAssignment({
      candidateId: parsed.data.candidateId,
      assignmentText,
      assignmentSummary: summary,
      assignmentPdfBase64,
      assignmentFileName,
      assignmentLinks: links
    });

    return NextResponse.json({
      summary,
      hasFile: Boolean(isFile),
      assignmentTextLength: assignmentText?.length ?? 0,
      links
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
