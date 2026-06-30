import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlugins } from '../contexts/PluginContext';
import { useTown } from '../contexts/TownContext';
import { classEventsApi, fiveMinuteLessonsApi } from '../services/api';
import PluginCard from './PluginCard';
import AnnouncementsPanel from './AnnouncementsPanel';
import TownInfo from './TownInfo';
import MyJobCard from './MyJobCard';
import MyPropertyCard from './MyPropertyCard';
import MyInsuranceCard from './MyInsuranceCard';
import MyTendersCard from './MyTendersCard';
import MyProgressCard from './MyProgressCard';
import MyTownProfessionalsCard from './MyTownProfessionalsCard';
import { Grid, CalendarDays, Building2, Bell, TrendingUp, Users, Briefcase, MapPin, Shield, ClipboardList } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertTriangle, X } from 'lucide-react';
import { getDisplayJobTitle } from '../utils/jobDisplay';
import {
  ResponsivePage,
  ResponsiveHero,
  ResponsiveHeroContent,
  ResponsiveHeroAside,
  ResponsiveAccordionCard,
  LoadingState,
  EmptyState,
} from './responsive';

// Header color themes for student dashboard - changes randomly each login
const headerColorThemes = [
  { gradient: 'bg-gradient-to-r from-red-500 to-red-700', text: 'text-white', subtext: 'text-red-100' },
  { gradient: 'bg-gradient-to-r from-blue-500 to-blue-700', text: 'text-white', subtext: 'text-blue-100' },
  { gradient: 'bg-gradient-to-r from-yellow-400 to-yellow-600', text: 'text-gray-900', subtext: 'text-yellow-900' },
];

const getRandomHeaderColor = () => {
  // Check if we already have a color for this session
  const storedIndex = sessionStorage.getItem('student_header_color_index');
  if (storedIndex !== null) {
    const index = parseInt(storedIndex, 10);
    if (index >= 0 && index < headerColorThemes.length) {
      return headerColorThemes[index];
    }
  }
  // Pick a random color and store it for this session
  const randomIndex = Math.floor(Math.random() * headerColorThemes.length);
  sessionStorage.setItem('student_header_color_index', String(randomIndex));
  return headerColorThemes[randomIndex];
};

