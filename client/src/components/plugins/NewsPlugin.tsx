import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Newspaper } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { useTown } from '../../contexts/TownContext';
import { townNewsApi } from '../../services/api';
import { TownNewsPublicView } from '../../types';

const NewsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const { currentTownClass } = useTown();
  const newsPlugin = plugins.find((p) => p.route_path === '/news');
  const [data, setData] = useState<TownNewsPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStories = useCallback(async () => {
    if (user?.role === 'teacher' && !currentTownClass) {
      setLoading(false);
      setError('Select a town class from the dashboard to view the Town News Board.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await townNewsApi.getStories(
        currentTownClass ? { class: currentTownClass } : undefined
      );
      setData(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load Town News'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.role, currentTownClass]);

  useEffect(() => {
    if (!newsPlugin?.enabled) return;
    fetchStories();
  }, [newsPlugin?.enabled, fetchStories]);

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!newsPlugin || !newsPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📰</div>
          <div>
            <h1 className="text-2xl font-bold">Town News Board</h1>
            <p className="text-primary-100">Local news and updates from your town journalists</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center text-red-700">{error}</div>
      ) : !data?.stories.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Newspaper className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No stories yet</h2>
          <p className="text-gray-600">Your town journalists have not published any news yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.stories.map((story) => (
            <article
              key={story.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
            >
              {story.image_data && (
                <img
                  src={story.image_data}
                  alt={story.headline}
                  className="w-full max-h-80 object-cover bg-gray-100"
                />
              )}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{story.headline}</h2>
                <p className="text-sm text-gray-500 mb-4">
                  {story.journalist_name && <span>By {story.journalist_name} · </span>}
                  {new Date(story.created_at).toLocaleString()}
                </p>
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">{story.body}</div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPlugin;
