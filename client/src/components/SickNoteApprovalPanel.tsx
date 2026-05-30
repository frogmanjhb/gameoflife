import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle, FileText, Loader2, XCircle } from 'lucide-react';
import { attendanceApi } from '../services/api';
import { SickNoteQueueStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface SickNoteApprovalPanelProps {
  jobName: string;
}

const SickNoteApprovalPanel: React.FC<SickNoteApprovalPanelProps> = ({ jobName }) => {
  const { refreshProfile } = useAuth();
  const name = jobName.toLowerCase().trim();
  const canReview =
    name.includes('hr director') || name.includes('financial manager') || name.includes('lawyer');

  const [queue, setQueue] = useState<SickNoteQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const fetchQueue = useCallback(async () => {
    if (!canReview) return;
    try {
      setLoading(true);
      const res = await attendanceApi.getSickNoteQueue();
      setQueue(res.data);
      setError(null);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not load sick note queue'
      );
    } finally {
      setLoading(false);
    }
  }, [canReview]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const handleReview = async (id: number, approved: boolean) => {
    setReviewingId(id);
    setError(null);
    setSuccess(null);
    try {
      const res = await attendanceApi.reviewSickNote(id, approved);
      const xpMsg =
        res.data.experience_points > 0
          ? ` +${res.data.experience_points} XP${
              res.data.new_level ? ` — level ${res.data.new_level}!` : ''
            }`
          : '';
      setSuccess(
        `${approved ? 'Approved' : 'Denied'} sick note for ${res.data.student_display_name}.${xpMsg}`
      );
      await fetchQueue();
      if (approved) await refreshProfile();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not review sick note'
      );
    } finally {
      setReviewingId(null);
    }
  };

  if (!canReview) return null;

  return (
    <div className="card mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-amber-100 p-2 rounded-lg">
          <FileText className="h-6 w-6 text-amber-700" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Sick Note Approvals</h3>
          <p className="text-sm text-gray-600 mt-1">
            Review absence explanations from students marked absent on the daily register.
            {queue ? ` Approving awards ${queue.approve_xp} XP.` : ''}
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading queue…
        </div>
      )}

      {!loading && queue && queue.pending.length === 0 && (
        <p className="text-sm text-gray-500">No sick notes awaiting your review.</p>
      )}

      {!loading && queue && queue.pending.length > 0 && (
        <ul className="space-y-3">
          {queue.pending.map((item) => (
            <li key={item.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900">{item.student_display_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Absent{' '}
                    {new Date(item.register_date).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                    · Submitted{' '}
                    {new Date(item.submitted_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{item.explanation}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReview(item.id, true)}
                    disabled={reviewingId === item.id}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg disabled:opacity-60"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReview(item.id, false)}
                    disabled={reviewingId === item.id}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-800 bg-red-100 hover:bg-red-200 rounded-lg disabled:opacity-60"
                  >
                    <XCircle className="h-4 w-4" />
                    Deny
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {success && (
        <p className="text-sm text-emerald-800 bg-emerald-100 rounded-lg px-3 py-2 mt-3">{success}</p>
      )}
      {error && (
        <p className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2 mt-3">{error}</p>
      )}
    </div>
  );
};

export default SickNoteApprovalPanel;
