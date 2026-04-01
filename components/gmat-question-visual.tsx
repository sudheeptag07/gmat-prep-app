import type { GmatQuestionVisual } from '@/lib/infer-gmat-visual';

export function GmatQuestionVisualPanel({ visual }: { visual: GmatQuestionVisual }) {
  if (visual.kind === 'table') {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84a8ff]">{visual.title}</p>
        <div className="mt-4 overflow-hidden rounded-[18px] border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-slate-300">
              <tr>
                <th className="px-4 py-3 font-medium">{visual.headers[0]}</th>
                <th className="px-4 py-3 font-medium">{visual.headers[1]}</th>
              </tr>
            </thead>
            <tbody>
              {visual.rows.map((row) => (
                <tr key={row.label} className="border-t border-white/10">
                  <td className="px-4 py-3 text-slate-200">{row.label}</td>
                  <td className="px-4 py-3 text-white">{row.displayValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...visual.rows.map((row) => row.value), 1);

  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84a8ff]">{visual.title}</p>
      <div className="mt-5 space-y-4">
        {visual.rows.map((row) => (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-slate-200">{row.label}</span>
              <span className="font-medium text-white">{row.displayValue}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,rgba(132,168,255,0.92),rgba(240,126,37,0.92))]"
                style={{ width: `${Math.max(12, (row.value / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
