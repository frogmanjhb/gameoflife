import React from 'react';
import { X, Briefcase, DollarSign, MapPin, Building, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Job } from '../types';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onApply: () => void;
  userHasJob?: boolean;
  userJobName?: string;
}

const JobDetailsModal: React.FC<JobDetailsModalProps> = ({ isOpen, onClose, job, onApply, userHasJob = false, userJobName }) => {
  if (!isOpen || !job) return null;
  
  // Check if position is already fulfilled
  const isPositionFulfilled = job.is_fulfilled;
  
  // Determine if user can apply
  const canApply = !userHasJob && !isPositionFulfilled;

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
            <h2 className="text-2xl font-bold">Job Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors p-1 hover:bg-white hover:bg-opacity-20 rounded-lg"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
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
                {isPositionFulfilled ? 'Position Filled' : 'Cannot Apply'}
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailsModal;

