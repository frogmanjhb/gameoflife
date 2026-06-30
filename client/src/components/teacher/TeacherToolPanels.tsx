import React from 'react';
import { Student } from '../../types';
import PendingStudents from '../PendingStudents';
import TeacherContentApprovals from '../admin/TeacherContentApprovals';
import StudentManagement from '../StudentManagement';
import TreasuryManagement from '../admin/TreasuryManagement';
import PluginManagement from '../admin/PluginManagement';
import AnnouncementManagement from '../admin/AnnouncementManagement';
import JobManagement from '../admin/JobManagement';
import TeacherJobTestingTab from '../admin/TeacherJobTestingTab';
import WinkelManagement from '../admin/WinkelManagement';
import TownSettings from '../admin/TownSettings';
import { Plugin } from '../../types';
import TeacherToolContentShell from './TeacherToolContentShell';
import { ResponsiveTabNav } from '../responsive';

export type TeacherToolTab =
  | 'treasury'
  | 'plugins'
  | 'announcements'
  | 'town'
  | 'jobs'
  | 'students'
  | 'pending'
  | 'shop'
  | 'submissions';

interface RenderTeacherToolContentProps {
  activeTab: TeacherToolTab;
  jobsSubTab: 'manage' | 'testing' | 'unemployed';
  setJobsSubTab: (tab: 'manage' | 'testing' | 'unemployed') => void;
  fetchData: () => void;
  students: Student[];
  plugins: Plugin[];
  refreshPlugins: () => void;
  announcements: Parameters<typeof AnnouncementManagement>[0]['announcements'];
  refreshAnnouncements: () => void;
  unemployedStudentsByClass: {
    className: string;
    students: Student[];
  }[];
}

export const renderTeacherToolContent = ({
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
}: RenderTeacherToolContentProps) => {
  const jobsSubTabs = [
    { id: 'manage' as const, label: 'Job management', mobileLabel: 'Manage' },
    { id: 'testing' as const, label: 'Job testing', mobileLabel: 'Testing' },
    { id: 'unemployed' as const, label: 'Unemployed students', mobileLabel: 'Unemployed' },
  ];

  const content = (() => {
  switch (activeTab) {
    case 'pending':
      return <PendingStudents onUpdate={fetchData} />;
    case 'submissions':
      return <TeacherContentApprovals onUpdate={fetchData} />;
    case 'students':
      return <StudentManagement students={students} onUpdate={fetchData} />;
    case 'treasury':
      return <TreasuryManagement />;
    case 'plugins':
      return <PluginManagement plugins={plugins} onUpdate={refreshPlugins} />;
    case 'announcements':
      return <AnnouncementManagement announcements={announcements} onUpdate={refreshAnnouncements} />;
    case 'jobs':
      return (
        <div className="space-y-4 sm:space-y-6">
          <ResponsiveTabNav
            tabs={jobsSubTabs}
            activeTab={jobsSubTab}
            onTabChange={(id) => setJobsSubTab(id as typeof jobsSubTab)}
          />
          {jobsSubTab === 'manage' && <JobManagement />}
          {jobsSubTab === 'testing' && <TeacherJobTestingTab />}
          {jobsSubTab === 'unemployed' && (
            <div className="space-y-4">
              {unemployedStudentsByClass.length === 0 ? (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
                  All students currently have jobs.
                </div>
              ) : (
                unemployedStudentsByClass.map(({ className, students: classStudents }) => (
                  <div key={className} className="bg-white border border-gray-200 rounded-xl min-w-0">
                    <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold text-gray-900">Class {className}</h3>
                      <span className="text-sm font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        {classStudents.length} unemployed
                      </span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {classStudents.map((student) => {
                        const fullName = `${student.first_name || ''} ${student.last_name || ''}`.trim();
                        return (
                          <div
                            key={student.id}
                            className="px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-1 min-w-0"
                          >
                            <span className="text-gray-900 font-medium truncate">
                              {fullName || student.username}
                            </span>
                            <span className="text-gray-500 shrink-0">@{student.username}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      );
    case 'shop':
      return <WinkelManagement />;
    case 'town':
      return <TownSettings />;
    default:
      return null;
  }
  })();

  return <TeacherToolContentShell>{content}</TeacherToolContentShell>;
};
