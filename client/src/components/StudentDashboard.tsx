import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Wallet, Send, DollarSign, History, TrendingUp, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Transaction, Loan } from '../types';
import TransferForm from './TransferForm';
import LoanForm from './LoanForm';

const StudentDashboard: React.FC = () => {
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
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.username}! 🎓</h1>
        <p className="text-primary-100">Manage your virtual finances and learn about money!</p>
      </div>

      {/* Account Balance Card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Account Balance</h2>
            <p className="text-3xl font-bold text-primary-600">
              {formatCurrency(account?.balance || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Account: {account?.account_number}
            </p>
          </div>
          <div className="bg-primary-100 p-4 rounded-full">
            <Wallet className="h-8 w-8 text-primary-600" />
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