type StudentSection =
  | 'systems'
  | 'townInfo'
  | 'alerts'
  | 'progress'
  | 'team'
  | 'job'
  | 'properties'
  | 'insurance'
  | 'tenders';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { enabledPlugins, loading: pluginsLoading } = usePlugins();

  // Students must agree to app rules before accessing plugins. Until then, only show Town Rules.
  const hasAgreedToRules = !!user?.rules_agreed_at;
  const canAccessPlugins = user?.role !== 'student' || hasAgreedToRules;
  const pluginsToShow = (canAccessPlugins ? enabledPlugins : enabledPlugins.filter((p) => p.route_path === '/town-rules'))
    .filter((p) => p.route_path !== '/analytics');
  const { currentTown, announcements, loading: townLoading } = useTown();

  const eventVotingEnabled = enabledPlugins.some((p) => p.route_path === '/event-voting');
  const fiveMinuteLessonsEnabled = enabledPlugins.some((p) => p.route_path === '/five-minute-lessons');
  const [eventVotingNeedsVote, setEventVotingNeedsVote] = useState(false);
  const [lessonsNeedsVote, setLessonsNeedsVote] = useState(false);
  const [openSections, setOpenSections] = useState<Record<StudentSection, boolean>>({
    systems: true,
    townInfo: false,
    alerts: false,
    progress: false,
    team: false,
    job: false,
    properties: false,
    insurance: false,
    tenders: false,
  });

  const toggleSection = (section: StudentSection) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  useEffect(() => {
    if (!canAccessPlugins || user?.role !== 'student') {
      setEventVotingNeedsVote(false);
      setLessonsNeedsVote(false);
      return;
    }
    const fetchVoteStatus = async () => {
      try {
        if (eventVotingEnabled) {
          const res = await classEventsApi.getStatus();
          setEventVotingNeedsVote(!!res.data.needs_vote);
        } else {
          setEventVotingNeedsVote(false);
        }
        if (fiveMinuteLessonsEnabled) {
          const res = await fiveMinuteLessonsApi.getStatus();
          setLessonsNeedsVote(!!res.data.needs_vote);
        } else {
          setLessonsNeedsVote(false);
        }
      } catch {
        setEventVotingNeedsVote(false);
        setLessonsNeedsVote(false);
      }
    };
    fetchVoteStatus();
    const interval = setInterval(fetchVoteStatus, 15000);
    return () => clearInterval(interval);
  }, [canAccessPlugins, eventVotingEnabled, fiveMinuteLessonsEnabled, user?.role]);
  
  // Get header color theme (set once per login session)
  const [headerTheme] = useState(getRandomHeaderColor);

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.username || 'Student';

  const jobName = user?.job_name ? getDisplayJobTitle(user.job_name, user.job_level) : 'No job assigned';

  const daysPassed = useMemo(() => {
    if (!user?.game_start_date) return null;
    const start = new Date(user.game_start_date);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }, [user?.game_start_date]);

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
    return <LoadingState />;
  }

  return (
    <ResponsivePage>
      {/* Welcome Banner - color changes randomly each login */}
      <ResponsiveHero className={headerTheme.gradient}>
        <ResponsiveHeroContent>
          <div className="min-w-0 flex-1">
            <h1 className={`text-xl sm:text-2xl font-bold mb-2 break-words ${headerTheme.text}`}>
              Welcome, {displayName}! 🎓
            </h1>
            <p className={`${headerTheme.subtext} break-words`}>
              {currentTown ? `Welcome to ${currentTown.town_name}!` : 'Welcome to Town Hub!'}
              {jobName !== 'No job assigned' && ` • Your job: ${jobName}`}
            </p>
          </div>
          {daysPassed !== null && (
            <ResponsiveHeroAside>
              <div className="bg-white/20 rounded-xl px-4 py-2 min-w-[120px]">
                <div className="flex items-center gap-1.5">
                  <CalendarDays className={`h-4 w-4 shrink-0 ${headerTheme.subtext}`} />
                  <p className={`text-xs font-medium ${headerTheme.subtext}`}>Game of Life</p>
                </div>
                <p className={`text-xl sm:text-2xl font-bold ${headerTheme.text}`}>Day {daysPassed}</p>
              </div>
            </ResponsiveHeroAside>
          )}
        </ResponsiveHeroContent>
      </ResponsiveHero>

      {/* New Tender Alert (only when Tenders plugin enabled and student can access plugins) */}
      {canAccessPlugins && enabledPlugins.some(p => p.route_path === '/tenders') && showTenderBanner && latestTenderAnnouncement && (
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
                <p className="text-sm text-red-900 mt-1 line-clamp-2 break-words">{latestTenderAnnouncement.content}</p>
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

      <div className="space-y-2.5">
        <ResponsiveAccordionCard
          title="Available Systems"
          subtitle={
            pluginsToShow.length === 0
              ? user?.role === 'student' && !user?.rules_agreed_at && enabledPlugins.length > 0
                ? 'Agree to rules to unlock systems'
                : 'No systems available'
              : `${pluginsToShow.length} system${pluginsToShow.length !== 1 ? 's' : ''}`
          }
          icon={<Grid />}
          open={openSections.systems}
          onToggle={() => toggleSection('systems')}
        >
          {pluginsToShow.length === 0 ? (
            <EmptyState
              icon={Grid}
              title={
                user?.role === 'student' && !user?.rules_agreed_at && enabledPlugins.length > 0
                  ? 'You must agree to the app rules before using the town systems.'
                  : 'No systems available at this time'
              }
              description={
                user?.role === 'student' && !user?.rules_agreed_at && enabledPlugins.length > 0
                  ? 'Ask your teacher to enable the Rules system so you can agree and get started.'
                  : 'Check back later for updates'
              }
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pluginsToShow.map((plugin) => (
                <PluginCard
                  key={plugin.id}
                  plugin={plugin}
                  needsVote={
                    (plugin.route_path === '/event-voting' && eventVotingNeedsVote) ||
                    (plugin.route_path === '/five-minute-lessons' && lessonsNeedsVote)
                  }
                />
              ))}
            </div>
          )}
        </ResponsiveAccordionCard>

        <ResponsiveAccordionCard
          title="Town Information"
          subtitle={currentTown ? currentTown.town_name : 'Your town details'}
          icon={<Building2 />}
          open={openSections.townInfo}
          onToggle={() => toggleSection('townInfo')}
        >
          <TownInfo town={currentTown} readOnly showCard={false} showHeader={false} />
        </ResponsiveAccordionCard>

        <ResponsiveAccordionCard
          title="Town Alerts"
          subtitle={
            announcements.length === 0
              ? 'No announcements yet'
              : `${announcements.length} alert${announcements.length !== 1 ? 's' : ''}`
          }
          icon={<Bell />}
          open={openSections.alerts}
          onToggle={() => toggleSection('alerts')}
        >
          <AnnouncementsPanel announcements={announcements} showCard={false} showHeader={false} />
        </ResponsiveAccordionCard>

        {canAccessPlugins && user?.role === 'student' && (
          <ResponsiveAccordionCard
            title="My Progress"
            subtitle={jobName !== 'No job assigned' ? `${jobName} · XP & earnings` : 'Job XP & earnings'}
            icon={<TrendingUp />}
            open={openSections.progress}
            onToggle={() => toggleSection('progress')}
          >
            <MyProgressCard showCard={false} showHeader={false} />
          </ResponsiveAccordionCard>
        )}

        {canAccessPlugins && user?.role === 'student' && (
          <ResponsiveAccordionCard
            title="My Town Team"
            subtitle="Accountant, lawyer & doctor"
            icon={<Users />}
            open={openSections.team}
            onToggle={() => toggleSection('team')}
          >
            <MyTownProfessionalsCard showCard={false} showHeader={false} />
          </ResponsiveAccordionCard>
        )}

        {canAccessPlugins && enabledPlugins.some((p) => p.route_path === '/jobs') && user && (
          <ResponsiveAccordionCard
            title="My Job"
            subtitle={jobName}
            icon={<Briefcase />}
            open={openSections.job}
            onToggle={() => toggleSection('job')}
          >
            <MyJobCard user={user} showCard={false} showHeader={false} />
          </ResponsiveAccordionCard>
        )}

        {canAccessPlugins && enabledPlugins.some((p) => p.route_path === '/land') && (
          <ResponsiveAccordionCard
            title="My Properties"
            subtitle="Land & property"
            icon={<MapPin />}
            open={openSections.properties}
            onToggle={() => toggleSection('properties')}
          >
            <MyPropertyCard showCard={false} showHeader={false} />
          </ResponsiveAccordionCard>
        )}

        {canAccessPlugins && enabledPlugins.some((p) => p.route_path === '/insurance') && (
          <ResponsiveAccordionCard
            title="My Insurance"
            subtitle="Coverage policies"
            icon={<Shield />}
            open={openSections.insurance}
            onToggle={() => toggleSection('insurance')}
          >
            <MyInsuranceCard showCard={false} showHeader={false} />
          </ResponsiveAccordionCard>
        )}

        {canAccessPlugins && enabledPlugins.some((p) => p.route_path === '/tenders') && (
          <ResponsiveAccordionCard
            title="My Tenders"
            subtitle="Approved & awarded work"
            icon={<ClipboardList />}
            open={openSections.tenders}
            onToggle={() => toggleSection('tenders')}
          >
            <MyTendersCard showCard={false} showHeader={false} />
          </ResponsiveAccordionCard>
        )}
      </div>
    </ResponsivePage>
  );
};

export default StudentDashboard;
