import React, { useState, useEffect } from 'react';
import { Briefcase, CheckCircle, XCircle, UserPlus, UserMinus, Clock, Users, ToggleLeft, ToggleRight, Edit2, X, Save } from 'lucide-react';
import { jobsApi } from '../../services/api';
import api from '../../services/api';
import { Job, JobApplication } from '../../types';
import { useTown } from '../../contexts/TownContext';

interface Student {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  job_id?: number;
  job_name?: string;
}

interface JobWithAssignments extends Job {
  total_assigned: number;
  class_assigned: number;
}

const JobManagement: React.FC = () => {
  const { currentTownClass, allTowns, currentTown, refreshTown } = useTown();
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [selectedClass, setSelectedClass] = useState<string>(currentTownClass || 'all');
  const [jobs, setJobs] = useState<JobWithAssignments[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [togglingApplications, setTogglingApplications] = useState(false);
  const [editingJob, setEditingJob] = useState<JobWithAssignments | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Job>>({});
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedClass, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'jobs') {
        const className = selectedClass === 'all' ? undefined : selectedClass;
        const response = await jobsApi.getJobAssignmentsOverview(className);
        setJobs(response.data.jobs);
        setStudents(response.data.students);
      } else {
        const className = selectedClass === 'all' ? undefined : selectedClass;
        const filters: any = { status: 'pending' };
        if (className) {
          // We'll filter by class on the frontend since backend doesn't support it yet
        }
        const response = await jobsApi.getApplications(filters);
        let filtered = response.data;
        if (className && className !== 'all') {
          // Filter by student class (we need to get students first)
          const studentsRes = await jobsApi.getJobAssignmentsOverview(className);
          const studentIds = studentsRes.data.students.map((s: Student) => s.id);
          filtered = filtered.filter((app: JobApplication) => studentIds.includes(app.user_id));
        }
        setApplications(filtered);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignJob = async (userId: number, jobId: number) => {
    try {
      setError(null);
      await jobsApi.assignJobToStudent(userId, jobId);
      setSuccess('Job assigned successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to assign job');
    }
  };

  const handleRemoveJob = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this job assignment?')) {
      return;
    }
    try {
      setError(null);
      await jobsApi.removeJobFromStudent(userId);
      setSuccess('Job assignment removed successfully');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove job assignment');
    }
  };

  const handleApproveApplication = async (applicationId: number) => {
    try {
      setError(null);
      await jobsApi.updateApplicationStatus(applicationId, 'approved');
      setSuccess('Application approved and job assigned');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve application');
    }
  };

  const handleDenyApplication = async (applicationId: number) => {
    if (!confirm('Are you sure you want to deny this application?')) {
      return;
    }
    try {
      setError(null);
      await jobsApi.updateApplicationStatus(applicationId, 'denied');
      setSuccess('Application denied');
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deny application');
    }
  };

  const handleToggleApplications = async () => {
    if (!currentTown) return;
    
    setTogglingApplications(true);
    setError(null);
    try {
      await api.put(`/town/settings/${currentTown.id}`, {
        job_applications_enabled: !currentTown.job_applications_enabled
      });
      await refreshTown();
      setSuccess(`Job applications ${currentTown.job_applications_enabled ? 'disabled' : 'enabled'}`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle job applications');
    } finally {
      setTogglingApplications(false);
    }
  };

  const handleEditJob = (job: JobWithAssignments) => {
    setEditingJob(job);
    setEditFormData({
      name: job.name,
      description: job.description || '',
      salary: job.salary,
      company_name: job.company_name || '',
      location: job.location || '',
      requirements: job.requirements || ''
    });
  };

  const handleCloseEditModal = () => {
    setEditingJob(null);
    setEditFormData({});
  };

  const handleSaveJob = async () => {
    if (!editingJob) return;

    setSavingJob(true);
    setError(null);
    try {
      await jobsApi.updateJob(editingJob.id, editFormData);
      setSuccess('Job updated successfully');
      fetchData();
      handleCloseEditModal();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update job');
    } finally {
      setSavingJob(false);
    }
  };

  const getStudentsForJob = (jobId: number) => {
    return students.filter(s => s.job_id === jobId);
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const getPositionsAvailable = (requirements?: string) => {
    if (!requirements) return null;
    const match = requirements.match(/(\d+)\s+positions?/i);
    return match ? parseInt(match[1]) : null;
  };

  if (loading && jobs.length === 0 && applications.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Job Applications Toggle */}
      {currentTown && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Job Applications</h3>
              <p className="text-sm text-gray-600">
                {currentTown.job_applications_enabled !== false 
                  ? 'Students can currently apply for jobs' 
                  : 'Job applications are currently disabled'}
              </p>
            </div>
            <button
              onClick={handleToggleApplications}
              disabled={togglingApplications}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                currentTown.job_applications_enabled !== false
                  ? 'bg-primary-600'
                  : 'bg-gray-300'
              } ${togglingApplications ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  currentTown.job_applications_enabled !== false ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Class Selector */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedClass('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedClass === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Classes
          </button>
          {allTowns.map((town) => (
            <button
              key={town.class}
              onClick={() => setSelectedClass(town.class)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedClass === town.class
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {town.class}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('jobs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'jobs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Briefcase className="h-4 w-4" />
            <span>Job Assignments</span>
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'applications'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>Pending Applications</span>
            {applications.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {applications.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {success}
        </div>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {jobs.map((job) => {
            const assignedStudents = getStudentsForJob(job.id);
            const positionsAvailable = getPositionsAvailable(job.requirements);
            const isFullyAssigned = positionsAvailable ? assignedStudents.length >= positionsAvailable : false;

            return (
              <div key={job.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{job.name}</h3>
                      {job.company_name && (
                        <span className="text-sm text-gray-600">({job.company_name})</span>
                      )}
                      <button
                        onClick={() => handleEditJob(job)}
                        className="text-gray-400 hover:text-primary-600 transition-colors"
                        title="Edit job"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    </div>
                    {job.location && (
                      <p className="text-sm text-gray-600 mb-2">📍 {job.location}</p>
                    )}
                    <p className="text-sm font-medium text-primary-600 mb-2">
                      {formatSalary(job.salary)} per period
                    </p>
                    {positionsAvailable && (
                      <p className="text-sm text-gray-600">
                        {positionsAvailable} position{positionsAvailable > 1 ? 's' : ''} available
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      {selectedClass === 'all' ? (
                        <>
                          <div>Total: {job.total_assigned || 0} assigned</div>
                          <div className="text-xs text-gray-500">Across all classes</div>
                        </>
                      ) : (
                        <>
                          <div>Class: {job.class_assigned || 0} assigned</div>
                          <div className="text-xs text-gray-500">In {selectedClass}</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assigned Students */}
                {assignedStudents.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned Students:</h4>
                    <div className="space-y-2">
                      {assignedStudents.map((student) => (
                        <div
                          key={student.id}
                          className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                        >
                          <div>
                            <span className="font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </span>
                            <span className="text-sm text-gray-600 ml-2">
                              ({student.username}) - {student.class}
                            </span>
                          </div>
                          <button
                            onClick={() => handleRemoveJob(student.id)}
                            className="text-red-600 hover:text-red-700 flex items-center space-x-1 text-sm"
                          >
                            <UserMinus className="h-4 w-4" />
                            <span>Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unassigned Students (for this class) */}
                {selectedClass !== 'all' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assign to Student:</h4>
                    <div className="space-y-2">
                      {students
                        .filter(s => s.class === selectedClass && (!s.job_id || s.job_id !== job.id))
                        .map((student) => (
                          <div
                            key={student.id}
                            className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                {student.first_name} {student.last_name}
                              </span>
                              <span className="text-sm text-gray-600 ml-2">
                                ({student.username})
                              </span>
                              {student.job_name && (
                                <span className="text-xs text-orange-600 ml-2">
                                  Currently: {student.job_name}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleAssignJob(student.id, job.id)}
                              disabled={isFullyAssigned}
                              className={`flex items-center space-x-1 text-sm ${
                                isFullyAssigned
                                  ? 'text-gray-400 cursor-not-allowed'
                                  : 'text-primary-600 hover:text-primary-700'
                              }`}
                            >
                              <UserPlus className="h-4 w-4" />
                              <span>Assign</span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-600">No pending applications</p>
            </div>
          ) : (
            applications.map((application) => (
              <div key={application.id} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {application.job_name}
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <strong>Applicant:</strong> {application.applicant_first_name}{' '}
                        {application.applicant_last_name} ({application.applicant_username})
                      </p>
                      <p>
                        <strong>Applied:</strong>{' '}
                        {new Date(application.created_at).toLocaleDateString()}
                      </p>
                      {application.job_salary && (
                        <p>
                          <strong>Salary:</strong> {formatSalary(application.job_salary)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApproveApplication(application.id)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleDenyApplication(application.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Deny</span>
                    </button>
                  </div>
                </div>

                {/* Application Answers */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Application Answers:</h4>
                  <div className="space-y-3">
                    {Object.entries(application.answers || {}).map(([questionId, answer]) => {
                      // Map question IDs to readable labels
                      const questionLabels: Record<string, string> = {
                        interest: 'Why are you interested in this position?',
                        experience: 'What relevant experience do you have?',
                        availability: 'Are you available to work during school hours?',
                        skills: 'What skills make you a good fit?',
                        hours: 'How many hours per week can you commit?'
                      };
                      const questionLabel = questionLabels[questionId] || questionId;
                      return (
                        <div key={questionId} className="bg-gray-50 rounded-lg p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">{questionLabel}</p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">
                            {Array.isArray(answer) ? answer.join(', ') : answer}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Edit Job Modal */}
      {editingJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Edit Job</h2>
              <button
                onClick={handleCloseEditModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Job Name *
                </label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editFormData.company_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Salary (ZAR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.salary || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, salary: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Job description and responsibilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Requirements
                </label>
                <textarea
                  value={editFormData.requirements || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, requirements: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Job requirements, qualifications, number of positions..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSaveJob}
                  disabled={savingJob || !editFormData.name || !editFormData.salary}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingJob ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCloseEditModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobManagement;

