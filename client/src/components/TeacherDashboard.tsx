import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, DollarSign, TrendingUp, CheckCircle, Download, AlertTriangle, Trash2 } from 'lucide-react';
import api from '../services/api';
import { Student, Loan, Transaction } from '../types';
import StudentManagement from './StudentManagement';
import LoanManagement from './LoanManagement';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'loans' | 'transactions'>('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔍 Fetching teacher data...');
      const [studentsRes, loansRes, transactionsRes] = await Promise.all([
        api.get('/students'),
        api.get('/loans'),
        api.get('/transactions/history')
      ]);
      console.log('📊 Students:', studentsRes.data);
      console.log('💰 Loans:', loansRes.data);
      console.log('📈 Transactions:', transactionsRes.data);
      
      // Debug loan filtering
      const pendingLoans = loansRes.data.filter((loan: any) => loan.status === 'pending');
      const activeLoans = loansRes.data.filter((loan: any) => loan.status === 'active' || loan.status === 'approved');
      const approvedLoans = loansRes.data.filter((loan: any) => loan.status === 'approved');
      console.log('🔍 Pending loans:', pendingLoans.length);
      console.log('🔍 Active loans (including approved):', activeLoans.length);
      console.log('🔍 Approved loans only:', approvedLoans.length);
      console.log('🔍 All loan statuses:', loansRes.data.map((l: any) => l.status));
      setStudents(studentsRes.data);
      setLoans(loansRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
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

  const totalClassBalance = students.reduce((sum, student) => sum + (Number(student.balance) || 0), 0);
  const pendingLoans = loans.filter(loan => loan.status === 'pending');
  const activeLoans = loans.filter(loan => loan.status === 'active' || loan.status === 'approved');
  const recentTransactions = transactions.slice(0, 10);

  const handleExport = async (type: 'transactions' | 'students' | 'loans') => {
    try {
      const response = await api.get(`/export/${type}/csv`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleResetAllLoans = async () => {
    try {
      setResetting(true);
      const response = await api.post('/loans/admin/reset-all-loans');
      
      console.log('Reset response:', response.data);
      alert(`Success! Reset completed:\n- ${response.data.deleted.loans} loans deleted\n- ${response.data.deleted.payments} payments deleted\n- ${response.data.deleted.transactions} transactions deleted`);
      
      // Refresh all data
      await fetchData();
      setShowResetConfirm(false);
    } catch (error: any) {
      console.error('Reset failed:', error);
      alert('Failed to reset loan data: ' + (error.response?.data?.error || error.message));
    } finally {
      setResetting(false);
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Game of Life Bank - Welcome, {user?.username}! 👨‍🏫</h1>
        <p className="text-primary-100">Manage your classroom's financial simulation</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-primary-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-success-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Class Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalClassBalance)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-warning-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Loans</p>
              <p className="text-2xl font-bold text-gray-900">{pendingLoans.length}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Loans</p>
              <p className="text-2xl font-bold text-gray-900">{activeLoans.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: TrendingUp },
              { id: 'students', label: 'Students', icon: Users },
              { id: 'loans', label: 'Loans', icon: DollarSign },
              { id: 'transactions', label: 'Transactions', icon: CheckCircle }
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
              {/* Top Students by Balance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Students by Balance</h3>
                <div className="space-y-3">
                  {students
                    .sort((a, b) => b.balance - a.balance)
                    .slice(0, 5)
                    .map((student, index) => (
                      <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-semibold text-primary-600">#{index + 1}</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {student.first_name && student.last_name 
                                ? `${student.first_name} ${student.last_name}` 
                                : student.username
                              }
                            </p>
                            <p className="text-sm text-gray-500">
                              {student.class && `Class ${student.class}`} • Account: {student.account_number}
                            </p>
                            {student.email && (
                              <p className="text-xs text-gray-400">{student.email}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success-600">{formatCurrency(Number(student.balance) || 0)}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-4 w-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description || transaction.transaction_type}
                          </p>
                          <p className="text-sm text-gray-500">
                            {transaction.from_username && transaction.to_username
                              ? `${transaction.from_username} → ${transaction.to_username}`
                              : formatDate(transaction.created_at)
                            }
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Tools */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Tools</h3>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-red-800 mb-1">Reset All Loan Data</h4>
                      <p className="text-sm text-red-700 mb-3">
                        This will permanently delete ALL loan data including loans, payments, and related transactions. 
                        This action cannot be undone. Use this to reset the system for a new semester or class.
                      </p>
                      <button
                        onClick={() => setShowResetConfirm(true)}
                        disabled={resetting}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>{resetting ? 'Resetting...' : 'Reset All Loan Data'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Student Management</h3>
                <button
                  onClick={() => handleExport('students')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <StudentManagement students={students} onUpdate={fetchData} />
            </div>
          )}

          {/* Loans Tab */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Loan Management</h3>
                <button
                  onClick={() => handleExport('loans')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <LoanManagement loans={loans} onUpdate={fetchData} />
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">All Transactions</h3>
                <button
                  onClick={() => handleExport('transactions')}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </button>
              </div>
              <div className="space-y-2">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <DollarSign className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {transaction.description || transaction.transaction_type}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.from_username && transaction.to_username
                            ? `${transaction.from_username} → ${transaction.to_username}`
                            : formatDate(transaction.created_at)
                          }
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(transaction.amount)}</p>
                      <p className="text-sm text-gray-500">{formatDate(transaction.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Reset</h3>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-700 mb-3">
                Are you absolutely sure you want to reset ALL loan data? This will permanently delete:
              </p>
              <ul className="text-sm text-gray-600 space-y-1 ml-4">
                <li>• All loans ({loans.length} loans)</li>
                <li>• All loan payments</li>
                <li>• All loan-related transactions</li>
              </ul>
              <p className="text-sm text-red-600 font-semibold mt-3">
                ⚠️ This action cannot be undone!
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetAllLoans}
                disabled={resetting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center space-x-2"
              >
                {resetting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Resetting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Reset All Data</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
