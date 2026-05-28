import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Send } from 'lucide-react';
import { fiveMinuteLessonsApi } from '../services/api';
import { ClassEventTiming } from '../types';

const FiveMinuteLessonSuggestForm: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [classContent, setClassContent] = useState('');
  const [timing, setTiming] = useState<ClassEventTiming>('during_class');
  const [remaining, setRemaining] = useState<number | null>(null);
  const [perWeek, setPerWeek] = useState(2);
  const [xpReward, setXpReward] = useState(10);
  const [earningsReward, setEarningsReward] = useState(2000);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await fiveMinuteLessonsApi.getStatus();
      setRemaining(res.data.remaining_suggestions);
      setPerWeek(res.data.suggestions_per_week);
      setXpReward(res.data.suggestion_xp_reward);
      setEarningsReward(res.data.suggestion_earnings_reward);
    } catch {
      setRemaining(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');
      const res = await fiveMinuteLessonsApi.suggest({
        title: title.trim(),
        description: description.trim() || undefined,
        class_content: classContent.trim(),
        timing,
      });
      setSuccess(res.data.message);
      setTitle('');
      setDescription('');
      setClassContent('');
      setRemaining(res.data.remaining_suggestions);
      setTimeout(() => setSuccess(''), 6000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to submit lesson'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  const canSuggest = (remaining ?? 0) > 0;

  return (
    <div className="mt-4 pt-4 border-t border-indigo-200">
      <h4 className="font-semibold text-gray-900 mb-1">Suggest a 5-minute lesson</h4>
      <p className="text-sm text-gray-600 mb-3">
        Propose a short teaching activity linked to class content. Your teacher must approve it before
        classmates can vote. Once approved you earn {xpReward} XP and R{earningsReward.toLocaleString()} (
        {remaining ?? 0} of {perWeek} left this week).
      </p>
      {error && <p className="text-sm text-red-700 mb-2">{error}</p>}
      {success && <p className="text-sm text-green-700 mb-2">{success}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lesson title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            disabled={!canSuggest || submitting}
            className="input-field w-full"
            placeholder="e.g. Fractions quick drill"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class content focus</label>
          <textarea
            value={classContent}
            onChange={(e) => setClassContent(e.target.value)}
            maxLength={500}
            rows={2}
            required
            disabled={!canSuggest || submitting}
            className="input-field w-full"
            placeholder="Which topic or outcome does this lesson teach?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How you will teach it (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
            rows={2}
            disabled={!canSuggest || submitting}
            className="input-field w-full"
            placeholder="What will you do in 5 minutes?"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">When</label>
          <select
            value={timing}
            onChange={(e) => setTiming(e.target.value as ClassEventTiming)}
            disabled={!canSuggest || submitting}
            className="input-field w-full"
          >
            <option value="before_class">Before class</option>
            <option value="during_class">During class</option>
            <option value="after_class">After class</option>
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSuggest || submitting || !title.trim() || !classContent.trim()}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-semibold px-4 py-2 rounded-lg"
          >
            <Send className="h-4 w-4" />
            {submitting ? 'Submitting…' : 'Submit for approval'}
          </button>
          <Link to="/five-minute-lessons" className="text-sm text-indigo-700 hover:underline font-medium">
            Open lessons board →
          </Link>
        </div>
      </form>
    </div>
  );
};

export default FiveMinuteLessonSuggestForm;
