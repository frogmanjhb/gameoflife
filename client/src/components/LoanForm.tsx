import React, { useState, useEffect } from 'react';
import { DollarSign, Calendar, AlertCircle, Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react';
import api from '../services/api';
import { Loan } from '../types';

interface LoanFormProps {
  onSuccess: () => void;
}

interface LoanEligibility {
  eligible: boolean;
  reason: string | null;
  hasJob: boolean;
  jobName: string | null;
  salary: number;
  maxLoanAmount: number;
  maxWeeks: number;
  maxWeeklyPayment?: number;
}

const LoanForm: React.FC<LoanFormProps> = ({ onSuccess }) => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [eligibility, setEligibility] = useState<LoanEligibility | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    term_weeks: '4'
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [loansRes, eligibilityRes] = await Promise.all([
        api.get('/loans'),
        api.get('/loans/eligibility')
      ]);
      setLoans(loansRes.data);
      setEligibility(eligibilityRes.data);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateLoanDetails = () => {
    const amount = parseFloat(formData.amount) || 0;
    const weeks = parseInt(formData.term_weeks) || 4;
    
    // Calculate interest rate based on term
    let interestRate: number;
    if (weeks <= 4) {
      interestRate = 0.05; // 5%
    } else if (weeks <= 8) {
      interestRate = 0.08; // 8%
    } else {
      interestRate = 0.10; // 10%
    }
    
    const totalAmount = amount * (1 + interestRate);
    const weeklyPayment = totalAmount / weeks;
    
    return {
      interestRate,
      totalAmount,
      weeklyPayment,
      interestAmount: totalAmount - amount
    };
  };

  const handleApplyLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const response = await api.post('/loans/apply', {
        amount: parseFloat(formData.amount),
        term_weeks: parseInt(formData.term_weeks)
      });

      setSuccess('Loan application submitted successfully! Weekly payment: R' + response.data.weeklyPayment?.toFixed(2));
      setFormData({ amount: '', term_weeks: '4' });
      setShowApplyForm(false);
      fetchData();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Loan application failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMakePayment = async (loanId: number, amount: number) => {
    try {
      await api.post('/loans/pay', {
        loan_id: loanId,
        amount: amount
      });
      setSuccess('Payment successful!');
      fetchData();
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed');
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
  const hasApprovedLoan = loans.some(loan => loan.status === 'approved');
  const hasActiveLoan = loans.some(loan => loan.status === 'active');
  const activeLoan = loans.find(loan => loan.status === 'active');

  const loanDetails = calculateLoanDetails();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <XCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 mr-2" />
          {success}
        </div>
      )}

      {/* Job Status Card */}
      <div className={`rounded-xl p-4 ${eligibility?.hasJob ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <div className="flex items-center space-x-3">
          <Briefcase className={`h-6 w-6 ${eligibility?.hasJob ? 'text-green-600' : 'text-yellow-600'}`} />
          <div>
            <h3 className={`font-semibold ${eligibility?.hasJob ? 'text-green-900' : 'text-yellow-900'}`}>
              {eligibility?.hasJob ? `Job: ${eligibility.jobName}` : 'No Job Assigned'}
            </h3>
            {eligibility?.hasJob ? (
              <p className="text-sm text-green-700">
                Weekly Salary: {formatCurrency(eligibility.salary)} • Max Loan: {formatCurrency(eligibility.maxLoanAmount)}
              </p>
            ) : (
              <p className="text-sm text-yellow-700">
                You need a job to apply for a loan. Apply for a job in the Jobs section.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Apply for Loan Button */}
      {eligibility?.eligible && !showApplyForm && (
        <div className="text-center">
          <button
            onClick={() => setShowApplyForm(true)}
            className="btn-primary"
          >
            Apply for a Loan
          </button>
        </div>
      )}

      {/* Not Eligible Message */}
      {eligibility && !eligibility.eligible && eligibility.reason && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-gray-500 mr-3" />
            <div>
              <h3 className="font-semibold text-gray-900">Cannot Apply for Loan</h3>
              <p className="text-sm text-gray-600">{eligibility.reason}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loan Status Messages */}
      {hasApprovedLoan && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
            <div>
              <h3 className="font-semibold text-green-900">Loan Approved!</h3>
              <p className="text-sm text-green-800">
                Your loan has been approved and the money is being processed. Payments will start next Monday.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Active Loan Warning */}
      {activeLoan && activeLoan.next_payment_date && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Clock className="h-5 w-5 text-blue-600 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-900">Next Payment Due</h3>
                <p className="text-sm text-blue-800">
                  {formatDate(activeLoan.next_payment_date)} • {formatCurrency(activeLoan.weekly_payment || activeLoan.monthly_payment / 4.33)}
                </p>
              </div>
            </div>
            <button
              onClick={() => handleMakePayment(activeLoan.id, activeLoan.weekly_payment || activeLoan.monthly_payment / 4.33)}
              className="btn-success text-sm"
            >
              Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Apply Form */}
      {showApplyForm && eligibility?.eligible && (
        <div className="card max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Apply for a Loan</h3>
          <form onSubmit={handleApplyLoan} className="space-y-4">
            <div>
              <label htmlFor="amount" className="label">
                <DollarSign className="h-4 w-4 inline mr-1" />
                Loan Amount (Max: {formatCurrency(eligibility.maxLoanAmount)})
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="1"
                max={eligibility.maxLoanAmount}
                required
                className="input-field"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="term_weeks" className="label">
                <Calendar className="h-4 w-4 inline mr-1" />
                Repayment Term (Weeks)
              </label>
              <select
                id="term_weeks"
                name="term_weeks"
                className="input-field"
                value={formData.term_weeks}
                onChange={(e) => setFormData({ ...formData, term_weeks: e.target.value })}
              >
                <option value="2">2 weeks (5% interest)</option>
                <option value="4">4 weeks (5% interest)</option>
                <option value="6">6 weeks (8% interest)</option>
                <option value="8">8 weeks (8% interest)</option>
                <option value="10">10 weeks (10% interest)</option>
                <option value="12">12 weeks (10% interest)</option>
              </select>
            </div>

            {/* Loan Preview */}
            {parseFloat(formData.amount) > 0 && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-gray-900">Loan Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-500">Principal:</div>
                  <div className="font-medium">{formatCurrency(parseFloat(formData.amount))}</div>
                  <div className="text-gray-500">Interest ({(loanDetails.interestRate * 100).toFixed(0)}%):</div>
                  <div className="font-medium">{formatCurrency(loanDetails.interestAmount)}</div>
                  <div className="text-gray-500">Total Repayment:</div>
                  <div className="font-medium text-primary-600">{formatCurrency(loanDetails.totalAmount)}</div>
                  <div className="text-gray-500">Weekly Payment:</div>
                  <div className="font-medium text-primary-600">{formatCurrency(loanDetails.weeklyPayment)}</div>
                </div>
                {eligibility.maxWeeklyPayment && loanDetails.weeklyPayment > eligibility.maxWeeklyPayment && (
                  <div className="mt-2 p-2 bg-red-100 rounded text-red-700 text-sm">
                    ⚠️ Weekly payment exceeds 50% of your salary. Please reduce the amount or extend the term.
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting || (eligibility.maxWeeklyPayment && loanDetails.weeklyPayment > eligibility.maxWeeklyPayment)}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {submitting ? 'Applying...' : 'Apply'}
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
                    <p className="text-sm text-gray-500">Weekly Payment</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(loan.weekly_payment || loan.monthly_payment / 4.33)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.outstanding_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Term</p>
                    <p className="font-semibold text-gray-900">
                      {loan.term_weeks ? `${loan.term_weeks} weeks` : `${loan.term_months} months`}
                    </p>
                  </div>
                </div>

                {loan.status === 'active' && (
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Payments Remaining</p>
                        <p className="font-semibold text-gray-900">{loan.payments_remaining || 0}</p>
                        {loan.next_payment_date && (
                          <p className="text-xs text-gray-500">
                            Next payment: {formatDate(loan.next_payment_date)}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleMakePayment(loan.id, loan.weekly_payment || loan.monthly_payment / 4.33)}
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

                {loan.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <p className="text-sm text-green-800">
                        Your loan has been approved! The money will be disbursed to your account shortly.
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
          <li>• <strong>Job Required:</strong> You must have a job to apply for a loan</li>
          <li>• <strong>Loan Amount:</strong> Based on your salary (max loan = up to 6x weekly salary)</li>
          <li>• <strong>Interest rates:</strong> 5% (1-4 weeks), 8% (5-8 weeks), 10% (9-12 weeks)</li>
          <li>• <strong>Payments:</strong> Automatic weekly payments every Monday</li>
          <li>• <strong>Payment Limit:</strong> Weekly payment cannot exceed 50% of your salary</li>
          <li>• <strong>Important:</strong> If you don't have enough funds, payment still goes through (negative balance)</li>
          <li>• <strong>Restrictions:</strong> Clear any negative balance before new loans or transfers</li>
        </ul>
      </div>
    </div>
  );
};

export default LoanForm;
