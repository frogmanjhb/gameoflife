import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, Briefcase, Home, CreditCard, TrendingUp, TrendingDown, DollarSign, Plus, Minus,
  ArrowLeft, MapPin, Gamepad2, Pizza, ShoppingBag, FileText, Calendar,
  Clock, CheckCircle, XCircle, AlertCircle, Loader, Building2, Shield, Users, UserPlus, Scale, UserCheck
} from 'lucide-react';
import api, { jobsApi, studentsAccountantApi, studentsLawyerApi } from '../services/api';
import type { AccountantAssignmentStudent, AccountantAssignableStudent, LawyerAssignableStudent } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getDisplayJobTitle } from '../utils/jobDisplay';
import StudentEarningsBreakdown, { formatProfileCurrency } from './StudentEarningsBreakdown';
import { StudentEarningsProfile } from '../types';

interface StudentDetail {
  id?: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  email?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  job_id?: number;
  job_level?: number;
  job_name?: string;
  job_description?: string;
  job_salary?: number;
  job_company_name?: string;
  job_experience_points?: number;
  account_number: string;
  balance: number;
  last_activity?: string;
}

interface Transaction {
  id: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  transaction_type: string;
  description?: string;
  created_at: string;
  from_username?: string;
  from_first_name?: string;
  from_last_name?: string;
  to_username?: string;
  to_first_name?: string;
  to_last_name?: string;
}

interface Loan {
  id: number;
  amount: number;
  term_months: number;
  interest_rate: number;
  status: string;
  outstanding_balance: number;
  monthly_payment: number;
  weekly_payment?: number;
  created_at: string;
  approved_at?: string;
  total_paid: number;
  payments_remaining: number;
}

interface LandParcel {
  id: number;
  grid_code: string;
  biome_type: string;
  value: number;
  risk_level: string;
  purchased_at: string;
}

interface MathGameSession {
  id: number;
  difficulty: string;
  score: number;
  correct_answers: number;
  total_problems: number;
  earnings: number;
  played_at: string;
}

interface JobApplication {
  id: number;
  status: string;
  created_at: string;
  reviewed_at?: string;
  job_name: string;
  job_salary: number;
}

interface SuggestionItem {
  id: number;
  content: string;
  status: 'pending' | 'approved' | 'denied';
  reviewed_at?: string;
  reward_paid?: boolean;
  created_at: string;
}

interface BugReportItem {
  id: number;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'denied';
  reviewed_at?: string;
  reward_paid?: boolean;
  created_at: string;
}

interface Stats {
  total_transactions: number;
  total_transfers_sent: number;
  total_transfers_received: number;
  total_deposits: number;
  total_withdrawals: number;
  math_games_played: number;
  total_math_earnings: number;
  pizza_contributions_total: number;
  shop_purchases_total: number;
  insurance_purchases_total?: number;
  land_parcels_owned: number;
  land_value_total: number;
  active_loans: number;
  total_loan_debt: number;
   total_wordle_games?: number;
   total_wordle_earnings?: number;
   total_wordle_xp?: number;
   total_job_challenge_sessions?: number;
   total_job_challenge_xp?: number;
}

interface InsurancePurchase {
  id: number;
  insurance_type: string;
  weeks: number;
  total_cost: number;
  week_start_date: string;
  created_at: string;
}

interface StudentDetailData {
  account?: {
    account_number: string;
    balance: number;
    created_at?: string;
    last_activity?: string;
    orphaned?: boolean;
  };
  student: StudentDetail | null;
  transactions: Transaction[];
  loans: Loan[];
  landParcels: LandParcel[];
  mathGameSessions: MathGameSession[];
  pizzaContributions: any[];
  shopPurchases: any[];
  insurancePurchases?: InsurancePurchase[];
  jobApplications: JobApplication[];
  suggestions: SuggestionItem[];
  bugReports: BugReportItem[];
  stats: Stats;
  earnings_profile?: StudentEarningsProfile | null;
}

