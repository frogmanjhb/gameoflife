import React, { useState } from 'react';
import { Job } from '../types';
import { Briefcase, DollarSign } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onClick: () => void;
  rotation?: number;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick, rotation = 0 }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Generate a random color for the flyer
  const flyerColors = [
    'bg-pink-50 border-pink-200',
    'bg-blue-50 border-blue-200',
    'bg-yellow-50 border-yellow-200',
    'bg-green-50 border-green-200',
    'bg-purple-50 border-purple-200',
    'bg-orange-50 border-orange-200',
  ];
  const colorIndex = job.id % flyerColors.length;
  const flyerColor = flyerColors[colorIndex];

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  return (
    <div
      className={`job-flyer relative cursor-pointer transition-all duration-300 ${isHovered ? 'wiggle' : ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Pushpins */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-red-700 shadow-md z-10"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-700 shadow-md z-10"></div>

      {/* Flyer Card */}
      <div className={`${flyerColor} border-2 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow min-h-[180px] flex flex-col`}>
        <div className="flex items-start justify-between mb-2">
          <Briefcase className="h-6 w-6 text-gray-700 flex-shrink-0" />
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">{formatSalary(job.salary)}</div>
            <div className="text-xs text-gray-600">per period</div>
          </div>
        </div>

        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {job.name}
        </h3>

        {job.company_name && (
          <p className="text-sm text-gray-600 mb-2 font-medium">
            {job.company_name}
          </p>
        )}

        {job.description && (
          <p className="text-xs text-gray-600 line-clamp-3 flex-grow">
            {job.description}
          </p>
        )}

        {job.location && (
          <div className="mt-2 text-xs text-gray-500">
            📍 {job.location}
          </div>
        )}

        {/* Hover Preview Tooltip */}
        {isHovered && (
          <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-20 whitespace-nowrap pointer-events-none">
            <div className="font-semibold">{job.name}</div>
            <div className="text-gray-300">{formatSalary(job.salary)}</div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;

