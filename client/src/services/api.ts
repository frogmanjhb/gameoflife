import axios from 'axios';
import { 
  MathGameStatus, MathGameStartRequest, MathGameSubmitRequest,
  WordleGameStatus, WordleGuessResponse, WordleCompleteResponse,
  ArchitectGameStatus, ArchitectGameStartRequest, ArchitectGameSubmitRequest,
  AccountantGameStatus, AccountantGameStartRequest, AccountantGameSubmitRequest,
  SoftwareEngineerGameStatus, SoftwareEngineerGameStartRequest, SoftwareEngineerGameSubmitRequest,
  MarketingManagerGameStatus, MarketingManagerGameStartRequest, MarketingManagerGameSubmitRequest,
  GraphicDesignerGameStatus, GraphicDesignerGameStartRequest, GraphicDesignerGameSubmitRequest,
  JournalistGameStatus, JournalistGameStartRequest, JournalistGameSubmitRequest,
  EventPlannerGameStatus, EventPlannerGameStartRequest, EventPlannerGameSubmitRequest,
  FinancialManagerGameStatus, FinancialManagerGameStartRequest, FinancialManagerGameSubmitRequest,
  HRDirectorGameStatus, HRDirectorGameStartRequest, HRDirectorGameSubmitRequest,
  InsuranceManagerGameStatus, InsuranceManagerGameStartRequest, InsuranceManagerGameSubmitRequest,
  PoliceLieutenantGameStatus, PoliceLieutenantGameStartRequest, PoliceLieutenantGameSubmitRequest,
  LawyerGameStatus, LawyerGameStartRequest, LawyerGameSubmitRequest,
  TownPlannerGameStatus, TownPlannerGameStartRequest, TownPlannerGameSubmitRequest,
  ElectricalEngineerGameStatus, ElectricalEngineerGameStartRequest, ElectricalEngineerGameSubmitRequest,
  CivilEngineerGameStatus, CivilEngineerGameStartRequest, CivilEngineerGameSubmitRequest,
  PrincipalGameStatus, PrincipalGameStartRequest, PrincipalGameSubmitRequest,
  TeacherGameStatus, TeacherGameStartRequest, TeacherGameSubmitRequest,
  NurseGameStatus, NurseGameStartRequest, NurseGameSubmitRequest,
  DoctorGameStatus, DoctorGameStartRequest, DoctorGameSubmitRequest,
  DoctorIllnessMyStatus, DoctorIllnessDoctorStatus,
  AttendanceRegisterStatus, AttendanceMySickNote, SickNoteQueueStatus,
  CodeBoardManageStatus, CodeBoardPublicView, CodeBoardAppItem,
  TownNewsManageStatus, TownNewsPublicView, TownNewsStory, TownNewsPopup, TownNewsPopupManageStatus, TownNewsActivePopup,
  ContentSubmissionsPending,
  ClassEventVotingStatus, ClassEventTiming, ClassEventItem,
  FiveMinuteLessonsStatus, FiveMinuteLessonItem,
  RetailManagerGameStatus, RetailManagerGameStartRequest, RetailManagerGameSubmitRequest,
  EntrepreneurGameStatus, EntrepreneurGameStartRequest, EntrepreneurGameSubmitRequest,
  Job, JobApplication, LandParcel, LandPurchaseRequest, LandSaleRequest, 
  LandStats, MyPropertiesResponse, BiomeConfig, BiomeType,
  TaxBracket, TreasuryInfo, TaxReport, TaxEducationResponse, SalaryPaymentResult, TownSettings,
  Tender, TenderApplication, AccountantPendingTransfer, AccountantAssignmentStudent,
  TeacherAccountantAssignmentsResponse,
  TeacherLawyerAssignmentsResponse
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

  // Start a new math game session (pass test: true for teacher test mode – no points/money recorded)
  startGame: (data: MathGameStartRequest & { test?: boolean }): Promise<{ data: { session: any } }> => {
    return api.post('/math-game/start', data);
  },

  // Submit math game results (pass test: true for teacher test mode)
  submitGame: (data: MathGameSubmitRequest & { test?: boolean }): Promise<{ data: { success: boolean; earnings: number; isNewHighScore: boolean } }> => {
    return api.post('/math-game/submit', data);
  }
};

