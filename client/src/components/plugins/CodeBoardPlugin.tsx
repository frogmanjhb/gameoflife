import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ExternalLink, Loader2, Star, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { codeBoardApi } from '../../services/api';
import { CodeBoardPublicView } from '../../types';

const CodeBoardPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const codeBoardPlugin = plugins.find((p) => p.route_path === '/code-board');
  const [data, setData] = useState<CodeBoardPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionAppId, setActionAppId] = useState<number | null>(null);
  const [removingAppId, setRemovingAppId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await codeBoardApi.getApps();
      setData(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load code board'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!codeBoardPlugin?.enabled) return;
    fetchApps();
  }, [codeBoardPlugin?.enabled, fetchApps]);

  const handleStar = async (appId: number) => {
    try {
      setActionAppId(appId);
      setFeedback(null);
      const res = await codeBoardApi.starApp(appId);
      setFeedback(
        `Star sent! The creator earned ${res.data.creator_xp} XP and R${res.data.creator_earnings.toLocaleString()}.`
      );
      await fetchApps();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to star app'
      );
    } finally {
      setActionAppId(null);
    }
  };

  const handleRemove = async (appId: number, title: string) => {
    if (!window.confirm(`Remove "${title}" from the Code Board?`)) return;
    try {
      setRemovingAppId(appId);
      setFeedback(null);
      setError(null);
      await codeBoardApi.deleteApp(appId);
      setFeedback(`"${title}" was removed from the Code Board.`);
      await fetchApps();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to remove app'
      );
    } finally {
      setRemovingAppId(null);
    }
  };

  const handleOpen = async (appId: number) => {
    try {
      setActionAppId(appId);
      setFeedback(null);
      const res = await codeBoardApi.clickApp(appId);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
      if (!res.data.already_clicked) {
        setFeedback(
          `Link opened! The creator earned ${res.data.creator_xp} XP and R${res.data.creator_earnings.toLocaleString()}.`
        );
      }
      await fetchApps();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to open app link'
      );
    } finally {
      setActionAppId(null);
    }
  };

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!codeBoardPlugin || !codeBoardPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  const isStudent = user?.role === 'student';
  const isTeacher = user?.role === 'teacher';

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">💻</div>
          <div>
            <h1 className="text-2xl font-bold">Code Board</h1>
            <p className="text-blue-100">
              Apps built by software engineers across all towns — star your favourites and try them out
            </p>
          </div>
        </div>
      </div>

      {data && (
        <p className="text-sm text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
          Each star gives the creator <strong>{data.star_xp_reward} XP</strong> and{' '}
          <strong>R{data.star_earnings_reward.toLocaleString()}</strong>. Opening a link for the first time gives them{' '}
          <strong>{data.click_xp_reward} XP</strong> and <strong>R{data.click_earnings_reward.toLocaleString()}</strong>.
        </p>
      )}

      {feedback && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{feedback}</p>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center text-red-700">{error}</div>
      ) : !data?.apps.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-5xl mb-4">💻</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No apps yet</h2>
          <p className="text-gray-600">
            No software engineers have posted any apps yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.apps.map((app) => {
            const busy = actionAppId === app.id;
            const removing = removingAppId === app.id;
            const canInteract = isStudent && !app.is_own_app;

            return (
              <div
                key={app.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{app.title}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      by {app.engineer_name}
                      {app.town_class ? ` · Town ${app.town_class}` : ''}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {app.star_count} star{app.star_count === 1 ? '' : 's'} · {app.click_count} click
                      {app.click_count === 1 ? '' : 's'}
                    </p>
                  </div>
                  {isTeacher && (
                    <button
                      type="button"
                      onClick={() => handleRemove(app.id, app.title)}
                      disabled={removing}
                      className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                      title="Remove student app"
                    >
                      {removing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-auto">
                  {canInteract ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpen(app.id)}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                        Open app
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStar(app.id)}
                        disabled={busy || app.has_starred}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                          app.has_starred
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-amber-500 hover:bg-amber-600 text-white'
                        }`}
                      >
                        <Star className={`h-4 w-4 ${app.has_starred ? 'fill-current' : ''}`} />
                        {app.has_starred ? 'Starred' : 'Star'}
                      </button>
                    </>
                  ) : app.is_own_app ? (
                    <p className="text-sm text-gray-500 italic">This is your app.</p>
                  ) : (
                    <a
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open app
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CodeBoardPlugin;
