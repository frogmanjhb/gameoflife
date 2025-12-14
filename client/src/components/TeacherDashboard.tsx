import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlugins } from '../contexts/PluginContext';
import { useTown } from '../contexts/TownContext';
import PluginCard from './PluginCard';
import AnnouncementsPanel from './AnnouncementsPanel';
import TownInfo from './TownInfo';
import PluginManagement from './admin/PluginManagement';
import AnnouncementManagement from './admin/AnnouncementManagement';
import TownSettings from './admin/TownSettings';
import { Grid, Settings, ChevronDown } from 'lucide-react';

const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const { enabledPlugins, plugins, loading: pluginsLoading, refreshPlugins } = usePlugins();
  const { currentTown, currentTownClass, allTowns, announcements, loading: townLoading, setCurrentTownClass, refreshAnnouncements } = useTown();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'plugins' | 'announcements' | 'town'>('dashboard');
  const [showTownSelector, setShowTownSelector] = useState(false);

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Teacher';

  if (pluginsLoading || townLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner with Town Selector */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Welcome, {displayName}! 👨‍🏫</h1>
            <p className="text-primary-100">
              {currentTown ? `Managing ${currentTown.town_name}` : 'Town Hub Control Center'}
            </p>
          </div>
          {allTowns.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowTownSelector(!showTownSelector)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <span>Class {currentTownClass || allTowns[0]?.class}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showTownSelector && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                  {allTowns.map((town) => (
                    <button
                      key={town.id}
                      onClick={() => {
                        setCurrentTownClass(town.class);
                        setShowTownSelector(false);
                      }}
                      className={`w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                        currentTownClass === town.class ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                      }`}
                    >
                      {town.town_name} (Class {town.class})
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Grid },
              { id: 'plugins', label: 'Plugins', icon: Settings },
              { id: 'announcements', label: 'Announcements', icon: Settings },
              { id: 'town', label: 'Town Settings', icon: Settings }
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
                <TownInfo town={currentTown} readOnly={true} />
                <AnnouncementsPanel announcements={announcements} />
              </div>

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

          {/* Plugins Tab */}
          {activeTab === 'plugins' && (
            <PluginManagement plugins={plugins} onUpdate={refreshPlugins} />
          )}

          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <AnnouncementManagement announcements={announcements} onUpdate={refreshAnnouncements} />
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
