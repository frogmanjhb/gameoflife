import React from 'react';
import { Announcement } from '../types';
import { Bell, Clock } from 'lucide-react';

interface AnnouncementsPanelProps {
  announcements: Announcement[];
  maxItems?: number;
}

const AnnouncementsPanel: React.FC<AnnouncementsPanelProps> = ({ announcements, maxItems = 5 }) => {
  const displayAnnouncements = announcements.slice(0, maxItems);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (announcements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Bell className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Town Alerts</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No announcements yet</p>
          <p className="text-sm">Check back later for town updates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Bell className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Town Alerts</h2>
        {announcements.length > maxItems && (
          <span className="ml-auto text-sm text-gray-500">
            {announcements.length - maxItems} more
          </span>
        )}
      </div>
      <div className="space-y-4">
        {displayAnnouncements.map((announcement) => (
          <div
            key={announcement.id}
            className="border-l-4 border-primary-500 pl-4 py-2 bg-primary-50 rounded-r-lg"
          >
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
              <div className="flex items-center space-x-1 text-xs text-gray-500 ml-2">
                <Clock className="h-3 w-3" />
                <span>{formatDate(announcement.created_at)}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{announcement.content}</p>
            {announcement.created_by_username && (
              <p className="text-xs text-gray-500 mt-1">
                Posted by {announcement.created_by_username}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnnouncementsPanel;

