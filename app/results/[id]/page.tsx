import Link from 'next/link';
import { notFound } from 'next/navigation';
import { scoreTone } from '@/lib/expense-health';
import { getAssessmentResponseById } from '@/lib/db';

export default async function ResultPage({ params }: { params: { id: string } }) {
  const response = await getAssessmentResponseById(params.id);

  if (!response) {
    notFound();
  }

  return (
    <main className="pb-16 pt-4">
      <section className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
        <div className="rounded-[36px] border border-[#d8e3f7] bg-[#0b1f3a] p-8 text-white shadow-[0_28px_80px_rgba(11,31,58,0.2)]">
          <p className="text-sm uppercase tracking-[0.24em] text-[#8eb6ff]">Assessment result</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Your expense workflow score is {response.expense_score}/100.
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-[#d4e3ff]">
            {response.result_summary}
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#b8d0ff]">Process health</p>
              <p className="mt-2 text-3xl font-semibold">{scoreTone(response.expense_score)}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#b8d0ff]">Lead score</p>
              <p className="mt-2 text-3xl font-semibold">{response.lead_score}</p>
            </div>
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-[#b8d0ff]">Classification</p>
              <p className="mt-2 text-2xl font-semibold">{response.lead_classification}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[32px] border border-[#d8e3f7] bg-white p-7 shadow-[0_24px_80px_rgba(11,31,58,0.08)]">
            <h2 className="text-2xl font-semibold text-[#0b1f3a]">What we picked up</h2>
            <ul className="mt-5 space-y-3 text-sm leading-7 text-[#4f6787]">
              <li>Claim method: <span className="font-medium text-[#0b1f3a]">{response.claim_method}</span></li>
              <li>Reimbursement cycle: <span className="font-medium text-[#0b1f3a]">{response.reimbursement_time}</span></li>
              <li>Audit difficulty: <span className="font-medium text-[#0b1f3a]">{response.audit_difficulty}</span></li>
              <li>Pain points: <span className="font-medium text-[#0b1f3a]">{response.pain_points.join(', ')}</span></li>
            </ul>
          </div>

          <div className="rounded-[32px] border border-[#d8e3f7] bg-white p-7 shadow-[0_24px_80px_rgba(11,31,58,0.08)]">
            <h2 className="text-2xl font-semibold text-[#0b1f3a]">Next actions</h2>
            <p className="mt-3 text-sm leading-7 text-[#55708f]">
              Most startups with this pattern struggle with reimbursement delays, spend visibility, and audit readiness. CUPI can replace that with a UPI-first employee wallet and cleaner tracking.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={`mailto:?subject=${encodeURIComponent('CUPI benchmark report request')}&body=${encodeURIComponent(`Please send the benchmark report for ${response.company}. Workflow score: ${response.expense_score}/100.`)}`}
                className="rounded-full bg-[#0b1f3a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#10284c]"
              >
                Get report
              </a>
              <a
                href={`mailto:?subject=${encodeURIComponent('CUPI demo request')}&body=${encodeURIComponent(`We would like to discuss CUPI for ${response.company}. Lead score: ${response.lead_score}.`)}`}
                className="rounded-full border border-[#d5e0f0] px-5 py-3 text-sm font-semibold text-[#355073] transition hover:border-[#2f6bff] hover:text-[#2f6bff]"
              >
                Book demo
              </a>
              <Link href="/expense-health-check" className="rounded-full border border-[#d5e0f0] px-5 py-3 text-sm font-semibold text-[#355073] transition hover:border-[#2f6bff] hover:text-[#2f6bff]">
                Retake assessment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
