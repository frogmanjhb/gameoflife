import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Minus, DollarSign, User, Search, Users, Trash2, AlertTriangle, ChevronDown, ChevronUp, Copy, RefreshCw, Eye } from 'lucide-react';
import api from '../services/api';
import { Student } from '../types';

interface StudentManagementProps {
  students: Student[];
  onUpdate: () => void;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ students, onUpdate }) => {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'surname' | 'balance'>('surname');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [expandedStudents, setExpandedStudents] = useState<Set<number>>(new Set());
  const [studentPasswords, setStudentPasswords] = useState<Record<number, string>>({});
  const [resettingPassword, setResettingPassword] = useState<number | null>(null);

  // Group students by class
  const studentsByClass = useMemo(() => {
    const grouped = students.reduce((acc, student) => {
      const className = student.class || 'Unassigned';
      if (!acc[className]) {
        acc[className] = [];
      }
      acc[className].push(student);
      return acc;
    }, {} as Record<string, Student[]>);

    // Sort classes alphabetically, with 'Unassigned' at the end
    const sortedClasses = Object.keys(grouped).sort((a, b) => {
      if (a === 'Unassigned') return 1;
      if (b === 'Unassigned') return -1;
      return a.localeCompare(b);
    });

    return { grouped, sortedClasses };
  }, [students]);

  // Get students for the selected class
  const getStudentsForClass = (className: string) => {
    if (className === 'all') {
      return students;
    }
    return studentsByClass.grouped[className] || [];
  };

  const filteredStudents = getStudentsForClass(selectedClass).filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.first_name && student.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.last_name && student.last_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const displayedStudents = useMemo(() => {
    const dir = sortDirection === 'asc' ? 1 : -1;

    // Stable sort: include index tie-breaker
    return filteredStudents
      .map((s, idx) => ({ s, idx }))
      .sort((a, b) => {
        if (sortBy === 'balance') {
          const balA = Number(a.s.balance) || 0;
          const balB = Number(b.s.balance) || 0;
          const diff = balA - balB;
          if (diff !== 0) return diff * dir;
        } else {
          const lastA = (a.s.last_name || '').toLowerCase();
          const lastB = (b.s.last_name || '').toLowerCase();
          if (lastA !== lastB) return lastA.localeCompare(lastB) * dir;

          const firstA = (a.s.first_name || '').toLowerCase();
          const firstB = (b.s.first_name || '').toLowerCase();
          if (firstA !== firstB) return firstA.localeCompare(firstB) * dir;

          const userA = (a.s.username || '').toLowerCase();
          const userB = (b.s.username || '').toLowerCase();
          if (userA !== userB) return userA.localeCompare(userB) * dir;
        }

        return a.idx - b.idx;
      })
      .map(({ s }) => s);
  }, [filteredStudents, sortBy, sortDirection]);

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

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // First try deleting by username
      try {
        await api.delete(`/students/${studentToDelete.username}`);
        setSuccess(`Student ${studentToDelete.username} has been deleted successfully`);
        setShowDeleteConfirm(false);
        setStudentToDelete(null);
        onUpdate();
      } catch (usernameErr: any) {
        // If student not found by username, try by account number
        if (usernameErr.response?.status === 404 && studentToDelete.account_number) {
          await api.delete(`/students/account/${studentToDelete.account_number}`);
          setSuccess(`Account ${studentToDelete.account_number} has been deleted successfully`);
          setShowDeleteConfirm(false);
          setStudentToDelete(null);
          onUpdate();
        } else {
          throw usernameErr;
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete student');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const toggleStudentExpanded = (student: Student) => {
    const studentId = student.id;
    const isCurrentlyExpanded = expandedStudents.has(studentId);

    const newExpanded = new Set(expandedStudents);
    if (isCurrentlyExpanded) {
      newExpanded.delete(studentId);
      setExpandedStudents(newExpanded);
      return;
    }

    newExpanded.add(studentId);
    setExpandedStudents(newExpanded);
  };

  const handleResetPassword = async (student: Student) => {
    setResettingPassword(student.id);
    setError('');
    setSuccess('');
    
    try {
      const response = await api.post(`/students/${student.username}/reset-password`, { reveal: true });
      const newPassword = response.data.temporary_password;
      if (!newPassword) {
        setSuccess(`Password reset for ${student.username}. (Password not returned by server)`);
        return;
      }
      setStudentPasswords((prev) => ({ ...prev, [student.id]: newPassword }));
      setSuccess(`Password reset for ${student.username}. Share the new password with the student.`);
      
      if (!expandedStudents.has(student.id)) {
        setExpandedStudents((prev) => new Set(prev).add(student.id));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResettingPassword(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setSuccess('Copied to clipboard!');
      setTimeout(() => setSuccess(''), 2000);
    }).catch(() => {
      setError('Failed to copy to clipboard');
    });
  };

  return (
    <div className="space-y-6">
      {/* Search + Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search students by name or username..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'surname' | 'balance')}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
          >
            <option value="surname">Surname</option>
            <option value="balance">Bank balance</option>
          </select>
          <button
            type="button"
            onClick={() => setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))}
            className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? 'A→Z' : 'Z→A'}
          </button>
        </div>
      </div>

      {/* Class Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedClass('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedClass === 'all'
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="h-4 w-4 inline mr-2" />
          All Students ({students.length})
        </button>
        {studentsByClass.sortedClasses.map((className) => (
          <button
            key={className}
            onClick={() => setSelectedClass(className)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedClass === className
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {className === 'Unassigned' ? '❓' : '🎓'} {className} ({studentsByClass.grouped[className].length})
          </button>
        ))}
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

      {/* Class Summary (only when "All Students" is selected) */}
      {selectedClass === 'all' && studentsByClass.sortedClasses.length > 1 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Class Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studentsByClass.sortedClasses.map((className) => {
              const classStudents = studentsByClass.grouped[className];
              const classBalance = classStudents.reduce((sum, student) => sum + (Number(student.balance) || 0), 0);
              return (
                <div key={className} className="bg-white rounded-lg p-3 border">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {className === 'Unassigned' ? '❓' : '🎓'} {className}
                      </h4>
                      <p className="text-sm text-gray-500">{classStudents.length} students</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-success-600">
                        {formatCurrency(classBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Students List */}
      {displayedStudents.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No students found' : `No students in ${selectedClass === 'all' ? 'any class' : selectedClass}`}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'Try adjusting your search terms' 
              : selectedClass === 'all' 
                ? 'Students will appear here once they register' 
                : 'Students in this class will appear here'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedStudents.map((student) => {
            const isExpanded = expandedStudents.has(student.id);
            const hasPassword = studentPasswords[student.id];
            
            return (
            <div
              key={student.id}
              className={`card transition-all duration-200 ${
                selectedStudent?.id === student.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="bg-primary-100 p-2 rounded-full flex-shrink-0">
                    <User className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {student.first_name && student.last_name 
                        ? `${student.first_name} ${student.last_name}` 
                        : student.username
                      }
                    </h3>
                    <p className="text-sm text-gray-500 truncate">@{student.username}</p>
                    <div className="flex items-center space-x-2 mt-1 flex-wrap">
                      <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                        {student.class || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-lg font-bold text-success-600">
                    {formatCurrency(student.balance)}
                  </p>
                </div>
              </div>

              {/* Email and Account Number - Better Layout */}
              <div className="mb-3 space-y-1">
                {student.email && (
                  <p className="text-xs text-gray-600 truncate" title={student.email}>
                    {student.email}
                  </p>
                )}
                <p className="text-xs text-gray-500 truncate" title={`Account: ${student.account_number}`}>
                  Account: {student.account_number}
                </p>
              </div>

              {/* Expandable Credentials Section */}
              <div className="mb-3 border-t border-gray-200 pt-3">
                <button
                  onClick={() => toggleStudentExpanded(student)}
                  className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-primary-600 transition-colors"
                >
                  <span className="flex items-center">
                    {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                    Credentials
                  </span>
                </button>
                
                {isExpanded && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Username</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={student.username}
                          className="flex-1 text-sm px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 font-mono"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <button
                          onClick={() => copyToClipboard(student.username)}
                          className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors rounded hover:bg-gray-200"
                          title="Copy username"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Password</label>
                      {hasPassword ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            readOnly
                            value={hasPassword}
                            className="flex-1 text-sm px-2 py-1.5 bg-white border border-gray-300 rounded text-gray-900 font-mono"
                            onClick={(e) => e.currentTarget.select()}
                          />
                          <button
                            onClick={() => copyToClipboard(hasPassword)}
                            className="p-1.5 text-gray-600 hover:text-primary-600 transition-colors rounded hover:bg-gray-200"
                            title="Copy password"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      ) : resettingPassword === student.id ? (
                        <div className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded">
                          <RefreshCw className="h-4 w-4 animate-spin text-primary-600" />
                          <span className="text-sm text-gray-500">Loading password…</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 px-3 py-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                            Password not loaded yet. Click Reset to generate a new one.
                          </div>
                          <button
                            onClick={() => handleResetPassword(student)}
                            disabled={resettingPassword === student.id}
                            className="flex items-center justify-center space-x-2 px-3 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            <RefreshCw className="h-4 w-4" />
                            <span>Reset</span>
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {hasPassword && (
                      <button
                        onClick={() => copyToClipboard(`Username: ${student.username}\nPassword: ${hasPassword}`)}
                        className="w-full px-3 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded text-sm transition-colors flex items-center justify-center space-x-2"
                      >
                        <Copy className="h-4 w-4" />
                        <span>Copy username and password</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Use username for reliable lookup (account_number can cause route-matching issues)
                    if (student.username) {
                      navigate(`/student/${student.username}`);
                    } else {
                      console.error('Student has no username:', student);
                    }
                  }}
                  className="flex-1 bg-primary-100 text-primary-700 hover:bg-primary-200 px-3 py-2 rounded-lg transition-colors text-sm flex items-center justify-center space-x-1"
                  title="View detailed profile"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudentToDelete(student);
                    setShowDeleteConfirm(true);
                  }}
                  className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors text-sm"
                  title="Delete Student"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          )})}
        </div>
      )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && studentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Delete Student
              </h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 mb-3">
                Are you sure you want to delete the following student? This action cannot be undone.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <p className="font-semibold text-gray-900">
                  {studentToDelete.first_name && studentToDelete.last_name 
                    ? `${studentToDelete.first_name} ${studentToDelete.last_name}` 
                    : studentToDelete.username}
                </p>
                <p className="text-sm text-gray-500">@{studentToDelete.username}</p>
                <p className="text-sm text-gray-500">Class: {studentToDelete.class || 'Unassigned'}</p>
                <p className="text-sm text-gray-500">Balance: {formatCurrency(studentToDelete.balance)}</p>
              </div>
              <p className="text-sm text-red-600 mt-3">
                <strong>Warning:</strong> All associated data including transactions, loans, job applications, and land ownership will be removed.
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleDeleteStudent}
                disabled={loading}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Student'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setStudentToDelete(null);
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
