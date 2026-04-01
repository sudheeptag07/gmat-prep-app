'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import type { GmatChartData, GmatChartDataset, GmatVisualData, GmatVisualType } from '@/lib/gmat-types';

const SERIES_COLORS = ['#84a8ff', '#f07e25', '#53d3a6', '#f7c95f', '#d181ff', '#5fd5f7'];

type ChartRendererProps = {
  type: GmatVisualType;
  data: GmatVisualData | null;
};

function buildSeriesRows(labels: string[], datasets: GmatChartDataset[]) {
  return labels.map((label, index) => {
    const row: Record<string, string | number> = { label };
    for (const dataset of datasets) {
      row[dataset.label] = dataset.data[index] ?? 0;
    }
    return row;
  });
}

export function ChartRenderer({ type, data }: ChartRendererProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const seriesRows = useMemo(() => {
    if (!data || data.type === 'table') return [];
    return buildSeriesRows(data.labels, data.datasets);
  }, [data]);

  const pieRows = useMemo(() => {
    if (!data || data.type !== 'pie_chart' || data.datasets.length === 0) return [];
    return data.labels.map((label, index) => ({
      name: label,
      value: data.datasets[0].data[index] ?? 0
    }));
  }, [data]);

  if (!mounted) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
        Loading visual...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-slate-300">
        Visual not available
      </div>
    );
  }

  return (
    <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#84a8ff]">
            {data.type === 'table' ? 'Table' : 'Chart'}
          </p>
          <p className="mt-2 text-sm text-slate-300">{data.title ?? 'Interactive visual reference'}</p>
        </div>
      </div>
      <div
        className={`mt-5 w-full overflow-hidden rounded-[22px] border border-white/10 bg-[#0d1528] p-4 ${
          data.type === 'table' ? '' : 'h-[320px]'
        }`}
      >
        {data.type === 'table' ? (
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-200">
              <thead>
                <tr>
                  {data.columns.map((column) => (
                    <th
                      key={column}
                      className="border-b border-white/10 bg-white/[0.04] px-4 py-3 font-medium text-slate-100"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rowIndex) => (
                  <tr key={`${row.join('|')}-${rowIndex}`} className="odd:bg-white/[0.02]">
                    {row.map((cell, cellIndex) => (
                      <td key={`${cell}-${cellIndex}`} className="border-b border-white/5 px-4 py-3 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
          {type === 'bar_chart' ? (
            <BarChart data={seriesRows} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#e2e8f0' }}
              />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Bar key={dataset.label} dataKey={dataset.label} fill={SERIES_COLORS[index % SERIES_COLORS.length]} radius={[8, 8, 0, 0]} />
              ))}
            </BarChart>
          ) : null}

          {type === 'line_chart' ? (
            <LineChart data={seriesRows} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#e2e8f0' }}
              />
              <Legend />
              {data.datasets.map((dataset, index) => (
                <Line
                  key={dataset.label}
                  type="monotone"
                  dataKey={dataset.label}
                  stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          ) : null}

          {type === 'pie_chart' ? (
            <PieChart margin={{ top: 16, right: 16, left: 16, bottom: 8 }}>
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, color: '#e2e8f0' }}
              />
              <Legend />
              <Pie data={pieRows} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={96} innerRadius={44} paddingAngle={2}>
                {pieRows.map((entry, index) => (
                  <Cell key={`${entry.name}-${index}`} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : null}
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
