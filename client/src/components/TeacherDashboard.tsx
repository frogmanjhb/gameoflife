import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePlugins } from '../contexts/PluginContext';
import { useTown } from '../contexts/TownContext';
import PluginCard from './PluginCard';
import AnnouncementsPanel from './AnnouncementsPanel';
import { 
  Grid, Settings, Briefcase, Building2, Users, 
  Megaphone, Landmark, Clock, ShoppingBag, GripVertical, FileCheck, MapPin, Activity
} from 'lucide-react';
import api, { contentSubmissionsApi, teacherAnalyticsApi } from '../services/api';
import { Student, Loan, TodayActivity } from '../types';
import {
  ResponsivePage,
  ResponsiveHero,
  ResponsiveTownTabs,
  ResponsiveTabNav,
  ResponsiveAccordionCard,
  LoadingState,
  EmptyState,
  TownTabItem,
} from './responsive';
import TeacherToolsBottomBar, { TeacherToolSheet } from './teacher/TeacherToolsBottomBar';
import TeacherMobileTownsAccordion from './teacher/TeacherMobileTownsAccordion';
import { renderTeacherToolContent, TeacherToolTab } from './teacher/TeacherToolPanels';

interface TownStats {
  studentCount: number;
  totalBalance: number;
  employedCount: number;
  unemployedCount: number;
  activeLoans: number;
  pendingLoans: number;
}

const TILE_ORDER_STORAGE_KEY = 'teacherDashboardTileOrder';

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const isStudentSick = (student: Student) => student.is_sick === true || student.is_sick === 't';
const studentHasVirus = (student: Student) => student.has_virus === true || student.has_virus === 't';

