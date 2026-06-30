import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { 
  Wallet, Send, DollarSign, History, TrendingUp, AlertCircle,
  Users, CheckCircle, XCircle, CreditCard, FileText,
  ArrowUpRight, ArrowDownLeft, Banknote, ToggleLeft, ToggleRight, Briefcase, Settings, Clock, Scale
} from 'lucide-react';
import api, { treasuryApi, policeFinesBonusesApi, PoliceFineBonus, transactionsApi, lawsuitsApi, StudentLawsuit, studentsApi, BankStats } from '../../services/api';
import { Transaction, Loan, Student } from '../../types';
import TransferForm from '../TransferForm';
import LoanForm from '../LoanForm';
import {
  ResponsivePage,
  ResponsiveGrid,
  ResponsiveStatItem,
  ResponsivePluginHero,
  ResponsiveTabNav,
  LoadingState,
} from '../responsive';

// ============================================
// TEACHER BANK VIEW COMPONENT
// ============================================
interface TeacherBankViewProps {
  bankPlugin: any;
}

interface PendingTransfer {
  id: number;
  from_username: string;
  from_first_name?: string;
  from_last_name?: string;
  from_class?: string;
  to_username: string;
  to_first_name?: string;
  to_last_name?: string;
  to_class?: string;
  amount: number;
  description: string;
  status: string;
  created_at: string;
}

const TRANSACTION_PAGE_SIZE = 100;

