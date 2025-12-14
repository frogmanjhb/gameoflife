import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plugin } from '../types';
import api from '../services/api';

interface PluginContextType {
  plugins: Plugin[];
  enabledPlugins: Plugin[];
  loading: boolean;
  refreshPlugins: () => Promise<void>;
}

const PluginContext = createContext<PluginContextType | undefined>(undefined);

export const usePlugins = () => {
  const context = useContext(PluginContext);
  if (context === undefined) {
    throw new Error('usePlugins must be used within a PluginProvider');
  }
  return context;
};

interface PluginProviderProps {
  children: React.ReactNode;
}

export const PluginProvider: React.FC<PluginProviderProps> = ({ children }) => {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlugins = async () => {
    try {
      const response = await api.get('/plugins');
      setPlugins(response.data);
    } catch (error) {
      console.error('Failed to fetch plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const enabledPlugins = plugins.filter(p => p.enabled);

  const value: PluginContextType = {
    plugins,
    enabledPlugins,
    loading,
    refreshPlugins: fetchPlugins
  };

  return (
    <PluginContext.Provider value={value}>
      {children}
    </PluginContext.Provider>
  );
};

