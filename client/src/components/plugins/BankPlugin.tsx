import React from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';

const BankPlugin: React.FC = () => {
  const { plugins } = usePlugins();
  const bankPlugin = plugins.find(p => p.route_path === '/bank');

  if (!bankPlugin || !bankPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🏦</div>
          <div>
            <h1 className="text-2xl font-bold">Bank</h1>
            <p className="text-primary-100">Financial Services System</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <Building2 className="h-16 w-16 mx-auto mb-4 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Banking System</h2>
        <p className="text-gray-600 mb-4">
          This system is part of the Game of Life Town Hub.
        </p>
        <p className="text-sm text-gray-500">
          Banking functionality will be available here soon.
        </p>
      </div>
    </div>
  );
};

export default BankPlugin;

