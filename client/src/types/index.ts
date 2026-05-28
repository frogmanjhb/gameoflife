export interface User {
  id: number;
  username: string;
  role: 'student' | 'teacher' | 'super_admin';
  first_name?: string;
  last_name?: string;
  class?: string;
  email?: string;
  school_id?: number | null;
  job_id?: number;
  job_level?: number;
  job_name?: string;
  job_description?: string;
  job_salary?: number;
  job_requirements?: string;
  job_company_name?: string;
  job_location?: string;
  profile_emoji?: string;
  rules_agreed_at?: string | null;
  account_frozen?: boolean;
  game_start_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: number;
  user_id: number;
  account_number: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: number;
  from_account_id?: number;
  to_account_id?: number;
  amount: number;
  transaction_type: 'deposit' | 'withdrawal' | 'transfer' | 'loan_disbursement' | 'loan_repayment' | 'salary' | 'fine';
  description?: string;
  created_at: string;
  from_username?: string;
  to_username?: string;
}

export interface Loan {
  id: number;
  borrower_id: number;
  amount: number;
  term_months: number;
  term_weeks?: number;
  interest_rate: number;
  status: 'pending' | 'approved' | 'denied' | 'active' | 'paid_off';
  outstanding_balance: number;
  monthly_payment: number;
  weekly_payment?: number;
  next_payment_date?: string;
  last_payment_date?: string;
  job_id_at_approval?: number;
  salary_at_approval?: number;
  created_at: string;
  approved_at?: string;
  due_date?: string;
  borrower_username?: string;
  total_paid?: number;
  payments_remaining?: number;
}

export interface Student {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  email?: string;
  status?: 'pending' | 'approved' | 'denied';
  account_frozen?: boolean;
  created_at: string;
  account_number: string;
  balance: number;
  last_activity: string;
  job_id?: number;
  job_name?: string;
  job_salary?: number;
}

export interface AuthContextType {
  user: User | null;
  account: Account | null;
  login: (username: string, password: string, schoolId?: number | null) => Promise<void>;
  register: (username: string, password: string, role: 'student' | 'teacher', schoolId: number, first_name?: string, last_name?: string, studentClass?: string, email?: string) => Promise<any>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  loading: boolean;
}

export interface MathGameSession {
  id: number;
  user_id: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  score: number;
  correct_answers: number;
  total_problems: number;
  earnings: number;
  played_at: string;
}

export interface MathGameStatus {
  enabled?: boolean;
  remaining_plays: number;
  daily_limit: number;
  high_scores: {
    easy: number;
    medium: number;
    hard: number;
    extreme: number;
  };
  recent_sessions: MathGameSession[];
}

export interface WordleGameSession {
  id: number;
  status: string;
  guesses_count: number;
  earnings: number;
  played_at: string;
}

export interface WordleGameStatus {
  enabled?: boolean;
  remaining_plays: number;
  daily_limit: number;
  recent_sessions: WordleGameSession[];
}

export interface WordleGuessResponse {
  feedback: number[];
  game_over: boolean;
  won: boolean;
  guesses_count: number;
}

export interface WordleCompleteResponse {
  success: boolean;
  earnings: number;
  experience_points: number;
  new_level: number | null;
}

export interface MathProblem {
  num1: number;
  num2: number;
  operation: '+' | '-' | '×' | '÷';
  answer: number;
  display: string;
}

export interface MathGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface MathGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface ArchitectGameSession {
  id: number;
  user_id: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  score: number;
  correct_answers: number;
  total_problems: number;
  experience_points: number;
  earnings: number;
  played_at: string;
}

export interface ArchitectGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: {
    easy: number;
    medium: number;
    hard: number;
    extreme: number;
  };
  recent_sessions: ArchitectGameSession[];
}

export interface ArchitectQuestion {
  question: string;
  answer: number;
  explanation?: string;
}

export interface ArchitectGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface ArchitectGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

