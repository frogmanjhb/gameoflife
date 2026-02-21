import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTown } from '../../contexts/TownContext';
import { Navigate } from 'react-router-dom';
import { Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { Job } from '../../types';
import { jobsApi } from '../../services/api';
import JobCard from '../JobCard';
import JobDetailsModal from '../JobDetailsModal';
import JobApplicationForm from '../JobApplicationForm';
import { EMPLOYMENT_BOARD_SECTIONS, getDisplayJobTitle } from '../../utils/jobDisplay';

const JobsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const { currentTown } = useTown();
  const jobsPlugin = plugins.find(p => p.route_path === '/jobs');
  
  // All hooks must be called before any early returns
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isApplicationFormOpen, setIsApplicationFormOpen] = useState(false);
  const [applicationCount, setApplicationCount] = useState<{ count: number; maxApplications: number; canApply: boolean } | null>(null);
  
  // Check if current user already has a job
  const userHasJob = user?.job_id !== null && user?.job_id !== undefined;
  
  // Check if job applications are enabled
  const applicationsEnabled = currentTown?.job_applications_enabled !== false;

  // Hide Mayor from board when teacher has turned off the mayor job card
  const displayJobs = currentTown?.show_mayor_job_card === false
    ? jobs.filter((j) => j.name !== 'Mayor')
    : jobs;

  useEffect(() => {
    if (jobsPlugin && jobsPlugin.enabled) {
      fetchJobs();
      if (user?.role === 'student' && !userHasJob) {
        fetchApplicationCount();
      }
    }
  }, [jobsPlugin, user]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await jobsApi.getJobs();
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplicationCount = async () => {
    try {
      const response = await jobsApi.getMyApplicationCount();
      setApplicationCount(response.data);
    } catch (error) {
      console.error('Failed to fetch application count:', error);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setIsDetailsModalOpen(true);
  };

  const handleApplyClick = () => {
    setIsDetailsModalOpen(false);
    setIsApplicationFormOpen(true);
  };

  const handleApplicationSuccess = () => {
    fetchJobs(); // Refresh jobs in case any status changed
    fetchApplicationCount(); // Refresh application count
  };

  const handleCloseDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedJob(null);
  };

  const handleCloseApplication = () => {
    setIsApplicationFormOpen(false);
  };

  // Generate random rotation for each job card (-5 to +5 degrees)
  const getRotation = (index: number) => {
    return (index * 7.3) % 11 - 5; // Pseudo-random but consistent per job
  };

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!jobsPlugin || !jobsPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">💼</div>
            <div>
              <h1 className="text-2xl font-bold">Jobs</h1>
              <p className="text-primary-100">Employment Board</p>
            </div>
          </div>
          {userHasJob && (
            <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">You are employed as: {getDisplayJobTitle(user?.job_name, user?.job_level)}</span>
            </div>
          )}
        </div>
      </div>

      {/* How Jobs Work - Instructions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
          How Jobs & Salaries Work
        </h2>
        <div className="space-y-4 text-sm text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">💰 Starting Salaries</h3>
            <p className="mb-2">All jobs start at <strong className="text-primary-600">R2,000 per period</strong> when you're first assigned (Level 1).</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📈 Salary Progression</h3>
            <p className="mb-2">As you improve in your job and gain experience, your salary increases:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-gray-600">
              <li><strong>Level 1:</strong> R2,000 (starting salary)</li>
              <li><strong>Level 2:</strong> ~R3,444</li>
              <li><strong>Level 3:</strong> ~R4,889</li>
              <li><strong>Level 4-9:</strong> Progressive increases</li>
              <li><strong>Level 10:</strong> R15,000 (maximum level)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">⭐ Job Levels & Title Progression</h3>
            <p className="mb-2">You start at <strong>Level 1</strong> when assigned to a job. Your level increases based on job performance, experience points from job tasks, and consistency.</p>
            <p className="mb-2">Your <strong>job title</strong> reflects your level:</p>
            <ul className="list-disc list-inside ml-2 space-y-1 text-gray-600">
              <li><strong>Level 1–3:</strong> Assistant / Junior (entry level)</li>
              <li><strong>Level 4–8:</strong> Associate</li>
              <li><strong>Level 9–10:</strong> Senior</li>
            </ul>
            <p className="mt-2 text-gray-600">Levels range from <strong>1 to 10</strong>. The Mayor role is elected and does not use this progression.</p>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">📋 Contractual Jobs</h3>
            <p className="mb-2">Some jobs are marked as <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-semibold inline-block">CONTRACTUAL</span>. These jobs earn <strong>1.5x more</strong> than regular jobs at the same level.</p>
            <p className="text-gray-600">For example, a Level 10 contractual job pays <strong>R22,500</strong> (R15,000 × 1.5).</p>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-4">
            <p className="text-primary-800 font-medium">
              💡 <strong>Tip:</strong> Focus on doing your job well! The better you perform, the faster you'll level up and earn more money.
            </p>
          </div>
        </div>
      </div>

      {/* Pin Board */}
      <div className="pin-board rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        ) : displayJobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Available</h2>
            <p className="text-gray-600">
              Check back later for new job opportunities!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {EMPLOYMENT_BOARD_SECTIONS.map((section) => {
              const sectionJobs = displayJobs.filter((j) => section.jobNames.includes(j.name));
              if (sectionJobs.length === 0) return null;
              return (
                <div key={section.title}>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center justify-center gap-2">
                    <span>{section.emoji}</span>
                    <span>{section.title}</span>
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {sectionJobs.map((job, index) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onClick={() => handleJobClick(job)}
                        rotation={getRotation(index)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            {(() => {
              const assignedNames = new Set(EMPLOYMENT_BOARD_SECTIONS.flatMap((s) => s.jobNames));
              const otherJobs = displayJobs.filter((j) => !assignedNames.has(j.name));
              if (otherJobs.length === 0) return null;
              return (
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">Other</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {otherJobs.map((job, index) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onClick={() => handleJobClick(job)}
                        rotation={getRotation(index)}
                      />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      <JobDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={handleCloseDetails}
        job={selectedJob}
        onApply={handleApplyClick}
        userHasJob={userHasJob}
        userJobName={user?.job_name}
        applicationsEnabled={applicationsEnabled}
        applicationCount={applicationCount}
        isTeacher={user?.role === 'teacher'}
        onSaveJob={
          user?.role === 'teacher'
            ? async (jobId, data) => {
                const res = await jobsApi.updateJob(jobId, data);
                await fetchJobs();
                if (res?.data) setSelectedJob((prev) => (prev?.id === res.data.id ? { ...prev, ...res.data } : prev));
                return res?.data;
              }
            : undefined
        }
      />

      {/* Application Form Modal */}
      {selectedJob && (
        <JobApplicationForm
          isOpen={isApplicationFormOpen}
          onClose={handleCloseApplication}
          jobId={selectedJob.id}
          jobName={selectedJob.name}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </div>
  );
};

export default JobsPlugin;

