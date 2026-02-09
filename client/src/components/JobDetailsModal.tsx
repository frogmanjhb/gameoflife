import React, { useState, useEffect } from 'react';
import { X, Briefcase, DollarSign, MapPin, Building, FileText, AlertCircle, CheckCircle, Edit2, Save } from 'lucide-react';
import { Job } from '../types';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onApply: () => void;
  userHasJob?: boolean;
  userJobName?: string;
  applicationsEnabled?: boolean;
  applicationCount?: { count: number; maxApplications: number; canApply: boolean } | null;
  isTeacher?: boolean;
  onSaveJob?: (jobId: number, data: Partial<Job>) => Promise<Job | void>;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ isOpen, onClose, job, onApply, userHasJob = false, userJobName, applicationsEnabled = true, applicationCount = null, isTeacher = false, onSaveJob }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Job>>({});
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    if (job && isEditing) {
      setEditFormData({
        name: job.name,
        description: job.description ?? '',
        salary: job.salary,
        company_name: job.company_name ?? '',
        location: job.location ?? '',
        requirements: job.requirements ?? '',
      });
      setEditError(null);
    }
    if (!isEditing) setEditError(null);
  }, [job, isEditing]);

  if (!isOpen || !job) return null;
  
  // Check if position is already fulfilled
  const isPositionFulfilled = job.is_fulfilled;
  
  // Check if user has reached application limit
  const hasReachedLimit = applicationCount !== null && !applicationCount.canApply;
  
  // Determine if user can apply
  const canApply = !userHasJob && !isPositionFulfilled && applicationsEnabled && !hasReachedLimit;

  const handleStartEdit = () => setIsEditing(true);
  const handleCancelEdit = () => setIsEditing(false);
  const handleSaveEdit = async () => {
    if (!onSaveJob || !editFormData.name || editFormData.salary == null) return;
    setSaving(true);
    setEditError(null);
    try {
      await onSaveJob(job.id, editFormData);
      setIsEditing(false);
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update job');
    } finally {
      setSaving(false);
    }
  };

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <Briefcase className="h-6 w-6" />
            <h2 className="text-2xl font-bold">{isEditing ? 'Edit Job' : 'Job Details'}</h2>
          </div>
          <div className="flex items-center space-x-2">
            {isTeacher && !isEditing && (
              <button
                onClick={handleStartEdit}
                className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-20 rounded-lg flex items-center space-x-1"
                title="Edit job"
              >
                <Edit2 className="h-5 w-5" />
                <span className="text-sm font-medium">Edit</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-lg"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content: Edit form or view */}
        <div className="p-6 space-y-6">
          {isEditing ? (
            /* Edit form */
            <>
              {editError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Name *</label>
                <input
                  type="text"
                  value={editFormData.name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company / Department</label>
                <input
                  type="text"
                  value={editFormData.company_name || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={editFormData.location || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Salary (ZAR) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editFormData.salary ?? ''}
                  onChange={(e) => setEditFormData({ ...editFormData, salary: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Daily and weekly responsibilities..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea
                  value={editFormData.requirements || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, requirements: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g. Two positions available."
                />
              </div>
              <div className="flex space-x-3 pt-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editFormData.name || editFormData.salary == null}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            /* View mode */
            <>
          {/* Job Title and Salary */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.name}</h1>
            {job.company_name && (
              <div className="flex items-center text-gray-600 mb-4">
                <Building className="h-5 w-5 mr-2" />
                <span className="text-lg font-medium">{job.company_name}</span>
              </div>
            )}
            <div className="flex items-center space-x-6">
              <div className="flex items-center text-primary-600">
                <DollarSign className="h-5 w-5 mr-2" />
                <span className="text-xl font-bold">{formatSalary(job.salary)}</span>
                <span className="text-sm text-gray-600 ml-2">per period</span>
              </div>
              {job.location && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-5 w-5 mr-2" />
                  <span>{job.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Job Description
              </h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.requirements}
              </p>
            </div>
          )}

          {/* Posted Date */}
          <div className="text-sm text-gray-500 border-t border-gray-200 pt-4">
            Posted on {formatDate(job.created_at)}
          </div>

          {/* Status Messages */}
          {isPositionFulfilled && (
            <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-800">Position Fulfilled</p>
                <p className="text-sm text-green-600">
                  This position has been filled{job.assigned_to_name ? ` by ${job.assigned_to_name}` : ''}.
                </p>
              </div>
            </div>
          )}
          
          {userHasJob && !isPositionFulfilled && (
            <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-800">You Already Have a Job</p>
                <p className="text-sm text-amber-600">You are currently employed as: {userJobName}</p>
              </div>
            </div>
          )}

          {!applicationsEnabled && (
            <div className="flex items-center space-x-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-gray-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-800">Applications Currently Disabled</p>
                <p className="text-sm text-gray-600">Job applications are temporarily disabled. Please check back later.</p>
              </div>
            </div>
          )}

          {hasReachedLimit && applicationsEnabled && (
            <div className="flex items-center space-x-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-orange-800">Application Limit Reached</p>
                <p className="text-sm text-orange-600">
                  You have reached the maximum of {applicationCount?.maxApplications || 2} job applications. 
                  Please wait for a response on your existing applications before applying to more jobs.
                </p>
              </div>
            </div>
          )}

          {applicationCount && applicationCount.count > 0 && !hasReachedLimit && (
            <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="h-6 w-6 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-blue-800">Application Status</p>
                <p className="text-sm text-blue-600">
                  You have {applicationCount.count} active application{applicationCount.count !== 1 ? 's' : ''} 
                  ({applicationCount.maxApplications - applicationCount.count} remaining)
                </p>
              </div>
            </div>
          )}

          {/* Apply Button */}
          <div className="flex space-x-4 pt-4">
            {canApply ? (
              <button
                onClick={onApply}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Apply Now
              </button>
            ) : (
              <button
                disabled
                className="flex-1 bg-gray-300 text-gray-500 font-semibold py-3 px-6 rounded-lg cursor-not-allowed"
              >
                {!applicationsEnabled 
                  ? 'Applications Disabled' 
                  : hasReachedLimit 
                    ? `Application Limit Reached (${applicationCount?.count || 0}/${applicationCount?.maxApplications || 2})`
                    : isPositionFulfilled 
                      ? 'Position Filled' 
                      : 'Cannot Apply'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;

