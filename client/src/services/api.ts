import axios from 'axios';
import { MathGameStatus, MathGameStartRequest, MathGameSubmitRequest, Job, JobApplication } from '../types';

// Support for multiple deployment platforms
const getApiUrl = () => {
  // Check for Vite environment variable first (Railway, Vercel, etc.)
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL}/api`;
  }
  
  // Check for legacy environment variables
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL}/api`;
  }
  
  // Production: Use relative URL (same domain as frontend)
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // Development default
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Math Game API methods
export const mathGameApi = {
  // Get math game status (remaining plays, high scores, recent sessions)
  getStatus: (): Promise<{ data: MathGameStatus }> => {
    return api.get('/math-game/status');
  },

  // Start a new math game session
  startGame: (data: MathGameStartRequest): Promise<{ data: { session: any } }> => {
    return api.post('/math-game/start', data);
  },

  // Submit math game results
  submitGame: (data: MathGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; isNewHighScore: boolean } }> => {
    return api.post('/math-game/submit', data);
  }
};

// Jobs API methods
export const jobsApi = {
  // Get all jobs
  getJobs: (): Promise<{ data: Job[] }> => {
    return api.get('/jobs');
  },

  // Get job by ID
  getJob: (id: number): Promise<{ data: Job }> => {
    return api.get(`/jobs/${id}`);
  },

  // Apply to a job
  applyToJob: (jobId: number, answers: Record<string, string | string[]>): Promise<{ data: JobApplication }> => {
    return api.post(`/jobs/${jobId}/apply`, { answers });
  },

  // Get applications (teachers only)
  getApplications: (filters?: { status?: string; job_id?: number; user_id?: number }): Promise<{ data: JobApplication[] }> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.job_id) params.append('job_id', filters.job_id.toString());
    if (filters?.user_id) params.append('user_id', filters.user_id.toString());
    const queryString = params.toString();
    return api.get(`/jobs/applications${queryString ? `?${queryString}` : ''}`);
  },

  // Get specific application (teachers only)
  getApplication: (id: number): Promise<{ data: JobApplication }> => {
    return api.get(`/jobs/applications/${id}`);
  },

  // Update application status (teachers only)
  updateApplicationStatus: (id: number, status: 'approved' | 'denied'): Promise<{ data: JobApplication }> => {
    return api.put(`/jobs/applications/${id}`, { status });
  },

  // Get job assignments overview (teachers only)
  getJobAssignmentsOverview: (className?: string): Promise<{ data: { jobs: any[]; students: any[] } }> => {
    const params = className ? `?class=${className}` : '';
    return api.get(`/jobs/assignments/overview${params}`);
  },

  // Assign job to student (teachers only)
  assignJobToStudent: (userId: number, jobId: number): Promise<{ data: any }> => {
    return api.post('/jobs/assign', { user_id: userId, job_id: jobId });
  },

  // Remove job from student (teachers only)
  removeJobFromStudent: (userId: number): Promise<{ data: { message: string } }> => {
    return api.delete(`/jobs/assign/${userId}`);
  }
};

export default api;
