import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { BarChart3, TrendingUp, PieChart, Users, Calendar } from 'lucide-react';
import { teacherAnalyticsApi } from '../../services/api';
import { EngagementAnalytics, EngagementTimeSeries, EngagementByClass, EngagementByStudent, StudentLoginRow } from '../../types';

const AnalyticsPlugin: React.FC = () => {
  const { user } = useAuth();
  const { plugins, loading: pluginsLoading } = usePlugins();
  const analyticsPlugin = plugins.find(p => p.route_path === '/analytics');

  type TabId = 'overview' | 'engagement' | 'byclass' | 'bystudent' | 'logins';
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [analytics, setAnalytics] = useState<EngagementAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [studentLogins, setStudentLogins] = useState<StudentLoginRow[]>([]);
  const [studentLoginsLoading, setStudentLoginsLoading] = useState(false);
  const [studentLoginsError, setStudentLoginsError] = useState('');

  // Scope for engagement API: only 'students' when on By student tab, else 'school'
  const scope = activeTab === 'bystudent' ? 'students' : 'school';

  useEffect(() => {
    if (user?.role === 'teacher' && analyticsPlugin?.enabled) {
      fetchAnalytics();
    }
  }, [timeRange, scope, selectedClass, user?.role, analyticsPlugin?.enabled]);

  useEffect(() => {
    if (user?.role === 'teacher' && analyticsPlugin?.enabled) {
      fetchStudentLogins();
    }
  }, [timeRange, user?.role, analyticsPlugin?.enabled]);

  const fetchStudentLogins = async () => {
    try {
      setStudentLoginsLoading(true);
      setStudentLoginsError('');
      const period = timeRange === 'day' ? 'week' : timeRange;
      const response = await teacherAnalyticsApi.getStudentLogins({ time_range: period });
      setStudentLogins(response.data.students);
    } catch (err: any) {
      console.error('Failed to fetch student logins:', err);
      setStudentLoginsError(err.response?.data?.error || 'Failed to load student logins');
      setStudentLogins([]);
    } finally {
      setStudentLoginsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await teacherAnalyticsApi.getEngagement({
        time_range: timeRange,
        scope,
        class: activeTab === 'bystudent' ? selectedClass || undefined : undefined
      });
      setAnalytics(response.data);
    } catch (err: any) {
      console.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.error || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Simple Line Chart Component
  const LineChart: React.FC<{ data: EngagementTimeSeries[]; metric: keyof EngagementTimeSeries }> = ({ data, metric }) => {
    if (!data || data.length === 0) return <div className="text-gray-500 text-center py-8">No data available</div>;
    
    const maxValue = Math.max(...data.map(d => Number(d[metric]) || 0), 1);
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 20, bottom: 40, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
      const y = padding.top + chartHeight - ((Number(d[metric]) || 0) / maxValue) * chartHeight;
      return { x, y, value: Number(d[metric]) || 0, label: new Date(d.time_bucket).toLocaleDateString() };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          return (
            <line
              key={ratio}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}
        {/* Line */}
        <path d={pathData} fill="none" stroke="#3b82f6" strokeWidth="2" />
        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
            <title>{p.label}: {p.value}</title>
          </g>
        ))}
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          const value = Math.round(ratio * maxValue);
          return (
            <text key={ratio} x={padding.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
              {value}
            </text>
          );
        })}
        {/* X-axis labels */}
        {data.map((d, i) => {
          if (i % Math.ceil(data.length / 5) !== 0 && i !== data.length - 1) return null;
          const x = padding.left + (i / (data.length - 1 || 1)) * chartWidth;
          const date = new Date(d.time_bucket);
          const label = timeRange === 'day' 
            ? date.toLocaleTimeString('en-US', { hour: '2-digit' })
            : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <text key={i} x={x} y={height - padding.bottom + 20} textAnchor="middle" className="text-xs fill-gray-600">
              {label}
            </text>
          );
        })}
      </svg>
    );
  };

  // Simple Bar Chart Component — use town_name for by-class data so labels match town data
  const BarChart: React.FC<{ 
    data: EngagementByClass[] | EngagementByStudent[]; 
    metric: keyof EngagementByClass | keyof EngagementByStudent;
    labelKey: string;
  }> = ({ data, metric, labelKey }) => {
    if (!data || data.length === 0) return <div className="text-gray-500 text-center py-8">No data available</div>;
    
    const maxValue = Math.max(...data.map(d => Number(d[metric]) || 0), 1);
    const width = 800;
    const height = 400;
    const padding = { top: 20, right: 20, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;

    return (
      <svg width={width} height={height} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          return (
            <line
              key={ratio}
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const value = Number(d[metric]) || 0;
          const barHeight = (value / maxValue) * chartHeight;
          const x = padding.left + i * (barWidth + barSpacing) + barSpacing / 2;
          const y = padding.top + chartHeight - barHeight;
          const rawLabel = d[labelKey as keyof typeof d];
          const label = String(
            labelKey === 'class' && (d as EngagementByClass).town_name
              ? (d as EngagementByClass).town_name
              : rawLabel ?? ''
          );
          
          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#3b82f6"
                className="hover:opacity-80 transition-opacity"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-medium"
              >
                {value}
              </text>
              <text
                x={x + barWidth / 2}
                y={height - padding.bottom + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600"
                transform={`rotate(-45 ${x + barWidth / 2} ${height - padding.bottom + 20})`}
              >
                {label.length > 15 ? label.substring(0, 15) + '...' : label}
              </text>
              <title>{label}: {value}</title>
            </g>
          );
        })}
        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding.top + chartHeight - ratio * chartHeight;
          const value = Math.round(ratio * maxValue);
          return (
            <text key={ratio} x={padding.left - 10} y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
              {value}
            </text>
          );
        })}
      </svg>
    );
  };

  // Simple pie chart (renamed so lucide PieChart icon can be used for headings)
  const ActivityPieChart: React.FC<{ 
    data: { label: string; value: number; color: string }[];
  }> = ({ data }) => {
    if (!data || data.length === 0) return <div className="text-gray-500 text-center py-8">No data available</div>;
    
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="text-gray-500 text-center py-8">No activity data</div>;
    
    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 20;
    let currentAngle = -Math.PI / 2;

    const segments = data.map((d) => {
      const angle = (d.value / total) * 2 * Math.PI;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      const largeArc = angle > Math.PI ? 1 : 0;

      const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return { ...d, path, angle: startAngle + angle / 2, percentage: (d.value / total) * 100 };
    });

    return (
      <div className="flex items-center justify-center">
        <svg width={size} height={size} className="w-full max-w-md">
          {segments.map((seg, i) => (
            <g key={i}>
              <path
                d={seg.path}
                fill={seg.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              />
              <text
                x={center + (radius * 0.7) * Math.cos(seg.angle)}
                y={center + (radius * 0.7) * Math.sin(seg.angle)}
                textAnchor="middle"
                className="text-sm fill-white font-medium"
              >
                {seg.percentage > 5 ? `${Math.round(seg.percentage)}%` : ''}
              </text>
              <title>{seg.label}: {seg.value} ({Math.round(seg.percentage)}%)</title>
            </g>
          ))}
        </svg>
        <div className="ml-8 space-y-2">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: seg.color }} />
              <span className="text-sm text-gray-700">{seg.label}: {seg.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analyticsPlugin || !analyticsPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  if (user?.role !== 'teacher') {
    return <Navigate to="/" replace />;
  }

  const formatLastLogin = (iso: string): string => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 60) return '1 month ago';
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return d.toLocaleDateString();
  };

  const pieData = analytics ? [
    { label: 'Logins', value: analytics.summary.total_logins, color: '#3b82f6' },
    { label: 'Chores', value: analytics.summary.total_chores_sessions, color: '#10b981' },
    { label: 'Transfers', value: analytics.summary.total_transfers, color: '#f59e0b' },
    { label: 'Purchases', value: analytics.summary.total_purchases, color: '#ef4444' }
  ].filter(d => d.value > 0) : [];

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'engagement', label: 'Engagement over time', icon: <TrendingUp className="h-4 w-4" /> },
    { id: 'byclass', label: 'By class', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'bystudent', label: 'By student', icon: <Users className="h-4 w-4" /> },
    { id: 'logins', label: 'Student total logins', icon: <Users className="h-4 w-4" /> }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📊</div>
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-indigo-100">Engagement data visualization for teachers</p>
          </div>
        </div>
      </div>

      {/* Single filter bar - applies to all tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Time range:</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'day' | 'week' | 'month' | 'year')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
              <option value="year">Year</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Class:</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">All classes</option>
              <option value="6A">6A</option>
              <option value="6B">6B</option>
              <option value="6C">6C</option>
            </select>
          </div>
          {analytics?.start_date && (
            <p className="text-xs text-gray-500 w-full mt-1">
              Data from {new Date(analytics.start_date).toLocaleDateString()} to now
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex flex-wrap gap-0" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading && activeTab !== 'logins' ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
          ) : (
            <>
              {/* Tab: Overview */}
              {activeTab === 'overview' && analytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Logins</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">{analytics.summary.total_logins}</p>
              <p className="text-xs text-gray-500">{analytics.summary.total_logins_users} users</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-medium">Chores</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{analytics.summary.total_chores_sessions}</p>
              <p className="text-xs text-gray-500">{analytics.summary.total_chores_users} users</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs font-medium">Transfers</span>
              </div>
              <p className="text-2xl font-bold text-amber-600">{analytics.summary.total_transfers}</p>
              <p className="text-xs text-gray-500">{analytics.summary.total_transfers_users} users</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 text-gray-500 mb-1">
                <PieChart className="h-4 w-4" />
                <span className="text-xs font-medium">Purchases</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{analytics.summary.total_purchases}</p>
              <p className="text-xs text-gray-500">{analytics.summary.total_purchases_users} users</p>
            </div>
                  </div>
                  {analytics.by_class && analytics.by_class.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
                        Logins by town
                      </h2>
                      <p className="text-sm text-gray-600 mb-4">
                        Total logins per town in the selected period. Compare engagement across your school&apos;s towns.
                      </p>
                      <BarChart data={analytics.by_class} metric="logins" labelKey="class" />
                    </div>
                  )}
                  {pieData.length > 0 && (
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <PieChart className="h-5 w-5 mr-2 text-indigo-600" />
                        Activity Composition
                      </h2>
                      <ActivityPieChart data={pieData} />
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Engagement over time */}
              {activeTab === 'engagement' && analytics && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                    Engagement Over Time
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Logins</h3>
                      <LineChart data={analytics.time_series} metric="logins" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Chores Sessions</h3>
                      <LineChart data={analytics.time_series} metric="chores_sessions" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Transfers</h3>
                      <LineChart data={analytics.time_series} metric="transfers_count" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Purchases</h3>
                      <LineChart data={analytics.time_series} metric="purchases_count" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: By class */}
              {activeTab === 'byclass' && analytics && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BarChart3 className="h-5 w-5 mr-2 text-indigo-600" />
                    Engagement by Class
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Logins</h3>
                      <BarChart data={analytics.by_class} metric="logins" labelKey="class" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Chores Sessions</h3>
                      <BarChart data={analytics.by_class} metric="chores_sessions" labelKey="class" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Transfers</h3>
                      <BarChart data={analytics.by_class} metric="transfers_count" labelKey="class" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">Purchases</h3>
                      <BarChart data={analytics.by_class} metric="purchases_count" labelKey="class" />
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: By student */}
              {activeTab === 'bystudent' && analytics && (
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    Top Students by Engagement
                  </h2>
                  <p className="text-sm text-gray-600">
                    Use the Class filter above to limit to one town. Showing top 50 students ranked by combined activity in the selected time range.
                  </p>
                  <p className="text-sm text-gray-500">
                    <strong>What counts as engagement:</strong> the ranking is the sum of <strong>Logins</strong> + <strong>Chores sessions</strong> (math/chore games) + <strong>Transfers</strong> (bank transfers) + <strong>Purchases</strong> (shop) in the period. Higher total = higher rank.
                  </p>
                  {analytics.top_students.length > 0 ? (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Logins</h3>
                        <BarChart data={analytics.top_students} metric="logins" labelKey="username" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Chores Sessions</h3>
                        <BarChart data={analytics.top_students} metric="chores_sessions" labelKey="username" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Transfers</h3>
                        <BarChart data={analytics.top_students} metric="transfers_count" labelKey="username" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 mb-2">Purchases</h3>
                        <BarChart data={analytics.top_students} metric="purchases_count" labelKey="username" />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                      No student engagement data for this period.
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Student total logins */}
              {activeTab === 'logins' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    Student Total logins
                  </h2>
                  <p className="text-sm text-gray-600">
                    Total logins per student in the selected time range (above). Last login is when they were last active (any time).
                  </p>
                  {studentLoginsError && (
                    <div className="text-sm text-red-600">{studentLoginsError}</div>
                  )}
                  {studentLoginsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
                    </div>
                  ) : studentLogins.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                      No student login data for this period.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Student</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Town</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-700 uppercase">Total logins</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-700 uppercase">Last login</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {studentLogins.map((s) => (
                            <tr key={s.id} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm text-gray-900">
                                {s.first_name && s.last_name ? `${s.first_name} ${s.last_name}` : s.username}
                              </td>
                              <td className="px-4 py-2 text-sm text-gray-600">{s.town_name ?? s.class ?? '—'}</td>
                              <td className="px-4 py-2 text-sm text-right text-gray-600">{s.logins}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">
                                {s.last_login ? formatLastLogin(s.last_login) : 'Never'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPlugin;
