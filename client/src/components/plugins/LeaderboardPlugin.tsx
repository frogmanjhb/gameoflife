import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { Trophy, Users, Star, TrendingUp } from 'lucide-react';
import api from '../../services/api';

interface LeaderboardEntry {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  total_points: number;
  games_played: number;
  high_score_easy: number;
  high_score_medium: number;
  high_score_hard: number;
  high_score_extreme?: number;
  rank: number;
}

interface ClassLeaderboards {
  '6A': LeaderboardEntry[];
  '6B': LeaderboardEntry[];
  '6C': LeaderboardEntry[];
}

const LeaderboardPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const leaderboardPlugin = plugins.find(p => p.route_path === '/leaderboard');
  
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classLeaderboards, setClassLeaderboards] = useState<ClassLeaderboards>({ '6A': [], '6B': [], '6C': [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overall' | '6A' | '6B' | '6C'>('overall');

  // Duck emojis for ranks with different variations
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🦆'; // First place - yellow duck
      case 2: return '🦆'; // Second place
      case 3: return '🦆'; // Third place
      case 4: return '🦆'; // Fourth place
      case 5: return '🦆'; // Fifth place
      default: return '🦆';
    }
  };

  // Colors for rank positions
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-yellow-400 text-yellow-900 border-yellow-500'; // Gold
      case 2: return 'bg-gray-300 text-gray-900 border-gray-400'; // Silver
      case 3: return 'bg-orange-400 text-orange-900 border-orange-500'; // Bronze
      case 4: return 'bg-blue-100 text-blue-900 border-blue-300';
      case 5: return 'bg-blue-50 text-blue-900 border-blue-200';
      default: return 'bg-gray-100 text-gray-900 border-gray-300';
    }
  };

  useEffect(() => {
    fetchLeaderboards();
  }, []);

  const fetchLeaderboards = async () => {
    try {
      setLoading(true);
      const [overallRes, classesRes] = await Promise.all([
        api.get('/leaderboard/overall'),
        api.get('/leaderboard/all-classes')
      ]);

      setOverallLeaderboard(overallRes.data.leaderboard || []);
      setClassLeaderboards(classesRes.data || { '6A': [], '6B': [], '6C': [] });
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (entry: LeaderboardEntry) => {
    if (entry.first_name && entry.last_name) {
      return `${entry.first_name} ${entry.last_name}`;
    }
    return entry.username;
  };

  const renderLeaderboardTable = (entries: LeaderboardEntry[]) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No games played yet. Be the first to compete!</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.user_id}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${getRankColor(entry.rank)}`}
          >
            {/* Rank with Duck */}
            <div className="flex-shrink-0 text-center w-16">
              <div className="text-4xl mb-1">{getRankEmoji(entry.rank)}</div>
              <div className="text-lg font-bold">#{entry.rank}</div>
            </div>

            {/* Player Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg truncate">{getDisplayName(entry)}</div>
              <div className="text-sm opacity-75">
                {entry.class && <span className="mr-3">Class {entry.class}</span>}
                <span>{entry.games_played} game{entry.games_played !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {/* Points */}
            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-1">
                <Star className="h-5 w-5" />
                <span className="text-2xl font-bold">{entry.total_points.toLocaleString()}</span>
              </div>
              <div className="text-xs opacity-75">Total Points</div>
            </div>

            {/* High Scores */}
            <div className="hidden md:flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-16 opacity-75">Easy:</span>
                <span className="font-semibold">{entry.high_score_easy}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 opacity-75">Medium:</span>
                <span className="font-semibold">{entry.high_score_medium}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 opacity-75">Hard:</span>
                <span className="font-semibold">{entry.high_score_hard}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-16 opacity-75">Extreme:</span>
                <span className="font-semibold">{entry.high_score_extreme ?? 0}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!leaderboardPlugin || !leaderboardPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🏆</div>
          <div>
            <h1 className="text-2xl font-bold">Chores Game Leaderboard</h1>
            <p className="text-yellow-100">Top performers across all classes</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('overall')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'overall'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span>Overall Top 5</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('6A')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === '6A'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Class 6A</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('6B')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === '6B'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Class 6B</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('6C')}
            className={`flex-1 min-w-[120px] px-4 py-3 rounded-lg font-semibold transition-all ${
              activeTab === '6C'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Users className="h-4 w-4" />
              <span>Class 6C</span>
            </div>
          </button>
        </div>
      </div>

      {/* Leaderboard Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'overall' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  Overall Top 5 Champions
                </h2>
                {renderLeaderboardTable(overallLeaderboard)}
              </div>
            )}

            {activeTab === '6A' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-500" />
                  Class 6A Top 5
                </h2>
                {renderLeaderboardTable(classLeaderboards['6A'])}
              </div>
            )}

            {activeTab === '6B' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-green-500" />
                  Class 6B Top 5
                </h2>
                {renderLeaderboardTable(classLeaderboards['6B'])}
              </div>
            )}

            {activeTab === '6C' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-500" />
                  Class 6C Top 5
                </h2>
                {renderLeaderboardTable(classLeaderboards['6C'])}
              </div>
            )}
          </>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="text-3xl">ℹ️</div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How Rankings Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Rankings are based on <strong>total points</strong> earned across all math games</li>
              <li>• Points are awarded based on difficulty level and answer streaks</li>
              <li>• The leaderboard updates in real-time as students play</li>
              <li>• Each class has its own Top 5, plus an Overall Top 5 across all classes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPlugin;
