import React from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { Navigate } from 'react-router-dom';
import { Building } from 'lucide-react';
import { ResponsivePage, ResponsivePluginHero, LoadingState, EmptyState } from '../responsive';

const GovernmentPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const governmentPlugin = plugins.find(p => p.route_path === '/government');

  if (pluginsLoading) {
    return <LoadingState />;
  }

  if (!governmentPlugin || !governmentPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <ResponsivePage>
      <ResponsivePluginHero
        title="Government"
        subtitle="Town Government Services"
        emoji="🏛️"
      />

      <EmptyState
        icon={Building}
        title="Government Services"
        description="This system is part of the CivicLab Town Hub. Government services and information will be available here soon."
      />
    </ResponsivePage>
  );
};

export default GovernmentPlugin;
