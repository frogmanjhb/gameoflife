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
  
  // Check if current user already has a job
  const userHasJob = user?.job_id !== null && user?.job_id !== undefined;
  
  // Check if job applications are enabled
  const applicationsEnabled = currentTown?.job_applications_enabled !== false;

  useEffect(() => {
    if (jobsPlugin && jobsPlugin.enabled) {
      fetchJobs();
    }
  }, [jobsPlugin]);

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
              <span className="text-sm font-medium">You are employed as: {user?.job_name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pin Board */}
      <div className="pin-board rounded-2xl p-8 min-h-[600px] relative overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Available</h2>
            <p className="text-gray-600">
              Check back later for new job opportunities!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {jobs.map((job, index) => (
              <JobCard
                key={job.id}
                job={job}
                onClick={() => handleJobClick(job)}
                rotation={getRotation(index)}
              />
            ))}
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

