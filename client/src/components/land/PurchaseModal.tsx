import React, { useState } from 'react';
import { LandParcel } from '../../types';
import { BIOME_CONFIG, formatCurrency, BIOME_ICONS, RISK_COLORS } from './BiomeConfig';
import { useAuth } from '../../contexts/AuthContext';
import { landApi } from '../../services/api';
import { X, ShoppingCart, AlertCircle, CheckCircle, MapPin, DollarSign, AlertTriangle } from 'lucide-react';

interface PurchaseModalProps {
  parcel: LandParcel;
  onClose: () => void;
  onSuccess: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ parcel, onClose, onSuccess }) => {
  const { account } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const biomeConfig = BIOME_CONFIG[parcel.biome_type];
  const biomeIcon = BIOME_ICONS[parcel.biome_type];
  const riskColors = RISK_COLORS[parcel.risk_level];
  const balance = Number(account?.balance) || 0;
  const price = Number(parcel.value) || 0;
  const canAfford = balance >= price;

  const handlePurchase = async () => {
    if (!canAfford) return;
    
    setLoading(true);
    setError('');
    
    try {
      await landApi.submitPurchaseRequest(parcel.id, price);
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit purchase request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div 
          className="p-6 text-white relative"
          style={{ backgroundColor: biomeConfig.color }}
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center space-x-4">
            <div className="text-5xl">{biomeIcon}</div>
            <div>
              <h2 className="text-2xl font-bold">{parcel.grid_code}</h2>
              <p className="text-white/80">{parcel.biome_type}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
              <p className="text-gray-600">
                Your purchase request has been submitted for teacher approval.
                You'll be notified once it's reviewed.
              </p>
            </div>
          ) : (
            <>
              {/* Price and Balance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Plot Price</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(price)}</p>
                </div>
                <div className={`rounded-xl p-4 ${canAfford ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="flex items-center space-x-2 text-gray-500 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Your Balance</span>
                  </div>
                  <p className={`text-2xl font-bold ${canAfford ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(balance)}
                  </p>
                </div>
              </div>

              {/* Location & Risk */}
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Row {parcel.row_index + 1}, Col {parcel.col_index + 1}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className={`h-4 w-4 ${riskColors.text}`} />
                  <span className={`px-2 py-0.5 rounded-full ${riskColors.bg} ${riskColors.text} font-medium capitalize`}>
                    {parcel.risk_level} risk
                  </span>
                </div>
              </div>

              {/* Pros & Cons Summary */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="font-medium text-green-800 mb-2">Advantages</p>
                  <ul className="space-y-1">
                    {biomeConfig.pros.slice(0, 2).map((pro, idx) => (
                      <li key={idx} className="text-green-700 text-xs">+ {pro}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="font-medium text-red-800 mb-2">Disadvantages</p>
                  <ul className="space-y-1">
                    {biomeConfig.cons.slice(0, 2).map((con, idx) => (
                      <li key={idx} className="text-red-700 text-xs">- {con}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {/* Warning if can't afford */}
              {!canAfford && (
                <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    You need {formatCurrency(price - balance)} more to purchase this plot.
                  </p>
                </div>
              )}

              {/* Info about approval */}
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                <p>
                  <strong>Note:</strong> Plot purchases require teacher approval. 
                  The purchase amount will be deducted from your balance once approved.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePurchase}
              disabled={!canAfford || loading}
              className={`flex-1 px-4 py-3 rounded-xl font-medium flex items-center justify-center space-x-2 transition-colors ${
                canAfford 
                  ? 'bg-primary-600 text-white hover:bg-primary-700' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <ShoppingCart className="h-5 w-5" />
              <span>{loading ? 'Submitting...' : 'Request Purchase'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseModal;

