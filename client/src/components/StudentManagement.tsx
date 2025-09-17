import React, { useState } from 'react';
import { Plus, Minus, DollarSign, User, Search } from 'lucide-react';
import api from '../services/api';
import { Student } from '../types';

interface StudentManagementProps {
  students: Student[];
  onUpdate: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, onUpdate }) => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/transactions/deposit', {
        username: selectedStudent.username,
        amount: parseFloat(formData.amount),
        description: formData.description || 'Deposit by teacher'
      });

      setSuccess('Deposit successful!');
      setFormData({ amount: '', description: '' });
      setShowDepositForm(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Deposit failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/transactions/withdraw', {
        username: selectedStudent.username,
        amount: parseFloat(formData.amount),
        description: formData.description || 'Withdrawal by teacher'
      });

      setSuccess('Withdrawal successful!');
      setFormData({ amount: '', description: '' });
      setShowWithdrawForm(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Withdrawal failed');
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

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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

      {/* Students List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className={`card cursor-pointer transition-all duration-200 ${
              selectedStudent?.id === student.id
                ? 'ring-2 ring-primary-500 bg-primary-50'
                : 'hover:shadow-md'
            }`}
            onClick={() => setSelectedStudent(student)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-full">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{student.username}</h3>
                  <p className="text-sm text-gray-500">Account: {student.account_number}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-success-600">
                  {formatCurrency(student.balance)}
                </p>
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudent(student);
                  setShowDepositForm(true);
                }}
                className="flex-1 btn-success text-sm"
              >
                <Plus className="h-4 w-4 inline mr-1" />
                Add Money
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStudent(student);
                  setShowWithdrawForm(true);
                }}
                className="flex-1 btn-warning text-sm"
              >
                <Minus className="h-4 w-4 inline mr-1" />
                Remove Money
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Deposit Modal */}
      {showDepositForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add Money to {selectedStudent.username}
            </h3>
            <form onSubmit={handleDeposit} className="space-y-4">
              <div>
                <label className="label">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  className="input-field"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Salary, Bonus, Reward"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-success disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Money'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDepositForm(false)}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawForm && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Remove Money from {selectedStudent.username}
            </h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="label">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedStudent.balance}
                  required
                  className="input-field"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Available: {formatCurrency(selectedStudent.balance)}
                </p>
              </div>
              <div>
                <label className="label">Description</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g., Fine, Expense, Penalty"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn-warning disabled:opacity-50"
                >
                  {loading ? 'Removing...' : 'Remove Money'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWithdrawForm(false)}
                  className="flex-1 btn-secondary"
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

export default StudentManagement;
