import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Clock, Trophy, Play, Loader2 } from 'lucide-react';
import { mathGameApi } from '../../services/api';
import { MathGameStatus } from '../../types';
import ChoresGameModal from '../ChoresGameModal';

const ChoresPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const choresPlugin = plugins.find(p => p.route_path === '/chores');

  const [mathGameStatus, setMathGameStatus] = useState<MathGameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGameOpen, setIsGameOpen] = useState(false);

  useEffect(() => {
    if (choresPlugin && choresPlugin.enabled && user?.role === 'student') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [choresPlugin, user?.role]);

  const fetchData = async () => {
    try {
      const res = await mathGameApi.getStatus().catch(() => ({ data: null }));
      setMathGameStatus(res.data);
    } catch (error) {
      console.error('Failed to fetch chores game status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!choresPlugin || !choresPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  // Teacher view
  if (user?.role === 'teacher') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🧹</div>
            <div>
              <h1 className="text-2xl font-bold">Chores</h1>
              <p className="text-primary-100">Chore challenges – students earn money by solving math sums</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-gray-600">
            Students complete chore-themed math challenges to earn money. Each correct sum = 1 chore done (dishwasher items unpacked, dog poos picked up, or lawn meters mowed depending on difficulty). Daily limit is configured in Town Settings.
          </p>
        </div>
      </div>
    );
  }

  // Student view
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🧹</div>
          <div>
            <h1 className="text-2xl font-bold">Chores</h1>
            <p className="text-primary-100">Solve math sums to complete chores and earn money!</p>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Chore Challenges</h2>
        <p className="text-green-100">
          Each correct sum = 1 chore done. Easy = dishwasher (items unpacked), Medium = dog poo (poos picked up), Hard = lawn mower (meters mowed). Earn R1 per correct answer!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Plays Remaining</h3>
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {mathGameStatus?.remaining_plays ?? 0}/{mathGameStatus?.daily_limit ?? 3}
          </div>
          <p className="text-sm text-gray-500">Resets daily at 6 AM</p>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">High Scores</h3>
            <Trophy className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Easy (Dishwasher):</span>
              <span className="font-semibold">{mathGameStatus?.high_scores?.easy ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Medium (Dog poo):</span>
              <span className="font-semibold">{mathGameStatus?.high_scores?.medium ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Hard (Lawn mower):</span>
              <span className="font-semibold">{mathGameStatus?.high_scores?.hard ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => setIsGameOpen(true)}
          disabled={!mathGameStatus || (mathGameStatus.remaining_plays ?? 0) <= 0}
          className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
            mathGameStatus && (mathGameStatus.remaining_plays ?? 0) > 0
              ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:from-pink-700 hover:to-purple-700 transform hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {mathGameStatus && (mathGameStatus.remaining_plays ?? 0) > 0 ? (
            <>
              <Play className="inline-block h-6 w-6 mr-2" />
              Start Chores Game
            </>
          ) : (
            'No Plays Remaining Today'
          )}
        </button>
        {mathGameStatus && (mathGameStatus.remaining_plays ?? 0) > 0 && (
          <p className="text-sm text-gray-500 mt-2">
            60 seconds • Earn R1 per correct answer • Difficulty multipliers apply
          </p>
        )}
      </div>

      {mathGameStatus?.recent_sessions && mathGameStatus.recent_sessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Games</h3>
          <div className="space-y-3">
            {mathGameStatus.recent_sessions.slice(0, 5).map((session: any) => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    session.difficulty === 'easy' ? 'bg-green-500' :
                    session.difficulty === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium text-gray-900 capitalize">
                      {session.difficulty} – {session.score} correct
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(session.played_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">
                    +R{Number(session.earnings || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {session.correct_answers}/{session.total_problems} correct
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ChoresGameModal
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
        onGameComplete={fetchData}
        gameStatus={mathGameStatus}
      />
    </div>
  );
};

export default ChoresPlugin;
