import React, { useState, useEffect } from 'react';
import { usePlugins } from '../../contexts/PluginContext';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { AlertTriangle, CloudLightning, Flame, Bug, Waves, Wind, Snowflake, Zap, History, Users } from 'lucide-react';
import api from '../../services/api';

interface Disaster {
  id: number;
  name: string;
  description?: string;
  icon: string;
  effect_type: string;
  effect_value: number;
  is_active: boolean;
  affects_all_classes: boolean;
  target_class?: string;
  created_at: string;
}

interface DisasterEvent {
  id: number;
  disaster_id: number;
  disaster_name?: string;
  disaster_icon?: string;
  triggered_by: number;
  triggered_by_username?: string;
  target_class?: string;
  affected_students: number;
  total_impact: number;
  notes?: string;
  triggered_at: string;
}

const DisastersPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const { user } = useAuth();
  const disastersPlugin = plugins.find(p => p.route_path === '/disasters');
  
  const [disasters, setDisasters] = useState<Disaster[]>([]);
  const [recentEvents, setRecentEvents] = useState<DisasterEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDisasters();
  }, []);

  const fetchDisasters = async () => {
    try {
      setLoading(true);
      const [disastersRes, eventsRes] = await Promise.all([
        api.get('/disasters'),
        api.get('/disasters/events/recent')
      ]);

      setDisasters(disastersRes.data || []);
      setRecentEvents(eventsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch disasters:', error);
      // Set empty arrays on error - disasters may not be set up yet
      setDisasters([]);
      setRecentEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const getEffectDescription = (disaster: Disaster) => {
    const value = disaster.effect_value;
    switch (disaster.effect_type) {
      case 'balance_percentage':
        return value < 0 ? `Reduces balance by ${Math.abs(value)}%` : `Increases balance by ${value}%`;
      case 'balance_fixed':
        return value < 0 ? `Reduces balance by R${Math.abs(value).toFixed(2)}` : `Increases balance by R${value.toFixed(2)}`;
      case 'salary_percentage':
        return value < 0 ? `Reduces next salary by ${Math.abs(value)}%` : `Increases next salary by ${value}%`;
      default:
        return `Effect: ${value}`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Wait for plugins to load before checking
  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!disastersPlugin || !disastersPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-orange-500 to-yellow-500 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">🌪️</div>
          <div>
            <h1 className="text-2xl font-bold">Disasters</h1>
            <p className="text-red-100">Natural and economic events affecting all citizens</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Active Disasters Warning */}
          {disasters.some(d => d.is_active) && (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-red-900 text-lg">Active Disasters!</h3>
                  <p className="text-red-700 mb-4">The following disasters are currently affecting citizens:</p>
                  <div className="space-y-2">
                    {disasters.filter(d => d.is_active).map(disaster => (
                      <div key={disaster.id} className="bg-red-100 rounded-lg p-3 flex items-center gap-3">
                        <span className="text-2xl">{disaster.icon}</span>
                        <div>
                          <div className="font-semibold text-red-900">{disaster.name}</div>
                          <div className="text-sm text-red-700">{getEffectDescription(disaster)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Possible Disasters Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <CloudLightning className="h-6 w-6 text-yellow-500" />
              Possible Disasters
            </h2>
            
            {disasters.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🌤️</div>
                <p className="text-gray-500 text-lg">No disasters have been configured yet.</p>
                <p className="text-gray-400 mt-2">The skies are clear... for now.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disasters.map(disaster => (
                  <div
                    key={disaster.id}
                    className={`rounded-xl border-2 p-4 transition-all ${
                      disaster.is_active
                        ? 'border-red-400 bg-red-50 shadow-lg'
                        : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-3xl">{disaster.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{disaster.name}</h3>
                          {disaster.is_active && (
                            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        {disaster.description && (
                          <p className="text-sm text-gray-600 mt-1">{disaster.description}</p>
                        )}
                        <div className="mt-2 text-sm">
                          <span className={`font-medium ${disaster.effect_value < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {getEffectDescription(disaster)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {disaster.affects_all_classes ? (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" /> Affects all classes
                            </span>
                          ) : (
                            <span>Targets: Class {disaster.target_class}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Disaster Events */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <History className="h-6 w-6 text-gray-500" />
              Recent Disaster Events
            </h2>
            
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📜</div>
                <p className="text-gray-500">No disasters have occurred yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span className="text-2xl">{event.disaster_icon || '🌪️'}</span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {event.disaster_name || 'Unknown Disaster'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {event.target_class ? `Class ${event.target_class}` : 'All Classes'} • 
                        {event.affected_students} student{event.affected_students !== 1 ? 's' : ''} affected
                      </div>
                      {event.notes && (
                        <div className="text-sm text-gray-500 mt-1 italic">"{event.notes}"</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">
                        R{Math.abs(event.total_impact).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-gray-500">{formatDate(event.triggered_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-3xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">About Disasters</h3>
                <ul className="text-sm text-amber-800 space-y-1">
                  <li>• Disasters are events that can affect all students in a town</li>
                  <li>• They may reduce bank balances, affect salaries, or have other economic impacts</li>
                  <li>• Teachers can trigger disasters at any time</li>
                  <li>• Some disasters may target specific classes while others affect everyone</li>
                  <li>• Keep an eye on the weather forecast... and your savings!</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DisastersPlugin;
