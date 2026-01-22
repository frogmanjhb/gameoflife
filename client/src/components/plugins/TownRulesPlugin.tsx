import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useTown } from '../../contexts/TownContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { ScrollText, Save, Edit2 } from 'lucide-react';
import api from '../../services/api';

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
  const { user } = useAuth();
  const [rules, setRules] = useState<TownRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [rulesText, setRulesText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const townRulesPlugin = plugins.find(p => p.route_path === '/town-rules');

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
          <div className="text-4xl">📜</div>
          <div>
            <h1 className="text-2xl font-bold">Town Rules</h1>
            <p className="text-primary-100">Rules and Regulations for {currentTownClass}</p>
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

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading town rules...</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Town Rules
                </label>
                <textarea
                  value={rulesText}
                  onChange={(e) => setRulesText(e.target.value)}
                  placeholder="Enter town rules here. Rules will be set later..."
                  className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Rules can be formatted as plain text. Markdown support may be added in the future.
                </p>
              </div>
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
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
                <div className="text-center py-12">
                  <ScrollText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rules Set</h3>
                  <p className="text-gray-600 mb-4">
                    {isTeacher
                      ? 'Click "Edit Rules" to add rules for this town.'
                      : 'No rules have been set for this town yet.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TownRulesPlugin;
