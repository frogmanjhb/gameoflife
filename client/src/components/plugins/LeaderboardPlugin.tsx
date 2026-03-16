import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Trophy, Users, Star, TrendingUp, BookOpen, DollarSign } from 'lucide-react';
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
  hide_from_leaderboards?: boolean;
}

interface WordleLeaderboardEntry {
  user_id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  total_earnings: number;
  games_played: number;
  wins: number;
  best_guesses: number | null;
  rank: number;
  hide_from_leaderboards?: boolean;
}

interface ClassLeaderboards {
  '6A': LeaderboardEntry[];
  '6B': LeaderboardEntry[];
  '6C': LeaderboardEntry[];
}

interface ClassWordleLeaderboards {
  '6A': WordleLeaderboardEntry[];
  '6B': WordleLeaderboardEntry[];
  '6C': WordleLeaderboardEntry[];
}

const LeaderboardPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const leaderboardPlugin = plugins.find(p => p.route_path === '/leaderboard');
  const { user } = useAuth();

  type GameType = 'math' | 'wordle';
  const [gameType, setGameType] = useState<GameType>('math');
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [classLeaderboards, setClassLeaderboards] = useState<ClassLeaderboards>({ '6A': [], '6B': [], '6C': [] });
  const [overallWordleLeaderboard, setOverallWordleLeaderboard] = useState<WordleLeaderboardEntry[]>([]);
  const [classWordleLeaderboards, setClassWordleLeaderboards] = useState<ClassWordleLeaderboards>({ '6A': [], '6B': [], '6C': [] });
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
      const includeHidden = user?.role === 'teacher';
      const query = includeHidden ? '?include_hidden=true' : '';
      const [mathOverallRes, mathClassesRes, wordleOverallRes, wordleClassesRes] = await Promise.all([
        api.get(`/leaderboard/overall${query}`),
        api.get(`/leaderboard/all-classes${query}`),
        api.get(`/wordle-leaderboard/overall${query}`),
        api.get(`/wordle-leaderboard/all-classes${query}`)
      ]);

      setOverallLeaderboard(mathOverallRes.data.leaderboard || []);
      setClassLeaderboards(mathClassesRes.data || { '6A': [], '6B': [], '6C': [] });
      setOverallWordleLeaderboard(wordleOverallRes.data.leaderboard || []);
      setClassWordleLeaderboards(wordleClassesRes.data || { '6A': [], '6B': [], '6C': [] });
    } catch (error) {
      console.error('Failed to fetch leaderboards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = (entry: LeaderboardEntry | WordleLeaderboardEntry) => {
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

            {/* Teacher controls */}
            {user?.role === 'teacher' && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const newHidden = !entry.hide_from_leaderboards;
                    await api.post(`/students/${encodeURIComponent(entry.username)}/leaderboard-visibility`, { hidden: newHidden });
                    setOverallLeaderboard(prev => prev.map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e));
                    setClassLeaderboards(prev => ({
                      '6A': prev['6A'].map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e),
                      '6B': prev['6B'].map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e),
                      '6C': prev['6C'].map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e),
                    }));
                  } catch (err) {
                    console.error('Failed to toggle leaderboard visibility', err);
                    alert('Failed to update leaderboard visibility for this student.');
                  }
                }}
                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${
                  entry.hide_from_leaderboards
                    ? 'bg-gray-200 border-gray-400 text-gray-700'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                {entry.hide_from_leaderboards ? 'Hidden' : 'Hide'}
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderWordleLeaderboardTable = (entries: WordleLeaderboardEntry[]) => {
    if (entries.length === 0) {
      return (
        <div className="text-center py-12">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">No Wordle games played yet. Be the first to compete!</p>
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
            <div className="flex-shrink-0 text-center w-16">
              <div className="text-4xl mb-1">{getRankEmoji(entry.rank)}</div>
              <div className="text-lg font-bold">#{entry.rank}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-semibold text-lg truncate">{getDisplayName(entry)}</div>
              <div className="text-sm opacity-75">
                {entry.class && <span className="mr-3">Class {entry.class}</span>}
                <span>{entry.wins} win{entry.wins !== 1 ? 's' : ''} · {entry.games_played} game{entry.games_played !== 1 ? 's' : ''}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="flex items-center gap-1 justify-end mb-1">
                <DollarSign className="h-5 w-5" />
                <span className="text-2xl font-bold">R{Number(entry.total_earnings).toLocaleString()}</span>
              </div>
              <div className="text-xs opacity-75">Total earnings</div>
            </div>

            <div className="hidden md:flex flex-col gap-1 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-20 opacity-75">Best guess:</span>
                <span className="font-semibold">{entry.best_guesses != null ? entry.best_guesses + ' try' + (entry.best_guesses !== 1 ? 's' : '') : '—'}</span>
              </div>
            </div>

            {/* Teacher controls */}
            {user?.role === 'teacher' && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const newHidden = !entry.hide_from_leaderboards;
                    await api.post(`/students/${encodeURIComponent(entry.username)}/leaderboard-visibility`, { hidden: newHidden });
                    setOverallWordleLeaderboard(prev => prev.map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e));
                    setClassWordleLeaderboards(prev => ({
                      '6A': prev['6A'].map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e),
                      '6B': prev['6B'].map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e),
                      '6C': prev['6C'].map(e => e.user_id === entry.user_id ? { ...e, hide_from_leaderboards: newHidden } : e),
                    }));
                  } catch (err) {
                    console.error('Failed to toggle leaderboard visibility', err);
                    alert('Failed to update leaderboard visibility for this student.');
                  }
                }}
                className={`ml-2 px-3 py-1 rounded-full text-xs font-medium border ${
                  entry.hide_from_leaderboards
                    ? 'bg-gray-200 border-gray-400 text-gray-700'
                    : 'bg-white border-gray-300 text-gray-600'
                }`}
              >
                {entry.hide_from_leaderboards ? 'Hidden' : 'Hide'}
              </button>
            )}
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
            <h1 className="text-2xl font-bold">Chores Leaderboard</h1>
            <p className="text-yellow-100">
              {gameType === 'math' ? 'Math game rankings' : 'Wordle chore rankings'} · Top performers across all classes
            </p>
          </div>
        </div>
      </div>

      {/* Game type selector */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-2">
        <div className="flex flex-wrap gap-2 mb-2">
          <button
            onClick={() => setGameType('math')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-semibold transition-all ${
              gameType === 'math'
                ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Math Game</span>
            </div>
          </button>
          <button
            onClick={() => setGameType('wordle')}
            className={`flex-1 min-w-[140px] px-4 py-3 rounded-lg font-semibold transition-all ${
              gameType === 'wordle'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">📝</span>
              <span>Wordle Chores</span>
            </div>
          </button>
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
                {gameType === 'math'
                  ? renderLeaderboardTable(overallLeaderboard)
                  : renderWordleLeaderboardTable(overallWordleLeaderboard)}
              </div>
            )}

            {activeTab === '6A' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-blue-500" />
                  Class 6A Top 5
                </h2>
                {gameType === 'math'
                  ? renderLeaderboardTable(classLeaderboards['6A'])
                  : renderWordleLeaderboardTable(classWordleLeaderboards['6A'])}
              </div>
            )}

            {activeTab === '6B' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-green-500" />
                  Class 6B Top 5
                </h2>
                {gameType === 'math'
                  ? renderLeaderboardTable(classLeaderboards['6B'])
                  : renderWordleLeaderboardTable(classWordleLeaderboards['6B'])}
              </div>
            )}

            {activeTab === '6C' && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="h-6 w-6 text-purple-500" />
                  Class 6C Top 5
                </h2>
                {gameType === 'math'
                  ? renderLeaderboardTable(classLeaderboards['6C'])
                  : renderWordleLeaderboardTable(classWordleLeaderboards['6C'])}
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
            {gameType === 'math' ? (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Rankings are based on <strong>total points</strong> earned across all math games</li>
                <li>• Points are awarded based on difficulty level and answer streaks</li>
                <li>• The leaderboard updates as students play</li>
                <li>• Each class has its own Top 5, plus an Overall Top 5 across all classes</li>
              </ul>
            ) : (
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Rankings are based on <strong>total earnings</strong> from Wordle chore games (earn more by solving in fewer guesses)</li>
                <li>• Wins and best guess (fewest tries to solve) are shown</li>
                <li>• The leaderboard updates as students play Wordle chores</li>
                <li>• Each class has its own Top 5, plus an Overall Top 5 across all classes</li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPlugin;
