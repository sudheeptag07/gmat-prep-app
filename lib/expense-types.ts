export const ROLE_OPTIONS = ['Founder', 'CFO', 'Finance Manager', 'Ops Manager', 'Admin', 'Other'] as const;
export const COMPANY_SIZE_OPTIONS = ['1-10', '11-25', '26-50', '51-100', '100+'] as const;
export const PAYMENT_METHOD_OPTIONS = [
  'Personal cards + reimbursement',
  'Cash from office',
  'UPI from admin/founder',
  'Bank transfer',
  'Company credit card',
  'Prepaid cards',
  'Other'
] as const;
export const REIMBURSEMENT_VOLUME_OPTIONS = ['Less than 10', '10-25', '25-50', '50+'] as const;
export const CLAIM_METHOD_OPTIONS = ['WhatsApp', 'Email', 'Google Forms', 'Expense software', 'Excel sheet', 'Physical bills'] as const;
export const REIMBURSEMENT_TIME_OPTIONS = ['Same day', '1-3 days', '3-7 days', 'More than a week'] as const;
export const PETTY_CASH_OPTIONS = ['Yes', 'No', 'Sometimes'] as const;
export const PETTY_CASH_MANAGER_OPTIONS = ['Founder', 'Admin', 'Finance', 'Office manager'] as const;
export const PAIN_POINT_OPTIONS = [
  'Missing bills',
  'Delayed reimbursements',
  'Tracking small expenses',
  'Audit reconciliation difficulty',
  'Too many spreadsheets',
  'Limited visibility of spend'
] as const;
export const AUDIT_DIFFICULTY_OPTIONS = ['Very easy', 'Some effort', 'Difficult', 'Extremely messy'] as const;
export const UPI_WALLET_INTEREST_OPTIONS = ['Yes', 'Maybe', 'Not sure', 'No'] as const;
export const DEMO_INTEREST_OPTIONS = ['Yes', 'Maybe later', 'No'] as const;

export type LeadClassification = 'Hot Lead' | 'Warm Lead' | 'Cold Lead';

export type AssessmentSubmission = {
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

export type AssessmentRecord = AssessmentSubmission & {
  id: string;
  expense_score: number;
  lead_score: number;
  lead_classification: LeadClassification;
  result_summary: string;
  created_at: string;
};

export type DashboardSummary = {
  totalResponses: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  demoRequests: number;
  averageExpenseScore: number;
  averageLeadScore: number;
};
