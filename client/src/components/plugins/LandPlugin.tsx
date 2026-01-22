import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { 
  Map, Loader2, CheckCircle, XCircle, Clock, 
  Users, DollarSign, MapPin, RefreshCw, Database, Filter,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { landApi } from '../../services/api';
import { LandPurchaseRequest, LandStats, MyPropertiesResponse } from '../../types';
import { formatCurrency, BIOME_CONFIG, BIOME_ICONS, RISK_COLORS } from '../land/BiomeConfig';
import LandGrid from '../land/LandGrid';

// ============================================
// TEACHER LAND VIEW COMPONENT
// ============================================
interface TeacherLandViewProps {
  landPlugin: any;
}

const TeacherLandView: React.FC<TeacherLandViewProps> = ({ landPlugin: _landPlugin }) => {
  const [activeTab, setActiveTab] = useState<'grid' | 'requests' | 'stats'>('grid');
  const [requests, setRequests] = useState<LandPurchaseRequest[]>([]);
  const [stats, setStats] = useState<LandStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<'pending' | 'approved' | 'denied' | ''>('pending');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [requestsRes, statsRes] = await Promise.all([
        landApi.getPurchaseRequests(filterStatus || undefined),
        landApi.getStats()
      ]);
      setRequests(requestsRes.data);
      setStats(statsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch land data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (id: number, status: 'approved' | 'denied', reason?: string) => {
    setActionLoading(id);
    setError('');
    setSuccess('');
    try {
      await landApi.updatePurchaseRequest(id, status, reason);
      setSuccess(`Request ${status} successfully`);
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.error || `Failed to ${status} request`);
    } finally {
      setActionLoading(null);
    }
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
      case 'pending': return 'bg-amber-100 text-amber-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-4xl">🗺️</div>
            <div>
              <h1 className="text-2xl font-bold">Land Registry Management</h1>
              <p className="text-emerald-100">Teacher Administration Panel</p>
            </div>
          </div>
          <button
            onClick={handleSeedData}
            disabled={seeding || (stats !== null && stats.total_parcels > 0)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
              stats && stats.total_parcels > 0 
                ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                : 'bg-white/20 hover:bg-white/30'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{seeding ? 'Seeding...' : stats && stats.total_parcels > 0 ? 'Data Seeded' : 'Seed Land Data'}</span>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">Total Plots</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.total_parcels.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Available</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.available_parcels.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Owned</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{stats.owned_parcels.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Pending Requests</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{stats.pending_requests}</p>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <XCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'grid', label: 'Land Grid', icon: Map },
              { id: 'requests', label: 'Purchase Requests', icon: Clock, badge: stats?.pending_requests },
              { id: 'stats', label: 'Statistics', icon: DollarSign }
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">{badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Grid Tab */}
          {activeTab === 'grid' && (
            <>
              {stats && stats.total_parcels === 0 && (
                <div className="mb-6 bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                  <Database className="h-12 w-12 mx-auto mb-4 text-amber-500" />
                  <h3 className="text-lg font-semibold text-amber-800 mb-2">No Land Data Yet</h3>
                  <p className="text-amber-600 mb-4">Click the button below to generate 100 land plots (10x10 grid)</p>
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
              <LandGrid readOnly={true} />
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
                  <option value="pending">Pending</option>
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
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No {filterStatus || ''} purchase requests found</p>
                </div>
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
                                {request.status.toUpperCase()}
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
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Submitted: {new Date(request.created_at).toLocaleString()}
                            </p>
                            {request.denial_reason && (
                              <p className="text-sm text-red-600 mt-2">
                                Reason: {request.denial_reason}
                              </p>
                            )}
                          </div>
                        </div>

                        {request.status.toLowerCase() === 'pending' && (
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
    </div>
  );
};

// ============================================
// STUDENT LAND VIEW COMPONENT
// ============================================
interface StudentLandViewProps {
  landPlugin: any;
}

const StudentLandView: React.FC<StudentLandViewProps> = ({ landPlugin: _landPlugin }) => {
  const [activeTab, setActiveTab] = useState<'explore' | 'my-properties' | 'requests'>('explore');
  const [myProperties, setMyProperties] = useState<MyPropertiesResponse | null>(null);
  const [myRequests, setMyRequests] = useState<LandPurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState<number | null>(null);

  useEffect(() => {
    fetchMyData();
  }, []);

  const fetchMyData = async () => {
    setLoading(true);
    try {
      const [propertiesRes, requestsRes] = await Promise.all([
        landApi.getMyProperties(),
        landApi.getPurchaseRequests()
      ]);
      setMyProperties(propertiesRes.data);
      setMyRequests(requestsRes.data);
    } catch (err: any) {
      console.error('Failed to fetch land data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'approved': return 'bg-green-100 text-green-800 border-green-300';
      case 'denied': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🗺️</div>
          <div>
            <h1 className="text-2xl font-bold">Land Registry</h1>
            <p className="text-primary-100">Explore and purchase land parcels</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {myProperties && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium">My Plots</span>
            </div>
            <p className="text-2xl font-bold text-primary-600">{myProperties.total_count}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <DollarSign className="h-4 w-4" />
              <span className="text-xs font-medium">Portfolio Value</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(myProperties.total_value)}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-medium">Pending Requests</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">
              {myRequests.filter(r => r.status === 'pending').length}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'explore', label: 'Explore Land', icon: Map },
              { id: 'my-properties', label: 'My Plots', icon: MapPin, badge: myProperties?.total_count },
              { id: 'requests', label: 'My Requests', icon: Clock, badge: myRequests.filter(r => r.status === 'pending').length }
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="bg-primary-500 text-white text-xs px-2 py-0.5 rounded-full">{badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Explore Tab */}
          {activeTab === 'explore' && (
            <LandGrid onParcelSelect={(parcel) => console.log('Selected:', parcel)} />
          )}

          {/* My Properties Tab */}
          {activeTab === 'my-properties' && (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
            ) : myProperties && myProperties.parcels.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>You don't own any land yet</p>
              <p className="text-sm mt-1">Explore the grid and purchase your first plot!</p>
              </div>
            ) : myProperties && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myProperties.parcels.map((parcel) => (
                  <div 
                    key={parcel.id}
                    className="bg-white rounded-xl border-2 overflow-hidden hover:shadow-lg transition-shadow"
                    style={{ borderColor: BIOME_CONFIG[parcel.biome_type].color }}
                  >
                    <div 
                      className="p-4 text-white"
                      style={{ backgroundColor: BIOME_CONFIG[parcel.biome_type].color }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{BIOME_ICONS[parcel.biome_type]}</span>
                          <div>
                            <h4 className="font-bold">{parcel.grid_code}</h4>
                            <p className="text-sm opacity-80">{parcel.biome_type}</p>
                          </div>
                        </div>
                        <p className="text-lg font-bold">{formatCurrency(parcel.value)}</p>
                      </div>
                    </div>
                    <div className="p-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between text-gray-600">
                        <span>Location:</span>
                        <span className="font-medium">Row {parcel.row_index + 1}, Col {parcel.col_index + 1}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Risk:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${RISK_COLORS[parcel.risk_level].bg} ${RISK_COLORS[parcel.risk_level].text} capitalize`}>
                          {parcel.risk_level}
                        </span>
                      </div>
                      {parcel.purchased_at && (
                        <div className="flex items-center justify-between text-gray-600">
                          <span>Purchased:</span>
                          <span className="font-medium">{new Date(parcel.purchased_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* My Requests Tab */}
          {activeTab === 'requests' && (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
              </div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No purchase requests yet</p>
                <p className="text-sm mt-1">Your purchase requests will appear here</p>
              </div>
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
                          <span className="text-xs font-medium uppercase">{request.status}</span>
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
    </div>
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
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
