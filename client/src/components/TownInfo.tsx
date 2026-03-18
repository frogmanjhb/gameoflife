import React, { useState } from 'react';
import { TownSettings, TaxEducationResponse } from '../types';
import { Building2, User, Percent, Wallet, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { treasuryApi } from '../services/api';

interface TownInfoProps {
  town: TownSettings | null;
  readOnly?: boolean;
  showTreasury?: boolean; // Only teachers should see treasury
}

const TownInfo: React.FC<TownInfoProps> = ({ town, readOnly = true, showTreasury = false }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
  };

  const { user } = useAuth();
  const [taxEducationOpen, setTaxEducationOpen] = useState(false);
  const [taxEducationLoading, setTaxEducationLoading] = useState(false);
  const [taxEducationError, setTaxEducationError] = useState('');
  const [taxEducation, setTaxEducation] = useState<TaxEducationResponse | null>(null);

  const handleOpenTaxEducation = async () => {
    if (taxEducationOpen) return;
    setTaxEducationOpen(true);

    // Load lazily on first open.
    if (taxEducation || taxEducationLoading) return;

    setTaxEducationLoading(true);
    setTaxEducationError('');
    try {
      const res = await treasuryApi.getTaxEducation();
      setTaxEducation(res.data);
    } catch (err: any) {
      setTaxEducationError(err.response?.data?.error || 'Failed to load tax details');
      setTaxEducation(null);
    } finally {
      setTaxEducationLoading(false);
    }
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
    <>
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
          {user?.role !== 'student' ? (
            <>
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
            </>
          ) : (
            <div className="mt-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-gray-500">Taxes</span>
              </div>
              <button
                type="button"
                onClick={handleOpenTaxEducation}
                className="btn-primary text-sm w-full"
              >
                How tax works
              </button>
            </div>
          )}
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
    
    {user?.role === 'student' && taxEducationOpen && (
      <div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        role="dialog"
        aria-modal="true"
        aria-label="How tax works"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) setTaxEducationOpen(false);
        }}
      >
        <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">How tax works</h3>
              <p className="text-sm text-gray-500">Progressive brackets applied to your job salary</p>
            </div>
            <button
              type="button"
              onClick={() => setTaxEducationOpen(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Close tax details"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {taxEducationError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {taxEducationError}
              </div>
            )}

            {taxEducationLoading && (
              <div className="flex items-center justify-center py-6">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
              </div>
            )}

            {taxEducation && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  {taxEducation.tax_enabled
                    ? 'Tax is deducted from salary using progressive brackets. Higher job levels earn higher gross salary, which may fall into higher tax brackets.'
                    : 'Tax is currently disabled in your town, so tax is not deducted from salaries in the game.'}
                </p>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-700">Level</th>
                        <th className="px-3 py-2 text-right text-gray-700">Gross</th>
                        <th className="px-3 py-2 text-right text-gray-700">Tax</th>
                        <th className="px-3 py-2 text-right text-gray-700">Net</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxEducation.levels.map((row, index) => (
                        <tr key={row.level} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td
                            className={`px-3 py-2 text-gray-900 font-medium ${
                              row.level === taxEducation.current_job_level ? 'text-primary-600' : ''
                            }`}
                          >
                            {row.level}
                            {row.level === taxEducation.current_job_level ? ' (current)' : ''}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(row.gross_salary)}</td>
                          <td className="px-3 py-2 text-right text-red-600">
                            {formatCurrency(row.tax_amount)} ({row.tax_rate}%)
                          </td>
                          <td className="px-3 py-2 text-right text-gray-900">{formatCurrency(row.net_salary)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-gray-500">
                  Numbers are calculated on the server using your job base salary and contract type, and then applying the progressive tax brackets.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default TownInfo;
