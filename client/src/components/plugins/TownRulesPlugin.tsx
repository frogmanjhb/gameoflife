import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useTown } from '../../contexts/TownContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ScrollText, Save, Edit2, CheckCircle } from 'lucide-react';
import api from '../../services/api';

const APP_RULES = [
  { title: '1. Protect Your Account', items: ['Keep your password private.', 'Do not use someone else\'s account.', 'Tell a teacher if something looks wrong.'] },
  { title: '2. Be Honest with Money', items: ['Do not try to "hack" or cheat the system.', 'Only transfer money for real in-game reasons.', 'No fake payments or tricks.', 'If you cheat, money will be removed and fines may apply.'] },
  { title: '3. Do Your Job', items: ['Complete your weekly job tasks.', 'Do not claim work you didn\'t do.', 'If you don\'t do your job, your salary may pause.'] },
  { title: '4. Plan Your Money', items: ['Submit your budget honestly.', 'Pay rent, tax and other required costs.', 'Bad planning has real consequences.', 'The system will not be reset because you overspent.'] },
  { title: '5. Follow the Law', items: ['Respect the rules voted in by the class.', 'Submit appropriate rule ideas.', 'No spam or silly submissions.'] },
  { title: '6. Buy Property Properly', items: ['Apply before buying land.', 'Follow biome and building rules.', 'Do not claim land without approval.'] },
  { title: '7. Be Respectful', items: ['All posts, tools and news must be school-appropriate.', 'Treat others fairly in transfers and deals.'] },
  { title: '8. Learn from Mistakes', items: ['This is a simulation of real life.', 'You will make mistakes.', 'That\'s part of learning.'] },
];

interface TownRules {
  id: number;
  town_class: string;
  rules: string | null;
  created_at: string;
  updated_at: string;
}

const TownRulesPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { currentTownClass } = useTown();
  const { user, refreshProfile } = useAuth();
  const [rules, setRules] = useState<TownRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [agreeing, setAgreeing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rulesText, setRulesText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const townRulesPlugin = plugins.find(p => p.route_path === '/town-rules');
  const isStudent = user?.role === 'student';
  const hasAgreedToRules = !!user?.rules_agreed_at;

  useEffect(() => {
    if (currentTownClass) {
      fetchRules();
    }
  }, [currentTownClass]);

  const fetchRules = async () => {
    if (!currentTownClass) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/town-rules', {
        params: { town_class: currentTownClass }
      });
      setRules(response.data);
      setRulesText(response.data.rules || '');
    } catch (err: any) {
      console.error('Failed to fetch town rules:', err);
      setError(err.response?.data?.error || 'Failed to load town rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentTownClass) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await api.put('/town-rules', {
        town_class: currentTownClass,
        rules: rulesText || null
      });

      setSuccess(true);
      setEditing(false);
      await fetchRules();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save town rules:', err);
      setError(err.response?.data?.error || 'Failed to save town rules');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setRulesText(rules?.rules || '');
    setEditing(false);
    setError(null);
    setSuccess(false);
  };

  const handleAgreeToRules = async () => {
    try {
      setAgreeing(true);
      setError(null);
      await api.post('/auth/rules-agree');
      await refreshProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to agree to rules');
    } finally {
      setAgreeing(false);
    }
  };

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!townRulesPlugin || !townRulesPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🏛</div>
          <div>
            <h1 className="text-2xl font-bold">Game of Life – App Rules</h1>
            <p className="text-primary-100">These rules help our town run fairly and smoothly.</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          Town rules saved successfully!
        </div>
      )}

      {/* App Rules (always visible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">App Rules</h2>
        <div className="space-y-5">
          {APP_RULES.map((rule) => (
            <div key={rule.title}>
              <h3 className="font-medium text-gray-800 mb-2">{rule.title}</h3>
              <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm">
                {rule.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {isStudent && !hasAgreedToRules && (
          <div className="mt-8 p-6 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-amber-900 font-medium mb-4">
              You must agree to the rules to use the enabled systems.
            </p>
            <button
              onClick={handleAgreeToRules}
              disabled={agreeing}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium"
            >
              {agreeing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Agreeing...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  <span>I agree to the rules</span>
                </>
              )}
            </button>
          </div>
        )}

        {isStudent && hasAgreedToRules && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>
              You agreed to the rules on {user?.rules_agreed_at && new Date(user.rules_agreed_at).toLocaleDateString()}.
            </span>
          </div>
        )}
      </div>

      {/* Town Rules (teacher-editable, visible after student signs) */}
      {(isTeacher || hasAgreedToRules) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Town Rules – {currentTownClass}
          </h2>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-2" />
              <p className="text-gray-600">Loading town rules...</p>
            </div>
          ) : (
            <>
              {isTeacher && !editing && (
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                    <span>Edit Rules</span>
                  </button>
                </div>
              )}

              {editing ? (
                <div className="space-y-4">
                  <textarea
                    value={rulesText}
                    onChange={(e) => setRulesText(e.target.value)}
                    placeholder="Enter town rules here..."
                    className="w-full h-64 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          <span>Save Rules</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {rules?.rules ? (
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {rules.rules}
                      </div>
                      {rules.updated_at && (
                        <p className="mt-4 text-sm text-gray-500">
                          Last updated: {new Date(rules.updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ScrollText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <h3 className="text-base font-semibold text-gray-900 mb-2">No Town Rules Set</h3>
                      <p className="text-gray-600 text-sm">
                        {isTeacher
                          ? 'Click "Edit Rules" to add rules for this town.'
                          : 'No town rules have been set yet.'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default TownRulesPlugin;
