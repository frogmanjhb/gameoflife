import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { AlertCircle, CheckCircle, Loader2, Send, XCircle } from 'lucide-react';

type SuggestionStatus = 'pending' | 'approved' | 'denied';
type BugStatus = 'pending' | 'verified' | 'denied';

interface Suggestion {
  id: number;
  user_id: number;
  content: string;
  status: SuggestionStatus;
  reviewed_by?: number | null;
  reviewed_by_username?: string | null;
  reviewed_at?: string | null;
  reward_paid?: boolean;
  reward_paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface BugReport {
  id: number;
  user_id: number;
  title: string;
  description: string;
  status: BugStatus;
  reviewed_by?: number | null;
  reviewed_by_username?: string | null;
  reviewed_at?: string | null;
  reward_paid?: boolean;
  reward_paid_at?: string | null;
  created_at: string;
  updated_at: string;
}

type TeacherQueueSuggestion = Suggestion & { username: string; first_name?: string; last_name?: string; class?: string };
type TeacherQueueBug = BugReport & { username: string; first_name?: string; last_name?: string; class?: string };

const formatDate = (dateString?: string | null) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg = useMemo(() => {
    switch (status) {
      case 'approved':
      case 'verified':
        return { icon: CheckCircle, className: 'bg-green-100 text-green-700 border-green-200', label: status === 'verified' ? 'approved' : status };
      case 'denied':
        return { icon: XCircle, className: 'bg-red-100 text-red-700 border-red-200', label: status };
      default:
        return { icon: AlertCircle, className: 'bg-yellow-100 text-yellow-700 border-yellow-200', label: 'pending' };
    }
  }, [status]);

  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${cfg.className}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="capitalize">{cfg.label}</span>
    </span>
  );
};

const SuggestionsBugsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();

  const [tab, setTab] = useState<'my' | 'submit' | 'review'>('my');
  const [teacherReviewTab, setTeacherReviewTab] = useState<'pending' | 'approved' | 'denied'>('pending');

  // Student state
  const [myLoading, setMyLoading] = useState(false);
  const [myError, setMyError] = useState<string | null>(null);
  const [mySuggestions, setMySuggestions] = useState<Suggestion[]>([]);
  const [myBugReports, setMyBugReports] = useState<BugReport[]>([]);

  // Teacher queue state
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState<string | null>(null);
  const [queueSuggestions, setQueueSuggestions] = useState<TeacherQueueSuggestion[]>([]);
  const [queueBugReports, setQueueBugReports] = useState<TeacherQueueBug[]>([]);
  const [allSuggestions, setAllSuggestions] = useState<TeacherQueueSuggestion[]>([]);
  const [allBugReports, setAllBugReports] = useState<TeacherQueueBug[]>([]);

  // Submit forms
  const [submitTab, setSubmitTab] = useState<'suggestion' | 'bug'>('bug');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const [suggestionText, setSuggestionText] = useState('');
  const [bugTitle, setBugTitle] = useState('');
  const [bugDescription, setBugDescription] = useState('');

  const isTeacher = user?.role === 'teacher';
  const plugin = plugins.find(p => p.route_path === '/suggestions-bugs');

  useEffect(() => {
    if (!pluginsLoading && plugin?.enabled) {
      // default tab by role
      setTab(isTeacher ? 'review' : 'my');
      if (isTeacher) setTeacherReviewTab('pending');
    }
  }, [pluginsLoading, plugin?.enabled, isTeacher]);

  const fetchMy = async () => {
    try {
      setMyLoading(true);
      setMyError(null);
      const res = await api.get('/suggestions-bugs/my');
      setMySuggestions(res.data.suggestions || []);
      setMyBugReports(res.data.bugReports || []);
    } catch (e: any) {
      setMyError(e.response?.data?.error || 'Failed to load your submissions');
    } finally {
      setMyLoading(false);
    }
  };

  const fetchQueue = async () => {
    try {
      setQueueLoading(true);
      setQueueError(null);
      const res = await api.get('/suggestions-bugs/admin/queue');
      setQueueSuggestions(res.data.suggestions || []);
      setQueueBugReports(res.data.bugReports || []);
    } catch (e: any) {
      setQueueError(e.response?.data?.error || 'Failed to load review queue');
    } finally {
      setQueueLoading(false);
    }
  };

  const fetchAllForTeacher = async () => {
    try {
      setQueueLoading(true);
      setQueueError(null);
      const res = await api.get('/suggestions-bugs/admin/all');
      setAllSuggestions(res.data.suggestions || []);
      setAllBugReports(res.data.bugReports || []);
    } catch (e: any) {
      setQueueError(e.response?.data?.error || 'Failed to load suggestions & bugs');
    } finally {
      setQueueLoading(false);
    }
  };

  useEffect(() => {
    if (!plugin?.enabled) return;
    if (!user) return;
    if (user.role === 'student') {
      fetchMy();
    } else {
      fetchQueue();
      fetchAllForTeacher();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plugin?.enabled, user?.role]);

  const submitSuggestion = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      await api.post('/suggestions-bugs/suggestions', { content: suggestionText });
      setSuggestionText('');
      setSubmitSuccess('Suggestion submitted!');
      await fetchMy();
    } catch (e: any) {
      setSubmitError(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBug = async () => {
    try {
      setSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);
      await api.post('/suggestions-bugs/bugs', { title: bugTitle, description: bugDescription });
      setBugTitle('');
      setBugDescription('');
      setSubmitSuccess('Bug report submitted!');
      await fetchMy();
    } catch (e: any) {
      setSubmitError(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'Failed to submit bug report');
    } finally {
      setSubmitting(false);
    }
  };

  const reviewSuggestion = async (id: number, status: 'approved' | 'denied') => {
    try {
      await api.put(`/suggestions-bugs/admin/suggestions/${id}/review`, { status });
      await fetchQueue();
      await fetchAllForTeacher();
    } catch (e: any) {
      setQueueError(e.response?.data?.error || 'Failed to update suggestion');
    }
  };

  const reviewBug = async (id: number, status: 'verified' | 'denied') => {
    try {
      await api.put(`/suggestions-bugs/admin/bugs/${id}/review`, { status });
      await fetchQueue();
      await fetchAllForTeacher();
    } catch (e: any) {
      setQueueError(e.response?.data?.error || 'Failed to update bug report');
    }
  };

  const approvedSuggestions = useMemo(
    () => allSuggestions.filter(s => s.status === 'approved'),
    [allSuggestions]
  );
  const deniedSuggestions = useMemo(
    () => allSuggestions.filter(s => s.status === 'denied'),
    [allSuggestions]
  );

  const approvedBugReports = useMemo(
    () => allBugReports.filter(b => b.status === 'verified'),
    [allBugReports]
  );
  const deniedBugReports = useMemo(
    () => allBugReports.filter(b => b.status === 'denied'),
    [allBugReports]
  );

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!plugin || !plugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="text-4xl">💡🐛</div>
          <div>
            <h1 className="text-2xl font-bold">Suggestions &amp; Bugs</h1>
            <p className="text-primary-100">
              Submit ideas and report legit bugs. If approved, you earn <span className="font-semibold">R1000</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200 px-6">
          <nav className="flex gap-6">
            {!isTeacher && (
              <>
                <button
                  onClick={() => setTab('my')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${tab === 'my' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  My submissions
                </button>
                <button
                  onClick={() => setTab('submit')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${tab === 'submit' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Submit
                </button>
              </>
            )}
            {isTeacher && (
              <button
                onClick={() => setTab('review')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${tab === 'review' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Review queue
              </button>
            )}
          </nav>
        </div>

        <div className="p-6">
          {/* Student: My submissions */}
          {!isTeacher && tab === 'my' && (
            <div className="space-y-6">
              {myError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{myError}</div>}
              {myLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-3" />
                  <p className="text-gray-600">Loading your submissions...</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Suggestions</h3>
                      <span className="text-xs text-gray-500">{mySuggestions.length}</span>
                    </div>
                    {mySuggestions.length === 0 ? (
                      <p className="text-sm text-gray-600">No suggestions yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {mySuggestions.slice(0, 10).map(s => (
                          <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <StatusPill status={s.status} />
                              <span className="text-xs text-gray-500">{formatDate(s.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{s.content}</p>
                            {(s.status === 'approved' || s.status === 'denied') && (
                              <p className="text-xs text-gray-500 mt-2">
                                Reviewed {s.reviewed_at ? `on ${formatDate(s.reviewed_at)}` : ''}{s.reviewed_by_username ? ` by ${s.reviewed_by_username}` : ''}{s.reward_paid ? ' • Reward paid ✅' : s.status === 'approved' ? ' • Reward pending' : ''}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">Bug reports</h3>
                      <span className="text-xs text-gray-500">{myBugReports.length}</span>
                    </div>
                    {myBugReports.length === 0 ? (
                      <p className="text-sm text-gray-600">No bug reports yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {myBugReports.slice(0, 10).map(b => (
                          <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3">
                            <div className="flex items-center justify-between gap-3">
                              <StatusPill status={b.status} />
                              <span className="text-xs text-gray-500">{formatDate(b.created_at)}</span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mt-2">{b.title}</p>
                            <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{b.description}</p>
                            {(b.status === 'verified' || b.status === 'denied') && (
                              <p className="text-xs text-gray-500 mt-2">
                                Reviewed {b.reviewed_at ? `on ${formatDate(b.reviewed_at)}` : ''}{b.reviewed_by_username ? ` by ${b.reviewed_by_username}` : ''}{b.reward_paid ? ' • Reward paid ✅' : b.status === 'verified' ? ' • Reward pending' : ''}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Student: Submit */}
          {!isTeacher && tab === 'submit' && (
            <div className="space-y-4">
              {submitError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{submitError}</div>}
              {submitSuccess && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">{submitSuccess}</div>}

              <div className="flex gap-3">
                <button
                  onClick={() => setSubmitTab('bug')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${submitTab === 'bug' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Report a bug
                </button>
                <button
                  onClick={() => setSubmitTab('suggestion')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border ${submitTab === 'suggestion' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Make a suggestion
                </button>
              </div>

              {submitTab === 'bug' ? (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bug title</label>
                    <input
                      value={bugTitle}
                      onChange={(e) => setBugTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Short summary of the bug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What happened?</label>
                    <textarea
                      value={bugDescription}
                      onChange={(e) => setBugDescription(e.target.value)}
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="Steps to reproduce, what you expected, what you saw..."
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={submitBug}
                      disabled={submitting || bugTitle.trim().length < 3 || bugDescription.trim().length < 10}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit bug
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Suggestion</label>
                    <textarea
                      value={suggestionText}
                      onChange={(e) => setSuggestionText(e.target.value)}
                      className="w-full h-40 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      placeholder="What would make the app better?"
                    />
                    <p className="text-xs text-gray-500 mt-2">If approved, you earn R1000.</p>
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={submitSuggestion}
                      disabled={submitting || suggestionText.trim().length < 5}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Submit suggestion
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Teacher: Review queue */}
          {isTeacher && tab === 'review' && (
            <div className="space-y-6">
              {queueError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{queueError}</div>}
              {queueLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary-600 mx-auto mb-3" />
                  <p className="text-gray-600">Loading review queue...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setTeacherReviewTab('pending')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        teacherReviewTab === 'pending'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Pending ({queueSuggestions.length + queueBugReports.length})
                    </button>
                    <button
                      onClick={() => setTeacherReviewTab('approved')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        teacherReviewTab === 'approved'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Approved ({approvedSuggestions.length + approvedBugReports.length})
                    </button>
                    <button
                      onClick={() => setTeacherReviewTab('denied')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        teacherReviewTab === 'denied'
                          ? 'bg-primary-600 text-white border-primary-600'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Denied ({deniedSuggestions.length + deniedBugReports.length})
                    </button>
                  </div>

                  {teacherReviewTab === 'pending' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Pending suggestions</h3>
                          <span className="text-xs text-gray-500">{queueSuggestions.length}</span>
                        </div>
                        {queueSuggestions.length === 0 ? (
                          <p className="text-sm text-gray-600">Nothing to review.</p>
                        ) : (
                          <div className="space-y-3">
                            {queueSuggestions.map(s => (
                              <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">{s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username}</span>
                                    {s.class ? <span className="ml-2 text-gray-500">({s.class})</span> : null}
                                  </div>
                                  <span className="text-xs text-gray-500">{formatDate(s.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{s.content}</p>
                                <div className="flex justify-end gap-2 mt-3">
                                  <button
                                    onClick={() => reviewSuggestion(s.id, 'denied')}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    Deny ❌
                                  </button>
                                  <button
                                    onClick={() => reviewSuggestion(s.id, 'approved')}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Approve ✅ (+R1000)
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Pending bug reports</h3>
                          <span className="text-xs text-gray-500">{queueBugReports.length}</span>
                        </div>
                        {queueBugReports.length === 0 ? (
                          <p className="text-sm text-gray-600">Nothing to review.</p>
                        ) : (
                          <div className="space-y-3">
                            {queueBugReports.map(b => (
                              <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">{b.first_name && b.last_name ? `${b.first_name} ${b.last_name}` : b.username}</span>
                                    {b.class ? <span className="ml-2 text-gray-500">({b.class})</span> : null}
                                  </div>
                                  <span className="text-xs text-gray-500">{formatDate(b.created_at)}</span>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mt-2">{b.title}</p>
                                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{b.description}</p>
                                <div className="flex justify-end gap-2 mt-3">
                                  <button
                                    onClick={() => reviewBug(b.id, 'denied')}
                                    className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50"
                                  >
                                    Deny ❌
                                  </button>
                                  <button
                                    onClick={() => reviewBug(b.id, 'verified')}
                                    className="px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700"
                                  >
                                    Approve ✅ (+R1000)
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {teacherReviewTab === 'approved' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Approved suggestions</h3>
                          <span className="text-xs text-gray-500">{approvedSuggestions.length}</span>
                        </div>
                        {approvedSuggestions.length === 0 ? (
                          <p className="text-sm text-gray-600">No approved suggestions yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {approvedSuggestions.map(s => (
                              <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">{s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username}</span>
                                    {s.class ? <span className="ml-2 text-gray-500">({s.class})</span> : null}
                                  </div>
                                  <StatusPill status={s.status} />
                                </div>
                                <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{s.content}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Reviewed {s.reviewed_at ? `on ${formatDate(s.reviewed_at)}` : ''}{s.reviewed_by_username ? ` by ${s.reviewed_by_username}` : ''}{s.reward_paid ? ' • Reward paid ✅' : ' • Reward pending'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Approved bug reports</h3>
                          <span className="text-xs text-gray-500">{approvedBugReports.length}</span>
                        </div>
                        {approvedBugReports.length === 0 ? (
                          <p className="text-sm text-gray-600">No approved bug reports yet.</p>
                        ) : (
                          <div className="space-y-3">
                            {approvedBugReports.map(b => (
                              <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">{b.first_name && b.last_name ? `${b.first_name} ${b.last_name}` : b.username}</span>
                                    {b.class ? <span className="ml-2 text-gray-500">({b.class})</span> : null}
                                  </div>
                                  <StatusPill status={b.status} />
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mt-2">{b.title}</p>
                                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{b.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Reviewed {b.reviewed_at ? `on ${formatDate(b.reviewed_at)}` : ''}{b.reviewed_by_username ? ` by ${b.reviewed_by_username}` : ''}{b.reward_paid ? ' • Reward paid ✅' : ' • Reward pending'}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {teacherReviewTab === 'denied' && (
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Denied suggestions</h3>
                          <span className="text-xs text-gray-500">{deniedSuggestions.length}</span>
                        </div>
                        {deniedSuggestions.length === 0 ? (
                          <p className="text-sm text-gray-600">No denied suggestions.</p>
                        ) : (
                          <div className="space-y-3">
                            {deniedSuggestions.map(s => (
                              <div key={s.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">{s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username}</span>
                                    {s.class ? <span className="ml-2 text-gray-500">({s.class})</span> : null}
                                  </div>
                                  <StatusPill status={s.status} />
                                </div>
                                <p className="text-sm text-gray-800 mt-2 whitespace-pre-wrap">{s.content}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Reviewed {s.reviewed_at ? `on ${formatDate(s.reviewed_at)}` : ''}{s.reviewed_by_username ? ` by ${s.reviewed_by_username}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-gray-900">Denied bug reports</h3>
                          <span className="text-xs text-gray-500">{deniedBugReports.length}</span>
                        </div>
                        {deniedBugReports.length === 0 ? (
                          <p className="text-sm text-gray-600">No denied bug reports.</p>
                        ) : (
                          <div className="space-y-3">
                            {deniedBugReports.map(b => (
                              <div key={b.id} className="bg-white rounded-lg border border-gray-200 p-3">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-xs text-gray-600">
                                    <span className="font-medium">{b.first_name && b.last_name ? `${b.first_name} ${b.last_name}` : b.username}</span>
                                    {b.class ? <span className="ml-2 text-gray-500">({b.class})</span> : null}
                                  </div>
                                  <StatusPill status={b.status} />
                                </div>
                                <p className="text-sm font-semibold text-gray-900 mt-2">{b.title}</p>
                                <p className="text-sm text-gray-800 mt-1 whitespace-pre-wrap">{b.description}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                  Reviewed {b.reviewed_at ? `on ${formatDate(b.reviewed_at)}` : ''}{b.reviewed_by_username ? ` by ${b.reviewed_by_username}` : ''}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuggestionsBugsPlugin;

