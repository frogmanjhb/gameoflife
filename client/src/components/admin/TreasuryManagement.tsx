import React, { useState, useEffect } from 'react';
import { useTown } from '../../contexts/TownContext';
import { treasuryApi } from '../../services/api';
import { TreasuryInfo, TaxReport, TaxBracket, SalaryPaymentResult } from '../../types';
import { 
  Wallet, TrendingUp, TrendingDown, Receipt, Users, 
  DollarSign, ToggleLeft, ToggleRight, Download, Upload,
  AlertCircle, CheckCircle, Clock, FileText, RefreshCw
} from 'lucide-react';

const TreasuryManagement: React.FC = () => {
  const { currentTownClass, refreshTown } = useTown();
  const [treasuryInfo, setTreasuryInfo] = useState<TreasuryInfo | null>(null);
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [taxBrackets, setTaxBrackets] = useState<TaxBracket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'tax-report' | 'pay-salaries'>('overview');
  
  // Form states
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDescription, setDepositDescription] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDescription, setWithdrawDescription] = useState('');
  const [basicSalaryAmount, setBasicSalaryAmount] = useState('1500');
  
  // Action states
  const [processing, setProcessing] = useState(false);
  const [lastPaymentResult, setLastPaymentResult] = useState<SalaryPaymentResult | null>(null);
  const [reportPeriod, setReportPeriod] = useState<'week' | 'month' | 'all'>('month');

  useEffect(() => {
    if (currentTownClass) {
      fetchData();
    }
  }, [currentTownClass, reportPeriod]);

  const fetchData = async () => {
    if (!currentTownClass) return;
    
    setLoading(true);
    try {
      const [treasuryRes, taxReportRes, bracketsRes] = await Promise.all([
        treasuryApi.getTreasuryInfo(currentTownClass),
        treasuryApi.getTaxReport(currentTownClass, reportPeriod),
        treasuryApi.getTaxBrackets()
      ]);
      setTreasuryInfo(treasuryRes.data);
      setTaxReport(taxReportRes.data);
      setTaxBrackets(bracketsRes.data);
    } catch (error) {
      console.error('Failed to fetch treasury data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const handleToggleTax = async () => {
    if (!currentTownClass || !treasuryInfo) return;
    
    setProcessing(true);
    try {
      await treasuryApi.toggleTax(currentTownClass, !treasuryInfo.tax_enabled);
      await fetchData();
      await refreshTown();
    } catch (error) {
      console.error('Failed to toggle tax:', error);
      alert('Failed to toggle tax');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTownClass || !depositAmount) return;
    
    setProcessing(true);
    try {
      await treasuryApi.depositToTreasury(currentTownClass, parseFloat(depositAmount), depositDescription);
      setDepositAmount('');
      setDepositDescription('');
      await fetchData();
      await refreshTown();
      alert('Deposit successful!');
    } catch (error: any) {
      console.error('Failed to deposit:', error);
      alert(error.response?.data?.error || 'Failed to deposit');
    } finally {
      setProcessing(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTownClass || !withdrawAmount) return;
    
    setProcessing(true);
    try {
      await treasuryApi.withdrawFromTreasury(currentTownClass, parseFloat(withdrawAmount), withdrawDescription);
      setWithdrawAmount('');
      setWithdrawDescription('');
      await fetchData();
      await refreshTown();
      alert('Withdrawal successful!');
    } catch (error: any) {
      console.error('Failed to withdraw:', error);
      alert(error.response?.data?.error || 'Failed to withdraw');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaySalaries = async () => {
    if (!currentTownClass) return;
    
    if (!confirm('Are you sure you want to pay salaries to all employed students? Tax will be automatically deducted.')) {
      return;
    }
    
    setProcessing(true);
    try {
      const result = await treasuryApi.paySalaries(currentTownClass);
      setLastPaymentResult(result.data);
      await fetchData();
      await refreshTown();
    } catch (error: any) {
      console.error('Failed to pay salaries:', error);
      alert(error.response?.data?.error || 'Failed to pay salaries');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayBasicSalary = async () => {
    if (!currentTownClass) return;
    
    if (!confirm('Are you sure you want to pay basic salary to all unemployed students?')) {
      return;
    }
    
    setProcessing(true);
    try {
      const amount = parseFloat(basicSalaryAmount) || undefined;
      const result = await treasuryApi.payBasicSalary(currentTownClass, amount);
      alert(`Basic salary paid to ${result.data.paid_count} students. Total: ${formatCurrency(result.data.total_paid)}`);
      await fetchData();
      await refreshTown();
    } catch (error: any) {
      console.error('Failed to pay basic salary:', error);
      alert(error.response?.data?.error || 'Failed to pay basic salary');
    } finally {
      setProcessing(false);
    }
  };

  if (!currentTownClass) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Wallet className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>Select a town to manage treasury</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Town Treasury</h3>
          <p className="text-sm text-gray-500">Manage finances for Class {currentTownClass}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Treasury Balance Card */}
      {treasuryInfo && (
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Treasury Balance</p>
              <p className="text-4xl font-bold mt-1">{formatCurrency(treasuryInfo.treasury_balance)}</p>
              <p className="text-emerald-100 text-sm mt-2">Starting balance: R10,000,000</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-emerald-100 text-sm">Tax Collection</span>
                <button
                  onClick={handleToggleTax}
                  disabled={processing}
                  className="focus:outline-none"
                  title={treasuryInfo.tax_enabled ? 'Click to disable tax' : 'Click to enable tax'}
                >
                  {treasuryInfo.tax_enabled ? (
                    <ToggleRight className="h-8 w-8 text-white" />
                  ) : (
                    <ToggleLeft className="h-8 w-8 text-emerald-200" />
                  )}
                </button>
              </div>
              <p className={`text-sm font-medium ${treasuryInfo.tax_enabled ? 'text-white' : 'text-emerald-200'}`}>
                {treasuryInfo.tax_enabled ? 'Progressive Tax Active' : 'Tax Disabled'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {treasuryInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-green-600 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-medium">Tax Collected</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(treasuryInfo.stats.total_tax_collected)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-red-600 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-xs font-medium">Salaries Paid</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(Math.abs(treasuryInfo.stats.total_salaries_paid))}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-blue-600 mb-1">
              <Upload className="h-4 w-4" />
              <span className="text-xs font-medium">Deposits</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(treasuryInfo.stats.total_deposits)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-amber-600 mb-1">
              <Download className="h-4 w-4" />
              <span className="text-xs font-medium">Withdrawals</span>
            </div>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(Math.abs(treasuryInfo.stats.total_withdrawals))}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Wallet },
            { id: 'pay-salaries', label: 'Pay Salaries', icon: DollarSign },
            { id: 'tax-report', label: 'Tax Report', icon: FileText },
            { id: 'transactions', label: 'Transactions', icon: Receipt }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
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

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Tax Brackets */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Progressive Tax Brackets</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-2">
                  {taxBrackets.map((bracket, index) => (
                    <div key={bracket.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {formatCurrency(bracket.min_salary)} - {bracket.max_salary ? formatCurrency(bracket.max_salary) : '∞'}
                      </span>
                      <span className={`font-semibold ${bracket.tax_rate === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                        {bracket.tax_rate}% tax
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Deposit/Withdraw Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Deposit Form */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-green-600" />
                  <span>Deposit to Treasury</span>
                </h4>
                <form onSubmit={handleDeposit} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Amount (R)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
                    <input
                      type="text"
                      value={depositDescription}
                      onChange={(e) => setDepositDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Donation from event"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processing || !depositAmount}
                    className="w-full btn-primary"
                  >
                    {processing ? 'Processing...' : 'Deposit'}
                  </button>
                </form>
              </div>

              {/* Withdraw Form */}
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <Download className="h-5 w-5 text-amber-600" />
                  <span>Withdraw from Treasury</span>
                </h4>
                <form onSubmit={handleWithdraw} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Amount (R)</label>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Enter amount"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Description (optional)</label>
                    <input
                      type="text"
                      value={withdrawDescription}
                      onChange={(e) => setWithdrawDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                      placeholder="e.g., Town infrastructure"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={processing || !withdrawAmount}
                    className="w-full bg-amber-500 text-white py-2 px-4 rounded-lg hover:bg-amber-600 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Withdraw'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Pay Salaries Tab */}
        {activeTab === 'pay-salaries' && (
          <div className="space-y-6">
            {/* Pay Employed Students */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span>Pay Employed Students</span>
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Pay all employed students their job salary. {treasuryInfo?.tax_enabled ? 'Progressive tax will be automatically deducted.' : 'Tax is currently disabled.'}
              </p>
              <button
                onClick={handlePaySalaries}
                disabled={processing}
                className="btn-primary"
              >
                {processing ? 'Processing...' : 'Pay Salaries Now'}
              </button>
            </div>

            {/* Pay Basic Salary */}
            <div className="border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-2 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Pay Basic Salary (Unemployed)</span>
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Pay a basic salary to all unemployed students. This is tax-exempt.
              </p>
              <div className="flex items-end space-x-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Amount per student (R)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={basicSalaryAmount}
                    onChange={(e) => setBasicSalaryAmount(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 w-40"
                  />
                </div>
                <button
                  onClick={handlePayBasicSalary}
                  disabled={processing}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Pay Basic Salary'}
                </button>
              </div>
            </div>

            {/* Last Payment Result */}
            {lastPaymentResult && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>Payment Complete!</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-green-600">Students Paid</p>
                    <p className="text-xl font-bold text-green-800">{lastPaymentResult.paid_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Gross Salaries</p>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(lastPaymentResult.total_gross)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Tax Collected</p>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(lastPaymentResult.total_tax)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Net Paid</p>
                    <p className="text-xl font-bold text-green-800">{formatCurrency(lastPaymentResult.total_net)}</p>
                  </div>
                </div>
                
                {/* Payment Details */}
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-green-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-green-800">Student</th>
                        <th className="px-3 py-2 text-left text-green-800">Job</th>
                        <th className="px-3 py-2 text-right text-green-800">Gross</th>
                        <th className="px-3 py-2 text-right text-green-800">Tax</th>
                        <th className="px-3 py-2 text-right text-green-800">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastPaymentResult.payment_details.map((payment, index) => (
                        <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
                          <td className="px-3 py-2 text-gray-900">
                            {payment.first_name && payment.last_name 
                              ? `${payment.first_name} ${payment.last_name}` 
                              : payment.username}
                          </td>
                          <td className="px-3 py-2 text-gray-600">{payment.job_name}</td>
                          <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(payment.gross_salary)}</td>
                          <td className="px-3 py-2 text-right text-red-600">-{formatCurrency(payment.tax_amount)} ({payment.tax_rate}%)</td>
                          <td className="px-3 py-2 text-right font-medium text-green-600">{formatCurrency(payment.net_salary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tax Report Tab */}
        {activeTab === 'tax-report' && taxReport && (
          <div className="space-y-6">
            {/* Period Selector */}
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">Tax Report</h4>
              <select
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Gross</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(taxReport.summary.total_gross)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Tax</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(taxReport.summary.total_tax)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Net</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(taxReport.summary.total_net)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Tax Rate</p>
                <p className="text-xl font-bold text-gray-900">{taxReport.summary.avg_tax_rate.toFixed(1)}%</p>
              </div>
            </div>

            {/* Student Tax Table */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Tax by Student</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-gray-700">Student</th>
                      <th className="px-4 py-3 text-right text-gray-700">Gross Earnings</th>
                      <th className="px-4 py-3 text-right text-gray-700">Tax Paid</th>
                      <th className="px-4 py-3 text-right text-gray-700">Net Received</th>
                      <th className="px-4 py-3 text-right text-gray-700">Payments</th>
                    </tr>
                  </thead>
                  <tbody>
                    {taxReport.student_taxes.map((student, index) => (
                      <tr key={student.user_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-gray-900">
                          {student.first_name && student.last_name 
                            ? `${student.first_name} ${student.last_name}` 
                            : student.username}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(student.total_gross)}</td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(student.total_tax_paid)}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(student.total_net)}</td>
                        <td className="px-4 py-3 text-right text-gray-600">{student.payment_count}</td>
                      </tr>
                    ))}
                    {taxReport.student_taxes.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                          No tax transactions in this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && treasuryInfo && (
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Treasury Transactions</h4>
            <div className="space-y-2">
              {treasuryInfo.transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      tx.amount > 0 ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {tx.amount > 0 ? (
                        <TrendingUp className={`h-4 w-4 text-green-600`} />
                      ) : (
                        <TrendingDown className={`h-4 w-4 text-red-600`} />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                      <p className="text-xs text-gray-500">
                        {tx.transaction_type.replace('_', ' ')} • {new Date(tx.created_at).toLocaleString()}
                        {tx.created_by_username && ` • by ${tx.created_by_username}`}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                  </span>
                </div>
              ))}
              {treasuryInfo.transactions.length === 0 && (
                <p className="text-center py-8 text-gray-500">No transactions yet</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TreasuryManagement;

