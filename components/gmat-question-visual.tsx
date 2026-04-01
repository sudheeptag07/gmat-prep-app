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

  if (visual.kind === 'pie') {
    const total = Math.max(1, visual.rows.reduce((sum, row) => sum + row.value, 0));
    const palette = ['#84a8ff', '#f07e25', '#53d3a6', '#f7c95f', '#d181ff', '#5fd5f7'];
    let cursor = 0;
    const segments = visual.rows.map((row, index) => {
      const portion = row.value / total;
      const start = cursor;
      const end = cursor + portion;
      cursor = end;
      return {
        ...row,
        color: palette[index % palette.length],
        start,
        end
      };
    });

    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84a8ff]">{visual.title}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
          <div className="mx-auto h-[220px] w-[220px] rounded-full border border-white/10">
            <div
              className="h-full w-full rounded-full"
              style={{
                background: `conic-gradient(${segments
                  .map((segment) => `${segment.color} ${segment.start * 360}deg ${segment.end * 360}deg`)
                  .join(', ')})`
              }}
            />
          </div>
          <div className="space-y-3">
            {segments.map((segment) => (
              <div key={segment.label} className="flex items-center justify-between gap-4 rounded-[16px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <span className="text-slate-200">{segment.label}</span>
                </div>
                <span className="font-medium text-white">{segment.displayValue}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visual.kind === 'line') {
    const values = visual.rows.map((row) => row.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = Math.max(1, maxValue - minValue);
    const width = 320;
    const height = 170;
    const padding = 18;
    const points = visual.rows.map((row, index) => {
      const x =
        visual.rows.length === 1
          ? width / 2
          : padding + (index * (width - padding * 2)) / (visual.rows.length - 1);
      const y = height - padding - ((row.value - minValue) / range) * (height - padding * 2);
      return { ...row, x, y };
    });
    const path = points.map((point) => `${point.x},${point.y}`).join(' ');

    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84a8ff]">{visual.title}</p>
        <div className="mt-4 rounded-[18px] border border-white/10 bg-white/[0.02] p-4">
          <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label={visual.title}>
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.18)" />
            <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="rgba(255,255,255,0.18)" />
            <polyline fill="none" stroke="rgba(132,168,255,0.95)" strokeWidth="3" points={path} />
            {points.map((point) => (
              <g key={point.label}>
                <circle cx={point.x} cy={point.y} r="4.5" fill="rgba(240,126,37,0.95)" />
                <text x={point.x} y={height - 2} textAnchor="middle" fill="rgba(226,232,240,0.9)" fontSize="11">
                  {point.label}
                </text>
                <text x={point.x} y={point.y - 10} textAnchor="middle" fill="white" fontSize="11">
                  {point.displayValue}
                </text>
              </g>
            ))}
          </svg>
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
