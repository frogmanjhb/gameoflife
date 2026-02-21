import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from '../types';
import { Briefcase, DollarSign, MapPin, Building2, ClipboardList, Award, ArrowRight } from 'lucide-react';
import { getXPProgress } from '../utils/jobProgression';
import { stripPositionsAvailableFromRequirements, getDisplayJobTitle } from '../utils/jobDisplay';

interface MyJobCardProps {
  user: User;
}

const MyJobCard: React.FC<MyJobCardProps> = ({ user }) => {
  const navigate = useNavigate();
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
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(salary);
  };

  // Parse requirements/responsibilities if they exist
  const responsibilities = user.job_description?.split('\n').filter(line => line.trim()) || [];

  // Calculate correct salary based on job level and contractual status
  const getCurrentSalary = () => {
    const baseSalary = (user as any).job_base_salary || 2000; // Use base_salary from user or default
    const jobLevel = (user as any).job_level || 1;
    const isContractual = (user as any).job_is_contractual || false;
    const levelMultiplier = 1 + (jobLevel - 1) * 0.7222;
    const contractualMultiplier = isContractual ? 1.5 : 1.0;
    const calculatedSalary = baseSalary * levelMultiplier * contractualMultiplier;
    
    // If job_salary exists and seems reasonable (within 10% of calculated), use it
    // Otherwise use calculated value (handles old data or incorrect values)
    if (user.job_salary) {
      const diff = Math.abs(user.job_salary - calculatedSalary);
      if (diff / calculatedSalary < 0.1) {
        return user.job_salary;
      }
    }
    return calculatedSalary;
  };

  const currentSalary = getCurrentSalary();
  const jobLevel = (user as any).job_level || 1;
  const baseSalary = (user as any).job_base_salary || 2000;
  const isContractual = (user as any).job_is_contractual || false;

  const handleCardClick = () => {
    if (user.job_id) {
      navigate(`/my-job/${user.job_id}`);
    }
  };

  return (
    <div 
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900">My Job</h2>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>

      {/* Job Title & Company */}
      <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg mb-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600" />
              {getDisplayJobTitle(user.job_name, user.job_level)}
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

      {/* Job Level & Salary */}
      <div className="space-y-3 mb-4">
        {/* Job Level */}
        {(user as any).job_level && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Award className="h-4 w-4 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Job Level</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-blue-700">Level {(user as any).job_level}</span>
                {(user as any).job_experience_points !== undefined && (
                  <span className="text-xs text-gray-500">
                    ({(user as any).job_experience_points} XP)
                  </span>
                )}
              </div>
            </div>
            {jobLevel < 10 && (() => {
              const progress = getXPProgress(jobLevel, (user as any).job_experience_points || 0);
              return (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Progress to Level {jobLevel + 1}</span>
                    <span>{progress.current} / {progress.needed} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Weekly Salary */}
        <div className="flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-gray-700">Salary per Period</span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-green-700">
              {currentSalary ? formatSalary(currentSalary) : 'N/A'}
            </span>
            {jobLevel < 10 && (
              <div className="text-xs text-gray-500 mt-1">
                Max: {formatSalary(baseSalary * 7.5 * (isContractual ? 1.5 : 1.0))} at Level 10
              </div>
            )}
          </div>
        </div>
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

      {/* Requirements section (positions-available text stripped for awarded job view) */}
      {(() => {
        const requirements = stripPositionsAvailableFromRequirements(user.job_requirements);
        return requirements && requirements !== stripPositionsAvailableFromRequirements(user.job_description) ? (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Requirements</h4>
            <p className="text-sm text-gray-600">{requirements}</p>
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default MyJobCard;


