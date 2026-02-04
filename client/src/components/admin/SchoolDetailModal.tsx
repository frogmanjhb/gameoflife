import React, { useState, useEffect } from 'react';
import { X, DollarSign, Users, Activity, Settings, Archive, RefreshCw, Plus } from 'lucide-react';
import api from '../../services/api';

interface School {
  id: number;
  name: string;
  code: string;
  archived: boolean;
  student_count: number;
  teacher_count: number;
  active_users_30d: number;
  treasury_total: number;
  transaction_count_30d: number;
  created_at: string;
  last_activity: string | null;
}

interface SchoolDetailModalProps {
  school: School;
  onClose: () => void;
  onUpdate: () => void;
}

const SchoolDetailModal: React.FC<SchoolDetailModalProps> = ({ school, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'users' | 'activity' | 'settings'>('financial');
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateTeacher, setShowCreateTeacher] = useState(false);
  const [teacherForm, setTeacherForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  const [creatingTeacher, setCreatingTeacher] = useState(false);

  useEffect(() => {
    fetchSchoolDetails();
  }, [school.id]);

  const fetchSchoolDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/schools/${school.id}`);
      setDetails(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load school details');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm(`Are you sure you want to ${school.archived ? 'reactivate' : 'archive'} this school?`)) {
      return;
    }

    try {
      await api.put(`/admin/schools/${school.id}`, { archived: !school.archived });
      onUpdate();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update school');
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTeacher(true);
    setError('');

    try {
      await api.post(`/admin/schools/${school.id}/teachers`, teacherForm);
      setShowCreateTeacher(false);
      setTeacherForm({ username: '', password: '', first_name: '', last_name: '', email: '' });
      fetchSchoolDetails(); // Refresh to show new teacher
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create teacher');
    } finally {
      setCreatingTeacher(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading school details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{school.name}</h2>
            <p className="text-sm text-gray-500">{school.code}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'financial', label: 'Financial', icon: DollarSign },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'activity', label: 'Activity', icon: Activity },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {activeTab === 'financial' && details?.financial && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Treasury</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${details.financial.treasury_total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Student Balances</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${details.financial.student_balances_total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Transactions (30 days)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {details.financial.transaction_count_30d?.toLocaleString() || 0}
                </p>
              </div>
              {details.financial.loan_stats && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Loan Statistics</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Total Loans</p>
                      <p className="text-lg font-semibold">{details.financial.loan_stats.total_loans || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Active Loans</p>
                      <p className="text-lg font-semibold">{details.financial.loan_stats.active_loans || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Outstanding</p>
                      <p className="text-lg font-semibold">
                        ${details.financial.loan_stats.total_outstanding?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && details?.users && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {details.users.student_count?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {details.users.teacher_count || 0}
                  </p>
                </div>
              </div>
              {details.users.pending_approvals > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-800">
                    {details.users.pending_approvals} pending student approval{details.users.pending_approvals !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-700">Teachers</p>
                  {!school.archived && (
                    <button
                      onClick={() => setShowCreateTeacher(!showCreateTeacher)}
                      className="btn-secondary text-sm flex items-center"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Teacher
                    </button>
                  )}
                </div>

                {showCreateTeacher && (
                  <form onSubmit={handleCreateTeacher} className="bg-blue-50 p-4 rounded-lg mb-4 space-y-3 border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-2">Create New Teacher</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Username *"
                        required
                        value={teacherForm.username}
                        onChange={(e) => setTeacherForm({ ...teacherForm, username: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="password"
                        placeholder="Password *"
                        required
                        value={teacherForm.password}
                        onChange={(e) => setTeacherForm({ ...teacherForm, password: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="First Name"
                        value={teacherForm.first_name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, first_name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={teacherForm.last_name}
                        onChange={(e) => setTeacherForm({ ...teacherForm, last_name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={teacherForm.email}
                        onChange={(e) => setTeacherForm({ ...teacherForm, email: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm col-span-2"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={creatingTeacher}
                        className="btn-primary text-sm disabled:opacity-50"
                      >
                        {creatingTeacher ? 'Creating...' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateTeacher(false);
                          setTeacherForm({ username: '', password: '', first_name: '', last_name: '', email: '' });
                        }}
                        className="btn-secondary text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {details.users.teachers && details.users.teachers.length > 0 ? (
                  <div className="space-y-2">
                    {details.users.teachers.map((teacher: any) => (
                      <div key={teacher.id} className="bg-gray-50 p-3 rounded-lg">
                        <p className="font-medium text-gray-900">{teacher.username}</p>
                        {(teacher.first_name || teacher.last_name) && (
                          <p className="text-sm text-gray-600">
                            {teacher.first_name} {teacher.last_name}
                          </p>
                        )}
                        {teacher.email && (
                          <p className="text-xs text-gray-500">{teacher.email}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No teachers yet. Create the first teacher above.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && details?.activity && (
            <div className="space-y-6">
              {details.activity.active_users_7d && details.activity.active_users_7d.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Active Users (Last 7 Days)</p>
                  <div className="space-y-2">
                    {details.activity.active_users_7d.map((day: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between">
                        <span className="text-sm text-gray-600">{day.date}</span>
                        <span className="font-medium">{day.active_users} users</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {details.activity.most_active_classes && details.activity.most_active_classes.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">Most Active Classes</p>
                  <div className="space-y-2">
                    {details.activity.most_active_classes.map((cls: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded-lg flex justify-between">
                        <span className="text-sm text-gray-600">Class {cls.class}</span>
                        <span className="font-medium">{cls.transaction_count} transactions</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && details?.school && (
            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">School Settings</p>
                <pre className="bg-gray-50 p-4 rounded-lg text-xs overflow-auto">
                  {JSON.stringify(details.school.settings || {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-4">
          <button
            onClick={handleArchive}
            className="btn-secondary flex items-center"
          >
            <Archive className="h-4 w-4 mr-2" />
            {school.archived ? 'Reactivate' : 'Archive'}
          </button>
          <button
            onClick={onClose}
            className="btn-primary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailModal;
