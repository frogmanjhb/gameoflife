import React, { useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';

interface CreateSchoolFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const CreateSchoolForm: React.FC<CreateSchoolFormProps> = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    settings: {
      classes: ['6A', '6B', '6C'],
      allowed_email_domains: [] as string[],
      enabled_plugins: [] as string[]
    }
  });
  const [emailDomain, setEmailDomain] = useState('');
  const [createFirstTeacher, setCreateFirstTeacher] = useState(false);
  const [teacherData, setTeacherData] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create school first
      const schoolResponse = await api.post('/admin/schools', formData);
      const schoolId = schoolResponse.data.school.id;

      // If user wants to create first teacher, do that now
      if (createFirstTeacher && teacherData.username && teacherData.password) {
        try {
          await api.post(`/admin/schools/${schoolId}/teachers`, teacherData);
        } catch (teacherErr: any) {
          // School was created, but teacher creation failed
          setError(`School created, but failed to create teacher: ${teacherErr.response?.data?.error || 'Unknown error'}`);
          setLoading(false);
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create school');
    } finally {
      setLoading(false);
    }
  };

  const addEmailDomain = () => {
    if (emailDomain && !emailDomain.startsWith('@')) {
      setError('Email domain must start with @');
      return;
    }
    if (emailDomain && !formData.settings.allowed_email_domains.includes(emailDomain)) {
      setFormData({
        ...formData,
        settings: {
          ...formData.settings,
          allowed_email_domains: [...formData.settings.allowed_email_domains, emailDomain]
        }
      });
      setEmailDomain('');
      setError('');
    }
  };

  const removeEmailDomain = (domain: string) => {
    setFormData({
      ...formData,
      settings: {
        ...formData.settings,
        allowed_email_domains: formData.settings.allowed_email_domains.filter(d => d !== domain)
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New School</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              School Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., St Peter's Boys Prep"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              School Code *
            </label>
            <input
              id="code"
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., stpeters"
            />
            <p className="mt-1 text-sm text-gray-500">Lowercase letters, numbers, and hyphens only</p>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="createFirstTeacher"
                checked={createFirstTeacher}
                onChange={(e) => setCreateFirstTeacher(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="createFirstTeacher" className="ml-2 block text-sm font-medium text-gray-700">
                Create first teacher for this school
              </label>
            </div>

            {createFirstTeacher && (
              <div className="ml-6 space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label htmlFor="teacher_username" className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Username *
                  </label>
                  <input
                    id="teacher_username"
                    type="text"
                    required={createFirstTeacher}
                    value={teacherData.username}
                    onChange={(e) => setTeacherData({ ...teacherData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="teacher1"
                  />
                </div>

                <div>
                  <label htmlFor="teacher_password" className="block text-sm font-medium text-gray-700 mb-2">
                    Teacher Password *
                  </label>
                  <input
                    id="teacher_password"
                    type="password"
                    required={createFirstTeacher}
                    value={teacherData.password}
                    onChange={(e) => setTeacherData({ ...teacherData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="teacher_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      id="teacher_first_name"
                      type="text"
                      value={teacherData.first_name}
                      onChange={(e) => setTeacherData({ ...teacherData, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="teacher_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      id="teacher_last_name"
                      type="text"
                      value={teacherData.last_name}
                      onChange={(e) => setTeacherData({ ...teacherData, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="teacher_email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="teacher_email"
                    type="email"
                    value={teacherData.email}
                    onChange={(e) => setTeacherData({ ...teacherData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="teacher@school.co.za"
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allowed Email Domains
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={emailDomain}
                onChange={(e) => setEmailDomain(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addEmailDomain())}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="@school.co.za"
              />
              <button
                type="button"
                onClick={addEmailDomain}
                className="btn-secondary"
              >
                Add
              </button>
            </div>
            {formData.settings.allowed_email_domains.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.settings.allowed_email_domains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => removeEmailDomain(domain)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSchoolForm;
