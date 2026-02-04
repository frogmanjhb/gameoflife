import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../../services/api';
import SchoolsList from './SchoolsList';
import SchoolDetailModal from './SchoolDetailModal';
import CreateSchoolForm from './CreateSchoolForm';
import AnalyticsCharts from './AnalyticsCharts';
import SchoolStatsCards from './SchoolStatsCards';
import { Building2, Plus, BarChart3 } from 'lucide-react';

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

interface Analytics {
  total_schools: number;
  total_students: number;
  total_teachers: number;
  transaction_volume_30d: number;
  growth_trends: Array<{ date: string; new_schools: number }>;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.role === 'super_admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [schoolsRes, analyticsRes] = await Promise.all([
        api.get('/admin/schools'),
        api.get('/admin/analytics')
      ]);
      setSchools(schoolsRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch data:', err);
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolCreated = () => {
    setShowCreateForm(false);
    fetchData();
  };

  const handleSchoolUpdated = () => {
    setSelectedSchool(null);
    fetchData();
  };

  // Redirect if not super admin
  if (!user || user.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Building2 className="h-8 w-8 mr-3 text-primary-600" />
                Super Admin Dashboard
              </h1>
              <p className="mt-2 text-gray-600">Manage all schools and view system-wide analytics</p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create School
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Overview Cards */}
        {analytics && <SchoolStatsCards analytics={analytics} />}

        {/* Schools List */}
        <div className="mt-8">
          <SchoolsList
            schools={schools}
            onSchoolClick={(school) => setSelectedSchool(school)}
            onRefresh={fetchData}
          />
        </div>

        {/* Analytics Section */}
        {analytics && (
          <div className="mt-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-6 w-6 mr-2 text-primary-600" />
                System Analytics
              </h2>
              <AnalyticsCharts analytics={analytics} />
            </div>
          </div>
        )}

        {/* Modals */}
        {showCreateForm && (
          <CreateSchoolForm
            onClose={() => setShowCreateForm(false)}
            onSuccess={handleSchoolCreated}
          />
        )}

        {selectedSchool && (
          <SchoolDetailModal
            school={selectedSchool}
            onClose={() => setSelectedSchool(null)}
            onUpdate={handleSchoolUpdated}
          />
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
