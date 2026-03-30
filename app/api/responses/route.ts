import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  AUDIT_DIFFICULTY_OPTIONS,
  CLAIM_METHOD_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  DEMO_INTEREST_OPTIONS,
  PAIN_POINT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PETTY_CASH_MANAGER_OPTIONS,
  PETTY_CASH_OPTIONS,
  REIMBURSEMENT_TIME_OPTIONS,
  REIMBURSEMENT_VOLUME_OPTIONS,
  ROLE_OPTIONS,
  UPI_WALLET_INTEREST_OPTIONS
} from '@/lib/expense-types';
import { DASHBOARD_AUTH_COOKIE, getDashboardPassword } from '@/lib/dashboard-auth';
import { createAssessmentResponse, listAssessmentResponses } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const schema = z.object({
  name: z.string().trim().min(2),
  company: z.string().trim().min(2),
  email: z.string().trim().email(),
  role: z.enum(ROLE_OPTIONS),
  company_size: z.enum(COMPANY_SIZE_OPTIONS),
  coworking_space: z.string().trim().min(2),
  city: z.string().trim().min(2),
  payment_methods: z.array(z.enum(PAYMENT_METHOD_OPTIONS)).min(1),
  reimbursement_volume: z.enum(REIMBURSEMENT_VOLUME_OPTIONS),
  claim_method: z.enum(CLAIM_METHOD_OPTIONS),
  reimbursement_time: z.enum(REIMBURSEMENT_TIME_OPTIONS),
  petty_cash: z.enum(PETTY_CASH_OPTIONS),
  petty_cash_manager: z.string().trim(),
  pain_points: z.array(z.enum(PAIN_POINT_OPTIONS)).min(1),
  audit_difficulty: z.enum(AUDIT_DIFFICULTY_OPTIONS),
  upi_wallet_interest: z.enum(UPI_WALLET_INTEREST_OPTIONS),
  demo_interest: z.enum(DEMO_INTEREST_OPTIONS)
});

export async function GET() {
  try {
    const password = getDashboardPassword();
    const isAuthed = !password || cookies().get(DASHBOARD_AUTH_COOKIE)?.value === password;
    if (!isAuthed) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const responses = await listAssessmentResponses();
    return NextResponse.json({ responses });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const pettyCashManager =
      parsed.data.petty_cash === 'No'
        ? 'Not applicable'
        : PETTY_CASH_MANAGER_OPTIONS.includes(parsed.data.petty_cash_manager as (typeof PETTY_CASH_MANAGER_OPTIONS)[number])
          ? parsed.data.petty_cash_manager
          : 'Admin';

    const response = await createAssessmentResponse({
      ...parsed.data,
      petty_cash_manager: pettyCashManager,
      id: uuidv4()
    });

    return NextResponse.json({ response }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
