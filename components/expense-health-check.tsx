'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  AUDIT_DIFFICULTY_OPTIONS,
  CLAIM_METHOD_OPTIONS,
  COMPANY_SIZE_OPTIONS,
  DEMO_INTEREST_OPTIONS,
  PAIN_POINT_OPTIONS,
  PAYMENT_METHOD_OPTIONS,
  PETTY_CASH_MANAGER_OPTIONS,
  PETTY_CASH_OPTIONS,
  REIMBURSEMENT_TIME_OPTIONS,
  REIMBURSEMENT_VOLUME_OPTIONS,
  ROLE_OPTIONS,
  UPI_WALLET_INTEREST_OPTIONS
} from '@/lib/expense-types';

type FormState = {
  name: string;
  company: string;
  email: string;
  role: string;
  company_size: string;
  coworking_space: string;
  city: string;
  payment_methods: string[];
  reimbursement_volume: string;
  claim_method: string;
  reimbursement_time: string;
  petty_cash: string;
  petty_cash_manager: string;
  pain_points: string[];
  audit_difficulty: string;
  upi_wallet_interest: string;
  demo_interest: string;
};

const initialState: FormState = {
  name: '',
  company: '',
  email: '',
  role: '',
  company_size: '',
  coworking_space: '',
  city: '',
  payment_methods: [],
  reimbursement_volume: '',
  claim_method: '',
  reimbursement_time: '',
  petty_cash: '',
  petty_cash_manager: '',
  pain_points: [],
  audit_difficulty: '',
  upi_wallet_interest: '',
  demo_interest: ''
};

const steps = [
  { id: 'context', title: 'Company context', description: 'Tell us who is responding and where the business operates.' },
  { id: 'workflow', title: 'Expense workflow', description: 'Map the current reimbursement setup.' },
  { id: 'cash', title: 'Petty cash', description: 'Capture how ad-hoc spending is handled.' },
  { id: 'pain', title: 'Pain points', description: 'Show where finance and ops lose time.' },
  { id: 'intent', title: 'Intent', description: 'Tell CUPI whether a modern wallet flow is relevant.' }
] as const;

