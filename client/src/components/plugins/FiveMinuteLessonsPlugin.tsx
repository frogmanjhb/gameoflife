import React, { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { fiveMinuteLessonsApi } from '../../services/api';
import { FiveMinuteLessonItem, FiveMinuteLessonsStatus } from '../../types';
import { CheckCircle, Loader2, ToggleLeft, ToggleRight, Vote } from 'lucide-react';

const TOWN_CLASSES = ['6A', '6B', '6C'] as const;

const FiveMinuteLessonsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const plugin = plugins.find((p) => p.route_path === '/five-minute-lessons');
  const isTeacher = user?.role === 'teacher';

  const [status, setStatus] = useState<FiveMinuteLessonsStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [teacherClass, setTeacherClass] = useState<string>('6A');
  const [votingId, setVotingId] = useState<number | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setError('');
      const res = isTeacher
        ? await fiveMinuteLessonsApi.getStatus({ class: teacherClass })
        : await fiveMinuteLessonsApi.getStatus();
      setStatus(res.data);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to load 5 Minute Lessons board'
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

  const handleVote = async (lessonId: number) => {
    try {
      setVotingId(lessonId);
      setError('');
      await fiveMinuteLessonsApi.vote(lessonId);
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

  const handleApprove = async (lessonId: number) => {
    try {
      setReviewingId(lessonId);
      setError('');
      const res = await fiveMinuteLessonsApi.approve(lessonId, teacherClass);
      setSuccess(
        `Lesson approved. Student earned ${res.data.experience_points} XP and R${res.data.earnings.toLocaleString()}.`
      );
      await fetchStatus();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to approve lesson'
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleDeny = async (lessonId: number) => {
    const reason = window.prompt('Optional reason for denial (shown to you only in records):') ?? '';
    try {
      setReviewingId(lessonId);
      setError('');
      await fiveMinuteLessonsApi.deny(lessonId, teacherClass, reason || undefined);
      setSuccess('Lesson denied.');
      await fetchStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to deny lesson'
      );
    } finally {
      setReviewingId(null);
    }
  };

  const handleStudentBoardToggle = async () => {
    if (!status) return;
    try {
      setSavingSettings(true);
      setError('');
      await fiveMinuteLessonsApi.updateSettings({ board_visible: !status.student_board_visible });
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
      await fiveMinuteLessonsApi.updateSettings({
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

  const handleClose = async (lessonId: number) => {
    try {
      setError('');
      await fiveMinuteLessonsApi.closeLesson(lessonId, teacherClass);
      setSuccess('Lesson closed.');
      await fetchStatus();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to close lesson'
      );
    }
  };

  const handleDelete = async (lessonId: number) => {
    if (!window.confirm('Remove this lesson from the board?')) return;
    try {
      setError('');
      await fiveMinuteLessonsApi.deleteLesson(lessonId, teacherClass);
      await fetchStatus();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
          'Failed to delete lesson'
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

  const openLessons = (status?.lessons || []).filter((l) => l.status === 'open');
  const pendingLessons = status?.pending_lessons || [];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📚</div>
          <div>
            <h1 className="text-2xl font-bold">5 Minute Lessons</h1>
            <p className="text-indigo-100">
              Vote on short teaching activities led by your Teacher or Principal students
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
                  ? 'bg-indigo-600 text-white'
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
            {isTeacher ? 'Class lessons board' : 'Your lessons board'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {isTeacher
              ? status?.teacher_board_enabled
                ? 'Students can vote on approved lessons when the plugin is enabled.'
                : 'Board hidden for students in this town.'
              : status?.student_board_visible
                ? status?.board_active
                  ? 'You can vote on approved lessons below.'
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
            <ToggleRight className="h-8 w-8 text-indigo-600" />
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
          <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {isTeacher && pendingLessons.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-900">
                Pending approval ({pendingLessons.length})
              </h2>
              {pendingLessons.map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isTeacher={isTeacher}
                  votingId={votingId}
                  reviewingId={reviewingId}
                  boardActive={!!status?.board_active}
                  onVote={handleVote}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onClose={handleClose}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          {!isTeacher && !status?.board_active ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Vote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Lessons board is off</h2>
              <p className="text-gray-600">Enable your board above, or ask your teacher to turn the class board on.</p>
            </div>
          ) : (isTeacher ? (status?.lessons || []).filter((l) => l.status !== 'pending') : openLessons).length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
              <Vote className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {isTeacher ? 'No approved lessons yet' : 'No lessons to vote on'}
              </h2>
              <p className="text-gray-600">
                {isTeacher
                  ? 'Approve lesson submissions from Teacher or Principal students.'
                  : 'Approved lessons from your class will appear here.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {isTeacher ? 'Lessons' : 'Vote on lessons'}
              </h2>
              {(isTeacher
                ? (status?.lessons || []).filter((l) => l.status !== 'pending')
                : openLessons
              ).map((lesson) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  isTeacher={isTeacher}
                  votingId={votingId}
                  reviewingId={reviewingId}
                  boardActive={!!status?.board_active}
                  onVote={handleVote}
                  onApprove={handleApprove}
                  onDeny={handleDeny}
                  onClose={handleClose}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const LessonCard: React.FC<{
  lesson: FiveMinuteLessonItem;
  isTeacher: boolean;
  votingId: number | null;
  reviewingId: number | null;
  boardActive: boolean;
  onVote: (id: number) => void;
  onApprove: (id: number) => void;
  onDeny: (id: number) => void;
  onClose: (id: number) => void;
  onDelete: (id: number) => void;
}> = ({
  lesson,
  isTeacher,
  votingId,
  reviewingId,
  boardActive,
  onVote,
  onApprove,
  onDeny,
  onClose,
  onDelete,
}) => (
  <div
    className={`bg-white rounded-xl shadow-sm border p-5 ${
      lesson.status === 'open' && !lesson.has_voted && !isTeacher
        ? 'border-indigo-300 vote-attention'
        : 'border-gray-200'
    }`}
  >
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            {lesson.timing_label}
          </span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              lesson.status === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : lesson.status === 'open'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-200 text-gray-600'
            }`}
          >
            {lesson.status_label}
          </span>
        </div>
        <p className="text-sm text-indigo-800 font-medium mb-1">
          Class content: {lesson.class_content}
        </p>
        {lesson.description && <p className="text-sm text-gray-600 mb-2">{lesson.description}</p>}
        <p className="text-xs text-gray-500">
          Submitted by {lesson.suggester_name || lesson.suggester_username}
          {lesson.status !== 'pending' && (
            <>
              {' '}
              · {lesson.vote_count} vote{lesson.vote_count === 1 ? '' : 's'}
            </>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isTeacher && lesson.status === 'pending' && (
          <>
            <button
              type="button"
              disabled={reviewingId === lesson.id}
              onClick={() => onApprove(lesson.id)}
              className="btn-primary bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-sm"
            >
              {reviewingId === lesson.id ? '…' : 'Approve'}
            </button>
            <button
              type="button"
              disabled={reviewingId === lesson.id}
              onClick={() => onDeny(lesson.id)}
              className="btn-secondary text-sm"
            >
              Deny
            </button>
          </>
        )}
        {!isTeacher && lesson.status === 'open' && boardActive && (
          lesson.has_voted ? (
            <span className="inline-flex items-center gap-1 text-sm text-green-700 font-medium">
              <CheckCircle className="h-4 w-4" /> Voted
            </span>
          ) : (
            <button
              type="button"
              disabled={votingId === lesson.id}
              onClick={() => onVote(lesson.id)}
              className="btn-primary bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {votingId === lesson.id ? 'Voting…' : 'Vote'}
            </button>
          )
        )}
        {isTeacher && lesson.status === 'open' && (
          <button type="button" onClick={() => onClose(lesson.id)} className="btn-secondary text-sm">
            Close voting
          </button>
        )}
        {isTeacher && (
          <button
            type="button"
            onClick={() => onDelete(lesson.id)}
            className="text-sm text-red-600 hover:text-red-800 font-medium"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  </div>
);

export default FiveMinuteLessonsPlugin;
