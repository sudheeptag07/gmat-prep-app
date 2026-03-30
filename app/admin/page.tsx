import Link from 'next/link';
import { AdminDashboard } from '@/components/admin-dashboard';
import { DashboardLogout } from '@/components/dashboard-logout';
import { listAssessmentResponses } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminPage() {
  const responses = await listAssessmentResponses();

  return (
    <main className="space-y-6 pb-16 pt-4">
      <section className="rounded-[32px] border border-[#d8e3f7] bg-white p-6 shadow-[0_24px_80px_rgba(11,31,58,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#6883a7]">Internal dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0b1f3a]">CUPI lead diagnostics</h1>
            <p className="mt-2 text-sm text-[#567190]">Monitor startup expense maturity, qualification score, and demo intent.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/expense-health-check" className="rounded-full border border-[#d5e0f0] px-4 py-2 text-sm font-medium text-[#355073] transition hover:border-[#2f6bff] hover:text-[#2f6bff]">
              Public survey
            </Link>
            <DashboardLogout />
          </div>
        </div>
      </section>
      <AdminDashboard responses={responses} />
    </main>
  );
}
