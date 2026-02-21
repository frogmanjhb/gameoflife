import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Briefcase, DollarSign, MapPin, Building2, ClipboardList, 
  Award, FileText, TrendingUp, Loader2, AlertCircle, Play 
} from 'lucide-react';
import { jobsApi, architectGameApi, accountantGameApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Job, ArchitectGameStatus, AccountantGameStatus } from '../types';
import { getXPProgress } from '../utils/jobProgression';
import { stripPositionsAvailableFromRequirements } from '../utils/jobDisplay';
import ArchitectGameModal from './jobchallenges/ArchitectGameModal';
import AccountantGameModal from './jobchallenges/AccountantGameModal';

const MyJobDetails: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [architectGameStatus, setArchitectGameStatus] = useState<ArchitectGameStatus | null>(null);
  const [isArchitectGameOpen, setIsArchitectGameOpen] = useState(false);
  const [accountantGameStatus, setAccountantGameStatus] = useState<AccountantGameStatus | null>(null);
  const [isAccountantGameOpen, setIsAccountantGameOpen] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  useEffect(() => {
    if (user && job?.name?.toLowerCase() === 'architect') {
      fetchArchitectGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && job?.name?.toLowerCase().trim() === 'chartered accountant') {
      fetchAccountantGameStatus();
    }
  }, [user, job]);

  const fetchArchitectGameStatus = async () => {
    try {
      const response = await architectGameApi.getStatus();
      setArchitectGameStatus(response.data);
    } catch (err: any) {
      console.log('Architect game status not available:', err.response?.data?.error);
    }
  };

  const fetchAccountantGameStatus = async () => {
    try {
      const response = await accountantGameApi.getStatus();
      setAccountantGameStatus(response.data);
    } catch (err: any) {
      console.log('Accountant game status not available:', err.response?.data?.error);
    }
  };

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await jobsApi.getJob(parseInt(jobId!));
      setJob(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load job details');
    } finally {
      setLoading(false);
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

  // Calculate current salary based on job level
  const getCurrentSalary = () => {
    if (!job) return null;
    const baseSalary = job.base_salary || 2000;
    const jobLevel = (user as any)?.job_level || 1;
    const levelMultiplier = 1 + (jobLevel - 1) * 0.7222;
    const contractualMultiplier = job.is_contractual ? 1.5 : 1.0;
    return baseSalary * levelMultiplier * contractualMultiplier;
  };

  const currentSalary = getCurrentSalary();
  const jobLevel = (user as any)?.job_level || 1;
  const experiencePoints = (user as any)?.job_experience_points || 0;
  const baseSalary = job?.base_salary || 2000;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error || 'Job not found'}</p>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center space-x-2 text-primary-600 hover:text-primary-700"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Go Back</span>
        </button>
      </div>
    );
  }

  const responsibilities = job.description?.split('\n').filter(line => line.trim()) || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div className="flex items-center space-x-3">
          <Briefcase className="h-6 w-6 text-primary-600" />
          <h1 className="text-2xl font-bold text-gray-900">My Job Details</h1>
        </div>
      </div>

      {/* Job Title & Company */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="border-l-4 border-amber-500 pl-4 py-3 bg-amber-50 rounded-r-lg mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-bold text-2xl text-gray-900 flex items-center gap-2 mb-2">
                <Award className="h-6 w-6 text-amber-600" />
                {job.name}
              </h2>
              {job.company_name && (
                <div className="flex items-center text-gray-600 mb-1">
                  <Building2 className="h-5 w-5 mr-2" />
                  <span className="text-lg">{job.company_name}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center text-gray-500">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>{job.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Job Level & Experience */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <Award className="h-5 w-5 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Current Level</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-700">Level {jobLevel}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {experiencePoints} Experience Points
                </div>
              </div>
            </div>
            {jobLevel < 10 && (() => {
              const progress = getXPProgress(jobLevel, experiencePoints);
              return (
                <div>
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span className="font-medium">Progress to Level {jobLevel + 1}</span>
                    <span>{progress.current} / {progress.needed} XP</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {progress.needed - progress.current} XP needed for next level
                  </div>
                </div>
              );
            })()}
            {jobLevel >= 10 && (
              <div className="text-xs text-green-600 font-medium mt-2">
                Maximum level reached! 🎉
              </div>
            )}
          </div>

          {/* Salary per Period */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-gray-700">Salary per Period</span>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-700">
                  {currentSalary ? formatSalary(currentSalary) : 'N/A'}
                </div>
                {job.is_contractual && (
                  <div className="text-xs text-purple-600 mt-1 font-semibold">
                    Contractual Job
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Salary Progression */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Salary Progression
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((level) => {
              const levelMultiplier = 1 + (level - 1) * 0.7222;
              const contractualMultiplier = job.is_contractual ? 1.5 : 1.0;
              const salary = baseSalary * levelMultiplier * contractualMultiplier;
              const isCurrentLevel = level === jobLevel;
              return (
                <div 
                  key={level} 
                  className={`bg-white rounded p-2 border ${
                    isCurrentLevel 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className={`font-semibold ${isCurrentLevel ? 'text-primary-700' : 'text-gray-700'}`}>
                    L{level} {isCurrentLevel && '←'}
                  </div>
                  <div className={`font-medium ${isCurrentLevel ? 'text-primary-600' : 'text-gray-600'}`}>
                    {formatSalary(salary)}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            Your salary increases as you level up. Focus on doing your job well to earn more!
          </p>
        </div>

        {/* Job Description */}
        {job.description && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Job Description</h3>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {job.description}
              </p>
            </div>
          </div>
        )}

        {/* Responsibilities */}
        {responsibilities.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <ClipboardList className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Responsibilities</h3>
            </div>
            <ul className="space-y-3">
              {responsibilities.map((responsibility, index) => (
                <li 
                  key={index}
                  className="flex items-start text-gray-700"
                >
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mt-2 mr-3 flex-shrink-0" />
                  <span className="leading-relaxed">{responsibility}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Requirements (positions-available text stripped for awarded job view) */}
        {(() => {
          const requirements = stripPositionsAvailableFromRequirements(job.requirements);
          return requirements ? (
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Requirements</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{requirements}</p>
            </div>
          ) : null;
        })()}

        {/* Chartered Accountant – Financial Audit Challenges */}
        {job.name?.toLowerCase().trim() === 'chartered accountant' && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                    Financial Audit Challenges
                  </h3>
                  <p className="text-sm text-gray-600">
                    Solve audit cases (5 questions each) to earn XP.
                  </p>
                </div>
                <button
                  onClick={() => setIsAccountantGameOpen(true)}
                  disabled={!accountantGameStatus || (accountantGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Audit Case</span>
                </button>
              </div>
              {accountantGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {accountantGameStatus.remaining_plays} / {accountantGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{accountantGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{accountantGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{accountantGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Architect Game Section */}
        {job.name?.toLowerCase() === 'architect' && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-amber-600" />
                    Design Approval Challenges
                  </h3>
                  <p className="text-sm text-gray-600">
                    Solve design calculations to earn experience points and money
                  </p>
                </div>
                <button
                  onClick={() => setIsArchitectGameOpen(true)}
                  disabled={!architectGameStatus || (architectGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Review</span>
                </button>
              </div>
              {architectGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {architectGameStatus.remaining_plays} / {architectGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">
                      {architectGameStatus.high_scores?.easy ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">
                      {architectGameStatus.high_scores?.medium ?? 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">
                      {architectGameStatus.high_scores?.hard ?? 0}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Architect Game Modal */}
      {job.name?.toLowerCase() === 'architect' && (
        <ArchitectGameModal
          isOpen={isArchitectGameOpen}
          onClose={() => {
            setIsArchitectGameOpen(false);
            fetchArchitectGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchArchitectGameStatus()}
          gameStatus={architectGameStatus}
        />
      )}

      {/* Accountant Game Modal */}
      {job.name?.toLowerCase().trim() === 'chartered accountant' && (
        <AccountantGameModal
          isOpen={isAccountantGameOpen}
          onClose={() => {
            setIsAccountantGameOpen(false);
            fetchAccountantGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchAccountantGameStatus()}
          gameStatus={accountantGameStatus}
        />
      )}
    </div>
  );
};

export default MyJobDetails;
