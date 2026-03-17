import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Loader2, AlertCircle } from 'lucide-react';
import { Job } from '../../types';
import { jobsApi } from '../../services/api';
import JobCard from '../JobCard';

const TeacherJobTestingTab: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await jobsApi.getJobs();
        setJobs(response.data || []);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const handleJobClick = (job: Job) => {
    navigate(`/my-job/${job.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-3">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-800">Could not load jobs for testing</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-800 mb-2">No jobs available</h2>
        <p className="text-sm text-gray-500">
          Once you have created jobs, they will appear here for testing.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1 flex items-center">
          <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
          Job testing
        </h2>
        <p className="text-sm text-gray-600">
          Click any job below to open the exact page students see when they are assigned that job. This is
          for demonstration and testing only.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {jobs.map((job, index) => (
          <JobCard
            key={job.id}
            job={job}
            onClick={() => handleJobClick(job)}
            rotation={0}
          />
        ))}
      </div>
    </div>
  );
};

export default TeacherJobTestingTab;

