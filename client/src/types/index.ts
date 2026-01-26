export interface User {
  id: number;
  username: string;
  role: 'student' | 'teacher';
  first_name?: string;
  last_name?: string;
  class?: string;
  email?: string;
  job_id?: number;
  job_name?: string;
  job_description?: string;
  job_salary?: number;
  job_requirements?: string;
  job_company_name?: string;
  job_location?: string;
  profile_emoji?: string;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'loan_disbursement' | 'loan_repayment' | 'salary' | 'fine';
  description?: string;
  created_at: string;
  from_username?: string;
  to_username?: string;
}

export interface Loan {
  id: number;
  borrower_id: number;
  amount: number;
  term_months: number;
  term_weeks?: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'denied' | 'active' | 'paid_off';
  outstanding_balance: number;
  monthly_payment: number;
  weekly_payment?: number;
  next_payment_date?: string;
  last_payment_date?: string;
  job_id_at_approval?: number;
  salary_at_approval?: number;
  created_at: string;
  approved_at?: string;
  due_date?: string;
  borrower_username?: string;
  total_paid?: number;
  payments_remaining?: number;
}

export interface Student {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  email?: string;
  status?: 'pending' | 'approved' | 'denied';
  created_at: string;
  account_number: string;
  balance: number;
  last_activity: string;
  job_id?: number;
  job_name?: string;
  job_salary?: number;
}

export interface AuthContextType {
  user: User | null;
  account: Account | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: 'student' | 'teacher', first_name?: string, last_name?: string, studentClass?: string, email?: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

export interface MathGameSession {
  id: number;
  user_id: number;
  difficulty: 'easy' | 'medium' | 'hard';
  score: number;
  correct_answers: number;
  total_problems: number;
  earnings: number;
  played_at: string;
}

export interface MathGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: {
    easy: number;
    medium: number;
    hard: number;
  };
  recent_sessions: MathGameSession[];
}

export interface MathProblem {
  num1: number;
  num2: number;
  operation: '+' | '-' | '×' | '÷';
  answer?: number; // Optional - server does NOT send this to prevent cheating
  display: string;
}

export interface MathGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MathGameStartResponse {
  session: MathGameSession;
  problems: MathProblem[]; // Server-generated problems (without answers)
}

export interface MathGameAnswer {
  problem_index: number;
  answer: number;
}

export interface MathGameSubmitRequest {
  session_id: number;
  answers: MathGameAnswer[]; // Each answer with its problem index
}

export interface MathGameSubmitResponse {
  success: boolean;
  score: number;
  earnings: number;
  isNewHighScore: boolean;
}

export interface MathGameAnswerResponse {
  correct: boolean;
  problem_index: number;
}

export interface Plugin {
  id: number;
  name: string;
  enabled: boolean;
  route_path: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  town_class: '6A' | '6B' | '6C';
  created_by: number;
  created_by_username?: string;
  background_color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  enable_wiggle?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TownSettings {
  id: number;
  class: '6A' | '6B' | '6C';
  town_name: string;
  mayor_name?: string;
  tax_rate: number;
  tax_enabled: boolean;
  treasury_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  name: string;
  description?: string;
  salary: number;
  requirements?: string;
  company_name?: string;
  location?: string;
  created_at: string;
  is_fulfilled?: boolean;
  assigned_count?: number;
  assigned_to_name?: string;
}

export interface JobApplication {
  id: number;
  user_id: number;
  job_id: number;
  answers: Record<string, string | string[]>;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  job_name?: string;
  job_salary?: number;
  job_description?: string;
  job_requirements?: string;
  reviewer_username?: string;
}

export type QuestionType = 'short_answer' | 'long_answer' | 'multiple_choice' | 'yes_no';

export interface ApplicationQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // For multiple choice
}

export interface ApplicationAnswer {
  question_id: string;
  answer: string | string[];
}

// Land Registry Types
export type BiomeType = 
  | 'Savanna' 
  | 'Grassland' 
  | 'Forest' 
  | 'Fynbos' 
  | 'Nama Karoo' 
  | 'Succulent Karoo' 
  | 'Desert' 
  | 'Thicket' 
  | 'Indian Ocean Coastal Belt';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface LandParcel {
  id: number;
  grid_code: string;
  row_index: number;
  col_index: number;
  biome_type: BiomeType;
  value: number;
  risk_level: RiskLevel;
  pros: string[];
  cons: string[];
  owner_id?: number;
  owner_username?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  purchased_at?: string;
  created_at: string;
  updated_at: string;
  pending_request?: LandPurchaseRequest;
}

