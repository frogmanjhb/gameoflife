import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Loader2, ArrowRight, Map, TrendingUp } from 'lucide-react';
import { landApi } from '../services/api';
import { MyPropertiesResponse } from '../types';
import { formatCurrency, BIOME_CONFIG, BIOME_ICONS, calculateCurrentValue } from './land/BiomeConfig';

const MyPropertyCard: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<MyPropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await landApi.getMyProperties();
      setProperties(response.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  // Calculate current values with 2% weekly interest
  // Note: useMemo must be called before any early returns to follow Rules of Hooks
  const { totalCurrentValue, totalAppreciation } = useMemo(() => {
    if (!properties || properties.total_count === 0) {
      return { totalCurrentValue: 0, totalAppreciation: 0 };
    }
    
    let currentValue = 0;
    let originalValue = 0;
    
    properties.parcels.forEach(parcel => {
      const original = Number(parcel.value);
      originalValue += original;
      if (parcel.purchased_at) {
        currentValue += calculateCurrentValue(original, parcel.purchased_at);
      } else {
        currentValue += original;
      }
    });
    
    return {
      totalCurrentValue: currentValue,
      totalAppreciation: currentValue - originalValue
    };
  }, [properties]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <MapPin className="h-5 w-5 text-primary-600" />
          <h3 className="font-semibold text-gray-900">My Properties</h3>
        </div>
        <p className="text-sm text-gray-500">Unable to load properties</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Map className="h-5 w-5" />
            <h3 className="font-semibold">My Properties</h3>
          </div>
          <button
            onClick={() => navigate('/land')}
            className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full flex items-center space-x-1 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {properties && properties.total_count === 0 ? (
          <div className="text-center py-4">
            <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-300" />
            <p className="text-sm text-gray-500">No properties owned yet</p>
            <button
              onClick={() => navigate('/land')}
              className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              Explore Land Registry →
            </button>
          </div>
        ) : properties && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs">Plots</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{properties.total_count}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center space-x-1 text-gray-500 mb-1">
                  <DollarSign className="h-3 w-3" />
                  <span className="text-xs">Current Value</span>
                </div>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalCurrentValue)}</p>
                {totalAppreciation > 0 && (
                  <div className="flex items-center justify-center space-x-1 mt-1">
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600">+{formatCurrency(totalAppreciation)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Properties */}
            <div className="space-y-2">
              <p className="text-xs text-gray-500 font-medium">Recent Purchases</p>
              {properties.parcels.slice(0, 3).map((parcel) => {
                const originalValue = Number(parcel.value);
                const currentValue = parcel.purchased_at 
                  ? calculateCurrentValue(originalValue, parcel.purchased_at)
                  : originalValue;
                const hasAppreciated = currentValue > originalValue;
                
                return (
                  <div 
                    key={parcel.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/land')}
                  >
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-8 h-8 rounded flex items-center justify-center text-sm"
                        style={{ backgroundColor: BIOME_CONFIG[parcel.biome_type].lightColor }}
                      >
                        {BIOME_ICONS[parcel.biome_type]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{parcel.grid_code}</p>
                        <p className="text-xs text-gray-500">{parcel.biome_type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(currentValue)}</p>
                      {hasAppreciated && (
                        <p className="text-xs text-emerald-500 flex items-center justify-end">
                          <TrendingUp className="h-2 w-2 mr-0.5" />
                          +{formatCurrency(currentValue - originalValue)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {properties.total_count > 3 && (
                <p className="text-xs text-center text-gray-400 pt-1">
                  +{properties.total_count - 3} more plots
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MyPropertyCard;

