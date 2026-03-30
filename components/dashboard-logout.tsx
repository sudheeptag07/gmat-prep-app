'use client';

import { useRouter } from 'next/navigation';

export function DashboardLogout() {
  const router = useRouter();

  async function onLogout() {
    await fetch('/api/dashboard-auth', { method: 'DELETE' });
    router.push('/admin-login');
    router.refresh();
  }

  return (
    <button onClick={onLogout} className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-[#f07e25]/60 hover:text-white">
      Logout
    </button>
  );
}
