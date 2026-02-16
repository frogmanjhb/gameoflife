import React, { useState, useEffect, useMemo } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTown } from '../../contexts/TownContext';
import { Navigate } from 'react-router-dom';
import { 
  Pizza, Loader2, AlertCircle, CheckCircle, XCircle, 
  Power, TrendingUp, Users, DollarSign, BarChart3
} from 'lucide-react';
import api from '../../services/api';

interface PizzaTimeStatus {
  id: number;
  class: string;
  is_active: boolean;
  current_fund: number;
  goal_amount: number;
  donations: Array<{
    id: number;
    amount: number;
    username: string;
    first_name?: string;
    last_name?: string;
    created_at: string;
  }>;
  donation_count: number;
  donation_history: Array<{
    date: string;
    daily_total: number;
    donation_count: number;
  }>;
}

type AllClassesStatus = Record<'6A' | '6B' | '6C', PizzaTimeStatus>;

const PizzaTimePlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user, account } = useAuth();
  useTown(); // Student view may use town context elsewhere
  const pizzaTimePlugin = plugins.find(p => p.route_path === '/pizza-time');

  const [status, setStatus] = useState<PizzaTimeStatus | null>(null);
  const [allClassesStatus, setAllClassesStatus] = useState<AllClassesStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [donating, setDonating] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [toggling, setToggling] = useState<string | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);

  useEffect(() => {
    if (pizzaTimePlugin && pizzaTimePlugin.enabled) {
      fetchStatus();
      // Poll for updates every 5 seconds
      const interval = setInterval(fetchStatus, 5000);
      return () => clearInterval(interval);
    }
  }, [pizzaTimePlugin, user?.role]);

  const fetchStatus = async () => {
    try {
      setError('');
      if (user?.role === 'teacher') {
        const response = await api.get('/pizza-time/status/all');
        setAllClassesStatus(response.data.classes);
        // Also set status from first class for backward compat in student-like flows
        setStatus(response.data.classes['6A']);
      } else {
        const response = await api.get('/pizza-time/status');
        setStatus(response.data);
        setAllClassesStatus(null);
      }
    } catch (error: any) {
      console.error('Failed to fetch pizza time status:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to load pizza time status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDonate = async (amount: number) => {
    if (!account || account.balance < amount) {
      setError('Insufficient funds');
      setTimeout(() => setError(''), 5000);
      return;
    }

    try {
      setDonating(amount);
      setError('');
      setSuccess('');

      const response = await api.post('/pizza-time/donate', { amount });
      
      setSuccess(`Donated R${amount.toFixed(2)}! Thank you for your contribution! 🍕`);
      await fetchStatus();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to make donation');
      setTimeout(() => setError(''), 5000);
    } finally {
      setDonating(null);
    }
  };

  const handleToggle = async (targetClass: '6A' | '6B' | '6C') => {
    const classStatus = user?.role === 'teacher' ? allClassesStatus?.[targetClass] : status;
    if (!classStatus) return;

    try {
      setToggling(targetClass);
      setError('');
      setSuccess('');

      await api.post('/pizza-time/toggle', {
        class: targetClass,
        is_active: !classStatus.is_active
      });
      
      setSuccess(`Pizza time ${!classStatus.is_active ? 'activated' : 'deactivated'} for ${targetClass}`);
      await fetchStatus();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle pizza time');
      setTimeout(() => setError(''), 5000);
    } finally {
      setToggling(null);
    }
  };

  const handleReset = async (targetClass: '6A' | '6B' | '6C') => {
    if (!window.confirm(`Are you sure you want to reset the pizza time fund for Class ${targetClass}? This will set the fund to R0.00 but keep donation history.`)) {
      return;
    }

    try {
      setResetting(targetClass);
      setError('');
      setSuccess('');

      const response = await api.post('/pizza-time/reset', {
        class: targetClass
      });
      
      setSuccess(response.data.message);
      await fetchStatus();
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset pizza time');
      setTimeout(() => setError(''), 5000);
    } finally {
      setResetting(null);
    }
  };

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    if (!status) return 0;
    return Math.min((status.current_fund / status.goal_amount) * 100, 100);
  }, [status]);

  // Prepare data for bar graph
  const graphData = useMemo(() => {
    if (!status || !status.donation_history || status.donation_history.length === 0) {
      return [];
    }

    // Get cumulative totals for each day
    let cumulative = 0;
    return status.donation_history.map(day => {
      cumulative += day.daily_total;
      return {
        date: day.date,
        amount: cumulative,
        daily_total: day.daily_total,
        donation_count: day.donation_count
      };
    });
  }, [status]);

  // Wait for plugins to load
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!pizzaTimePlugin || !pizzaTimePlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  const hasTeacherData = user?.role === 'teacher' ? allClassesStatus : status;
  if (!hasTeacherData && !loading) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-red-700 font-semibold">Failed to load pizza time status</p>
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
              <p className="text-red-600 text-sm mt-2">
                If you see this error, the server may need to be restarted to run database migrations.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Teacher View - All three classes on one page
  if (user?.role === 'teacher' && allClassesStatus) {
    const classKeys: ('6A' | '6B' | '6C')[] = ['6A', '6B', '6C'];
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-full p-4">
              <Pizza className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pizza Time</h1>
              <p className="text-orange-100">Class donation tracker for pizza party – all classes</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-red-700 font-semibold">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* All three classes in a grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {classKeys.map((className) => {
            const classStatus = allClassesStatus[className];
            if (!classStatus) return null;
            const prog = Math.min((classStatus.current_fund / classStatus.goal_amount) * 100, 100);
            const classGraphData = classStatus.donation_history?.length
              ? (() => {
                  let cumulative = 0;
                  return classStatus.donation_history.map((day: any) => {
                    cumulative += day.daily_total;
                    return {
                      date: day.date,
                      amount: cumulative,
                      daily_total: day.daily_total,
                      donation_count: day.donation_count
                    };
                  });
                })()
              : [];
            return (
              <div key={className} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-800">Class {className}</h2>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    classStatus.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {classStatus.is_active ? '🟢 Active' : '⚫ Inactive'}
                  </span>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-primary-600">
                      R{classStatus.current_fund.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-gray-500">
                      of R{classStatus.goal_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-6 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${prog}%` }}
                    >
                      {prog > 15 && (
                        <span className="text-white text-xs font-semibold">{prog.toFixed(0)}%</span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {classStatus.donation_count} donation{classStatus.donation_count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Mini bar graph */}
                {classGraphData.length > 0 && (
                  <div className="mb-4 flex-1 min-h-[80px]">
                    <h3 className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <BarChart3 className="h-4 w-4" />
                      Fund growth
                    </h3>
                    <div className="h-16 flex items-end space-x-1">
                      {classGraphData.map((day: any) => {
                        const maxAmt = Math.max(...classGraphData.map((d: any) => d.amount), classStatus.goal_amount);
                        const h = (day.amount / maxAmt) * 100;
                        return (
                          <div
                            key={day.date}
                            className="flex-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-t transition-all hover:opacity-80"
                            style={{ height: `${h}%`, minHeight: '4px' }}
                            title={`${new Date(day.date).toLocaleDateString()}: R${day.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleToggle(className)}
                    disabled={!!toggling}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                      classStatus.is_active
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    } disabled:opacity-50`}
                  >
                    {toggling === className ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Power className="h-4 w-4" />
                        {classStatus.is_active ? 'Deactivate' : 'Activate'}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleReset(className)}
                    disabled={!!resetting || classStatus.current_fund === 0}
                    className="px-4 py-2 rounded-lg font-semibold text-sm bg-gray-500 hover:bg-gray-600 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {resetting === className ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4" />
                        Reset
                      </>
                    )}
                  </button>
                </div>

                {/* Recent Donations */}
                {classStatus.donations && classStatus.donations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Recent donations
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {classStatus.donations.slice(0, 5).map((donation: any) => (
                        <div
                          key={donation.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                        >
                          <span className="font-medium truncate max-w-[120px]">
                            {donation.first_name && donation.last_name
                              ? `${donation.first_name} ${donation.last_name}`
                              : donation.username}
                          </span>
                          <span className="font-bold text-primary-600 text-xs">
                            R{donation.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Student View
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 rounded-full p-4">
              <Pizza className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pizza Time</h1>
              <p className="text-orange-100">Help your class reach the pizza party goal!</p>
            </div>
          </div>
          {!status.is_active && (
            <div className="bg-white/20 rounded-lg px-4 py-2 flex items-center space-x-2">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Pizza Time is not active</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-700 font-semibold">{error}</p>
              {error.includes('class assigned') && (
                <p className="text-red-600 text-sm mt-2">
                  Please contact your teacher to assign you to a class (6A, 6B, or 6C) before using Pizza Time.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      {!status.is_active && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
          <p className="text-amber-800 font-semibold">
            Pizza Time is currently inactive. Your teacher needs to activate it before you can donate.
          </p>
        </div>
      )}

      {/* Progress Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">Fund Progress</h2>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              R{status.current_fund.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-sm text-gray-500">
              of R{status.goal_amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} goal
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-8 mb-2">
          <div
            className="bg-gradient-to-r from-orange-500 to-red-500 h-8 rounded-full flex items-center justify-end pr-2 transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          >
            {progressPercentage > 10 && (
              <span className="text-white text-sm font-semibold">
                {progressPercentage.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {status.donation_count} donation{status.donation_count !== 1 ? 's' : ''} received
        </div>
      </div>

      {/* Bar Graph */}
      {graphData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Fund Growth Over Time</span>
          </h2>
          <div className="h-64 flex items-end space-x-1">
            {graphData.map((day) => {
              const maxAmount = Math.max(...graphData.map(d => d.amount), status.goal_amount);
              const barHeight = (day.amount / maxAmount) * 100;
              return (
                <div
                  key={day.date}
                  className="flex-1 group relative"
                  style={{ minWidth: '20px' }}
                >
                  <div
                    className="w-full bg-gradient-to-t from-orange-500 to-red-500 rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                    style={{ height: `${barHeight}%` }}
                    title={`${new Date(day.date).toLocaleDateString()}: R${day.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (${day.donation_count} donation${day.donation_count !== 1 ? 's' : ''})`}
                  >
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      <div className="font-semibold">{new Date(day.date).toLocaleDateString()}</div>
                      <div>R{day.amount.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div className="text-gray-300">{day.donation_count} donation{day.donation_count !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 text-sm text-gray-600 text-center">
            Hover over bars to see details
          </div>
        </div>
      )}

      {/* Donation Buttons */}
      {status.is_active && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Make a Donation</span>
          </h2>
          {account && (
            <div className="mb-4 text-sm text-gray-600">
              Your balance: <span className="font-semibold text-primary-600">R{account.balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[100, 500, 1000, 2000, 5000].map((amount) => {
              const canAfford = account ? account.balance >= amount : false;
              return (
                <button
                  key={amount}
                  onClick={() => handleDonate(amount)}
                  disabled={!canAfford || donating === amount || !status.is_active}
                  className={`px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                    canAfford && status.is_active
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2`}
                >
                  {donating === amount ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Pizza className="h-5 w-5" />
                      <span>R{amount.toLocaleString()}</span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PizzaTimePlugin;