export function ExpenseHealthCheck() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayValue(key: 'payment_methods' | 'pain_points', value: string) {
    setForm((current) => {
      const currentValues = current[key];
      return {
        ...current,
        [key]: currentValues.includes(value)
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value]
      };
    });
  }

  function validateStep(currentStep: number) {
    if (currentStep === 0) {
      return form.name && form.company && form.email && form.role && form.company_size && form.coworking_space && form.city;
    }
    if (currentStep === 1) {
      return form.payment_methods.length > 0 && form.reimbursement_volume && form.claim_method && form.reimbursement_time;
    }
    if (currentStep === 2) {
      return form.petty_cash && (form.petty_cash === 'No' || form.petty_cash_manager);
    }
    if (currentStep === 3) {
      return form.pain_points.length > 0 && form.audit_difficulty;
    }
    return form.upi_wallet_interest && form.demo_interest;
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { response?: { id: string }; error?: unknown };
      if (!response.ok || !payload.response) {
        throw new Error('Could not submit the assessment. Please review your answers and try again.');
      }

      router.push(`/results/${payload.response.id}`);
      router.refresh();
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const progress = Math.round(((step + 1) / steps.length) * 100);
  const cardClass = 'rounded-[28px] border border-[#d8e3f7] bg-white p-5 shadow-[0_24px_80px_rgba(11,31,58,0.08)]';
  const inputClass = 'w-full rounded-2xl border border-[#d7e0ee] bg-[#f8fbff] px-4 py-3 text-sm text-[#0b1f3a] outline-none transition placeholder:text-slate-400 focus:border-[#2f6bff] focus:bg-white';
  const selectedCardClass = 'border-[#2f6bff] bg-[#eef4ff] shadow-[0_12px_32px_rgba(47,107,255,0.14)]';

  return (
    <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr]">
      <section className="space-y-6">
        <div className="rounded-[32px] border border-[#cad7ec] bg-[linear-gradient(180deg,#0b1f3a_0%,#10284c_100%)] p-8 text-white shadow-[0_30px_80px_rgba(11,31,58,0.24)]">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8db4ff]">CUPI Expense Process Health Check</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Diagnose reimbursements, petty cash, and expense control in under two minutes.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-7 text-[#d8e6ff]">
            Built for startups operating from coworking spaces. The assessment scores process maturity, flags audit friction, and helps CUPI identify teams that need a cleaner employee spend flow.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-semibold">12</p>
              <p className="mt-1 text-sm text-[#c5d6f7]">diagnostic prompts</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-semibold">100</p>
              <p className="mt-1 text-sm text-[#c5d6f7]">point workflow score</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <p className="text-3xl font-semibold">2 min</p>
              <p className="mt-1 text-sm text-[#c5d6f7]">typical completion</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#d8e3f7] bg-white/80 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[#36537a]">Progress</p>
            <p className="text-sm text-[#4c6a92]">{progress}% complete</p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7eef9]">
            <div className="h-full rounded-full bg-[linear-gradient(90deg,#2f6bff_0%,#64a3ff_100%)] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-5 space-y-3">
            {steps.map((item, index) => (
              <div key={item.id} className={`rounded-2xl border px-4 py-3 ${index === step ? 'border-[#2f6bff] bg-[#eef4ff]' : 'border-[#e3ebf8] bg-[#fbfdff]'}`}>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${index <= step ? 'bg-[#2f6bff] text-white' : 'bg-[#e8eef8] text-[#5f7595]'}`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0b1f3a]">{item.title}</p>
                    <p className="text-xs text-[#68809f]">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-[#d8e3f7] bg-white p-6 shadow-[0_24px_80px_rgba(11,31,58,0.08)] md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#5b7ec5]">{steps[step].title}</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-[#0b1f3a]">{steps[step].description}</h2>
          </div>
          <Link href="/admin-login" className="rounded-full border border-[#d5e0f0] px-4 py-2 text-xs font-medium text-[#355073] transition hover:border-[#2f6bff] hover:text-[#2f6bff]">
            Admin
          </Link>
        </div>

        <div className="mt-8 space-y-6">
          {step === 0 ? (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Respondent name</span>
                  <input value={form.name} onChange={(event) => updateField('name', event.target.value)} className={inputClass} placeholder="Aarav Mehta" />
                </label>
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Company name</span>
                  <input value={form.company} onChange={(event) => updateField('company', event.target.value)} className={inputClass} placeholder="North Dock Labs" />
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Work email</span>
                  <input type="email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className={inputClass} placeholder="aarav@northdock.com" />
                </label>
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Role</span>
                  <select value={form.role} onChange={(event) => updateField('role', event.target.value)} className={inputClass}>
                    <option value="">Select role</option>
                    {ROLE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Company size</span>
                  <select value={form.company_size} onChange={(event) => updateField('company_size', event.target.value)} className={inputClass}>
                    <option value="">Select size</option>
                    {COMPANY_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Coworking space</span>
                  <input value={form.coworking_space} onChange={(event) => updateField('coworking_space', event.target.value)} className={inputClass} placeholder="WeWork BKC" />
                </label>
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>City</span>
                  <input value={form.city} onChange={(event) => updateField('city', event.target.value)} className={inputClass} placeholder="Mumbai" />
                </label>
              </div>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <div>
                <p className="text-sm font-medium text-[#36537a]">How do employees currently pay for small company expenses?</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayValue('payment_methods', option)}
                      className={`${cardClass} text-left text-sm text-[#103152] ${form.payment_methods.includes(option) ? selectedCardClass : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Reimbursements per month</span>
                  <select value={form.reimbursement_volume} onChange={(event) => updateField('reimbursement_volume', event.target.value)} className={inputClass}>
                    <option value="">Select volume</option>
                    {REIMBURSEMENT_VOLUME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Claim submission method</span>
                  <select value={form.claim_method} onChange={(event) => updateField('claim_method', event.target.value)} className={inputClass}>
                    <option value="">Select method</option>
                    {CLAIM_METHOD_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="space-y-2 text-sm text-[#36537a]">
                  <span>Average reimbursement time</span>
                  <select value={form.reimbursement_time} onChange={(event) => updateField('reimbursement_time', event.target.value)} className={inputClass}>
                    <option value="">Select turnaround</option>
                    {REIMBURSEMENT_TIME_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {PETTY_CASH_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => updateField('petty_cash', option)}
                    className={`${cardClass} text-left text-sm text-[#103152] ${form.petty_cash === option ? selectedCardClass : ''}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <label className="space-y-2 text-sm text-[#36537a]">
                <span>Who manages petty cash?</span>
                <select
                  value={form.petty_cash_manager}
                  onChange={(event) => updateField('petty_cash_manager', event.target.value)}
                  className={inputClass}
                  disabled={form.petty_cash === 'No'}
                >
                  <option value="">{form.petty_cash === 'No' ? 'Not applicable' : 'Select owner'}</option>
                  {PETTY_CASH_MANAGER_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <div>
                <p className="text-sm font-medium text-[#36537a]">What problems occur frequently?</p>
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {PAIN_POINT_OPTIONS.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => toggleArrayValue('pain_points', option)}
                      className={`${cardClass} text-left text-sm text-[#103152] ${form.pain_points.includes(option) ? selectedCardClass : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
              <label className="space-y-2 text-sm text-[#36537a]">
                <span>During audits, how easy is expense reconciliation?</span>
                <select value={form.audit_difficulty} onChange={(event) => updateField('audit_difficulty', event.target.value)} className={inputClass}>
                  <option value="">Select difficulty</option>
                  {AUDIT_DIFFICULTY_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <label className="space-y-2 text-sm text-[#36537a]">
                <span>Would a UPI-based employee expense wallet with automatic tracking be useful?</span>
                <select value={form.upi_wallet_interest} onChange={(event) => updateField('upi_wallet_interest', event.target.value)} className={inputClass}>
                  <option value="">Select response</option>
                  {UPI_WALLET_INTEREST_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm text-[#36537a]">
                <span>Would you like a demo of CUPI?</span>
                <select value={form.demo_interest} onChange={(event) => updateField('demo_interest', event.target.value)} className={inputClass}>
                  <option value="">Select response</option>
                  {DEMO_INTEREST_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </>
          ) : null}
        </div>

        {error ? <p className="mt-6 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4ebf7] pt-6">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0}
            className="rounded-full border border-[#d4deef] px-5 py-3 text-sm font-medium text-[#335174] transition hover:border-[#2f6bff] hover:text-[#2f6bff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back
          </button>
          {step < steps.length - 1 ? (
            <button
              type="button"
              onClick={() => validateStep(step) ? setStep((current) => current + 1) : setError('Complete the current step before moving on.')}
              className="rounded-full bg-[#2f6bff] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2458d5]"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => validateStep(step) ? void handleSubmit() : setError('Complete the current step before submitting.')}
              disabled={submitting}
              className="rounded-full bg-[#0b1f3a] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#10284c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Generate my health check'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
