import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { 
  Wallet, Send, DollarSign, History, TrendingUp, AlertCircle,
  Users, User, Search, Plus, Minus, CheckCircle, XCircle, Filter, CreditCard, FileText,
  ArrowUpRight, ArrowDownLeft, Banknote, ToggleLeft, ToggleRight, Briefcase, Settings, Clock
} from 'lucide-react';
import api from '../../services/api';
import { Transaction, Loan, Student } from '../../types';
import TransferForm from '../TransferForm';
import LoanForm from '../LoanForm';

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

const TeacherBankView: React.FC<TeacherBankViewProps> = ({ bankPlugin }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'loans' | 'transfers' | 'activity'>('payments');
  const [students, setStudents] = useState<Student[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Forms
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'deposit' | 'withdraw'>('deposit');
  const [formData, setFormData] = useState({ amount: '', description: '' });
  const [bulkFormData, setBulkFormData] = useState({ amount: '', description: '' });
  
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

  useEffect(() => {
    fetchData();
    fetchBankSettings();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, loansRes, transactionsRes, pendingTransfersRes] = await Promise.all([
        api.get('/students'),
        api.get('/loans'),
        api.get('/transactions/history'),
        api.get('/transactions/pending-transfers')
      ]);
      setStudents(studentsRes.data);
      setLoans(loansRes.data);
      setTransactions(transactionsRes.data);
      setPendingTransfers(pendingTransfersRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const toggleBasicSalary = async () => {
    setSettingsLoading(true);
    setError(''); setSuccess('');
    try {
      const newValue = bankSettings.basic_salary_enabled === 'true' ? 'false' : 'true';
      await api.put('/transactions/bank-settings/basic_salary_enabled', { value: newValue });
      setBankSettings({ ...bankSettings, basic_salary_enabled: newValue });
      setSuccess(`Auto basic salary ${newValue === 'true' ? 'enabled' : 'disabled'}`);
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
      setSuccess(`Paid basic salary to ${response.data.updated_count} unemployed students (R${response.data.amount} each)`);
      fetchData();
      fetchBankSettings();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to pay basic salary');
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

  const filteredStudents = useMemo(() => {
    let filtered = selectedClass === 'all' ? students : (studentsByClass.grouped[selectedClass] || []);
    if (searchTerm) {
      filtered = filtered.filter(s => 
        s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.first_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    return filtered;
  }, [students, selectedClass, searchTerm, studentsByClass]);

  const filteredLoans = useMemo(() => {
    let filtered = loans;
    if (selectedClass !== 'all') {
      const classStudentIds = (studentsByClass.grouped[selectedClass] || []).map(s => s.id);
      filtered = filtered.filter(l => {
        const student = students.find(s => s.username === l.borrower_username);
        return student && classStudentIds.includes(student.id);
      });
    }
    if (selectedStudent) {
      filtered = filtered.filter(l => l.borrower_username === selectedStudent.username);
    }
    return filtered;
  }, [loans, selectedClass, selectedStudent, studentsByClass, students]);

  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    if (selectedClass !== 'all') {
      const classUsernames = (studentsByClass.grouped[selectedClass] || []).map(s => s.username);
      filtered = filtered.filter(t => 
        classUsernames.includes(t.from_username || '') || classUsernames.includes(t.to_username || '')
      );
    }
    if (selectedStudent) {
      filtered = filtered.filter(t => 
        t.from_username === selectedStudent.username || t.to_username === selectedStudent.username
      );
    }
    return filtered;
  }, [transactions, selectedClass, selectedStudent, studentsByClass]);

  // Stats
  const stats = useMemo(() => {
    const relevantStudents = selectedClass === 'all' ? students : (studentsByClass.grouped[selectedClass] || []);
    const totalBalance = relevantStudents.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    const pendingLoans = filteredLoans.filter(l => l.status === 'pending').length;
    const activeLoans = filteredLoans.filter(l => l.status === 'active').length;
    const pendingTransfersCount = pendingTransfers.filter(pt => pt.status === 'pending').length;
    const recentTransactions = filteredTransactions.filter(t => {
      const date = new Date(t.created_at);
      const now = new Date();
      return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000; // Last 7 days
    }).length;
    return { totalBalance, pendingLoans, activeLoans, pendingTransfersCount, recentTransactions, studentCount: relevantStudents.length };
  }, [students, filteredLoans, filteredTransactions, selectedClass, studentsByClass, pendingTransfers]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Handlers
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    setError(''); setSuccess(''); setActionLoading(true);

    try {
      const endpoint = paymentType === 'deposit' ? '/transactions/deposit' : '/transactions/withdraw';
      await api.post(endpoint, {
        username: selectedStudent.username,
        amount: parseFloat(formData.amount),
        description: formData.description || `${paymentType === 'deposit' ? 'Payment' : 'Withdrawal'} by teacher`
      });
      setSuccess(`${paymentType === 'deposit' ? 'Payment' : 'Withdrawal'} successful!`);
      setFormData({ amount: '', description: '' });
      setShowPaymentModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkPayment = async (e: React.FormEvent, type: 'deposit' | 'withdraw') => {
    e.preventDefault();
    if (selectedClass === 'all') {
      setError('Please select a specific class for bulk payments');
      return;
    }
    setError(''); setSuccess(''); setActionLoading(true);

    try {
      const endpoint = type === 'deposit' ? '/transactions/bulk-payment' : '/transactions/bulk-removal';
      await api.post(endpoint, {
        class_name: selectedClass,
        amount: parseFloat(bulkFormData.amount),
        description: bulkFormData.description || `Bulk ${type === 'deposit' ? 'payment' : 'withdrawal'} by teacher`
      });
      setSuccess(`Bulk ${type === 'deposit' ? 'payment' : 'withdrawal'} successful!`);
      setBulkFormData({ amount: '', description: '' });
      setShowBulkPaymentModal(false);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bulk operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLoanApproval = async (loanId: number, approved: boolean) => {
    setError(''); setSuccess(''); setActionLoading(true);
    try {
      await api.post('/loans/approve', { loan_id: loanId, approved });
      setSuccess(`Loan ${approved ? 'approved' : 'denied'} successfully!`);
      setShowLoanModal(false);
      setSelectedLoan(null);
      fetchData();
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
      fetchData();
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🏦</div>
          <div>
            <h1 className="text-2xl font-bold">Bank Management</h1>
            <p className="text-emerald-100">Teacher Administration Panel</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.studentCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-medium">Total Balance</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalBalance)}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Pending Loans</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingLoans}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs font-medium">Active Loans</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.activeLoans}</p>
        </div>
        <div
          className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm cursor-pointer hover:border-emerald-300 transition-colors"
          onClick={() => setActiveTab('transfers')}
        >
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <Send className="h-4 w-4" />
            <span className="text-xs font-medium">Pending Transfers</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.pendingTransfersCount}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center space-x-2 text-gray-500 mb-1">
            <History className="h-4 w-4" />
            <span className="text-xs font-medium">This Week</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.recentTransactions}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="font-medium text-gray-700">Filters</span>
        </div>
        
        {/* Class Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => { setSelectedClass('all'); setSelectedStudent(null); }}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              selectedClass === 'all' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Classes
          </button>
          {studentsByClass.sortedClasses.map((className) => (
            <button
              key={className}
              onClick={() => { setSelectedClass(className); setSelectedStudent(null); }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                selectedClass === className ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {className} ({studentsByClass.grouped[className].length})
            </button>
          ))}
        </div>

        {/* Search and Student Select */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedStudent?.id || ''}
              onChange={(e) => {
                const student = filteredStudents.find(s => s.id === parseInt(e.target.value));
                setSelectedStudent(student || null);
              }}
            >
              <option value="">All Students</option>
              {filteredStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username}
                </option>
              ))}
            </select>
          </div>
          {selectedStudent && (
            <button
              onClick={() => setSelectedStudent(null)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
            >
              Clear Student Filter
            </button>
          )}
        </div>
      </div>

      {/* Pending Transfers Alert Banner */}
      {stats.pendingTransfersCount > 0 && activeTab !== 'transfers' && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Send className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {stats.pendingTransfersCount} student transfer{stats.pendingTransfersCount !== 1 ? 's' : ''} waiting for approval
                </p>
                <p className="text-xs text-amber-600">Students have requested transfers to classmates. Review and approve or deny each request.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('transfers')}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'payments', label: 'Payments', icon: Banknote },
              { id: 'loans', label: 'Loans', icon: CreditCard },
              { id: 'transfers', label: 'Pending Transfers', icon: Send, badge: stats.pendingTransfersCount },
              { id: 'activity', label: 'Activity', icon: History }
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 relative ${
                  activeTab === id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="ml-1 bg-amber-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="space-y-6">
              {/* Basic Salary Settings */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-6 w-6 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Basic Salary Settings</h3>
                      <p className="text-sm text-gray-600">
                        Unemployed students receive R1,500/week on Mondays at 07:00
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
                
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-purple-100">
                  <div className="flex items-center space-x-3">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{unemployedCount} Unemployed Students</p>
                      <p className="text-sm text-gray-500">Will receive basic salary when paid</p>
                    </div>
                  </div>
                  <button
                    onClick={payBasicSalary}
                    disabled={actionLoading || unemployedCount === 0}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Banknote className="h-4 w-4" />
                    <span>{actionLoading ? 'Paying...' : 'Pay Basic Salary Now'}</span>
                  </button>
                </div>
                
                {bankSettings.last_basic_salary_run && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last auto-payment: {new Date(bankSettings.last_basic_salary_run).toLocaleString()}
                  </p>
                )}
              </div>

              {/* Bulk Actions */}
              {selectedClass !== 'all' && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-emerald-600" />
                    Bulk Actions for {selectedClass}
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setShowBulkPaymentModal(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Pay All Students</span>
                    </button>
                  </div>
                </div>
              )}

                {/* Student Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStudents.map((student) => {
                  const isNegativeBalance = Number(student.balance) < 0;
                  return (
                  <div
                    key={student.id}
                    className={`bg-white rounded-xl border-2 p-4 transition-all ${
                      isNegativeBalance
                        ? 'border-red-400 bg-red-50'
                        : selectedStudent?.id === student.id 
                          ? 'border-emerald-500 shadow-lg' 
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${isNegativeBalance ? 'bg-red-100' : 'bg-emerald-100'}`}>
                          <User className={`h-5 w-5 ${isNegativeBalance ? 'text-red-600' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {student.first_name && student.last_name 
                              ? `${student.first_name} ${student.last_name}` 
                              : student.username}
                          </h4>
                          <p className="text-sm text-gray-500">@{student.username}</p>
                        </div>
                      </div>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        {student.class || 'N/A'}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className={`text-2xl font-bold ${isNegativeBalance ? 'text-red-600' : 'text-emerald-600'}`}>
                        {formatCurrency(student.balance)}
                      </p>
                      <p className="text-xs text-gray-500">Account: {student.account_number}</p>
                      {isNegativeBalance && (
                        <p className="text-xs text-red-600 font-medium mt-1">⚠️ Negative balance</p>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => { setSelectedStudent(student); setPaymentType('deposit'); setShowPaymentModal(true); }}
                        className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center justify-center space-x-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </button>
                      <button
                        onClick={() => { setSelectedStudent(student); setPaymentType('withdraw'); setShowPaymentModal(true); }}
                        className="flex-1 px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm flex items-center justify-center space-x-1"
                      >
                        <Minus className="h-4 w-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>

              {filteredStudents.length === 0 && (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No students found</p>
                </div>
              )}
            </div>
          )}

          {/* Pending Transfers Tab */}
          {activeTab === 'transfers' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Student Transfer Requests
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Students request transfers to classmates. Approve or deny each request.
              </p>
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
                              fetchData();
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
                              fetchData();
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

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-6">
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
                      fetchData();
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
              {filteredLoans.filter(l => l.status === 'pending').length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="h-5 w-5 text-amber-600 mr-2" />
                    Pending Approval ({filteredLoans.filter(l => l.status === 'pending').length})
                  </h3>
                  <div className="space-y-4">
                    {filteredLoans.filter(l => l.status === 'pending').map((loan) => (
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
                            <p className="text-sm text-gray-500">Monthly Payment</p>
                            <p className="font-semibold">{formatCurrency(loan.monthly_payment)}</p>
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
              {filteredLoans.filter(l => ['active', 'approved'].includes(l.status)).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="h-5 w-5 text-blue-600 mr-2" />
                    Active Loans ({filteredLoans.filter(l => ['active', 'approved'].includes(l.status)).length})
                  </h3>
                  <div className="space-y-4">
                    {filteredLoans.filter(l => ['active', 'approved'].includes(l.status)).map((loan) => (
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
                            <p className="text-sm text-gray-500">Monthly Payment</p>
                            <p className="font-semibold">{formatCurrency(loan.monthly_payment)}</p>
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
              {filteredLoans.filter(l => ['paid_off', 'denied'].includes(l.status)).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="h-5 w-5 text-gray-600 mr-2" />
                    Completed/Denied ({filteredLoans.filter(l => ['paid_off', 'denied'].includes(l.status)).length})
                  </h3>
                  <div className="space-y-4">
                    {filteredLoans.filter(l => ['paid_off', 'denied'].includes(l.status)).map((loan) => (
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

              {filteredLoans.length === 0 && (
                <div className="text-center py-12">
                  <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No loan applications found</p>
                </div>
              )}
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                <span className="text-sm text-gray-500">{filteredTransactions.length} transactions</span>
              </div>

              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No transactions found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTransactions.map((transaction) => (
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
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {paymentType === 'deposit' ? 'Add Money to' : 'Remove Money from'} {selectedStudent.first_name || selectedStudent.username}
            </h3>
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={paymentType === 'withdraw' ? selectedStudent.balance : undefined}
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  />
                </div>
                {paymentType === 'withdraw' && (
                  <p className="text-sm text-gray-500 mt-1">Available: {formatCurrency(selectedStudent.balance)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder={paymentType === 'deposit' ? 'e.g., Salary, Bonus, Reward' : 'e.g., Fine, Expense'}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className={`flex-1 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
                    paymentType === 'deposit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {actionLoading ? 'Processing...' : paymentType === 'deposit' ? 'Add Money' : 'Remove Money'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && selectedClass !== 'all' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Bulk Payment to {selectedClass}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              This will add money to all {studentsByClass.grouped[selectedClass]?.length || 0} students in {selectedClass}
            </p>
            <form onSubmit={(e) => handleBulkPayment(e, 'deposit')} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount per student</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    value={bulkFormData.amount}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, amount: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g., Weekly allowance, Class bonus"
                  value={bulkFormData.description}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, description: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Pay All Students'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🏦</div>
          <div>
            <h1 className="text-2xl font-bold">Bank</h1>
            <p className="text-primary-100">Financial Services System</p>
          </div>
        </div>
      </div>

      {/* Account Balance Card */}
      <div className={`card ${(account?.balance || 0) < 0 ? 'border-2 border-red-500 bg-red-50' : ''}`}>
        <div className="flex items-center justify-between">
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
          <div className={`p-4 rounded-full ${(account?.balance || 0) < 0 ? 'bg-red-100' : 'bg-primary-100'}`}>
            <Wallet className={`h-8 w-8 ${(account?.balance || 0) < 0 ? 'text-red-600' : 'text-primary-600'}`} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: Wallet },
              { id: 'transfer', label: 'Transfer Money', icon: Send },
              { id: 'loans', label: 'Loans', icon: DollarSign },
              { id: 'history', label: 'History', icon: History }
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
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-success-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                    <span className="ml-2 text-sm font-medium text-success-800">Total Deposits</span>
                  </div>
                  <p className="text-2xl font-bold text-success-600 mt-1">
                    {formatCurrency(
                      transactions
                        .filter(t => ['deposit', 'salary'].includes(t.transaction_type))
                        .reduce((sum, t) => sum + t.amount, 0)
                    )}
                  </p>
                </div>

                <div className="bg-warning-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-warning-600" />
                    <span className="ml-2 text-sm font-medium text-warning-800">Active Loans</span>
                  </div>
                  <p className="text-2xl font-bold text-warning-600 mt-1">
                    {loans.filter(l => l.status === 'active').length}
                  </p>
                </div>

                <div className="bg-primary-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Send className="h-5 w-5 text-primary-600" />
                    <span className="ml-2 text-sm font-medium text-primary-800">Transfers Made</span>
                  </div>
                  <p className="text-2xl font-bold text-primary-600 mt-1">
                    {transactions.filter(t => t.transaction_type === 'transfer' && t.from_username === user?.username).length}
                  </p>
                </div>
              </div>

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
    </div>
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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
