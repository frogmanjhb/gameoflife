import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileText, Loader2 } from 'lucide-react';
import { attendanceApi } from '../services/api';
import { AttendanceMySickNote } from '../types';

const POLL_MS = 4000;

const SickNoteModal: React.FC = () => {
  const [data, setData] = useState<AttendanceMySickNote | null>(null);
  const [explanation, setExplanation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedNoteId, setDismissedNoteId] = useState<number | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await attendanceApi.getMySickNote();
      setData(res.data);
      if (!res.data.required) setDismissedNoteId(null);
    } catch {
      setData({ required: false });
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = window.setInterval(fetchStatus, POLL_MS);
    return () => window.clearInterval(id);
  }, [fetchStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.sick_note) return;
    setSubmitting(true);
    setError(null);
    try {
      await attendanceApi.submitSickNote(data.sick_note.id, explanation.trim());
      setData({ required: false });
      setExplanation('');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Could not submit sick note'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!data?.required || !data.sick_note || dismissedNoteId === data.sick_note.id) return null;

  const registerDate = new Date(data.sick_note.register_date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const modal = (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
        role="dialog"
        aria-labelledby="sick-note-title"
        aria-modal="true"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-amber-100 p-2 rounded-lg">
            <FileText className="h-6 w-6 text-amber-700" />
          </div>
          <div>
            <h2 id="sick-note-title" className="text-lg font-bold text-gray-900">
              Sick Note Required
            </h2>
            <p className="text-sm text-gray-600">You were marked absent on {registerDate}</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          Submit a brief explanation for your absence. It will be sent to your town{' '}
          <span className="font-semibold">{data.sick_note.reviewer_label}</span> for approval.
          If you do not submit a sick note, your next salary payment may be reduced.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="sick-note-explanation" className="block text-sm font-medium text-gray-700 mb-1">
            Explanation
          </label>
          <textarea
            id="sick-note-explanation"
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={4}
            required
            minLength={3}
            maxLength={2000}
            placeholder="Why were you absent from school?"
            className="input-field w-full mb-4 resize-y min-h-[100px]"
          />

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="submit"
              disabled={submitting || explanation.trim().length < 3}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : (
                'Submit Sick Note'
              )}
            </button>
            <button
              type="button"
              onClick={() => setDismissedNoteId(data.sick_note!.id)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg border border-gray-200"
            >
              Remind me later
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

export default SickNoteModal;
