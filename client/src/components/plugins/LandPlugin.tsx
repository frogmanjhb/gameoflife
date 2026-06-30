import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTown } from '../../contexts/TownContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { 
  Map, Loader2, CheckCircle, XCircle, Clock, 
  Users, DollarSign, MapPin, RefreshCw, Database, Filter,
  ChevronDown, ChevronUp, HardHat
} from 'lucide-react';
import { landApi } from '../../services/api';
import { LandPurchaseRequest, LandStats, MyPropertiesResponse, LandSaleRequest } from '../../types';
import { formatCurrency, BIOME_CONFIG, BIOME_ICONS, RISK_COLORS } from '../land/BiomeConfig';
import LandGrid from '../land/LandGrid';
import LandPropertyCard from '../land/LandPropertyCard';
import { isLandEngineerJob, LAND_ENGINEER_APPROVAL_AUTO_AFTER_DAYS } from '../../utils/landPurchaseCosts';
import {
  ResponsivePage,
  ResponsiveGrid,
  ResponsiveStatItem,
  ResponsivePluginHero,
  ResponsiveTabNav,
  LoadingState,
  EmptyState,
} from '../responsive';

const TOWN_CLASS_LIST: Array<'6A' | '6B' | '6C'> = ['6A', '6B', '6C'];

const isActivePurchaseStatus = (status: string) =>
  status === 'pending_fm' || status === 'pending_engineer' || status === 'pending_teacher';

const formatPurchaseStatus = (status: string) => {
  switch (status) {
    case 'pending_fm': return 'Awaiting Financial Manager';
    case 'pending_engineer': return 'Awaiting engineers';
    case 'pending_teacher': return 'Awaiting teacher';
    case 'approved': return 'Approved';
    case 'denied': return 'Denied';
    default: return status;
  }
};

