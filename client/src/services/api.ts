import axios from 'axios';
import { 
  MathGameStatus, MathGameStartRequest, MathGameSubmitRequest, 
  MathGameStartResponse, MathGameSubmitResponse, MathGameAnswerResponse,
  Job, JobApplication, LandParcel, LandPurchaseRequest, 
  LandStats, MyPropertiesResponse, BiomeConfig, BiomeType,
  TaxBracket, TreasuryInfo, TaxReport, SalaryPaymentResult, TownSettings,
  Tender, TenderApplication
} from '../types';

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

  // Start a new math game session (returns server-generated problems WITHOUT answers)
  startGame: (data: MathGameStartRequest): Promise<{ data: MathGameStartResponse }> => {
    return api.post('/math-game/start', data);
  },

  // Submit an individual answer for real-time server validation
  submitAnswer: (data: { session_id: number; problem_index: number; answer: number }): Promise<{ data: MathGameAnswerResponse }> => {
    return api.post('/math-game/answer', data);
  },

  // Submit final game results (server validates all answers)
  submitGame: (data: MathGameSubmitRequest): Promise<{ data: MathGameSubmitResponse }> => {
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

// Land API methods
export const landApi = {
  // Get parcels (with optional viewport filtering)
  getParcels: (filters?: { 
    minRow?: number; 
    maxRow?: number; 
    minCol?: number; 
    maxCol?: number;
    owned?: boolean;
    biome?: BiomeType;
  }): Promise<{ data: LandParcel[] }> => {
    const params = new URLSearchParams();
    if (filters?.minRow !== undefined) params.append('minRow', filters.minRow.toString());
    if (filters?.maxRow !== undefined) params.append('maxRow', filters.maxRow.toString());
    if (filters?.minCol !== undefined) params.append('minCol', filters.minCol.toString());
    if (filters?.maxCol !== undefined) params.append('maxCol', filters.maxCol.toString());
    if (filters?.owned !== undefined) params.append('owned', filters.owned.toString());
    if (filters?.biome) params.append('biome', filters.biome);
    const queryString = params.toString();
    return api.get(`/land/parcels${queryString ? `?${queryString}` : ''}`);
  },

  // Get single parcel details
  getParcel: (code: string): Promise<{ data: LandParcel }> => {
    return api.get(`/land/parcels/${code}`);
  },

  // Get user's owned properties
  getMyProperties: (): Promise<{ data: MyPropertiesResponse }> => {
    return api.get('/land/my-properties');
  },

  // Submit purchase request
  submitPurchaseRequest: (parcelId: number, offeredPrice: number): Promise<{ data: { message: string; request: LandPurchaseRequest } }> => {
    return api.post('/land/purchase-request', { parcel_id: parcelId, offered_price: offeredPrice });
  },

  // Get purchase requests
  getPurchaseRequests: (status?: 'pending' | 'approved' | 'denied'): Promise<{ data: LandPurchaseRequest[] }> => {
    const params = status ? `?status=${status}` : '';
    return api.get(`/land/purchase-requests${params}`);
  },

  // Update purchase request (teachers only)
  updatePurchaseRequest: (id: number, status: 'approved' | 'denied', denialReason?: string): Promise<{ data: { message: string; request: LandPurchaseRequest } }> => {
    return api.put(`/land/purchase-requests/${id}`, { status, denial_reason: denialReason });
  },

  // Seed land data (teachers only)
  seedLandData: (): Promise<{ data: { message: string; count: number } }> => {
    return api.post('/land/seed');
  },

  // Get land statistics
  getStats: (): Promise<{ data: LandStats }> => {
    return api.get('/land/stats');
  },

  // Get biome configuration
  getBiomeConfig: (): Promise<{ data: Record<BiomeType, BiomeConfig> }> => {
    return api.get('/land/biome-config');
  }
};

// Treasury and Tax API methods
export const treasuryApi = {
  // Get treasury info for a town
  getTreasuryInfo: (townClass: string): Promise<{ data: TreasuryInfo }> => {
    return api.get(`/town/treasury/${townClass}`);
  },

  // Deposit to treasury
  depositToTreasury: (townClass: string, amount: number, description?: string): Promise<{ data: { message: string; treasury_balance: number } }> => {
    return api.post(`/town/treasury/${townClass}/deposit`, { amount, description });
  },

  // Withdraw from treasury
  withdrawFromTreasury: (townClass: string, amount: number, description?: string): Promise<{ data: { message: string; treasury_balance: number } }> => {
    return api.post(`/town/treasury/${townClass}/withdraw`, { amount, description });
  },

  // Get tax brackets
  getTaxBrackets: (): Promise<{ data: TaxBracket[] }> => {
    return api.get('/town/tax-brackets');
  },

  // Get tax report for a town
  getTaxReport: (townClass: string, period?: 'week' | 'month' | 'all'): Promise<{ data: TaxReport }> => {
    const params = period ? `?period=${period}` : '';
    return api.get(`/town/tax-report/${townClass}${params}`);
  },

  // Pay salaries to employed students (with tax)
  paySalaries: (townClass: string): Promise<{ data: SalaryPaymentResult }> => {
    return api.post(`/town/pay-salaries/${townClass}`);
  },

  // Pay basic salary to unemployed students
  payBasicSalary: (townClass: string, amount?: number): Promise<{ data: { message: string; paid_count: number; amount_per_student: number; total_paid: number; treasury_balance: number } }> => {
    return api.post(`/town/pay-basic-salary/${townClass}`, amount ? { amount } : {});
  },

  // Toggle tax for a town
  toggleTax: (townClass: string, enabled: boolean): Promise<{ data: { message: string; town: TownSettings } }> => {
    return api.post(`/town/toggle-tax/${townClass}`, { enabled });
  }
};

// Tenders API methods
export const tendersApi = {
  // List tenders (teachers should pass town_class; students are auto-scoped server-side)
  getTenders: (townClass?: '6A' | '6B' | '6C'): Promise<{ data: Tender[] }> => {
    const params = townClass ? `?town_class=${townClass}` : '';
    return api.get(`/tenders${params}`);
  },

  // Create tender (teachers only)
  createTender: (data: { town_class: '6A' | '6B' | '6C'; name: string; description?: string; value: number }): Promise<{ data: Tender }> => {
    return api.post('/tenders', data);
  },

  // Apply to tender (students only)
  applyToTender: (tenderId: number): Promise<{ data: TenderApplication }> => {
    return api.post(`/tenders/${tenderId}/apply`);
  },

  // Get applications for a tender (teachers only)
  getTenderApplications: (tenderId: number): Promise<{ data: { tender: Tender; applications: TenderApplication[] } }> => {
    return api.get(`/tenders/${tenderId}/applications`);
  },

  // Update application status (teachers only)
  updateTenderApplicationStatus: (applicationId: number, status: 'approved' | 'denied'): Promise<{ data: TenderApplication }> => {
    return api.put(`/tenders/applications/${applicationId}`, { status });
  },

  // Pay tender (teachers only)
  payTender: (tenderId: number): Promise<{ data: Tender }> => {
    return api.post(`/tenders/${tenderId}/pay`);
  }
};

export default api;
