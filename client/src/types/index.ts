export interface User {
  id: number;
  username: string;
  role: 'student' | 'teacher';
  first_name?: string;
  last_name?: string;
  class?: string;
  email?: string;
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
