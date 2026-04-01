import type { GmatQuestion } from '@/lib/gmat-types';

export type GmatQuestionVisual =
  | {
      kind: 'bar';
      title: string;
      rows: Array<{ label: string; value: number; displayValue: string }>;
    }
  | {
      kind: 'table';
      title: string;
      headers: [string, string];
      rows: Array<{ label: string; displayValue: string; value: number }>;
    };

function toNumber(raw: string): number {
  return Number(raw.replace(/,/g, ''));
}

function cleanLabel(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim();
}

function maybeExtractBarVisual(stem: string): GmatQuestionVisual | null {
  const directPairPattern =
    /(chart|graph)[^.]*?shows\s+([a-z][a-z\s]+?)\s+of\s+\$?([\d,.]+)([a-z%]*)\s+in\s+([a-z0-9 ]+)\s+and\s+\$?([\d,.]+)([a-z%]*)\s+in\s+([a-z0-9 ]+)/i;
  const directPair = stem.match(directPairPattern);

  if (directPair) {
    const metric = cleanLabel(directPair[2]);
    const firstValue = toNumber(directPair[3]);
    const firstSuffix = directPair[4] || '';
    const firstLabel = cleanLabel(directPair[5]);
    const secondValue = toNumber(directPair[6]);
    const secondSuffix = directPair[7] || '';
    const secondLabel = cleanLabel(directPair[8]);

    if (Number.isFinite(firstValue) && Number.isFinite(secondValue)) {
      return {
        kind: 'bar',
        title: metric.charAt(0).toUpperCase() + metric.slice(1),
        rows: [
          { label: firstLabel, value: firstValue, displayValue: `${directPair[3]}${firstSuffix}` },
          { label: secondLabel, value: secondValue, displayValue: `${directPair[6]}${secondSuffix}` }
        ]
      };
    }
  }

  return null;
}

function maybeExtractTableVisual(stem: string): GmatQuestionVisual | null {
  const tablePattern =
    /In\s+([A-Za-z0-9 ]+)\s+there\s+(?:was|were)\s+([\d,]+)\s+([A-Za-z- ]+?)\s+and\s+([\d,]+)\s+([A-Za-z- ]+?)[.?,]/i;
  const match = stem.match(tablePattern);

  if (!match) return null;

  const period = cleanLabel(match[1]);
  const firstValue = toNumber(match[2]);
  const firstLabel = cleanLabel(match[3]);
  const secondValue = toNumber(match[4]);
  const secondLabel = cleanLabel(match[5]);

  if (!Number.isFinite(firstValue) || !Number.isFinite(secondValue)) {
    return null;
  }

  return {
    kind: 'table',
    title: `${period} snapshot`,
    headers: ['Metric', 'Value'],
    rows: [
      { label: firstLabel, displayValue: match[2], value: firstValue },
      { label: secondLabel, displayValue: match[4], value: secondValue }
    ]
  };
}

export function inferGmatVisual(question: GmatQuestion): GmatQuestionVisual | null {
  const stem = question.stem.trim();
  const lowered = stem.toLowerCase();

  if (lowered.includes('table')) {
    const tableVisual = maybeExtractTableVisual(stem);
    if (tableVisual) return tableVisual;
  }

  if (lowered.includes('chart') || lowered.includes('graph')) {
    const barVisual = maybeExtractBarVisual(stem);
    if (barVisual) return barVisual;
  }

  return null;
}
