import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, Loader2, Newspaper, XCircle } from 'lucide-react';
import { contentSubmissionsApi } from '../../services/api';
import {
  ContentSubmissionsPending,
  PendingCodeAppSubmission,
  PendingNewsPopupSubmission,
  PendingNewsStorySubmission,
} from '../../types';
import TownNewsStoryCard from '../TownNewsStoryCard';

function StatusBadge({ status }: { status: string }) {
  if (status === 'pending') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pending</span>;
  }
  if (status === 'approved') {
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800">Approved</span>;
  }
  return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-800">Denied</span>;
}

interface TeacherContentApprovalsProps {
  onUpdate?: () => void;
}

const TeacherContentApprovals: React.FC<TeacherContentApprovalsProps> = ({ onUpdate }) => {
  const [data, setData] = useState<ContentSubmissionsPending | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [bulkApproving, setBulkApproving] = useState<'news' | 'apps' | null>(null);
  const [denialDrafts, setDenialDrafts] = useState<Record<string, string>>({});

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await contentSubmissionsApi.getPending();
      setData(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load pending submissions'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleReview = async (
    type: 'news' | 'popup' | 'app',
    id: number,
    status: 'approved' | 'denied'
  ) => {
    const key = `${type}-${id}`;
    setReviewingId(key);
    setError(null);
    setSuccess(null);
    try {
      const denial_reason = denialDrafts[key]?.trim() || undefined;
      if (type === 'news') {
        await contentSubmissionsApi.reviewNewsStory(id, { status, denial_reason });
      } else if (type === 'popup') {
        await contentSubmissionsApi.reviewNewsPopup(id, { status, denial_reason });
      } else {
        await contentSubmissionsApi.reviewCodeApp(id, { status, denial_reason });
      }
      setSuccess(status === 'approved' ? 'Submission approved.' : 'Submission denied.');
      setDenialDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      await fetchPending();
      onUpdate?.();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to review submission'
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleApproveAll = async (type: 'news' | 'apps', count: number) => {
    const label = type === 'news' ? 'Town News stor' : 'Code Board app';
    const plural = count !== 1 ? (type === 'news' ? 'ies' : 's') : (type === 'news' ? 'y' : '');
    if (!window.confirm(`Approve all ${count} pending ${label}${plural}?`)) {
      return;
    }
    setBulkApproving(type);
    setError(null);
    setSuccess(null);
    try {
      const res =
        type === 'news'
          ? await contentSubmissionsApi.approveAllNewsStories()
          : await contentSubmissionsApi.approveAllCodeApps();
      const { message, failed } = res.data;
      if (failed.length > 0) {
        setError(`${message}. ${failed.length} submission${failed.length !== 1 ? 's' : ''} could not be approved.`);
      } else {
        setSuccess(message);
      }
      await fetchPending();
      onUpdate?.();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          `Failed to approve all ${type === 'news' ? 'news stories' : 'code board apps'}`
      );
    } finally {
      setBulkApproving(null);
    }
  };

  const renderNewsCard = (story: PendingNewsStorySubmission) => {
    const key = `news-${story.id}`;
    const busy = reviewingId === key;
    return (
      <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Newspaper className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-medium text-gray-500">Town News · {story.town_class}</span>
              <StatusBadge status={story.status} />
            </div>
            <p className="text-sm text-gray-500">
              By {story.submitter_name} ({story.submitter_username}) · {new Date(story.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <TownNewsStoryCard
          headline={story.headline}
          body={story.body}
          image_data={story.image_data}
          widgets={story.widgets}
          compact
        />
        <p className="text-xs text-gray-500">
          Approving pays the journalist {data?.story_xp_reward ?? 20} XP and R
          {(data?.story_earnings_reward ?? 5000).toLocaleString()} from town treasury.
        </p>
        <textarea
          value={denialDrafts[key] ?? ''}
          onChange={(e) => setDenialDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder="Optional note if denying..."
          className="input-field w-full text-sm"
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReview('news', story.id, 'approved')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve & publish
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReview('news', story.id, 'denied')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Deny
          </button>
        </div>
      </div>
    );
  };

  const renderPopupCard = (popup: PendingNewsPopupSubmission) => {
    const key = `popup-${popup.id}`;
    const busy = reviewingId === key;
    const adCost = data?.popup_ad_cost ?? 1000;
    return (
      <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">📢</span>
              <span className="text-xs font-medium text-gray-500">Login Pop-up · {popup.town_class}</span>
              <StatusBadge status={popup.status} />
            </div>
            <p className="text-sm text-gray-500">
              By {popup.submitter_name} ({popup.submitter_username}) · {new Date(popup.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2">
            <p className="text-xs font-bold uppercase text-amber-100">Sponsored</p>
            <h3 className="text-lg font-bold text-white">{popup.headline}</h3>
          </div>
          <div className="p-4 space-y-3 bg-amber-50">
            {popup.image_data && (
              <img
                src={popup.image_data}
                alt=""
                className="max-h-40 rounded-lg border border-gray-200 object-cover"
              />
            )}
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{popup.body}</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Approving charges the student R{adCost.toLocaleString()} from their bank account (deposited to town treasury).
        </p>
        <textarea
          value={denialDrafts[key] ?? ''}
          onChange={(e) => setDenialDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder="Optional note if denying..."
          className="input-field w-full text-sm"
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReview('popup', popup.id, 'approved')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve & publish
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReview('popup', popup.id, 'denied')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Deny
          </button>
        </div>
      </div>
    );
  };

  const renderAppCard = (app: PendingCodeAppSubmission) => {
    const key = `app-${app.id}`;
    const busy = reviewingId === key;
    return (
      <div key={key} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-lg">💻</span>
              <span className="text-xs font-medium text-gray-500">Code Board · {app.town_class}</span>
              <StatusBadge status={app.status} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-1">{app.title}</h3>
            <p className="text-sm text-gray-500">
              By {app.submitter_name} ({app.submitter_username}) · {new Date(app.created_at).toLocaleString()}
            </p>
          </div>
        </div>
        <a
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline break-all"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          {app.url}
        </a>
        <textarea
          value={denialDrafts[key] ?? ''}
          onChange={(e) => setDenialDrafts((prev) => ({ ...prev, [key]: e.target.value }))}
          placeholder="Optional note if denying..."
          className="input-field w-full text-sm"
          rows={2}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReview('app', app.id, 'approved')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            Approve & publish
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleReview('app', app.id, 'denied')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            Deny
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const pendingNews = data?.news_stories ?? [];
  const pendingPopups = data?.news_popups ?? [];
  const pendingApps = data?.code_apps ?? [];
  const empty = pendingNews.length === 0 && pendingPopups.length === 0 && pendingApps.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Content approvals</h2>
        <p className="text-sm text-gray-600 mt-1">
          Review Town News stories, login pop-up ads, and Code Board apps before they go live for students.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
      )}
      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>
      )}

      {empty ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 text-center text-gray-500">
          No pending news stories, login pop-ups, or code board apps.
        </div>
      ) : (
        <>
          {pendingNews.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Town News ({pendingNews.length})</h3>
                <button
                  type="button"
                  disabled={bulkApproving !== null || reviewingId !== null}
                  onClick={() => handleApproveAll('news', pendingNews.length)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {bulkApproving === 'news' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Approve All ({pendingNews.length})
                </button>
              </div>
              {pendingNews.map(renderNewsCard)}
            </section>
          )}
          {pendingPopups.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Login Pop-ups ({pendingPopups.length})</h3>
              {pendingPopups.map(renderPopupCard)}
            </section>
          )}
          {pendingApps.length > 0 && (
            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-gray-900">Code Board ({pendingApps.length})</h3>
                <button
                  type="button"
                  disabled={bulkApproving !== null || reviewingId !== null}
                  onClick={() => handleApproveAll('apps', pendingApps.length)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {bulkApproving === 'apps' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  Approve All ({pendingApps.length})
                </button>
              </div>
              {pendingApps.map(renderAppCard)}
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default TeacherContentApprovals;