// Wordle Game API methods
export const wordleGameApi = {
  getStatus: (): Promise<{ data: WordleGameStatus }> => {
    return api.get('/wordle-game/status');
  },
  startGame: (options?: { test?: boolean }): Promise<{ data: { session_id: number } }> => {
    return api.post('/wordle-game/start', options ?? {});
  },
  guess: (sessionId: number, guess: string, test?: boolean): Promise<{ data: WordleGuessResponse }> => {
    return api.post('/wordle-game/guess', { session_id: sessionId, guess, ...(test ? { test: true } : {}) });
  },
  complete: (sessionId: number, test?: boolean): Promise<{ data: WordleCompleteResponse }> => {
    return api.post('/wordle-game/complete', { session_id: sessionId, ...(test ? { test: true } : {}) });
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

export const softwareEngineerGameApi = {
  getStatus: (): Promise<{ data: SoftwareEngineerGameStatus }> => api.get('/software-engineer-game/status'),
  startGame: (data: SoftwareEngineerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/software-engineer-game/start', data),
  submitGame: (data: SoftwareEngineerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/software-engineer-game/submit', data)
};

export const marketingManagerGameApi = {
  getStatus: (): Promise<{ data: MarketingManagerGameStatus }> => api.get('/marketing-manager-game/status'),
  startGame: (data: MarketingManagerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/marketing-manager-game/start', data),
  submitGame: (data: MarketingManagerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/marketing-manager-game/submit', data)
};

export const graphicDesignerGameApi = {
  getStatus: (): Promise<{ data: GraphicDesignerGameStatus }> => api.get('/graphic-designer-game/status'),
  startGame: (data: GraphicDesignerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/graphic-designer-game/start', data),
  submitGame: (data: GraphicDesignerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/graphic-designer-game/submit', data)
};

export const journalistGameApi = {
  getStatus: (): Promise<{ data: JournalistGameStatus }> => api.get('/journalist-game/status'),
  startGame: (data: JournalistGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/journalist-game/start', data),
  submitGame: (data: JournalistGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/journalist-game/submit', data)
};

export const eventPlannerGameApi = {
  getStatus: (): Promise<{ data: EventPlannerGameStatus }> => api.get('/event-planner-game/status'),
  startGame: (data: EventPlannerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/event-planner-game/start', data),
  submitGame: (data: EventPlannerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/event-planner-game/submit', data)
};

export const financialManagerGameApi = {
  getStatus: (): Promise<{ data: FinancialManagerGameStatus }> => api.get('/financial-manager-game/status'),
  startGame: (data: FinancialManagerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/financial-manager-game/start', data),
  submitGame: (data: FinancialManagerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/financial-manager-game/submit', data)
};

export const hrDirectorGameApi = {
  getStatus: (): Promise<{ data: HRDirectorGameStatus }> => api.get('/hr-director-game/status'),
  startGame: (data: HRDirectorGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/hr-director-game/start', data),
  submitGame: (data: HRDirectorGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/hr-director-game/submit', data)
};

export const insuranceManagerGameApi = {
  getStatus: (): Promise<{ data: InsuranceManagerGameStatus }> => api.get('/insurance-manager-game/status'),
  startGame: (data: InsuranceManagerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/insurance-manager-game/start', data),
  submitGame: (data: InsuranceManagerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/insurance-manager-game/submit', data)
};

export const policeLieutenantGameApi = {
  getStatus: (): Promise<{ data: PoliceLieutenantGameStatus }> => api.get('/police-lieutenant-game/status'),
  startGame: (data: PoliceLieutenantGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/police-lieutenant-game/start', data),
  submitGame: (data: PoliceLieutenantGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/police-lieutenant-game/submit', data)
};

export const lawyerGameApi = {
  getStatus: (): Promise<{ data: LawyerGameStatus }> => api.get('/lawyer-game/status'),
  startGame: (data: LawyerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/lawyer-game/start', data),
  submitGame: (data: LawyerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/lawyer-game/submit', data)
};

export const townPlannerGameApi = {
  getStatus: (): Promise<{ data: TownPlannerGameStatus }> => api.get('/town-planner-game/status'),
  startGame: (data: TownPlannerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/town-planner-game/start', data),
  submitGame: (data: TownPlannerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/town-planner-game/submit', data)
};

export const electricalEngineerGameApi = {
  getStatus: (): Promise<{ data: ElectricalEngineerGameStatus }> => api.get('/electrical-engineer-game/status'),
  startGame: (data: ElectricalEngineerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/electrical-engineer-game/start', data),
  submitGame: (data: ElectricalEngineerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/electrical-engineer-game/submit', data)
};

export const civilEngineerGameApi = {
  getStatus: (): Promise<{ data: CivilEngineerGameStatus }> => api.get('/civil-engineer-game/status'),
  startGame: (data: CivilEngineerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/civil-engineer-game/start', data),
  submitGame: (data: CivilEngineerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/civil-engineer-game/submit', data)
};

export const principalGameApi = {
  getStatus: (): Promise<{ data: PrincipalGameStatus }> => api.get('/principal-game/status'),
  startGame: (data: PrincipalGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/principal-game/start', data),
  submitGame: (data: PrincipalGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/principal-game/submit', data)
};

export const teacherGameApi = {
  getStatus: (): Promise<{ data: TeacherGameStatus }> => api.get('/teacher-game/status'),
  startGame: (data: TeacherGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/teacher-game/start', data),
  submitGame: (data: TeacherGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/teacher-game/submit', data)
};

export const nurseGameApi = {
  getStatus: (): Promise<{ data: NurseGameStatus }> => api.get('/nurse-game/status'),
  startGame: (data: NurseGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/nurse-game/start', data),
  submitGame: (data: NurseGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/nurse-game/submit', data)
};

export const doctorGameApi = {
  getStatus: (): Promise<{ data: DoctorGameStatus }> => api.get('/doctor-game/status'),
  startGame: (data: DoctorGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/doctor-game/start', data),
  submitGame: (data: DoctorGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/doctor-game/submit', data)
};

export const doctorIllnessApi = {
  getDoctorStatus: (): Promise<{ data: DoctorIllnessDoctorStatus }> =>
    api.get('/doctor-illness/doctor-status'),
  assignRandom: (): Promise<{
    data: {
      success: boolean;
      assignment: {
        id: number;
        patient_username: string;
        patient_display_name: string;
        illness_type: string;
        illness_name: string;
        assigned_at: string;
      };
      remaining_today: number;
      reputation?: import('../types').DoctorReputationStatus;
    };
  }> => api.post('/doctor-illness/assign'),
  getMyStatus: (): Promise<{ data: DoctorIllnessMyStatus }> => api.get('/doctor-illness/my-status'),
  seeDoctor: (): Promise<{
    data: {
      success: boolean;
      cured: boolean;
      pending_cure?: boolean;
      pending_insurance_claim?: boolean;
      cure_fee?: number;
      paid_by_insurance?: boolean;
      doctor_username?: string;
    };
  }> => api.post('/doctor-illness/see-doctor'),
  approveCure: (
    assignmentId: number
  ): Promise<{
    data: {
      success: boolean;
      cured: boolean;
      patient_display_name: string;
      experience_points: number;
      new_level: number | null;
    };
  }> => api.post(`/doctor-illness/approve-cure/${assignmentId}`),
};

export const cyberAttackApi = {
  getEngineerStatus: (): Promise<{ data: import('../types').CyberAttackEngineerStatus }> =>
    api.get('/cyber-attack/engineer-status'),
  assignRandom: (): Promise<{
    data: {
      success: boolean;
      assignment: {
        id: number;
        victim_username: string;
        victim_display_name: string;
        attack_type: string;
        attack_name: string;
        assigned_at: string;
      };
      remaining_today: number;
    };
  }> => api.post('/cyber-attack/assign'),
  getMyStatus: (): Promise<{ data: import('../types').CyberAttackMyStatus }> =>
    api.get('/cyber-attack/my-status'),
  selfResolve: (): Promise<{ data: { success: boolean; repaired: boolean } }> =>
    api.post('/cyber-attack/self-resolve'),
  callIt: (): Promise<{
    data: {
      success: boolean;
      repaired: boolean;
      pending_repair?: boolean;
      pending_insurance_claim?: boolean;
      repair_fee?: number;
      paid_by_insurance?: boolean;
      engineer_username?: string;
    };
  }> => api.post('/cyber-attack/call-it'),
  approveRepair: (
    assignmentId: number
  ): Promise<{
    data: {
      success: boolean;
      repaired: boolean;
      victim_display_name: string;
      experience_points: number;
      new_level: number | null;
    };
  }> => api.post(`/cyber-attack/approve-repair/${assignmentId}`),
};

export const attendanceApi = {
  getRegisterStatus: (): Promise<{ data: AttendanceRegisterStatus }> =>
    api.get('/attendance/register-status'),
  submitRegister: (entries: Array<{ student_user_id: number; status: 'present' | 'absent' }>): Promise<{
    data: {
      success: boolean;
      register_id: number;
      absent_count: number;
      experience_points: number;
      new_level: number | null;
    };
  }> => api.post('/attendance/submit-register', { entries }),
  getMySickNote: (): Promise<{ data: AttendanceMySickNote }> =>
    api.get('/attendance/my-sick-note'),
  submitSickNote: (sick_note_id: number, explanation: string): Promise<{
    data: { success: boolean; status: string; reviewer_label: string };
  }> => api.post('/attendance/submit-sick-note', { sick_note_id, explanation }),
  getSickNoteQueue: (): Promise<{ data: SickNoteQueueStatus }> =>
    api.get('/attendance/sick-note-queue'),
  reviewSickNote: (id: number, approved: boolean): Promise<{
    data: {
      success: boolean;
      approved: boolean;
      student_display_name: string;
      experience_points: number;
      new_level: number | null;
    };
  }> => api.post(`/attendance/review-sick-note/${id}`, { approved }),
};

export interface InsurancePolicy {
  id: number;
  insurance_type: string;
  weeks: number;
  total_cost: number;
  week_start_date: string | null;
  created_at: string;
  status?: 'pending_broker' | 'approved' | 'denied' | 'refunded';
  active?: boolean;
  reviewed_at?: string | null;
  denial_reason?: string | null;
  refunded_at?: string | null;
  refund_amount?: number | null;
}

export interface InsuranceBrokerPendingRequest {
  id: number;
  user_id: number;
  insurance_type: string;
  weeks: number;
  total_cost: number;
  created_at: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  class: string | null;
}

export interface InsuranceBrokerPendingClaim {
  id: number;
  illness_type: string;
  cure_fee: number;
  insurance_claim_requested_at: string;
  patient_username: string;
  patient_display_name: string;
}

export interface InsuranceBrokerPendingCyberClaim {
  id: number;
  attack_type: string;
  repair_fee: number;
  insurance_claim_requested_at: string;
  victim_username: string;
  victim_display_name: string;
}

export interface InsuranceBrokerReviewResult {
  success: boolean;
  status: string;
  applicant_username?: string;
  patient_username?: string;
  patient_display_name?: string;
  victim_username?: string;
  victim_display_name?: string;
  insurance_type?: string;
  cure_fee?: number;
  repair_fee?: number;
  earnings?: number;
  experience_points?: number;
  new_level?: number | null;
}

export interface InsuranceTypeSetting {
  id: 'health' | 'cyber' | 'property';
  enabled: boolean;
}

export const insuranceApi = {
  getQuote: (): Promise<{
    data: {
      salary: number;
      rate_percent: number;
      per_type_per_week: number;
      types: string[];
      type_settings?: InsuranceTypeSetting[];
      broker_required?: boolean;
    };
  }> => api.get('/insurance/quote'),
  getMyPolicies: (): Promise<{ data: InsurancePolicy[] }> => api.get('/insurance/my-policies'),
  purchase: (data: { types: string[]; weeks: number }): Promise<{ data: { message: string; pending_broker?: boolean; status?: string } }> =>
    api.post('/insurance/purchase', data),
  getBrokerPending: (): Promise<{ data: InsuranceBrokerPendingRequest[] }> =>
    api.get('/insurance/broker/pending'),
  getBrokerPendingClaims: (): Promise<{ data: InsuranceBrokerPendingClaim[] }> =>
    api.get('/insurance/broker/pending-claims'),
  getBrokerPendingCyberClaims: (): Promise<{ data: InsuranceBrokerPendingCyberClaim[] }> =>
    api.get('/insurance/broker/pending-cyber-claims'),
  reviewBrokerRequest: (
    id: number,
    data: { status: 'approved' | 'denied'; denial_reason?: string }
  ): Promise<{ data: InsuranceBrokerReviewResult }> =>
    api.put(`/insurance/broker/requests/${id}/review`, data),
  reviewBrokerClaim: (
    assignmentId: number,
    data: { status: 'approved' | 'denied'; denial_reason?: string }
  ): Promise<{ data: InsuranceBrokerReviewResult }> =>
    api.put(`/insurance/broker/claims/${assignmentId}/review`, data),
  reviewBrokerCyberClaim: (
    assignmentId: number,
    data: { status: 'approved' | 'denied'; denial_reason?: string }
  ): Promise<{ data: InsuranceBrokerReviewResult }> =>
    api.put(`/insurance/broker/cyber-claims/${assignmentId}/review`, data),
  refundPurchase: (
    purchaseId: number
  ): Promise<{
    data: {
      success: boolean;
      refund_amount: number;
      original_cost: number;
      refund_percent: number;
      student_username: string;
      insurance_type: string;
    };
  }> => api.post(`/insurance/purchases/${purchaseId}/refund`),
  getTypeSettings: (): Promise<{ data: { types: InsuranceTypeSetting[] } }> =>
    api.get('/insurance/type-settings'),
  setTypeEnabled: (
    type: 'health' | 'cyber' | 'property',
    enabled: boolean
  ): Promise<{ data: { types: InsuranceTypeSetting[] } }> =>
    api.put(`/insurance/type-settings/${type}`, { enabled }),
};

export const retailManagerGameApi = {
  getStatus: (): Promise<{ data: RetailManagerGameStatus }> => api.get('/retail-manager-game/status'),
  startGame: (data: RetailManagerGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/retail-manager-game/start', data),
  submitGame: (data: RetailManagerGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/retail-manager-game/submit', data)
};

export const entrepreneurGameApi = {
  getStatus: (): Promise<{ data: EntrepreneurGameStatus }> => api.get('/entrepreneur-game/status'),
  startGame: (data: EntrepreneurGameStartRequest): Promise<{ data: { session: { id: number } } }> =>
    api.post('/entrepreneur-game/start', data),
  submitGame: (data: EntrepreneurGameSubmitRequest): Promise<{ data: { success: boolean; earnings: number; experience_points: number; new_level: number | null; isNewHighScore: boolean } }> =>
    api.post('/entrepreneur-game/submit', data)
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

  // Get job assignments for current student's class (students only): job name + assigned students
  getClassJobAssignments: (): Promise<{ data: { jobs: { id: number; name: string; assigned_students: { first_name: string; last_name: string; username: string }[] }[] } }> => {
    return api.get('/jobs/assignments/class-view');
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

  // Get student's own job applications (students only)
  getMyApplications: (): Promise<{ data: JobApplication[] }> => {
    return api.get('/jobs/my-applications');
  },

  // Withdraw a pending job application (students only)
  withdrawApplication: (applicationId: number): Promise<{ data: { message: string } }> => {
    return api.delete(`/jobs/my-applications/${applicationId}`);
  },

  // Award experience points to student (teachers only)
  awardXP: (userId: number, xpAmount: number): Promise<{ data: { message: string; user: any } }> => {
    return api.post('/jobs/award-xp', { user_id: userId, xp_amount: xpAmount });
  },

  // Remove experience points from student (teachers only)
  removeXP: (userId: number, xpAmount: number): Promise<{ data: { message: string; user: any } }> => {
    return api.post('/jobs/remove-xp', { user_id: userId, xp_amount: xpAmount });
  }
};

// Business proposals (Entrepreneur job) – students submit, teachers approve/deny
export const businessProposalsApi = {
  submit: (data: { business_name: string; payload: Record<string, unknown> }): Promise<{ data: import('../types').BusinessProposal }> =>
    api.post('/jobs/business-proposals', data),
  getMy: (): Promise<{ data: import('../types').BusinessProposal[] }> =>
    api.get('/jobs/business-proposals/my'),
  list: (): Promise<{ data: import('../types').BusinessProposal[] }> =>
    api.get('/jobs/business-proposals'),
  updateStatus: (id: number, status: 'approved' | 'denied', denialReason?: string): Promise<{ data: import('../types').BusinessProposal }> =>
    api.put(`/jobs/business-proposals/${id}`, { status, denial_reason: denialReason })
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
    townClass?: '6A' | '6B' | '6C';
  }): Promise<{ data: LandParcel[] }> => {
    const params = new URLSearchParams();
    if (filters?.minRow !== undefined) params.append('minRow', filters.minRow.toString());
    if (filters?.maxRow !== undefined) params.append('maxRow', filters.maxRow.toString());
    if (filters?.minCol !== undefined) params.append('minCol', filters.minCol.toString());
    if (filters?.maxCol !== undefined) params.append('maxCol', filters.maxCol.toString());
    if (filters?.owned !== undefined) params.append('owned', filters.owned.toString());
    if (filters?.biome) params.append('biome', filters.biome);
    if (filters?.townClass) params.append('town_class', filters.townClass);
    const queryString = params.toString();
    return api.get(`/land/parcels${queryString ? `?${queryString}` : ''}`);
  },

  // Get single parcel details
  getParcel: (code: string, townClass?: '6A' | '6B' | '6C'): Promise<{ data: LandParcel }> => {
    const params = townClass ? `?town_class=${townClass}` : '';
    return api.get(`/land/parcels/${code}${params}`);
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
  getPurchaseRequests: (
    status?: 'pending_fm' | 'pending_engineer' | 'pending_teacher' | 'approved' | 'denied',
    townClass?: '6A' | '6B' | '6C'
  ): Promise<{ data: LandPurchaseRequest[] }> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (townClass) params.append('town_class', townClass);
    const queryString = params.toString();
    return api.get(`/land/purchase-requests${queryString ? `?${queryString}` : ''}`);
  },

  getEngineerPurchaseRequests: (): Promise<{ data: LandPurchaseRequest[] }> =>
    api.get('/land/purchase-requests?role=engineer'),

  getFmPurchaseRequests: (): Promise<{ data: LandPurchaseRequest[] }> =>
    api.get('/land/purchase-requests/fm-queue'),

  reviewFmPurchaseRequest: (
    id: number,
    status: 'approved' | 'denied',
    denialReason?: string
  ): Promise<{ data: { message: string; request: LandPurchaseRequest; fee_paid?: number } }> =>
    api.put(`/land/purchase-requests/${id}/fm-review`, { status, denial_reason: denialReason }),

  reviewEngineerPurchaseRequest: (
    id: number,
    status: 'approved' | 'denied',
    denialReason?: string
  ): Promise<{ data: { message: string; request: LandPurchaseRequest; fee_paid?: number } }> =>
    api.put(`/land/purchase-requests/${id}/engineer-review`, { status, denial_reason: denialReason }),

  // Update purchase request (teachers only)
  updatePurchaseRequest: (id: number, status: 'approved' | 'denied', denialReason?: string): Promise<{ data: { message: string; request: LandPurchaseRequest } }> => {
    return api.put(`/land/purchase-requests/${id}`, { status, denial_reason: denialReason });
  },

  // Seed land data (teachers only)
  seedLandData: (): Promise<{ data: { message: string; count: number } }> => {
    return api.post('/land/seed');
  },

  // Get land statistics
  getStats: (townClass?: '6A' | '6B' | '6C'): Promise<{ data: LandStats }> => {
    const params = townClass ? `?town_class=${townClass}` : '';
    return api.get(`/land/stats${params}`);
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
  recalculateValues: (townClass?: '6A' | '6B' | '6C'): Promise<{ data: { message: string; updated: number } }> => {
    const params = townClass ? `?town_class=${townClass}` : '';
    return api.post(`/land/recalculate-values${params}`);
  },

  collectRent: (parcelId: number): Promise<{ data: { message: string; amount: number; parcel: LandParcel } }> =>
    api.post(`/land/collect-rent/${parcelId}`),

  createSaleRequest: (parcelId: number, buyerId: number, salePrice: number): Promise<{ data: { message: string; request: LandSaleRequest } }> =>
    api.post('/land/sale-requests', { parcel_id: parcelId, buyer_id: buyerId, sale_price: salePrice }),

  getSaleRequests: (role?: 'seller' | 'buyer' | 'fm'): Promise<{ data: LandSaleRequest[] }> => {
    const params = role ? `?role=${role}` : '';
    return api.get(`/land/sale-requests${params}`);
  },

  reviewSaleRequest: (id: number, status: 'pending_buyer' | 'denied', denialReason?: string): Promise<{ data: { message: string; request: LandSaleRequest } }> =>
    api.put(`/land/sale-requests/${id}/fm-review`, { status, denial_reason: denialReason }),

  acceptSaleRequest: (id: number): Promise<{ data: { message: string; request: LandSaleRequest } }> =>
    api.put(`/land/sale-requests/${id}/accept`),

  cancelSaleRequest: (id: number): Promise<{ data: { message: string } }> =>
    api.put(`/land/sale-requests/${id}/cancel`),

  getClassStudents: (townClass: '6A' | '6B' | '6C'): Promise<{ data: Array<{ id: number; username: string; first_name?: string; last_name?: string; class?: string }> }> =>
    api.get(`/land/class-students?town_class=${townClass}`),

  assignParcelOwner: (parcelId: number, studentId: number): Promise<{ data: { message: string; parcel: LandParcel } }> =>
    api.put(`/land/parcels/${parcelId}/owner`, { student_id: studentId }),

  removeParcelOwner: (parcelId: number): Promise<{ data: { message: string; parcel: LandParcel } }> =>
    api.delete(`/land/parcels/${parcelId}/owner`),
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

  // Get tax education breakdown for the current student (tax by job level)
  getTaxEducation: (): Promise<{ data: TaxEducationResponse }> => {
    return api.get('/town/tax-education');
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

// Transactions API methods
export const transactionsApi = {
  getHistory: (): Promise<{ data: import('../types').Transaction[] }> => {
    return api.get('/transactions/history');
  },
  approveAllPendingTransfers: (): Promise<{
    data: { message: string; approved: number; failed: { id: number; error: string }[] };
  }> => {
    return api.post('/transactions/pending-transfers/approve-all');
  },
  getAccountantAssignments: (): Promise<{ data: AccountantAssignmentStudent[] }> => {
    return api.get('/transactions/my-approvals/assignments');
  },
  getAccountantApprovals: (): Promise<{ data: AccountantPendingTransfer[] }> => {
    return api.get('/transactions/my-approvals');
  },
  approveAsAccountant: (id: number): Promise<{ data: { message: string; xp_awarded?: number; new_level?: number | null } }> => {
    return api.post(`/transactions/my-approvals/${id}/approve`);
  },
  denyAsAccountant: (id: number, denialReason?: string): Promise<{ data: { message: string } }> => {
    return api.post(`/transactions/my-approvals/${id}/deny`, denialReason ? { denial_reason: denialReason } : {});
  },
  getAccountantClientDetails: (
    username: string
  ): Promise<{ data: import('../types').AccountantClientDetailsResponse }> => {
    return api.get(`/transactions/accountant-clients/${encodeURIComponent(username)}/details`);
  },
  submitAccountantClientAdvice: (
    username: string,
    advice: string
  ): Promise<{ data: import('../types').AccountantClientAdviceSubmitResponse }> => {
    return api.post(`/transactions/accountant-clients/${encodeURIComponent(username)}/advice`, { advice });
  },
  getAccountantSalaryDashboard: (): Promise<{ data: import('../types').AccountantSalaryDashboardResponse }> => {
    return api.get('/transactions/accountant-salary-payments');
  },
  payAccountantClientSalary: (
    username: string
  ): Promise<{ data: import('../types').AccountantSalaryPaymentSubmitResponse }> => {
    return api.post(`/transactions/accountant-salary-payments/${encodeURIComponent(username)}`);
  },
};

export interface PoliceFineBonus {
  id: number;
  submitted_by_id: number;
  submitted_by_username: string;
  submitted_by_first_name: string | null;
  submitted_by_last_name: string | null;
  submitted_by_class: string | null;
  target_user_id: number;
  target_username: string;
  target_first_name: string | null;
  target_last_name: string | null;
  target_class: string | null;
  type: 'fine' | 'bonus';
  amount: number;
  description: string | null;
  teacher_initials: string;
  status: 'pending_lawyer' | 'disputed' | 'pending_teacher' | 'approved' | 'denied';
  lawyer_reviewed_by_username?: string | null;
  lawyer_reviewed_by_first_name?: string | null;
  lawyer_reviewed_by_last_name?: string | null;
  lawyer_reviewed_at?: string | null;
  lawyer_notes?: string | null;
  dispute_reason?: string | null;
  police_evidence_response?: string | null;
  lawyer_disputed_at?: string | null;
  police_evidence_at?: string | null;
  reviewed_by_username: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export const policeFinesBonusesApi = {
  submit: (data: {
    type: 'fine' | 'bonus';
    target_username: string;
    description: string;
    amount: number;
    teacher_initials: string;
  }): Promise<{
    data: {
      message: string;
      experience_points?: number;
      new_level?: number | null;
      submit_xp?: number;
      reputation?: import('../types').PoliceReputationStatus;
    };
  }> => api.post('/police-fines-bonuses', data),

  getStatus: (): Promise<{
    data: {
      reputation: import('../types').PoliceReputationStatus | null;
      bonus_approval_earnings: number;
      fine_approval_earnings: number;
    };
  }> => api.get('/police-fines-bonuses/status'),

  getPending: (): Promise<{ data: PoliceFineBonus[] }> =>
    api.get('/police-fines-bonuses?status=pending_teacher'),

  getAll: (): Promise<{ data: PoliceFineBonus[] }> =>
    api.get('/police-fines-bonuses?status=all'),

  getMyHistory: (): Promise<{ data: PoliceFineBonus[] }> =>
    api.get('/police-fines-bonuses/my-history'),

  getLawyerQueue: (): Promise<{ data: PoliceFineBonus[] }> =>
    api.get('/police-fines-bonuses/lawyer-queue'),

  lawyerApprove: (id: number, lawyerNotes?: string): Promise<{ data: { message: string; experience_points?: number; new_level?: number | null } }> =>
    api.post(`/police-fines-bonuses/${id}/lawyer-approve`, lawyerNotes ? { lawyer_notes: lawyerNotes } : {}),

  lawyerDeny: (id: number, lawyerNotes?: string): Promise<{ data: { message: string; experience_points?: number; new_level?: number | null } }> =>
    api.post(`/police-fines-bonuses/${id}/lawyer-deny`, lawyerNotes ? { lawyer_notes: lawyerNotes } : {}),

  dispute: (id: number, disputeReason: string, lawyerNotes?: string): Promise<{ data: { message: string; experience_points?: number; new_level?: number | null } }> =>
    api.post(`/police-fines-bonuses/${id}/dispute`, {
      dispute_reason: disputeReason,
      ...(lawyerNotes ? { lawyer_notes: lawyerNotes } : {}),
    }),

  submitPoliceEvidence: (id: number, policeEvidenceResponse: string): Promise<{ data: { message: string } }> =>
    api.post(`/police-fines-bonuses/${id}/police-evidence`, { police_evidence_response: policeEvidenceResponse }),

  approve: (id: number): Promise<{ data: { message: string } }> =>
    api.post(`/police-fines-bonuses/${id}/approve`),

  deny: (id: number): Promise<{ data: { message: string } }> =>
    api.post(`/police-fines-bonuses/${id}/deny`),
};

export const studentsLawyerApi = {
  getAssignments: (username: string): Promise<{ data: TeacherLawyerAssignmentsResponse }> => {
    return api.get(`/students/${encodeURIComponent(username)}/lawyer-assignments`);
  },
  updateAssignment: (
    username: string,
    studentId: number,
    action: 'add' | 'remove'
  ): Promise<{ data: { message: string; clients: AccountantAssignmentStudent[]; manual_mode: boolean } }> => {
    return api.post(`/students/${encodeURIComponent(username)}/lawyer-assignments`, {
      student_id: studentId,
      action,
    });
  },
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

// Teacher: Chartered Accountant client assignments
export const studentsApi = {
  getMyEarningsProfile: (): Promise<{ data: import('../types').StudentEarningsProfile }> =>
    api.get('/students/me/earnings-profile'),
};

export const studentsAccountantApi = {
  getAssignments: (username: string): Promise<{ data: TeacherAccountantAssignmentsResponse }> => {
    return api.get(`/students/${encodeURIComponent(username)}/accountant-assignments`);
  },
  updateAssignment: (
    username: string,
    studentId: number,
    action: 'add' | 'remove'
  ): Promise<{ data: { message: string; clients: AccountantAssignmentStudent[]; manual_mode: boolean } }> => {
    return api.post(`/students/${encodeURIComponent(username)}/accountant-assignments`, {
      student_id: studentId,
      action,
    });
  },
};

// Teacher Analytics API methods
export const codeBoardApi = {
  getManage: (): Promise<{ data: CodeBoardManageStatus }> => api.get('/code-board/manage'),
  getApps: (params?: { class?: string }): Promise<{ data: CodeBoardPublicView }> =>
    api.get('/code-board/apps', { params }),
  postApp: (data: { title: string; url: string }): Promise<{ data: { app: CodeBoardAppItem; message: string } }> =>
    api.post('/code-board/apps', data),
  deleteApp: (id: number): Promise<{ data: { success: boolean } }> => api.delete(`/code-board/apps/${id}`),
  starApp: (id: number): Promise<{ data: { success: boolean; star_count: number; creator_xp: number; creator_earnings: number } }> =>
    api.post(`/code-board/apps/${id}/star`),
  clickApp: (id: number): Promise<{
    data: {
      success: boolean;
      already_clicked: boolean;
      url: string;
      click_count: number;
      creator_xp?: number;
      creator_earnings?: number;
    };
  }> => api.post(`/code-board/apps/${id}/click`),
};

export const townNewsApi = {
  getManage: (): Promise<{ data: TownNewsManageStatus }> => api.get('/town-news/manage'),
  getStories: (params?: { class?: string }): Promise<{ data: TownNewsPublicView }> =>
    api.get('/town-news/stories', { params }),
  submitStory: (data: {
    headline: string;
    body: string;
    image_data?: string;
    widgets?: import('../types').TownNewsWidgets;
  }): Promise<{
    data: {
      story: TownNewsStory;
      message: string;
    };
  }> => api.post('/town-news/stories', data),
  deleteStory: (id: number): Promise<{ data: { success: boolean } }> =>
    api.delete(`/town-news/stories/${id}`),
  getPopupsManage: (): Promise<{ data: TownNewsPopupManageStatus }> =>
    api.get('/town-news/popups/manage'),
  getActivePopup: (): Promise<{ data: TownNewsActivePopup }> =>
    api.get('/town-news/popups/active'),
  submitPopup: (data: {
    headline: string;
    body: string;
    image_data?: string;
  }): Promise<{
    data: {
      popup: TownNewsPopup;
      message: string;
    };
  }> => api.post('/town-news/popups', data),
  dismissPopup: (id: number): Promise<{ data: { success: boolean } }> =>
    api.post(`/town-news/popups/${id}/dismiss`),
  deletePopup: (id: number): Promise<{ data: { success: boolean } }> =>
    api.delete(`/town-news/popups/${id}`),
};

export const contentSubmissionsApi = {
  getPending: (): Promise<{ data: ContentSubmissionsPending }> => api.get('/content-submissions/pending'),
  reviewNewsStory: (
    id: number,
    data: { status: 'approved' | 'denied'; denial_reason?: string }
  ): Promise<{ data: { success: boolean; status: string } }> =>
    api.post(`/content-submissions/news/${id}/review`, data),
  reviewNewsPopup: (
    id: number,
    data: { status: 'approved' | 'denied'; denial_reason?: string }
  ): Promise<{ data: { success: boolean; status: string } }> =>
    api.post(`/content-submissions/popups/${id}/review`, data),
  reviewCodeApp: (
    id: number,
    data: { status: 'approved' | 'denied'; denial_reason?: string }
  ): Promise<{ data: { success: boolean; status: string } }> =>
    api.post(`/content-submissions/apps/${id}/review`, data),
};

export const classEventsApi = {
  getStatus: (params?: { class?: string }): Promise<{ data: ClassEventVotingStatus }> =>
    api.get('/class-events/status', { params }),
  suggest: (data: { title: string; description?: string; timing: ClassEventTiming }): Promise<{
    data: {
      success: boolean;
      event: ClassEventItem;
      experience_points: number;
      earnings: number;
      new_level: number | null;
      remaining_suggestions: number;
    };
  }> => api.post('/class-events/suggest', data),
  vote: (eventId: number): Promise<{ data: { success: boolean; event_id: number; vote_count: number } }> =>
    api.post(`/class-events/${eventId}/vote`),
  updateSettings: (data: {
    board_visible?: boolean;
    teacher_board_enabled?: boolean;
    town_class?: string;
  }): Promise<{ data: { student_board_visible?: boolean; teacher_board_enabled?: boolean; town_class?: string } }> =>
    api.patch('/class-events/settings', data),
  closeEvent: (eventId: number, townClass: string): Promise<{ data: { success: boolean } }> =>
    api.post(`/class-events/${eventId}/close`, { town_class: townClass }),
  deleteEvent: (eventId: number, townClass: string): Promise<{ data: { success: boolean } }> =>
    api.delete(`/class-events/${eventId}`, { params: { class: townClass } }),
};

export const fiveMinuteLessonsApi = {
  getStatus: (params?: { class?: string }): Promise<{ data: FiveMinuteLessonsStatus }> =>
    api.get('/five-minute-lessons/status', { params }),
  suggest: (data: {
    title: string;
    description?: string;
    class_content: string;
    timing: ClassEventTiming;
  }): Promise<{
    data: {
      success: boolean;
      lesson: FiveMinuteLessonItem;
      remaining_suggestions: number;
      message: string;
    };
  }> => api.post('/five-minute-lessons/suggest', data),
  vote: (lessonId: number): Promise<{ data: { success: boolean; lesson_id: number; vote_count: number } }> =>
    api.post(`/five-minute-lessons/${lessonId}/vote`),
  approve: (
    lessonId: number,
    townClass: string
  ): Promise<{
    data: {
      success: boolean;
      experience_points: number;
      earnings: number;
      new_level: number | null;
    };
  }> => api.post(`/five-minute-lessons/${lessonId}/approve`, { town_class: townClass }),
  deny: (
    lessonId: number,
    townClass: string,
    denial_reason?: string
  ): Promise<{ data: { success: boolean } }> =>
    api.post(`/five-minute-lessons/${lessonId}/deny`, { town_class: townClass, denial_reason }),
  updateSettings: (data: {
    board_visible?: boolean;
    teacher_board_enabled?: boolean;
    town_class?: string;
  }): Promise<{ data: { student_board_visible?: boolean; teacher_board_enabled?: boolean; town_class?: string } }> =>
    api.patch('/five-minute-lessons/settings', data),
  closeLesson: (lessonId: number, townClass: string): Promise<{ data: { success: boolean } }> =>
    api.post(`/five-minute-lessons/${lessonId}/close`, { town_class: townClass }),
  deleteLesson: (lessonId: number, townClass: string): Promise<{ data: { success: boolean } }> =>
    api.delete(`/five-minute-lessons/${lessonId}`, { params: { class: townClass } }),
};

export const teacherAnalyticsApi = {
  // Get engagement analytics
  getEngagement: (params?: {
    time_range?: 'day' | 'week' | 'month' | 'year';
    scope?: 'school' | 'classes' | 'students';
    class?: string;
  }): Promise<{ data: import('../types').EngagementAnalytics }> => {
    const queryParams = new URLSearchParams();
    if (params?.time_range != null) queryParams.append('time_range', params.time_range);
    if (params?.scope != null) queryParams.append('scope', params.scope);
    if (params?.class != null) queryParams.append('class', params.class);
    const queryString = queryParams.toString();
    return api.get(`/teacher-analytics/engagement${queryString ? `?${queryString}` : ''}`);
  },
  // Get all students with total logins for the Student Total logins section (own time filter)
  getStudentLogins: (params?: { time_range?: 'week' | 'month' | 'year' }): Promise<{
    data: { time_range: string; start_date: string; students: import('../types').StudentLoginRow[] };
  }> => {
    const queryParams = new URLSearchParams();
    if (params?.time_range) queryParams.append('time_range', params.time_range);
    const queryString = queryParams.toString();
    return api.get(`/teacher-analytics/student-logins${queryString ? `?${queryString}` : ''}`);
  },
};

export interface ProceedingsStep {
  key: string;
  label: string;
  state: 'complete' | 'current' | 'pending' | 'skipped';
  summary?: string;
  detail?: string;
  at?: string | null;
  waiting_message?: string;
}

export interface StudentLawsuit {
  id: number;
  school_id: number | null;
  town_class: string;
  plaintiff_user_id: number;
  defendant_user_id: number;
  plaintiff_username: string;
  plaintiff_first_name?: string | null;
  plaintiff_last_name?: string | null;
  defendant_username: string;
  defendant_first_name?: string | null;
  defendant_last_name?: string | null;
  claim_amount: number;
  awarded_amount?: number | null;
  description: string;
  rule_reference: string;
  linked_action_type?: string | null;
  linked_action_id?: number | null;
  status: string;
  defendant_response?: string | null;
  escrow_amount?: number | null;
  escrow_held_at?: string | null;
  plaintiff_lawyer_acceptance?: string;
  lawyer_conflict?: boolean;
  teacher_hr_required?: boolean;
  hr_notes?: string | null;
  hr_outcome?: string | null;
  hr_recommended_amount?: number | null;
  plaintiff_lawyer_opinion?: string | null;
  plaintiff_lawyer_notes?: string | null;
  plaintiff_lawyer_reviewed_at?: string | null;
  defendant_lawyer_opinion?: string | null;
  defendant_lawyer_notes?: string | null;
  defendant_lawyer_reviewed_at?: string | null;
  jury_verdict?: string | null;
  jury_guilty_votes?: number;
  jury_not_guilty_votes?: number;
  jury_skipped_reason?: string | null;
  teacher_initials?: string | null;
  denial_reason?: string | null;
  created_at: string;
  updated_at: string;
  proceedings_timeline?: ProceedingsStep[];
  my_vote?: string | null;
}

export interface LinkableAction {
  type: string;
  id: number;
  label: string;
  created_at: string;
}

export const lawsuitsApi = {
  file: (data: {
    defendant_username: string;
    claim_amount: number;
    description: string;
    rule_reference: string;
    linked_action_type?: string;
    linked_action_id?: number;
  }): Promise<{ data: StudentLawsuit }> => api.post('/lawsuits', data),

  getMyCases: (scope: 'current' | 'past' = 'current'): Promise<{ data: StudentLawsuit[] }> =>
    api.get(`/lawsuits/my-cases?scope=${scope}`),

  getSchoolCases: (scope: 'current' | 'past' = 'current', townClass?: string): Promise<{ data: StudentLawsuit[] }> => {
    const params = new URLSearchParams({ scope });
    if (townClass) params.append('town_class', townClass);
    return api.get(`/lawsuits/school-cases?${params.toString()}`);
  },

  getCase: (id: number): Promise<{ data: StudentLawsuit }> => api.get(`/lawsuits/${id}`),

  getPendingTeacher: (): Promise<{ data: StudentLawsuit[] }> =>
    api.get('/lawsuits?status=pending_teacher'),

  withdraw: (id: number): Promise<{ data: { message: string } }> => api.post(`/lawsuits/${id}/withdraw`),

  defendantResponse: (id: number, response: string): Promise<{ data: { message: string } }> =>
    api.post(`/lawsuits/${id}/defendant-response`, { response }),

  getHrQueue: (): Promise<{ data: StudentLawsuit[] }> => api.get('/lawsuits/hr-queue'),

  hrReview: (
    id: number,
    data: {
      outcome: 'resolved_no_damages' | 'settlement_recommended' | 'escalated';
      hr_notes: string;
      hr_recommended_amount?: number;
      plaintiff_consents_settlement?: boolean;
      defendant_consents_settlement?: boolean;
    }
  ): Promise<{ data: { message: string; experience_points?: number; new_level?: number | null } }> =>
    api.post(`/lawsuits/${id}/hr-review`, data),

  getLawyerQueue: (): Promise<{
    data: { plaintiff_clients: StudentLawsuit[]; defendant_clients: StudentLawsuit[] };
  }> => api.get('/lawsuits/lawyer-queue'),

  lawyerAccept: (id: number): Promise<{ data: { message: string } }> => api.post(`/lawsuits/${id}/lawyer-accept`),

  lawyerDecline: (id: number): Promise<{ data: { message: string } }> => api.post(`/lawsuits/${id}/lawyer-decline`),

  lawyerOpinion: (
    id: number,
    data: { opinion: string; legal_notes: string }
  ): Promise<{ data: { message: string; experience_points?: number; new_level?: number | null } }> =>
    api.post(`/lawsuits/${id}/lawyer-opinion`, data),

  getJuryDuty: (): Promise<{ data: StudentLawsuit[] }> => api.get('/lawsuits/jury-duty'),

  juryVote: (
    id: number,
    vote: 'guilty' | 'not_guilty'
  ): Promise<{ data: { message: string; jury_complete: boolean; experience_points?: number; new_level?: number | null } }> =>
    api.post(`/lawsuits/${id}/jury-vote`, { vote }),

  approve: (
    id: number,
    data: { awarded_amount: number; teacher_initials: string; teacher_notes?: string }
  ): Promise<{ data: { message: string; awarded_amount: number } }> => api.post(`/lawsuits/${id}/approve`, data),

  deny: (
    id: number,
    data: { teacher_initials: string; denial_reason: string }
  ): Promise<{ data: { message: string } }> => api.post(`/lawsuits/${id}/deny`, data),

  getLinkableActions: (defendantUsername: string): Promise<{ data: { actions: LinkableAction[] } }> =>
    api.get(`/lawsuits/linkable-actions?defendant_username=${encodeURIComponent(defendantUsername)}`),
};

export default api;