const purchaseStatusColor = (status: string) => {
  switch (status) {
    case 'pending_fm': return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'pending_engineer': return 'bg-violet-100 text-violet-800 border-violet-300';
    case 'pending_teacher': return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'approved': return 'bg-green-100 text-green-800 border-green-300';
    case 'denied': return 'bg-red-100 text-red-800 border-red-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

interface TownClassTabsProps {
  allTowns: Array<{ class: '6A' | '6B' | '6C'; town_name: string }>;
  currentTownClass: '6A' | '6B' | '6C' | null;
  onSelect: (townClass: '6A' | '6B' | '6C') => void;
}

const TownClassTabs: React.FC<TownClassTabsProps> = ({ allTowns, currentTownClass, onSelect }) => {
  const towns = allTowns.length > 0
    ? allTowns
    : TOWN_CLASS_LIST.map((cls) => ({ class: cls, town_name: `${cls} Town` }));

  return (
    <div className="px-3 sm:px-4 pt-3 pb-2 border-b border-gray-100">
      <div
        className="flex rounded-lg bg-gray-100 p-1 gap-1"
        role="tablist"
        aria-label="Select town class"
      >
        {towns.map((town) => {
          const isActive = currentTownClass === town.class;
          return (
            <button
              key={town.class}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => onSelect(town.class)}
              className={`flex-1 min-w-0 py-2 px-2 rounded-md text-sm font-semibold transition-all min-h-[40px] ${
                isActive
                  ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {town.class}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================
// TEACHER LAND VIEW COMPONENT
// ============================================
interface TeacherLandViewProps {
  landPlugin: any;
}

const TeacherLandView: React.FC<TeacherLandViewProps> = ({ landPlugin: _landPlugin }) => {
  const { currentTownClass, allTowns, setCurrentTownClass } = useTown();
  const [activeTab, setActiveTab] = useState<'grid' | 'requests' | 'stats'>('grid');
  const [requests, setRequests] = useState<LandPurchaseRequest[]>([]);
  const [stats, setStats] = useState<LandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<'pending_fm' | 'pending_engineer' | 'pending_teacher' | 'approved' | 'denied' | ''>('pending_teacher');
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    if (!currentTownClass) return;
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        landApi.getPurchaseRequests(filterStatus || undefined, currentTownClass),
        landApi.getStats(currentTownClass)
      ]);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch land data:', err);
    } finally {
      setLoading(false);
    }
  }, [currentTownClass, filterStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestAction = async (id: number, status: 'approved' | 'denied', reason?: string, masterApprove?: boolean) => {
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      const res = await landApi.updatePurchaseRequest(id, status, reason, masterApprove);
      setSuccess(res.data.message || `Request ${status} successfully`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${status} request`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMasterApprove = (id: number) => {
    if (!window.confirm(
      'Master Approve completes this land purchase immediately and bypasses architect and civil engineer approval. Continue?'
    )) {
      return;
    }
    handleRequestAction(id, 'approved', undefined, true);
  };

  const handleSeedData = async () => {
    setSeeding(true);
    setError('');
    setSuccess('');
    try {
      const res = await landApi.seedLandData();
      setSuccess(`${res.data.message} - ${res.data.count} parcels created`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to seed land data');
    } finally {
      setSeeding(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_fm': return 'bg-amber-100 text-amber-900';
      case 'pending_engineer': return 'bg-violet-100 text-violet-800';
      case 'pending_teacher': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!currentTownClass) {
    return <LoadingState message="Loading town data..." />;
  }

  const activeTownName =
    allTowns.find((t) => t.class === currentTownClass)?.town_name || `Class ${currentTownClass}`;

  return (
    <ResponsivePage className="space-y-3 sm:space-y-6">
      <ResponsivePluginHero
        title="Land Registry Management"
        subtitle={
          <>
            <span className="sm:hidden">{activeTownName}</span>
            <span className="hidden sm:inline">{activeTownName} — Teacher Administration</span>
          </>
        }
        emoji="🗺️"
        gradientClass="bg-gradient-to-r from-emerald-600 to-teal-700 text-white"
      />

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 text-sm">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
        <TownClassTabs
          allTowns={allTowns}
          currentTownClass={currentTownClass}
          onSelect={setCurrentTownClass}
        />

        {stats && (
          <div className="px-2 sm:px-4 py-2 sm:py-3 border-b border-gray-100">
            <div className="grid grid-cols-4 lg:grid-cols-4 gap-1.5 sm:gap-4 [&>*]:min-w-0">
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 shadow-sm min-w-0">
                <ResponsiveStatItem
                  compact
                  mobileLabel="Total"
                  label="Total Plots"
                  value={stats.total_parcels.toLocaleString()}
                  icon={MapPin}
                />
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 shadow-sm min-w-0">
                <ResponsiveStatItem
                  compact
                  mobileLabel="Avail"
                  label="Available"
                  value={stats.available_parcels.toLocaleString()}
                  icon={CheckCircle}
                  valueClassName="text-green-600"
                />
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 shadow-sm min-w-0">
                <ResponsiveStatItem
                  compact
                  label="Owned"
                  value={stats.owned_parcels.toLocaleString()}
                  icon={Users}
                  valueClassName="text-blue-600"
                />
              </div>
              <div className="bg-white rounded-lg sm:rounded-xl p-2 sm:p-4 border border-gray-200 shadow-sm min-w-0">
                <ResponsiveStatItem
                  compact
                  mobileLabel="Pending"
                  label="Pending Requests"
                  value={stats.pending_requests}
                  icon={Clock}
                  valueClassName="text-amber-600"
                />
              </div>
            </div>
          </div>
        )}

        <ResponsiveTabNav
          variant="emerald"
          tabs={[
            { id: 'grid', label: 'Land Grid', mobileLabel: 'Grid', icon: Map },
            { id: 'requests', label: 'Purchase Requests', mobileLabel: 'Requests', icon: Clock, badge: stats?.pending_requests },
            { id: 'stats', label: 'Statistics', mobileLabel: 'Stats', icon: DollarSign },
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as typeof activeTab)}
        />

        <div className="p-3 sm:p-6 min-w-0">
          {/* Grid Tab */}
          {activeTab === 'grid' && (
            <>
              {stats && stats.total_parcels === 0 && (
                <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">No Land Data Yet</h3>
                  <p className="text-amber-600 mb-4">Click the button below to generate 100 land plots per town (300 total across 6A, 6B, and 6C)</p>
                  <button
                    onClick={handleSeedData}
                    disabled={seeding}
                    className="px-6 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors font-medium flex items-center space-x-2 mx-auto"
                  >
                    <Database className="h-5 w-5" />
                    <span>{seeding ? 'Seeding Land Data...' : 'Seed Land Data Now'}</span>
                  </button>
                </div>
              )}
              <LandGrid readOnly={true} canRearrange={true} canManageOwnership={true} townClass={currentTownClass} />
            </>
          )}

          {/* Requests Tab */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex items-center space-x-4">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">All Requests</option>
                  <option value="pending_teacher">Awaiting teacher</option>
                  <option value="pending_engineer">Awaiting engineers</option>
                  <option value="pending_fm">Awaiting Financial Manager</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
                <button
                  onClick={fetchData}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Requests List */}
              {loading ? (
                <LoadingState />
              ) : requests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={`No ${filterStatus || ''} purchase requests found`}
                />
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                            style={{ backgroundColor: request.parcel_biome_type ? BIOME_CONFIG[request.parcel_biome_type].lightColor : '#e5e7eb' }}
                          >
                            {request.parcel_biome_type ? BIOME_ICONS[request.parcel_biome_type] : '🗺️'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold text-gray-900">
                                Plot {request.parcel_grid_code}
                              </h4>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(request.status)}`}>
                                {formatPurchaseStatus(request.status)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Requested by: <strong>
                                {request.applicant_first_name && request.applicant_last_name 
                                  ? `${request.applicant_first_name} ${request.applicant_last_name}`
                                  : request.applicant_username}
                              </strong>
                              {request.applicant_class && ` (${request.applicant_class})`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {request.parcel_biome_type} • Offered: {formatCurrency(request.offered_price)}
                              {request.parcel_town_class && ` • Town ${request.parcel_town_class}`}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted: {new Date(request.created_at).toLocaleString()}
                            </p>
                            {(request.engineer_approvals_required ?? 0) > 0 && (
                              <p className="text-xs text-violet-700 mt-1">
                                Engineer approvals: {request.engineer_approvals_received ?? 0}/{request.engineer_approvals_required}
                                {request.status === 'pending_engineer' && request.engineer_review_deadline_at && (
                                  <> · Auto-approves absent reviewers after {request.engineer_auto_approval_after_days ?? LAND_ENGINEER_APPROVAL_AUTO_AFTER_DAYS} days ({new Date(request.engineer_review_deadline_at).toLocaleDateString()})</>
                                )}
                              </p>
                            )}
                            {request.denial_reason && (
                              <p className="text-sm text-red-600 mt-2">
                                Reason: {request.denial_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {request.status === 'pending_teacher' && (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleRequestAction(request.id, 'approved')}
                              disabled={actionLoading !== null}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              <span>{actionLoading === request.id ? 'Processing...' : 'Approve'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for denial (optional):');
                                handleRequestAction(request.id, 'denied', reason || undefined);
                              }}
                              disabled={actionLoading !== null}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                              <span>Deny</span>
                            </button>
                          </div>
                        )}
                        {request.status === 'pending_engineer' && (
                          <div className="flex flex-col items-end gap-2">
                            <button
                              onClick={() => handleMasterApprove(request.id)}
                              disabled={actionLoading !== null}
                              className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                              title="Bypass architect and civil engineer approval"
                            >
                              {actionLoading === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                              <span>{actionLoading === request.id ? 'Processing...' : 'Master Approve'}</span>
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for denial (optional):');
                                handleRequestAction(request.id, 'denied', reason || undefined);
                              }}
                              disabled={actionLoading !== null}
                              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1 text-sm"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Deny</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats Tab */}
          {activeTab === 'stats' && stats && (
            <div className="space-y-6">
              {/* Biome Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Biome Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats.biome_stats.map((biome) => (
                    <div 
                      key={biome.biome_type}
                      className="bg-white rounded-xl p-4 border-2"
                      style={{ borderColor: BIOME_CONFIG[biome.biome_type].color }}
                    >
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{BIOME_ICONS[biome.biome_type]}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{biome.biome_type}</h4>
                          <p className="text-sm text-gray-500">{biome.count} plots</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Owned:</span>
                          <span className="font-medium">{biome.owned_count} ({((biome.owned_count / biome.count) * 100).toFixed(1)}%)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Avg Value:</span>
                          <span className="font-medium">{formatCurrency(biome.avg_value)}</span>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all"
                          style={{ 
                            width: `${(biome.owned_count / biome.count) * 100}%`,
                            backgroundColor: BIOME_CONFIG[biome.biome_type].color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Owners */}
              {stats.top_owners.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Land Owners</h3>
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Plots</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {stats.top_owners.map((owner, idx) => (
                          <tr key={owner.username} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <span className={`font-bold ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700' : 'text-gray-500'}`}>
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-medium text-gray-900">
                                {owner.first_name && owner.last_name 
                                  ? `${owner.first_name} ${owner.last_name}`
                                  : owner.username}
                              </p>
                              <p className="text-sm text-gray-500">@{owner.username}</p>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-gray-900">
                              {owner.parcel_count} plots
                            </td>
                            <td className="px-4 py-3 text-right font-semibold text-green-600">
                              {formatCurrency(owner.total_value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ResponsivePage>
  );
};

// ============================================
// STUDENT LAND VIEW COMPONENT
// ============================================
interface StudentLandViewProps {
  landPlugin: any;
}

const StudentLandView: React.FC<StudentLandViewProps> = ({ landPlugin: _landPlugin }) => {
  const { user, refreshProfile } = useAuth();
  const { currentTown, currentTownClass } = useTown();
  const [activeTab, setActiveTab] = useState<'explore' | 'my-properties' | 'requests' | 'sales' | 'fm-approvals' | 'engineer-approvals'>('explore');
  const [myProperties, setMyProperties] = useState<MyPropertiesResponse | null>(null);
  const [myRequests, setMyRequests] = useState<LandPurchaseRequest[]>([]);
  const [mySales, setMySales] = useState<LandSaleRequest[]>([]);
  const [buyerOffers, setBuyerOffers] = useState<LandSaleRequest[]>([]);
  const [fmApprovals, setFmApprovals] = useState<LandSaleRequest[]>([]);
  const [fmPurchaseApprovals, setFmPurchaseApprovals] = useState<LandPurchaseRequest[]>([]);
  const [engineerApprovals, setEngineerApprovals] = useState<LandPurchaseRequest[]>([]);
  const [isFinancialManager, setIsFinancialManager] = useState(false);
  const [isLandEngineer, setIsLandEngineer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchMyData();
  }, [user?.id, user?.job_name]);

  const fetchMyData = async () => {
    setLoading(true);
    const landEngineerRole = user?.role === 'student' && isLandEngineerJob(user?.job_name);
    try {
      const [propertiesRes, requestsRes, salesRes, buyerRes] = await Promise.all([
        landApi.getMyProperties(),
        landApi.getPurchaseRequests(),
        landApi.getSaleRequests('seller'),
        landApi.getSaleRequests('buyer'),
      ]);
      setMyProperties(propertiesRes.data);
      setMyRequests(requestsRes.data);
      setMySales(salesRes.data);
      setBuyerOffers(buyerRes.data);

      let fmRole = false;
      try {
        const fmPurchasesRes = await landApi.getFmPurchaseRequests();
        setFmPurchaseApprovals(fmPurchasesRes.data);
        fmRole = true;
      } catch {
        setFmPurchaseApprovals([]);
      }
      try {
        const fmSalesRes = await landApi.getSaleRequests('fm');
        setFmApprovals(fmSalesRes.data);
        fmRole = true;
      } catch {
        setFmApprovals([]);
      }
      setIsFinancialManager(fmRole);

      if (landEngineerRole) {
        setIsLandEngineer(true);
        try {
          const engineerRes = await landApi.getEngineerPurchaseRequests();
          setEngineerApprovals(engineerRes.data);
        } catch {
          setEngineerApprovals([]);
        }
      } else {
        setEngineerApprovals([]);
        setIsLandEngineer(false);
      }
    } catch (err: any) {
      console.error('Failed to fetch land data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFmPurchaseReview = async (id: number, status: 'approved' | 'denied') => {
    let denialReason: string | undefined;
    if (status === 'denied') {
      denialReason = prompt('Reason for denial (optional):') || undefined;
    }
    setActionLoading(id);
    setError('');
    try {
      const res = await landApi.reviewFmPurchaseRequest(id, status, denialReason);
      const xpMsg = res.data.experience_points
        ? ` +${res.data.experience_points} XP${res.data.new_level ? ` — level ${res.data.new_level}!` : ''}.`
        : '';
      setSuccess(res.data.message + xpMsg);
      if (res.data.experience_points) await refreshProfile();
      fetchMyData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFmReview = async (id: number, status: 'pending_buyer' | 'denied') => {
    let denialReason: string | undefined;
    if (status === 'denied') {
      denialReason = prompt('Reason for denial (optional):') || undefined;
    }
    setActionLoading(id);
    setError('');
    try {
      await landApi.reviewSaleRequest(id, status, denialReason);
      setSuccess(status === 'denied' ? 'Sale denied' : 'Sale sent to buyer for acceptance');
      fetchMyData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAcceptSale = async (id: number) => {
    setActionLoading(id);
    setError('');
    try {
      await landApi.acceptSaleRequest(id);
      setSuccess('Property purchased successfully');
      fetchMyData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not complete purchase');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSale = async (id: number) => {
    setActionLoading(id);
    try {
      await landApi.cancelSaleRequest(id);
      fetchMyData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Could not cancel sale');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEngineerReview = async (id: number) => {
    setActionLoading(id);
    setError('');
    try {
      const res = await landApi.reviewEngineerPurchaseRequest(id, 'approved');
      const xpMsg = res.data.experience_points
        ? ` +${res.data.experience_points} XP${res.data.new_level ? ` — level ${res.data.new_level}!` : ''}.`
        : '';
      setSuccess(res.data.message + xpMsg);
      if (res.data.experience_points) await refreshProfile();
      fetchMyData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => purchaseStatusColor(status);

  if (!currentTownClass) {
    return (
      <EmptyState
        icon={MapPin}
        title="You need to be assigned to a class (6A, 6B, or 6C) to use the Land Registry."
        description="Please contact your teacher."
      />
    );
  }

  return (
    <ResponsivePage className="space-y-3 sm:space-y-6">
      <ResponsivePluginHero
        title="Land Registry"
        subtitle={currentTown?.town_name || `Class ${currentTownClass}`}
        emoji="🗺️"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-0">
        {myProperties && activeTab !== 'explore' && (
          <div className="px-3 pt-3 pb-2 border-b border-gray-100 sm:hidden">
            <div className="grid grid-cols-3 gap-2 [&>*]:min-w-0">
              <ResponsiveStatItem compact label="My Plots" value={myProperties.total_count} icon={MapPin} valueClassName="text-primary-600" />
              <ResponsiveStatItem compact label="Value" value={formatCurrency(myProperties.total_value)} icon={DollarSign} valueClassName="text-green-600" />
              <ResponsiveStatItem compact label="Pending" value={myRequests.filter(r => isActivePurchaseStatus(r.status)).length} icon={Clock} valueClassName="text-amber-600" />
            </div>
          </div>
        )}

        {myProperties && (
          <div className="hidden sm:block px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <ResponsiveGrid preset="1-3">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-w-0">
                <ResponsiveStatItem
                  label="My Plots"
                  value={myProperties.total_count}
                  icon={MapPin}
                  valueClassName="text-primary-600"
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-w-0">
                <ResponsiveStatItem
                  label="Portfolio Value"
                  value={formatCurrency(myProperties.total_value)}
                  icon={DollarSign}
                  valueClassName="text-green-600"
                  helper={
                    myProperties.total_purchase_value != null && myProperties.total_value > myProperties.total_purchase_value
                      ? `+${formatCurrency(myProperties.total_value - myProperties.total_purchase_value)} appreciation`
                      : undefined
                  }
                />
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 min-w-0">
                <ResponsiveStatItem
                  label="Pending Requests"
                  value={myRequests.filter(r => isActivePurchaseStatus(r.status)).length}
                  icon={Clock}
                  valueClassName="text-amber-600"
                />
              </div>
            </ResponsiveGrid>
          </div>
        )}

        {(error || success) && (
          <div className={`mx-3 sm:mx-6 mt-3 sm:mt-4 px-3 py-2 rounded-lg text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {error || success}
          </div>
        )}
        <ResponsiveTabNav
          variant="primary"
          tabs={[
            { id: 'explore', label: 'Explore Land', mobileLabel: 'Explore', icon: Map },
            { id: 'my-properties', label: 'My Plots', mobileLabel: 'Plots', icon: MapPin, badge: myProperties?.total_count },
            { id: 'requests', label: 'Buy Requests', mobileLabel: 'Buy', icon: Clock, badge: myRequests.filter(r => isActivePurchaseStatus(r.status)).length },
            { id: 'sales', label: 'Sales', mobileLabel: 'Sales', icon: DollarSign, badge: buyerOffers.filter(r => r.status === 'pending_buyer').length + mySales.filter(r => r.status === 'pending_fm' || r.status === 'pending_buyer').length },
            ...(isLandEngineer ? [{ id: 'engineer-approvals', label: 'Land Approvals', mobileLabel: 'Engineer', icon: HardHat, badge: engineerApprovals.length }] : []),
            ...(isFinancialManager ? [{ id: 'fm-approvals', label: 'FM Approvals', mobileLabel: 'FM', icon: CheckCircle, badge: fmApprovals.length + fmPurchaseApprovals.length }] : []),
          ]}
          activeTab={activeTab}
          onTabChange={(id) => setActiveTab(id as typeof activeTab)}
        />

        <div className="p-3 sm:p-6 min-w-0">
          {/* Explore Tab */}
          {activeTab === 'explore' && (
            <LandGrid onParcelSelect={(parcel) => console.log('Selected:', parcel)} townClass={currentTownClass} />
          )}

          {/* My Properties Tab */}
          {activeTab === 'my-properties' && (
            loading ? (
              <LoadingState />
            ) : myProperties && myProperties.parcels.length === 0 ? (
              <EmptyState
                icon={MapPin}
                title="You don't own any land yet"
                description="Explore the grid and purchase your first plot!"
              />
            ) : myProperties && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Properties grow <strong>1% per week</strong>. Collect <strong>5% rental income</strong> weekly, or sell to a classmate (Financial Manager approval required).
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myProperties.parcels.map((parcel) => (
                    <LandPropertyCard key={parcel.id} parcel={parcel} onUpdated={fetchMyData} />
                  ))}
                </div>
              </div>
            )
          )}

          {/* Sales Tab */}
          {activeTab === 'sales' && (
            loading ? (
              <LoadingState />
            ) : (
              <div className="space-y-6">
                {buyerOffers.filter(r => r.status === 'pending_buyer').length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Offers waiting for you</h3>
                    <div className="space-y-3">
                      {buyerOffers.filter(r => r.status === 'pending_buyer').map((sale) => (
                        <div key={sale.id} className="border border-primary-200 bg-primary-50 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{sale.parcel_grid_code} — {sale.parcel_biome_type}</p>
                            <p className="text-sm text-gray-600">
                              From {sale.seller_first_name || sale.seller_username} · {formatCurrency(sale.sale_price)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAcceptSale(sale.id)}
                            disabled={actionLoading === sale.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                          >
                            {actionLoading === sale.id ? 'Processing…' : 'Accept & buy'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">My sale requests</h3>
                  {mySales.length === 0 ? (
                    <p className="text-gray-500 text-sm">No sale requests yet. Sell a plot from My Plots.</p>
                  ) : (
                    <div className="space-y-3">
                      {mySales.map((sale) => (
                        <div key={sale.id} className="border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{sale.parcel_grid_code} → {sale.buyer_username}</p>
                            <p className="text-sm text-gray-600">{formatCurrency(sale.sale_price)} · {sale.status.replace('_', ' ')}</p>
                          </div>
                          {sale.status === 'pending_fm' && (
                            <button type="button" onClick={() => handleCancelSale(sale.id)} disabled={actionLoading === sale.id} className="text-sm text-red-600 hover:text-red-700">
                              Cancel
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {/* FM Approvals Tab */}
          {activeTab === 'fm-approvals' && isFinancialManager && (
            loading ? (
              <LoadingState />
            ) : fmApprovals.length === 0 && fmPurchaseApprovals.length === 0 ? (
              <EmptyState title="No land purchases or sales awaiting your approval" />
            ) : (
              <div className="space-y-6">
                {fmPurchaseApprovals.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Land purchases — affordability review</h3>
                    <p className="text-sm text-gray-600">
                      Check that the buyer can cover the plot price plus 5% professional fees (split between you, architects, and civil engineers). You earn <strong>+10 XP</strong> for each purchase you clear.
                    </p>
                    {fmPurchaseApprovals.map((request) => {
                      const breakdown = request.cost_breakdown;
                      return (
                        <div key={`purchase-${request.id}`} className="border border-emerald-200 bg-emerald-50 rounded-xl p-4 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold">{request.parcel_grid_code} ({request.parcel_biome_type})</p>
                              <p className="text-sm text-gray-700">
                                Buyer: {request.applicant_first_name || request.applicant_username}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleFmPurchaseReview(request.id, 'approved')}
                                disabled={actionLoading === request.id || breakdown?.can_afford === false}
                                className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFmPurchaseReview(request.id, 'denied')}
                                disabled={actionLoading === request.id}
                                className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                              >
                                Deny
                              </button>
                            </div>
                          </div>
                          {breakdown && (
                            <div className="bg-white/80 rounded-lg p-3 text-sm space-y-1 border border-emerald-100">
                              <div className="flex justify-between">
                                <span>Buyer balance</span>
                                <span className={breakdown.can_afford ? 'text-green-700 font-medium' : 'text-red-700 font-medium'}>
                                  {formatCurrency(breakdown.buyer_balance)}
                                </span>
                              </div>
                              <div className="flex justify-between text-gray-700">
                                <span>Plot price</span>
                                <span>{formatCurrency(breakdown.plot_price)}</span>
                              </div>
                              <div className="flex justify-between font-medium text-gray-800">
                                <span>Professional fees (5% total)</span>
                                <span>{formatCurrency(breakdown.professional_fee_total)}</span>
                              </div>
                              <div className="flex justify-between text-gray-600 text-xs pl-2">
                                <span>Your FM share</span>
                                <span>{formatCurrency(breakdown.fm_fee)}</span>
                              </div>
                              <div className="flex justify-between text-gray-600 text-xs pl-2">
                                <span>Architect &amp; engineer share</span>
                                <span>{formatCurrency(breakdown.engineer_fee_total)}</span>
                              </div>
                              {(request.required_engineers?.length ?? 0) > 0 && (
                                <ul className="text-xs text-gray-600 pl-4 space-y-0.5">
                                  {request.required_engineers!.map((eng) => (
                                    <li key={eng.id}>
                                      {eng.job_name} — {eng.first_name || eng.username}: {formatCurrency(breakdown.engineer_fee_per_approver)} each
                                    </li>
                                  ))}
                                </ul>
                              )}
                              <div className="flex justify-between font-semibold text-gray-900 border-t border-emerald-100 pt-2 mt-1">
                                <span>Total required</span>
                                <span>{formatCurrency(breakdown.total_required)}</span>
                              </div>
                              {!breakdown.can_afford && (
                                <p className="text-red-700 text-xs font-medium pt-1">
                                  Buyer cannot afford this purchase — deny or wait until their balance is sufficient.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {fmApprovals.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900">Peer land sales</h3>
                {fmApprovals.map((sale) => (
                  <div key={sale.id} className="border border-amber-200 bg-amber-50 rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{sale.parcel_grid_code} ({sale.parcel_biome_type})</p>
                        <p className="text-sm text-gray-700">
                          {sale.seller_first_name || sale.seller_username} → {sale.buyer_first_name || sale.buyer_username}
                        </p>
                        <p className="text-sm font-medium text-green-700">{formatCurrency(sale.sale_price)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleFmReview(sale.id, 'pending_buyer')}
                          disabled={actionLoading === sale.id}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFmReview(sale.id, 'denied')}
                          disabled={actionLoading === sale.id}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50"
                        >
                          Deny
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                  </div>
                )}
              </div>
            )
          )}

          {/* Engineer Approvals Tab */}
          {activeTab === 'engineer-approvals' && isLandEngineer && (
            loading ? (
              <LoadingState />
            ) : engineerApprovals.length === 0 ? (
              <EmptyState title="No land purchases awaiting your approval" />
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Approve land purchases after the Financial Manager has cleared affordability. Architects and Civil Engineers earn <strong>+50 XP</strong> plus their share of the <strong>5% professional fee pool</strong> when they approve.
                </p>
                {engineerApprovals.map((request) => (
                  <div key={request.id} className="border border-violet-200 bg-violet-50 rounded-xl p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{request.parcel_grid_code} ({request.parcel_biome_type})</p>
                        <p className="text-sm text-gray-700">
                          Buyer: {request.applicant_first_name || request.applicant_username} · {formatCurrency(request.offered_price)}
                        </p>
                        <p className="text-xs text-violet-700 mt-1">
                          Approvals: {request.engineer_approvals_received ?? 0}/{request.engineer_approvals_required ?? 0}
                          {request.engineer_fee_per_approver != null && request.engineer_fee_per_approver > 0 && (
                            <> · Your fee: {formatCurrency(request.engineer_fee_per_approver)}</>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEngineerReview(request.id)}
                          disabled={actionLoading === request.id}
                          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* My Requests Tab */}
          {activeTab === 'requests' && (
            loading ? (
              <LoadingState />
            ) : myRequests.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No purchase requests yet"
                description="Your purchase requests will appear here"
              />
            ) : (
              <div className="space-y-4">
                {myRequests.map((request) => (
                  <div 
                    key={request.id}
                    className={`rounded-xl border ${getStatusColor(request.status)} overflow-hidden`}
                  >
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => setExpandedRequest(expandedRequest === request.id ? null : request.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {request.parcel_biome_type ? BIOME_ICONS[request.parcel_biome_type] : '🗺️'}
                          </span>
                          <div>
                            <h4 className="font-semibold">Parcel {request.parcel_grid_code}</h4>
                            <p className="text-sm opacity-80">
                              {request.parcel_biome_type} • {formatCurrency(request.offered_price)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-medium">{formatPurchaseStatus(request.status)}</span>
                          {expandedRequest === request.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {expandedRequest === request.id && (
                      <div className="px-4 pb-4 pt-2 border-t space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="opacity-70">Submitted:</span>
                          <span>{new Date(request.created_at).toLocaleString()}</span>
                        </div>
                        {request.fm_reviewed_at && (
                          <div className="flex justify-between">
                            <span className="opacity-70">FM review:</span>
                            <span>{request.fm_reviewer_username || 'Financial Manager'}</span>
                          </div>
                        )}
                        {(request.engineer_approvals_required ?? 0) > 0 && (
                          <div className="flex justify-between">
                            <span className="opacity-70">Engineer approvals:</span>
                            <span>{request.engineer_approvals_received ?? 0} / {request.engineer_approvals_required}</span>
                          </div>
                        )}
                        {request.reviewed_at && (
                          <div className="flex justify-between">
                            <span className="opacity-70">Reviewed:</span>
                            <span>{new Date(request.reviewed_at).toLocaleString()}</span>
                          </div>
                        )}
                        {request.reviewer_username && (
                          <div className="flex justify-between">
                            <span className="opacity-70">Reviewed by:</span>
                            <span>{request.reviewer_username}</span>
                          </div>
                        )}
                        {request.denial_reason && (
                          <div className="mt-2 p-2 bg-white/50 rounded-lg">
                            <p className="text-sm font-medium">Reason:</p>
                            <p className="text-sm">{request.denial_reason}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </ResponsivePage>
  );
};

// ============================================
// MAIN LAND PLUGIN COMPONENT
// ============================================
const LandPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const landPlugin = plugins.find(p => p.route_path === '/land');

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return <LoadingState />;
  }

  if (!landPlugin || !landPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  if (user?.role === 'teacher') {
    return <TeacherLandView landPlugin={landPlugin} />;
  }

  return <StudentLandView landPlugin={landPlugin} />;
};

export default LandPlugin;
