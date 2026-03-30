'use client';

import { useMemo, useState } from 'react';
import type { GmatTopic } from '@/lib/gmat-types';
import type { GmatTopicCatalog } from '@/lib/gmat-taxonomy';

export function PracticeSetupForm({ topics }: { topics: GmatTopicCatalog[] }) {
  const defaultTopic = topics[0]?.topic ?? 'Quant';
  const [topic, setTopic] = useState<GmatTopic>(defaultTopic);
  const groups = useMemo(() => topics.find((item) => item.topic === topic)?.groups ?? [], [topic, topics]);
  const [groupKey, setGroupKey] = useState<string>(groups[0]?.key ?? '');
  const selectedGroup = useMemo(() => groups.find((group) => group.key === groupKey) ?? groups[0], [groupKey, groups]);
  const [subtopic, setSubtopic] = useState<string>('__all__');
  const [questionCount, setQuestionCount] = useState<number>(10);

  function handleTopicChange(nextTopic: GmatTopic) {
    setTopic(nextTopic);
    const nextGroups = topics.find((item) => item.topic === nextTopic)?.groups ?? [];
    setGroupKey(nextGroups[0]?.key ?? '');
    setSubtopic('__all__');
  }

  function handleGroupChange(nextGroupKey: string) {
    setGroupKey(nextGroupKey);
    setSubtopic('__all__');
  }

  const hrefBase = `/learn/question?topic=${encodeURIComponent(topic)}&group=${encodeURIComponent(groupKey)}&count=${questionCount}`;
  const href = subtopic !== '__all__' ? `${hrefBase}&subtopic=${encodeURIComponent(subtopic)}` : hrefBase;

  return (
    <form className="space-y-6">
      <div className="grid gap-2">
        <label htmlFor="topic" className="text-sm font-medium text-slate-200">
          Select topic
        </label>
        <select
          id="topic"
          value={topic}
          onChange={(event) => handleTopicChange(event.target.value as GmatTopic)}
          className="spectra-input px-4 py-3 text-sm"
        >
          {topics.map((entry) => (
            <option key={entry.topic} value={entry.topic}>
              {entry.topic}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="group" className="text-sm font-medium text-slate-200">
          Select group
        </label>
        <select
          id="group"
          value={groupKey}
          onChange={(event) => handleGroupChange(event.target.value)}
          className="spectra-input px-4 py-3 text-sm"
        >
          {groups.map((group) => (
            <option key={group.key} value={group.key}>
              {group.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="subtopic" className="text-sm font-medium text-slate-200">
          Select subtopic
        </label>
        <select
          id="subtopic"
          value={subtopic}
          onChange={(event) => setSubtopic(event.target.value)}
          className="spectra-input px-4 py-3 text-sm"
        >
          <option value="__all__">All subtopics in {selectedGroup?.label ?? 'this group'}</option>
          {(selectedGroup?.items ?? []).map((item) => (
            <option key={`${selectedGroup?.key}-${item}`} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label htmlFor="questionCount" className="text-sm font-medium text-slate-200">
          Number of questions
        </label>
        <select
          id="questionCount"
          value={questionCount}
          onChange={(event) => setQuestionCount(Number(event.target.value))}
          className="spectra-input px-4 py-3 text-sm"
        >
          <option value={5}>5 questions</option>
          <option value={10}>10 questions</option>
          <option value={15}>15 questions</option>
          <option value={20}>20 questions</option>
        </select>
      </div>

      <a
        href={href}
        className="inline-flex items-center justify-center rounded-full border border-[#f07e25]/60 bg-[#f07e25]/14 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#f07e25]/22"
      >
        Start Questions
      </a>
    </form>
  );
}
