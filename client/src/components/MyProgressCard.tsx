import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, DollarSign, Loader2, TrendingUp } from 'lucide-react';
import { studentsApi } from '../services/api';
import { StudentEarningsProfile } from '../types';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const MyProgressCard: React.FC = () => {
  const [profile, setProfile] = useState<StudentEarningsProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    studentsApi
      .getMyEarningsProfile()
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Progress</h2>
        </div>
        <Link to="/my-profile" className="text-sm text-primary-600 hover:underline font-medium">
          View full profile
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading stats...
        </div>
      ) : !profile ? (
        <p className="text-sm text-gray-500">Could not load progress stats.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            <div className="flex items-center gap-2 text-indigo-700 mb-1">
              <Award className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Job XP</span>
            </div>
            <p className="text-2xl font-bold text-indigo-900">{profile.job_experience_points}</p>
            <p className="text-xs text-indigo-600 mt-1">Level {profile.job_level}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(profile.money.total_earned)}</p>
            <p className="text-xs text-green-600 mt-1">Chores, games, salary & tasks</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProgressCard;
