import React, { useMemo, useState } from 'react';
import { StudentEarningsActivityItem, StudentEarningsProfile } from '../types';
import { getDisplayJobTitle } from '../utils/jobDisplay';
import { getXPProgress } from '../utils/jobProgression';
import { Award, Briefcase, Sparkles, TrendingUp, Clock } from 'lucide-react';

export const formatProfileCurrency = (amount: number) =>
  new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

const formatActivityDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const SOURCE_LABELS: Record<StudentEarningsActivityItem['source'], string> = {
  wordle: 'Wordle',
  math_chores: 'Math chores',
  job_challenge_game: 'Job game',
  salary: 'Salary',
  job_task: 'Job task',
};

interface StatRowProps {
  label: string;
  value: string;
  sublabel?: string;
  valueClassName?: string;
}

export const EarningsStatRow: React.FC<StatRowProps> = ({
  label,
  value,
  sublabel,
  valueClassName = 'text-gray-900',
}) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
    <span className={`font-semibold ${valueClassName}`}>{value}</span>
  </div>
);

interface ActivityListProps {
  items: StudentEarningsActivityItem[];
  mode: 'xp' | 'money';
  emptyMessage: string;
  footerNote?: string;
}

const ActivityList: React.FC<ActivityListProps> = ({ items, mode, emptyMessage, footerNote }) => {
  const filtered = useMemo(
    () => items.filter((item) => (mode === 'xp' ? (item.xp ?? 0) > 0 : (item.money ?? 0) > 0)),
    [items, mode]
  );

  if (filtered.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 text-sm">
        <Clock className="h-10 w-10 mx-auto mb-2 text-gray-300" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {filtered.map((item) => (
        <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="font-medium text-gray-900 text-sm">{item.label}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200 text-gray-500">
                  {SOURCE_LABELS[item.source]}
                </span>
              </div>
              {item.detail && <p className="text-sm text-gray-600">{item.detail}</p>}
              <p className="text-xs text-gray-400 mt-1">{formatActivityDate(item.occurred_at)}</p>
            </div>
            <div className="text-right flex-shrink-0">
              {mode === 'xp' && item.xp != null && item.xp > 0 && (
                <p className="font-semibold text-indigo-600">+{item.xp} XP</p>
              )}
              {mode === 'money' && item.money != null && item.money > 0 && (
                <p className="font-semibold text-green-600">+{formatProfileCurrency(item.money)}</p>
              )}
            </div>
          </div>
        </div>
      ))}
      {footerNote && (
        <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">{footerNote}</p>
      )}
    </div>
  );
};

type ProfileTab = 'summary' | 'xp_history' | 'money_history';

interface StudentEarningsBreakdownProps {
  profile: StudentEarningsProfile;
  showJobHeader?: boolean;
}

const StudentEarningsBreakdown: React.FC<StudentEarningsBreakdownProps> = ({
  profile,
  showJobHeader = false,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('summary');
  const xpProgress = getXPProgress(profile.job_level, profile.job_experience_points);
  const jobTitle = profile.job_name
    ? getDisplayJobTitle(profile.job_name, profile.job_level)
    : 'No job assigned';

  const xpHistory = profile.xp_history ?? [];
  const moneyHistory = profile.money_history ?? [];

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: 'summary', label: 'Summary' },
    { id: 'xp_history', label: 'XP history' },
    { id: 'money_history', label: 'Money history' },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <nav className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-800'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {showJobHeader && (
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="h-5 w-5 text-amber-600" />
                <h2 className="text-lg font-semibold text-gray-900">{jobTitle}</h2>
              </div>
            )}
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
                    <span>
                      {xpProgress.current} / {xpProgress.needed} XP
                    </span>
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
              <EarningsStatRow
                label="Wordle chores"
                sublabel={`${profile.counts.wordle_games} games played`}
                value={`${profile.xp.wordle} XP`}
                valueClassName="text-indigo-600"
              />
              <EarningsStatRow
                label="Job challenge games"
                sublabel={`${profile.counts.job_challenge_sessions} sessions`}
                value={`${profile.xp.job_challenge_games} XP`}
                valueClassName="text-purple-600"
              />
              <EarningsStatRow
                label="Job duties & other tasks"
                sublabel="Fines, land reviews, sick notes, news stories, and more"
                value={`${profile.xp.job_tasks_and_other} XP`}
                valueClassName="text-blue-600"
              />
              <EarningsStatRow
                label="Total job XP"
                value={`${profile.xp.total} XP`}
                valueClassName="text-gray-900 font-bold"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-gray-900">Money earned</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Totals from chores, games, salary, and job tasks. Does not include money received from classmates.
            </p>
            <div className="space-y-2">
              <EarningsStatRow
                label="Math chores"
                sublabel={`${profile.counts.math_chores_sessions} sessions`}
                value={formatProfileCurrency(profile.money.math_chores)}
                valueClassName="text-green-600"
              />
              <EarningsStatRow
                label="Wordle chores"
                sublabel={`${profile.counts.wordle_games} games`}
                value={formatProfileCurrency(profile.money.wordle)}
                valueClassName="text-green-600"
              />
              <EarningsStatRow
                label="Job challenge games"
                sublabel={`${profile.counts.job_challenge_sessions} sessions`}
                value={formatProfileCurrency(profile.money.job_challenge_games)}
                valueClassName="text-green-600"
              />
              <EarningsStatRow
                label="Salary payments"
                value={formatProfileCurrency(profile.money.salary)}
                valueClassName="text-emerald-600"
              />
              <EarningsStatRow
                label="Job task pay"
                sublabel="Land fees, news stories, events, insurance work, bonuses, and more"
                value={formatProfileCurrency(profile.money.job_tasks)}
                valueClassName="text-emerald-600"
              />
              <EarningsStatRow
                label="Total earned (tracked sources)"
                value={formatProfileCurrency(profile.money.total_earned)}
                valueClassName="text-green-700 font-bold text-lg"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'xp_history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Each time XP was earned</h3>
          <ActivityList
            items={xpHistory}
            mode="xp"
            emptyMessage="No logged XP events yet — play Wordle or job challenge games to start."
            footerNote={
              profile.xp.job_tasks_and_other > 0
                ? `${profile.xp.job_tasks_and_other} XP from job duties (fines, reviews, sick notes, etc.) is included in your total but is not logged per event.`
                : undefined
            }
          />
        </div>
      )}

      {activeTab === 'money_history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Each time money was earned</h3>
          <ActivityList
            items={moneyHistory}
            mode="money"
            emptyMessage="No logged earnings yet — try chores, job games, or job tasks."
          />
        </div>
      )}
    </div>
  );
};

export default StudentEarningsBreakdown;
