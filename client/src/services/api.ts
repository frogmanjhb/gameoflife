import axios from 'axios';
import { 
  MathGameStatus, MathGameStartRequest, MathGameSubmitRequest, 
  ArchitectGameStatus, ArchitectGameStartRequest, ArchitectGameSubmitRequest,
  AccountantGameStatus, AccountantGameStartRequest, AccountantGameSubmitRequest,
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

  // Start a new math game session
  startGame: (data: MathGameStartRequest): Promise<{ data: { session: any } }> => {
    return api.post('/math-game/start', data);
  },

  // Submit math game results
  submitGame: (data: MathGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; isNewHighScore: boolean } }> => {
    return api.post('/math-game/submit', data);
  }
};

// Architect Game API methods
export const architectGameApi = {
  // Get architect game status (remaining plays, high scores, recent sessions)
  getStatus: (): Promise<{ data: ArchitectGameStatus }> => {
    return api.get('/architect-game/status');
  },

  // Start a new architect game session
  startGame: (data: ArchitectGameStartRequest): Promise<{ data: { session: any } }> => {
    return api.post('/architect-game/start', data);
  },

  // Submit architect game results
  submitGame: (data: ArchitectGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> => {
    return api.post('/architect-game/submit', data);
  },

  // Get a random architect question (for client-side generation if needed)
  getQuestion: (difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): Promise<{ data: ArchitectQuestion }> => {
    // Note: This would need to be implemented on backend, or we generate client-side
    // For now, we'll generate questions client-side from the question bank
    return Promise.resolve({ data: { question: '', answer: 0 } });
  }
};

// Accountant (Chartered Accountant) Audit Game API
export const accountantGameApi = {
  getStatus: (): Promise<{ data: AccountantGameStatus }> => api.get('/accountant-game/status'),
  startGame: (data: AccountantGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/accountant-game/start', data),
  submitGame: (data: AccountantGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/accountant-game/submit', data)
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
  },

  // Update job (teachers only)
  updateJob: (jobId: number, data: Partial<{
    name: string;
    description: string;
    salary: number;
    company_name: string;
    location: string;
    requirements: string;
  }>): Promise<{ data: Job }> => {
    return api.put(`/jobs/${jobId}`, data);
  },

  // Get student's application count (students only)
  getMyApplicationCount: (): Promise<{ data: { count: number; maxApplications: number; canApply: boolean } }> => {
    return api.get('/jobs/my-applications/count');
  },

  // Award experience points to student (teachers only)
  awardXP: (userId: number, xpAmount: number): Promise<{ data: { message: string; user: any } }> => {
    return api.post('/jobs/award-xp', { user_id: userId, xp_amount: xpAmount });
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
  },

  // Swap two parcel positions (teachers only)
  swapParcels: (parcelIdA: number, parcelIdB: number): Promise<{ data: { message: string } }> => {
    return api.post('/land/swap', { parcel_id_a: parcelIdA, parcel_id_b: parcelIdB });
  },

  // Recalculate all parcel values to match legend ranges (teachers only)
  recalculateValues: (): Promise<{ data: { message: string; updated: number } }> => {
    return api.post('/land/recalculate-values');
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

// Shop Item type for Winkel management
export interface ShopItem {
  id: number;
  name: string;
  category: 'consumable' | 'privilege' | 'profile';
  price: number;
  description: string | null;
  notes: string | null;
  available: boolean;
  event_day_only: boolean;
  created_at?: string;
  updated_at?: string;
}

// Winkel (Shop) API methods
export const winkelApi = {
  // Get all items including unavailable (teachers only)
  getAllItems: (): Promise<{ data: ShopItem[] }> => {
    return api.get('/winkel/items/all');
  },

  // Create a new shop item
  createItem: (data: {
    name: string;
    category: 'consumable' | 'privilege' | 'profile';
    price: number;
    description?: string;
    notes?: string;
    available?: boolean;
    event_day_only?: boolean;
  }): Promise<{ data: ShopItem }> => {
    return api.post('/winkel/items', data);
  },

  // Update a shop item
  updateItem: (id: number, data: Partial<{
    name: string;
    category: 'consumable' | 'privilege' | 'profile';
    price: number;
    description: string | null;
    notes: string | null;
    available: boolean;
    event_day_only: boolean;
  }>): Promise<{ data: ShopItem }> => {
    return api.put(`/winkel/items/${id}`, data);
  },

  // Delete a shop item
  deleteItem: (id: number): Promise<{ data: { message: string; deleted: boolean; marked_unavailable?: boolean } }> => {
    return api.delete(`/winkel/items/${id}`);
  },

  // Get shop stats (teachers only)
  getStats: (): Promise<{ data: { 
    item_stats: any[]; 
    total_purchases: number; 
    total_revenue: number; 
    shop_balance: number 
  } }> => {
    return api.get('/winkel/stats');
  },

  // Get all purchases (teachers only)
  getPurchases: (): Promise<{ data: any[] }> => {
    return api.get('/winkel/purchases');
  },

  // Get shop settings
  getSettings: (): Promise<{ data: { weekly_purchase_limit: number } }> => {
    return api.get('/winkel/settings');
  },

  // Update shop settings (teachers only)
  updateSettings: (data: { weekly_purchase_limit: number }): Promise<{ data: { message: string; weekly_purchase_limit: number } }> => {
    return api.put('/winkel/settings', data);
  },

  // Check if student can purchase (returns limit info)
  canPurchase: (): Promise<{ data: { 
    canPurchase: boolean; 
    weeklyLimit: number; 
    purchasesThisWeek: number; 
    remainingPurchases: number 
  } }> => {
    return api.get('/winkel/can-purchase');
  },

  // Mark a purchase as paid (teachers only)
  markPurchasePaid: (purchaseId: number): Promise<{ data: { message: string; purchase: any } }> => {
    return api.put(`/winkel/purchases/${purchaseId}/paid`);
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

// Teacher Analytics API methods
export const teacherAnalyticsApi = {
  // Get engagement analytics
  getEngagement: (params?: {
    time_range?: 'day' | 'week' | 'month' | 'year';
    scope?: 'school' | 'classes' | 'students';
    class?: string;
  }): Promise<{ data: import('../types').EngagementAnalytics }> => {
    const queryParams = new URLSearchParams();
    if (params?.time_range) queryParams.append('time_range', params.time_range);
    if (params?.scope) queryParams.append('scope', params.scope);
    if (params?.class) queryParams.append('class', params.class);
    const queryString = queryParams.toString();
    return api.get(`/teacher-analytics/engagement${queryString ? `?${queryString}` : ''}`);
  }
};

export default api;
