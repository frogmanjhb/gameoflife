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
  interest_rate: number;
  status: 'pending' | 'approved' | 'denied' | 'active' | 'paid_off';
  outstanding_balance: number;
  monthly_payment: number;
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
  created_at: string;
  account_number: string;
  balance: number;
  last_activity: string;
}

export interface AuthContextType {
  user: User | null;
  account: Account | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role: 'student' | 'teacher', first_name?: string, last_name?: string, studentClass?: string, email?: string) => Promise<void>;
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
  answer: number;
  display: string;
}

export interface MathGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface MathGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
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
  created_at: string;
  updated_at: string;
}

export interface TownSettings {
  id: number;
  class: '6A' | '6B' | '6C';
  town_name: string;
  mayor_name?: string;
  tax_rate: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  name: string;
  description?: string;
  salary: number;
  created_at: string;
}
