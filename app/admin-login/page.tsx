'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type State = 'idle' | 'loading' | 'error';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    setError(null);

    try {
      const response = await fetch('/api/dashboard-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || 'Login failed.');
      }

      const next =
        typeof window !== 'undefined'
          ? new URLSearchParams(window.location.search).get('next') || '/dashboard'
          : '/dashboard';
      router.push(next);
      router.refresh();
    } catch (err) {
      setState('error');
      setError((err as Error).message);
    } finally {
      setState('idle');
    }
  }

  return (
    <main className="mx-auto mt-24 max-w-md pb-16">
      <section className="glass-panel p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#f3a45b]">Protected Access</p>
        <h1 className="spectra-heading mt-3 text-3xl">Open Hiring Dashboard</h1>
        <p className="muted mt-3 text-sm leading-6">
          Enter the shared password to access Skylark’s GIS interview review dashboard.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm text-slate-300">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="spectra-input w-full px-4 py-3 text-sm"
            />
          </div>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="submit"
            disabled={state === 'loading'}
            className="w-full rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-4 py-3 font-semibold text-white transition hover:bg-[#f07e25]/22 disabled:opacity-60"
          >
            {state === 'loading' ? 'Checking...' : 'Open dashboard'}
          </button>
        </form>
      </section>
    </main>
  );
}
