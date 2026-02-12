import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate, useSearchParams } from 'react-router-dom';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  LogIn,
  Sparkles,
  Send,
  ShoppingBag,
  Loader2,
  User,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const METRICS = [
  { id: 'logins', label: 'Logins', icon: LogIn, color: '#3b82f6' },
  { id: 'chores', label: 'Chores', icon: Sparkles, color: '#10b981' },
  { id: 'transfers', label: 'Transfers', icon: Send, color: '#8b5cf6' },
  { id: 'purchases', label: 'Purchases', icon: ShoppingBag, color: '#f59e0b' }
] as const;

const CHART_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];

const EngagementPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const [searchParams, setSearchParams] = useSearchParams();
  const engagementPlugin = plugins.find((p) => p.route_path === '/engagement');

  const [summary, setSummary] = useState<{
    logins: number;
    chores: number;
    transfers: number;
    purchases: number;
  } | null>(null);
  const [overTimeData, setOverTimeData] = useState<{ date: string; count: number }[]>([]);
  const [byClassData, setByClassData] = useState<{ class: string; count: number }[]>([]);
  const [students, setStudents] = useState<
    { user_id: number; username: string; first_name: string; last_name: string; class: string; count: number }[]
  >([]);
  const [classes, setClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const [metric, setMetric] = useState<string>(() => searchParams.get('metric') || 'logins');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>(
    () => (searchParams.get('view') as 'line' | 'bar' | 'pie') || 'line'
  );
  const [days, setDays] = useState(30);
  const [classFilter, setClassFilter] = useState<string>(() => searchParams.get('class') || '');
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [showStudents, setShowStudents] = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/engagement/summary');
      setSummary(res.data);
    } catch (err) {
      console.error('Engagement summary error:', err);
      setSummary({ logins: 0, chores: 0, transfers: 0, purchases: 0 });
    }
  }, []);

  const fetchOverTime = useCallback(async () => {
    try {
      const res = await api.get('/engagement/over-time', {
        params: { metric, days, class: classFilter || undefined }
      });
      setOverTimeData(res.data.data || []);
    } catch (err) {
      console.error('Engagement over-time error:', err);
      setOverTimeData([]);
    }
  }, [metric, days, classFilter]);

  const fetchByClass = useCallback(async () => {
    try {
      const res = await api.get('/engagement/by-class', {
        params: { metric, days }
      });
      setByClassData(res.data.data || []);
    } catch (err) {
      console.error('Engagement by-class error:', err);
      setByClassData([]);
    }
  }, [metric, days]);

  const fetchClasses = useCallback(async () => {
    try {
      const res = await api.get('/engagement/classes');
      setClasses(res.data.classes || []);
    } catch (err) {
      console.error('Engagement classes error:', err);
      setClasses([]);
    }
  }, []);

  const fetchStudents = useCallback(
    async (className?: string) => {
      setStudentsLoading(true);
      try {
        const res = await api.get('/engagement/students', {
          params: {
            metric,
            days,
            class: className || classFilter || undefined,
            limit: 25
          }
        });
        setStudents(res.data.data || []);
        setSelectedClass(className || classFilter || null);
        setShowStudents(true);
      } catch (err) {
        console.error('Engagement students error:', err);
        setStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    },
    [metric, days, classFilter]
  );

  useEffect(() => {
    if (user?.role !== 'teacher' || !engagementPlugin?.enabled) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchClasses()]);
      setLoading(false);
    };
    load();
  }, [user?.role, engagementPlugin?.enabled, fetchSummary, fetchClasses]);

  useEffect(() => {
    if (user?.role !== 'teacher' || !engagementPlugin?.enabled) return;
    fetchOverTime();
  }, [user?.role, engagementPlugin?.enabled, fetchOverTime]);

  useEffect(() => {
    if (user?.role !== 'teacher' || !engagementPlugin?.enabled) return;
    fetchByClass();
  }, [user?.role, engagementPlugin?.enabled, fetchByClass]);

  useEffect(() => {
    setSearchParams(
      {
        ...(metric ? { metric } : {}),
        ...(chartType ? { view: chartType } : {}),
        ...(classFilter ? { class: classFilter } : {})
      },
      { replace: true }
    );
  }, [metric, chartType, classFilter, setSearchParams]);

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!engagementPlugin || !engagementPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  const handleBarClick = (data: { class?: string }) => {
    if (data?.class) fetchStudents(data.class);
  };

  const handlePieClick = (data: { name?: string }) => {
    if (data?.name) fetchStudents(data.name);
  };

  const currentMetric = METRICS.find((m) => m.id === metric) || METRICS[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📊</div>
          <div>
            <h1 className="text-2xl font-bold">Engagement Analytics</h1>
            <p className="text-indigo-100">
              Track logins, chores, transfers, and purchases at individual, class, and school level
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {METRICS.map((m) => {
            const Icon = m.icon;
            const count = summary ? summary[m.id as keyof typeof summary] : 0;
            return (
              <div
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`bg-white rounded-xl p-4 border-2 cursor-pointer transition-all ${
                  metric === m.id ? 'border-primary-500 shadow-md' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5" style={{ color: m.color }} />
                  <span className="text-xs font-medium text-gray-500">Last 30d</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{count.toLocaleString()}</p>
                <p className="text-sm text-gray-600">{m.label}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">View:</span>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'pie')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="line">Line</option>
            <option value="bar">Bar</option>
            <option value="pie">Pie</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Period:</span>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value={7}>7 days</option>
            <option value={14}>14 days</option>
            <option value={30}>30 days</option>
            <option value={90}>90 days</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Class:</span>
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">All classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Chart Area */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          {currentMetric.label} over time
          {(chartType === 'bar' || chartType === 'pie') && ' by class'}
        </h2>

        <div className="h-80">
          {chartType === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overTimeData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name={currentMetric.label}
                  stroke={currentMetric.color}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          {chartType === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={byClassData}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                onClick={(e) => e?.activePayload?.[0]?.payload && handleBarClick(e.activePayload[0].payload)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                <Legend />
                <Bar
                  dataKey="count"
                  name={currentMetric.label}
                  fill={currentMetric.color}
                  cursor="pointer"
                  onClick={(_, payload) => payload && handleBarClick(payload)}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
          {chartType === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byClassData}
                  dataKey="count"
                  nameKey="class"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ class: c, count }) => `${c}: ${count}`}
                  onClick={(_, index) => byClassData[index] && handlePieClick({ name: byClassData[index].class })}
                >
                  {byClassData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} cursor="pointer" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          {chartType === 'bar' || chartType === 'pie'
            ? 'Click a bar or segment to view students'
            : 'Time series shows school-wide or filtered class activity'}
        </p>

        <button
          onClick={() => fetchStudents()}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          View top students
        </button>
      </div>

      {/* Students Modal */}
      {showStudents && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Top students – {currentMetric.label}
                {selectedClass && ` (${selectedClass})`}
              </h3>
              <button
                onClick={() => setShowStudents(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-96">
              {studentsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No students found</p>
              ) : (
                <ul className="space-y-2">
                  {students.map((s, i) => (
                    <li
                      key={s.user_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 font-medium w-6">{i + 1}.</span>
                        <div>
                          <Link
                            to={`/student/${s.username}`}
                            className="font-medium text-primary-600 hover:underline"
                          >
                            {s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username}
                          </Link>
                          <p className="text-xs text-gray-500">{s.class}</p>
                        </div>
                      </div>
                      <span className="font-bold text-gray-900">{s.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EngagementPlugin;
