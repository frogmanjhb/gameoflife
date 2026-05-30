import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentsApi } from '../services/api';
import { StudentEarningsProfile } from '../types';
import StudentEarningsBreakdown, { formatProfileCurrency } from './StudentEarningsBreakdown';
import { ArrowLeft, Gamepad2, Loader2 } from 'lucide-react';

const StudentProfileView: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentEarningsProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await studentsApi.getMyEarningsProfile();
        setProfile(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load your profile');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const displayName =
    user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.username || 'Student';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-600">
        <Loader2 className="h-10 w-10 animate-spin mb-3 text-primary-600" />
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Profile unavailable'}</p>
        <Link to="/" className="text-primary-600 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">
            {displayName} · {user?.class || 'Town member'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Bank balance</p>
          <p className="text-xl font-bold text-green-700">{formatProfileCurrency(profile.account_balance)}</p>
        </div>
      </div>

      <StudentEarningsBreakdown profile={profile} showJobHeader />

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
        <Gamepad2 className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-900">
          Play chores in the <strong>Chores</strong> plugin and job games on <strong>My Job</strong> to grow these totals.
          Job duty XP and pay appear here after you complete tasks (approvals, reviews, submissions, etc.).
        </p>
      </div>
    </div>
  );
};

export default StudentProfileView;
