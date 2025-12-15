import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlugins } from '../contexts/PluginContext';
import { useTown } from '../contexts/TownContext';
import PluginCard from './PluginCard';
import AnnouncementsPanel from './AnnouncementsPanel';
import TownInfo from './TownInfo';
import PluginManagement from './admin/PluginManagement';
import AnnouncementManagement from './admin/AnnouncementManagement';
import TownSettings from './admin/TownSettings';
import JobManagement from './admin/JobManagement';
import TreasuryManagement from './admin/TreasuryManagement';
import { 
  Grid, Settings, Briefcase, Building2, Users, Wallet, 
  TrendingUp, CreditCard, Megaphone, MapPin, Landmark
} from 'lucide-react';
import api from '../services/api';
import { Student, Loan, Transaction } from '../types';

interface TownStats {
  studentCount: number;
  totalBalance: number;
  employedCount: number;
  unemployedCount: number;
  activeLoans: number;
  pendingLoans: number;
}

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { enabledPlugins, plugins, loading: pluginsLoading, refreshPlugins } = usePlugins();
  const { currentTown, currentTownClass, allTowns, announcements, loading: townLoading, setCurrentTownClass, refreshAnnouncements } = useTown();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'treasury' | 'plugins' | 'announcements' | 'town' | 'jobs'>('dashboard');
  
  // Data for town stats
  const [students, setStudents] = useState<Student[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Teacher';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, loansRes] = await Promise.all([
        api.get('/students'),
        api.get('/loans')
      ]);
      setStudents(studentsRes.data);
      setLoans(loansRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  // Calculate stats for each town
  const townStats = useMemo(() => {
    const stats: Record<string, TownStats> = {};
    
    allTowns.forEach(town => {
      const townStudents = students.filter(s => s.class === town.class);
      const townLoans = loans.filter(l => {
        const student = students.find(s => s.username === l.borrower_username);
        return student?.class === town.class;
      });
      
      stats[town.class] = {
        studentCount: townStudents.length,
        totalBalance: townStudents.reduce((sum, s) => sum + (Number(s.balance) || 0), 0),
        employedCount: townStudents.filter(s => s.job_id).length,
        unemployedCount: townStudents.filter(s => !s.job_id).length,
        activeLoans: townLoans.filter(l => l.status === 'active').length,
        pendingLoans: townLoans.filter(l => l.status === 'pending').length,
      };
    });
    
    return stats;
  }, [students, loans, allTowns]);

  // Get stats for current town
  const currentStats = currentTownClass ? townStats[currentTownClass] : null;

  // Get students for current town
  const currentTownStudents = useMemo(() => {
    if (!currentTownClass) return [];
    return students.filter(s => s.class === currentTownClass);
  }, [students, currentTownClass]);

  // Get announcements count per town
  const getAnnouncementsForTown = (townClass: string) => {
    // This is a simplified version - in reality you'd need to fetch announcements per town
    return currentTownClass === townClass ? announcements.length : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  if (pluginsLoading || townLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome, {displayName}! 👨‍🏫</h1>
            <p className="text-primary-100">Town Hub Control Center</p>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">Managing</p>
            <p className="text-xl font-bold">{allTowns.length} Towns</p>
          </div>
        </div>
      </div>

      {/* Town Tabs */}
      {allTowns.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-3 divide-x divide-gray-200">
            {allTowns.map((town) => {
              const stats = townStats[town.class];
              const isActive = currentTownClass === town.class;
              
              return (
                <button
                  key={town.id}
                  onClick={() => setCurrentTownClass(town.class)}
                  className={`p-4 text-left transition-all ${
                    isActive 
                      ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-b-4 border-primary-500' 
                      : 'hover:bg-gray-50 border-b-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold ${isActive ? 'text-primary-700' : 'text-gray-900'}`}>
                        {town.town_name}
                      </h3>
                      <p className="text-sm text-gray-500">Class {town.class}</p>
                    </div>
                  </div>
                  
                  {stats && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{stats.studentCount} students</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Wallet className="h-3 w-3 text-gray-400" />
                        <span className={`${stats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stats.totalBalance)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Briefcase className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-600">{stats.employedCount} employed</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Landmark className="h-3 w-3 text-emerald-500" />
                        <span className="text-emerald-600">
                          {formatCurrency(town.treasury_balance || 10000000)}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Town Details */}
      {currentTown && currentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Users className="h-4 w-4" />
              <span className="text-xs font-medium">Students</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{currentStats.studentCount}</p>
            <p className="text-xs text-gray-500">{currentStats.employedCount} employed</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs font-medium">Total Balance</span>
            </div>
            <p className={`text-2xl font-bold ${currentStats.totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(currentStats.totalBalance)}
            </p>
            <p className="text-xs text-gray-500">
              Avg: {formatCurrency(currentStats.studentCount > 0 ? currentStats.totalBalance / currentStats.studentCount : 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Briefcase className="h-4 w-4" />
              <span className="text-xs font-medium">Employment</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {currentStats.studentCount > 0 
                ? Math.round((currentStats.employedCount / currentStats.studentCount) * 100) 
                : 0}%
            </p>
            <p className="text-xs text-gray-500">{currentStats.unemployedCount} unemployed</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-medium">Loans</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">{currentStats.activeLoans}</p>
            <p className="text-xs text-amber-600">
              {currentStats.pendingLoans > 0 ? `${currentStats.pendingLoans} pending approval` : 'No pending'}
            </p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Overview', icon: Grid },
              { id: 'treasury', label: 'Treasury', icon: Landmark },
              { id: 'jobs', label: 'Jobs', icon: Briefcase },
              { id: 'plugins', label: 'Plugins', icon: Settings },
              { id: 'announcements', label: 'Announcements', icon: Megaphone },
              { id: 'town', label: 'Town Settings', icon: Building2 }
            ].map(({ id, label, icon: Icon }) => (
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
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Town Info and Announcements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TownInfo town={currentTown} readOnly={true} showTreasury={true} />
                <AnnouncementsPanel announcements={announcements} />
              </div>

              {/* Students in Current Town */}
              {currentTownStudents.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-primary-600" />
                      <h2 className="text-lg font-semibold text-gray-900">
                        Students in {currentTown?.town_name || `Class ${currentTownClass}`}
                      </h2>
                    </div>
                    <span className="text-sm text-gray-500">{currentTownStudents.length} students</span>
                  </div>
                  
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {currentTownStudents.slice(0, 9).map((student) => (
                        <div 
                          key={student.id} 
                          className={`bg-white rounded-lg p-3 border ${
                            Number(student.balance) < 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">
                                {student.first_name && student.last_name 
                                  ? `${student.first_name} ${student.last_name}` 
                                  : student.username}
                              </p>
                              <p className="text-xs text-gray-500">@{student.username}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${Number(student.balance) < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {formatCurrency(student.balance)}
                              </p>
                              {student.job_name ? (
                                <p className="text-xs text-blue-600">{student.job_name}</p>
                              ) : (
                                <p className="text-xs text-gray-400">No job</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {currentTownStudents.length > 9 && (
                      <p className="text-center text-sm text-gray-500 mt-3">
                        +{currentTownStudents.length - 9} more students
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Plugin Cards Grid */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Grid className="h-5 w-5 text-primary-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Available Systems</h2>
                </div>
                
                {enabledPlugins.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                    <Grid className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">No systems available at this time</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {enabledPlugins.map((plugin) => (
                      <PluginCard key={plugin.id} plugin={plugin} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Treasury Tab */}
          {activeTab === 'treasury' && (
            <TreasuryManagement />
          )}

          {/* Plugins Tab */}
          {activeTab === 'plugins' && (
            <PluginManagement plugins={plugins} onUpdate={refreshPlugins} />
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <AnnouncementManagement announcements={announcements} onUpdate={refreshAnnouncements} />
          )}

          {/* Jobs Tab */}
          {activeTab === 'jobs' && (
            <JobManagement />
          )}

          {/* Town Settings Tab */}
          {activeTab === 'town' && (
            <TownSettings />
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
