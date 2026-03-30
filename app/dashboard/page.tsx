import { DashboardLogout } from '@/components/dashboard-logout';
import { DashboardTable } from '@/components/dashboard-table';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function DashboardPage() {
  return (
    <main className="space-y-6 pb-16">
      <section className="glass-panel p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f3a45b]">Hiring Dashboard</p>
            <h1 className="spectra-heading mt-3 text-3xl md:text-4xl">Skylark GIS Candidate Pipeline</h1>
            <p className="muted mt-3 max-w-2xl text-sm leading-6 md:text-base">
              Review interviews with transcript quality, assignment context, grounded rubric evidence, recommendation, and next-round questions.
            </p>
          </div>
          <DashboardLogout />
        </div>
      </section>

      <DashboardTable />
    </main>
  );
}
