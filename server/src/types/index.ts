export interface User {
  id: number;
  username: string;
  role: 'student' | 'teacher';
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
}

export interface LoanPayment {
  id: number;
  loan_id: number;
  amount: number;
  payment_date: string;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  role: 'student' | 'teacher';
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TransferRequest {
  to_username: string;
  amount: number;
  description?: string;
}

export interface LoanRequest {
  amount: number;
  term_months: number;
}

export interface DepositRequest {
  username: string;
  amount: number;
  description?: string;
}

export interface WithdrawRequest {
  username: string;
  amount: number;
  description?: string;
}

export interface LoanApprovalRequest {
  loan_id: number;
  approved: boolean;
}

export interface AuthResponse {
  token: string;
  user: User;
  account?: Account;
}

export interface TransactionWithDetails extends Transaction {
  from_username?: string;
  to_username?: string;
}

export interface LoanWithDetails extends Loan {
  borrower_username: string;
  total_paid: number;
  payments_remaining: number;
}
