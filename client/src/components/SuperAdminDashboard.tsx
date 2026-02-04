import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { School, Users, DollarSign, TrendingUp, Plus, Settings, Archive } from 'lucide-react';

interface School {
  id: number;
  name: string;
  code: string;
  student_count: number;
  teacher_count: number;
  total_treasury: number;
  active_users: number;
  created_at: string;
  last_activity: string;
}

interface SchoolDetails extends School {
  stats: {
    student_count: number;
    teacher_count: number;
    pending_students: number;
    active_users_30d: number;
    active_users_7d: number;
    total_student_balances: number;
    transactions_30d: number;
    active_loans: number;
    total_outstanding_loans: number;
  };
  teachers: Array<{
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    created_at: string;
  }>;
  settings: any;
}

const SuperAdminDashboard: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<SchoolDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetchSchools();
    fetchAnalytics();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await api.get('/admin/schools');
      setSchools(response.data);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const fetchSchoolDetails = async (schoolId: number) => {
    try {
      const response = await api.get(`/admin/schools/${schoolId}`);
      setSelectedSchool(response.data);
    } catch (error) {
      console.error('Failed to fetch school details:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Super Admin Dashboard</h1>
          <p className="text-gray-600">Manage all schools and view system-wide analytics</p>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Schools</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_schools}</p>
                </div>
                <School className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_students}</p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_teachers}</p>
                </div>
                <Users className="h-8 w-8 text-primary-600" />
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Transactions (30d)</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.transactions_30d}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary-600" />
              </div>
            </div>
          </div>
        )}

        {/* Schools List */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Schools</h2>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create School
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">School Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teachers</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treasury</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active Users</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {schools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{school.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{school.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{school.student_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{school.teacher_count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      R{Number(school.total_treasury).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{school.active_users}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => fetchSchoolDetails(school.id)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* School Details Modal */}
        {selectedSchool && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{selectedSchool.name}</h2>
                <button
                  onClick={() => setSelectedSchool(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Students</p>
                    <p className="text-2xl font-bold">{selectedSchool.stats.student_count}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Teachers</p>
                    <p className="text-2xl font-bold">{selectedSchool.stats.teacher_count}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold">{selectedSchool.stats.pending_students}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <p className="text-sm text-gray-600">Active (30d)</p>
                    <p className="text-2xl font-bold">{selectedSchool.stats.active_users_30d}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-3">Teachers</h3>
                  <div className="bg-gray-50 rounded p-4">
                    {selectedSchool.teachers.length === 0 ? (
                      <p className="text-gray-500">No teachers found</p>
                    ) : (
                      <ul className="space-y-2">
                        {selectedSchool.teachers.map((teacher) => (
                          <li key={teacher.id} className="flex justify-between">
                            <span className="font-medium">{teacher.username}</span>
                            <span className="text-gray-600">{teacher.email || 'No email'}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create School Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">Create New School</h2>
              <p className="text-gray-600 mb-4">School creation form - to be implemented</p>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary w-full"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
