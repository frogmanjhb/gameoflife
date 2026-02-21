import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import {
  Shield, Loader2, AlertCircle, Heart, Wifi, Home, Filter
} from 'lucide-react';
import api from '../../services/api';

const INSURANCE_TYPES = [
  { id: 'health' as const, label: 'Health', icon: Heart, color: 'text-red-600', bg: 'bg-red-100' },
  { id: 'cyber' as const, label: 'Cyber', icon: Wifi, color: 'text-blue-600', bg: 'bg-blue-100' },
  { id: 'property' as const, label: 'Property', icon: Home, color: 'text-green-600', bg: 'bg-green-100' },
];

interface Quote {
  salary: number;
  rate_percent: number;
  per_type_per_week: number;
  types: string[];
}

interface Policy {
  id: number;
  insurance_type: string;
  weeks: number;
  total_cost: number;
  week_start_date: string;
  created_at: string;
  active?: boolean;
}

interface TeacherPurchase {
  id: number;
  user_id: number;
  insurance_type: string;
  weeks: number;
  total_cost: number;
  week_start_date: string;
  created_at: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  class?: string;
}

const InsurancePlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const insurancePlugin = plugins.find((p) => p.route_path === '/insurance');

  const [quote, setQuote] = useState<Quote | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [teacherPurchases, setTeacherPurchases] = useState<TeacherPurchase[]>([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [weeks, setWeeks] = useState(1);
  const [purchasing, setPurchasing] = useState(false);

  const [viewFilter, setViewFilter] = useState<'all' | 'class' | 'insurance' | 'individual'>('all');
  const [filterClass, setFilterClass] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterUsername, setFilterUsername] = useState<string>('');

  const isTeacher = user?.role === 'teacher';

  const fetchStudentData = useCallback(async () => {
    if (!user || user.role !== 'student') return;
    try {
      const [quoteRes, policiesRes] = await Promise.all([
        api.get('/insurance/quote'),
        api.get('/insurance/my-policies'),
      ]);
      setQuote(quoteRes.data);
      setPolicies(policiesRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load insurance data');
    }
  }, [user]);

  const fetchTeacherData = useCallback(async () => {
    if (!user || user.role !== 'teacher') return;
    try {
      const params: Record<string, string> = {};
      if (filterClass) params.class = filterClass;
      if (filterType) params.type = filterType;
      if (filterUsername) params.username = filterUsername;
      const [purchasesRes, classesRes] = await Promise.all([
        api.get('/insurance/purchases', { params }),
        api.get('/insurance/classes'),
      ]);
      setTeacherPurchases(purchasesRes.data || []);
      setClasses(classesRes.data || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load purchases');
    }
  }, [user, filterClass, filterType, filterUsername]);

  useEffect(() => {
    if (!insurancePlugin?.enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    if (isTeacher) {
      fetchTeacherData().finally(() => setLoading(false));
    } else {
      fetchStudentData().finally(() => setLoading(false));
    }
  }, [insurancePlugin?.enabled, isTeacher, fetchStudentData, fetchTeacherData]);

  const handleTypeToggle = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handlePurchase = async () => {
    if (!selectedTypes.length || weeks < 1) {
      setError('Select at least one insurance type and number of weeks.');
      return;
    }
    setPurchasing(true);
    setError('');
    setSuccess('');
    try {
      await api.post('/insurance/purchase', { types: selectedTypes, weeks });
      setSuccess(`Insurance purchased for ${weeks} week(s): ${selectedTypes.join(', ')}.`);
      setSelectedTypes([]);
      setWeeks(1);
      fetchStudentData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric', year: 'numeric' });

  if (pluginsLoading || !insurancePlugin) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!insurancePlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-r from-teal-600 to-cyan-700 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-4 rounded-xl">
            <Shield className="h-10 w-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Insurance</h1>
            <p className="text-teal-100">
              {isTeacher ? 'View all insurance purchases by class, type, or student' : 'Health, cyber and property insurance — 5% of salary per type per week'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
          {success}
        </div>
      )}

      {isTeacher ? (
        <>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <span className="font-semibold text-gray-900">View</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {(['all', 'class', 'insurance', 'individual'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setViewFilter(v)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    viewFilter === v
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {v === 'all' && 'All'}
                  {v === 'class' && 'By class'}
                  {v === 'insurance' && 'By insurance type'}
                  {v === 'individual' && 'By student'}
                </button>
              ))}
            </div>
            {(viewFilter === 'class' || viewFilter === 'all') && classes.length > 0 && (
              <div className="mt-3">
                <label className="text-sm text-gray-600 mr-2">Class:</label>
                <select
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="input-field mt-1 max-w-xs"
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
            {(viewFilter === 'insurance' || viewFilter === 'all') && (
              <div className="mt-3">
                <label className="text-sm text-gray-600 mr-2">Type:</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input-field mt-1 max-w-xs"
                >
                  <option value="">All types</option>
                  {INSURANCE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
              </div>
            )}
            {viewFilter === 'individual' && (
              <div className="mt-3">
                <label className="text-sm text-gray-600 mr-2">Username:</label>
                <input
                  type="text"
                  value={filterUsername}
                  onChange={(e) => setFilterUsername(e.target.value)}
                  placeholder="Filter by username"
                  className="input-field mt-1 max-w-xs"
                />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : teacherPurchases.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No insurance purchases yet.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weeks</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week start</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {teacherPurchases.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {p.first_name} {p.last_name}
                            </p>
                            <p className="text-sm text-gray-500">{p.username}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.class || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            INSURANCE_TYPES.find((t) => t.id === p.insurance_type)?.bg || 'bg-gray-100'
                          } ${INSURANCE_TYPES.find((t) => t.id === p.insurance_type)?.color || 'text-gray-700'}`}>
                            {INSURANCE_TYPES.find((t) => t.id === p.insurance_type)?.label || p.insurance_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{p.weeks}</td>
                        <td className="px-4 py-3 font-semibold text-primary-600">{formatCurrency(parseFloat(String(p.total_cost)))}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(p.week_start_date)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(p.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {quote && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Cost</h2>
              <p className="text-gray-600 mb-2">
                Your salary: <strong>{formatCurrency(quote.salary)}</strong> per week.
              </p>
              <p className="text-gray-600 mb-4">
                Each insurance type costs <strong>{quote.rate_percent}%</strong> of your salary per week ({formatCurrency(quote.per_type_per_week)} per type).
              </p>
              {quote.salary <= 0 && (
                <p className="text-amber-700 bg-amber-50 rounded-lg p-3 text-sm">
                  You need a job to buy insurance. Get a job first, then return here.
                </p>
              )}
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Buy insurance</h2>
            <p className="text-sm text-gray-600 mb-4">Select one or more types and number of weeks. Cost is 5% of salary per type per week.</p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Types</p>
                <div className="flex flex-wrap gap-3">
                  {INSURANCE_TYPES.map((t) => {
                    const Icon = t.icon;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleTypeToggle(t.id)}
                        disabled={!quote || quote.salary <= 0}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-colors ${
                          selectedTypes.includes(t.id)
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        <Icon className={`h-5 w-5 ${t.color}`} />
                        <span>{t.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Weeks (1–52)</label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={(e) => setWeeks(Math.max(1, Math.min(52, parseInt(e.target.value, 10) || 1)))}
                  className="input-field mt-1 w-24"
                />
              </div>
              <button
                onClick={handlePurchase}
                disabled={purchasing || !selectedTypes.length || !quote || quote.salary <= 0}
                className="btn-primary flex items-center gap-2"
              >
                {purchasing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                Purchase insurance
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your available systems</h2>
            <p className="text-sm text-gray-600 mb-4">Insurance policies you have bought. Active policies are currently in effect.</p>
            {policies.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No insurance yet. Buy above to add coverage.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {policies.map((p) => {
                  const meta = INSURANCE_TYPES.find((t) => t.id === p.insurance_type);
                  const Icon = meta?.icon || Shield;
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 ${
                        p.active ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${meta?.bg || 'bg-gray-200'}`}>
                          <Icon className={`h-5 w-5 ${meta?.color || 'text-gray-600'}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{meta?.label || p.insurance_type}</p>
                          <p className="text-sm text-gray-600">
                            {p.weeks} week(s) from {formatDate(p.week_start_date)} • {formatCurrency(parseFloat(String(p.total_cost)))}
                          </p>
                        </div>
                      </div>
                      {p.active && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-teal-200 text-teal-800">
                          Active
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default InsurancePlugin;
