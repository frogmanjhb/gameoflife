import React, { useState } from 'react';
import { TownSettings as TownSettingsType } from '../../types';
import { useTown } from '../../contexts/TownContext';
import api, { treasuryApi } from '../../services/api';
import { Save, Building2, ToggleLeft, ToggleRight, Wallet } from 'lucide-react';

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
        tax_rate: selectedTown.tax_rate,
        tax_enabled: selectedTown.tax_enabled
      });
    }
  }, [selectedTown]);

  const handleToggleTax = async () => {
    if (!selectedTown) return;
    
    setSaving(true);
    try {
      await treasuryApi.toggleTax(selectedTown.class, !selectedTown.tax_enabled);
      await refreshTown();
    } catch (error: any) {
      console.error('Failed to toggle tax:', error);
      alert(error.response?.data?.error || 'Failed to toggle tax');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

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

            {/* Tax Toggle */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Tax Collection
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    When enabled, progressive tax is deducted from salaries
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleToggleTax}
                  disabled={saving}
                  className="focus:outline-none"
                >
                  {selectedTown?.tax_enabled ? (
                    <ToggleRight className="h-10 w-10 text-green-600" />
                  ) : (
                    <ToggleLeft className="h-10 w-10 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Treasury Info */}
            {selectedTown && (
              <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
                <div className="flex items-center space-x-2 mb-2">
                  <Wallet className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800">Town Treasury</span>
                </div>
                <p className="text-2xl font-bold text-emerald-700">
                  {formatCurrency(selectedTown.treasury_balance || 10000000)}
                </p>
                <p className="text-xs text-emerald-600 mt-1">
                  Used for paying student salaries
                </p>
              </div>
            )}

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