const StudentDetailView: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const { accountNumber } = useParams<{ accountNumber?: string }>();
  const identifier = accountNumber || username || '';
  const navigate = useNavigate();
  const [data, setData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'loans' | 'property' | 'activities'>('overview');
  const { user, impersonateStudent } = useAuth();
  const isTeacher = user?.role === 'teacher';
  const canImpersonate = isTeacher && user?.allow_teacher_impersonation;
  const [impersonateLoading, setImpersonateLoading] = useState(false);
  const [impersonateError, setImpersonateError] = useState('');

  // Teacher add/remove actions (shown under "Transfer Activity" in the overview tab)
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showAddMoneyForm, setShowAddMoneyForm] = useState(false);
  const [showRemoveMoneyForm, setShowRemoveMoneyForm] = useState(false);
  const [showAddXpForm, setShowAddXpForm] = useState(false);
  const [showRemoveXpForm, setShowRemoveXpForm] = useState(false);
  const [moneyAmount, setMoneyAmount] = useState('');
  const [xpAmount, setXpAmount] = useState('');
  const [accountantClients, setAccountantClients] = useState<AccountantAssignmentStudent[]>([]);
  const [accountantAssignable, setAccountantAssignable] = useState<AccountantAssignableStudent[]>([]);
  const [accountantManualMode, setAccountantManualMode] = useState(false);
  const [accountantAssignmentsLoading, setAccountantAssignmentsLoading] = useState(false);
  const [accountantAssignmentsError, setAccountantAssignmentsError] = useState('');
  const [accountantAssignmentActionError, setAccountantAssignmentActionError] = useState('');
  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');
  const [accountantAssignmentSaving, setAccountantAssignmentSaving] = useState(false);
  const [lawyerClients, setLawyerClients] = useState<AccountantAssignmentStudent[]>([]);
  const [lawyerAssignable, setLawyerAssignable] = useState<LawyerAssignableStudent[]>([]);
  const [lawyerManualMode, setLawyerManualMode] = useState(false);
  const [lawyerAssignmentsLoading, setLawyerAssignmentsLoading] = useState(false);
  const [lawyerAssignmentsError, setLawyerAssignmentsError] = useState('');
  const [lawyerAssignmentActionError, setLawyerAssignmentActionError] = useState('');
  const [selectedLawyerStudentToAdd, setSelectedLawyerStudentToAdd] = useState('');
  const [lawyerAssignmentSaving, setLawyerAssignmentSaving] = useState(false);

  const isAccountantJob = (jobName?: string | null) =>
    (jobName || '').toLowerCase().includes('accountant');
  const isLawyerJob = (jobName?: string | null) => {
    const n = (jobName || '').toLowerCase();
    return n.includes('lawyer');
  };

  useEffect(() => {
    fetchStudentDetails();
  }, [identifier]);

  const fetchAccountantAssignments = async (username: string) => {
    try {
      setAccountantAssignmentsLoading(true);
      setAccountantAssignmentsError('');
      const response = await studentsAccountantApi.getAssignments(username);
      setAccountantClients(response.data.clients || []);
      setAccountantAssignable(response.data.assignable || []);
      setAccountantManualMode(response.data.manual_mode);
    } catch (err: any) {
      setAccountantAssignmentsError(err.response?.data?.error || 'Failed to load accountant assignments');
      setAccountantClients([]);
      setAccountantAssignable([]);
    } finally {
      setAccountantAssignmentsLoading(false);
    }
  };

  const fetchStudentDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check if we have accountNumber param or if identifier looks like an account number (starts with ACC)
      const isAccountNumber = accountNumber || identifier?.startsWith('ACC');
      
      let response;
      if (isAccountNumber) {
        // Try account number endpoint first
        try {
          response = await api.get(`/students/account/${identifier}/details`);
        } catch (accountErr: any) {
          // If account endpoint fails, try username endpoint as fallback
          response = await api.get(`/students/${identifier}/details`);
        }
      } else {
        // Try username endpoint first
        try {
          response = await api.get(`/students/${identifier}/details`);
        } catch (usernameErr: any) {
          // If username fails with 404, it might be an account number
          if (usernameErr.response?.status === 404) {
            response = await api.get(`/students/account/${identifier}/details`);
          } else {
            throw usernameErr;
          }
        }
      }
      
      setData(response.data);
      const loadedStudent = response.data?.student;
      if (isTeacher && loadedStudent?.username && isAccountantJob(loadedStudent.job_name)) {
        fetchAccountantAssignments(loadedStudent.username);
      } else {
        setAccountantClients([]);
        setAccountantAssignable([]);
        setAccountantAssignmentsError('');
      }
      if (isTeacher && loadedStudent?.username && isLawyerJob(loadedStudent.job_name)) {
        fetchLawyerAssignments(loadedStudent.username);
      } else {
        setLawyerClients([]);
        setLawyerAssignable([]);
        setLawyerAssignmentsError('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load student details');
    } finally {
      setLoading(false);
    }
  };

  const fetchLawyerAssignments = async (username: string) => {
    try {
      setLawyerAssignmentsLoading(true);
      setLawyerAssignmentsError('');
      const response = await studentsLawyerApi.getAssignments(username);
      setLawyerClients(response.data.clients || []);
      setLawyerAssignable(response.data.assignable || []);
      setLawyerManualMode(response.data.manual_mode);
    } catch (err: any) {
      setLawyerAssignmentsError(err.response?.data?.error || 'Failed to load lawyer assignments');
      setLawyerClients([]);
      setLawyerAssignable([]);
    } finally {
      setLawyerAssignmentsLoading(false);
    }
  };

  const handleLawyerAssignment = async (
    lawyerUsername: string,
    targetStudentId: number,
    action: 'add' | 'remove'
  ) => {
    try {
      setLawyerAssignmentSaving(true);
      setLawyerAssignmentActionError('');
      await studentsLawyerApi.updateAssignment(lawyerUsername, targetStudentId, action);
      if (action === 'add') setSelectedLawyerStudentToAdd('');
      await fetchLawyerAssignments(lawyerUsername);
    } catch (err: any) {
      setLawyerAssignmentActionError(err.response?.data?.error || 'Failed to update assignment');
    } finally {
      setLawyerAssignmentSaving(false);
    }
  };

  const handleAccountantAssignment = async (
    accountantUsername: string,
    targetStudentId: number,
    action: 'add' | 'remove'
  ) => {
    try {
      setAccountantAssignmentSaving(true);
      setAccountantAssignmentActionError('');
      const response = await studentsAccountantApi.updateAssignment(accountantUsername, targetStudentId, action);
      setAccountantClients(response.data.clients || []);
      setAccountantManualMode(response.data.manual_mode);
      if (action === 'add') {
        setSelectedStudentToAdd('');
      }
      await fetchAccountantAssignments(accountantUsername);
    } catch (err: any) {
      setAccountantAssignmentActionError(err.response?.data?.error || 'Failed to update assignment');
    } finally {
      setAccountantAssignmentSaving(false);
    }
  };

  const formatStudentDisplayName = (s: {
    first_name?: string;
    last_name?: string;
    username: string;
  }) =>
    s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderStatusPill = (status: string, rewardPaid?: boolean) => {
    const base = 'text-xs px-2 py-1 rounded-full flex items-center space-x-1';
    if (status === 'approved' || status === 'verified') {
      return (
        <span className={`${base} bg-green-100 text-green-700`}>
          <CheckCircle className="h-3 w-3" />
          <span>{rewardPaid ? 'Approved • Paid' : 'Approved'}</span>
        </span>
      );
    }
    if (status === 'denied') {
      return (
        <span className={`${base} bg-red-100 text-red-700`}>
          <XCircle className="h-3 w-3" />
          <span>Denied</span>
        </span>
      );
    }
    return (
      <span className={`${base} bg-yellow-100 text-yellow-700`}>
        <AlertCircle className="h-3 w-3" />
        <span>Pending</span>
      </span>
    );
  };

  const getDisplayName = (student: StudentDetail | null) => {
    if (!student) return 'Unknown';
    if (student.first_name && student.last_name) {
      return `${student.first_name} ${student.last_name}`;
    }
    return student.username || student.account_number || 'Unknown';
  };

  // For police fine/bonus descriptions formatted as "Police fine | reason | Approved by Name (XX)"
  // extract just the human-readable reason part for the subtitle.
  const getTransactionSubtitle = (tx: Transaction) => {
    if (!tx.description) return tx.transaction_type;
    const parts = tx.description.split('|').map((p) => p.trim());
    if (parts.length >= 2 && (parts[0].toLowerCase().startsWith('police fine') || parts[0].toLowerCase().startsWith('police bonus'))) {
      // "reason | Approved by …" — return reason if present, otherwise "Approved by …"
      return parts.length >= 3 ? parts[1] : parts[1];
    }
    return tx.description;
  };

  const getTransactionLabel = (tx: Transaction, currentUsername: string) => {
    if (tx.from_username === currentUsername && tx.to_username === currentUsername) {
      return 'Internal';
    }
    if (tx.from_username === currentUsername) {
      const toName = tx.to_first_name && tx.to_last_name 
        ? `${tx.to_first_name} ${tx.to_last_name}` 
        : tx.to_username || null;
      if (toName) return `To ${toName}`;
      // No counterpart account — derive from description (e.g. police fine)
      if (tx.transaction_type === 'fine') {
        const approvedBy = tx.description?.match(/Approved by ([^(]+)/)?.[1]?.trim();
        return approvedBy ? `Police fine — approved by ${approvedBy}` : 'Police fine';
      }
      return tx.transaction_type;
    }
    if (tx.to_username === currentUsername) {
      const fromName = tx.from_first_name && tx.from_last_name 
        ? `${tx.from_first_name} ${tx.from_last_name}` 
        : tx.from_username || null;
      if (fromName) return `From ${fromName}`;
      // No counterpart account — derive from description (e.g. police bonus)
      if (tx.description?.toLowerCase().startsWith('police bonus')) {
        const approvedBy = tx.description?.match(/Approved by ([^(]+)/)?.[1]?.trim();
        return approvedBy ? `Police bonus — approved by ${approvedBy}` : 'Police bonus';
      }
      if (tx.transaction_type === 'deposit') {
        const approvedBy = tx.description?.match(/Approved by ([^(]+)/)?.[1]?.trim();
        return approvedBy ? `Bonus — approved by ${approvedBy}` : 'Bonus';
      }
      return tx.transaction_type;
    }
    return tx.transaction_type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load student details'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { account, student, transactions, loans, landParcels, mathGameSessions, pizzaContributions, shopPurchases, insurancePurchases = [], jobApplications, suggestions, bugReports, stats, earnings_profile } = data;
  
  // Handle orphaned accounts (account without student)
  const displayStudent = student || (account ? {
    account_number: account.account_number,
    balance: account.balance,
    username: account.account_number,
    first_name: undefined,
    last_name: undefined
  } : null);
  
  if (!displayStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">No account or student data found</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const targetUsername = student?.username || (username ? username : displayStudent.username);
  const targetStudentId = student?.id ?? null;
  const canManage = isTeacher && !!targetUsername && !!targetStudentId;

  const handleAddMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername || !targetStudentId || !isTeacher) return;

    const amount = parseFloat(moneyAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Amount must be greater than 0');
      setActionSuccess('');
      return;
    }

    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    try {
      const response = await api.post('/transactions/deposit', {
        username: targetUsername,
        amount,
        description: 'Deposit by teacher',
      });
      setActionSuccess(response.data?.message || 'Deposit successful');
      setMoneyAmount('');
      setShowAddMoneyForm(false);
      await fetchStudentDetails();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Deposit failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMoney = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUsername || !targetStudentId || !isTeacher) return;

    const amount = parseFloat(moneyAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setActionError('Amount must be greater than 0');
      setActionSuccess('');
      return;
    }

    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    try {
      const response = await api.post('/transactions/withdraw', {
        username: targetUsername,
        amount,
        description: 'Withdrawal by teacher',
      });
      setActionSuccess(response.data?.message || 'Withdrawal successful');
      setMoneyAmount('');
      setShowRemoveMoneyForm(false);
      await fetchStudentDetails();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Withdrawal failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddXp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !isTeacher) return;

    const xp = parseInt(xpAmount, 10);
    if (!Number.isFinite(xp) || xp < 1) {
      setActionError('XP amount must be a positive integer');
      setActionSuccess('');
      return;
    }

    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    try {
      const response = await jobsApi.awardXP(targetStudentId, xp);
      setActionSuccess(response.data?.message || `Added ${xp} XP`);
      setXpAmount('');
      setShowAddXpForm(false);
      await fetchStudentDetails();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to add XP');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveXp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !isTeacher) return;

    const xp = parseInt(xpAmount, 10);
    if (!Number.isFinite(xp) || xp < 1) {
      setActionError('XP amount must be a positive integer');
      setActionSuccess('');
      return;
    }

    setActionError('');
    setActionSuccess('');
    setActionLoading(true);

    try {
      const response = await jobsApi.removeXP(targetStudentId, xp);
      setActionSuccess(response.data?.message || `Removed ${xp} XP`);
      setXpAmount('');
      setShowRemoveXpForm(false);
      await fetchStudentDetails();
    } catch (err: any) {
      setActionError(err.response?.data?.error || 'Failed to remove XP');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Teacher add/remove modals */}
      {showAddMoneyForm && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Money to {targetUsername}
            </h3>
            <form onSubmit={handleAddMoney} className="space-y-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="input-field"
                  placeholder="0.00"
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {actionError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-success disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add Money'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMoneyForm(false)}
                  className="flex-1 btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRemoveMoneyForm && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Money from {targetUsername}
            </h3>
            <form onSubmit={handleRemoveMoney} className="space-y-4">
              <div>
                <label className="label">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="input-field"
                  placeholder="0.00"
                  value={moneyAmount}
                  onChange={(e) => setMoneyAmount(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {actionError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-warning disabled:opacity-50"
                >
                  {actionLoading ? 'Removing...' : 'Remove Money'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemoveMoneyForm(false)}
                  className="flex-1 btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddXpForm && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add XP to {targetUsername}
            </h3>
            <form onSubmit={handleAddXp} className="space-y-4">
              <div>
                <label className="label">XP Amount</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  className="input-field"
                  placeholder="e.g., 50"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {actionError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-success disabled:opacity-50"
                >
                  {actionLoading ? 'Adding...' : 'Add XP'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddXpForm(false)}
                  className="flex-1 btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRemoveXpForm && canManage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove XP from {targetUsername}
            </h3>
            <form onSubmit={handleRemoveXp} className="space-y-4">
              <div>
                <label className="label">XP Amount</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  className="input-field"
                  placeholder="e.g., 25"
                  value={xpAmount}
                  onChange={(e) => setXpAmount(e.target.value)}
                  disabled={actionLoading}
                />
              </div>

              {actionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {actionError}
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 btn-warning disabled:opacity-50"
                >
                  {actionLoading ? 'Removing...' : 'Remove XP'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRemoveXpForm(false)}
                  className="flex-1 btn-secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Dashboard</span>
            </button>
            {canImpersonate && student?.id && (
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  disabled={impersonateLoading}
                  onClick={async () => {
                    if (!student?.id) return;
                    setImpersonateError('');
                    setImpersonateLoading(true);
                    try {
                      await impersonateStudent(student.id);
                    } catch (err: any) {
                      setImpersonateError(err.response?.data?.error || err.message || 'Failed to switch to student');
                      setImpersonateLoading(false);
                    }
                  }}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {impersonateLoading ? 'Switching...' : 'Test as this student'}
                </button>
                {impersonateError && (
                  <p className="text-sm text-red-600 max-w-xs text-right">{impersonateError}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Student Profile Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-4 rounded-full">
                <User className="h-12 w-12" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-1">{getDisplayName(displayStudent)}</h1>
                <p className="text-primary-100 mb-2">@{displayStudent.username || displayStudent.account_number}</p>
                <div className="flex items-center space-x-3">
                  {displayStudent.class && (
                    <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                      Class {displayStudent.class}
                    </span>
                  )}
                  {displayStudent.email && (
                    <span className="text-sm text-primary-100">{displayStudent.email}</span>
                  )}
                  {account?.orphaned && (
                    <span className="bg-yellow-500/20 px-3 py-1 rounded-full text-sm text-yellow-200">
                      Orphaned Account
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-primary-100 text-sm mb-1">Current Balance</p>
              <p className={`text-4xl font-bold ${Number(displayStudent.balance) < 0 ? 'text-red-300' : 'text-white'}`}>
                {formatCurrency(displayStudent.balance)}
              </p>
              <p className="text-xs text-primary-200 mt-1">Account: {displayStudent.account_number}</p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(earnings_profile?.money.total_earned ?? stats.total_math_earnings + (stats.total_wordle_earnings ?? 0))}
            </p>
            {earnings_profile && (
              <p className="text-xs text-gray-500 mt-1">Chores, games, salary &amp; tasks</p>
            )}
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Total Spent</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.total_withdrawals + stats.shop_purchases_total + stats.pizza_contributions_total + (stats.insurance_purchases_total ?? 0))}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <Home className="h-4 w-4" />
              <span className="text-xs font-medium">Property Value</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.land_value_total)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.land_parcels_owned} parcels</p>
          </div>

          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-2">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium">Loan Debt</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(stats.total_loan_debt)}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stats.active_loans} active</p>
          </div>
        </div>

        {earnings_profile && (
          <StudentEarningsBreakdown profile={earnings_profile} />
        )}

        {/* Job Info */}
        {displayStudent.job_name && (
          <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Current Job</h2>
                <p className="text-sm text-gray-500">Employment Details</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Position</p>
                <p className="text-lg font-semibold text-gray-900">{getDisplayJobTitle(student.job_name, student.job_level)}</p>
              </div>
              {student.job_company_name && (
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="text-lg font-semibold text-gray-900">{student.job_company_name}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Salary</p>
                <p className="text-lg font-semibold text-green-600">{formatCurrency(displayStudent.job_salary || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Level &amp; XP</p>
                <p className="text-lg font-semibold text-indigo-700">
                  Level {student.job_level ?? 1}
                  <span className="text-sm text-gray-500 ml-2">
                    ({student.job_experience_points ?? 0} XP)
                  </span>
                </p>
              </div>
              {displayStudent.job_description && (
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-700">{displayStudent.job_description}</p>
                </div>
              )}
            </div>

            {isTeacher && student?.username && isAccountantJob(student.job_name) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Assigned Students</h3>
                    <p className="text-sm text-gray-500">
                      Students and other accountants this role reviews for transfer approvals. Links can overlap across multiple accountants.
                      {accountantManualMode ? ' (teacher-managed)' : ' (auto-distributed until you change assignments)'}
                    </p>
                  </div>
                </div>

                {accountantAssignmentsLoading && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Loading assignments...</span>
                  </div>
                )}

                {accountantAssignmentsError && !accountantAssignmentsLoading && (
                  <p className="text-sm text-red-600">{accountantAssignmentsError}</p>
                )}

                {accountantAssignmentActionError && (
                  <p className="text-sm text-red-600 mb-2">{accountantAssignmentActionError}</p>
                )}

                {!accountantAssignmentsLoading && !accountantAssignmentsError && (
                  <>
                    {accountantClients.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {accountantClients.map((client) => (
                          <li
                            key={client.id}
                            className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {formatStudentDisplayName(client)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAccountantAssignment(student!.username!, client.id, 'remove')}
                              disabled={accountantAssignmentSaving}
                              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Minus className="h-3 w-3" />
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">No students assigned yet.</p>
                    )}

                    {accountantAssignable.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex-1">
                          <label className="text-sm text-gray-500 block mb-1">Add student or accountant from town class</label>
                          <select
                            value={selectedStudentToAdd}
                            onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                            className="input-field w-full"
                            disabled={accountantAssignmentSaving}
                          >
                            <option value="">Select a student...</option>
                            {accountantAssignable
                              .filter((s) => !accountantClients.some((c) => c.id === s.id))
                              .map((s) => {
                              const isAccountantPeer = (s.job_name || '').toLowerCase().includes('accountant');
                              const name = `${formatStudentDisplayName(s)}${isAccountantPeer ? ' (Accountant)' : ''}`;
                              const otherAccountants = (s.assigned_accountants ?? []).filter(
                                (a) => a.accountant_user_id !== student?.id
                              );
                              const formatAccountantName = (a: {
                                accountant_first_name?: string | null;
                                accountant_last_name?: string | null;
                                accountant_username: string;
                              }) =>
                                a.accountant_first_name && a.accountant_last_name
                                  ? `${a.accountant_first_name} ${a.accountant_last_name}`
                                  : a.accountant_username;
                              const assignedLabel =
                                otherAccountants.length > 0
                                  ? ` — also with ${otherAccountants.map(formatAccountantName).join(', ')}`
                                  : '';
                              return (
                                <option key={s.id} value={String(s.id)}>
                                  {name}{assignedLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const id = parseInt(selectedStudentToAdd, 10);
                            if (id) handleAccountantAssignment(student!.username!, id, 'add');
                          }}
                          disabled={accountantAssignmentSaving || !selectedStudentToAdd}
                          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Add Student</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {isTeacher && student?.username && isLawyerJob(student.job_name) && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900">Assigned Clients</h3>
                    <p className="text-sm text-gray-500">
                      Students (and other lawyers) this lawyer represents for fines and bonuses (~10 each with overlap).
                      {lawyerManualMode ? ' (teacher-managed)' : ' (auto-distributed until you change assignments)'}
                    </p>
                  </div>
                </div>

                {lawyerAssignmentsLoading && (
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Loading assignments...</span>
                  </div>
                )}

                {lawyerAssignmentsError && !lawyerAssignmentsLoading && (
                  <p className="text-sm text-red-600">{lawyerAssignmentsError}</p>
                )}

                {lawyerAssignmentActionError && (
                  <p className="text-sm text-red-600 mb-2">{lawyerAssignmentActionError}</p>
                )}

                {!lawyerAssignmentsLoading && !lawyerAssignmentsError && (
                  <>
                    {lawyerClients.length > 0 ? (
                      <ul className="space-y-2 mb-4">
                        {lawyerClients.map((client) => (
                          <li
                            key={client.id}
                            className="flex items-center justify-between gap-3 py-2 px-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm font-medium text-gray-900">
                              {formatStudentDisplayName(client)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleLawyerAssignment(student!.username!, client.id, 'remove')}
                              disabled={lawyerAssignmentSaving}
                              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 flex items-center gap-1"
                            >
                              <Minus className="h-3 w-3" />
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 mb-4">No clients assigned yet.</p>
                    )}

                    {lawyerAssignable.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                        <div className="flex-1">
                          <label className="text-sm text-gray-500 block mb-1">Add client from town class</label>
                          <select
                            value={selectedLawyerStudentToAdd}
                            onChange={(e) => setSelectedLawyerStudentToAdd(e.target.value)}
                            className="input-field w-full"
                            disabled={lawyerAssignmentSaving}
                          >
                            <option value="">Select a student...</option>
                            {lawyerAssignable
                              .filter((s) => !lawyerClients.some((c) => c.id === s.id))
                              .map((s) => {
                                const isLawyerPeer = isLawyerJob(s.job_name);
                                const name = `${formatStudentDisplayName(s)}${isLawyerPeer ? ' (Lawyer)' : ''}`;
                                const otherLawyers = (s.assigned_lawyers ?? []).filter(
                                  (a) => a.lawyer_user_id !== student?.id
                                );
                                const formatLawyerName = (a: LawyerAssignableStudent['assigned_lawyers'][0]) =>
                                  a.lawyer_first_name && a.lawyer_last_name
                                    ? `${a.lawyer_first_name} ${a.lawyer_last_name}`
                                    : a.lawyer_username;
                                const assignedLabel =
                                  otherLawyers.length > 0
                                    ? ` — also with ${otherLawyers.map(formatLawyerName).join(', ')}`
                                    : '';
                                return (
                                  <option key={s.id} value={String(s.id)}>
                                    {name}{assignedLabel}
                                  </option>
                                );
                              })}
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const id = parseInt(selectedLawyerStudentToAdd, 10);
                            if (id) handleLawyerAssignment(student!.username!, id, 'add');
                          }}
                          disabled={lawyerAssignmentSaving || !selectedLawyerStudentToAdd}
                          className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          <span>Add Client</span>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'transactions', label: 'Transactions', icon: DollarSign },
                { id: 'loans', label: 'Loans', icon: CreditCard },
                { id: 'property', label: 'Property', icon: Home },
                { id: 'activities', label: 'Activities', icon: Gamepad2 }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Quick Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Total Transactions</span>
                        <span className="font-semibold text-gray-900">{stats.total_transactions}</span>
                      </div>
                      {earnings_profile && (
                        <>
                          <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                            <span className="text-sm text-gray-600">Total Job XP</span>
                            <span className="font-semibold text-indigo-700">{earnings_profile.xp.total} XP</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                            <span className="text-sm text-gray-600">Tracked earnings</span>
                            <span className="font-semibold text-green-700">
                              {formatProfileCurrency(earnings_profile.money.total_earned)}
                            </span>
                          </div>
                        </>
                      )}
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Pizza Contributions</span>
                        <span className="font-semibold text-orange-600">{formatCurrency(stats.pizza_contributions_total)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-600">Shop Purchases</span>
                        <span className="font-semibold text-blue-600">{formatCurrency(stats.shop_purchases_total)}</span>
                      </div>
                      {(stats.insurance_purchases_total ?? 0) > 0 && (
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-600">Insurance Purchases</span>
                          <span className="font-semibold text-purple-600">
                            {formatCurrency(stats.insurance_purchases_total ?? 0)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transfer Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Transfer Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-600">Sent to Students</span>
                        </div>
                        <span className="font-semibold text-green-600">{formatCurrency(stats.total_transfers_sent)}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-blue-600" />
                          <span className="text-sm text-gray-600">Received from Students</span>
                        </div>
                        <span className="font-semibold text-blue-600">{formatCurrency(stats.total_transfers_received)}</span>
                      </div>
                      <div className="p-3 bg-gray-100 rounded-lg border border-gray-300">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">Net Transfer</span>
                          <span className={`font-bold ${stats.total_transfers_received - stats.total_transfers_sent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(stats.total_transfers_received - stats.total_transfers_sent)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManage && (
                      <div className="mt-4">
                        <h4 className="text-md font-semibold text-gray-900 mb-3">Add or Remove</h4>

                        {actionError && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-3">
                            {actionError}
                          </div>
                        )}
                        {actionSuccess && (
                          <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg mb-3">
                            {actionSuccess}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setActionError('');
                              setActionSuccess('');
                              setMoneyAmount('');
                              setShowAddMoneyForm(true);
                              setShowRemoveMoneyForm(false);
                              setShowAddXpForm(false);
                              setShowRemoveXpForm(false);
                            }}
                            className="btn-success text-sm"
                          >
                            <Plus className="h-4 w-4 inline mr-2" />
                            Add Money
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionError('');
                              setActionSuccess('');
                              setMoneyAmount('');
                              setShowAddMoneyForm(false);
                              setShowRemoveMoneyForm(true);
                              setShowAddXpForm(false);
                              setShowRemoveXpForm(false);
                            }}
                            className="btn-warning text-sm"
                          >
                            <Minus className="h-4 w-4 inline mr-2" />
                            Remove Money
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionError('');
                              setActionSuccess('');
                              setXpAmount('');
                              setShowAddMoneyForm(false);
                              setShowRemoveMoneyForm(false);
                              setShowAddXpForm(true);
                              setShowRemoveXpForm(false);
                            }}
                            className="btn-success text-sm"
                          >
                            <Plus className="h-4 w-4 inline mr-2" />
                            Add XP
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActionError('');
                              setActionSuccess('');
                              setXpAmount('');
                              setShowAddMoneyForm(false);
                              setShowRemoveMoneyForm(false);
                              setShowAddXpForm(false);
                              setShowRemoveXpForm(true);
                            }}
                            className="btn-warning text-sm"
                          >
                            <Minus className="h-4 w-4 inline mr-2" />
                            Remove XP
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-2">
                    {transactions.slice(0, 5).map((tx) => {
                      const isOutgoing = tx.from_username === (displayStudent.username || displayStudent.account_number);
                      return (
                        <div key={tx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}>
                              {isOutgoing ? (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{getTransactionLabel(tx, displayStudent.username || displayStudent.account_number || '')}</p>
                              <p className="text-xs text-gray-500">{getTransactionSubtitle(tx)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                              {isOutgoing ? '-' : '+'}{formatCurrency(tx.amount)}
                            </p>
                            <p className="text-xs text-gray-500">{formatShortDate(tx.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Transactions ({transactions.length})</h3>
                </div>
                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No transactions yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {transactions.map((tx) => {
                      const isOutgoing = tx.from_username === (displayStudent.username || displayStudent.account_number);
                      return (
                        <div key={tx.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3 flex-1">
                              <div className={`p-2 rounded-full mt-1 ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}>
                                {isOutgoing ? (
                                  <TrendingDown className="h-4 w-4 text-red-600" />
                                ) : (
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-1">
                                  <p className="text-sm font-medium text-gray-900">{getTransactionLabel(tx, displayStudent.username || displayStudent.account_number || '')}</p>
                                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                                    {tx.transaction_type}
                                  </span>
                                </div>
                                {tx.description && (
                                  <p className="text-sm text-gray-600 mb-1">{getTransactionSubtitle(tx)}</p>
                                )}
                                <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className={`text-lg font-bold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                                {isOutgoing ? '-' : '+'}{formatCurrency(tx.amount)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Loans Tab */}
            {activeTab === 'loans' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Loans ({loans.length})</h3>
                </div>
                {loans.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No loans</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {loans.map((loan) => (
                      <div key={loan.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-purple-500">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <p className="text-lg font-bold text-gray-900">{formatCurrency(loan.amount)}</p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                loan.status === 'active' ? 'bg-green-100 text-green-700' :
                                loan.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                loan.status === 'paid_off' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {loan.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              {loan.term_months} months • {loan.interest_rate}% interest
                            </p>
                          </div>
                          {loan.status === 'active' && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Outstanding</p>
                              <p className="text-lg font-bold text-purple-600">{formatCurrency(loan.outstanding_balance)}</p>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Weekly Payment</p>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(loan.weekly_payment || loan.monthly_payment / 4.33)}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Paid</p>
                            <p className="font-semibold text-green-600">{formatCurrency(loan.total_paid)}</p>
                          </div>
                          {loan.status === 'active' && (
                            <div>
                              <p className="text-gray-500">Payments Left</p>
                              <p className="font-semibold text-gray-900">{loan.payments_remaining}</p>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          Created: {formatShortDate(loan.created_at)}
                          {loan.approved_at && ` • Approved: ${formatShortDate(loan.approved_at)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Property Tab */}
            {activeTab === 'property' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Land Parcels ({landParcels.length})</h3>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Value</p>
                    <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.land_value_total)}</p>
                  </div>
                </div>
                {landParcels.length === 0 ? (
                  <div className="text-center py-12">
                    <Home className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No land parcels owned</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {landParcels.map((parcel) => (
                      <div key={parcel.id} className="bg-gray-50 rounded-lg p-4 border-l-4 border-green-500">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-lg font-bold text-gray-900">{parcel.grid_code}</p>
                            <p className="text-sm text-gray-600">{parcel.biome_type}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">{formatCurrency(parcel.value)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              parcel.risk_level === 'low' ? 'bg-green-100 text-green-700' :
                              parcel.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {parcel.risk_level} risk
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">Purchased: {formatShortDate(parcel.purchased_at)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activities Tab */}
            {activeTab === 'activities' && (
              <div className="space-y-6">
                {/* Chores Game Sessions */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Chores Game Sessions ({mathGameSessions.length})</h3>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Earnings</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(stats.total_math_earnings)}</p>
                    </div>
                  </div>
                  {mathGameSessions.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg">
                      <Gamepad2 className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No chores games played yet</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-3">
                      {mathGameSessions.slice(0, 10).map((session) => (
                        <div key={session.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Gamepad2 className="h-4 w-4 text-blue-600" />
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                session.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                session.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                session.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                                'bg-purple-100 text-purple-700'
                              }`}>
                                {session.difficulty}
                              </span>
                            </div>
                            <p className="text-sm font-bold text-green-600">+{formatCurrency(session.earnings)}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Score: {session.score}</span>
                            <span className="text-gray-600">{session.correct_answers}/{session.total_problems} correct</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(session.played_at)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pizza Contributions */}
                {pizzaContributions.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Pizza Contributions</h3>
                      <p className="text-lg font-bold text-orange-600">{formatCurrency(stats.pizza_contributions_total)}</p>
                    </div>
                    <div className="space-y-2">
                      {pizzaContributions.map((contrib, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Pizza className="h-4 w-4 text-orange-600" />
                            <span className="text-sm text-gray-700">{contrib.description}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-orange-600">{formatCurrency(contrib.amount)}</p>
                            <p className="text-xs text-gray-500">{formatShortDate(contrib.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Shop Purchases */}
                {shopPurchases.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Shop Purchases</h3>
                      <p className="text-lg font-bold text-blue-600">{formatCurrency(stats.shop_purchases_total)}</p>
                    </div>
                    <div className="space-y-2">
                      {shopPurchases.map((purchase, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                            <span className="text-sm text-gray-700">{purchase.description}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-blue-600">{formatCurrency(purchase.amount)}</p>
                            <p className="text-xs text-gray-500">{formatShortDate(purchase.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insurance Purchases */}
                {insurancePurchases.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Insurance</h3>
                      <p className="text-lg font-bold text-teal-600">{formatCurrency(stats.insurance_purchases_total ?? 0)}</p>
                    </div>
                    <div className="space-y-2">
                      {insurancePurchases.map((p) => (
                        <div key={p.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-teal-600" />
                            <span className="text-sm text-gray-700 capitalize">{p.insurance_type}</span>
                            <span className="text-xs text-gray-500">{p.weeks} week(s)</span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-teal-600">{formatCurrency(Number(p.total_cost))}</p>
                            <p className="text-xs text-gray-500">{formatShortDate(p.week_start_date)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Applications */}
                {jobApplications.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Applications</h3>
                    <div className="space-y-2">
                      {jobApplications.map((app) => (
                        <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Building2 className="h-5 w-5 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{app.job_name}</p>
                              <p className="text-xs text-gray-500">Salary: {formatCurrency(app.job_salary)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              app.status === 'approved' ? 'bg-green-100 text-green-700' :
                              app.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {app.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">{formatShortDate(app.created_at)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggestions & Bugs */}
                {(suggestions.length > 0 || bugReports.length > 0) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions &amp; Bugs</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-gray-900">Suggestions</p>
                          <p className="text-xs text-gray-500">{suggestions.length}</p>
                        </div>
                        {suggestions.length === 0 ? (
                          <p className="text-sm text-gray-600">No suggestions submitted.</p>
                        ) : (
                          <div className="space-y-2">
                            {suggestions.map((s) => (
                              <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between">
                                  {renderStatusPill(s.status, s.reward_paid)}
                                  <span className="text-xs text-gray-500">{formatShortDate(s.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{s.content}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-gray-900">Bug Reports</p>
                          <p className="text-xs text-gray-500">{bugReports.length}</p>
                        </div>
                        {bugReports.length === 0 ? (
                          <p className="text-sm text-gray-600">No bugs reported.</p>
                        ) : (
                          <div className="space-y-2">
                            {bugReports.map((b) => (
                              <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between">
                                  {renderStatusPill(b.status, b.reward_paid)}
                                  <span className="text-xs text-gray-500">{formatShortDate(b.created_at)}</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mt-2">{b.title}</p>
                                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{b.description}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDetailView;
