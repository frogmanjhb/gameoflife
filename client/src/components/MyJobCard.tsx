import React from 'react';
import { User } from '../types';
import { Briefcase, DollarSign, MapPin, Building2, ClipboardList, Award } from 'lucide-react';

interface MyJobCardProps {
  user: User;
}

const MyJobCard: React.FC<MyJobCardProps> = ({ user }) => {
  const hasJob = user.job_id && user.job_name;

  if (!hasJob) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Briefcase className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Job</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No job assigned yet</p>
          <p className="text-sm mt-1">Apply for jobs in the Jobs system</p>
        </div>
      </div>
    );
  }

  // Format salary as currency
  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  };

  // Parse requirements/responsibilities if they exist
  const responsibilities = user.job_description?.split('\n').filter(line => line.trim()) || [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Briefcase className="h-5 w-5 text-amber-600" />
        <h2 className="text-lg font-semibold text-gray-900">My Job</h2>
      </div>

      {/* Job Title & Company */}
      <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              {user.job_name}
            </h3>
            {user.job_company_name && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <Building2 className="h-4 w-4 mr-1" />
                {user.job_company_name}
              </div>
            )}
            {user.job_location && (
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {user.job_location}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Salary */}
      <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-200">
        <div className="flex items-center">
          <DollarSign className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm font-medium text-gray-700">Weekly Salary</span>
        </div>
        <span className="text-xl font-bold text-green-700">
          {user.job_salary ? formatSalary(user.job_salary) : 'N/A'}
        </span>
      </div>

      {/* Responsibilities */}
      {responsibilities.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-3">
            <ClipboardList className="h-4 w-4 text-gray-600" />
            <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">
              Responsibilities
            </h4>
          </div>
          <ul className="space-y-2">
            {responsibilities.slice(0, 5).map((responsibility, index) => (
              <li 
                key={index}
                className="flex items-start text-sm text-gray-600"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mt-1.5 mr-2 flex-shrink-0" />
                <span>{responsibility}</span>
              </li>
            ))}
            {responsibilities.length > 5 && (
              <li className="text-xs text-gray-400 pl-4">
                +{responsibilities.length - 5} more responsibilities
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Requirements section if different from description */}
      {user.job_requirements && user.job_requirements !== user.job_description && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Requirements</h4>
          <p className="text-sm text-gray-600">{user.job_requirements}</p>
        </div>
      )}
    </div>
  );
};

export default MyJobCard;


