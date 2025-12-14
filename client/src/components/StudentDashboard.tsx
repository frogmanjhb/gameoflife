import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlugins } from '../contexts/PluginContext';
import { useTown } from '../contexts/TownContext';
import PluginCard from './PluginCard';
import AnnouncementsPanel from './AnnouncementsPanel';
import TownInfo from './TownInfo';
import { Grid } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { enabledPlugins, loading: pluginsLoading } = usePlugins();
  const { currentTown, announcements, loading: townLoading } = useTown();

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Student';

  const jobName = user?.job_name || 'No job assigned';

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
        <h1 className="text-2xl font-bold mb-2">Welcome, {displayName}! 🎓</h1>
        <p className="text-primary-100">
          {currentTown ? `Welcome to ${currentTown.town_name}!` : 'Welcome to Town Hub!'}
          {jobName !== 'No job assigned' && ` • Your job: ${jobName}`}
        </p>
      </div>

      {/* Town Info and Announcements Side by Side */}
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
            <p className="text-sm text-gray-400 mt-1">Check back later for updates</p>
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
  );
};

export default StudentDashboard;
