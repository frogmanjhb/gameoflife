import React, { useState } from 'react';
import { Plugin } from '../../types';
import api from '../../services/api';
import { ToggleLeft, ToggleRight, Loader } from 'lucide-react';

interface PluginManagementProps {
  plugins: Plugin[];
  onUpdate: () => void;
}

const PluginManagement: React.FC<PluginManagementProps> = ({ plugins, onUpdate }) => {
  const [toggling, setToggling] = useState<number | null>(null);

  const handleToggle = async (pluginId: number) => {
    setToggling(pluginId);
    try {
      await api.put(`/plugins/${pluginId}/toggle`);
      onUpdate();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
      alert('Failed to toggle plugin. Please try again.');
    } finally {
      setToggling(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Plugin Management</h3>
        <p className="text-sm text-gray-500 mb-4">
          Enable or disable plugins for all towns. Changes affect all classes (6A, 6B, 6C).
        </p>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="divide-y divide-gray-200">
          {plugins.map((plugin) => (
            <div
              key={plugin.id}
              className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center text-xl">
                  {plugin.icon || '🔌'}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{plugin.name}</h4>
                  {plugin.description && (
                    <p className="text-sm text-gray-500 mt-1">{plugin.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">Route: {plugin.route_path}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span
                  className={`text-sm font-medium ${
                    plugin.enabled ? 'text-success-600' : 'text-gray-400'
                  }`}
                >
                  {plugin.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <button
                  onClick={() => handleToggle(plugin.id)}
                  disabled={toggling === plugin.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                    plugin.enabled ? 'bg-primary-600' : 'bg-gray-200'
                  } ${toggling === plugin.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {toggling === plugin.id ? (
                    <Loader className="h-4 w-4 text-white animate-spin absolute left-1" />
                  ) : (
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        plugin.enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PluginManagement;

