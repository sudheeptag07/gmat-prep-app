import type { EncouragementTriggerType } from '@/lib/gmat-types';

type EncouragementLineProps = {
  message: string;
  triggerType: EncouragementTriggerType;
};

export function EncouragementLine({ message, triggerType }: EncouragementLineProps) {
  return (
    <p className="encouragement-line-fade-in mt-3 text-xs leading-5 text-slate-400" data-trigger-type={triggerType}>
      {message}
    </p>
  );
}
