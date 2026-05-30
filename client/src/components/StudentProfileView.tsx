import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { studentsApi } from '../services/api';
import { StudentEarningsProfile } from '../types';
import { getDisplayJobTitle } from '../utils/jobDisplay';
import { getXPProgress } from '../utils/jobProgression';
import {
  ArrowLeft, Award, DollarSign, Gamepad2, Briefcase, Loader2, TrendingUp, Sparkles,
} from 'lucide-react';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

interface StatRowProps {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
}

const StatRow: React.FC<StatRowProps> = ({ label, value, sublabel, valueClassName = 'text-gray-900' }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
    <span className={`font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

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

  const xpProgress = getXPProgress(profile.job_level, profile.job_experience_points);
  const jobTitle = profile.job_name ? getDisplayJobTitle(profile.job_name, profile.job_level) : 'No job assigned';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-primary-600 hover:underline inline-flex items-center gap-1 mb-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">{displayName} · {user?.class || 'Town member'}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Bank balance</p>
          <p className="text-xl font-bold text-green-700">{formatCurrency(profile.account_balance)}</p>
        </div>
      </div>

      {/* Job & XP overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Briefcase className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">{jobTitle}</h2>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">Job Level {profile.job_level}</span>
            </div>
            <span className="text-lg font-bold text-blue-700">{profile.job_experience_points} XP total</span>
          </div>
          {profile.job_level < 10 && (
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress to Level {profile.job_level + 1}</span>
                <span>{xpProgress.current} / {xpProgress.needed} XP</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${xpProgress.percentage}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">XP earned by source</h3>
        </div>
        <div className="space-y-2">
          <StatRow
            label="Wordle chores"
            sublabel={`${profile.counts.wordle_games} games played`}
            value={`${profile.xp.wordle} XP`}
            valueClassName="text-indigo-600"
          />
          <StatRow
            label="Job challenge games"
            sublabel={`${profile.counts.job_challenge_sessions} sessions`}
            value={`${profile.xp.job_challenge_games} XP`}
            valueClassName="text-purple-600"
          />
          <StatRow
            label="Job duties & other tasks"
            sublabel="Fines, land reviews, sick notes, news stories, and more"
            value={`${profile.xp.job_tasks_and_other} XP`}
            valueClassName="text-blue-600"
          />
          <StatRow
            label="Total job XP"
            value={`${profile.xp.total} XP`}
            valueClassName="text-gray-900 font-bold"
          />
        </div>
      </div>

      {/* Money earned */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Money earned</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Totals from chores, games, salary, and job tasks. Does not include money received from classmates.
        </p>
        <div className="space-y-2">
          <StatRow
            label="Math chores"
            sublabel={`${profile.counts.math_chores_sessions} sessions`}
            value={formatCurrency(profile.money.math_chores)}
            valueClassName="text-green-600"
          />
          <StatRow
            label="Wordle chores"
            sublabel={`${profile.counts.wordle_games} games`}
            value={formatCurrency(profile.money.wordle)}
            valueClassName="text-green-600"
          />
          <StatRow
            label="Job challenge games"
            sublabel={`${profile.counts.job_challenge_sessions} sessions`}
            value={formatCurrency(profile.money.job_challenge_games)}
            valueClassName="text-green-600"
          />
          <StatRow
            label="Salary payments"
            value={formatCurrency(profile.money.salary)}
            valueClassName="text-emerald-600"
          />
          <StatRow
            label="Job task pay"
            sublabel="Land fees, news stories, events, insurance work, bonuses, and more"
            value={formatCurrency(profile.money.job_tasks)}
            valueClassName="text-emerald-600"
          />
          <StatRow
            label="Total earned (tracked sources)"
            value={formatCurrency(profile.money.total_earned)}
            valueClassName="text-green-700 font-bold text-lg"
          />
        </div>
      </div>

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
