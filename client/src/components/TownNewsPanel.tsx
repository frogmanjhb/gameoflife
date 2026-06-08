import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Loader2, Send, Trash2 } from 'lucide-react';
import { townNewsApi } from '../services/api';
import { TownNewsManageStatus, TownNewsStory, ContentSubmissionStatus, TownNewsWidgets } from '../types';
import TownNewsStoryCard from './TownNewsStoryCard';
import TownNewsPopupPanel from './TownNewsPopupPanel';
import {
  EMPTY_TOWN_NEWS_WIDGETS,
  TOWN_NEWS_ACCENT_OPTIONS,
  TOWN_NEWS_BADGE_OPTIONS,
  TOWN_NEWS_EMOJI_OPTIONS,
  TOWN_NEWS_HEADLINE_STYLE_OPTIONS,
  badgeLabel,
  hasWidgets,
} from '../utils/townNewsWidgets';

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

function submissionStatusLabel(status?: ContentSubmissionStatus) {
  if (status === 'approved') return 'Approved';
  if (status === 'denied') return 'Denied';
  return 'Pending approval';
}

function submissionStatusClass(status?: ContentSubmissionStatus) {
  if (status === 'approved') return 'bg-green-100 text-green-800';
  if (status === 'denied') return 'bg-red-100 text-red-800';
  return 'bg-amber-100 text-amber-800';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

function buildWidgetsPayload(widgets: TownNewsWidgets): TownNewsWidgets | undefined {
  const out: TownNewsWidgets = {};
  if (widgets.badge) out.badge = widgets.badge;
  if (widgets.headline_style) out.headline_style = widgets.headline_style;
  if (widgets.accent) out.accent = widgets.accent;
  if (widgets.emojis && widgets.emojis.length > 0) out.emojis = [...widgets.emojis];
  return Object.keys(out).length > 0 ? out : undefined;
}

const TownNewsPanel: React.FC = () => {
  const [status, setStatus] = useState<TownNewsManageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<TownNewsWidgets>({ ...EMPTY_TOWN_NEWS_WIDGETS });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewWidgets = useMemo((): TownNewsWidgets => {
    const out: TownNewsWidgets = {};
    if (widgets.badge) out.badge = widgets.badge;
    if (widgets.headline_style) out.headline_style = widgets.headline_style;
    if (widgets.accent) out.accent = widgets.accent;
    if (widgets.emojis?.length) out.emojis = widgets.emojis;
    return out;
  }, [widgets]);

  const showPreview = headline.trim().length > 0 || body.trim().length > 0;

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await townNewsApi.getManage();
      setStatus(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load Town News Board'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, WebP, or GIF).');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('Image must be under 2 MB.');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setImageData(dataUrl);
      setImagePreview(dataUrl);
      setError(null);
    } catch {
      setError('Could not read the image file.');
    }
  };

  const clearImage = () => {
    setImageData(null);
    setImagePreview(null);
  };

  const toggleEmoji = (emoji: string) => {
    setWidgets((prev) => {
      const current = prev.emojis ?? [];
      if (current.includes(emoji)) {
        return { ...prev, emojis: current.filter((e) => e !== emoji) };
      }
      if (current.length >= 5) {
        setError('You can pick up to 5 emojis.');
        return prev;
      }
      setError(null);
      return { ...prev, emojis: [...current, emoji] };
    });
  };

  const resetForm = () => {
    setHeadline('');
    setBody('');
    clearImage();
    setWidgets({ ...EMPTY_TOWN_NEWS_WIDGETS });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !body.trim() || postsExhausted) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const payload = buildWidgetsPayload(widgets);
      const res = await townNewsApi.submitStory({
        headline: headline.trim(),
        body: body.trim(),
        image_data: imageData || undefined,
        widgets: payload,
      });
      setSuccess(res.data.message || 'Story submitted for teacher approval.');
      resetForm();
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to submit story'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (story: TownNewsStory) => {
    if (!window.confirm(`Remove "${story.headline}" from the Town News Board?`)) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await townNewsApi.deleteStory(story.id);
      setSuccess('Story removed.');
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to remove story'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const remainingPosts = status?.remaining_posts ?? 0;
  const dailyPostLimit = status?.daily_post_limit ?? 2;
  const postsExhausted = remainingPosts <= 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading Town News Board...</span>
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-gray-200">
      <div className="bg-gradient-to-r from-indigo-50 to-slate-50 rounded-lg p-6 border border-indigo-200">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">📰</span>
              Town News Board
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Submit town news stories, posters, or advertising with photos. Add optional widgets (badge, style,
              colour bar, emojis) to stand out. Your teacher must approve each submission before it publishes. Once
              approved, you earn <strong>{status?.story_xp_reward ?? 20} XP</strong> and{' '}
              <strong>R{(status?.story_earnings_reward ?? 5000).toLocaleString()}</strong>.
            </p>
            <p className="text-sm font-medium text-indigo-800 mt-2">
              {remainingPosts} / {dailyPostLimit} posts remaining today
            </p>
          </div>
          <Link to="/news" className="text-sm font-medium text-indigo-700 hover:underline">
            View Town News →
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">{success}</p>
        )}

        {postsExhausted && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
            You have used all {dailyPostLimit} Town News posts for today. Try again tomorrow.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              className="input-field w-full"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Mayor announces new tax plan"
              maxLength={200}
              disabled={actionLoading || postsExhausted}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Story</label>
            <textarea
              className="input-field w-full"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your news article..."
              maxLength={8000}
              disabled={actionLoading || postsExhausted}
            />
          </div>

          <div className="rounded-lg border border-indigo-100 bg-white p-4 space-y-4">
            <p className="text-sm font-semibold text-gray-900">Story widgets (optional)</p>

            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">Story badge</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setWidgets((p) => ({ ...p, badge: undefined }))}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    !widgets.badge
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                  }`}
                >
                  None
                </button>
                {TOWN_NEWS_BADGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => setWidgets((p) => ({ ...p, badge: opt.id }))}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                      widgets.badge === opt.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">Headline style</span>
              <div className="flex flex-wrap gap-2">
                {TOWN_NEWS_HEADLINE_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={actionLoading}
                    onClick={() =>
                      setWidgets((p) => ({
                        ...p,
                        headline_style: p.headline_style === opt.id ? undefined : opt.id,
                      }))
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      widgets.headline_style === opt.id
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">Accent colour bar</span>
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => setWidgets((p) => ({ ...p, accent: undefined }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                    !widgets.accent
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  None
                </button>
                {TOWN_NEWS_ACCENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={actionLoading}
                    title={opt.label}
                    onClick={() =>
                      setWidgets((p) => ({
                        ...p,
                        accent: p.accent === opt.id ? undefined : opt.id,
                      }))
                    }
                    className={`h-8 w-14 rounded-md border-2 ${
                      opt.id === 'teal' ? 'bg-teal-500' : opt.id === 'gold' ? 'bg-amber-500' : 'bg-red-600'
                    } ${widgets.accent === opt.id ? 'border-indigo-700 ring-2 ring-indigo-300' : 'border-transparent opacity-80 hover:opacity-100'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium text-gray-600 mb-2">
                Emoji strip (up to 5)
                {widgets.emojis?.length ? ` · ${widgets.emojis.length}/5 selected` : ''}
              </span>
              <div className="flex flex-wrap gap-2">
                {TOWN_NEWS_EMOJI_OPTIONS.map((emoji) => {
                  const selected = widgets.emojis?.includes(emoji);
                  return (
                    <button
                      key={emoji}
                      type="button"
                      disabled={actionLoading}
                      onClick={() => toggleEmoji(emoji)}
                      className={`text-xl w-10 h-10 rounded-lg border flex items-center justify-center ${
                        selected
                          ? 'bg-indigo-100 border-indigo-400 ring-2 ring-indigo-200'
                          : 'bg-white border-gray-200 hover:border-indigo-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo (optional)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageSelect}
            />
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={actionLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-200 bg-white text-indigo-700 text-sm font-medium hover:bg-indigo-50 disabled:opacity-50"
              >
                <ImagePlus className="h-4 w-4" />
                Add photo
              </button>
              {imagePreview && (
                <button
                  type="button"
                  onClick={clearImage}
                  disabled={actionLoading}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Remove photo
                </button>
              )}
            </div>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Story preview"
                className="mt-3 max-h-48 rounded-lg border border-gray-200 object-cover"
              />
            )}
          </div>

          {showPreview && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <TownNewsStoryCard
                headline={headline.trim() || 'Your headline'}
                body={body.trim() || 'Your story text…'}
                image_data={imagePreview}
                widgets={previewWidgets}
                compact
              />
            </div>
          )}

          <button
            type="submit"
            disabled={actionLoading || postsExhausted || !headline.trim() || !body.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish story for approval
          </button>
        </form>

        {!status?.stories.length ? (
          <p className="text-sm text-gray-500">You have not published any stories yet.</p>
        ) : (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-gray-900">Your submitted stories</h4>
            {status.stories.map((story) => (
              <div
                key={story.id}
                className="flex items-start justify-between gap-3 bg-white rounded-lg border border-indigo-100 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{story.headline}</p>
                    {story.widgets?.badge && (
                      <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {badgeLabel(story.widgets.badge)}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${submissionStatusClass(story.status)}`}>
                      {submissionStatusLabel(story.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2 mt-0.5">{story.body}</p>
                  {story.denial_reason && (
                    <p className="text-xs text-red-700 mt-1">Teacher note: {story.denial_reason}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(story.created_at).toLocaleString()}
                    {story.image_data ? ' · includes photo' : ''}
                    {hasWidgets(story.widgets) ? ' · widgets' : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(story)}
                  disabled={actionLoading}
                  className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Remove story"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <TownNewsPopupPanel />
    </div>
  );
};

export default TownNewsPanel;