// Accountant (Chartered Accountant) Audit Game – same shape as architect
export interface AccountantGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface AccountantGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface AccountantGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface SoftwareEngineerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface SoftwareEngineerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface SoftwareEngineerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface MarketingManagerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface MarketingManagerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface MarketingManagerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface GraphicDesignerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface GraphicDesignerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface GraphicDesignerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface JournalistGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface JournalistGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface JournalistGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface EventPlannerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface EventPlannerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface EventPlannerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface FinancialManagerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface FinancialManagerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface FinancialManagerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface HRDirectorGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface HRDirectorGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface HRDirectorGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface PoliceLieutenantGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface PoliceLieutenantGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface PoliceLieutenantGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface LawyerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface LawyerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface LawyerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface TownPlannerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface TownPlannerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface TownPlannerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface ElectricalEngineerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface ElectricalEngineerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface ElectricalEngineerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface CivilEngineerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface CivilEngineerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface CivilEngineerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface PrincipalGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface PrincipalGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface PrincipalGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface TeacherGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface TeacherGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface TeacherGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface NurseGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface NurseGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface NurseGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface DoctorGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface DoctorGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface DoctorGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export type DoctorIllnessType = 'verdigris_vertigo' | 'button_lock_fever' | 'creep_crawlies';

export interface DoctorIllnessMyStatus {
  active: boolean;
  illness_type?: DoctorIllnessType;
  illness_name?: string;
  illness_description?: string;
  assigned_at?: string;
  see_doctor_available_at?: string;
  can_see_doctor?: boolean;
  seconds_until_see_doctor?: number;
  pending_cure?: boolean;
  pending_insurance_claim?: boolean;
  cure_fee?: number;
  doctor_username?: string;
  doctor_display_name?: string;
  health_insurance_covers_clinic?: boolean;
  insurance_broker_required?: boolean;
}

export interface DoctorIllnessPendingCure {
  id: number;
  patient_username: string;
  patient_display_name: string;
  illness_type: DoctorIllnessType;
  illness_name: string;
  cure_fee: number;
  cure_requested_at: string;
}

export interface DoctorIllnessDoctorStatus {
  remaining_today: number;
  daily_limit: number;
  cure_fee: number;
  cure_approve_xp: number;
  pending_cures: DoctorIllnessPendingCure[];
  recent_assignments: Array<{
    id: number;
    patient_username: string;
    patient_display_name: string;
    illness_type: DoctorIllnessType;
    illness_name: string;
    assigned_at: string;
    cured_at: string | null;
    illness_status: 'sick' | 'pending_cure' | 'recovered';
  }>;
}

export type CyberAttackType = 'spyware_popup_storm';

export interface CyberAttackMyStatus {
  active: boolean;
  attack_type?: CyberAttackType;
  attack_name?: string;
  attack_description?: string;
  assigned_at?: string;
  pending_repair?: boolean;
  pending_insurance_claim?: boolean;
  repair_fee?: number;
  engineer_username?: string;
  engineer_display_name?: string;
  cyber_insurance_covers_repair?: boolean;
  insurance_broker_required?: boolean;
}

export interface CyberAttackPendingRepair {
  id: number;
  victim_username: string;
  victim_display_name: string;
  attack_type: CyberAttackType;
  attack_name: string;
  repair_fee: number;
  repair_requested_at: string;
}

export interface CyberAttackEngineerStatus {
  remaining_today: number;
  daily_limit: number;
  repair_fee: number;
  repair_approve_xp: number;
  pending_repairs: CyberAttackPendingRepair[];
  recent_assignments: Array<{
    id: number;
    victim_username: string;
    victim_display_name: string;
    attack_type: CyberAttackType;
    attack_name: string;
    assigned_at: string;
    repaired_at: string | null;
    attack_status: 'active' | 'pending_repair' | 'repaired';
  }>;
}

export interface AttendanceRegisterStudent {
  id: number;
  username: string;
  display_name: string;
}

export interface AttendanceRegisterStatus {
  can_submit: boolean;
  submitter_role: 'nurse' | 'doctor' | null;
  already_submitted_today: boolean;
  submit_xp: number;
  pay_penalty_factor: number;
  students: AttendanceRegisterStudent[];
  today_entries?: Array<{ student_user_id: number; status: 'present' | 'absent' }>;
  reason?: string | null;
}

export interface AttendanceMySickNote {
  required: boolean;
  sick_note?: {
    id: number;
    register_date: string;
    reviewer_role: string;
    reviewer_label: string;
  };
}

export interface SickNoteQueueItem {
  id: number;
  student_username: string;
  student_display_name: string;
  explanation: string;
  submitted_at: string;
  register_date: string;
}

export interface SickNoteQueueStatus {
  pending: SickNoteQueueItem[];
  approve_xp: number;
}

