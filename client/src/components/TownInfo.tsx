import React from 'react';
import { TownSettings } from '../types';
import { Building2, User, Percent, Wallet, ToggleLeft, ToggleRight } from 'lucide-react';

interface TownInfoProps {
  town: TownSettings | null;
  readOnly?: boolean;
  showTreasury?: boolean; // Only teachers should see treasury
}

const TownInfo: React.FC<TownInfoProps> = ({ town, readOnly = true, showTreasury = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  if (!town) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">
          <Building2 className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No town information available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Building2 className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Town Information</h2>
        {!readOnly && (
          <span className="ml-auto text-xs text-gray-500">Class {town.class}</span>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Building2 className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Town Name</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{town.town_name}</p>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Mayor</span>
          </div>
          <p className="text-base text-gray-900">{town.mayor_name || 'TBD'}</p>
        </div>
        
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Percent className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-500">Tax Rate</span>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-base text-gray-900">{town.tax_rate}%</p>
            {town.tax_enabled !== undefined && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                town.tax_enabled 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {town.tax_enabled ? 'Active' : 'Disabled'}
              </span>
            )}
          </div>
        </div>

        {/* Treasury Info - Only shown to teachers */}
        {showTreasury && town.treasury_balance !== undefined && (
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-2 mb-1">
              <Wallet className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-500">Town Treasury</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(town.treasury_balance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Used for paying student salaries
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TownInfo;
