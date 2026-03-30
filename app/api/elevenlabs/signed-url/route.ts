import { NextResponse } from 'next/server';
import { getCandidateById } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    const agentId = process.env.ELEVENLABS_AGENT_ID || process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!apiKey) {
      return NextResponse.json({ error: 'ELEVENLABS_API_KEY is not configured.' }, { status: 500 });
    }

    if (!agentId) {
      return NextResponse.json({ error: 'ELEVENLABS agent id is not configured.' }, { status: 500 });
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${encodeURIComponent(agentId)}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey
        },
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: `Failed to fetch signed URL from ElevenLabs: ${text}` },
        { status: response.status }
      );
    }

    const payload = (await response.json()) as { signed_url?: string };
    if (!payload.signed_url) {
      return NextResponse.json({ error: 'ElevenLabs did not return a signed_url.' }, { status: 502 });
    }

    const candidate = candidateId ? await getCandidateById(candidateId) : null;
    const dynamicVariables = candidate
      ? {
          candidate_id: candidate.id,
          candidate_name: candidate.name,
          candidate_email: candidate.email,
          role_applied: candidate.role_applied,
          cv_summary: candidate.cv_summary || '',
          assignment_summary: candidate.assignment_summary || '',
          assignment_links: candidate.assignment_links.join(', ')
        }
      : null;

    return NextResponse.json({
      signedUrl: payload.signed_url,
      dynamicVariables
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