export interface RetailManagerGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface RetailManagerGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface RetailManagerGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface EntrepreneurGameStatus {
  remaining_plays: number;
  daily_limit: number;
  high_scores: { easy: number; medium: number; hard: number; extreme: number };
  recent_sessions: Array<{
    id: number;
    user_id: number;
    difficulty: string;
    score: number;
    correct_answers: number;
    total_problems: number;
    experience_points: number;
    earnings: number;
    played_at: string;
  }>;
}

export interface EntrepreneurGameStartRequest {
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
}

export interface EntrepreneurGameSubmitRequest {
  session_id: number;
  score: number;
  correct_answers: number;
  total_problems: number;
  answer_sequence: boolean[];
}

export interface Plugin {
  id: number;
  name: string;
  enabled: boolean;
  route_path: string;
  icon?: string;
  description?: string;
  created_at: string;
}

export interface CodeBoardAppItem {
  id: number;
  title: string;
  url: string;
  star_count: number;
  click_count: number;
  created_at: string;
  status?: ContentSubmissionStatus;
  denial_reason?: string | null;
  engineer_user_id?: number;
  engineer_name?: string;
  is_own_app?: boolean;
  has_starred?: boolean;
  has_clicked?: boolean;
}

export interface CodeBoardManageStatus {
  apps: CodeBoardAppItem[];
  max_apps: number;
  star_xp_reward: number;
  star_earnings_reward: number;
  click_xp_reward: number;
  click_earnings_reward: number;
}

export interface CodeBoardPublicView {
  apps: CodeBoardAppItem[];
  star_xp_reward: number;
  star_earnings_reward: number;
  click_xp_reward: number;
  click_earnings_reward: number;
}

export type ContentSubmissionStatus = 'pending' | 'approved' | 'denied';

export interface TownNewsStory {
  id: number;
  headline: string;
  body: string;
  image_data?: string | null;
  created_at: string;
  status?: ContentSubmissionStatus;
  denial_reason?: string | null;
  journalist_name?: string;
}

export interface TownNewsManageStatus {
  stories: TownNewsStory[];
  story_xp_reward: number;
  story_earnings_reward: number;
}

export interface TownNewsPublicView {
  stories: TownNewsStory[];
}

export interface PendingNewsStorySubmission {
  id: number;
  headline: string;
  body: string;
  image_data?: string | null;
  town_class: string;
  status: ContentSubmissionStatus;
  created_at: string;
  submitter_name: string;
  submitter_username: string;
}

export interface PendingCodeAppSubmission {
  id: number;
  title: string;
  url: string;
  town_class: string;
  status: ContentSubmissionStatus;
  created_at: string;
  submitter_name: string;
  submitter_username: string;
}

export interface ContentSubmissionsPending {
  news_stories: PendingNewsStorySubmission[];
  code_apps: PendingCodeAppSubmission[];
  pending_count: number;
  story_xp_reward: number;
  story_earnings_reward: number;
}

export type ClassEventTiming = 'before_class' | 'after_class' | 'during_class';

export interface ClassEventItem {
  id: number;
  title: string;
  description?: string | null;
  timing: ClassEventTiming;
  timing_label: string;
  status: 'open' | 'closed';
  vote_count: number;
  has_voted: boolean;
  suggested_by_user_id: number;
  suggester_username?: string;
  suggester_name?: string;
  created_at: string;
}

export interface ClassEventVotingStatus {
  teacher_board_enabled: boolean;
  student_board_visible: boolean;
  board_active: boolean;
  is_event_planner: boolean;
  suggestions_this_week: number;
  suggestions_per_week: number;
  remaining_suggestions: number;
  suggestion_xp_reward: number;
  suggestion_earnings_reward: number;
  events: ClassEventItem[];
  needs_vote: boolean;
  town_class?: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  town_class: '6A' | '6B' | '6C';
  created_by: number;
  created_by_username?: string;
  background_color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  enable_wiggle?: boolean;
  created_at: string;
  updated_at: string;
}

