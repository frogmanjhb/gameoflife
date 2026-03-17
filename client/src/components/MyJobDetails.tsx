import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Briefcase, DollarSign, MapPin, Building2, ClipboardList, 
  Award, FileText, TrendingUp, Loader2, AlertCircle, Play, CheckCircle, XCircle, Users 
} from 'lucide-react';
import api, { jobsApi, businessProposalsApi, architectGameApi, accountantGameApi, softwareEngineerGameApi, marketingManagerGameApi, graphicDesignerGameApi, journalistGameApi, eventPlannerGameApi, financialManagerGameApi, hrDirectorGameApi, policeLieutenantGameApi, lawyerGameApi, townPlannerGameApi, electricalEngineerGameApi, civilEngineerGameApi, principalGameApi, teacherGameApi, nurseGameApi, doctorGameApi, retailManagerGameApi, entrepreneurGameApi, transactionsApi, policeFinesBonusesApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Job, ArchitectGameStatus, AccountantGameStatus, SoftwareEngineerGameStatus, MarketingManagerGameStatus, GraphicDesignerGameStatus, JournalistGameStatus, EventPlannerGameStatus, FinancialManagerGameStatus, HRDirectorGameStatus, PoliceLieutenantGameStatus, LawyerGameStatus, TownPlannerGameStatus, ElectricalEngineerGameStatus, CivilEngineerGameStatus, PrincipalGameStatus, TeacherGameStatus, NurseGameStatus, DoctorGameStatus, RetailManagerGameStatus, EntrepreneurGameStatus, AccountantAssignmentStudent, AccountantPendingTransfer } from '../types';
import { getXPProgress } from '../utils/jobProgression';
import { stripPositionsAvailableFromRequirements, getDisplayJobTitle } from '../utils/jobDisplay';
import ArchitectGameModal from './jobchallenges/ArchitectGameModal';
import AccountantGameModal from './jobchallenges/AccountantGameModal';
import SoftwareEngineerGameModal from './jobchallenges/SoftwareEngineerGameModal';
import MarketingManagerGameModal from './jobchallenges/MarketingManagerGameModal';
import GraphicDesignerGameModal from './jobchallenges/GraphicDesignerGameModal';
import JournalistGameModal from './jobchallenges/JournalistGameModal';
import EventPlannerGameModal from './jobchallenges/EventPlannerGameModal';
import FinancialManagerGameModal from './jobchallenges/FinancialManagerGameModal';
import HRDirectorGameModal from './jobchallenges/HRDirectorGameModal';
import PoliceLieutenantGameModal from './jobchallenges/PoliceLieutenantGameModal';
import LawyerGameModal from './jobchallenges/LawyerGameModal';
import TownPlannerGameModal from './jobchallenges/TownPlannerGameModal';
import ElectricalEngineerGameModal from './jobchallenges/ElectricalEngineerGameModal';
import CivilEngineerGameModal from './jobchallenges/CivilEngineerGameModal';
import PrincipalGameModal from './jobchallenges/PrincipalGameModal';
import TeacherGameModal from './jobchallenges/TeacherGameModal';
import NurseGameModal from './jobchallenges/NurseGameModal';
import DoctorGameModal from './jobchallenges/DoctorGameModal';
import RetailManagerGameModal from './jobchallenges/RetailManagerGameModal';
import EntrepreneurGameModal from './jobchallenges/EntrepreneurGameModal';
import EntrepreneurBusinessProposalModal from './jobchallenges/EntrepreneurBusinessProposalModal';
import EntrepreneurApprovedInstructions from './jobchallenges/EntrepreneurApprovedInstructions';

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
  const [softwareEngineerGameStatus, setSoftwareEngineerGameStatus] = useState<SoftwareEngineerGameStatus | null>(null);
  const [isSoftwareEngineerGameOpen, setIsSoftwareEngineerGameOpen] = useState(false);
  const [marketingManagerGameStatus, setMarketingManagerGameStatus] = useState<MarketingManagerGameStatus | null>(null);
  const [isMarketingManagerGameOpen, setIsMarketingManagerGameOpen] = useState(false);
  const [graphicDesignerGameStatus, setGraphicDesignerGameStatus] = useState<GraphicDesignerGameStatus | null>(null);
  const [isGraphicDesignerGameOpen, setIsGraphicDesignerGameOpen] = useState(false);
  const [journalistGameStatus, setJournalistGameStatus] = useState<JournalistGameStatus | null>(null);
  const [isJournalistGameOpen, setIsJournalistGameOpen] = useState(false);
  const [eventPlannerGameStatus, setEventPlannerGameStatus] = useState<EventPlannerGameStatus | null>(null);
  const [isEventPlannerGameOpen, setIsEventPlannerGameOpen] = useState(false);
  const [financialManagerGameStatus, setFinancialManagerGameStatus] = useState<FinancialManagerGameStatus | null>(null);
  const [isFinancialManagerGameOpen, setIsFinancialManagerGameOpen] = useState(false);
  const [hrDirectorGameStatus, setHRDirectorGameStatus] = useState<HRDirectorGameStatus | null>(null);
  const [isHRDirectorGameOpen, setIsHRDirectorGameOpen] = useState(false);
  const [policeLieutenantGameStatus, setPoliceLieutenantGameStatus] = useState<PoliceLieutenantGameStatus | null>(null);
  const [isPoliceLieutenantGameOpen, setIsPoliceLieutenantGameOpen] = useState(false);
  const [lawyerGameStatus, setLawyerGameStatus] = useState<LawyerGameStatus | null>(null);
  const [isLawyerGameOpen, setIsLawyerGameOpen] = useState(false);
  const [townPlannerGameStatus, setTownPlannerGameStatus] = useState<TownPlannerGameStatus | null>(null);
  const [isTownPlannerGameOpen, setIsTownPlannerGameOpen] = useState(false);
  const [electricalEngineerGameStatus, setElectricalEngineerGameStatus] = useState<ElectricalEngineerGameStatus | null>(null);
  const [isElectricalEngineerGameOpen, setIsElectricalEngineerGameOpen] = useState(false);
  const [civilEngineerGameStatus, setCivilEngineerGameStatus] = useState<CivilEngineerGameStatus | null>(null);
  const [isCivilEngineerGameOpen, setIsCivilEngineerGameOpen] = useState(false);
  const [principalGameStatus, setPrincipalGameStatus] = useState<PrincipalGameStatus | null>(null);
  const [isPrincipalGameOpen, setIsPrincipalGameOpen] = useState(false);
  const [teacherGameStatus, setTeacherGameStatus] = useState<TeacherGameStatus | null>(null);
  const [isTeacherGameOpen, setIsTeacherGameOpen] = useState(false);
  const [nurseGameStatus, setNurseGameStatus] = useState<NurseGameStatus | null>(null);
  const [isNurseGameOpen, setIsNurseGameOpen] = useState(false);
  const [doctorGameStatus, setDoctorGameStatus] = useState<DoctorGameStatus | null>(null);
  const [isDoctorGameOpen, setIsDoctorGameOpen] = useState(false);
  const [retailManagerGameStatus, setRetailManagerGameStatus] = useState<RetailManagerGameStatus | null>(null);
  const [isRetailManagerGameOpen, setIsRetailManagerGameOpen] = useState(false);
  const [entrepreneurGameStatus, setEntrepreneurGameStatus] = useState<EntrepreneurGameStatus | null>(null);
  const [isEntrepreneurGameOpen, setIsEntrepreneurGameOpen] = useState(false);
  const [entrepreneurProposals, setEntrepreneurProposals] = useState<import('../types').BusinessProposal[]>([]);
  const [entrepreneurProposalsLoading, setEntrepreneurProposalsLoading] = useState(false);
  const [isEntrepreneurProposalModalOpen, setIsEntrepreneurProposalModalOpen] = useState(false);
  const [accountantAssignments, setAccountantAssignments] = useState<AccountantAssignmentStudent[] | null>(null);
  const [accountantAssignmentsLoading, setAccountantAssignmentsLoading] = useState(false);
  const [accountantAssignmentsError, setAccountantAssignmentsError] = useState<string | null>(null);
  const [accountantApprovals, setAccountantApprovals] = useState<AccountantPendingTransfer[]>([]);
  const [accountantApprovalsLoading, setAccountantApprovalsLoading] = useState(false);
  const [accountantApprovalsError, setAccountantApprovalsError] = useState<string | null>(null);
  const [isAccountantApprovalsOpen, setIsAccountantApprovalsOpen] = useState(false);
  const [isPoliceFineBonusOpen, setIsPoliceFineBonusOpen] = useState(false);
  const [policeFineBonusType, setPoliceFineBonusType] = useState<'fine' | 'bonus'>('fine');
  const [policeSelectedStudentId, setPoliceSelectedStudentId] = useState<number | ''>('');
  const [policeAmount, setPoliceAmount] = useState('');
  const [policeDescription, setPoliceDescription] = useState('');
  const [policeSubmitting, setPoliceSubmitting] = useState(false);
  const [policeError, setPoliceError] = useState<string | null>(null);
  const [policeSuccess, setPoliceSuccess] = useState<string | null>(null);
  const [policeTeacherInitials, setPoliceTeacherInitials] = useState('');
  const [policeStudents, setPoliceStudents] = useState<{ id: number; username: string; first_name: string | null; last_name: string | null; class: string | null }[]>([]);
  const [policeStudentsLoading, setPoliceStudentsLoading] = useState(false);
  const [policeSelectedUsername, setPoliceSelectedUsername] = useState('');
  const [policeHistory, setPoliceHistory] = useState<import('../services/api').PoliceFineBonus[]>([]);
  const [policeHistoryLoading, setPoliceHistoryLoading] = useState(false);

  const isPoliceJob = (job?.name || '').toLowerCase().trim().includes('police lieutenant');

  useEffect(() => {
    if (!isPoliceJob) return;
    const load = async () => {
      try {
        setPoliceStudentsLoading(true);
        const res = await api.get('/students/transfer-recipients');
        setPoliceStudents(res.data || []);
      } catch {
        setPoliceStudents([]);
      } finally {
        setPoliceStudentsLoading(false);
      }
    };
    load();
  }, [isPoliceJob]);

  useEffect(() => {
    if (!isPoliceJob) return;
    const loadHistory = async () => {
      try {
        setPoliceHistoryLoading(true);
        const res = await policeFinesBonusesApi.getMyHistory();
        setPoliceHistory(res.data || []);
      } catch {
        setPoliceHistory([]);
      } finally {
        setPoliceHistoryLoading(false);
      }
    };
    loadHistory();
  }, [isPoliceJob]);

  useEffect(() => {
    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('architect')) {
      fetchArchitectGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('accountant')) {
      fetchAccountantGameStatus();
    }
  }, [user, job]);
  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('accountant')) {
      fetchAccountantAssignments();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('software engineer')) {
      fetchSoftwareEngineerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('marketing manager')) {
      fetchMarketingManagerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('graphic designer')) {
      fetchGraphicDesignerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('journalist')) {
      fetchJournalistGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('event planner')) {
      fetchEventPlannerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('financial manager')) {
      fetchFinancialManagerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('hr director')) {
      fetchHRDirectorGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('police lieutenant')) {
      fetchPoliceLieutenantGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('lawyer')) {
      fetchLawyerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('town planner')) {
      fetchTownPlannerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('electrical engineer')) {
      fetchElectricalEngineerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('civil engineer')) {
      fetchCivilEngineerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('principal')) {
      fetchPrincipalGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('teacher')) {
      fetchTeacherGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('nurse')) {
      fetchNurseGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('doctor')) {
      fetchDoctorGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('retail')) {
      fetchRetailManagerGameStatus();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('entrepreneur')) {
      fetchEntrepreneurProposals();
    }
  }, [user, job]);

  useEffect(() => {
    if (user && (job?.name || '').toLowerCase().trim().includes('entrepreneur')) {
      fetchEntrepreneurGameStatus();
    }
  }, [user, job]);

  const fetchEntrepreneurProposals = async () => {
    try {
      setEntrepreneurProposalsLoading(true);
      const response = await businessProposalsApi.getMy();
      setEntrepreneurProposals(response.data || []);
    } catch {
      setEntrepreneurProposals([]);
    } finally {
      setEntrepreneurProposalsLoading(false);
    }
  };

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

  const fetchAccountantAssignments = async () => {
    try {
      setAccountantAssignmentsLoading(true);
      setAccountantAssignmentsError(null);
      const response = await transactionsApi.getAccountantAssignments();
      setAccountantAssignments(response.data || []);
    } catch (err: any) {
      console.log('Accountant assignments not available:', err.response?.data?.error);
      setAccountantAssignments([]);
      setAccountantAssignmentsError(err.response?.data?.error || 'Failed to load assigned students');
    } finally {
      setAccountantAssignmentsLoading(false);
    }
  };

  const fetchAccountantApprovals = async () => {
    try {
      setAccountantApprovalsLoading(true);
      setAccountantApprovalsError(null);
      const response = await transactionsApi.getAccountantApprovals();
      setAccountantApprovals(response.data || []);
    } catch (err: any) {
      setAccountantApprovals([]);
      setAccountantApprovalsError(err.response?.data?.error || 'Failed to load approvals');
    } finally {
      setAccountantApprovalsLoading(false);
    }
  };

  const fetchSoftwareEngineerGameStatus = async () => {
    try {
      const response = await softwareEngineerGameApi.getStatus();
      setSoftwareEngineerGameStatus(response.data);
    } catch (err: any) {
      console.log('Software engineer game status not available:', err.response?.data?.error);
    }
  };

  const fetchMarketingManagerGameStatus = async () => {
    try {
      const response = await marketingManagerGameApi.getStatus();
      setMarketingManagerGameStatus(response.data);
    } catch (err: any) {
      console.log('Marketing manager game status not available:', err.response?.data?.error);
    }
  };

  const fetchGraphicDesignerGameStatus = async () => {
    try {
      const response = await graphicDesignerGameApi.getStatus();
      setGraphicDesignerGameStatus(response.data);
    } catch (err: any) {
      console.log('Graphic designer game status not available:', err.response?.data?.error);
    }
  };

  const fetchJournalistGameStatus = async () => {
    try {
      const response = await journalistGameApi.getStatus();
      setJournalistGameStatus(response.data);
    } catch (err: any) {
      console.log('Journalist game status not available:', err.response?.data?.error);
    }
  };

  const fetchEventPlannerGameStatus = async () => {
    try {
      const response = await eventPlannerGameApi.getStatus();
      setEventPlannerGameStatus(response.data);
    } catch (err: any) {
      console.log('Event planner game status not available:', err.response?.data?.error);
    }
  };

  const fetchFinancialManagerGameStatus = async () => {
    try {
      const response = await financialManagerGameApi.getStatus();
      setFinancialManagerGameStatus(response.data);
    } catch (err: any) {
      console.log('Financial manager game status not available:', err.response?.data?.error);
    }
  };

  const fetchHRDirectorGameStatus = async () => {
    try {
      const response = await hrDirectorGameApi.getStatus();
      setHRDirectorGameStatus(response.data);
    } catch (err: any) {
      console.log('HR director game status not available:', err.response?.data?.error);
    }
  };

  const fetchPoliceLieutenantGameStatus = async () => {
    try {
      const response = await policeLieutenantGameApi.getStatus();
      setPoliceLieutenantGameStatus(response.data);
    } catch (err: any) {
      console.log('Police lieutenant game status not available:', err.response?.data?.error);
    }
  };

  const fetchLawyerGameStatus = async () => {
    try {
      const response = await lawyerGameApi.getStatus();
      setLawyerGameStatus(response.data);
    } catch (err: any) {
      console.log('Lawyer game status not available:', err.response?.data?.error);
    }
  };

  const fetchTownPlannerGameStatus = async () => {
    try {
      const response = await townPlannerGameApi.getStatus();
      setTownPlannerGameStatus(response.data);
    } catch (err: any) {
      console.log('Town planner game status not available:', err.response?.data?.error);
    }
  };

  const fetchElectricalEngineerGameStatus = async () => {
    try {
      const response = await electricalEngineerGameApi.getStatus();
      setElectricalEngineerGameStatus(response.data);
    } catch (err: any) {
      console.log('Electrical engineer game status not available:', err.response?.data?.error);
    }
  };

  const fetchCivilEngineerGameStatus = async () => {
    try {
      const response = await civilEngineerGameApi.getStatus();
      setCivilEngineerGameStatus(response.data);
    } catch (err: any) {
      console.log('Civil engineer game status not available:', err.response?.data?.error);
    }
  };

  const fetchPrincipalGameStatus = async () => {
    try {
      const response = await principalGameApi.getStatus();
      setPrincipalGameStatus(response.data);
    } catch (err: any) {
      console.log('Principal game status not available:', err.response?.data?.error);
    }
  };

  const fetchTeacherGameStatus = async () => {
    try {
      const response = await teacherGameApi.getStatus();
      setTeacherGameStatus(response.data);
    } catch (err: any) {
      console.log('Teacher game status not available:', err.response?.data?.error);
    }
  };

  const fetchNurseGameStatus = async () => {
    try {
      const response = await nurseGameApi.getStatus();
      setNurseGameStatus(response.data);
    } catch (err: any) {
      console.log('Nurse game status not available:', err.response?.data?.error);
    }
  };

  const fetchDoctorGameStatus = async () => {
    try {
      const response = await doctorGameApi.getStatus();
      setDoctorGameStatus(response.data);
    } catch (err: any) {
      console.log('Doctor game status not available:', err.response?.data?.error);
    }
  };

  const fetchRetailManagerGameStatus = async () => {
    try {
      const response = await retailManagerGameApi.getStatus();
      setRetailManagerGameStatus(response.data);
    } catch (err: any) {
      console.log('Retail Manager game status not available:', err.response?.data?.error);
    }
  };

  const fetchEntrepreneurGameStatus = async () => {
    try {
      const response = await entrepreneurGameApi.getStatus();
      setEntrepreneurGameStatus(response.data);
    } catch (err: any) {
      console.log('Entrepreneur game status not available:', err.response?.data?.error);
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
                {getDisplayJobTitle(job.name, jobLevel)}
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

        {/* Daily & Weekly Duties */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 mb-3">
            <ClipboardList className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Your Duties</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Daily Duties */}
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-semibold text-gray-900">Daily Duties</h4>
                {isPoliceJob && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPoliceFineBonusType('fine');
                        setIsPoliceFineBonusOpen(true);
                        setPoliceError(null);
                        setPoliceSuccess(null);
                      }}
                      className="px-4 py-2 rounded-lg font-semibold text-sm bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    >
                      Fines
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPoliceFineBonusType('bonus');
                        setIsPoliceFineBonusOpen(true);
                        setPoliceError(null);
                        setPoliceSuccess(null);
                      }}
                      className="px-4 py-2 rounded-lg font-semibold text-sm bg-green-600 hover:bg-green-700 text-white shadow-sm"
                    >
                      Bonuses
                    </button>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Daily duties for this job will appear here. Teachers can customise these duties for each job.
              </p>
              {isPoliceJob && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                  <p className="text-xs text-gray-500">
                    The Fines and Bonuses tools are for real-life teachers to record approved actions in the Bank plugin.
                  </p>
                </div>
              )}
            </div>

            {/* Weekly Duties */}
            <div className="bg-white border border-dashed border-gray-300 rounded-lg p-4">
              <h4 className="text-md font-semibold text-gray-900 mb-2">Weekly Duties</h4>
              <p className="text-sm text-gray-600">
                Weekly duties for this job will appear here. Teachers can customise these duties for each job.
              </p>
            </div>
          </div>

          {/* Police – Fines & Bonuses History */}
          {isPoliceJob && (
            <div className="mt-5">
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-gray-500" />
                Fines &amp; Bonuses History
              </h4>
              {policeHistoryLoading ? (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading history...</span>
                </div>
              ) : policeHistory.length === 0 ? (
                <p className="text-sm text-gray-400 italic py-2">No fines or bonuses submitted yet.</p>
              ) : (
                <div className="space-y-2">
                  {policeHistory.map((h) => (
                    <div
                      key={h.id}
                      className={`flex items-start justify-between rounded-lg px-4 py-3 border text-sm ${
                        h.type === 'fine'
                          ? 'bg-red-50 border-red-200'
                          : 'bg-green-50 border-green-200'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${
                              h.type === 'fine'
                                ? 'bg-red-200 text-red-800'
                                : 'bg-green-200 text-green-800'
                            }`}
                          >
                            {h.type}
                          </span>
                          <span className="font-medium text-gray-900">
                            {h.target_first_name && h.target_last_name
                              ? `${h.target_first_name} ${h.target_last_name}`
                              : h.target_username}
                          </span>
                          <span className="font-semibold text-gray-800">R{Number(h.amount).toFixed(2)}</span>
                        </div>
                        {h.description && (
                          <p className="text-gray-600 mt-0.5 truncate">{h.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(h.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`ml-3 shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                          h.status === 'approved'
                            ? 'bg-green-200 text-green-800'
                            : h.status === 'denied'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-amber-200 text-amber-800'
                        }`}
                      >
                        {h.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Police – Fines / Bonuses modal */}
        {isPoliceJob && isPoliceFineBonusOpen && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {policeFineBonusType === 'fine' ? 'Issue Fine' : 'Award Bonus'}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setIsPoliceFineBonusOpen(false);
                    setPoliceSelectedStudentId('');
                    setPoliceSelectedUsername('');
                    setPoliceTeacherInitials('');
                    setPoliceAmount('');
                    setPoliceDescription('');
                    setPoliceError(null);
                    setPoliceSuccess(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                This tool is for teachers only. Select a student, describe the reason, and enter an amount.
                The request will appear in the Bank plugin for approval.
              </p>

              {policeError && (
                <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {policeError}
                </div>
              )}
              {policeSuccess && (
                <div className="mb-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  {policeSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Initials</label>
                  <input
                    type="text"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 uppercase"
                    value={policeTeacherInitials}
                    onChange={(e) => setPoliceTeacherInitials(e.target.value.toUpperCase())}
                    placeholder="e.g. JVN"
                  />
                  <p className="mt-1 text-xs text-gray-500">Enter your initials to confirm you authorise this action.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  {policeStudentsLoading ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 text-sm">
                      Loading students...
                    </div>
                  ) : (
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      value={policeSelectedUsername}
                      onChange={(e) => {
                        setPoliceSelectedUsername(e.target.value);
                        const s = policeStudents.find((st) => st.username === e.target.value);
                        setPoliceSelectedStudentId(s ? s.id : '');
                      }}
                    >
                      <option value="">Select a student</option>
                      {policeStudents.map((s) => (
                        <option key={s.id} value={s.username}>
                          {s.first_name && s.last_name
                            ? `${s.first_name} ${s.last_name} (${s.class || '?'}) – ${s.username}`
                            : `${s.username} (${s.class || '?'})`}
                        </option>
                      ))}
                    </select>
                  )}
                  {!policeStudentsLoading && policeStudents.length === 0 && (
                    <p className="mt-1 text-xs text-gray-500">No students found.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    rows={3}
                    value={policeDescription}
                    onChange={(e) => setPoliceDescription(e.target.value)}
                    placeholder={policeFineBonusType === 'fine' ? 'Reason for fine...' : 'Reason for bonus...'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (R)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={policeAmount}
                    onChange={(e) => setPoliceAmount(e.target.value)}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPoliceFineBonusOpen(false);
                      setPoliceSelectedStudentId('');
                      setPoliceSelectedUsername('');
                      setPoliceTeacherInitials('');
                      setPoliceAmount('');
                      setPoliceDescription('');
                      setPoliceError(null);
                      setPoliceSuccess(null);
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={policeSubmitting || !policeTeacherInitials.trim() || !policeSelectedUsername || !policeAmount}
                    onClick={async () => {
                      setPoliceSubmitting(true);
                      setPoliceError(null);
                      setPoliceSuccess(null);
                      try {
                        await policeFinesBonusesApi.submit({
                          type: policeFineBonusType,
                          target_username: policeSelectedUsername,
                          description: policeDescription,
                          amount: parseFloat(policeAmount),
                          teacher_initials: policeTeacherInitials.trim(),
                        });
                        setPoliceSuccess(
                          policeFineBonusType === 'fine'
                            ? 'Fine request sent — awaiting teacher approval in the Bank plugin.'
                            : 'Bonus request sent — awaiting teacher approval in the Bank plugin.'
                        );
                        setPoliceSelectedStudentId('');
                        setPoliceSelectedUsername('');
                        setPoliceAmount('');
                        setPoliceDescription('');
                        setPoliceTeacherInitials('');
                        // Refresh history
                        policeFinesBonusesApi.getMyHistory().then((r) => setPoliceHistory(r.data || [])).catch(() => {});
                      } catch (err: any) {
                        setPoliceError(err.response?.data?.error || 'Failed to submit request');
                      } finally {
                        setPoliceSubmitting(false);
                      }
                    }}
                    className={`px-5 py-2 text-sm font-semibold rounded-lg text-white ${
                      policeFineBonusType === 'fine'
                        ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-300'
                        : 'bg-green-600 hover:bg-green-700 disabled:bg-green-300'
                    }`}
                  >
                    {policeSubmitting
                      ? policeFineBonusType === 'fine'
                        ? 'Sending fine...'
                        : 'Sending bonus...'
                      : policeFineBonusType === 'fine'
                        ? 'Send Fine Request'
                        : 'Send Bonus Request'}
                  </button>
                </div>
              </div>
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

        {/* Entrepreneur – Business Proposal & Instructions */}
        {(job?.name || '').toLowerCase().trim().includes('entrepreneur') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-amber-600" />
                🚀 TownSim – Your Business
              </h3>
              {entrepreneurProposalsLoading ? (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Loading...</span>
                </div>
              ) : (() => {
                const approved = entrepreneurProposals.find((p) => p.status === 'approved');
                const pending = entrepreneurProposals.find((p) => p.status === 'pending');
                if (approved) {
                  return (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-700">
                        Your business <strong>{approved.business_name}</strong> has been approved. Follow the steps below to run it.
                      </p>
                      <EntrepreneurApprovedInstructions />
                    </div>
                  );
                }
                if (pending) {
                  return (
                    <div className="space-y-3">
                      <p className="text-sm text-amber-800 font-medium">
                        Your proposal &quot;{pending.business_name}&quot; is waiting for teacher approval. You cannot start working on it until it is approved.
                      </p>
                      <p className="text-xs text-gray-600">Submitted {new Date(pending.created_at).toLocaleDateString()}</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">
                      Submit a business proposal for teacher approval. Once approved, you can start your business and follow the weekly instructions.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsEntrepreneurProposalModalOpen(true)}
                      className="btn-primary flex items-center gap-2"
                    >
                      <FileText className="h-5 w-5" />
                      Submit Business Proposal
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Entrepreneur – Business Builder Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('entrepreneur') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-violet-50 to-amber-50 rounded-lg p-6 border border-violet-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-violet-600" />
                    Business Builder Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete business scenarios (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsEntrepreneurGameOpen(true)}
                  disabled={!entrepreneurGameStatus || (entrepreneurGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Business Scenario</span>
                </button>
              </div>
              {entrepreneurGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {entrepreneurGameStatus.remaining_plays} / {entrepreneurGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{entrepreneurGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{entrepreneurGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{entrepreneurGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Extreme High Score</div>
                    <div className="text-lg font-bold text-gray-900">{entrepreneurGameStatus.high_scores?.extreme ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Software Engineer – Logic & Systems Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('software engineer') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-violet-50 rounded-lg p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-blue-600" />
                    Logic & Systems Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete build sprints (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsSoftwareEngineerGameOpen(true)}
                  disabled={!softwareEngineerGameStatus || (softwareEngineerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Build Sprint</span>
                </button>
              </div>
              {softwareEngineerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {softwareEngineerGameStatus.remaining_plays} / {softwareEngineerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{softwareEngineerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{softwareEngineerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{softwareEngineerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Marketing Manager – Campaign Strategy Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('marketing manager') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-6 border border-rose-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-rose-600" />
                    Campaign Strategy Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete campaigns (5 questions each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsMarketingManagerGameOpen(true)}
                  disabled={!marketingManagerGameStatus || (marketingManagerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Campaign</span>
                </button>
              </div>
              {marketingManagerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {marketingManagerGameStatus.remaining_plays} / {marketingManagerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{marketingManagerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{marketingManagerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{marketingManagerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Graphic Designer – Design Precision Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('graphic designer') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 border border-teal-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-teal-600" />
                    Design Precision Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete design briefs (5 questions each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsGraphicDesignerGameOpen(true)}
                  disabled={!graphicDesignerGameStatus || (graphicDesignerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Design Brief</span>
                </button>
              </div>
              {graphicDesignerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {graphicDesignerGameStatus.remaining_plays} / {graphicDesignerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{graphicDesignerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{graphicDesignerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{graphicDesignerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Journalist – Data & Reporting Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('journalist') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-indigo-50 to-slate-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Data & Reporting Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete economic news investigations (5 questions each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsJournalistGameOpen(true)}
                  disabled={!journalistGameStatus || (journalistGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Investigation</span>
                </button>
              </div>
              {journalistGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {journalistGameStatus.remaining_plays} / {journalistGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{journalistGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{journalistGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{journalistGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Event Planner – Event Budget Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('event planner') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    Event Budget Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete event proposals (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsEventPlannerGameOpen(true)}
                  disabled={!eventPlannerGameStatus || (eventPlannerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Event Proposal</span>
                </button>
              </div>
              {eventPlannerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {eventPlannerGameStatus.remaining_plays} / {eventPlannerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{eventPlannerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{eventPlannerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{eventPlannerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Manager – Town Finance Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('financial manager') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                    Town Finance Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete payroll cycles (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsFinancialManagerGameOpen(true)}
                  disabled={!financialManagerGameStatus || (financialManagerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Payroll Cycle</span>
                </button>
              </div>
              {financialManagerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {financialManagerGameStatus.remaining_plays} / {financialManagerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{financialManagerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{financialManagerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{financialManagerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HR Director – People Management Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('hr director') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-6 border border-violet-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-violet-600" />
                    People Management Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete HR review cycles (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsHRDirectorGameOpen(true)}
                  disabled={!hrDirectorGameStatus || (hrDirectorGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start HR Review Cycle</span>
                </button>
              </div>
              {hrDirectorGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {hrDirectorGameStatus.remaining_plays} / {hrDirectorGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{hrDirectorGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{hrDirectorGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{hrDirectorGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Police Lieutenant – Enforcement Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('police lieutenant') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                    Enforcement Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete compliance reviews (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsPoliceLieutenantGameOpen(true)}
                  disabled={!policeLieutenantGameStatus || (policeLieutenantGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Compliance Review</span>
                </button>
              </div>
              {policeLieutenantGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {policeLieutenantGameStatus.remaining_plays} / {policeLieutenantGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{policeLieutenantGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{policeLieutenantGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{policeLieutenantGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Lawyer – Legal Reasoning Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('lawyer') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Legal Reasoning Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete case reviews (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsLawyerGameOpen(true)}
                  disabled={!lawyerGameStatus || (lawyerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Case Review</span>
                </button>
              </div>
              {lawyerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {lawyerGameStatus.remaining_plays} / {lawyerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{lawyerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{lawyerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{lawyerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Town Planner – Zoning & Biome Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('town planner') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-emerald-600" />
                    Zoning & Biome Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete planning proposals (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsTownPlannerGameOpen(true)}
                  disabled={!townPlannerGameStatus || (townPlannerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Planning Proposal</span>
                </button>
              </div>
              {townPlannerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {townPlannerGameStatus.remaining_plays} / {townPlannerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{townPlannerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{townPlannerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{townPlannerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Electrical Engineer – Power Systems Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('electrical engineer') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    Power Systems Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete power allocation reviews (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsElectricalEngineerGameOpen(true)}
                  disabled={!electricalEngineerGameStatus || (electricalEngineerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Power Allocation Review</span>
                </button>
              </div>
              {electricalEngineerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {electricalEngineerGameStatus.remaining_plays} / {electricalEngineerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{electricalEngineerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{electricalEngineerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{electricalEngineerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Civil Engineer – Infrastructure Design Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('civil engineer') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-slate-50 to-stone-50 rounded-lg p-6 border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-slate-600" />
                    Infrastructure Design Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete infrastructure projects (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsCivilEngineerGameOpen(true)}
                  disabled={!civilEngineerGameStatus || (civilEngineerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-slate-600 hover:bg-slate-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Infrastructure Project</span>
                </button>
              </div>
              {civilEngineerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {civilEngineerGameStatus.remaining_plays} / {civilEngineerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{civilEngineerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{civilEngineerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{civilEngineerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Principal – School Leadership Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('principal') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 rounded-lg p-6 border border-violet-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-violet-600" />
                    School Leadership Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete school review cycles (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsPrincipalGameOpen(true)}
                  disabled={!principalGameStatus || (principalGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start School Review Cycle</span>
                </button>
              </div>
              {principalGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {principalGameStatus.remaining_plays} / {principalGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{principalGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{principalGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{principalGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Extreme High Score</div>
                    <div className="text-lg font-bold text-gray-900">{principalGameStatus.high_scores?.extreme ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Teacher – Learning Support Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('teacher') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-amber-50 to-emerald-50 rounded-lg p-6 border border-amber-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    Learning Support Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete teaching cycles (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsTeacherGameOpen(true)}
                  disabled={!teacherGameStatus || (teacherGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Teaching Cycle</span>
                </button>
              </div>
              {teacherGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {teacherGameStatus.remaining_plays} / {teacherGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{teacherGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{teacherGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{teacherGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Extreme High Score</div>
                    <div className="text-lg font-bold text-gray-900">{teacherGameStatus.high_scores?.extreme ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nurse – Health Support Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('nurse') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-rose-50 to-teal-50 rounded-lg p-6 border border-rose-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-rose-600" />
                    Health Support Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete health check cycles (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsNurseGameOpen(true)}
                  disabled={!nurseGameStatus || (nurseGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Health Check Cycle</span>
                </button>
              </div>
              {nurseGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {nurseGameStatus.remaining_plays} / {nurseGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{nurseGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{nurseGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{nurseGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Extreme High Score</div>
                    <div className="text-lg font-bold text-gray-900">{nurseGameStatus.high_scores?.extreme ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Doctor – Public Health & Biome Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('doctor') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-lg p-6 border border-indigo-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-indigo-600" />
                    Public Health & Biome Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete health investigations (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsDoctorGameOpen(true)}
                  disabled={!doctorGameStatus || (doctorGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Health Investigation</span>
                </button>
              </div>
              {doctorGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {doctorGameStatus.remaining_plays} / {doctorGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{doctorGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{doctorGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{doctorGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Extreme High Score</div>
                    <div className="text-lg font-bold text-gray-900">{doctorGameStatus.high_scores?.extreme ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retail Manager – Shop Profit Challenge */}
        {(job?.name || '').toLowerCase().trim().includes('retail') && (
          <div className="pt-6 border-t border-gray-200">
            <div className="bg-gradient-to-r from-orange-50 to-emerald-50 rounded-lg p-6 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-orange-600" />
                    Shop Profit Challenge
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete trading day reviews (5 problems each) to earn XP and money.
                  </p>
                </div>
                <button
                  onClick={() => setIsRetailManagerGameOpen(true)}
                  disabled={!retailManagerGameStatus || (retailManagerGameStatus.remaining_plays ?? 0) <= 0}
                  className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="h-5 w-5" />
                  <span>Start Trading Day Review</span>
                </button>
              </div>
              {retailManagerGameStatus && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Remaining Today</div>
                    <div className="text-lg font-bold text-gray-900">
                      {retailManagerGameStatus.remaining_plays} / {retailManagerGameStatus.daily_limit}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-500">Easy High Score</div>
                    <div className="text-lg font-bold text-gray-900">{retailManagerGameStatus.high_scores?.easy ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Medium High Score</div>
                    <div className="text-lg font-bold text-gray-900">{retailManagerGameStatus.high_scores?.medium ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Hard High Score</div>
                    <div className="text-lg font-bold text-gray-900">{retailManagerGameStatus.high_scores?.hard ?? 0}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Extreme High Score</div>
                    <div className="text-lg font-bold text-gray-900">{retailManagerGameStatus.high_scores?.extreme ?? 0}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chartered Accountant – Financial Audit Challenges */}
        {(job?.name || '').toLowerCase().trim().includes('accountant') && (
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
            <div className="mt-4 bg-white rounded-lg p-6 border border-emerald-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h3 className="text-md font-semibold text-gray-900">People You Are Responsible For</h3>
                    <p className="text-xs text-gray-600">
                      These students and one other accountant&apos;s transfers need your approval. Each approved transfer earns you 1 XP.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountantApprovalsOpen(true);
                    fetchAccountantApprovals();
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Open Approvals</span>
                </button>
              </div>
              {accountantAssignmentsLoading && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading assigned students...</span>
                </div>
              )}
              {accountantAssignmentsError && !accountantAssignmentsLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  <span>{accountantAssignmentsError}</span>
                </div>
              )}
              {!accountantAssignmentsLoading && !accountantAssignmentsError && (
                <>
                  {accountantAssignments && accountantAssignments.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-gray-800">
                      {accountantAssignments.map((student) => (
                        <li key={student.id} className="flex items-center gap-2">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>
                            {student.first_name && student.last_name
                              ? `${student.first_name} ${student.last_name}`
                              : student.username}
                            {student.class ? (
                              <span className="text-gray-500 text-xs ml-2">
                                ({student.class})
                              </span>
                            ) : null}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-gray-600">
                      You don&apos;t currently have any assigned students for approvals.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Architect Game Section */}
        {(job?.name || '').toLowerCase().trim().includes('architect') && (
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
      {(job?.name || '').toLowerCase().trim().includes('architect') && (
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
      {(job?.name || '').toLowerCase().trim().includes('accountant') && (
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

      {/* Chartered Accountant – Approvals Modal */}
      {(job?.name || '').toLowerCase().trim().includes('accountant') && isAccountantApprovalsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Transfer Approvals</h2>
                  <p className="text-xs text-gray-600">
                    Review and approve or deny transfers from the students assigned to you. Each approval gives you 1 XP.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAccountantApprovalsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Close
              </button>
            </div>
            <div className="px-6 py-4 flex-1 overflow-y-auto space-y-3">
              {accountantApprovalsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
                </div>
              )}
              {accountantApprovalsError && !accountantApprovalsLoading && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span>{accountantApprovalsError}</span>
                </div>
              )}
              {!accountantApprovalsLoading && !accountantApprovalsError && accountantApprovals.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm">
                  <p>No transfers are currently waiting for your approval.</p>
                </div>
              )}
              {!accountantApprovalsLoading && accountantApprovals.length > 0 && (
                <div className="space-y-3">
                  {accountantApprovals.map((pt) => (
                    <div
                      key={pt.id}
                      className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {(pt.from_first_name && pt.from_last_name)
                            ? `${pt.from_first_name} ${pt.from_last_name}`
                            : pt.from_username}{' '}
                          →{' '}
                          {(pt.to_first_name && pt.to_last_name)
                            ? `${pt.to_first_name} ${pt.to_last_name}`
                            : pt.to_username}
                        </p>
                        <p className="text-sm text-gray-600">
                          R{pt.amount.toFixed(2)} • {pt.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(pt.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await transactionsApi.approveAsAccountant(pt.id);
                              setAccountantApprovals((prev) => prev.filter((x) => x.id !== pt.id));
                            } catch (err: any) {
                              setAccountantApprovalsError(err.response?.data?.error || 'Failed to approve transfer');
                            }
                          }}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await transactionsApi.denyAsAccountant(pt.id);
                              setAccountantApprovals((prev) => prev.filter((x) => x.id !== pt.id));
                            } catch (err: any) {
                              setAccountantApprovalsError(err.response?.data?.error || 'Failed to deny transfer');
                            }
                          }}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Deny</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Software Engineer Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('software engineer') && (
        <SoftwareEngineerGameModal
          isOpen={isSoftwareEngineerGameOpen}
          onClose={() => {
            setIsSoftwareEngineerGameOpen(false);
            fetchSoftwareEngineerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchSoftwareEngineerGameStatus()}
          gameStatus={softwareEngineerGameStatus}
        />
      )}

      {/* Marketing Manager Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('marketing manager') && (
        <MarketingManagerGameModal
          isOpen={isMarketingManagerGameOpen}
          onClose={() => {
            setIsMarketingManagerGameOpen(false);
            fetchMarketingManagerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchMarketingManagerGameStatus()}
          gameStatus={marketingManagerGameStatus}
        />
      )}

      {/* Graphic Designer Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('graphic designer') && (
        <GraphicDesignerGameModal
          isOpen={isGraphicDesignerGameOpen}
          onClose={() => {
            setIsGraphicDesignerGameOpen(false);
            fetchGraphicDesignerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchGraphicDesignerGameStatus()}
          gameStatus={graphicDesignerGameStatus}
        />
      )}

      {/* Journalist Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('journalist') && (
        <JournalistGameModal
          isOpen={isJournalistGameOpen}
          onClose={() => {
            setIsJournalistGameOpen(false);
            fetchJournalistGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchJournalistGameStatus()}
          gameStatus={journalistGameStatus}
        />
      )}

      {/* Event Planner Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('event planner') && (
        <EventPlannerGameModal
          isOpen={isEventPlannerGameOpen}
          onClose={() => {
            setIsEventPlannerGameOpen(false);
            fetchEventPlannerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchEventPlannerGameStatus()}
          gameStatus={eventPlannerGameStatus}
        />
      )}

      {/* Financial Manager Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('financial manager') && (
        <FinancialManagerGameModal
          isOpen={isFinancialManagerGameOpen}
          onClose={() => {
            setIsFinancialManagerGameOpen(false);
            fetchFinancialManagerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchFinancialManagerGameStatus()}
          gameStatus={financialManagerGameStatus}
        />
      )}

      {/* HR Director Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('hr director') && (
        <HRDirectorGameModal
          isOpen={isHRDirectorGameOpen}
          onClose={() => {
            setIsHRDirectorGameOpen(false);
            fetchHRDirectorGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchHRDirectorGameStatus()}
          gameStatus={hrDirectorGameStatus}
        />
      )}

      {/* Police Lieutenant Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('police lieutenant') && (
        <PoliceLieutenantGameModal
          isOpen={isPoliceLieutenantGameOpen}
          onClose={() => {
            setIsPoliceLieutenantGameOpen(false);
            fetchPoliceLieutenantGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchPoliceLieutenantGameStatus()}
          gameStatus={policeLieutenantGameStatus}
        />
      )}

      {/* Lawyer Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('lawyer') && (
        <LawyerGameModal
          isOpen={isLawyerGameOpen}
          onClose={() => {
            setIsLawyerGameOpen(false);
            fetchLawyerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchLawyerGameStatus()}
          gameStatus={lawyerGameStatus}
        />
      )}

      {/* Town Planner Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('town planner') && (
        <TownPlannerGameModal
          isOpen={isTownPlannerGameOpen}
          onClose={() => {
            setIsTownPlannerGameOpen(false);
            fetchTownPlannerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchTownPlannerGameStatus()}
          gameStatus={townPlannerGameStatus}
        />
      )}

      {/* Electrical Engineer Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('electrical engineer') && (
        <ElectricalEngineerGameModal
          isOpen={isElectricalEngineerGameOpen}
          onClose={() => {
            setIsElectricalEngineerGameOpen(false);
            fetchElectricalEngineerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchElectricalEngineerGameStatus()}
          gameStatus={electricalEngineerGameStatus}
        />
      )}

      {/* Civil Engineer Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('civil engineer') && (
        <CivilEngineerGameModal
          isOpen={isCivilEngineerGameOpen}
          onClose={() => {
            setIsCivilEngineerGameOpen(false);
            fetchCivilEngineerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchCivilEngineerGameStatus()}
          gameStatus={civilEngineerGameStatus}
        />
      )}

      {/* Principal Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('principal') && (
        <PrincipalGameModal
          isOpen={isPrincipalGameOpen}
          onClose={() => {
            setIsPrincipalGameOpen(false);
            fetchPrincipalGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchPrincipalGameStatus()}
          gameStatus={principalGameStatus}
        />
      )}

      {/* Teacher Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('teacher') && (
        <TeacherGameModal
          isOpen={isTeacherGameOpen}
          onClose={() => {
            setIsTeacherGameOpen(false);
            fetchTeacherGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchTeacherGameStatus()}
          gameStatus={teacherGameStatus}
        />
      )}

      {/* Nurse Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('nurse') && (
        <NurseGameModal
          isOpen={isNurseGameOpen}
          onClose={() => {
            setIsNurseGameOpen(false);
            fetchNurseGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchNurseGameStatus()}
          gameStatus={nurseGameStatus}
        />
      )}

      {/* Doctor Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('doctor') && (
        <DoctorGameModal
          isOpen={isDoctorGameOpen}
          onClose={() => {
            setIsDoctorGameOpen(false);
            fetchDoctorGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchDoctorGameStatus()}
          gameStatus={doctorGameStatus}
        />
      )}

      {/* Retail Manager Game Modal */}
      {(job?.name || '').toLowerCase().trim().includes('retail') && (
        <RetailManagerGameModal
          isOpen={isRetailManagerGameOpen}
          onClose={() => {
            setIsRetailManagerGameOpen(false);
            fetchRetailManagerGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchRetailManagerGameStatus()}
          gameStatus={retailManagerGameStatus}
        />
      )}

      {/* Entrepreneur Game Modal – Business Builder Challenge */}
      {(job?.name || '').toLowerCase().trim().includes('entrepreneur') && (
        <EntrepreneurGameModal
          isOpen={isEntrepreneurGameOpen}
          onClose={() => {
            setIsEntrepreneurGameOpen(false);
            fetchEntrepreneurGameStatus();
            window.location.reload();
          }}
          onGameComplete={() => fetchEntrepreneurGameStatus()}
          gameStatus={entrepreneurGameStatus}
        />
      )}

      {/* Entrepreneur – Business Proposal Modal */}
      {(job?.name || '').toLowerCase().trim().includes('entrepreneur') && (
        <EntrepreneurBusinessProposalModal
          isOpen={isEntrepreneurProposalModalOpen}
          onClose={() => setIsEntrepreneurProposalModalOpen(false)}
          onSuccess={() => fetchEntrepreneurProposals()}
        />
      )}
    </div>
  );
};

export default MyJobDetails;
