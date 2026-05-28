import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { classEventsApi } from '../../services/api';
import { ClassEventItem, ClassEventTiming, ClassEventVotingStatus } from '../../types';
import { CheckCircle, Loader2, ToggleLeft, ToggleRight, Vote } from 'lucide-react';

const TOWN_CLASSES = ['6A', '6B', '6C'] as const;

const EventVotingPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const plugin = plugins.find((p) => p.route_path === '/event-voting');
  const isTeacher = user?.role === 'teacher';

  const [status, setStatus] = useState<ClassEventVotingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherClass, setTeacherClass] = useState<string>('6A');
  const [votingId, setVotingId] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError('');
      const res = isTeacher
        ? await classEventsApi.getStatus({ class: teacherClass })
        : await classEventsApi.getStatus();
      setStatus(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load event voting board'
      );
    } finally {
      setLoading(false);
    }
  }, [isTeacher, teacherClass]);

  useEffect(() => {
    if (!plugin?.enabled) return;
    setLoading(true);
    fetchStatus();
    const interval = setInterval(fetchStatus, 8000);
    return () => clearInterval(interval);
  }, [plugin?.enabled, fetchStatus]);

  const handleVote = async (eventId: number) => {
    try {
      setVotingId(eventId);
      setError('');
      await classEventsApi.vote(eventId);
      setSuccess('Your vote was recorded!');
      await fetchStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to vote'
      );
    } finally {
      setVotingId(null);
    }
  };

  const handleStudentBoardToggle = async () => {
    if (!status) return;
    try {
      setSavingSettings(true);
      setError('');
      await classEventsApi.updateSettings({ board_visible: !status.student_board_visible });
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to update settings'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleTeacherBoardToggle = async () => {
    if (!status) return;
    try {
      setSavingSettings(true);
      setError('');
      await classEventsApi.updateSettings({
        teacher_board_enabled: !status.teacher_board_enabled,
        town_class: teacherClass,
      });
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to update settings'
      );
    } finally {
      setSavingSettings(false);
    }
  };

  const handleClose = async (eventId: number) => {
    try {
      setError('');
      await classEventsApi.closeEvent(eventId, teacherClass);
      setSuccess('Event closed.');
      await fetchStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to close event'
      );
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!window.confirm('Remove this event from the board?')) return;
    try {
      setError('');
      await classEventsApi.deleteEvent(eventId, teacherClass);
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to delete event'
      );
    }
  };

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!plugin || !plugin.enabled) {
    return <Navigate to="/" replace />;
  }

  const openEvents = (status?.events || []).filter((e) => e.status === 'open');

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🗳️</div>
          <div>
            <h1 className="text-2xl font-bold">Event Voting Board</h1>
            <p className="text-red-100">
              Vote on fun 5-minute class events suggested by your Event Planner
            </p>
          </div>
        </div>
      </div>

      {isTeacher && (
        <div className="flex flex-wrap gap-2">
          {TOWN_CLASSES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => {
                setTeacherClass(c);
                setLoading(true);
              }}
              className={`px-4 py-2 rounded-lg font-medium ${
                teacherClass === c
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Town {c}
            </button>
          ))}
        </div>
      )}

      <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900">
            {isTeacher ? 'Class voting board' : 'Your voting board'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isTeacher
              ? status?.teacher_board_enabled
                ? 'Students in this town can vote when the plugin is enabled.'
                : 'Board hidden for students in this town.'
              : status?.student_board_visible
                ? status?.board_active
                  ? 'You can vote on open events below.'
                  : 'Your teacher has paused the board.'
                : 'Board hidden on your dashboard — turn it on to vote.'}
          </p>
        </div>
        <button
          type="button"
          disabled={savingSettings || loading}
          onClick={isTeacher ? handleTeacherBoardToggle : handleStudentBoardToggle}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 disabled:opacity-50"
        >
          {(isTeacher ? status?.teacher_board_enabled : status?.student_board_visible) ? (
            <ToggleRight className="h-8 w-8 text-red-600" />
          ) : (
            <ToggleLeft className="h-8 w-8 text-gray-400" />
          )}
          <span>
            {(isTeacher ? status?.teacher_board_enabled : status?.student_board_visible)
              ? 'Enabled'
              : 'Disabled'}
          </span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">{success}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-10 w-10 animate-spin text-red-600" />
        </div>
      ) : !status?.board_active && !isTeacher ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Vote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Voting board is off</h2>
          <p className="text-gray-600">Enable your board above, or ask your teacher to turn the class board on.</p>
        </div>
      ) : openEvents.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Vote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No events to vote on</h2>
          <p className="text-gray-600">Your Event Planner has not suggested any open events yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(isTeacher ? status?.events || [] : openEvents).map((event) => (
            <EventCard
              key={event.id}
              event={event}
              isTeacher={isTeacher}
              votingId={votingId}
              onVote={handleVote}
              onClose={handleClose}
              onDelete={handleDelete}
              boardActive={!!status?.board_active}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const EventCard: React.FC<{
  event: ClassEventItem;
  isTeacher: boolean;
  votingId: number | null;
  boardActive: boolean;
  onVote: (id: number) => void;
  onClose: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({ event, isTeacher, votingId, boardActive, onVote, onClose, onDelete }) => (
  <div
    className={`bg-white rounded-xl shadow-sm border p-5 ${
      event.status === 'open' && !event.has_voted && !isTeacher
        ? 'border-red-300 vote-attention'
        : 'border-gray-200'
    }`}
  >
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {event.timing_label}
          </span>
          {event.status === 'closed' && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">Closed</span>
          )}
        </div>
        {event.description && <p className="text-sm text-gray-600 mb-2">{event.description}</p>}
        <p className="text-xs text-gray-500">
          Suggested by {event.suggester_name || event.suggester_username} · {event.vote_count} vote
          {event.vote_count === 1 ? '' : 's'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {!isTeacher && event.status === 'open' && boardActive && (
          event.has_voted ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
              <CheckCircle className="h-4 w-4" /> Voted
            </span>
          ) : (
            <button
              type="button"
              disabled={votingId === event.id}
              onClick={() => onVote(event.id)}
              className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {votingId === event.id ? 'Voting…' : 'Vote'}
            </button>
          )
        )}
        {isTeacher && (
          <>
            {event.status === 'open' && (
              <button type="button" onClick={() => onClose(event.id)} className="btn-secondary text-sm">
                Close voting
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(event.id)}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  </div>
);

export default EventVotingPlugin;