const TeacherDashboard: React.FC = () => {
  const { user, refreshProfile } = useAuth();
  const { enabledPlugins, plugins, loading: pluginsLoading, refreshPlugins } = usePlugins();
  const { currentTown, currentTownClass, allTowns, announcements, loading: townLoading, setCurrentTownClass, refreshAnnouncements } = useTown();
  const [activeTab, setActiveTab] = useState<TeacherToolTab>('pending');
  const [mobileTownsOpen, setMobileTownsOpen] = useState(false);
  const [mobileExpandedTown, setMobileExpandedTown] = useState<string | number | null>(null);
  const [mobileSystemsOpen, setMobileSystemsOpen] = useState(false);
  const [mobileAnnouncementsOpen, setMobileAnnouncementsOpen] = useState(false);
  const [heroActivityOpen, setHeroActivityOpen] = useState(false);
  const [mobileToolSheet, setMobileToolSheet] = useState<TeacherToolTab | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingContentCount, setPendingContentCount] = useState(0);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);
  const [tileOrder, setTileOrder] = useState<number[]>([]);
  const [draggedTileId, setDraggedTileId] = useState<number | null>(null);
  const [dropTargetId, setDropTargetId] = useState<number | null>(null);
  
  // Data for town stats
  const [students, setStudents] = useState<Student[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [todayActivity, setTodayActivity] = useState<TodayActivity | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [jobsSubTab, setJobsSubTab] = useState<'manage' | 'testing' | 'unemployed'>('manage');

  // Load saved tile order when user and plugins are available
  useEffect(() => {
    if (enabledPlugins.length === 0) return;
    const key = `${TILE_ORDER_STORAGE_KEY}_${user?.id ?? 'default'}`;
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = enabledPlugins.map(p => p.id);
          const next = parsed.filter(id => ids.includes(id));
          ids.forEach(id => { if (!next.includes(id)) next.push(id); });
          setTileOrder(next.length ? next : ids);
          return;
        }
      }
    } catch (_) {}
    setTileOrder(enabledPlugins.map(p => p.id));
  }, [user?.id, enabledPlugins.length === 0 ? '' : enabledPlugins.map(p => p.id).join(',')]);

  // Persist tile order when it changes
  useEffect(() => {
    if (tileOrder.length === 0) return;
    try {
      const key = `${TILE_ORDER_STORAGE_KEY}_${user?.id ?? 'default'}`;
      localStorage.setItem(key, JSON.stringify(tileOrder));
    } catch (_) {}
  }, [tileOrder, user?.id]);

  // Ordered plugins for display (matches classroom board layout)
  const orderedPlugins = useMemo(() => {
    const orderMap = new Map(tileOrder.map((id, i) => [id, i]));
    return [...enabledPlugins].sort((a, b) => {
      const ai = orderMap.get(a.id) ?? 999;
      const bi = orderMap.get(b.id) ?? 999;
      return ai - bi;
    });
  }, [enabledPlugins, tileOrder]);

  const handleTileDragStart = useCallback((e: React.DragEvent, pluginId: number) => {
    setDraggedTileId(pluginId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(pluginId));
    e.dataTransfer.setData('application/x-plugin-id', String(pluginId));
  }, []);

  const handleTileDragEnd = useCallback(() => {
    setDraggedTileId(null);
    setDropTargetId(null);
  }, []);

  const handleTileDragOver = useCallback((e: React.DragEvent, pluginId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedTileId != null && draggedTileId !== pluginId) setDropTargetId(pluginId);
  }, [draggedTileId]);

  const handleTileDragLeave = useCallback(() => {
    setDropTargetId(null);
  }, []);

  const handleTileDrop = useCallback((e: React.DragEvent, dropPluginId: number) => {
    e.preventDefault();
    setDropTargetId(null);
    const raw = e.dataTransfer.getData('application/x-plugin-id') || e.dataTransfer.getData('text/plain');
    const dragPluginId = raw ? parseInt(raw, 10) : null;
    if (dragPluginId == null || dragPluginId === dropPluginId || !tileOrder.includes(dragPluginId) || !tileOrder.includes(dropPluginId)) {
      setDraggedTileId(null);
      return;
    }
    const fromIndex = tileOrder.indexOf(dragPluginId);
    const toIndex = tileOrder.indexOf(dropPluginId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...tileOrder];
    next.splice(fromIndex, 1);
    next.splice(toIndex, 0, dragPluginId);
    setTileOrder(next);
    setDraggedTileId(null);
  }, [tileOrder]);

  const firstName = user?.first_name?.trim() || user?.username || 'Teacher';

  const daysPassed = useMemo(() => {
    if (!user?.game_start_date) return null;
    const start = new Date(user.game_start_date);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  }, [user?.game_start_date]);

  useEffect(() => {
    fetchData();
    if (user?.role === 'teacher') {
      refreshProfile();
    }
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, loansRes, pendingRes, pendingTransfersRes, contentRes, activityRes] = await Promise.all([
        api.get('/students'),
        api.get('/loans'),
        api.get('/students/pending').catch(() => ({ data: [] })),
        api.get('/transactions/pending-transfers').catch(() => ({ data: [] })),
        contentSubmissionsApi.getPending().catch(() => ({ data: { pending_count: 0 } })),
        teacherAnalyticsApi.getTodayActivity().catch(() => ({ data: null })),
      ]);
      setStudents(studentsRes.data);
      setLoans(loansRes.data);
      setPendingCount(pendingRes.data?.length || 0);
      setPendingContentCount(contentRes.data?.pending_count ?? 0);
      const transfers = pendingTransfersRes.data || [];
      setPendingTransfersCount(transfers.filter((t: { status: string }) => t.status === 'pending').length);
      setTodayActivity(activityRes.data);
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

  const unemployedStudentsByClass = useMemo(() => {
    const grouped = students
      .filter((student) => !student.job_id)
      .reduce<Record<string, Student[]>>((acc, student) => {
        const className = student.class || 'Unassigned';
        if (!acc[className]) {
          acc[className] = [];
        }
        acc[className].push(student);
        return acc;
      }, {});

    return Object.entries(grouped)
      .sort(([classA], [classB]) => classA.localeCompare(classB))
      .map(([className, classStudents]) => ({
        className,
        students: [...classStudents].sort((a, b) => {
          const aName = `${a.first_name || ''} ${a.last_name || ''}`.trim() || a.username;
          const bName = `${b.first_name || ''} ${b.last_name || ''}`.trim() || b.username;
          return aName.localeCompare(bName);
        })
      }));
  }, [students]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const formatCompactCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
      maximumFractionDigits: 0,
    }).format(amount);

  const sickCount = useMemo(() => students.filter(isStudentSick).length, [students]);
  const virusCount = useMemo(() => students.filter(studentHasVirus).length, [students]);
  const pendingLoansCount = useMemo(
    () => loans.filter((loan) => loan.status === 'pending').length,
    [loans]
  );
  const approvalsNeeded =
    pendingCount + pendingContentCount + pendingTransfersCount + pendingLoansCount;
  const circulatingTotal = useMemo(() => {
    const studentTotal = students.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    const treasuryTotal = allTowns.reduce(
      (sum, town) => sum + (Number(town.treasury_balance) || 0),
      0
    );
    return studentTotal + treasuryTotal;
  }, [students, allTowns]);

  const townTabItems: TownTabItem[] = useMemo(
    () =>
      allTowns.map((town) => {
        const stats = townStats[town.class];
        return {
          id: town.class,
          townName: town.town_name,
          classLabel: `Class ${town.class}`,
          overview: {
            mayorName: town.mayor_name || 'TBD',
            taxRate: town.tax_rate,
            taxEnabled: town.tax_enabled,
          },
          summary: stats
            ? {
                studentCount: stats.studentCount,
                employedCount: stats.employedCount,
                unemployedCount: stats.unemployedCount,
                employmentPercent:
                  stats.studentCount > 0
                    ? Math.round((stats.employedCount / stats.studentCount) * 100)
                    : 0,
                activeLoans: stats.activeLoans,
                pendingLoansLabel:
                  stats.pendingLoans > 0 ? `${stats.pendingLoans} pending approval` : 'No pending',
                totalBalanceFormatted: formatCurrency(stats.totalBalance),
                avgBalanceFormatted: formatCurrency(
                  stats.studentCount > 0 ? stats.totalBalance / stats.studentCount : 0
                ),
                treasuryFormatted: formatCurrency(town.treasury_balance || 10000000),
                balanceIsPositive: stats.totalBalance >= 0,
              }
            : undefined,
        };
      }),
    [allTowns, townStats]
  );

  const openMobileTool = (tab: TeacherToolTab) => {
    setActiveTab(tab);
    setMobileToolSheet(tab);
  };

  const handleMobileTownPress = (townId: string | number) => {
    setCurrentTownClass(townId as '6A' | '6B' | '6C');
    setMobileExpandedTown((prev) => (prev === townId ? null : townId));
  };

  const toolPanelProps = {
    activeTab,
    jobsSubTab,
    setJobsSubTab,
    fetchData,
    students,
    plugins,
    refreshPlugins,
    announcements,
    refreshAnnouncements,
    unemployedStudentsByClass,
  };

  const renderPluginTiles = (draggable: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {orderedPlugins.map((plugin) => {
        const isDragging = draggedTileId === plugin.id;
        const isDropTarget = dropTargetId === plugin.id;
        return (
          <div
            key={plugin.id}
            className={`relative group rounded-xl transition-all ${
              isDragging ? 'opacity-50 scale-95' : ''
            } ${isDropTarget ? 'ring-2 ring-primary-500 ring-offset-2 bg-primary-50/50' : ''}`}
            onDragOver={draggable ? (e) => handleTileDragOver(e, plugin.id) : undefined}
            onDragLeave={draggable ? handleTileDragLeave : undefined}
            onDrop={draggable ? (e) => handleTileDrop(e, plugin.id) : undefined}
          >
            {draggable && (
              <div
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 touch-none"
                draggable
                onDragStart={(e) => handleTileDragStart(e, plugin.id)}
                onDragEnd={handleTileDragEnd}
                title="Drag to reorder"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <GripVertical className="h-5 w-5" />
              </div>
            )}
            <div className={draggable ? 'pl-10' : ''}>
              <PluginCard
                plugin={plugin}
                needsAttention={plugin.route_path === '/bank' && pendingTransfersCount > 0}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  if (pluginsLoading || (townLoading && allTowns.length === 0)) {
    return <LoadingState />;
  }

  const teacherTabs = [
    { id: 'pending', label: 'New Students', mobileLabel: 'New', icon: Clock, badge: pendingCount },
    { id: 'submissions', label: 'Content', mobileLabel: 'Content', icon: FileCheck, badge: pendingContentCount },
    { id: 'students', label: 'Students', mobileLabel: 'Students', icon: Users },
    { id: 'treasury', label: 'Treasury', mobileLabel: 'Treasury', icon: Landmark },
    { id: 'jobs', label: 'Jobs', mobileLabel: 'Jobs', icon: Briefcase },
    { id: 'shop', label: 'Shop', mobileLabel: 'Shop', icon: ShoppingBag },
    { id: 'plugins', label: 'Plugins', mobileLabel: 'Plugins', icon: Settings },
    { id: 'announcements', label: 'Announcements', mobileLabel: 'News', icon: Megaphone },
    { id: 'town', label: 'Town Settings', mobileLabel: 'Town', icon: Building2 },
  ];

  const activeTown = allTowns.find((t) => t.class === currentTownClass);
  const activeToolLabel = teacherTabs.find((t) => t.id === mobileToolSheet)?.label ?? '';

  return (
    <ResponsivePage className="pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] md:pb-0">
      {/* Daily summary */}
      <ResponsiveHero className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-xl sm:text-2xl font-bold break-words">
            {getTimeGreeting()}, {firstName}
          </h1>
          <p className="text-sm sm:text-base text-primary-50 flex flex-wrap items-center gap-x-2 gap-y-1">
            {daysPassed !== null && (
              <>
                <span>
                  <span aria-hidden="true">📅 </span>
                  Day {daysPassed}
                </span>
                <span className="text-primary-300" aria-hidden="true">·</span>
              </>
            )}
            <span>
              <span aria-hidden="true">🏘 </span>
              {allTowns.length} Town{allTowns.length !== 1 ? 's' : ''}
            </span>
            <span className="text-primary-300" aria-hidden="true">·</span>
            <span>
              <span aria-hidden="true">👨‍🎓 </span>
              {students.length} Student{students.length !== 1 ? 's' : ''}
            </span>
          </p>
          <ResponsiveAccordionCard
            title="Today's activity"
            subtitle={
              approvalsNeeded > 0
                ? `${approvalsNeeded} approval${approvalsNeeded !== 1 ? 's' : ''} needed`
                : `${formatCompactCurrency(circulatingTotal)} circulating`
            }
            icon={<Activity />}
            open={heroActivityOpen}
            onToggle={() => setHeroActivityOpen((o) => !o)}
            className="shadow-none"
          >
            <ul className="space-y-1 text-sm text-gray-700">
              <li>
                <span aria-hidden="true">💰 </span>
                {formatCompactCurrency(circulatingTotal)} circulating
              </li>
              <li className={approvalsNeeded > 0 ? 'font-medium text-amber-700' : undefined}>
                <span aria-hidden="true">📢 </span>
                {approvalsNeeded} Approval{approvalsNeeded !== 1 ? 's' : ''} needed
              </li>
              <li className={sickCount > 0 ? 'font-medium text-amber-700' : undefined}>
                <span aria-hidden="true">🤒 </span>
                {sickCount} student{sickCount !== 1 ? 's' : ''} sick
              </li>
              <li className={virusCount > 0 ? 'font-medium text-amber-700' : undefined}>
                <span aria-hidden="true">🐛 </span>
                {virusCount} student{virusCount !== 1 ? 's' : ''} with a software virus
              </li>
              {todayActivity && (
                <>
                  <li>
                    <span aria-hidden="true">👋 </span>
                    {todayActivity.students_logged_in} student{todayActivity.students_logged_in !== 1 ? 's' : ''} logged in
                  </li>
                  <li>
                    <span aria-hidden="true">💸 </span>
                    {todayActivity.transfers_made} transfer{todayActivity.transfers_made !== 1 ? 's' : ''} made
                  </li>
                  <li>
                    <span aria-hidden="true">🎁 </span>
                    {todayActivity.bonuses_given} bonus{todayActivity.bonuses_given !== 1 ? 'es' : ''} given
                  </li>
                  <li>
                    <span aria-hidden="true">⚖️ </span>
                    {todayActivity.fines_given} fine{todayActivity.fines_given !== 1 ? 's' : ''} given
                  </li>
                  <li>
                    <span aria-hidden="true">💊 </span>
                    {todayActivity.sickness_cured} sickness cured
                  </li>
                </>
              )}
            </ul>
          </ResponsiveAccordionCard>
        </div>
      </ResponsiveHero>

      {pendingCount > 0 && activeTab !== 'pending' && !mobileToolSheet && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 sm:p-4 rounded-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-amber-800">
                  {pendingCount} new student{pendingCount !== 1 ? 's' : ''} waiting for approval
                </p>
                <p className="text-xs text-amber-600 hidden sm:block">
                  Tap &quot;New Students&quot; to review and approve
                </p>
              </div>
            </div>
            <button
              onClick={() => openMobileTool('pending')}
              className="px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium min-h-[44px] w-full sm:w-auto shrink-0"
            >
              Review Now
            </button>
          </div>
        </div>
      )}

      {/* ——— Mobile: collapsed accordion cards ——— */}
      <div className="md:hidden space-y-2.5">
        {allTowns.length > 0 && (
          <ResponsiveAccordionCard
            title="Towns"
            subtitle={
              activeTown
                ? `${allTowns.length} towns · ${activeTown.town_name}`
                : `${allTowns.length} towns`
            }
            icon={<MapPin />}
            open={mobileTownsOpen}
            onToggle={() => setMobileTownsOpen((o) => !o)}
          >
            <TeacherMobileTownsAccordion
              towns={townTabItems}
              activeTownClass={currentTownClass}
              expandedTownId={mobileExpandedTown}
              onTownPress={handleMobileTownPress}
            />
          </ResponsiveAccordionCard>
        )}

        <ResponsiveAccordionCard
          title="Available Systems"
          subtitle={`${enabledPlugins.length} system${enabledPlugins.length !== 1 ? 's' : ''}`}
          icon={<Grid />}
          open={mobileSystemsOpen}
          onToggle={() => setMobileSystemsOpen((o) => !o)}
        >
          {enabledPlugins.length === 0 ? (
            <EmptyState icon={Grid} title="No systems available at this time" />
          ) : (
            renderPluginTiles(false)
          )}
        </ResponsiveAccordionCard>

        {announcements.length > 0 && (
          <ResponsiveAccordionCard
            title="Announcements"
            subtitle={`${announcements.length} active`}
            icon={<Megaphone />}
            open={mobileAnnouncementsOpen}
            onToggle={() => setMobileAnnouncementsOpen((o) => !o)}
          >
            <AnnouncementsPanel announcements={announcements} />
          </ResponsiveAccordionCard>
        )}
      </div>

      {/* ——— Desktop: full layout ——— */}
      <div className="hidden md:block space-y-6">
        {allTowns.length > 0 && (
          <ResponsiveTownTabs
            towns={townTabItems}
            activeId={currentTownClass}
            onSelect={(id) => setCurrentTownClass(id as '6A' | '6B' | '6C')}
          />
        )}

        <div>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
            <div className="flex items-center space-x-2">
              <Grid className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Available Systems</h2>
              <span className="text-xs text-gray-500 ml-2">
                Drag the handle to reorder tiles to match your classroom board
              </span>
            </div>
            {tileOrder.length > 0 && (
              <button
                type="button"
                onClick={() => setTileOrder(enabledPlugins.map((p) => p.id))}
                className="text-xs text-primary-600 hover:text-primary-700 hover:underline"
              >
                Reset to default order
              </button>
            )}
          </div>

          {enabledPlugins.length === 0 ? (
            <EmptyState icon={Grid} title="No systems available at this time" />
          ) : (
            renderPluginTiles(true)
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 sm:px-6 pt-4 sm:pt-5">
            <div className="flex items-center space-x-2">
              <Settings className="h-5 w-5 text-primary-600" />
              <h2 className="text-lg font-semibold text-gray-900">Teacher tools</h2>
            </div>
          </div>
          <ResponsiveTabNav
            tabs={teacherTabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as TeacherToolTab)}
          />
          <div className="p-4 sm:p-6">{renderTeacherToolContent(toolPanelProps)}</div>
        </div>

        <AnnouncementsPanel
          announcements={announcements}
          maxItems={Math.max(announcements.length, 1)}
        />
      </div>

      {/* Mobile: bottom bar + full-screen tool sheets */}
      <TeacherToolsBottomBar
        tabs={teacherTabs}
        activeTab={mobileToolSheet}
        onSelect={(id) => openMobileTool(id as TeacherToolTab)}
      />

      <TeacherToolSheet
        open={mobileToolSheet !== null}
        title={activeToolLabel}
        onClose={() => setMobileToolSheet(null)}
      >
        {mobileToolSheet && renderTeacherToolContent({ ...toolPanelProps, activeTab: mobileToolSheet })}
      </TeacherToolSheet>
    </ResponsivePage>
  );
};

export default TeacherDashboard;
