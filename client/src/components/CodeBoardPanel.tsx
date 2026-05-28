import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { codeBoardApi } from '../services/api';
import { CodeBoardAppItem, CodeBoardManageStatus, ContentSubmissionStatus } from '../types';

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

const CodeBoardPanel: React.FC = () => {
  const [status, setStatus] = useState<CodeBoardManageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await codeBoardApi.getManage();
      setStatus(res.data);
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
    fetchStatus();
  }, [fetchStatus]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await codeBoardApi.postApp({ title: title.trim(), url: url.trim() });
      setTitle('');
      setUrl('');
      setSuccess('App submitted for teacher approval. It will appear on the Code Board once approved.');
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to post app'
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (app: CodeBoardAppItem) => {
    if (!window.confirm(`Remove "${app.title}" from the Code Board?`)) return;
    try {
      setActionLoading(true);
      setError(null);
      setSuccess(null);
      await codeBoardApi.deleteApp(app.id);
      setSuccess('App removed.');
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to remove app'
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600 py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>Loading code board...</span>
      </div>
    );
  }

  const atLimit = status ? status.apps.length >= status.max_apps : false;

  return (
    <div className="pt-6 border-t border-gray-200">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <span className="text-xl">💻</span>
              Code Board
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Post links to apps you build. Your teacher must approve each app before classmates can see it.
              Classmate stars and link clicks still earn you{' '}
              <strong>{status?.star_xp_reward ?? 5} XP + R{(status?.star_earnings_reward ?? 1000).toLocaleString()}</strong>{' '}
              per star and{' '}
              <strong>{status?.click_xp_reward ?? 5} XP + R{(status?.click_earnings_reward ?? 500).toLocaleString()}</strong>{' '}
              when they open your link.
            </p>
          </div>
          <Link to="/code-board" className="text-sm font-medium text-blue-700 hover:underline">
            View Code Board →
          </Link>
        </div>

        {error && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-3">{success}</p>
        )}

        <form onSubmit={handlePost} className="space-y-3 mb-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App name</label>
            <input
              type="text"
              className="input-field w-full"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Budget Calculator"
              maxLength={200}
              disabled={actionLoading || atLimit}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">App link</label>
            <input
              type="url"
              className="input-field w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              disabled={actionLoading || atLimit}
            />
          </div>
          <button
            type="submit"
            disabled={actionLoading || atLimit || !title.trim() || !url.trim()}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Post for approval
          </button>
          {atLimit && (
            <p className="text-xs text-amber-700">
              You have reached the maximum of {status?.max_apps} apps. Remove one to post another.
            </p>
          )}
        </form>

        {!status?.apps.length ? (
          <p className="text-sm text-gray-500">You have not posted any apps yet.</p>
        ) : (
          <div className="space-y-2">
            {status.apps.map((app) => (
              <div
                key={app.id}
                className="flex items-start justify-between gap-3 bg-white rounded-lg border border-blue-100 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 truncate">{app.title}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${submissionStatusClass(app.status)}`}>
                      {submissionStatusLabel(app.status)}
                    </span>
                  </div>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline truncate block"
                  >
                    {app.url}
                  </a>
                  {app.denial_reason && (
                    <p className="text-xs text-red-700 mt-1">Teacher note: {app.denial_reason}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {app.star_count} star{app.star_count === 1 ? '' : 's'} · {app.click_count} click
                    {app.click_count === 1 ? '' : 's'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(app)}
                  disabled={actionLoading}
                  className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Remove app"
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

export default CodeBoardPanel;
