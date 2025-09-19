import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Loan } from '../types';

interface LoanFormProps {
  onSuccess: () => void;
}

const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    term_months: '12'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const response = await api.get('/loans');
      setLoans(response.data);
    } catch (err) {
      console.error('Failed to fetch loans:', err);
    }
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/loans/apply', {
        amount: parseFloat(formData.amount),
        term_months: parseInt(formData.term_months)
      });

      setSuccess('Loan application submitted successfully!');
      setFormData({ amount: '', term_months: '12' });
      setShowApplyForm(false);
      fetchLoans();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Loan application failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMakePayment = async (loanId: number, amount: number) => {
    try {
      await api.post('/loans/pay', {
        loan_id: loanId,
        amount: amount
      });
      setSuccess('Payment successful!');
      fetchLoans();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed');
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
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'paid_off':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const hasPendingLoan = loans.some(loan => loan.status === 'pending');
  const hasActiveLoan = loans.some(loan => loan.status === 'active');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="h-8 w-8 text-primary-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Loan Center</h2>
        <p className="text-gray-600">Apply for loans and manage your payments</p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Apply for Loan Button */}
      {!hasPendingLoan && !hasActiveLoan && (
        <div className="text-center">
          <button
            onClick={() => setShowApplyForm(true)}
            className="btn-primary"
          >
            Apply for a Loan
          </button>
        </div>
      )}

      {/* Apply Form */}
      {showApplyForm && (
        <div className="card max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for a Loan</h3>
          <form onSubmit={handleApplyLoan} className="space-y-4">
            <div>
              <label htmlFor="amount" className="label">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Loan Amount
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="1"
                required
                className="input-field"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="term_months" className="label">
                <Calendar className="h-4 w-4 inline mr-1" />
                Repayment Term (Months)
              </label>
              <select
                id="term_months"
                name="term_months"
                className="input-field"
                value={formData.term_months}
                onChange={(e) => setFormData({ ...formData, term_months: e.target.value })}
              >
                <option value="6">6 months (5% interest)</option>
                <option value="12">12 months (10% interest)</option>
                <option value="24">24 months (12% interest)</option>
                <option value="48">48 months (15% interest)</option>
              </select>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {loading ? 'Applying...' : 'Apply'}
              </button>
              <button
                type="button"
                onClick={() => setShowApplyForm(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loans List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Loans</h3>
        
        {loans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No loans yet. Apply for your first loan to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => (
              <div key={loan.id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Loan #{loan.id}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Applied on {formatDate(loan.created_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                    {loan.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.outstanding_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Term</p>
                    <p className="font-semibold text-gray-900">{loan.term_months} months</p>
                  </div>
                </div>

                {loan.status === 'active' && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Remaining Payments</p>
                        <p className="font-semibold text-gray-900">{loan.payments_remaining || 0}</p>
                      </div>
                      <button
                        onClick={() => handleMakePayment(loan.id, loan.monthly_payment)}
                        className="btn-success"
                      >
                        Make Payment
                      </button>
                    </div>
                  </div>
                )}

                {loan.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">
                        Your loan application is pending teacher approval.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loan Information */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 Loan Information:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Interest rates: 5% (6 months), 10% (12 months), 12% (24 months), 15% (48 months)</li>
          <li>• You can only have one active loan at a time</li>
          <li>• Teachers must approve all loan applications</li>
          <li>• Make payments on time to avoid penalties</li>
        </ul>
      </div>
    </div>
  );
};

export default LoanForm;
