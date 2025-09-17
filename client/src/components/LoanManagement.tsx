import React, { useState } from 'react';
import { CheckCircle, XCircle, DollarSign, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Loan } from '../types';

interface LoanManagementProps {
  loans: Loan[];
  onUpdate: () => void;
}

const LoanManagement: React.FC<LoanManagementProps> = ({ loans, onUpdate }) => {
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  console.log('🔍 LoanManagement received loans:', loans);
  console.log('🔍 Loan count:', loans.length);
  console.log('🔍 Loan statuses:', loans.map(l => l.status));

  const handleApproveLoan = async (loanId: number, approved: boolean) => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/loans/approve', {
        loan_id: loanId,
        approved
      });

      setSuccess(`Loan ${approved ? 'approved' : 'denied'} successfully!`);
      setShowApprovalModal(false);
      setSelectedLoan(null);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update loan status');
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <AlertCircle className="h-4 w-4" />;
      case 'approved':
      case 'paid_off':
        return <CheckCircle className="h-4 w-4" />;
      case 'denied':
        return <XCircle className="h-4 w-4" />;
      case 'active':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const pendingLoans = loans.filter(loan => loan.status === 'pending');
  const activeLoans = loans.filter(loan => loan.status === 'active');
  const approvedLoans = loans.filter(loan => loan.status === 'approved');
  const completedLoans = loans.filter(loan => loan.status === 'paid_off' || loan.status === 'denied');
  
  console.log('🔍 Filtered loans - Pending:', pendingLoans.length, 'Active:', activeLoans.length, 'Approved:', approvedLoans.length, 'Completed:', completedLoans.length);

  return (
    <div className="space-y-6">
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

      {/* Pending Loans */}
      {pendingLoans.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            Pending Approval ({pendingLoans.length})
          </h3>
          <div className="space-y-4">
            {pendingLoans.map((loan) => (
              <div key={loan.id} className="card border-l-4 border-yellow-400">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Loan #{loan.id} - {loan.borrower_username}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Applied on {formatDate(loan.created_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                    <span>{loan.status.toUpperCase()}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Term</p>
                    <p className="font-semibold text-gray-900">{loan.term_months} months</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Interest Rate</p>
                    <p className="font-semibold text-gray-900">{(loan.interest_rate * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setSelectedLoan(loan);
                      setShowApprovalModal(true);
                    }}
                    className="btn-primary"
                  >
                    Review Application
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved/Active Loans */}
      {(activeLoans.length > 0 || approvedLoans.length > 0) && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
            Active Loans ({activeLoans.length + approvedLoans.length})
          </h3>
          <div className="space-y-4">
            {[...activeLoans, ...approvedLoans].map((loan) => (
              <div key={loan.id} className="card border-l-4 border-blue-400">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Loan #{loan.id} - {loan.borrower_username}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Approved on {formatDate(loan.approved_at || '')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                    <span>{loan.status.toUpperCase()}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Original Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.outstanding_balance)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Monthly Payment</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.monthly_payment)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining Payments</p>
                    <p className="font-semibold text-gray-900">{loan.payments_remaining || 0}</p>
                  </div>
                </div>

                {loan.total_paid && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Total Paid:</strong> {formatCurrency(loan.total_paid)}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Loans */}
      {completedLoans.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <CheckCircle className="h-5 w-5 text-gray-600 mr-2" />
            Completed Loans ({completedLoans.length})
          </h3>
          <div className="space-y-4">
            {completedLoans.map((loan) => (
              <div key={loan.id} className="card border-l-4 border-gray-400">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      Loan #{loan.id} - {loan.borrower_username}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {loan.status === 'paid_off' ? 'Paid off' : 'Denied'} on {formatDate(loan.approved_at || loan.created_at)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(loan.status)}`}>
                    {getStatusIcon(loan.status)}
                    <span>{loan.status.replace('_', ' ').toUpperCase()}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="font-semibold text-gray-900">{formatCurrency(loan.amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold text-gray-900">
                      {loan.status === 'paid_off' ? 'Fully Paid' : 'Denied'}
                    </p>
                  </div>
                  {loan.total_paid && (
                    <div>
                      <p className="text-sm text-gray-500">Total Paid</p>
                      <p className="font-semibold text-gray-900">{formatCurrency(loan.total_paid)}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-500">Term</p>
                    <p className="font-semibold text-gray-900">{loan.term_months} months</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Review Loan Application
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Loan Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Borrower:</span>
                    <span className="font-medium">{selectedLoan.borrower_username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Amount:</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Term:</span>
                    <span className="font-medium">{selectedLoan.term_months} months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Monthly Payment:</span>
                    <span className="font-medium">{formatCurrency(selectedLoan.monthly_payment)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Interest Rate:</span>
                    <span className="font-medium">{(selectedLoan.interest_rate * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => handleApproveLoan(selectedLoan.id, true)}
                disabled={loading}
                className="flex-1 btn-success disabled:opacity-50"
              >
                {loading ? 'Approving...' : 'Approve Loan'}
              </button>
              <button
                onClick={() => handleApproveLoan(selectedLoan.id, false)}
                disabled={loading}
                className="flex-1 btn-warning disabled:opacity-50"
              >
                {loading ? 'Denying...' : 'Deny Loan'}
              </button>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Loans Message */}
      {loans.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No loan applications yet.</p>
        </div>
      )}
    </div>
  );
};

export default LoanManagement;
