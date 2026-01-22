import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlugins } from '../contexts/PluginContext';
import { useTown } from '../contexts/TownContext';
import PluginCard from './PluginCard';
import AnnouncementsPanel from './AnnouncementsPanel';
import TownInfo from './TownInfo';
import MyJobCard from './MyJobCard';
import MyPropertyCard from './MyPropertyCard';
import MyTendersCard from './MyTendersCard';
import { Grid } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { enabledPlugins, loading: pluginsLoading } = usePlugins();
  const { currentTown, announcements, loading: townLoading } = useTown();

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Student';

  const jobName = user?.job_name || 'No job assigned';

  // Show a very noticeable banner when a new tender announcement is posted
  const [dismissedTenderAnnouncementId, setDismissedTenderAnnouncementId] = useState<number>(() => {
    const stored = Number(localStorage.getItem('dismissed_tender_announcement_id') || '0');
    return Number.isFinite(stored) ? stored : 0;
  });

  const latestTenderAnnouncement = useMemo(() => {
    const tenderAnnouncements = announcements.filter(a => a.title.toLowerCase().includes('tender'));
    return tenderAnnouncements
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
  }, [announcements]);

  const showTenderBanner = useMemo(() => {
    if (!latestTenderAnnouncement) return false;
    const isRecent =
      (Date.now() - new Date(latestTenderAnnouncement.created_at).getTime()) < 1000 * 60 * 60 * 48; // 48h
    return isRecent && latestTenderAnnouncement.id > dismissedTenderAnnouncementId;
  }, [latestTenderAnnouncement, dismissedTenderAnnouncementId]);

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

      {/* New Tender Alert (very noticeable) */}
      {showTenderBanner && latestTenderAnnouncement && (
        <div className="relative overflow-hidden rounded-2xl border-2 border-amber-400 bg-gradient-to-r from-amber-300 via-orange-300 to-red-300 p-5 animate-pulse">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,white,transparent_55%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-white/40 rounded-xl p-2">
                <AlertTriangle className="h-6 w-6 text-red-800" />
              </div>
              <div>
                <p className="text-sm font-extrabold text-red-900 tracking-wide uppercase">New Tender Available</p>
                <p className="text-lg font-bold text-red-950">{latestTenderAnnouncement.title}</p>
                <p className="text-sm text-red-900 mt-1 line-clamp-2">{latestTenderAnnouncement.content}</p>
                <div className="mt-3">
                  <Link
                    to="/tenders"
                    className="inline-flex items-center px-4 py-2 rounded-lg bg-red-700 text-white font-bold hover:bg-red-800 transition-colors shadow"
                  >
                    View & Apply Now
                  </Link>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('dismissed_tender_announcement_id', String(latestTenderAnnouncement.id));
                setDismissedTenderAnnouncementId(latestTenderAnnouncement.id);
              }}
              className="flex-shrink-0 bg-white/40 hover:bg-white/60 rounded-lg p-2 transition-colors"
              aria-label="Dismiss tender alert"
            >
              <X className="h-5 w-5 text-red-900" />
            </button>
          </div>
        </div>
      )}

      {/* Town Info, Announcements, My Job, and Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        <TownInfo town={currentTown} readOnly={true} />
        <AnnouncementsPanel announcements={announcements} />
        {user && <MyJobCard user={user} />}
        <MyPropertyCard />
      </div>

      {/* Plugin Cards Grid - Available Systems */}
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

      {/* My Tenders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MyTendersCard />
      </div>
    </div>
  );
};

export default StudentDashboard;
