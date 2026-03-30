import type { AssessmentRecord, AssessmentSubmission, DashboardSummary, LeadClassification } from '@/lib/expense-types';

export function calculateExpenseScore(input: AssessmentSubmission) {
  let score = 100;

  if (input.payment_methods.includes('Personal cards + reimbursement')) score -= 20;
  if (input.payment_methods.includes('Cash from office')) score -= 10;
  if (input.payment_methods.includes('UPI from admin/founder')) score -= 15;
  if (['WhatsApp', 'Email'].includes(input.claim_method)) score -= 20;
  if (['Excel sheet', 'Physical bills'].includes(input.claim_method)) score -= 12;
  if (input.petty_cash !== 'No') score -= 15;
  if (input.audit_difficulty === 'Difficult') score -= 18;
  if (input.audit_difficulty === 'Extremely messy') score -= 25;
  if (input.reimbursement_time === '3-7 days') score -= 8;
  if (input.reimbursement_time === 'More than a week') score -= 10;
  if (input.reimbursement_volume === '25-50') score -= 6;
  if (input.reimbursement_volume === '50+') score -= 10;
  score -= Math.min(input.pain_points.length * 4, 16);

  return Math.max(0, Math.min(100, score));
}

export function calculateLeadScore(input: AssessmentSubmission) {
  let score = 0;

  if (['26-50', '51-100', '100+'].includes(input.company_size)) score += 10;
  if (input.reimbursement_volume === '25-50') score += 12;
  if (input.reimbursement_volume === '50+') score += 20;
  if (input.payment_methods.some((item) => ['Personal cards + reimbursement', 'Cash from office', 'UPI from admin/founder'].includes(item))) score += 20;
  if (['WhatsApp', 'Email', 'Excel sheet', 'Physical bills'].includes(input.claim_method)) score += 20;
  if (['Difficult', 'Extremely messy'].includes(input.audit_difficulty)) score += 20;
  if (input.upi_wallet_interest === 'Yes') score += 10;
  if (input.demo_interest === 'Yes') score += 20;
  if (input.demo_interest === 'Maybe later') score += 8;

  return Math.max(0, Math.min(100, score));
}

export function classifyLead(leadScore: number): LeadClassification {
  if (leadScore >= 70) return 'Hot Lead';
  if (leadScore >= 40) return 'Warm Lead';
  return 'Cold Lead';
}

export function buildResultSummary(input: AssessmentSubmission, expenseScore: number) {
  const findings: string[] = [];

  if (input.claim_method === 'WhatsApp' || input.claim_method === 'Email') {
    findings.push('Claims are still moving through chat or inbox threads, which creates approval drift.');
  }
  if (input.payment_methods.includes('Personal cards + reimbursement')) {
    findings.push('Employees are fronting company spend, which usually slows reimbursements and weakens policy control.');
  }
  if (input.audit_difficulty === 'Difficult' || input.audit_difficulty === 'Extremely messy') {
    findings.push('Audit reconciliation is a clear friction point in the current process.');
  }
  if (input.pain_points.includes('Too many spreadsheets') || input.pain_points.includes('Limited visibility of spend')) {
    findings.push('Spend tracking is fragmented across manual tools, reducing real-time visibility.');
  }
  if (input.reimbursement_time === 'More than a week') {
    findings.push('Long reimbursement cycles are likely affecting employee experience and finance follow-ups.');
  }

  const maturity =
    expenseScore >= 75 ? 'relatively structured' :
    expenseScore >= 50 ? 'partially manual' :
    'highly manual';

  return `Your expense workflow is ${maturity}. ${findings.slice(0, 2).join(' ') || 'The process depends on manual coordination across employees, finance, and operations.'}`;
}

export function buildAssessmentRecord(input: AssessmentSubmission & { id: string; created_at: string }): AssessmentRecord {
  const expense_score = calculateExpenseScore(input);
  const lead_score = calculateLeadScore(input);
  return {
    ...input,
    expense_score,
    lead_score,
    lead_classification: classifyLead(lead_score),
    result_summary: buildResultSummary(input, expense_score),
    created_at: input.created_at
  };
}

export function buildDashboardSummary(responses: AssessmentRecord[]): DashboardSummary {
  const totalResponses = responses.length;
  const hotLeads = responses.filter((item) => item.lead_classification === 'Hot Lead').length;
  const warmLeads = responses.filter((item) => item.lead_classification === 'Warm Lead').length;
  const coldLeads = responses.filter((item) => item.lead_classification === 'Cold Lead').length;
  const demoRequests = responses.filter((item) => item.demo_interest === 'Yes').length;
  const averageExpenseScore = totalResponses ? Math.round(responses.reduce((sum, item) => sum + item.expense_score, 0) / totalResponses) : 0;
  const averageLeadScore = totalResponses ? Math.round(responses.reduce((sum, item) => sum + item.lead_score, 0) / totalResponses) : 0;

  return {
    totalResponses,
    hotLeads,
    warmLeads,
    coldLeads,
    demoRequests,
    averageExpenseScore,
    averageLeadScore
  };
}

export function scoreTone(score: number) {
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Moderate';
  return 'Needs attention';
}

export function getTopItems(
  records: AssessmentRecord[],
  key: keyof Pick<AssessmentRecord, 'company_size' | 'audit_difficulty' | 'city' | 'claim_method' | 'coworking_space'>
) {
  const counts = new Map<string, number>();
  for (const item of records) {
    const value = String(item[key] || 'Unknown');
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export function getTopPainPoints(records: AssessmentRecord[]) {
  const counts = new Map<string, number>();
  for (const item of records) {
    for (const painPoint of item.pain_points) {
      counts.set(painPoint, (counts.get(painPoint) || 0) + 1);
    }
  }

  return Array.from(counts.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
