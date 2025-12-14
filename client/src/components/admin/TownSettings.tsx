import React, { useState } from 'react';
import { TownSettings as TownSettingsType } from '../../types';
import { useTown } from '../../contexts/TownContext';
import api from '../../services/api';
import { Save, Building2 } from 'lucide-react';

const TownSettings: React.FC = () => {
  const { allTowns, refreshTown } = useTown();
  const [selectedTownId, setSelectedTownId] = useState<number | null>(allTowns[0]?.id || null);
  const [formData, setFormData] = useState<Partial<TownSettingsType>>({});
  const [saving, setSaving] = useState(false);

  const selectedTown = allTowns.find(t => t.id === selectedTownId);

  React.useEffect(() => {
    if (selectedTown) {
      setFormData({
        town_name: selectedTown.town_name,
        mayor_name: selectedTown.mayor_name || '',
        tax_rate: selectedTown.tax_rate
      });
    }
  }, [selectedTown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTownId) return;

    setSaving(true);
    try {
      await api.put(`/town/settings/${selectedTownId}`, formData);
      await refreshTown();
      alert('Town settings updated successfully!');
    } catch (error: any) {
      console.error('Failed to update town settings:', error);
      alert(error.response?.data?.error || 'Failed to update town settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Town Settings</h3>
        <p className="text-sm text-gray-500 mt-1">Manage settings for each town</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Town
          </label>
          <select
            value={selectedTownId || ''}
            onChange={(e) => setSelectedTownId(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          >
            {allTowns.map((town) => (
              <option key={town.id} value={town.id}>
                {town.town_name} (Class {town.class})
              </option>
            ))}
          </select>
        </div>

        {selectedTown && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Town Name
              </label>
              <input
                type="text"
                value={formData.town_name || ''}
                onChange={(e) => setFormData({ ...formData, town_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mayor Name
              </label>
              <input
                type="text"
                value={formData.mayor_name || ''}
                onChange={(e) => setFormData({ ...formData, mayor_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter mayor name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.tax_rate || 0}
                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default TownSettings;