export interface TownSettings {
  id: number;
  class: '6A' | '6B' | '6C';
  town_name: string;
  mayor_name?: string;
  tax_rate: number;
  tax_enabled: boolean;
  job_applications_enabled?: boolean;
  job_game_daily_limit?: number;
  show_mayor_job_card?: boolean;
  treasury_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: number;
  name: string;
  description?: string;
  salary: number; // Calculated salary (for backward compatibility)
  base_salary?: number; // Base salary (default R2000)
  is_contractual?: boolean; // Contractual jobs earn 1.5x more
  requirements?: string;
  company_name?: string;
  location?: string;
  created_at: string;
  is_fulfilled?: boolean;
  assigned_count?: number;
  assigned_to_name?: string;
}

export interface JobApplication {
  id: number;
  user_id: number;
  job_id: number;
  answers: Record<string, string | string[]>;
  status: 'pending' | 'approved' | 'denied';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  job_name?: string;
  job_salary?: number;
  job_description?: string;
  job_requirements?: string;
  reviewer_username?: string;
}

/** Business proposal form payload (Entrepreneur job) */
export interface BusinessProposalPayload {
  entrepreneur_name?: string;
  town_biome?: string;
  business_model?: 'product' | 'service' | 'hybrid';
  industry_type?: string[];
  problem_solved?: string;
  product_service_description?: string;
  target_customers?: string[];
  pricing_type?: 'per_unit' | 'per_hour' | 'per_job' | 'weekly_contract';
  price_per_unit?: number;
  estimated_units_per_week?: number;
  cost_per_unit?: number;
  weekly_fixed_costs?: number;
  startup_cost?: number;
  need_loan?: boolean;
  loan_amount_requested?: number;
  biome_impact?: string;
  risk_level?: 'low' | 'medium' | 'high';
  growth_plan?: string[];
  growth_explanation?: string;
  [key: string]: unknown;
}

export interface BusinessProposal {
  id: number;
  user_id: number;
  school_id?: number | null;
  status: 'pending' | 'approved' | 'denied';
  business_name: string;
  payload: BusinessProposalPayload;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: number | null;
  denial_reason?: string | null;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_class?: string;
}

export interface AccountantPendingTransfer {
  id: number;
  from_user_id: number;
  to_user_id: number;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  denial_reason?: string | null;
  from_username: string;
  from_first_name?: string;
  from_last_name?: string;
  from_class?: string;
  to_username: string;
  to_first_name?: string;
  to_last_name?: string;
  to_class?: string;
  reviewed_by_username?: string;
}

export interface AccountantAssignmentStudent {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
}

export interface AccountantAssignmentLink {
  accountant_user_id: number;
  accountant_username: string;
  accountant_first_name?: string | null;
  accountant_last_name?: string | null;
}

export interface AccountantAssignableStudent extends AccountantAssignmentStudent {
  job_name?: string | null;
  assigned_accountants: AccountantAssignmentLink[];
}

export interface TeacherAccountantAssignmentsResponse {
  clients: AccountantAssignmentStudent[];
  assignable: AccountantAssignableStudent[];
  manual_mode: boolean;
}

export interface LawyerAssignmentLink {
  lawyer_user_id: number;
  lawyer_username: string;
  lawyer_first_name?: string | null;
  lawyer_last_name?: string | null;
}

export interface LawyerAssignableStudent extends AccountantAssignmentStudent {
  job_name?: string | null;
  assigned_lawyers: LawyerAssignmentLink[];
}

export interface TeacherLawyerAssignmentsResponse {
  clients: AccountantAssignmentStudent[];
  assignable: LawyerAssignableStudent[];
  manual_mode: boolean;
}

export type QuestionType = 'short_answer' | 'long_answer' | 'multiple_choice' | 'yes_no';

export interface ApplicationQuestion {
  id: string;
  type: QuestionType;
  label: string;
  required: boolean;
  options?: string[]; // For multiple choice
}

export interface ApplicationAnswer {
  question_id: string;
  answer: string | string[];
}

// Land Registry Types
export type BiomeType = 
  | 'Savanna' 
  | 'Grassland' 
  | 'Forest' 
  | 'Fynbos' 
  | 'Nama Karoo' 
  | 'Succulent Karoo' 
  | 'Desert' 
  | 'Thicket' 
  | 'Indian Ocean Coastal Belt';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface LandParcel {
  id: number;
  grid_code: string;
  row_index: number;
  col_index: number;
  biome_type: BiomeType;
  town_class: '6A' | '6B' | '6C';
  value: number;
  risk_level: RiskLevel;
  pros: string[];
  cons: string[];
  owner_id?: number;
  owner_username?: string;
  owner_first_name?: string;
  owner_last_name?: string;
  purchased_at?: string;
  purchase_price?: number;
  last_rent_collected_at?: string;
  current_value?: number;
  weekly_rent?: number;
  can_collect_rent?: boolean;
  weeks_owned?: number;
  appreciation?: number;
  created_at: string;
  updated_at: string;
  pending_request?: LandPurchaseRequest;
}

