import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Newspaper, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { useTown } from '../../contexts/TownContext';
import { townNewsApi } from '../../services/api';
import { TownNewsStory } from '../../types';
import TownNewsStoryCard, { storyToCardProps } from '../TownNewsStoryCard';
import { ResponsivePage, ResponsivePluginHero, LoadingState, EmptyState } from '../responsive';

const NewsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const { currentTownClass } = useTown();
  const newsPlugin = plugins.find((p) => p.route_path === '/news');
  const [stories, setStories] = useState<TownNewsStory[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
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
      setStories(res.data.stories);
      setHasMore(Boolean(res.data.has_more));
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load Town News'
      );
    } finally {
      setLoading(false);
    }
  }, [user?.role, currentTownClass]);

  const loadMoreStories = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    const oldestId = stories.length > 0 ? Math.min(...stories.map((story) => story.id)) : undefined;
    try {
      setLoadingMore(true);
      setError(null);
      const res = await townNewsApi.getStories({
        ...(currentTownClass ? { class: currentTownClass } : {}),
        ...(oldestId != null ? { before_id: oldestId } : { scope: 'older' }),
      });
      setStories((prev) => [...prev, ...res.data.stories]);
      setHasMore(Boolean(res.data.has_more));
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load more stories'
      );
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, stories, currentTownClass]);

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
    return <LoadingState />;
  }

  if (!newsPlugin || !newsPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <ResponsivePage>
      <ResponsivePluginHero
        icon={Newspaper}
        title="Town News Board"
        subtitle="Local news, posters and updates from journalists, graphic designers, and entrepreneurs"
      />

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3">{success}</p>
      )}

      {loading ? (
        <LoadingState />
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center text-red-700">{error}</div>
      ) : (
        <>
          {!stories.length ? (
            <EmptyState
              icon={Newspaper}
              title={hasMore ? 'No stories today' : 'No stories yet'}
              description={
                hasMore
                  ? 'No new stories have been published today. Load older posts below.'
                  : 'No approved stories or posters have been published yet.'
              }
            />
          ) : (
            <div className="space-y-6">
              {stories.map((story) => {
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
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={loadMoreStories}
                disabled={loadingMore}
                className="btn-primary min-w-[10rem]"
              >
                {loadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading…
                  </span>
                ) : (
                  'Load more'
                )}
              </button>
            </div>
          )}
        </>
      )}
    </ResponsivePage>
  );
};

export default NewsPlugin;
