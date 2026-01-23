import React, { useState, useEffect } from 'react';
import { User, Check, X, Clock, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../services/api';
import { Student } from '../types';

interface PendingStudentsProps {
  onUpdate: () => void;
}

const PendingStudents: React.FC<PendingStudentsProps> = ({ onUpdate }) => {
  const [pendingStudents, setPendingStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [processing, setProcessing] = useState<number | null>(null);

  useEffect(() => {
    fetchPendingStudents();
  }, []);

  const fetchPendingStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/students/pending');
      setPendingStudents(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch pending students');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (student: Student) => {
    setProcessing(student.id);
    setError('');
    setSuccess('');

    try {
      await api.post(`/students/${student.username}/approve`);
      setSuccess(`Student ${student.username} has been approved successfully`);
      await fetchPendingStudents();
      onUpdate(); // Refresh the main student list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve student');
    } finally {
      setProcessing(null);
    }
  };

  const handleDeny = async (student: Student) => {
    if (!confirm(`Are you sure you want to deny ${student.username}? This action cannot be undone.`)) {
      return;
    }

    setProcessing(student.id);
    setError('');
    setSuccess('');

    try {
      await api.post(`/students/${student.username}/deny`);
      setSuccess(`Student ${student.username} has been denied`);
      await fetchPendingStudents();
      onUpdate(); // Refresh the main student list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deny student');
    } finally {
      setProcessing(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-3 rounded-lg">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">New Student Registrations</h2>
            <p className="text-sm text-gray-500">
              {pendingStudents.length} {pendingStudents.length === 1 ? 'student' : 'students'} waiting for approval
            </p>
          </div>
        </div>
        <button
          onClick={fetchPendingStudents}
          className="flex items-center space-x-2 px-4 py-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Pending Students List */}
      {pendingStudents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Students</h3>
          <p className="text-gray-500">All new student registrations have been processed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pendingStudents.map((student) => (
            <div
              key={student.id}
              className="bg-white rounded-xl border-2 border-amber-200 shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="bg-amber-100 p-2 rounded-full flex-shrink-0">
                    <User className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {student.first_name && student.last_name
                        ? `${student.first_name} ${student.last_name}`
                        : student.username}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">@{student.username}</p>
                  </div>
                </div>
              </div>

              {/* Student Details */}
              <div className="space-y-2 mb-4">
                {student.class && (
                  <div className="flex items-center space-x-2">
                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                      {student.class}
                    </span>
                  </div>
                )}
                {student.email && (
                  <p className="text-xs text-gray-600 truncate" title={student.email}>
                    {student.email}
                  </p>
                )}
                {student.account_number && (
                  <p className="text-xs text-gray-500">
                    Account: {student.account_number}
                  </p>
                )}
                <p className="text-xs text-gray-400">
                  Registered: {formatDate(student.created_at)}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleApprove(student)}
                  disabled={processing === student.id}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-success-600 text-white rounded-lg hover:bg-success-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing === student.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Approve</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => handleDeny(student)}
                  disabled={processing === student.id}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingStudents;