export interface LandPurchaseRequest {
  id: number;
  user_id: number;
  parcel_id: number;
  offered_price: number;
  status: 'pending_fm' | 'pending_engineer' | 'pending_teacher' | 'approved' | 'denied';
  fm_reviewed_by?: number;
  fm_reviewed_at?: string;
  fm_reviewer_username?: string;
  reviewed_by?: number;
  reviewed_at?: string;
  denial_reason?: string;
  created_at: string;
  updated_at: string;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_class?: string;
  parcel_grid_code?: string;
  parcel_biome_type?: BiomeType;
  parcel_value?: number;
  parcel_town_class?: '6A' | '6B' | '6C';
  reviewer_username?: string;
  engineer_approvals?: Array<{
    approver_id: number;
    approver_username?: string;
    approver_first_name?: string;
    approver_last_name?: string;
    job_name?: string;
    fee_amount: number;
    approved_at: string;
  }>;
  required_engineers?: Array<{
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    job_name: string;
  }>;
  engineer_approvals_received?: number;
  engineer_approvals_required?: number;
  engineer_fee_total?: number;
  engineer_fee_per_approver?: number;
  fm_fee?: number;
  professional_fee_total?: number;
  cost_breakdown?: {
    plot_price: number;
    professional_fee_total: number;
    fm_fee: number;
    engineer_fee_total: number;
    engineer_fee_per_approver: number;
    total_required: number;
    buyer_balance: number;
    can_afford: boolean;
  };
}

export interface LandSaleRequest {
  id: number;
  parcel_id: number;
  seller_id: number;
  buyer_id: number;
  sale_price: number;
  status: 'pending_fm' | 'pending_buyer' | 'completed' | 'denied' | 'cancelled';
  fm_reviewed_by?: number;
  fm_reviewed_at?: string;
  denial_reason?: string;
  buyer_responded_at?: string;
  school_id?: number;
  created_at: string;
  updated_at: string;
  parcel_grid_code?: string;
  parcel_biome_type?: BiomeType;
  parcel_town_class?: '6A' | '6B' | '6C';
  seller_username?: string;
  seller_first_name?: string;
  seller_last_name?: string;
  buyer_username?: string;
  buyer_first_name?: string;
  buyer_last_name?: string;
  fm_reviewer_username?: string;
}

export interface LandStats {
  total_parcels: number;
  owned_parcels: number;
  available_parcels: number;
  pending_requests: number;
  town_class?: '6A' | '6B' | '6C';
  biome_stats: Array<{
    biome_type: BiomeType;
    count: number;
    owned_count: number;
    avg_value: number;
  }>;
  top_owners: Array<{
    username: string;
    first_name?: string;
    last_name?: string;
    parcel_count: number;
    total_value: number;
  }>;
}

export interface MyPropertiesResponse {
  parcels: LandParcel[];
  total_count: number;
  total_value: number;
  total_purchase_value?: number;
}

export interface BiomeConfig {
  baseValue: number;
  risk: RiskLevel;
  pros: string[];
  cons: string[];
  color: string;
  lightColor: string;
}

// Treasury and Tax Types
export interface TaxBracket {
  id: number;
  min_salary: number;
  max_salary?: number;
  tax_rate: number;
  created_at: string;
}

