import React, { useState, useRef, useEffect } from 'react';
import { Job } from '../types';
import { Briefcase, DollarSign, CheckCircle } from 'lucide-react';

interface JobCardProps {
  job: Job;
  onClick: () => void;
  rotation?: number;
  isFulfilled?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ job, onClick, rotation = 0, isFulfilled = false }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isTopRow, setIsTopRow] = useState(false);
  
  // Check if job is fulfilled from prop or from job data
  const jobIsFulfilled = isFulfilled || job.is_fulfilled;

  // Color code by company/job type
  const getJobColor = (companyName?: string, jobName?: string) => {
    if (!companyName) {
      // Fallback colors for jobs without company
      return 'bg-blue-50 border-blue-200';
    }
    
    const company = companyName.toLowerCase();
    const job = jobName?.toLowerCase() || '';
    
    // Town Government - Green
    if (company.includes('government')) {
      return 'bg-green-50 border-green-200';
    }
    // Town Finance - Blue
    if (company.includes('finance')) {
      return 'bg-blue-50 border-blue-200';
    }
    // Town Police - Red/Pink
    if (company.includes('police')) {
      return 'bg-pink-50 border-pink-200';
    }
    // Town Infrastructure/Design - Orange
    if (company.includes('infrastructure') || company.includes('design')) {
      return 'bg-orange-50 border-orange-200';
    }
    // Town Education - Yellow
    if (company.includes('education')) {
      return 'bg-yellow-50 border-yellow-200';
    }
    // Town Health - Light Red/Pink
    if (company.includes('health')) {
      return 'bg-red-50 border-red-200';
    }
    // Town Retail/Business - Purple
    if (company.includes('retail') || company.includes('events') || company.includes('business')) {
      return 'bg-purple-50 border-purple-200';
    }
    // Town Media/News - Light Blue
    if (company.includes('media') || company.includes('news')) {
      return 'bg-cyan-50 border-cyan-200';
    }
    
    // Default fallback
    return 'bg-gray-50 border-gray-200';
  };

  const flyerColor = getJobColor(job.company_name, job.name);

  // Extract number of positions from requirements
  const getPositionsAvailable = () => {
    if (!job.requirements) return null;
    const match = job.requirements.match(/(\d+)\s+positions?/i) || job.requirements.match(/(\d+)\s+position/i);
    return match ? parseInt(match[1]) : null;
  };

  const positionsAvailable = getPositionsAvailable();

  const formatSalary = (salary: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(salary);
  };

  // Normalize base_salary: if it's 4000 (old default), use 2000 instead
  const getBaseSalary = () => {
    const baseSalary = job.base_salary || 2000;
    // If somehow base_salary is still 4000, normalize it to 2000
    return baseSalary === 4000 ? 2000 : baseSalary;
  };

  const baseSalary = getBaseSalary();

  // Check if this is in the top row to position tooltip correctly
  const cardRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const checkPosition = () => {
      if (cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        const parent = cardRef.current.closest('.pin-board');
        if (parent) {
          const parentRect = parent.getBoundingClientRect();
          // If card is in top 30% of pin board, show tooltip below
          const relativeTop = rect.top - parentRect.top;
          setIsTopRow(relativeTop < parentRect.height * 0.3);
        }
      }
    };
    
    checkPosition();
    // Recheck on window resize
    window.addEventListener('resize', checkPosition);
    return () => window.removeEventListener('resize', checkPosition);
  }, []);

  return (
    <div
      ref={cardRef}
      className={`job-flyer relative cursor-pointer transition-all duration-300 ${isHovered ? 'wiggle-subtle' : ''}`}
      style={{ transform: `rotate(${rotation}deg)` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Pushpins */}
      <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 rounded-full border-2 border-red-700 shadow-md z-10"></div>
      <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-700 shadow-md z-10"></div>

      {/* Flyer Card */}
      <div className={`${flyerColor} border-2 rounded-lg p-4 shadow-lg hover:shadow-xl transition-shadow min-h-[180px] flex flex-col relative overflow-hidden`}>
        {/* Position Fulfilled Overlay */}
        {jobIsFulfilled && (
          <div className="absolute inset-0 bg-gray-800 bg-opacity-60 flex flex-col items-center justify-center z-20 rounded-lg">
            <CheckCircle className="h-10 w-10 text-green-400 mb-2" />
            <div className="text-white font-bold text-lg text-center px-2">Position Fulfilled</div>
            {job.assigned_to_name && (
              <div className="text-green-200 text-sm text-center px-2 mt-1">by {job.assigned_to_name}</div>
            )}
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <Briefcase className="h-6 w-6 text-gray-700 flex-shrink-0" />
          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {formatSalary(baseSalary)}
            </div>
            <div className="text-xs text-gray-600">
              {job.is_contractual && (
                <span className="inline-block bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded text-[10px] font-semibold mb-1">
                  CONTRACTUAL
                </span>
              )}
              <div className="mt-0.5">starts at • grows with level</div>
            </div>
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

        {/* Salary Progression Info */}
        <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-50">
          <div className="text-[10px] text-gray-500 space-y-0.5">
            <div className="font-semibold text-gray-600">Salary Progression:</div>
            <div>Level 1: {formatSalary(baseSalary)}</div>
            {job.is_contractual && (
              <div className="text-purple-600 font-medium">
                Level 10: {formatSalary(baseSalary * 7.5 * 1.5)} (contractual)
              </div>
            )}
            {!job.is_contractual && (
              <div>Level 10: {formatSalary(baseSalary * 7.5)}</div>
            )}
          </div>
        </div>

        {job.location && (
          <div className="mt-2 text-xs text-gray-500">
            📍 {job.location}
          </div>
        )}

        {/* Hover Preview Tooltip */}
        {isHovered && (
          <div className={`absolute left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-50 pointer-events-none whitespace-nowrap ${
            isTopRow ? 'top-full mt-2' : '-top-24'
          }`}>
            <div className="font-semibold">{job.name}</div>
            <div className="text-gray-300">
              Starts: {formatSalary(baseSalary)}
              {job.is_contractual && <span className="text-purple-300 ml-1">(Contractual)</span>}
            </div>
            <div className="text-gray-400 text-[10px] mt-1">
              Grows with performance level
            </div>
            {positionsAvailable && (
              <div className="text-gray-400 mt-1 text-center border-t border-gray-700 pt-1">
                {positionsAvailable} position{positionsAvailable > 1 ? 's' : ''} available
              </div>
            )}
            <div className={`absolute left-1/2 transform -translate-x-1/2 ${
              isTopRow 
                ? 'bottom-full mb-0' 
                : 'top-full mt-0'
            }`}>
              <div className={`border-4 border-transparent ${
                isTopRow 
                  ? 'border-b-gray-900' 
                  : 'border-t-gray-900'
              }`}></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobCard;

