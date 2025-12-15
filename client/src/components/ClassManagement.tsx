import React, { useState } from 'react';
import { DollarSign, Minus, Plus, Users, AlertTriangle, Building2 } from 'lucide-react';
import api from '../services/api';

interface Student {
  id: number;
  username: string;
  first_name: string | null;
  last_name: string | null;
  class: string | null;
  balance: number;
}

interface ClassManagementProps {
  students: Student[];
  onUpdate: () => void;
}

const ClassManagement: React.FC<ClassManagementProps> = ({ students, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPayModal, setShowPayModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Group students by class
  const studentsByClass = students.reduce((acc, student) => {
    const className = student.class || 'No Class';
    if (!acc[className]) {
      acc[className] = [];
    }
    acc[className].push(student);
    return acc;
  }, {} as Record<string, Student[]>);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const handleBulkPayment = async (className: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/transactions/bulk-payment', {
        class_name: className,
        amount: parseFloat(amount),
        description: description || `Bulk payment to ${className}`
      });

      setSuccess(`Successfully paid ${response.data.updated_count} students in ${className}`);
      setAmount('');
      setDescription('');
      setShowPayModal(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bulk payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkRemoval = async (className: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/transactions/bulk-removal', {
        class_name: className,
        amount: parseFloat(amount),
        description: description || `Bulk removal from ${className}`
      });

      setSuccess(`Successfully removed money from ${response.data.updated_count} students in ${className}`);
      setAmount('');
      setDescription('');
      setShowRemoveModal(false);
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Bulk removal failed');
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (className: string) => {
    setShowPayModal(true);
    setShowRemoveModal(false);
    setError('');
    setSuccess('');
  };

  const openRemoveModal = (className: string) => {
    setShowRemoveModal(true);
    setShowPayModal(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {Object.entries(studentsByClass).map(([className, classStudents]) => {
        const totalBalance = classStudents.reduce((sum, student) => sum + student.balance, 0);
        const averageBalance = totalBalance / classStudents.length;

        return (
          <div key={className} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 w-10 h-10 rounded-full flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Class {className}</h3>
                  <p className="text-sm text-gray-500">{classStudents.length} students</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-lg font-semibold text-success-600">{formatCurrency(totalBalance)}</p>
                <p className="text-xs text-gray-400">Avg: {formatCurrency(averageBalance)}</p>
              </div>
            </div>

            {/* Class Actions */}
            <div className="flex space-x-3 mb-4">
              <button
                onClick={() => openPayModal(className)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:bg-success-400"
              >
                <Plus className="h-4 w-4" />
                <span>Pay All Students</span>
              </button>
              <button
                onClick={() => openRemoveModal(className)}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400"
              >
                <Minus className="h-4 w-4" />
                <span>Remove Money</span>
              </button>
            </div>

            {/* Students List */}
            <div className="space-y-2">
              {classStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.first_name && student.last_name 
                          ? `${student.first_name} ${student.last_name}` 
                          : student.username
                        }
                      </p>
                      <p className="text-sm text-gray-500">@{student.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-success-600">{formatCurrency(student.balance)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Pay All Modal */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Plus className="h-6 w-6 text-success-600" />
              <h3 className="text-lg font-semibold text-gray-900">Pay All Students</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Weekly allowance"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPayModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkPayment('6A')} // This will be dynamic based on selected class
                disabled={loading || !amount}
                className="flex-1 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 disabled:bg-success-400 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4" />
                    <span>Pay All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Money Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <Minus className="h-6 w-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Remove Money from All Students</h3>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  This will remove money from all students in the class. Make sure this is what you intended.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Remove</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Late fee"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowRemoveModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBulkRemoval('6A')} // This will be dynamic based on selected class
                disabled={loading || !amount}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Minus className="h-4 w-4" />
                    <span>Remove Money</span>
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

export default ClassManagement;
