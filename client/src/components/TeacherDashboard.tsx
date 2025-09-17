import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Users, DollarSign, TrendingUp, CheckCircle, Download } from 'lucide-react';
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
      const activeLoans = loansRes.data.filter((loan: any) => loan.status === 'active');
      const approvedLoans = loansRes.data.filter((loan: any) => loan.status === 'approved');
      console.log('🔍 Pending loans:', pendingLoans.length);
      console.log('🔍 Active loans:', activeLoans.length);
      console.log('🔍 Approved loans:', approvedLoans.length);
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
  const activeLoans = loans.filter(loan => loan.status === 'active');
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
        <h1 className="text-2xl font-bold mb-2">Welcome, {user?.username}! 👨‍🏫</h1>
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
    </div>
  );
};

export default TeacherDashboard;