const TeacherBankView: React.FC<TeacherBankViewProps> = ({ bankPlugin }) => {
  const { plugins } = usePlugins();
  const courtEnabled = plugins.some((p) => p.route_path === '/court' && p.enabled);
  const [activeTab, setActiveTab] = useState<'payments' | 'loans' | 'transfers' | 'fines-bonuses' | 'lawsuits' | 'activity'>('payments');
  const [students, setStudents] = useState<Student[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [pendingFinesBonuses, setPendingFinesBonuses] = useState<PoliceFineBonus[]>([]);
  const [pendingLawsuits, setPendingLawsuits] = useState<StudentLawsuit[]>([]);
  const [lawsuitAwardDraft, setLawsuitAwardDraft] = useState<Record<number, string>>({});
  const [lawsuitInitialsDraft, setLawsuitInitialsDraft] = useState<Record<number, string>>({});
  const [lawsuitDenialDraft, setLawsuitDenialDraft] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Loan approval
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showLoanModal, setShowLoanModal] = useState(false);
  
  // Status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Bank settings
  const [bankSettings, setBankSettings] = useState<Record<string, string>>({});
  const [unemployedCount, setUnemployedCount] = useState(0);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [bankStats, setBankStats] = useState<BankStats>({
    week_transaction_count: 0,
    pending_loans: 0,
    active_loans: 0,
    pending_fines_bonuses: 0,
    pending_lawsuits: 0,
  });
  const [loansLoaded, setLoansLoaded] = useState(false);
  const [loansLoading, setLoansLoading] = useState(false);
  const [transactionsLoaded, setTransactionsLoaded] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionOffset, setTransactionOffset] = useState(0);
  const [transactionHasMore, setTransactionHasMore] = useState(false);
  const [finesBonusesLoaded, setFinesBonusesLoaded] = useState(false);
  const [finesBonusesLoading, setFinesBonusesLoading] = useState(false);
  const [lawsuitsLoaded, setLawsuitsLoaded] = useState(false);
  const [lawsuitsLoading, setLawsuitsLoading] = useState(false);

  const fetchBankSettings = async () => {
    try {
      const [settingsRes, unemployedRes] = await Promise.all([
        api.get('/transactions/bank-settings'),
        api.get('/transactions/unemployed-students')
      ]);
      setBankSettings(settingsRes.data);
      setUnemployedCount(unemployedRes.data.count);
    } catch (error) {
      console.error('Failed to fetch bank settings:', error);
    }
  };

  const fetchLoans = useCallback(async () => {
    setLoansLoading(true);
    try {
      const loansRes = await api.get('/loans');
      setLoans(loansRes.data);
      setLoansLoaded(true);
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoansLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (offset: number, replace: boolean) => {
    setTransactionsLoading(true);
    try {
      const res = await transactionsApi.getHistoryPage({
        limit: TRANSACTION_PAGE_SIZE,
        offset,
      });
      setTransactionTotal(res.data.total);
      setTransactionHasMore(res.data.has_more);
      setTransactionOffset(offset);
      setTransactions((prev) => (replace ? res.data.transactions : [...prev, ...res.data.transactions]));
      setTransactionsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, []);

  const fetchFinesBonuses = useCallback(async () => {
    setFinesBonusesLoading(true);
    try {
      const pfbRes = await policeFinesBonusesApi.getPending().catch(() => ({ data: [] }));
      setPendingFinesBonuses(pfbRes.data);
      setFinesBonusesLoaded(true);
    } catch (error) {
      console.error('Failed to fetch fines and bonuses:', error);
    } finally {
      setFinesBonusesLoading(false);
    }
  }, []);

  const fetchLawsuits = useCallback(async () => {
    setLawsuitsLoading(true);
    try {
      const lawsuitsRes = await lawsuitsApi.getPendingTeacher().catch(() => ({ data: [] }));
      setPendingLawsuits(lawsuitsRes.data);
      setLawsuitsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch lawsuits:', error);
    } finally {
      setLawsuitsLoading(false);
    }
  }, []);

  const fetchInitialData = useCallback(async () => {
    try {
      const [studentsRes, pendingTransfersRes, statsRes, settingsRes, unemployedRes] = await Promise.all([
        studentsApi.getBankSummary(),
        api.get('/transactions/pending-transfers'),
        transactionsApi.getBankStats(),
        api.get('/transactions/bank-settings'),
        api.get('/transactions/unemployed-students'),
      ]);
      setStudents(studentsRes.data);
      setPendingTransfers(pendingTransfersRes.data);
      setBankStats(statsRes.data);
      setBankSettings(settingsRes.data);
      setUnemployedCount(unemployedRes.data.count);
    } catch (error) {
      console.error('Failed to fetch bank data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAfterMutation = useCallback(async () => {
    try {
      const [studentsRes, pendingTransfersRes, statsRes] = await Promise.all([
        studentsApi.getBankSummary(),
        api.get('/transactions/pending-transfers'),
        transactionsApi.getBankStats(),
      ]);
      setStudents(studentsRes.data);
      setPendingTransfers(pendingTransfersRes.data);
      setBankStats(statsRes.data);
      if (loansLoaded) {
        const loansRes = await api.get('/loans');
        setLoans(loansRes.data);
      }
      if (transactionsLoaded) {
        await fetchTransactions(0, true);
      }
      if (finesBonusesLoaded) {
        const pfbRes = await policeFinesBonusesApi.getPending().catch(() => ({ data: [] }));
        setPendingFinesBonuses(pfbRes.data);
      }
      if (lawsuitsLoaded && courtEnabled) {
        const lawsuitsRes = await lawsuitsApi.getPendingTeacher().catch(() => ({ data: [] }));
        setPendingLawsuits(lawsuitsRes.data);
      }
      await fetchBankSettings();
    } catch (error) {
      console.error('Failed to refresh bank data:', error);
    }
  }, [loansLoaded, transactionsLoaded, finesBonusesLoaded, lawsuitsLoaded, courtEnabled, fetchTransactions]);

  useEffect(() => {
    setLoading(true);
    setLoansLoaded(false);
    setTransactionsLoaded(false);
    setFinesBonusesLoaded(false);
    setLawsuitsLoaded(false);
    fetchInitialData();
  }, [courtEnabled, fetchInitialData]);

  useEffect(() => {
    if (loading) return;
    if (activeTab === 'loans' && !loansLoaded && !loansLoading) fetchLoans();
    if (activeTab === 'fines-bonuses' && !finesBonusesLoaded && !finesBonusesLoading) fetchFinesBonuses();
    if (activeTab === 'lawsuits' && courtEnabled && !lawsuitsLoaded && !lawsuitsLoading) fetchLawsuits();
  }, [activeTab, loading, courtEnabled, loansLoaded, loansLoading, finesBonusesLoaded, finesBonusesLoading, lawsuitsLoaded, lawsuitsLoading, fetchLoans, fetchFinesBonuses, fetchLawsuits]);

  useEffect(() => {
    if (loading || activeTab !== 'activity') return;
    fetchTransactions(0, true);
  }, [activeTab, loading, fetchTransactions]);

  useEffect(() => {
    const onHistoryCleared = () => {
      refreshAfterMutation();
    };
    window.addEventListener('transaction-history-cleared', onHistoryCleared);
    return () => window.removeEventListener('transaction-history-cleared', onHistoryCleared);
  }, [refreshAfterMutation]);

  const toggleBasicSalary = async () => {
    setSettingsLoading(true);
    setError(''); setSuccess('');
    try {
      const newValue = bankSettings.basic_salary_enabled === 'true' ? 'false' : 'true';
      await api.put('/transactions/bank-settings/basic_salary_enabled', { value: newValue });
      setBankSettings({ ...bankSettings, basic_salary_enabled: newValue });
      setSuccess(`Unemployment fund auto-pay ${newValue === 'true' ? 'enabled' : 'disabled'}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update setting');
    } finally {
      setSettingsLoading(false);
    }
  };

  const payBasicSalary = async () => {
    setActionLoading(true);
    setError(''); setSuccess('');
    try {
      const response = await api.post('/transactions/pay-basic-salary', {});
      setSuccess(`Paid unemployment fund to ${response.data.updated_count} students (R${response.data.amount} each)`);
      refreshAfterMutation();
      fetchBankSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to pay unemployment fund');
    } finally {
      setActionLoading(false);
    }
  };

  const payEmployedSalaries = async () => {
    setActionLoading(true);
    setError(''); setSuccess('');
    try {
      const townClasses = ['6A', '6B', '6C'];
      const classesToPay = townClasses.filter((c) => (studentsByClass.grouped[c] || []).some((s) => s.job_id));
      if (classesToPay.length === 0) {
        setError('No employed students to pay');
        return;
      }
      let totalNet = 0;
      let totalCount = 0;
      for (const townClass of classesToPay) {
        const result = await treasuryApi.paySalaries(townClass);
        totalNet += result.data.total_net ?? 0;
        totalCount += result.data.paid_count ?? 0;
      }
      setSuccess(`Paid salaries to ${totalCount} employed students (R${totalNet.toFixed(2)} total)`);
      refreshAfterMutation();
      fetchBankSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to pay employed salaries');
    } finally {
      setActionLoading(false);
    }
  };

  // Memoized data processing
  const studentsByClass = useMemo(() => {
    const grouped = students.reduce((acc, student) => {
      const className = student.class || 'Unassigned';
      if (!acc[className]) acc[className] = [];
      acc[className].push(student);
      return acc;
    }, {} as Record<string, Student[]>);

    const sortedClasses = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    return { grouped, sortedClasses };
  }, [students]);

  const employedCount = useMemo(() => {
    return students.filter((s) => s.job_id).length;
  }, [students]);

  // Stats
  const stats = useMemo(() => {
    const totalBalance = students.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    const pendingTransfersCount = pendingTransfers.filter(pt => pt.status === 'pending').length;
    return {
      totalBalance,
      pendingLoans: bankStats.pending_loans,
      activeLoans: bankStats.active_loans,
      pendingTransfersCount,
      pendingFinesBonusesCount: bankStats.pending_fines_bonuses,
      pendingLawsuitsCount: bankStats.pending_lawsuits,
      recentTransactions: bankStats.week_transaction_count,
      studentCount: students.length,
    };
  }, [students, bankStats, pendingTransfers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Handlers
  const handleLoanApproval = async (loanId: number, approved: boolean) => {
    setError(''); setSuccess(''); setActionLoading(true);
    try {
      await api.post('/loans/approve', { loan_id: loanId, approved });
      setSuccess(`Loan ${approved ? 'approved' : 'denied'} successfully!`);
      setShowLoanModal(false);
      setSelectedLoan(null);
      refreshAfterMutation();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update loan status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateLoan = async (loanId: number) => {
    setError(''); setSuccess(''); setActionLoading(true);
    try {
      await api.post(`/loans/activate/${loanId}`);
      setSuccess('Loan activated successfully!');
      refreshAfterMutation();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to activate loan');
    } finally {
      setActionLoading(false);
    }
  };

  const getTransactionIcon = (type: string, fromUsername?: string, toUsername?: string) => {
    switch (type) {
      case 'deposit':
      case 'salary':
        return <ArrowDownLeft className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
      case 'fine':
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <Send className="h-4 w-4 text-blue-600" />;
      case 'loan_disbursement':
        return <Banknote className="h-4 w-4 text-amber-600" />;
      case 'loan_repayment':
        return <CreditCard className="h-4 w-4 text-purple-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'paid_off': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  const teacherTabs = [
    { id: 'payments', label: 'Payments', icon: Banknote },
    { id: 'loans', label: 'Loans', icon: CreditCard },
    { id: 'transfers', label: 'Pending Transfers', icon: Send, badge: stats.pendingTransfersCount },
    { id: 'fines-bonuses', label: 'Fines & Bonuses', icon: AlertCircle, badge: stats.pendingFinesBonusesCount },
    ...(courtEnabled ? [{ id: 'lawsuits' as const, label: 'Lawsuits', icon: Scale, badge: stats.pendingLawsuitsCount }] : []),
    { id: 'activity', label: 'Activity', icon: History },
  ];

  return (
    <ResponsivePage>
      <ResponsivePluginHero
        title="Bank Management"
        subtitle="Teacher Administration Panel"
        emoji="🏦"
        gradientClass="bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
      />

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 sm:p-4">
        <ResponsiveGrid preset="stats-6">
          <div className="col-span-2 md:col-span-1">
            <ResponsiveStatItem
              compact
              label="Total Balance"
              value={formatCurrency(stats.totalBalance)}
              icon={Wallet}
              valueClassName="text-green-600"
            />
          </div>
          <ResponsiveStatItem compact label="Students" value={stats.studentCount} icon={Users} />
          <ResponsiveStatItem
            compact
            label="Pending Loans"
            value={stats.pendingLoans}
            icon={AlertCircle}
            valueClassName="text-amber-600"
          />
          <ResponsiveStatItem
            compact
            label="Active Loans"
            value={stats.activeLoans}
            icon={CreditCard}
            valueClassName="text-blue-600"
          />
          <button
            type="button"
            className="text-left rounded-lg -m-1 p-1 hover:bg-emerald-50 transition-colors min-w-0"
            onClick={() => setActiveTab('transfers')}
          >
            <ResponsiveStatItem
              compact
              label="Pending Transfers"
              value={stats.pendingTransfersCount}
              icon={Send}
              valueClassName="text-amber-600"
            />
          </button>
          <ResponsiveStatItem
            compact
            label="This Week"
            value={stats.recentTransactions}
            icon={History}
            valueClassName="text-purple-600"
          />
        </ResponsiveGrid>
      </div>

      {/* Pending Transfers Alert Banner */}
      {stats.pendingTransfersCount > 0 && activeTab !== 'transfers' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <Send className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  {stats.pendingTransfersCount} student transfer{stats.pendingTransfersCount !== 1 ? 's' : ''} waiting for approval
                </p>
                <p className="text-xs text-amber-600">Students have requested transfers to classmates. Review and approve or deny each request.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('transfers')}
              className="px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium min-h-[44px] w-full sm:w-auto shrink-0"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <XCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Content Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ResponsiveTabNav
          tabs={teacherTabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as typeof activeTab)}
          variant="emerald"
        />

        <div className="p-4 sm:p-6">
          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Group Payment options */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Group Payment options</h3>
                      <p className="text-sm text-gray-600">
                        Unemployment fund: R{bankSettings.basic_salary_amount || '1,500'}/week on Mondays at 07:00 when auto-pay is on
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={toggleBasicSalary}
                    disabled={settingsLoading}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      bankSettings.basic_salary_enabled === 'true'
                        ? 'bg-purple-600 text-white hover:bg-purple-700'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    } disabled:opacity-50`}
                  >
                    {bankSettings.basic_salary_enabled === 'true' ? (
                      <ToggleRight className="h-5 w-5" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                    <span>{bankSettings.basic_salary_enabled === 'true' ? 'Auto Pay ON' : 'Auto Pay OFF'}</span>
                  </button>
                </div>

                {/* Unemployment fund */}
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100 mb-3">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Unemployment fund</p>
                      <p className="text-sm text-gray-500">
                        Pay unemployed students (R{bankSettings.basic_salary_amount || '1,500'} each).{' '}
                        <span className="font-medium text-gray-700">{unemployedCount} students</span> will be paid if you click Pay now.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={payBasicSalary}
                    disabled={actionLoading || unemployedCount === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2 shrink-0"
                  >
                    <Banknote className="h-4 w-4" />
                    <span>{actionLoading ? 'Paying...' : 'Pay now'}</span>
                  </button>
                </div>

                {/* Employed salaries (level 1–10) */}
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">Employed salaries (level 1–10)</p>
                      <p className="text-sm text-gray-500">
                        Pay all employed students their unique level 1–10 salary.{' '}
                        <span className="font-medium text-gray-700">{employedCount} students</span> will be paid if you click Pay now.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={payEmployedSalaries}
                    disabled={actionLoading || employedCount === 0}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2 shrink-0"
                  >
                    <Banknote className="h-4 w-4" />
                    <span>{actionLoading ? 'Paying...' : 'Pay now'}</span>
                  </button>
                </div>

                {bankSettings.last_basic_salary_run && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last unemployment auto-payment: {new Date(bankSettings.last_basic_salary_run).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Pending Transfers Tab */}
          {activeTab === 'transfers' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Student Transfer Requests
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Students request transfers to classmates. Approve or deny each request.
                  </p>
                </div>
                {pendingTransfers.filter(pt => pt.status === 'pending').length > 0 && (
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        const pendingCount = pendingTransfers.filter(pt => pt.status === 'pending').length;
                        if (!window.confirm(`Approve all ${pendingCount} pending transfer request${pendingCount !== 1 ? 's' : ''}?`)) {
                          return;
                        }
                        setError('');
                        setSuccess('');
                        setActionLoading(true);
                        try {
                          const res = await transactionsApi.approveAllPendingTransfers();
                          const { message, failed } = res.data;
                          if (failed.length > 0) {
                            setError(`${message}. ${failed.length} request${failed.length !== 1 ? 's' : ''} could not be approved.`);
                          } else {
                            setSuccess(message);
                          }
                          refreshAfterMutation();
                        } catch (err: any) {
                          setError(err.response?.data?.error || 'Failed to approve all transfers');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve All ({pendingTransfers.filter(pt => pt.status === 'pending').length})</span>
                    </button>
                    <button
                      onClick={async () => {
                        const pendingCount = pendingTransfers.filter(pt => pt.status === 'pending').length;
                        if (!window.confirm(`Deny all ${pendingCount} pending transfer request${pendingCount !== 1 ? 's' : ''}?`)) {
                          return;
                        }
                        setError('');
                        setSuccess('');
                        setActionLoading(true);
                        try {
                          const res = await transactionsApi.denyAllPendingTransfers();
                          const { message, failed } = res.data;
                          if (failed.length > 0) {
                            setError(`${message}. ${failed.length} request${failed.length !== 1 ? 's' : ''} could not be denied.`);
                          } else {
                            setSuccess(message);
                          }
                          refreshAfterMutation();
                        } catch (err: any) {
                          setError(err.response?.data?.error || 'Failed to deny all transfers');
                        } finally {
                          setActionLoading(false);
                        }
                      }}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Deny All ({pendingTransfers.filter(pt => pt.status === 'pending').length})</span>
                    </button>
                  </div>
                )}
              </div>
              {pendingTransfers.filter(pt => pt.status === 'pending').length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending transfer requests</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTransfers.filter(pt => pt.status === 'pending').map((pt) => (
                    <div key={pt.id} className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {(pt.from_first_name && pt.from_last_name)
                              ? `${pt.from_first_name} ${pt.from_last_name}`
                              : pt.from_username}
                            {' → '}
                            {(pt.to_first_name && pt.to_last_name)
                              ? `${pt.to_first_name} ${pt.to_last_name}`
                              : pt.to_username}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(pt.amount)} • {pt.description} • {formatDate(pt.created_at)}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                          PENDING
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setError(''); setSuccess(''); setActionLoading(true);
                            try {
                              await api.post(`/transactions/pending-transfers/${pt.id}/approve`);
                              setSuccess('Transfer approved');
                              refreshAfterMutation();
                            } catch (err: any) {
                              setError(err.response?.data?.error || 'Failed to approve');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={async () => {
                            setError(''); setSuccess(''); setActionLoading(true);
                            try {
                              await api.post(`/transactions/pending-transfers/${pt.id}/deny`);
                              setSuccess('Transfer denied');
                              refreshAfterMutation();
                            } catch (err: any) {
                              setError(err.response?.data?.error || 'Failed to deny');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fines & Bonuses Tab */}
          {activeTab === 'fines-bonuses' && (
            <div className="space-y-6">
              {finesBonusesLoading && !finesBonusesLoaded ? (
                <LoadingState message="Loading fines and bonuses..." />
              ) : (
              <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Pending Fines & Bonuses</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Approved by a lawyer for assigned clients. Final teacher approval applies fines or bonuses.
                </p>
              </div>
              {pendingFinesBonuses.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending fines or bonuses</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingFinesBonuses.map((pfb) => (
                    <div
                      key={pfb.id}
                      className={`rounded-xl p-4 border ${
                        pfb.type === 'fine'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                                pfb.type === 'fine'
                                  ? 'bg-red-200 text-red-800'
                                  : 'bg-green-200 text-green-800'
                              }`}
                            >
                              {pfb.type}
                            </span>
                            <span className="font-semibold text-gray-900">
                              {pfb.target_first_name && pfb.target_last_name
                                ? `${pfb.target_first_name} ${pfb.target_last_name}`
                                : pfb.target_username}
                              {pfb.target_class ? ` (${pfb.target_class})` : ''}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            <span className="font-medium">Amount:</span> R{Number(pfb.amount).toFixed(2)}
                          </p>
                          {pfb.description && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Reason:</span> {pfb.description}
                            </p>
                          )}
                          {pfb.lawyer_notes && (
                            <p className="text-sm text-indigo-800">
                              <span className="font-medium">Lawyer notes:</span> {pfb.lawyer_notes}
                            </p>
                          )}
                          {pfb.police_evidence_response && (
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Police evidence:</span> {pfb.police_evidence_response}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Submitted by{' '}
                            {pfb.submitted_by_first_name && pfb.submitted_by_last_name
                              ? `${pfb.submitted_by_first_name} ${pfb.submitted_by_last_name}`
                              : pfb.submitted_by_username}
                            {pfb.submitted_by_class ? ` (${pfb.submitted_by_class})` : ''}
                            {' · '}Teacher initials: <strong>{pfb.teacher_initials}</strong>
                            {' · '}{new Date(pfb.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800 shrink-0 ml-3">
                          TEACHER REVIEW
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            setError(''); setSuccess(''); setActionLoading(true);
                            try {
                              await policeFinesBonusesApi.approve(pfb.id);
                              setSuccess(
                                pfb.type === 'fine'
                                  ? `Fine of R${Number(pfb.amount).toFixed(2)} applied to ${pfb.target_username}`
                                  : `Bonus of R${Number(pfb.amount).toFixed(2)} awarded to ${pfb.target_username}`
                              );
                              refreshAfterMutation();
                            } catch (err: any) {
                              setError(err.response?.data?.error || 'Failed to approve');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={async () => {
                            setError(''); setSuccess(''); setActionLoading(true);
                            try {
                              await policeFinesBonusesApi.deny(pfb.id);
                              setSuccess('Request denied');
                              refreshAfterMutation();
                            } catch (err: any) {
                              setError(err.response?.data?.error || 'Failed to deny');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
              )}
            </div>
          )}

          {activeTab === 'lawsuits' && courtEnabled && (
            <div className="space-y-6">
              {lawsuitsLoading && !lawsuitsLoaded ? (
                <LoadingState message="Loading lawsuits..." />
              ) : (
              <>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Pending Lawsuits</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Final teacher approval for damages and lawyer fees. Review jury verdict and counsel opinions in Court plugin.
                </p>
              </div>
              {pendingLawsuits.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                  <Scale className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No pending lawsuits</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingLawsuits.map((ls) => (
                    <div key={ls.id} className="rounded-xl p-4 border bg-indigo-50 border-indigo-200">
                      <p className="font-semibold">
                        Case #{ls.id}: {ls.plaintiff_username} vs {ls.defendant_username}
                      </p>
                      <p className="text-sm text-gray-700">Claim R{Number(ls.claim_amount).toFixed(2)} · {ls.description}</p>
                      {ls.jury_verdict && (
                        <p className="text-sm text-indigo-800 mt-1">
                          Jury: {ls.jury_verdict} ({ls.jury_guilty_votes}-{ls.jury_not_guilty_votes})
                        </p>
                      )}
                      {ls.jury_skipped_reason && (
                        <p className="text-xs text-amber-700">Jury skipped: {ls.jury_skipped_reason}</p>
                      )}
                      {ls.escrow_held_at && (
                        <p className="text-xs text-gray-600 mt-1">
                          Escrow: R{Number(ls.escrow_amount ?? 10000).toFixed(2)} held for plaintiff counsel
                        </p>
                      )}
                      {ls.linked_action_type && (
                        <p className="text-xs text-indigo-700 mt-1">
                          Linked: {ls.linked_action_type} #{ls.linked_action_id}
                        </p>
                      )}
                      {ls.hr_recommended_amount != null && (
                        <p className="text-sm text-gray-600">HR settlement: R{Number(ls.hr_recommended_amount).toFixed(2)}</p>
                      )}
                      {ls.plaintiff_lawyer_notes && (
                        <p className="text-xs text-gray-600 mt-1">Plaintiff counsel: {ls.plaintiff_lawyer_notes}</p>
                      )}
                      {ls.defendant_lawyer_notes && (
                        <p className="text-xs text-gray-600">Defense counsel: {ls.defendant_lawyer_notes}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3 items-end">
                        <input
                          type="number"
                          placeholder="Award R"
                          className="input-field text-sm w-28"
                          value={lawsuitAwardDraft[ls.id] ?? String(ls.hr_recommended_amount ?? ls.claim_amount ?? '')}
                          onChange={(e) => setLawsuitAwardDraft({ ...lawsuitAwardDraft, [ls.id]: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Initials"
                          maxLength={10}
                          className="input-field text-sm w-20"
                          value={lawsuitInitialsDraft[ls.id] || ''}
                          onChange={(e) => setLawsuitInitialsDraft({ ...lawsuitInitialsDraft, [ls.id]: e.target.value.toUpperCase() })}
                        />
                        <button
                          type="button"
                          disabled={actionLoading}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm"
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await lawsuitsApi.approve(ls.id, {
                                awarded_amount: parseFloat(lawsuitAwardDraft[ls.id] || '0'),
                                teacher_initials: lawsuitInitialsDraft[ls.id] || '',
                              });
                              setSuccess('Lawsuit approved');
                              refreshAfterMutation();
                            } catch (err: unknown) {
                              const e = err as { response?: { data?: { error?: string } } };
                              setError(e.response?.data?.error || 'Failed to approve');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                        >
                          Approve
                        </button>
                        <input
                          type="text"
                          placeholder="Denial reason"
                          className="input-field text-sm flex-1 min-w-[120px]"
                          value={lawsuitDenialDraft[ls.id] || ''}
                          onChange={(e) => setLawsuitDenialDraft({ ...lawsuitDenialDraft, [ls.id]: e.target.value })}
                        />
                        <button
                          type="button"
                          disabled={actionLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
                          onClick={async () => {
                            setActionLoading(true);
                            try {
                              await lawsuitsApi.deny(ls.id, {
                                teacher_initials: lawsuitInitialsDraft[ls.id] || '',
                                denial_reason: lawsuitDenialDraft[ls.id] || 'Denied',
                              });
                              setSuccess('Lawsuit denied');
                              refreshAfterMutation();
                            } catch (err: unknown) {
                              const e = err as { response?: { data?: { error?: string } } };
                              setError(e.response?.data?.error || 'Failed to deny');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
              {loansLoading && !loansLoaded ? (
                <LoadingState message="Loading loans..." />
              ) : (
              <>
              {/* Process Weekly Payments Button */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  Weekly Payment Processing
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Process automatic loan payments for all students with active loans. Payments are normally processed every Monday.
                </p>
                <button
                  onClick={async () => {
                    setError(''); setSuccess(''); setActionLoading(true);
                    try {
                      const response = await api.post('/loans/process-weekly-payments', { force: true });
                      setSuccess(`Processed ${response.data.results?.length || 0} loan payments`);
                      refreshAfterMutation();
                    } catch (err: any) {
                      setError(err.response?.data?.error || 'Failed to process payments');
                    } finally {
                      setActionLoading(false);
                    }
                  }}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Process Weekly Payments Now'}
                </button>
              </div>

              {/* Pending Loans */}
              {loans.filter(l => l.status === 'pending').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                    Pending Approval ({loans.filter(l => l.status === 'pending').length})
                  </h3>
                  <div className="space-y-4">
                    {loans.filter(l => l.status === 'pending').map((loan) => (
                      <div key={loan.id} className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">Loan #{loan.id} - {loan.borrower_username}</h4>
                            <p className="text-sm text-gray-500">Applied on {formatDate(loan.created_at)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {loan.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Weekly Payment</p>
                            <p className="font-semibold">
                              {formatCurrency(loan.weekly_payment || loan.monthly_payment / 4.33)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Term</p>
                            <p className="font-semibold">{loan.term_months} months</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Interest Rate</p>
                            <p className="font-semibold">{(loan.interest_rate * 100).toFixed(1)}%</p>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleLoanApproval(loan.id, true)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleLoanApproval(loan.id, false)}
                            disabled={actionLoading}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            Deny
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Loans */}
              {loans.filter(l => ['active', 'approved'].includes(l.status)).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    Active Loans ({loans.filter(l => ['active', 'approved'].includes(l.status)).length})
                  </h3>
                  <div className="space-y-4">
                    {loans.filter(l => ['active', 'approved'].includes(l.status)).map((loan) => (
                      <div key={loan.id} className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-900">Loan #{loan.id} - {loan.borrower_username}</h4>
                            <p className="text-sm text-gray-500">
                              {loan.approved_at ? `Approved on ${formatDate(loan.approved_at)}` : 'Awaiting activation'}
                            </p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {loan.status.toUpperCase()}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Original Amount</p>
                            <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Outstanding</p>
                            <p className="font-semibold">{formatCurrency(loan.outstanding_balance)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Weekly Payment</p>
                            <p className="font-semibold">
                              {formatCurrency(loan.weekly_payment || loan.monthly_payment / 4.33)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Remaining</p>
                            <p className="font-semibold">{loan.payments_remaining || 0} payments</p>
                          </div>
                        </div>

                        {loan.total_paid && Number(loan.total_paid) > 0 && (
                          <div className="mt-4 bg-white rounded-lg p-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Paid</span>
                              <span className="font-semibold text-emerald-600">{formatCurrency(loan.total_paid)}</span>
                            </div>
                          </div>
                        )}

                        {loan.status === 'approved' && (
                          <div className="mt-4">
                            <button
                              onClick={() => handleActivateLoan(loan.id)}
                              disabled={actionLoading}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              Activate Loan
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Loans */}
              {loans.filter(l => ['paid_off', 'denied'].includes(l.status)).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-600 mr-2" />
                    Completed/Denied ({loans.filter(l => ['paid_off', 'denied'].includes(l.status)).length})
                  </h3>
                  <div className="space-y-4">
                    {loans.filter(l => ['paid_off', 'denied'].includes(l.status)).map((loan) => (
                      <div key={loan.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-gray-900">Loan #{loan.id} - {loan.borrower_username}</h4>
                            <p className="text-sm text-gray-500">{formatDate(loan.created_at)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                            {loan.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">Amount</p>
                            <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Term</p>
                            <p className="font-semibold">{loan.term_months} months</p>
                          </div>
                          {loan.total_paid && (
                            <div>
                              <p className="text-sm text-gray-500">Total Paid</p>
                              <p className="font-semibold">{formatCurrency(loan.total_paid)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {loans.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No loan applications found</p>
                </div>
              )}
              </>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <span className="text-sm text-gray-500">{transactionTotal} transactions</span>
              </div>

              {transactionsLoading && transactions.length === 0 ? (
                <LoadingState message="Loading transactions..." />
              ) : transactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              ) : (
                <>
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="bg-white p-2 rounded-full shadow-sm">
                          {getTransactionIcon(transaction.transaction_type, transaction.from_username, transaction.to_username)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description || transaction.transaction_type.replace(/_/g, ' ')}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{formatDate(transaction.created_at)}</span>
                            {transaction.from_username && (
                              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                From: {transaction.from_username}
                              </span>
                            )}
                            {transaction.to_username && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                To: {transaction.to_username}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          ['deposit', 'salary', 'loan_disbursement'].includes(transaction.transaction_type)
                            ? 'text-emerald-600'
                            : ['withdrawal', 'fine', 'loan_repayment'].includes(transaction.transaction_type)
                            ? 'text-red-600'
                            : 'text-blue-600'
                        }`}>
                          {['withdrawal', 'fine', 'loan_repayment'].includes(transaction.transaction_type) ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{transaction.transaction_type.replace(/_/g, ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {transactionHasMore && (
                  <div className="flex justify-center pt-4">
                    <button
                      onClick={() => fetchTransactions(transactionOffset + TRANSACTION_PAGE_SIZE, false)}
                      disabled={transactionsLoading}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {transactionsLoading ? 'Loading...' : 'Load more'}
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

    </ResponsivePage>
  );
};

// ============================================
// STUDENT BANK VIEW (ORIGINAL)
// ============================================
interface StudentBankViewProps {
  bankPlugin: any;
}

const StudentBankView: React.FC<StudentBankViewProps> = ({ bankPlugin }) => {
  const { user, account } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transfer' | 'loans' | 'history'>('overview');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const onHistoryCleared = () => {
      fetchData();
    };
    window.addEventListener('transaction-history-cleared', onHistoryCleared);
    return () => window.removeEventListener('transaction-history-cleared', onHistoryCleared);
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, loansRes] = await Promise.all([
        api.get('/transactions/history'),
        api.get('/loans')
      ]);
      setTransactions(transactionsRes.data);
      setLoans(loansRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
      case 'salary':
        return <TrendingUp className="h-4 w-4 text-success-600" />;
      case 'withdrawal':
      case 'fine':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'transfer':
        return <Send className="h-4 w-4 text-primary-600" />;
      case 'loan_disbursement':
        return <DollarSign className="h-4 w-4 text-warning-600" />;
      case 'loan_repayment':
        return <Wallet className="h-4 w-4 text-blue-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.transaction_type === 'transfer') {
      if (transaction.from_username === user?.username) {
        return `Sent to ${transaction.to_username}`;
      } else {
        return `Received from ${transaction.from_username}`;
      }
    }
    return transaction.description || transaction.transaction_type;
  };

  if (loading) {
    return <LoadingState />;
  }

  const studentTabs = [
    { id: 'overview', label: 'Overview', icon: Wallet },
    { id: 'transfer', label: 'Transfer Money', icon: Send },
    { id: 'loans', label: 'Loans', icon: DollarSign },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <ResponsivePage>
      <ResponsivePluginHero
        title="Bank"
        subtitle="Financial Services System"
        emoji="🏦"
        gradientClass="bg-gradient-to-r from-primary-600 to-primary-700 text-white"
      />

      {/* Account Balance Card */}
      <div className={`card ${(account?.balance || 0) < 0 ? 'border-2 border-red-500 bg-red-50' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Balance</h2>
            <p className={`text-3xl font-bold ${(account?.balance || 0) < 0 ? 'text-red-600' : 'text-primary-600'}`}>
              {formatCurrency(account?.balance || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Account: {account?.account_number}
            </p>
            {(account?.balance || 0) < 0 && (
              <div className="mt-2 p-2 bg-red-100 rounded-lg">
                <p className="text-sm text-red-700 font-medium flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Negative balance! Pay off your debt to make transactions.
                </p>
              </div>
            )}
          </div>
          <div className={`p-4 rounded-full shrink-0 self-start sm:self-center ${(account?.balance || 0) < 0 ? 'bg-red-100' : 'bg-primary-100'}`}>
            <Wallet className={`h-8 w-8 ${(account?.balance || 0) < 0 ? 'text-red-600' : 'text-primary-600'}`} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <ResponsiveTabNav
          tabs={studentTabs}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as typeof activeTab)}
          variant="primary"
        />

        <div className="p-4 sm:p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <ResponsiveGrid preset="1-3">
                <div className="bg-success-50 p-4 rounded-lg">
                  <ResponsiveStatItem
                    label="Total Deposits"
                    value={formatCurrency(
                      transactions
                        .filter(t => ['deposit', 'salary'].includes(t.transaction_type))
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                    icon={TrendingUp}
                    valueClassName="text-success-600"
                  />
                </div>

                <div className="bg-warning-50 p-4 rounded-lg">
                  <ResponsiveStatItem
                    label="Active Loans"
                    value={loans.filter(l => l.status === 'active').length}
                    icon={DollarSign}
                    valueClassName="text-warning-600"
                  />
                </div>

                <div className="bg-primary-50 p-4 rounded-lg">
                  <ResponsiveStatItem
                    label="Transfers Made"
                    value={transactions.filter(t => t.transaction_type === 'transfer' && t.from_username === user?.username).length}
                    icon={Send}
                    valueClassName="text-primary-600"
                  />
                </div>
              </ResponsiveGrid>

              {/* Recent Transactions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {getTransactionDescription(transaction)}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.from_username === user?.username ? 'text-red-600' : 'text-success-600'
                        }`}>
                          {transaction.from_username === user?.username ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Transfer Tab */}
          {activeTab === 'transfer' && (
            <TransferForm onSuccess={fetchData} />
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <LoanForm onSuccess={fetchData} />
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No transactions yet</p>
                  <p className="text-sm">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getTransactionIcon(transaction.transaction_type)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {getTransactionDescription(transaction)}
                          </p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold ${
                          transaction.from_username === user?.username ? 'text-red-600' : 'text-success-600'
                        }`}>
                          {transaction.from_username === user?.username ? '-' : '+'}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ResponsivePage>
  );
};

// ============================================
// MAIN BANK PLUGIN COMPONENT
// ============================================
const BankPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const bankPlugin = plugins.find(p => p.route_path === '/bank');

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return <LoadingState />;
  }

  if (!bankPlugin || !bankPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  // Render teacher or student view based on user role
  if (user?.role === 'teacher') {
    return <TeacherBankView bankPlugin={bankPlugin} />;
  }

  return <StudentBankView bankPlugin={bankPlugin} />;
};

export default BankPlugin;
