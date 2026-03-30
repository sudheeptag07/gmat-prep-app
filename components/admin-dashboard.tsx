'use client';

import { useMemo, useState } from 'react';
import { buildDashboardSummary, getTopItems, getTopPainPoints, scoreTone } from '@/lib/expense-health';
import type { AssessmentRecord } from '@/lib/expense-types';

function MiniBarChart({ title, items }: { title: string; items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="rounded-[28px] border border-[#d8e3f7] bg-white p-6 shadow-[0_20px_60px_rgba(11,31,58,0.08)]">
      <h3 className="text-lg font-semibold text-[#0b1f3a]">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <div key={item.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm text-[#456283]">
              <span>{item.label}</span>
              <span>{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-[#e9f0fa]">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#0b1f3a_0%,#2f6bff_100%)]" style={{ width: `${(item.value / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard({ responses }: { responses: AssessmentRecord[] }) {
  const [cityFilter, setCityFilter] = useState('all');
  const [coworkingFilter, setCoworkingFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');
  const [leadFilter, setLeadFilter] = useState('all');
  const [demoFilter, setDemoFilter] = useState('all');

  const filtered = useMemo(() => {
    return responses.filter((item) => {
      if (cityFilter !== 'all' && item.city !== cityFilter) return false;
      if (coworkingFilter !== 'all' && item.coworking_space !== coworkingFilter) return false;
      if (sizeFilter !== 'all' && item.company_size !== sizeFilter) return false;
      if (leadFilter !== 'all' && item.lead_classification !== leadFilter) return false;
      if (demoFilter !== 'all' && item.demo_interest !== demoFilter) return false;
      return true;
    });
  }, [cityFilter, coworkingFilter, sizeFilter, leadFilter, demoFilter, responses]);

  const summary = buildDashboardSummary(filtered);
  const topCities = getTopItems(filtered, 'city').slice(0, 5);
  const topSizes = getTopItems(filtered, 'company_size');
  const auditDifficulty = getTopItems(filtered, 'audit_difficulty');
  const claimMethods = getTopItems(filtered, 'claim_method');
  const topPainPoints = getTopPainPoints(filtered).slice(0, 6);
  const cities = Array.from(new Set(responses.map((item) => item.city))).filter(Boolean);
  const coworkingSpaces = Array.from(new Set(responses.map((item) => item.coworking_space))).filter(Boolean);
  const sizes = Array.from(new Set(responses.map((item) => item.company_size))).filter(Boolean);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        {[
          ['Responses', summary.totalResponses],
          ['Hot leads', summary.hotLeads],
          ['Warm leads', summary.warmLeads],
          ['Cold leads', summary.coldLeads],
          ['Avg expense score', summary.averageExpenseScore],
          ['Demo requests', summary.demoRequests]
        ].map(([label, value]) => (
          <div key={label} className="rounded-[28px] border border-[#d8e3f7] bg-white p-5 shadow-[0_20px_60px_rgba(11,31,58,0.08)]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#6781a0]">{label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#0b1f3a]">{value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[28px] border border-[#d8e3f7] bg-white p-6 shadow-[0_20px_60px_rgba(11,31,58,0.08)]">
        <div className="flex flex-wrap gap-3">
          <select value={cityFilter} onChange={(event) => setCityFilter(event.target.value)} className="rounded-full border border-[#d5e0f0] bg-[#f8fbff] px-4 py-2 text-sm text-[#103152]">
            <option value="all">All cities</option>
            {cities.map((city) => <option key={city} value={city}>{city}</option>)}
          </select>
          <select value={coworkingFilter} onChange={(event) => setCoworkingFilter(event.target.value)} className="rounded-full border border-[#d5e0f0] bg-[#f8fbff] px-4 py-2 text-sm text-[#103152]">
            <option value="all">All coworking spaces</option>
            {coworkingSpaces.map((space) => <option key={space} value={space}>{space}</option>)}
          </select>
          <select value={sizeFilter} onChange={(event) => setSizeFilter(event.target.value)} className="rounded-full border border-[#d5e0f0] bg-[#f8fbff] px-4 py-2 text-sm text-[#103152]">
            <option value="all">All company sizes</option>
            {sizes.map((size) => <option key={size} value={size}>{size}</option>)}
          </select>
          <select value={leadFilter} onChange={(event) => setLeadFilter(event.target.value)} className="rounded-full border border-[#d5e0f0] bg-[#f8fbff] px-4 py-2 text-sm text-[#103152]">
            <option value="all">All lead scores</option>
            <option value="Hot Lead">Hot Lead</option>
            <option value="Warm Lead">Warm Lead</option>
            <option value="Cold Lead">Cold Lead</option>
          </select>
          <select value={demoFilter} onChange={(event) => setDemoFilter(event.target.value)} className="rounded-full border border-[#d5e0f0] bg-[#f8fbff] px-4 py-2 text-sm text-[#103152]">
            <option value="all">Any demo interest</option>
            <option value="Yes">Requested demo</option>
            <option value="Maybe later">Maybe later</option>
            <option value="No">No</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <MiniBarChart title="Company size distribution" items={topSizes} />
        <MiniBarChart title="Audit difficulty" items={auditDifficulty} />
        <MiniBarChart title="Claim submission methods" items={claimMethods} />
        <MiniBarChart title="Common pain points" items={topPainPoints} />
        <MiniBarChart title="Top cities" items={topCities} />
      </div>

      <div className="rounded-[28px] border border-[#d8e3f7] bg-white p-6 shadow-[0_20px_60px_rgba(11,31,58,0.08)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-[#0b1f3a]">Lead list</h3>
            <p className="mt-1 text-sm text-[#5b7697]">Internal qualification view for CUPI sales and growth.</p>
          </div>
          <p className="rounded-full bg-[#eef4ff] px-4 py-2 text-sm font-medium text-[#2f6bff]">
            Avg lead score: {summary.averageLeadScore} ({scoreTone(summary.averageLeadScore)})
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[1120px] w-full">
            <thead>
              <tr className="border-b border-[#e2eaf6] text-left text-xs uppercase tracking-[0.18em] text-[#738aa7]">
                <th className="px-3 py-3">Company</th>
                <th className="px-3 py-3">Respondent</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Size</th>
                <th className="px-3 py-3">Coworking</th>
                <th className="px-3 py-3 text-right">Expense</th>
                <th className="px-3 py-3 text-right">Lead</th>
                <th className="px-3 py-3">Demo</th>
                <th className="px-3 py-3">Captured</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item.id} className="border-b border-[#eef3fa] text-sm text-[#153355]">
                  <td className="px-3 py-4 font-medium">{item.company}</td>
                  <td className="px-3 py-4">{item.name}</td>
                  <td className="px-3 py-4">{item.role}</td>
                  <td className="px-3 py-4">{item.email}</td>
                  <td className="px-3 py-4">{item.company_size}</td>
                  <td className="px-3 py-4">{item.coworking_space}</td>
                  <td className="px-3 py-4 text-right">{item.expense_score}</td>
                  <td className="px-3 py-4 text-right">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.lead_classification === 'Hot Lead' ? 'bg-[#ffe8e0] text-[#b64622]' : item.lead_classification === 'Warm Lead' ? 'bg-[#fff4d6] text-[#9a6a02]' : 'bg-[#ebf1f9] text-[#4b6586]'}`}>
                      {item.lead_score} · {item.lead_classification}
                    </span>
                  </td>
                  <td className="px-3 py-4">{item.demo_interest}</td>
                  <td className="px-3 py-4">{item.created_at.replace('T', ' ').slice(0, 16)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
