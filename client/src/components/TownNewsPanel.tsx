import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImagePlus, Loader2, Send, Trash2 } from 'lucide-react';
import { townNewsApi } from '../services/api';
import { TownNewsManageStatus, TownNewsStory, ContentSubmissionStatus } from '../types';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!headline.trim() || !body.trim()) return;

    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      const res = await townNewsApi.submitStory({
        headline: headline.trim(),
        body: body.trim(),
        image_data: imageData || undefined,
      });
      setSuccess(res.data.message || 'Story submitted for teacher approval.');
      setHeadline('');
      setBody('');
      clearImage();
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
              Submit town news stories, posters, or advertising with photos. Your teacher must approve each
              submission before it publishes. Once approved, you earn{' '}
              <strong>{status?.story_xp_reward ?? 20} XP</strong> and{' '}
              <strong>R{(status?.story_earnings_reward ?? 5000).toLocaleString()}</strong>.
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

        <form onSubmit={handleSubmit} className="space-y-3 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
            <input
              type="text"
              className="input-field w-full"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Mayor announces new tax plan"
              maxLength={200}
              disabled={actionLoading}
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
              disabled={actionLoading}
            />
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
          <button
            type="submit"
            disabled={actionLoading || !headline.trim() || !body.trim()}
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
    </div>
  );
};

export default TownNewsPanel;
