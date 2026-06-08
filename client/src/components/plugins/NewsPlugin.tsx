import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Newspaper, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { useTown } from '../../contexts/TownContext';
import { townNewsApi } from '../../services/api';
import { TownNewsPublicView } from '../../types';
import TownNewsStoryCard, { storyToCardProps } from '../TownNewsStoryCard';

const NewsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const { currentTownClass } = useTown();
  const newsPlugin = plugins.find((p) => p.route_path === '/news');
  const [data, setData] = useState<TownNewsPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [removingStoryId, setRemovingStoryId] = useState<number | null>(null);

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

  const handleRemove = async (storyId: number, headline: string) => {
    if (!window.confirm(`Remove "${headline}" from the Town News Board?`)) return;
    try {
      setRemovingStoryId(storyId);
      setError(null);
      setSuccess(null);
      await townNewsApi.deleteStory(
        storyId,
        currentTownClass ? { class: currentTownClass } : undefined
      );
      setSuccess('Story removed from the Town News Board.');
      await fetchStories();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to remove story'
      );
    } finally {
      setRemovingStoryId(null);
    }
  };

  const isTeacher = user?.role === 'teacher';

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
            <p className="text-primary-100">
              Local news, posters and updates from journalists, graphic designers, and entrepreneurs
            </p>
          </div>
        </div>
      </div>

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</p>
      )}

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
          <p className="text-gray-600">No approved stories or posters have been published yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.stories.map((story) => {
            const removing = removingStoryId === story.id;
            return (
              <div key={story.id} className="relative">
                {isTeacher && (
                  <div className="flex justify-end mb-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(story.id, story.headline)}
                      disabled={removing || !currentTownClass}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                    >
                      {removing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Remove story
                    </button>
                  </div>
                )}
                <TownNewsStoryCard {...storyToCardProps(story)} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NewsPlugin;
