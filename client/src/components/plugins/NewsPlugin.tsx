import React from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { Newspaper } from 'lucide-react';

const NewsPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const newsPlugin = plugins.find(p => p.route_path === '/news');

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!newsPlugin || !newsPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📰</div>
          <div>
            <h1 className="text-2xl font-bold">Town News</h1>
            <p className="text-primary-100">Local News & Updates</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Newspaper className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Town News</h2>
        <p className="text-gray-600 mb-4">
          This system is part of the Game of Life Town Hub.
        </p>
        <p className="text-sm text-gray-500">
          Local news and updates will be available here soon.
        </p>
      </div>
    </div>
  );
};

export default NewsPlugin;

