import React from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { Zap } from 'lucide-react';

/**
 * Doubles Day is a teacher-only toggle plugin. When enabled, chore (math game) points
 * and pizza time donations are doubled. This component shows an info view for students
 * when the plugin is enabled (tile is visible) and a redirect when disabled.
 */
const DoublesDayPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const doublesDayPlugin = plugins.find((p) => p.route_path === '/doubles-day');

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!doublesDayPlugin || !doublesDayPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">2️⃣</div>
          <div>
            <h1 className="text-2xl font-bold">Doubles Day</h1>
            <p className="text-amber-100">Today your chores and pizza donations count double!</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <Zap className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">What’s doubled</h2>
            <p className="text-sm text-gray-500">When Doubles Day is on, you earn and give more.</p>
          </div>
        </div>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">2×</span>
            Chore (math game) earnings
          </li>
          <li className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">2×</span>
            Pizza Time donations to the class fund (you still pay the same amount)
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DoublesDayPlugin;
