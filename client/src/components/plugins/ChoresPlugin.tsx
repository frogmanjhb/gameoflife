import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Clock, Trophy, Play, Loader2, ToggleLeft, ToggleRight } from 'lucide-react';
import api, { mathGameApi, wordleGameApi } from '../../services/api';
import { MathGameStatus, WordleGameStatus } from '../../types';
import ChoresGameModal from '../ChoresGameModal';
import WordleGameModal from '../WordleGameModal';

const ChoresPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const choresPlugin = plugins.find(p => p.route_path === '/chores');

  const [mathGameStatus, setMathGameStatus] = useState<MathGameStatus | null>(null);
  const [wordleGameStatus, setWordleGameStatus] = useState<WordleGameStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGameOpen, setIsGameOpen] = useState(false);
  const [isWordleOpen, setIsWordleOpen] = useState(false);

  // Teacher: bank settings for chore toggles
  const [bankSettings, setBankSettings] = useState<Record<string, string>>({});
  const [loadingBank, setLoadingBank] = useState(false);
  const [savingToggle, setSavingToggle] = useState<string | null>(null);

  useEffect(() => {
    if (choresPlugin && choresPlugin.enabled && user?.role === 'student') {
      fetchData();
    } else if (choresPlugin && choresPlugin.enabled && user?.role === 'teacher') {
      fetchBankSettings();
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [choresPlugin, user?.role]);

  const fetchBankSettings = async () => {
    setLoadingBank(true);
    try {
      const res = await api.get<Record<string, string>>('/transactions/bank-settings');
      setBankSettings(res.data || {});
    } catch (error) {
      console.error('Failed to fetch bank settings:', error);
    } finally {
      setLoadingBank(false);
    }
  };

  const updateChoreToggle = async (key: 'math_chores_enabled' | 'wordle_chores_enabled', value: string) => {
    setSavingToggle(key);
    try {
      await api.put(`/transactions/bank-settings/${key}`, { value });
      setBankSettings(prev => ({ ...prev, [key]: value }));
    } catch (error: any) {
      console.error('Failed to update setting:', error);
      alert(error.response?.data?.error || 'Failed to update setting');
    } finally {
      setSavingToggle(null);
    }
  };

  const fetchData = async () => {
    try {
      const [mathRes, wordleRes] = await Promise.all([
        mathGameApi.getStatus().catch(() => ({ data: null })),
        wordleGameApi.getStatus().catch(() => ({ data: null }))
      ]);
      setMathGameStatus(mathRes.data);
      setWordleGameStatus(wordleRes.data);
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
    const mathEnabled = (bankSettings.math_chores_enabled ?? 'true').toLowerCase() === 'true';
    const wordleEnabled = (bankSettings.wordle_chores_enabled ?? 'true').toLowerCase() === 'true';
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🧹</div>
            <div>
              <h1 className="text-2xl font-bold">Chores</h1>
              <p className="text-primary-100">Chore challenges – students earn money with math and Wordle</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <p className="text-gray-600 mb-6">
            Students complete chore challenges to earn money. Math chores: solve sums (daily limit in Town Settings). Wordle chores: guess the word in 6 tries (earn money and job XP if they have a job). Enable or disable each type below.
          </p>
          {loadingBank ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Math Chores</p>
                  <p className="text-sm text-gray-500">Students can play math chore challenges to earn money</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateChoreToggle('math_chores_enabled', mathEnabled ? 'false' : 'true')}
                  disabled={savingToggle !== null}
                  className="focus:outline-none disabled:opacity-50"
                >
                  {mathEnabled ? (
                    <ToggleRight className="h-10 w-10 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Wordle Chores</p>
                  <p className="text-sm text-gray-500">Students can play Wordle chore challenges to earn money (and job XP if they have a job)</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateChoreToggle('wordle_chores_enabled', wordleEnabled ? 'false' : 'true')}
                  disabled={savingToggle !== null}
                  className="focus:outline-none disabled:opacity-50"
                >
                  {wordleEnabled ? (
                    <ToggleRight className="h-10 w-10 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          )}
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

  const mathEnabled = mathGameStatus?.enabled !== false;
  const wordleEnabled = wordleGameStatus?.enabled !== false;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🧹</div>
          <div>
            <h1 className="text-2xl font-bold">Chores</h1>
            <p className="text-primary-100">Solve math sums or Wordle to complete chores and earn money!</p>
          </div>
        </div>
      </div>

      {mathEnabled && (
        <>
          <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Math Chores</h2>
            <p className="text-green-100">
              Each correct sum = 1 chore done. Easy = dishwasher, Medium = dog poo, Hard = lawn mower, Extreme = car wash. Earn R1 per correct answer (higher multipliers for harder difficulties)!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Math – Plays Remaining</h3>
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {mathGameStatus?.remaining_plays ?? 0}/{mathGameStatus?.daily_limit ?? 3}
              </div>
              <p className="text-sm text-gray-500">Resets daily at 6 AM</p>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Math High Scores</h3>
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
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Extreme (Car wash):</span>
                  <span className="font-semibold">{mathGameStatus?.high_scores?.extreme ?? 0}</span>
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
                  Start Math Chores Game
                </>
              ) : (
                'No Math Plays Remaining Today'
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Math Games</h3>
              <div className="space-y-3">
                {mathGameStatus.recent_sessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        session.difficulty === 'easy' ? 'bg-green-500' :
                        session.difficulty === 'medium' ? 'bg-yellow-500' :
                        session.difficulty === 'hard' ? 'bg-red-500' : 'bg-purple-500'
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
        </>
      )}

      {wordleEnabled && (
        <>
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white">
            <h2 className="text-xl font-bold mb-2">Wordle Chores</h2>
            <p className="text-amber-100 mb-3">
              Guess the 5-letter word in 6 tries. Win to earn money; if you have a job, you also earn job XP!
            </p>
            <div className="bg-amber-500/20 rounded-lg p-4 text-sm text-amber-50">
              <p className="font-semibold mb-2">How to play</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Type any 5-letter word and press <kbd className="px-1.5 py-0.5 bg-amber-900/40 rounded">Enter</kbd> to guess.</li>
                <li><span className="inline-block w-4 h-4 rounded bg-green-600 mr-1 align-middle" /> Green = letter is correct and in the right place.</li>
                <li><span className="inline-block w-4 h-4 rounded bg-amber-500 mr-1 align-middle" /> Yellow = letter is in the word but in the wrong place.</li>
                <li><span className="inline-block w-4 h-4 rounded bg-gray-600 mr-1 align-middle" /> Gray = letter is not in the word.</li>
                <li>Use the clues to guess the word within 6 tries. Win to earn money (and job XP if you have a job).</li>
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Wordle – Plays Remaining</h3>
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div className="text-3xl font-bold text-amber-600 mb-2">
              {wordleGameStatus?.remaining_plays ?? 0}/{wordleGameStatus?.daily_limit ?? 3}
            </div>
            <p className="text-sm text-gray-500">Resets daily at 6 AM</p>
          </div>

          <div className="text-center">
            <button
              onClick={() => setIsWordleOpen(true)}
              disabled={!wordleGameStatus || (wordleGameStatus.remaining_plays ?? 0) <= 0}
              className={`px-8 py-4 rounded-xl font-bold text-lg transition-all ${
                wordleGameStatus && (wordleGameStatus.remaining_plays ?? 0) > 0
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-600 hover:to-orange-700 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {wordleGameStatus && (wordleGameStatus.remaining_plays ?? 0) > 0 ? (
                <>
                  <Play className="inline-block h-6 w-6 mr-2" />
                  Start Wordle Chores
                </>
              ) : (
                'No Wordle Plays Remaining Today'
              )}
            </button>
          </div>

          {wordleGameStatus?.recent_sessions && wordleGameStatus.recent_sessions.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Wordle Games</h3>
              <div className="space-y-3">
                {wordleGameStatus.recent_sessions.slice(0, 5).map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {session.status === 'won' ? 'Won' : 'Lost'} in {session.guesses_count} guess(es)
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.played_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">
                        +R{Number(session.earnings || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!mathEnabled && !wordleEnabled && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 text-center text-gray-500">
          <p>Chore challenges are currently disabled. Ask your teacher to enable Math or Wordle chores.</p>
        </div>
      )}

      <ChoresGameModal
        isOpen={isGameOpen}
        onClose={() => setIsGameOpen(false)}
        onGameComplete={fetchData}
        gameStatus={mathGameStatus}
      />
      <WordleGameModal
        isOpen={isWordleOpen}
        onClose={() => setIsWordleOpen(false)}
        onGameComplete={fetchData}
      />
    </div>
  );
};

export default ChoresPlugin;