export interface LandPurchaseRequest {
  id: number;
  user_id: number;
  parcel_id: number;
  offered_price: number;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by?: number;
  reviewed_at?: string;
  denial_reason?: string;
  created_at: string;
  updated_at: string;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_class?: string;
  parcel_grid_code?: string;
  parcel_biome_type?: BiomeType;
  parcel_value?: number;
  reviewer_username?: string;
}

export interface LandStats {
  total_parcels: number;
  owned_parcels: number;
  available_parcels: number;
  pending_requests: number;
  biome_stats: Array<{
    biome_type: BiomeType;
    count: number;
    owned_count: number;
    avg_value: number;
  }>;
  top_owners: Array<{
    username: string;
    first_name?: string;
    last_name?: string;
    parcel_count: number;
    total_value: number;
  }>;
}

export interface MyPropertiesResponse {
  parcels: LandParcel[];
  total_count: number;
  total_value: number;
}

export interface BiomeConfig {
  baseValue: number;
  risk: RiskLevel;
  pros: string[];
  cons: string[];
  color: string;
  lightColor: string;
}

// Treasury and Tax Types
export interface TaxBracket {
  id: number;
  min_salary: number;
  max_salary?: number;
  tax_rate: number;
  created_at: string;
}

export interface TaxTransaction {
  id: number;
  user_id: number;
  town_class: '6A' | '6B' | '6C';
  gross_amount: number;
  tax_amount: number;
  net_amount: number;
  tax_rate_applied: number;
  transaction_type: 'salary' | 'bonus' | 'game_earnings';
  description?: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TreasuryTransaction {
  id: number;
  town_class: '6A' | '6B' | '6C';
  amount: number;
  transaction_type: 'tax_collection' | 'salary_payment' | 'deposit' | 'withdrawal' | 'initial_balance';
  description?: string;
  created_by?: number;
  created_at: string;
  created_by_username?: string;
}

export interface TreasuryInfo {
  treasury_balance: number;
  tax_enabled: boolean;
  tax_rate: number;
  transactions: TreasuryTransaction[];
  stats: {
    total_tax_collected: number;
    total_salaries_paid: number;
    total_deposits: number;
    total_withdrawals: number;
  };
}

export interface TaxReport {
  student_taxes: Array<{
    user_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    total_gross: number;
    total_tax_paid: number;
    total_net: number;
    payment_count: number;
  }>;
  summary: {
    total_gross: number;
    total_tax: number;
    total_net: number;
    total_payments: number;
    avg_tax_rate: number;
  };
  recent_transactions: TaxTransaction[];
}

export interface SalaryPaymentResult {
  message: string;
  paid_count: number;
  total_gross: number;
  total_tax: number;
  total_net: number;
  treasury_balance: number;
  payment_details: Array<{
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    job_name: string;
    gross_salary: number;
    tax_rate: number;
    tax_amount: number;
    net_salary: number;
  }>;
}

// Tenders Types
export type TenderStatus = 'open' | 'awarded' | 'closed';
export type TenderApplicationStatus = 'pending' | 'approved' | 'denied';

export interface Tender {
  id: number;
  town_class: '6A' | '6B' | '6C';
  name: string;
  description?: string;
  value: number;
  status: TenderStatus;
  created_by?: number;
  created_by_username?: string;
  awarded_to_user_id?: number;
  awarded_to_username?: string;
  awarded_application_id?: number;
  awarded_at?: string;
  paid?: boolean;
  paid_at?: string;
  paid_by?: number;
  created_at: string;
  // Teacher list extras
  application_count?: number;
  pending_count?: number;
  // Student list extras
  my_application_id?: number;
  my_application_status?: TenderApplicationStatus;
}

export interface TenderApplication {
  id: number;
  tender_id: number;
  applicant_id: number;
  status: TenderApplicationStatus;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_class?: string;
  reviewer_username?: string;
}
