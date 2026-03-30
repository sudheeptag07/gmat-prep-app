import { PracticeSetupForm } from '@/components/practice-setup-form';
import { GMAT_TOPIC_CATALOG } from '@/lib/gmat-taxonomy';

export default async function LearnPage() {
  return (
    <main className="mx-auto max-w-2xl pb-16">
      <section className="glass-panel p-8 md:p-10">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#f3a45b]">Practice Setup</p>
        <h1 className="spectra-heading mt-4 text-3xl md:text-4xl">Select topic and subtopic</h1>
        <p className="muted mt-4 text-sm leading-7">
          Basic flow: choose a lane, then start questions.
        </p>
        <div className="mt-8">
          <PracticeSetupForm topics={GMAT_TOPIC_CATALOG} />
        </div>
      </section>
    </main>
  );
}
