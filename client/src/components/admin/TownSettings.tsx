import React, { useState, useEffect } from 'react';
import { TownSettings as TownSettingsType } from '../../types';
import { useTown } from '../../contexts/TownContext';
import api, { treasuryApi } from '../../services/api';
import { Save, ToggleLeft, ToggleRight, Wallet, AlertTriangle, Brain } from 'lucide-react';

const TownSettings: React.FC = () => {
  const { allTowns, refreshTown } = useTown();
  const [selectedTownId, setSelectedTownId] = useState<number | null>(allTowns[0]?.id || null);
  const [formData, setFormData] = useState<Partial<TownSettingsType>>({});
  const [saving, setSaving] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [resetting, setResetting] = useState(false);
  
  // Bank settings (global settings)
  const [bankSettings, setBankSettings] = useState<Record<string, string>>({});
  const [loadingBankSettings, setLoadingBankSettings] = useState(true);
  const [savingBankSettings, setSavingBankSettings] = useState(false);

  const selectedTown = allTowns.find(t => t.id === selectedTownId);

  // Fetch bank settings on mount
  useEffect(() => {
    const fetchBankSettings = async () => {
      try {
        const response = await api.get('/transactions/bank-settings');
        setBankSettings(response.data);
      } catch (error) {
        console.error('Failed to fetch bank settings:', error);
      } finally {
        setLoadingBankSettings(false);
      }
    };
    fetchBankSettings();
  }, []);

  useEffect(() => {
    if (selectedTown) {
      setFormData({
        town_name: selectedTown.town_name,
        mayor_name: selectedTown.mayor_name || '',
        tax_rate: selectedTown.tax_rate,
        tax_enabled: selectedTown.tax_enabled
      });
    }
  }, [selectedTown]);

  const updateBankSetting = async (key: string, value: string) => {
    setSavingBankSettings(true);
    try {
      await api.put(`/transactions/bank-settings/${key}`, { value });
      setBankSettings({ ...bankSettings, [key]: value });
    } catch (error: any) {
      console.error('Failed to update bank setting:', error);
      alert(error.response?.data?.error || 'Failed to update setting');
    } finally {
      setSavingBankSettings(false);
    }
  };

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

  const handleFactoryReset = async () => {
    if (resetConfirm !== 'RESET') {
      alert('Type RESET to confirm the factory reset.');
      return;
    }

    const ok = window.confirm(
      'This will DELETE ALL students, loans, tenders, land ownership, transactions, announcements, and reset treasury/settings for ALL towns.\n\nThis cannot be undone.\n\nClick OK to proceed.'
    );
    if (!ok) return;

    setResetting(true);
    try {
      await api.post('/admin/factory-reset', { confirm: 'RESET' });
      setResetConfirm('');
      await refreshTown();
      alert('Factory reset completed. You may need to refresh the page.');
      window.location.reload();
    } catch (error: any) {
      console.error('Factory reset failed:', error);
      alert(error.response?.data?.error || 'Factory reset failed');
    } finally {
      setResetting(false);
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

      {/* Math Game Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-purple-100">
            <Brain className="h-5 w-5 text-purple-700" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-gray-900">Math Game Settings</h4>
            <p className="text-sm text-gray-500 mt-1">
              Configure the math game settings for all students
            </p>
          </div>
        </div>

        {loadingBankSettings ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Daily Game Limit
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Number of math games each student can play per day (resets at 6 AM)
              </p>
              <div className="flex items-center space-x-3">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={bankSettings.math_game_daily_limit || '3'}
                  onChange={(e) => setBankSettings({ ...bankSettings, math_game_daily_limit: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-purple-500 focus:border-purple-500"
                />
                <span className="text-sm text-gray-600">games per day</span>
                <button
                  onClick={() => updateBankSetting('math_game_daily_limit', bankSettings.math_game_daily_limit || '3')}
                  disabled={savingBankSettings}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{savingBankSettings ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Set to 0 to disable math games entirely
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Factory Reset */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-start space-x-3">
          <div className="p-2 rounded-lg bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-700" />
          </div>
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-red-800">Factory Reset (Danger)</h4>
            <p className="text-sm text-red-700 mt-1">
              This resets the game to a clean state: deletes all students, loans, tenders, land ownership & requests,
              transactions, and announcements. It also resets town treasury/settings for ALL towns.
            </p>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="font-bold text-red-700">RESET</span> to confirm
                </label>
                <input
                  value={resetConfirm}
                  onChange={(e) => setResetConfirm(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                  placeholder="RESET"
                />
              </div>
              <button
                type="button"
                onClick={handleFactoryReset}
                disabled={resetting || resetConfirm !== 'RESET'}
                className="w-full px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {resetting ? 'Resetting...' : 'Factory Reset'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TownSettings;

