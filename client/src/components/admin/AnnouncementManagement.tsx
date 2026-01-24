import React, { useState, useEffect } from 'react';
import { Announcement } from '../../types';
import { useTown } from '../../contexts/TownContext';
import api from '../../services/api';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

interface AnnouncementManagementProps {
  announcements: Announcement[];
  onUpdate: () => void;
}

const AnnouncementManagement: React.FC<AnnouncementManagementProps> = ({ announcements, onUpdate }) => {
  const { currentTownClass, allTowns } = useTown();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    town_class: currentTownClass || '6A',
    post_to_all: false,
    background_color: 'blue' as 'blue' | 'green' | 'yellow' | 'red' | 'purple',
    enable_wiggle: false
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editing) {
      setFormData({
        title: editing.title,
        content: editing.content,
        town_class: editing.town_class,
        post_to_all: false,
        background_color: editing.background_color || 'blue',
        enable_wiggle: editing.enable_wiggle || false
      });
      setShowForm(true);
    }
  }, [editing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editing) {
        // When editing, we don't support posting to all classes
        await api.put(`/announcements/${editing.id}`, {
          title: formData.title,
          content: formData.content,
          town_class: formData.town_class,
          background_color: formData.background_color,
          enable_wiggle: formData.enable_wiggle
        });
      } else {
        // When creating new announcement
        if (formData.post_to_all) {
          // Post to all three classes
          const classes: ('6A' | '6B' | '6C')[] = ['6A', '6B', '6C'];
          await Promise.all(
            classes.map(cls =>
              api.post('/announcements', {
                title: formData.title,
                content: formData.content,
                town_class: cls,
                background_color: formData.background_color,
                enable_wiggle: formData.enable_wiggle
              })
            )
          );
        } else {
          // Post to single class
          await api.post('/announcements', {
            title: formData.title,
            content: formData.content,
            town_class: formData.town_class,
            background_color: formData.background_color,
            enable_wiggle: formData.enable_wiggle
          });
        }
      }
      setShowForm(false);
      setEditing(null);
      setFormData({ title: '', content: '', town_class: currentTownClass || '6A', post_to_all: false, background_color: 'blue', enable_wiggle: false });
      onUpdate();
    } catch (error: any) {
      console.error('Failed to save announcement:', error);
      alert(error.response?.data?.error || 'Failed to save announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      await api.delete(`/announcements/${id}`);
      onUpdate();
    } catch (error: any) {
      console.error('Failed to delete announcement:', error);
      alert(error.response?.data?.error || 'Failed to delete announcement');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Announcement Management</h3>
          <p className="text-sm text-gray-500 mt-1">Post and manage town announcements</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditing(null);
            setFormData({ title: '', content: '', town_class: currentTownClass || '6A', post_to_all: false, background_color: 'blue', enable_wiggle: false });
          }}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>New Announcement</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900">
              {editing ? 'Edit Announcement' : 'New Announcement'}
            </h4>
            <button
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setFormData({ title: '', content: '', town_class: currentTownClass || '6A', post_to_all: false, background_color: 'blue', enable_wiggle: false });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!editing && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.post_to_all}
                    onChange={(e) => setFormData({ ...formData, post_to_all: e.target.checked })}
                    className="mt-0.5 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">📢 Post to All Classes</span>
                    <p className="text-xs text-gray-600 mt-0.5">
                      This will create the same announcement for all three classes (6A, 6B, and 6C)
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {formData.post_to_all ? 'Target Classes' : 'Town'}
              </label>
              {formData.post_to_all ? (
                <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  <span className="font-medium">All Classes:</span> 6A Town, 6B Town, 6C Town
                </div>
              ) : (
                <select
                  value={formData.town_class}
                  onChange={(e) => setFormData({ ...formData, town_class: e.target.value as '6A' | '6B' | '6C' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                  required
                >
                  <option value="6A">6A Town</option>
                  <option value="6B">6B Town</option>
                  <option value="6C">6C Town</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="grid grid-cols-5 gap-3">
                {[
                  { value: 'blue', label: 'Blue', bgClass: 'bg-blue-500', hoverClass: 'hover:bg-blue-600' },
                  { value: 'green', label: 'Green', bgClass: 'bg-green-500', hoverClass: 'hover:bg-green-600' },
                  { value: 'yellow', label: 'Yellow', bgClass: 'bg-yellow-500', hoverClass: 'hover:bg-yellow-600' },
                  { value: 'red', label: 'Red', bgClass: 'bg-red-500', hoverClass: 'hover:bg-red-600' },
                  { value: 'purple', label: 'Purple', bgClass: 'bg-purple-500', hoverClass: 'hover:bg-purple-600' }
                ].map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, background_color: color.value as any })}
                    className={`relative p-4 rounded-lg transition-all ${color.bgClass} ${color.hoverClass} ${
                      formData.background_color === color.value
                        ? 'ring-4 ring-primary-600 ring-offset-2 scale-105'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {formData.background_color === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white rounded-full p-1">
                          <svg className="w-4 h-4 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                    <span className="text-xs font-medium text-white opacity-0">{color.label}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Selected: <span className="font-medium capitalize">{formData.background_color}</span>
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.enable_wiggle}
                  onChange={(e) => setFormData({ ...formData, enable_wiggle: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Enable wiggle animation</span>
                  <p className="text-xs text-gray-500">Adds a subtle wiggle effect for extra attention</p>
                </div>
              </label>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex-1"
              >
                {submitting ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                  setFormData({ title: '', content: '', town_class: currentTownClass || '6A', post_to_all: false, background_color: 'blue', enable_wiggle: false });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {announcements.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No announcements yet</p>
              <p className="text-sm mt-1">Create your first announcement above</p>
            </div>
          ) : (
            announcements.map((announcement) => (
              <div key={announcement.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{announcement.title}</h4>
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded-full text-xs font-medium">
                        {announcement.town_class}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{announcement.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Posted by {announcement.created_by_username}</span>
                      <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditing(announcement)}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagement;

