import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  DollarSign,
  Loader2,
  MessageSquare,
  Send,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { transactionsApi } from '../services/api';
import { AccountantClientDetailsResponse, Transaction } from '../types';
import { useAuth } from '../contexts/AuthContext';

const formatCurrency = (amount: number | string) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(amount));

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-ZA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const formatShortDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' });

const getDisplayName = (student: AccountantClientDetailsResponse['student']) => {
  if (student.first_name && student.last_name) {
    return `${student.first_name} ${student.last_name}`;
  }
  return student.username;
};

const getTransactionLabel = (tx: Transaction, clientUsername: string) => {
  const isOutgoing = tx.from_username === clientUsername;
  if (tx.transaction_type === 'transfer') {
    return isOutgoing ? `Transfer to ${tx.to_username}` : `Transfer from ${tx.from_username}`;
  }
  return tx.description || tx.transaction_type;
};

const AccountantClientDetailView: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [data, setData] = useState<AccountantClientDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'advice'>('overview');
  const [adviceText, setAdviceText] = useState('');
  const [adviceSubmitting, setAdviceSubmitting] = useState(false);
  const [adviceError, setAdviceError] = useState('');
  const [adviceSuccess, setAdviceSuccess] = useState('');

  const loadDetails = useCallback(async () => {
    if (!username) return;
    try {
      setLoading(true);
      setError('');
      const res = await transactionsApi.getAccountantClientDetails(username);
      setData(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load client details'
      );
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleSubmitAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    try {
      setAdviceSubmitting(true);
      setAdviceError('');
      setAdviceSuccess('');
      const res = await transactionsApi.submitAccountantClientAdvice(username, adviceText.trim());
      setAdviceSuccess(res.data.message);
      setAdviceText('');
      await loadDetails();
      await refreshProfile();
      setTimeout(() => setAdviceSuccess(''), 6000);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string; errors?: { msg?: string }[] } } };
      setAdviceError(
        apiErr.response?.data?.error ||
          apiErr.response?.data?.errors?.[0]?.msg ||
          'Failed to submit advice'
      );
    } finally {
      setAdviceSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button type="button" onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="card max-w-lg mx-auto p-6 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-red-700">{error || 'Client not found'}</p>
        </div>
      </div>
    );
  }

  const { student, transactions, loans, prior_advice, advice_xp_reward, advice_earnings_reward } = data;
  const clientUsername = student.username;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to My Job
          </button>
          <h1 className="text-xl font-bold text-gray-900">{getDisplayName(student)}</h1>
          <p className="text-sm text-gray-600">
            @{student.username}
            {student.class ? ` · ${student.class}` : ''}
          </p>
          <p className="text-xs text-emerald-700 mt-1">Read-only client view · Chartered Accountant</p>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-1 border-t border-gray-100">
          {(['overview', 'transactions', 'advice'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'overview' ? 'Overview' : tab === 'transactions' ? 'Transactions' : 'Advice'}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Balance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(student.balance ?? 0)}
                </p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Account</p>
                <p className="text-lg font-semibold text-gray-900">{student.account_number || '—'}</p>
              </div>
              <div className="card p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Active loans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {loans.filter((l) => l.status === 'active').length}
                </p>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent activity</h2>
              {transactions.length === 0 ? (
                <p className="text-sm text-gray-500">No transactions yet.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 8).map((tx) => {
                    const isOutgoing = tx.from_username === clientUsername;
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-full ${isOutgoing ? 'bg-red-100' : 'bg-green-100'}`}
                          >
                            {isOutgoing ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {getTransactionLabel(tx, clientUsername)}
                            </p>
                            <p className="text-xs text-gray-500">{formatShortDate(tx.created_at)}</p>
                          </div>
                        </div>
                        <p
                          className={`font-semibold text-sm ${
                            isOutgoing ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {isOutgoing ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'transactions' && (
          <div className="card p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Transaction history ({transactions.length})
            </h2>
            {transactions.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                <DollarSign className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p>No transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isOutgoing = tx.from_username === clientUsername;
                  return (
                    <div key={tx.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {getTransactionLabel(tx, clientUsername)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{tx.transaction_type}</p>
                          {tx.description && (
                            <p className="text-sm text-gray-600 mt-1">{tx.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">{formatDate(tx.created_at)}</p>
                        </div>
                        <p
                          className={`font-bold shrink-0 ${
                            isOutgoing ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {isOutgoing ? '-' : '+'}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'advice' && (
          <div className="space-y-4">
            <div className="card p-4 border border-emerald-100 bg-emerald-50/50">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Advice & suggestions</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Share financial guidance for this client. Each submission earns {advice_xp_reward}{' '}
                    XP and {formatCurrency(advice_earnings_reward)} (paid from the town treasury).
                  </p>
                </div>
              </div>
            </div>

            {adviceError && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {adviceError}
              </p>
            )}
            {adviceSuccess && (
              <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                {adviceSuccess}
              </p>
            )}

            <form onSubmit={handleSubmitAdvice} className="card p-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700" htmlFor="client-advice">
                Your advice
              </label>
              <textarea
                id="client-advice"
                value={adviceText}
                onChange={(e) => setAdviceText(e.target.value)}
                rows={5}
                maxLength={2000}
                required
                disabled={adviceSubmitting}
                className="input-field w-full"
                placeholder="e.g. You are spending a lot on transfers — try saving 20% of each salary payment."
              />
              <p className="text-xs text-gray-500">At least 20 characters.</p>
              <button
                type="submit"
                disabled={adviceSubmitting || adviceText.trim().length < 20}
                className="btn-primary flex items-center gap-2"
              >
                {adviceSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                Submit advice
              </button>
            </form>

            {prior_advice.length > 0 && (
              <div className="card p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Your previous advice</h3>
                <ul className="space-y-3">
                  {prior_advice.map((row) => (
                    <li key={row.id} className="text-sm border-l-2 border-emerald-300 pl-3">
                      <p className="text-gray-800">{row.advice_text}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatDate(row.created_at)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-gray-500">
          <Link to="/" className="text-emerald-600 hover:underline">
            Town Hub
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AccountantClientDetailView;
