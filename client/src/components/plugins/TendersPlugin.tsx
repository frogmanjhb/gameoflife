import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ClipboardList, Loader2, CheckCircle, XCircle, Plus, Eye, Banknote } from 'lucide-react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTown } from '../../contexts/TownContext';
import { tendersApi } from '../../services/api';
import { Tender, TenderApplication, TenderApplicationStatus } from '../../types';

const TendersPlugin: React.FC = () => {
  const { plugins } = usePlugins();
  const { user } = useAuth();
  const { currentTownClass } = useTown();
  const tendersPlugin = plugins.find(p => p.route_path === '/tenders');

  if (!tendersPlugin || !tendersPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  const isTeacher = user?.role === 'teacher';

  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Create tender (teacher)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState<{ name: string; description: string; value: string }>({
    name: '',
    description: '',
    value: ''
  });

  // Applications modal (teacher)
  const [showApplicationsModal, setShowApplicationsModal] = useState(false);
  const [selectedTender, setSelectedTender] = useState<Tender | null>(null);
  const [applications, setApplications] = useState<TenderApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [decisionLoading, setDecisionLoading] = useState<number | null>(null);
  const [payLoading, setPayLoading] = useState<number | null>(null);

  // Student tender details/apply modal
  const [showTenderModal, setShowTenderModal] = useState(false);
  const [studentSelectedTender, setStudentSelectedTender] = useState<Tender | null>(null);
  const [applyLoading, setApplyLoading] = useState(false);

  const fetchTenders = async () => {
    try {
      setLoading(true);
      setError('');
      const townClass = isTeacher ? (currentTownClass || undefined) : undefined;
      const res = await tendersApi.getTenders(townClass);
      setTenders(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Teachers: refresh when they change town tab
    if (isTeacher && !currentTownClass) return;
    fetchTenders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTeacher, currentTownClass]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-emerald-100 text-emerald-800';
      case 'awarded':
        return 'bg-blue-100 text-blue-800';
      case 'closed':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const applicationBadge = (status?: TenderApplicationStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const openApplications = async (tender: Tender) => {
    setSelectedTender(tender);
    setShowApplicationsModal(true);
    setApplications([]);
    try {
      setApplicationsLoading(true);
      const res = await tendersApi.getTenderApplications(tender.id);
      setApplications(res.data.applications);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to load applications');
    } finally {
      setApplicationsLoading(false);
    }
  };

  const updateApplication = async (applicationId: number, status: 'approved' | 'denied') => {
    setDecisionLoading(applicationId);
    setError('');
    setSuccess('');
    try {
      await tendersApi.updateTenderApplicationStatus(applicationId, status);
      setSuccess(`Application ${status}`);
      if (selectedTender) {
        await openApplications(selectedTender);
      }
      await fetchTenders();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to update application');
    } finally {
      setDecisionLoading(null);
    }
  };

  const payTender = async (tender: Tender) => {
    setPayLoading(tender.id);
    setError('');
    setSuccess('');
    try {
      await tendersApi.payTender(tender.id);
      setSuccess('Tender paid from treasury');
      await fetchTenders();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to pay tender');
    } finally {
      setPayLoading(null);
    }
  };

  const canCreate = isTeacher && !!currentTownClass;

  const submitCreateTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTownClass) return;

    setCreateLoading(true);
    setError('');
    setSuccess('');
    try {
      await tendersApi.createTender({
        town_class: currentTownClass,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        value: Number(createForm.value || 0)
      });
      setSuccess('Tender created');
      setShowCreateModal(false);
      setCreateForm({ name: '', description: '', value: '' });
      await fetchTenders();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create tender');
    } finally {
      setCreateLoading(false);
    }
  };

  const openStudentTender = (tender: Tender) => {
    setStudentSelectedTender(tender);
    setShowTenderModal(true);
    setSuccess('');
    setError('');
  };

  const applyToTender = async () => {
    if (!studentSelectedTender) return;
    setApplyLoading(true);
    setError('');
    setSuccess('');
    try {
      await tendersApi.applyToTender(studentSelectedTender.id);
      setSuccess('Application submitted');
      setShowTenderModal(false);
      setStudentSelectedTender(null);
      await fetchTenders();
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to apply');
    } finally {
      setApplyLoading(false);
    }
  };

  const sortedTenders = useMemo(() => {
    return [...tenders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [tenders]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📑</div>
          <div>
            <h1 className="text-2xl font-bold">Tenders</h1>
            <p className="text-primary-100">
              {isTeacher
                ? `Manage building tenders for ${currentTownClass || 'your selected town'}`
                : 'Apply for building jobs that need to happen on the game board'}
            </p>
          </div>
        </div>
      </div>

      {(error || success) && (
        <div className="space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>{success}</span>
            </div>
          )}
        </div>
      )}

      {/* Teacher actions */}
      {isTeacher && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">Create a new tender</p>
            <p className="text-sm text-gray-500">
              {currentTownClass ? `This will be created for Class ${currentTownClass}.` : 'Select a town tab on the Teacher Dashboard first.'}
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={!canCreate}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create Tender</span>
          </button>
        </div>
      )}

      {/* Tender list */}
      {sortedTenders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <ClipboardList className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No tenders yet</h2>
          <p className="text-gray-600">
            {isTeacher ? 'Create the first tender for this town.' : 'Check back later for new building jobs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {sortedTenders.map((tender) => (
            <div key={tender.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{tender.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(tender.status)}`}>
                      {tender.status.toUpperCase()}
                    </span>
                    {!isTeacher && tender.my_application_status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${applicationBadge(tender.my_application_status)}`}>
                        {tender.my_application_status.toUpperCase()}
                      </span>
                    )}
                  </div>
                  {tender.description && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tender.description}</p>}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium text-gray-700">{formatCurrency(Number(tender.value || 0))}</span>
                    <span>•</span>
                    <span>Town: {tender.town_class}</span>
                    {isTeacher && (
                      <>
                        <span>•</span>
                        <span>{tender.pending_count ?? 0} pending</span>
                        <span>({tender.application_count ?? 0} total)</span>
                      </>
                    )}
                    {tender.status === 'awarded' && tender.awarded_to_username && (
                      <>
                        <span>•</span>
                        <span className="text-blue-700">Awarded to {tender.awarded_to_username}</span>
                      </>
                    )}
                    {tender.status === 'awarded' && (
                      <>
                        <span>•</span>
                        <span className={tender.paid ? 'text-emerald-700' : 'text-amber-700'}>
                          {tender.paid ? 'Paid' : 'Unpaid'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {isTeacher ? (
                    <div className="flex items-center gap-2">
                      {tender.status === 'awarded' && !tender.paid && (
                        <button
                          onClick={() => payTender(tender)}
                          disabled={payLoading === tender.id}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm flex items-center space-x-2 disabled:opacity-50"
                        >
                          {payLoading === tender.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
                          <span>Pay</span>
                        </button>
                      )}
                      <button
                        onClick={() => openApplications(tender)}
                        className={`relative px-3 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2 ${
                          (tender.pending_count ?? 0) > 0
                            ? 'bg-amber-100 hover:bg-amber-200 ring-2 ring-amber-400 animate-pulse'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                      >
                        <Eye className="h-4 w-4" />
                        <span>Applications</span>
                        {(tender.pending_count ?? 0) > 0 && (
                          <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                            {tender.pending_count}
                          </span>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openStudentTender(tender)}
                      className="px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                    >
                      View
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Tender Modal */}
      {showCreateModal && isTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Tender</h3>
            <form onSubmit={submitCreateTender} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tender name</label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Build a town hall"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={4}
                  placeholder="What needs to be built? Any rules/requirements?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value (ZAR)</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={createForm.value}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="0.00"
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  type="submit"
                  disabled={createLoading || !currentTownClass}
                  className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Applications Modal */}
      {showApplicationsModal && isTeacher && selectedTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{selectedTender.name} — Applications</h3>
                <p className="text-sm text-gray-500">
                  Status: <span className="font-medium">{selectedTender.status.toUpperCase()}</span> • Town: {selectedTender.town_class}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowApplicationsModal(false);
                  setSelectedTender(null);
                  setApplications([]);
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>

            {applicationsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No applications yet</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-auto pr-1">
                {applications.map((app) => (
                  <div key={app.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900 truncate">
                            {app.applicant_first_name || app.applicant_last_name
                              ? `${app.applicant_first_name || ''} ${app.applicant_last_name || ''}`.trim()
                              : app.applicant_username}
                          </p>
                          {app.applicant_username && <span className="text-sm text-gray-500">@{app.applicant_username}</span>}
                          {app.applicant_class && <span className="text-xs text-gray-500">({app.applicant_class})</span>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${applicationBadge(app.status)}`}>
                            {app.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Applied: {new Date(app.created_at).toLocaleString()}</p>
                        {app.reviewer_username && (
                          <p className="text-xs text-gray-400 mt-1">
                            Reviewed by {app.reviewer_username} {app.reviewed_at ? `• ${new Date(app.reviewed_at).toLocaleString()}` : ''}
                          </p>
                        )}
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-2">
                        {selectedTender.status === 'open' && app.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => updateApplication(app.id, 'approved')}
                              disabled={decisionLoading === app.id}
                              className="px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                              {decisionLoading === app.id ? '...' : 'Approve'}
                            </button>
                            <button
                              onClick={() => updateApplication(app.id, 'denied')}
                              disabled={decisionLoading === app.id}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                              {decisionLoading === app.id ? '...' : 'Deny'}
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Tender Modal */}
      {showTenderModal && !isTeacher && studentSelectedTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl mx-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{studentSelectedTender.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge(studentSelectedTender.status)}`}>
                    {studentSelectedTender.status.toUpperCase()}
                  </span>
                  {studentSelectedTender.my_application_status && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${applicationBadge(studentSelectedTender.my_application_status)}`}>
                      {studentSelectedTender.my_application_status.toUpperCase()}
                    </span>
                  )}
                  <span className="text-sm text-gray-500">• {formatCurrency(Number(studentSelectedTender.value || 0))}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowTenderModal(false);
                  setStudentSelectedTender(null);
                }}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>

            {studentSelectedTender.description && <p className="text-gray-700 whitespace-pre-wrap">{studentSelectedTender.description}</p>}

            <div className="mt-6 flex gap-3">
              <button
                onClick={applyToTender}
                disabled={
                  applyLoading ||
                  studentSelectedTender.status !== 'open' ||
                  !!studentSelectedTender.my_application_status
                }
                className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {applyLoading ? 'Applying...' : studentSelectedTender.my_application_status ? 'Already Applied' : 'Apply'}
              </button>
              <button
                onClick={() => {
                  setShowTenderModal(false);
                  setStudentSelectedTender(null);
                }}
                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TendersPlugin;