export interface TaxTransaction {
  id: number;
  user_id: number;
  town_class: '6A' | '6B' | '6C';
  gross_amount: number;
  tax_amount: number;
  net_amount: number;
  tax_rate_applied: number;
  transaction_type: 'salary' | 'bonus' | 'game_earnings';
  description?: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TreasuryTransaction {
  id: number;
  town_class: '6A' | '6B' | '6C';
  amount: number;
  transaction_type: 'tax_collection' | 'salary_payment' | 'deposit' | 'withdrawal' | 'initial_balance';
  description?: string;
  created_by?: number;
  created_at: string;
  created_by_username?: string;
}

export interface TreasuryInfo {
  treasury_balance: number;
  tax_enabled: boolean;
  tax_rate: number;
  transactions: TreasuryTransaction[];
  stats: {
    total_tax_collected: number;
    total_salaries_paid: number;
    total_deposits: number;
    total_withdrawals: number;
  };
}

export interface TaxReport {
  student_taxes: Array<{
    user_id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    total_gross: number;
    total_tax_paid: number;
    total_net: number;
    payment_count: number;
  }>;
  summary: {
    total_gross: number;
    total_tax: number;
    total_net: number;
    total_payments: number;
    avg_tax_rate: number;
  };
  recent_transactions: TaxTransaction[];
}

export interface TaxEducationLevel {
  level: number;
  gross_salary: number;
  tax_rate: number;
  tax_amount: number;
  net_salary: number;
}

export interface TaxEducationResponse {
  town_class: '6A' | '6B' | '6C';
  tax_enabled: boolean;
  current_job_level: number;
  job_is_contractual: boolean;
  job_base_salary: number;
  levels: TaxEducationLevel[];
}

export interface SalaryPaymentResult {
  message: string;
  paid_count: number;
  total_gross: number;
  total_tax: number;
  total_net: number;
  treasury_balance: number;
  payment_details: Array<{
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    job_name: string;
    gross_salary: number;
    tax_rate: number;
    tax_amount: number;
    net_salary: number;
  }>;
}

// Tenders Types
export type TenderStatus = 'open' | 'awarded' | 'closed';
export type TenderApplicationStatus = 'pending' | 'approved' | 'denied';

export interface Tender {
  id: number;
  town_class: '6A' | '6B' | '6C';
  name: string;
  description?: string;
  value: number;
  status: TenderStatus;
  created_by?: number;
  created_by_username?: string;
  awarded_to_user_id?: number;
  awarded_to_username?: string;
  awarded_application_id?: number;
  awarded_at?: string;
  paid?: boolean;
  paid_at?: string;
  paid_by?: number;
  created_at: string;
  // Teacher list extras
  application_count?: number;
  pending_count?: number;
  // Student list extras
  my_application_id?: number;
  my_application_status?: TenderApplicationStatus;
}

export interface TenderApplication {
  id: number;
  tender_id: number;
  applicant_id: number;
  status: TenderApplicationStatus;
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  applicant_username?: string;
  applicant_first_name?: string;
  applicant_last_name?: string;
  applicant_class?: string;
  reviewer_username?: string;
}

// Teacher Analytics Types
export interface EngagementTimeSeries {
  time_bucket: string;
  logins: number;
  chores_users: number;
  chores_sessions: number;
  transfers_users: number;
  transfers_count: number;
  purchases_users: number;
  purchases_count: number;
}

export interface EngagementByClass {
  class: string;
  /** Display name from town_settings (town_name); use for charts to match town data */
  town_name?: string;
  logins: number;
  chores_users: number;
  chores_sessions: number;
  transfers_users: number;
  transfers_count: number;
  purchases_users: number;
  purchases_count: number;
}

export interface EngagementByStudent {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  logins: number;
  chores_sessions: number;
  transfers_count: number;
  purchases_count: number;
}

export interface LowLoginStudent {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  /** Town display name from town_settings; use for table to match town data */
  town_name?: string;
  logins: number;
  last_login: string | null;
}

/** Student with total logins in a period (Student Total logins section) */
export interface StudentLoginRow {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  class?: string;
  town_name?: string;
  logins: number;
  last_login: string | null;
}

export interface EngagementSummary {
  total_logins_users: number;
  total_logins: number;
  total_chores_users: number;
  total_chores_sessions: number;
  total_transfers_users: number;
  total_transfers: number;
  total_purchases_users: number;
  total_purchases: number;
  total_wordle_games: number;
  total_wordle_earnings: number;
  total_wordle_xp: number;
  total_job_challenge_sessions: number;
  total_job_challenge_xp: number;
}

export interface EngagementAnalytics {
  time_range: 'day' | 'week' | 'month' | 'year';
  scope: 'school' | 'classes' | 'students';
  start_date: string;
  time_series: EngagementTimeSeries[];
  by_class: EngagementByClass[];
  top_students: EngagementByStudent[];
  low_login_students?: LowLoginStudent[];
  summary: EngagementSummary;
}
